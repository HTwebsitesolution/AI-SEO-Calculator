from cachetools import TTLCache
cache = TTLCache(maxsize=1000, ttl=900)



from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from bs4 import BeautifulSoup
import httpx, socket, ipaddress, re, os

NETLIFY_ORIGIN = os.getenv("NETLIFY_ORIGIN", "https://ai-seo-calculator.netlify.app")
USER_AGENT     = "AI-SEO-Calculator/1.0 (+https://ai-seo-calculator.netlify.app)"

app = FastAPI()

@app.get("/")
def root():
    return JSONResponse({"ok": True, "service": "ai-seo-api"})
app.add_middleware(
    CORSMiddleware,
    allow_origins=[NETLIFY_ORIGIN],   # be explicit, not "*"
    allow_methods=["GET","POST","OPTIONS"],
    allow_headers=["*"],
)

# ---- basic SSRF guard: block private IPs/localhost
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

class AnalyzeOut(BaseModel):
    ok: bool
    status: int
    title: str
    meta_description: str
    h1: list[str]
    canonical: str | None = None

@app.get("/api/health")
def health(): return {"ok": True}

@app.get("/api/analyze", response_model=AnalyzeOut)
async def analyze(url: HttpUrl):
    if url in cache:
        return cache[url]
    host = re.sub(r"^https?://", "", str(url)).split("/")[0]
    _resolve_and_block(host)
    headers = {"User-Agent": USER_AGENT}
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=headers) as client:
            async with client.stream("GET", str(url)) as r:
                try:
                    r.raise_for_status()
                except httpx.HTTPStatusError:
                    raise HTTPException(status_code=502, detail=f"Fetch failed: {r.status_code}")
                limit = 2_500_000
                buf = bytearray()
                async for chunk in r.aiter_bytes():
                    buf += chunk
                    if len(buf) > limit:
                        raise HTTPException(status_code=504, detail="Response too large (limit 2.5MB)")
                html = buf.decode(r.encoding or "utf-8", errors="replace")
            # SSRF check after redirects
            _resolve_and_block(r.url.host)
        soup = BeautifulSoup(html, "html.parser")
        title = (soup.title.string or "").strip() if soup.title and soup.title.string else ""
        desc  = (soup.find("meta", attrs={"name":"description"}) or {}).get("content","")
        h1    = [h.get_text(strip=True) for h in soup.find_all("h1")]
        can   = soup.find("link", rel=lambda v: v and "canonical" in v.lower())
        res = AnalyzeOut(ok=True, status=200, title=title, meta_description=desc, h1=h1,
                        canonical=(can.get("href") if can else None))
        cache[url] = res
        return res
    except httpx.RequestError as e:
        raise HTTPException(status_code=504, detail=f"Timeout or network error: {e}")
