// scripts.js
document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('seo-form');
  const input     = document.getElementById('url');
  const pasteForm = document.getElementById('paste-html-form');
  const textarea  = document.getElementById('htmlTextarea');

  const statusEl  = document.getElementById('analysis-status');
  const statusTxt = document.getElementById('analysis-text');
  const results   = document.getElementById('results');
  const suggestBlock = document.getElementById('suggest-block');
  const genSuggestBtn = document.getElementById('genSuggest');
  const suggestResults = document.getElementById('suggestResults');
  const suggestTitle = document.getElementById('suggestTitle');
  const suggestMeta = document.getElementById('suggestMeta');
  const copyTitleBtn = document.getElementById('copyTitle');
  const copyMetaBtn = document.getElementById('copyMeta');

  // Warm the backend (reduces first-hit lag)
  fetch('/api/health').catch(()=>{});

  const show = el => el.classList.remove('hidden');
  const hide = el => el.classList.add('hidden');
  let timers = [];
  function startUI(){
    statusTxt.textContent = 'Analyzing your website…';
    show(statusEl);
    timers = [
      setTimeout(()=> statusTxt.textContent = 'Warming the analysis engine…', 900),
      setTimeout(()=> statusTxt.textContent = 'Fetching and parsing HTML…', 2500),
      setTimeout(()=> statusTxt.textContent = 'Still working… some sites are slow.', 5000),
      setTimeout(()=> statusTxt.textContent = 'Almost there… compiling your summary.', 8000),
    ];
  }
  function stopUI(){ timers.forEach(clearTimeout); timers=[]; hide(statusEl); }
  function failUI(msg){ timers.forEach(clearTimeout); timers=[]; statusTxt.textContent = msg; setTimeout(()=>hide(statusEl), 2500); }

  const esc = s => (s||'').toString().replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  function render(data){
    const h1 = (data.h1||[]).map(x=>`<code>${esc(x)}</code>`).join(' · ') || '—';
    results.innerHTML = `
      <div class="result-card">
        <p><strong>Score:</strong> ${data.score ?? '—'}/100</p>
        <p><strong>Status:</strong> ${data.status} ${data.final_url ? '('+esc(data.final_url)+')' : ''}</p>
        <p><strong>Title:</strong> ${esc(data.title) || '—'} <em>(${data.title_length || 0})</em></p>
        <p><strong>Meta:</strong> ${esc(data.meta_description) || '—'} <em>(${data.meta_description_length || 0})</em></p>
        <p><strong>H1:</strong> ${h1} ${data.multiple_h1 ? '(multiple H1s)' : ''}</p>
        <p><strong>Canonical:</strong> ${esc(data.canonical) || '—'}</p>
        <p><strong>Robots:</strong> ${data.robots ?? '—'} ${data.noindex ? '(noindex)' : ''} ${data.nofollow ? '(nofollow)' : ''}</p>
        <p><strong>Viewport:</strong> ${data.viewport ? 'Yes' : 'No'}</p>
        <p><strong>OG/Twitter:</strong> ${data.og_count || 0} / ${data.twitter_count || 0}</p>
        <p><strong>JSON-LD:</strong> ${data.jsonld_count || 0} ${data.jsonld_types?.length ? '('+data.jsonld_types.join(', ')+')' : ''}</p>
        ${data.recommendations?.length ? `<h4>Recommended actions</h4><ul>${data.recommendations.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      </div>`;
    show(results);

    const dl = document.getElementById('dl');
    dl.classList.remove('hidden');
    document.getElementById('dlJson').onclick = () =>
      download('seo-report.json','application/json', JSON.stringify(data,null,2));
    document.getElementById('dlPdf').onclick = () => {
      const w = window.open('', '_blank'); w.document.write(buildReportHTML(data));
      w.document.close(); w.focus(); setTimeout(()=>{ try{ w.print(); }catch(_){} }, 300);
    };

    showSuggestBlock(data);
  }

  function download(name, type, text){
    const blob = new Blob([text], {type}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function buildReportHTML(data){
    const e = s => (s||'').toString().replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const h1 = (data.h1||[]).map(x=>`<li><code>${e(x)}</code></li>`).join('') || '<li>—</li>';
    return `<!doctype html><html><head><meta charset="utf-8">
    <title>SEO Report</title>
    <style>
      body{font-family:system-ui,Segoe UI,Roboto; margin:32px; color:#0f172a}
      .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:12px 0}
      code{background:#f1f5f9;padding:2px 6px;border-radius:6px}
    </style></head><body>
    <h1>SEO Report</h1>
    <div class="card"><b>URL:</b> ${e(data.final_url||'')}</div>
    <div class="card"><b>Score:</b> ${data.score}/100</div>
    <div class="card"><b>Title:</b> ${e(data.title)} (${data.title_length})</div>
    <div class="card"><b>Meta:</b> ${e(data.meta_description)} (${data.meta_description_length})</div>
    <div class="card"><b>H1:</b><ul>${h1}</ul></div>
    <div class="card"><b>Canonical:</b> ${e(data.canonical)||'—'}</div>
    <div class="card"><b>Robots:</b> ${e(data.robots)||'—'}</div>
    <div class="card"><b>Viewport:</b> ${data.viewport?'Yes':'No'}</div>
    <div class="card"><b>OG/Twitter:</b> ${data.og_count} / ${data.twitter_count}</div>
    <div class="card"><b>JSON-LD:</b> ${data.jsonld_count} ${(data.jsonld_types||[]).join(', ')}</div>
    ${data.recommendations?.length? `<div class="card"><b>Recommended actions</b><ol>${
      data.recommendations.map(r=>`<li>${e(r)}</li>`).join('')
    }</ol></div>`:''}
    </body></html>`;
  }

  async function runAnalyze(url){
    startUI();
    const ac = new AbortController();
    const to = setTimeout(()=>ac.abort(), 20000);
    try{
      const r = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`, { signal: ac.signal });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || `API ${r.status}`);
      render(data);
    }catch(e){
      if (e.name === 'AbortError')      failUI('Request timed out. Try again or paste HTML.');
      else if ((e.message||'').includes('Failed to fetch')) failUI('Backend unavailable. Try again later.');
      else                               failUI(e.message || 'Something went wrong.');
      console.error(e);
    }finally{
      clearTimeout(to);
      stopUI();
    }
  }

  async function runAnalyzeHtml(html, url){
    startUI();
    try{
      const r = await fetch('/api/analyze_html', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ url: url || null, html })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || `API ${r.status}`);
      render(data);
    }catch(e){
      failUI(e.message || 'Analyze failed.');
      console.error(e);
    }finally{
      stopUI();
    }
  }

  function showSuggestBlock(data) {
    suggestBlock.classList.remove('hidden');
    genSuggestBtn.disabled = false;
    suggestResults.style.display = 'none';
    genSuggestBtn.onclick = async () => {
      genSuggestBtn.disabled = true;
      suggestTitle.textContent = '...';
      suggestMeta.textContent = '...';
      suggestResults.style.display = 'block';
      // Prepare payload
      const payload = {
        title: data.title || '',
        meta_description: data.meta_description || '',
        h1: data.h1 || [],
        keywords: [], // Add keyword extraction if available
        site_name: data.site_name || ''
      };
      try {
        const res = await fetch('/api/suggest', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const out = await res.json();
        suggestTitle.textContent = out.title_suggestion || '';
        suggestMeta.textContent = out.meta_suggestion || '';
        copyTitleBtn.onclick = () => navigator.clipboard.writeText(out.title_suggestion||'');
        copyMetaBtn.onclick = () => navigator.clipboard.writeText(out.meta_suggestion||'');
      } catch(e) {
        suggestTitle.textContent = 'Error';
        suggestMeta.textContent = 'Error';
      } finally {
        genSuggestBtn.disabled = false;
      }
    };
  }

  if (form) form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const url = input.value.trim();
    if (url) runAnalyze(url); else input.focus();
  });

  if (pasteForm) pasteForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const html = textarea.value.trim();
    const url  = input?.value.trim() || null;
    if (html) runAnalyzeHtml(html, url); else textarea.focus();
  });

  const u = new URLSearchParams(location.search).get('u');
  if (u) {
    input.value = u;
    runAnalyze(u);
  }
});
