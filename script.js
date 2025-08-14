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

        // Add status message and spinner
        this.statusMsg = document.createElement('div');
        this.statusMsg.id = 'analysis-status';
        this.statusMsg.style.textAlign = 'center';
        this.statusMsg.style.margin = '1rem 0';
        this.statusMsg.style.fontWeight = '500';
        this.statusMsg.style.color = '#4f46e5';
        this.statusMsg.innerHTML = '';
        this.resultsContainer.parentNode.insertBefore(this.statusMsg, this.resultsContainer);

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

    async analyzeWebsite() {
        // SEO Calculator JavaScript
        (function(){
        if (!this.validateURL(url)) {
            this.showError('Invalid URL');
            return;
        }
        this.showStatus('Analyzing website...');

        // Simulate API call
        setTimeout(() => {
            // Mocked response
            let data = {
                score: 85,
                robots: 'index, follow',
                viewport: true,
                og_count: 5,
                twitter_count: 2,
                jsonld_count: 3,
                jsonld_types: ['Article', 'WebSite'],
                recommendations: ['Improve page speed', 'Add more internal links']
            };

            this.showStatus('');
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
        }, 2000);
        }).call(this);
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
