
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

def _validate_url(u: str):
    p = urlparse(u)
    if p.scheme not in ("http", "https") or not p.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL")

@app.get("/api/analyze")
async def analyze(url: str):
    _validate_url(url)
    headers = {"User-Agent": "AI-SEO-Calculator/1.0"}
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
            r = await client.get(url)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Fetch failed: {r.status_code}")
        soup = BeautifulSoup(r.text, "html.parser")
        title = (soup.title.string or "").strip() if soup.title else ""
        desc = (soup.find("meta", attrs={"name": "description"}) or {}).get("content", "")
        h1 = [h.get_text(strip=True) for h in soup.find_all("h1")]
        return {"ok": True, "title": title, "meta_description": desc, "h1": h1, "status": r.status_code}
    except httpx.RequestError as e:
        raise HTTPException(status_code=504, detail=f"Timeout or network error: {e}")
