// scripts.js
document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('seo-form');
  const input     = document.getElementById('url');
  const btn       = document.getElementById('analyzeBtn');
  const statusEl  = document.getElementById('analysis-status');
  const statusTxt = document.getElementById('analysis-text');
  const results   = document.getElementById('results');

  if (!form || !input || !btn || !statusEl || !statusTxt || !results) {
    console.error('Calculator elements missing. Check IDs in HTML.');
    return;
  }

  // Warm backend to reduce first-hit lag
  fetch('/api/health').catch(()=>{});

  let timers = [];
  const show = el => el.classList.remove('hidden');
  const hide = el => el.classList.add('hidden');
  const startLoader = () => {
    statusTxt.textContent = 'Analyzing your website…';
    show(statusEl);
    timers = [
      setTimeout(()=> statusTxt.textContent = 'Warming the analysis engine…', 900),
      setTimeout(()=> statusTxt.textContent = 'Fetching and parsing HTML…', 2500),
      setTimeout(()=> statusTxt.textContent = 'Still working… some sites are slow.', 5000),
      setTimeout(()=> statusTxt.textContent = 'Almost there… compiling your summary.', 8000),
    ];
  };
  const stopLoader = () => { timers.forEach(clearTimeout); timers=[]; hide(statusEl); };
  const failLoader = msg => { timers.forEach(clearTimeout); timers=[]; statusTxt.textContent = msg; setTimeout(()=> hide(statusEl), 2500); };

  const sanitize = s => (s||'').toString().replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  const render = data => {
    const h1 = (data.h1||[]).map(x=>`<code>${sanitize(x)}</code>`).join(' · ') || '—';
    results.innerHTML = `
      <div class="result-card">
        <p><strong>Score:</strong> ${data.score}/100</p>
        <p><strong>Status:</strong> ${data.status} (${sanitize(data.final_url||'')})</p>
        <p><strong>Title:</strong> ${sanitize(data.title) || '—'} <em>(${data.title_length})</em></p>
        <p><strong>Meta description:</strong> ${sanitize(data.meta_description)||'—'} <em>(${data.meta_description_length})</em></p>
        <p><strong>H1:</strong> ${h1} ${data.multiple_h1 ? ' (multiple H1s)' : ''}</p>
        <p><strong>Canonical:</strong> ${sanitize(data.canonical)||'—'}</p>
        <p><strong>Viewport:</strong> ${data.viewport ? 'Yes' : 'No'}</p>
        <p><strong>OG/Twitter:</strong> ${data.og_count} / ${data.twitter_count}</p>
        <p><strong>JSON-LD:</strong> ${data.jsonld_count} ${data.jsonld_types?.length ? '('+data.jsonld_types.join(', ')+')' : ''}</p>
        ${data.recommendations?.length ? `<h4>Recommended actions</h4><ul>${data.recommendations.map(r=>`<li>${sanitize(r)}</li>`).join('')}</ul>`:''}
      </div>`;
    show(results);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = input.value.trim();
    if (!url) return input.focus();

    btn.disabled = true;
    results.innerHTML = ''; hide(results);
    startLoader();

    const ac = new AbortController();
    const timeout = setTimeout(()=> ac.abort(), 20000); // 20s hard stop

    try {
      const res = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`, { signal: ac.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `API ${res.status}`);
      render(data);
      stopLoader();
    } catch (err) {
      if (err.name === 'AbortError') failLoader('Request timed out. Please try again.');
      else if ((err.message||'').includes('Failed to fetch')) failLoader('Backend unavailable. Try again.');
      else failLoader(err.message || 'Something went wrong.');
      console.error(err);
    } finally {
      clearTimeout(timeout);
      btn.disabled = false;
    }
  });
});
