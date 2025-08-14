// SEO Calculator JavaScript
class SEOCalculator {
    constructor() {
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.urlInput = document.getElementById('website-url');
        this.resultsContainer = document.getElementById('results-container');
        this.seoScore = document.getElementById('seo-score');
        this.scoreBreakdown = document.getElementById('score-breakdown');
        this.aiStatus = document.getElementById('ai-status');
        this.aiDetails = document.getElementById('ai-details');
        this.aiReport = document.getElementById('ai-report');

        // status elements
        this.statusEl  = document.getElementById('analysis-status');
        this.statusTxt = document.getElementById('analysis-text');
        this.stageTimers = [];

        this.initEventListeners();
    }

    initEventListeners() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeWebsite());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeWebsite();
            }
        });
    }

    // --- loading UI helpers ---
    startAnalysisUI(){
      this.statusTxt.textContent = 'Analyzing your website…';
      this.statusEl.classList.remove('hidden');
      this.stageTimers = [
        setTimeout(()=> this.statusTxt.textContent = 'Warming the analysis engine…', 900),
        setTimeout(()=> this.statusTxt.textContent = 'Fetching and parsing HTML…', 2500),
        setTimeout(()=> this.statusTxt.textContent = 'Still working… some sites are slow.', 5000),
        setTimeout(()=> this.statusTxt.textContent = 'Almost there… compiling your summary.', 8000),
      ];
    }
    stopAnalysisUI(){ this.stageTimers.forEach(clearTimeout); this.stageTimers=[]; this.statusEl.classList.add('hidden'); }
    failAnalysisUI(msg){ this.stageTimers.forEach(clearTimeout); this.stageTimers=[]; this.statusTxt.textContent = msg; setTimeout(()=>this.statusEl.classList.add('hidden'), 3000); }

    async analyzeWebsite() {
        (async () => {
        let url = this.urlInput.value.trim();
        if (!this.validateURL(url)) {
            this.showError('Invalid URL');
            return;
        }
        this.startAnalysisUI();

        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 20000);
        try {
            const res = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`, { signal: ac.signal });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || `API ${res.status}`);

            this.stopAnalysisUI();
            this.showResults(data);

            // Extended results rendering
            this.resultsContainer.innerHTML += `
                <p><strong>Score:</strong> ${data.score}/100</p>
                <p><strong>Robots:</strong> ${data.robots ?? '—'} ${data.noindex ? '(noindex)' : ''} ${data.nofollow ? '(nofollow)' : ''}</p>
                <p><strong>Viewport:</strong> ${data.viewport ? 'Yes' : 'No'}</p>
                <p><strong>OpenGraph tags:</strong> ${data.og_count}</p>
                <p><strong>Twitter tags:</strong> ${data.twitter_count}</p>
                <p><strong>JSON-LD:</strong> ${data.jsonld_count} ${data.jsonld_types?.length ? '('+data.jsonld_types.join(', ')+')' : ''}</p>
                ${data.recommendations?.length ? `<h4>Recommended actions</h4><ul>${
                  data.recommendations.map(x=>`<li>${x}</li>`).join('')
                }</ul>` : ''}
            `;
        } catch (err) {
            if (err.name === 'AbortError') this.failAnalysisUI('Request timed out. Please try again.');
            else if ((err.message||'').includes('Failed to fetch')) this.failAnalysisUI('Backend unavailable. Try again.');
            else this.failAnalysisUI(err.message || 'Something went wrong.');
            throw err;
        } finally {
            clearTimeout(to);
        }
        })();
    }

    validateURL(url) {
        // Basic URL validation
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+([a-z]{2,}\\/?)'+ // domain name
            '|localhost\\/)'+ // localhost
            '(:\\d+)?(\\/[-a-z\\d%_.~+]*)*'); // port and path
        return !!pattern.test(url);
    }

    showStatus(message) {
        this.statusMsg.innerHTML = message;
    }

    showError(message) {
        this.resultsContainer.innerHTML = `<p style="color: red;">${message}</p>`;
    }

    showResults(data) {
        this.seoScore.innerHTML = `SEO Score: ${data.score}`;
        this.scoreBreakdown.innerHTML = `
            <h4>Score Breakdown</h4>
            <p>Robots: ${data.robots ?? '—'}</p>
            <p>Viewport: ${data.viewport ? 'Yes' : 'No'}</p>
            <p>OpenGraph tags: ${data.og_count}</p>
            <p>Twitter tags: ${data.twitter_count}</p>
            <p>JSON-LD: ${data.jsonld_count} ${data.jsonld_types?.length ? '('+data.jsonld_types.join(', ')+')' : ''}</p>
        `;
        this.aiStatus.innerHTML = 'AI Analysis: Complete';
        this.aiDetails.innerHTML = 'AI Report: <a href="#" id="view-ai-report">View Report</a>';
        document.getElementById('view-ai-report').addEventListener('click', () => this.showAIReport(data));
    }

    showAIReport(data) {
        this.aiReport.innerHTML = `
            <h4>AI Recommendations</h4>
            <ul>
                ${data.recommendations.map(x => `<li>${x}</li>`).join('')}
            </ul>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SEOCalculator();
});

document.getElementById('seo-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const url = document.getElementById('url').value.trim();
  runAnalysis(url);
});
