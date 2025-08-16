// scripts.js
document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('seo-form');
  const input     = document.getElementById('url');
  const pasteForm = document.getElementById('paste-html-form');
  const textarea  = document.getElementById('htmlTextarea');

  const statusEl  = document.getElementById('analysis-status');
  const statusTxt = document.getElementById('analysis-text');
  const results   = document.getElementById('results');

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
});
