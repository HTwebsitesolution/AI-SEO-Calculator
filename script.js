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
