from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from bs4 import BeautifulSoup
import httpx, socket, ipaddress, re, os, json
from urllib.parse import urljoin
from cachetools import TTLCache

# --- std/3p imports -------------------------------------------------------
app = FastAPI()

NETLIFY_ORIGIN = os.getenv("NETLIFY_ORIGIN", "https://ai-seo-calculator.netlify.app")
USER_AGENT     = "AI-SEO-Calculator/1.0 (+https://ai-seo-calculator.netlify.app)"

cache = TTLCache(maxsize=1000, ttl=900)

# --- Paste-HTML analysis ----------------------------------------------------
from pydantic import BaseModel
import json, re

class AnalyzeHtmlIn(BaseModel):
    url: str | None = None
    html: str

def _score_and_recos_onpage(payload: dict) -> tuple[int, list[str]]:
    """Simple, transparent scoring with actionable recos."""
    score = 100
    recos = []

    tlen = payload.get("title_length", 0)
    dlen = payload.get("meta_description_length", 0)
    h1s  = payload.get("h1", [])
    multi_h1 = payload.get("multiple_h1", False)
    canonical = payload.get("canonical")
    noindex = payload.get("noindex", False)
    nofollow = payload.get("nofollow", False)
    viewport = payload.get("viewport", False)
    ogc = payload.get("og_count", 0)
    twc = payload.get("twitter_count", 0)
    jsonld = payload.get("jsonld_count", 0)
    status = int(payload.get("status", 200))

    # Title
    if tlen == 0: score -= 15; recos.append("Add a descriptive <title> (30–60 chars).")
    elif tlen < 30: score -= 8; recos.append("Title is short; target 30–60 chars.")
    elif tlen > 60: score -= 5; recos.append("Title is long; trim toward 60 chars.")

    # Meta description
    if dlen == 0: score -= 12; recos.append("Add a meta description (70–160 chars).")
    elif dlen < 70: score -= 6; recos.append("Meta description is short; expand toward 70–160 chars.")
    elif dlen > 160: score -= 6; recos.append("Meta description is long; trim toward 160 chars.")

    # H1
    if multi_h1: score -= 6; recos.append("Multiple H1s detected; keep a single primary H1.")
    elif len(h1s) == 0: score -= 10; recos.append("Add an H1 heading that matches page intent.")

    # Canonical
    if not canonical: score -= 6; recos.append("Add a canonical link to prevent duplicate content issues.")

    # Robots
    if noindex: score -= 40; recos.append("robots meta contains 'noindex'; page won’t be indexed.")
    if nofollow: score -= 8;  recos.append("robots meta contains 'nofollow'; link equity may be lost.")

    # Mobile
    if not viewport: score -= 6; recos.append("Add a responsive viewport meta tag for mobile.")

    # Social preview
    if ogc == 0: score -= 4; recos.append("Add Open Graph tags for better social shares.")
    if twc == 0: score -= 2; recos.append("Add Twitter Card tags for richer shares.")

    # Structured data
    if jsonld == 0: score -= 4; recos.append("Add JSON-LD structured data relevant to the page.")

    # HTTP status
    if status != 200: score -= 10; recos.append(f"HTTP status is {status}; aim for 200 on the canonical URL.")

    return max(0, min(100, score)), recos

def _analyze_html_core(html: str, base_url: str | None = None) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    title = (soup.title.string or "").strip() if soup.title and soup.title.string else ""
    desc  = (soup.find("meta", attrs={"name":"description"}) or {}).get("content","") or ""
    h1s   = [h.get_text(strip=True) for h in soup.find_all("h1")]
    can   = soup.find("link", rel=lambda v: v and "canonical" in v.lower())
    canonical = can.get("href") if can else None
    if canonical and base_url:
        canonical = urljoin(base_url, canonical)

    robots_tag = soup.find("meta", attrs={"name": lambda v: v and v.lower() in ("robots","googlebot")})
    robots = (robots_tag.get("content") or "").lower() if robots_tag else ""
    noindex = "noindex" in robots
    nofollow = "nofollow" in robots

    viewport = bool(soup.find("meta", attrs={"name":"viewport"}))
    og_count = len(soup.find_all(attrs={"property": re.compile(r"^og:", re.I)}))
    twitter_count = len(soup.find_all(attrs={"name": re.compile(r"^twitter:", re.I)}))

    jsonld_nodes = soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)})
    jsonld_types = []
    for node in jsonld_nodes:
        try:
            data = json.loads(node.string or "{}")
            if isinstance(data, list):
                for d in data:
                    t = d.get("@type") if isinstance(d, dict) else None
                    if isinstance(t, list): jsonld_types += [str(x) for x in t]
                    elif t: jsonld_types.append(str(t))
            elif isinstance(data, dict):
                t = data.get("@type")
                if isinstance(t, list): jsonld_types += [str(x) for x in t]
                elif t: jsonld_types.append(str(t))
        except Exception:
            pass

    # word count (simple, no new deps)
    text_words = len((soup.get_text(" ", strip=True) or "").split())

    payload = {
        "ok": True,
        "status": 200,                       # HTML came from user, not fetched
        "final_url": base_url or None,

        "title": title,
        "title_length": len(title),
        "meta_description": desc,
        "meta_description_length": len(desc),
        "h1": h1s,
        "multiple_h1": len(h1s) > 1,
        "canonical": canonical,

        "robots": robots or None,
        "noindex": noindex,
        "nofollow": nofollow,
        "viewport": viewport,
        "og_count": og_count,
        "twitter_count": twitter_count,
        "jsonld_count": len(jsonld_nodes),
        "jsonld_types": jsonld_types,

        "text_words": text_words,
        "score": 0,
        "recommendations": [],
    }

    score, recos = _score_and_recos_onpage(payload)
    payload["score"] = score
    payload["recommendations"] = recos
    return payload

@app.post("/api/analyze_html")
def analyze_html(body: AnalyzeHtmlIn):
    """
    Fallback when remote fetch fails or user prefers privacy.
    Returns the same shape as /api/analyze so the UI can render identically.
    """
    html = (body.html or "").strip()
    if not html:
        raise HTTPException(status_code=400, detail="Missing HTML.")
    data = _analyze_html_core(html, base_url=(body.url or None))
    return JSONResponse(content=data)
# --- caching ---------------------------------------------------------------
from cachetools import TTLCache
cache = TTLCache(maxsize=1000, ttl=900)

# --- std/3p imports -------------------------------------------------------
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from bs4 import BeautifulSoup
import httpx, socket, ipaddress, re, os, json


NETLIFY_ORIGIN = os.getenv("NETLIFY_ORIGIN", "https://ai-seo-calculator.netlify.app")
USER_AGENT     = "AI-SEO-Calculator/1.0 (+https://ai-seo-calculator.netlify.app)"

app = FastAPI()

# --- Paste-HTML analysis ----------------------------------------------------
from urllib.parse import urljoin
import json, re

class AnalyzeHtmlIn(BaseModel):
    url: str | None = None
    html: str

def _score_and_recos_onpage(payload: dict) -> tuple[int, list[str]]:
    score = 100
    recos = []
    tlen = payload.get("title_length", 0)
    dlen = payload.get("meta_description_length", 0)
    h1s  = payload.get("h1", [])
    multi_h1 = payload.get("multiple_h1", False)
    canonical = payload.get("canonical")
    noindex = payload.get("noindex", False)
    nofollow = payload.get("nofollow", False)
    viewport = payload.get("viewport", False)
    ogc = payload.get("og_count", 0)
    twc = payload.get("twitter_count", 0)
    jsonld = payload.get("jsonld_count", 0)
    status = int(payload.get("status", 200))
    if tlen == 0: score -= 15; recos.append("Add a descriptive <title> (30–60 chars).")
    elif tlen < 30: score -= 8; recos.append("Title is short; target 30–60 chars.")
    elif tlen > 60: score -= 5; recos.append("Title is long; trim toward 60 chars.")
    if dlen == 0: score -= 12; recos.append("Add a meta description (70–160 chars).")
    elif dlen < 70: score -= 6; recos.append("Meta description is short; expand toward 70–160 chars.")
    elif dlen > 160: score -= 6; recos.append("Meta description is long; trim toward 160 chars.")
    if multi_h1: score -= 6; recos.append("Multiple H1s detected; keep a single primary H1.")
    elif len(h1s) == 0: score -= 10; recos.append("Add an H1 heading that matches page intent.")
    if not canonical: score -= 6; recos.append("Add a canonical link to prevent duplicate content issues.")
    if noindex: score -= 40; recos.append("robots meta contains 'noindex'; page won’t be indexed.")
    if nofollow: score -= 8;  recos.append("robots meta contains 'nofollow'; link equity may be lost.")
    if not viewport: score -= 6; recos.append("Add a responsive viewport meta tag for mobile.")
    if ogc == 0: score -= 4; recos.append("Add Open Graph tags for better social shares.")
    if twc == 0: score -= 2; recos.append("Add Twitter Card tags for richer shares.")
    if jsonld == 0: score -= 4; recos.append("Add JSON-LD structured data relevant to the page.")
    if status != 200: score -= 10; recos.append(f"HTTP status is {status}; aim for 200 on the canonical URL.")
    return max(0, min(100, score)), recos

def _analyze_html_core(html: str, base_url: str | None = None) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    title = (soup.title.string or "").strip() if soup.title and soup.title.string else ""
    desc  = (soup.find("meta", attrs={"name":"description"}) or {}).get("content","") or ""
    h1s   = [h.get_text(strip=True) for h in soup.find_all("h1")]
    can   = soup.find("link", rel=lambda v: v and "canonical" in v.lower())
    canonical = can.get("href") if can else None
    if canonical and base_url:
        canonical = urljoin(base_url, canonical)
    robots_tag = soup.find("meta", attrs={"name": lambda v: v and v.lower() in ("robots","googlebot")})
    robots = (robots_tag.get("content") or "").lower() if robots_tag else ""
    noindex = "noindex" in robots
    nofollow = "nofollow" in robots
    viewport = bool(soup.find("meta", attrs={"name":"viewport"}))
    og_count = len(soup.find_all(attrs={"property": re.compile(r"^og:", re.I)}))
    twitter_count = len(soup.find_all(attrs={"name": re.compile(r"^twitter:", re.I)}))
    jsonld_nodes = soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)})
    jsonld_types = []
    for node in jsonld_nodes:
        try:
            data = json.loads(node.string or "{}")
            if isinstance(data, list):
                for d in data:
                    t = d.get("@type") if isinstance(d, dict) else None
                    if isinstance(t, list): jsonld_types += [str(x) for x in t]
                    elif t: jsonld_types.append(str(t))
            elif isinstance(data, dict):
                t = data.get("@type")
                if isinstance(t, list): jsonld_types += [str(x) for x in t]
                elif t: jsonld_types.append(str(t))
        except Exception:
            pass
    text_words = len((soup.get_text(" ", strip=True) or "").split())
    payload = {
        "ok": True,
        "status": 200,
        "final_url": base_url or None,
        "title": title,
        "title_length": len(title),
        "meta_description": desc,
        "meta_description_length": len(desc),
        "h1": h1s,
        "multiple_h1": len(h1s) > 1,
        "canonical": canonical,
        "robots": robots or None,
        "noindex": noindex,
        "nofollow": nofollow,
        "viewport": viewport,
        "og_count": og_count,
        "twitter_count": twitter_count,
        "jsonld_count": len(jsonld_nodes),
        "jsonld_types": jsonld_types,
        "text_words": text_words,
        "score": 0,
        "recommendations": [],
    }
    score, recos = _score_and_recos_onpage(payload)
    payload["score"] = score
    payload["recommendations"] = recos
    return payload

@app.post("/api/analyze_html")
def analyze_html(body: AnalyzeHtmlIn):
    html = (body.html or "").strip()
    if not html:
        raise HTTPException(status_code=400, detail="Missing HTML.")
    data = _analyze_html_core(html, base_url=(body.url or None))
    return JSONResponse(content=data)

# ---- basic SSRF guard: block private IPs/localhost ------------------------
_PRIVATE = (
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
)

def _resolve_and_block(host: str):
    try:
        infos = socket.getaddrinfo(host, None)
        for fam, *_ , sockaddr in infos:
            ip = ipaddress.ip_address(sockaddr[0] if fam == socket.AF_INET else sockaddr[0])
            if any(ip in net for net in _PRIVATE):
                raise HTTPException(status_code=400, detail="Private IPs not allowed")
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Host cannot be resolved")

# ---- output model ---------------------------------------------------------
class AnalyzeOut(BaseModel):
    ok: bool
    status: int
    final_url: str | None = None

    # core basics
    title: str
    title_length: int
    meta_description: str
    meta_description_length: int
    h1: list[str]
    multiple_h1: bool
    canonical: str | None = None

    # extras
    robots: str | None = None
    noindex: bool
    nofollow: bool
    viewport: bool
    og_count: int
    twitter_count: int
    jsonld_count: int
    jsonld_types: list[str]

    # evaluation
    score: int
    recommendations: list[str]

@app.get("/api/health")
def health(): 
    return {"ok": True}

# ---- scoring heuristics ---------------------------------------------------
def _score_and_recos(payload: dict) -> tuple[int, list[str]]:
    score = 100
    recos: list[str] = []
    tlen = payload["title_length"]
    dlen = payload["meta_description_length"]

    # Title
    if tlen == 0:
        score -= 15; recos.append("Add a concise, descriptive <title> (30–60 characters).")
    elif tlen < 30:
        score -= 8;  recos.append("Title is short; target 30–60 characters.")
    elif tlen > 60:
        score -= 5;  recos.append("Title is long; consider trimming to 60 characters or fewer.")

    # Meta description
    if dlen == 0:
        score -= 12; recos.append("Add a meta description (70–160 characters).")
    elif dlen < 70:
        score -= 6;  recos.append("Meta description is short; expand toward 70–160 characters.")
    elif dlen > 160:
        score -= 6;  recos.append("Meta description is long; trim toward 160 characters.")

    # H1
    if payload["multiple_h1"]:
        score -= 6;  recos.append("Multiple H1s detected; keep a single primary H1.")
    elif len(payload["h1"]) == 0:
        score -= 10; recos.append("Add an H1 heading that matches page intent.")

    # Canonical
    if not payload["canonical"]:
        score -= 6;  recos.append("Add a canonical link to prevent duplicate content issues.")

    # Robots
    if payload["noindex"]:
        score -= 40; recos.append("robots meta contains 'noindex'; page will not be indexed.")
    if payload["nofollow"]:
        score -= 8;  recos.append("robots meta contains 'nofollow'; internal linking equity may be lost.")

    # Mobile
    if not payload["viewport"]:
        score -= 6;  recos.append("Add a responsive viewport meta tag for mobile friendliness.")

    # Social preview
    if payload["og_count"] == 0:
        score -= 4;  recos.append("Add Open Graph tags for better social sharing previews.")
    if payload["twitter_count"] == 0:
        score -= 2;  recos.append("Add Twitter Card tags for richer shares on X/Twitter.")

    # Structured data
    if payload["jsonld_count"] == 0:
        score -= 4;  recos.append("Add JSON-LD structured data relevant to the page content.")

    # Status
    if payload["status"] != 200:
        score -= 10; recos.append(f"HTTP status is {payload['status']}; aim for 200 on canonical URL.")

    return max(0, min(100, score)), recos

# ---- main analyzer --------------------------------------------------------
@app.get("/api/analyze", response_model=AnalyzeOut)
async def analyze(url: HttpUrl, response: Response):
    key_in = str(url).rstrip("/")
    if key_in in cache:
        # honor client/proxy cache on hits too
        response.headers["Cache-Control"] = "public, max-age=900"
        return cache[key_in]

    # Pre-fetch SSRF guard on requested host
    host = re.sub(r"^https?://", "", str(url)).split("/")[0]
    _resolve_and_block(host)

    headers = {"User-Agent": USER_AGENT}
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=60)

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(15.0),
            follow_redirects=True,
            headers=headers,
            http2=True,
            limits=limits,
        ) as client:
            async with client.stream("GET", str(url)) as r:
                try:
                    r.raise_for_status()
                except httpx.HTTPStatusError:
                    raise HTTPException(status_code=r.status_code, detail="Upstream error")

                # Post-redirect SSRF check on final host
                _resolve_and_block(r.url.host)

                # Bail on non-HTML
                ct = (r.headers.get("content-type") or "").lower()
                if ct and "html" not in ct:
                    raise HTTPException(status_code=415, detail=f"Non-HTML content-type: {ct}")

                # Stream with size cap
                limit = 2_500_000
                buf = bytearray()
                async for chunk in r.aiter_bytes():
                    buf += chunk
                    if len(buf) > limit:
                        raise HTTPException(status_code=504, detail="Response too large (2.5MB limit)")
                html = buf.decode(r.encoding or "utf-8", errors="replace")

        soup = BeautifulSoup(html, "html.parser")

        # basics
        title = (soup.title.string or "").strip() if soup.title and soup.title.string else ""
        desc  = (soup.find("meta", attrs={"name":"description"}) or {}).get("content","") or ""
        h1s   = [h.get_text(strip=True) for h in soup.find_all("h1")]
        can   = soup.find("link", rel=lambda v: v and "canonical" in v.lower())
        canonical = can.get("href") if can else None

        # robots meta (robots or googlebot)
        robots_tag   = soup.find("meta", attrs={"name": lambda v: v and v.lower() in ("robots","googlebot")})
        robots       = (robots_tag.get("content") or "").lower() if robots_tag else ""
        noindex      = "noindex" in robots
        nofollow     = "nofollow" in robots

        # viewport
        viewport = bool(soup.find("meta", attrs={"name":"viewport"}))

        # social tags
        og_count      = len(soup.find_all(attrs={"property": re.compile(r"^og:", re.I)}))
        twitter_count = len(soup.find_all(attrs={"name": re.compile(r"^twitter:", re.I)}))

        # JSON-LD
        jsonld_nodes = soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)})
        jsonld_count = 0
        jsonld_types: list[str] = []
        for node in jsonld_nodes:
            try:
                data = json.loads(node.string or "{}")
                jsonld_count += 1
                if isinstance(data, list):
                    for d in data:
                        t = d.get("@type") if isinstance(d, dict) else None
                        if isinstance(t, list): jsonld_types += [str(x) for x in t]
                        elif t: jsonld_types.append(str(t))
                elif isinstance(data, dict):
                    t = data.get("@type")
                    if isinstance(t, list): jsonld_types += [str(x) for x in t]
                    elif t: jsonld_types.append(str(t))
            except Exception:
                # ignore malformed blocks
                continue

        # build payload for scoring
        payload = {
            "ok": True,
            "status": int(r.status_code),
            "final_url": str(r.url),
            "title": title,
            "title_length": len(title),
            "meta_description": desc,
            "meta_description_length": len(desc),
            "h1": h1s,
            "multiple_h1": len(h1s) > 1,
            "canonical": canonical,
            "robots": robots or None,
            "noindex": noindex,
            "nofollow": nofollow,
            "viewport": viewport,
            "og_count": og_count,
            "twitter_count": twitter_count,
            "jsonld_count": jsonld_count,
            "jsonld_types": jsonld_types,
            "score": 0,                 # temp, replaced below
            "recommendations": [],      # temp, replaced below
        }

        score, recos = _score_and_recos(payload)
        payload["score"] = score
        payload["recommendations"] = recos

        # cache by input and final URLs
        key_final = str(r.url).rstrip("/")
        cache[key_in] = payload
        cache[key_final] = payload

        # help client/proxies reuse
        response.headers["Cache-Control"] = "public, max-age=900"
        return payload

    except httpx.RequestError as e:
        raise HTTPException(status_code=504, detail=f"Timeout or network error: {e}")
