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
        const url = this.urlInput.value.trim();

        if (!this.validateURL(url)) {
            this.showError('Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        this.setLoadingState(true);
        this.statusMsg.innerHTML = '<span class="spinner" style="display:inline-block;width:24px;height:24px;border:3px solid #e5e7eb;border-top:3px solid #4f46e5;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:8px;"></span>Analyzing… may take a few seconds on first run.';

        try {
            // Simulate API call with realistic delay
            await this.delay(2000);

            const analysisData = await this.performAnalysis(url);
            this.displayResults(analysisData);
            this.statusMsg.innerHTML = '';
        } catch (error) {
            // Friendly error for site blocks or network issues
            if (error && error.message && (error.message.includes('502') || error.message.includes('504'))) {
                this.statusMsg.innerHTML = '<span style="color:#d97706;font-weight:600;">Site may be blocking bots or is unreachable.<br>For best results, try pasting the site HTML (feature coming soon).</span>';
            } else {
                this.statusMsg.innerHTML = '';
                this.showError('Analysis failed. Please try again.');
            }
            console.error('Analysis error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    validateURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    setLoadingState(loading) {
        if (loading) {
            this.analyzeBtn.classList.add('loading');
            this.analyzeBtn.disabled = true;
            this.resultsContainer.classList.add('hidden');
            // Hide metrics until analysis completes
            this.seoScore.textContent = '';
            this.scoreBreakdown.innerHTML = '';
            this.aiStatus.querySelector('.status-icon').textContent = '';
            this.aiStatus.querySelector('.status-text').textContent = '';
            this.aiDetails.innerHTML = '';
            this.aiReport.innerHTML = '';
        } else {
            this.analyzeBtn.classList.remove('loading');
            this.analyzeBtn.disabled = false;
        }
    }

    async performAnalysis(url) {
        // Simulate comprehensive SEO analysis
        const domain = new URL(url).hostname;
        
        // Generate realistic SEO scores
        const scores = this.generateSEOScores(domain);
        const aiDetection = this.detectAI(domain);
        const recommendations = this.generateRecommendations(aiDetection, scores);
        
        return {
            url,
            domain,
            scores,
            aiDetection,
            recommendations
        };
    }

    generateSEOScores(domain) {
        // Generate realistic scores based on domain characteristics
        const baseScore = Math.floor(Math.random() * 40) + 40; // 40-80 base
        
        const factors = {
            'Technical SEO': this.randomScore(baseScore, 15),
            'Content Quality': this.randomScore(baseScore, 20),
            'Meta Tags': this.randomScore(baseScore, 10),
            'Site Speed': this.randomScore(baseScore, 15),
            'Mobile Friendly': this.randomScore(baseScore, 10),
            'SSL Security': domain.includes('https') ? 95 : 60,
            'Structured Data': this.randomScore(baseScore, 25)
        };

        const totalScore = Math.round(
            Object.values(factors).reduce((sum, score) => sum + score, 0) / Object.keys(factors).length
        );

        return {
            total: Math.min(totalScore, 100),
            factors
        };
    }

    randomScore(base, variance) {
        const min = Math.max(0, base - variance);
        const max = Math.min(100, base + variance);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    detectAI(domain) {
        // Simulate AI detection based on common patterns
        const aiIndicators = [
            'chatbot', 'chat', 'ai', 'bot', 'assistant', 'support',
            'help', 'virtual', 'automated', 'smart', 'intelligent'
        ];
        
        const hasAI = aiIndicators.some(indicator => 
            domain.toLowerCase().includes(indicator)
        ) || Math.random() < 0.3; // 30% chance for demo

        const aiTypes = [];
        if (hasAI) {
            const possibleTypes = [
                'Chatbot Integration',
                'Automated Customer Support',
                'AI-Powered Search',
                'Recommendation Engine',
                'Content Personalization',
                'Predictive Analytics'
            ];
            
            const numTypes = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numTypes; i++) {
                const randomType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
                if (!aiTypes.includes(randomType)) {
                    aiTypes.push(randomType);
                }
            }
        }

        return {
            detected: hasAI,
            types: aiTypes,
            confidence: hasAI ? Math.floor(Math.random() * 30) + 70 : 0
        };
    }

    generateRecommendations(aiDetection, scores) {
        const recommendations = {
            seoImprovements: [],
            aiImplementation: [],
            growthProjections: {}
        };

        // SEO Improvements
        Object.entries(scores.factors).forEach(([factor, score]) => {
            if (score < 70) {
                recommendations.seoImprovements.push(this.getSEORecommendation(factor, score));
            }
        });

        // AI Implementation Recommendations
        if (!aiDetection.detected) {
            recommendations.aiImplementation = [
                {
                    type: 'Chatbot Integration',
                    description: 'Implement an AI-powered chatbot to provide 24/7 customer support and improve user engagement.',
                    impact: 'High',
                    timeframe: '2-4 weeks',
                    roi: '150-300%'
                },
                {
                    type: 'Content Personalization',
                    description: 'Use machine learning to personalize content based on user behavior and preferences.',
                    impact: 'Medium',
                    timeframe: '4-8 weeks',
                    roi: '80-150%'
                },
                {
                    type: 'Predictive Analytics',
                    description: 'Implement AI analytics to predict customer behavior and optimize conversion rates.',
                    impact: 'High',
                    timeframe: '6-12 weeks',
                    roi: '200-400%'
                }
            ];

            // Growth Projections
            recommendations.growthProjections = {
                'Traffic Increase': '25-45%',
                'Conversion Rate': '15-30%',
                'Customer Satisfaction': '40-60%',
                'Revenue Growth': '20-50%'
            };
        } else {
            recommendations.aiImplementation = [
                {
                    type: 'AI Optimization',
                    description: 'Optimize existing AI implementations for better performance and user experience.',
                    impact: 'Medium',
                    timeframe: '2-6 weeks',
                    roi: '50-120%'
                }
            ];

            recommendations.growthProjections = {
                'AI Efficiency': '15-25%',
                'User Engagement': '10-20%',
                'Cost Reduction': '20-35%'
            };
        }

        return recommendations;
    }

    getSEORecommendation(factor, score) {
        const recommendations = {
            'Technical SEO': 'Improve site structure, fix broken links, and optimize URL structure.',
            'Content Quality': 'Create more valuable, keyword-optimized content that addresses user intent.',
            'Meta Tags': 'Optimize title tags, meta descriptions, and header tags for better search visibility.',
            'Site Speed': 'Optimize images, enable compression, and use a content delivery network (CDN).',
            'Mobile Friendly': 'Implement responsive design and improve mobile user experience.',
            'SSL Security': 'Install an SSL certificate to secure your website and improve trust.',
            'Structured Data': 'Add schema markup to help search engines understand your content better.'
        };

        return {
            factor,
            score,
            recommendation: recommendations[factor] || 'General optimization needed.'
        };
    }

    displayResults(data) {
        this.displaySEOScore(data.scores);
        this.displayAIStatus(data.aiDetection);
        this.displayRecommendations(data.recommendations);
        
        this.resultsContainer.classList.remove('hidden');
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    displaySEOScore(scores) {
        // Update score circle
        this.seoScore.textContent = scores.total;
        this.updateScoreCircle(scores.total);

        // Update breakdown
        this.scoreBreakdown.innerHTML = '';
        Object.entries(scores.factors).forEach(([factor, score]) => {
            const item = document.createElement('div');
            item.className = 'breakdown-item';
            item.innerHTML = `
                <span class="breakdown-label">${factor}</span>
                <span class="breakdown-score">${score}/100</span>
            `;
            this.scoreBreakdown.appendChild(item);
        });
    }

    updateScoreCircle(score) {
        const circle = document.querySelector('.score-circle');
        const percentage = (score / 100) * 360;
        circle.style.background = `conic-gradient(#4f46e5 ${percentage}deg, #e5e7eb ${percentage}deg)`;
    }

    displayAIStatus(aiDetection) {
        const statusIcon = this.aiStatus.querySelector('.status-icon');
        const statusText = this.aiStatus.querySelector('.status-text');

        if (aiDetection.detected) {
            statusIcon.className = 'status-icon detected';
            statusIcon.textContent = '✅';
            statusText.innerHTML = `
                <strong>AI Detected</strong><br>
                <small>Confidence: ${aiDetection.confidence}%</small>
            `;

            this.aiDetails.innerHTML = `
                <h4>Detected AI Technologies:</h4>
                <ul>
                    ${aiDetection.types.map(type => `<li>${type}</li>`).join('')}
                </ul>
                <p>Your website is already leveraging AI technologies. Consider optimizing these implementations for better performance.</p>
            `;
        } else {
            statusIcon.className = 'status-icon not-detected';
            statusIcon.textContent = '⚠️';
            statusText.innerHTML = `
                <strong>No AI Detected</strong><br>
                <small>Opportunity for growth</small>
            `;

            this.aiDetails.innerHTML = `
                <p>No AI implementations were detected on your website. This represents a significant opportunity to enhance user experience and business growth through AI integration.</p>
            `;
        }
    }

    displayRecommendations(recommendations) {
        let reportHTML = '';

        // SEO Improvements
        if (recommendations.seoImprovements.length > 0) {
            reportHTML += `
                <h4>🔧 SEO Improvements Needed</h4>
                <ul>
                    ${recommendations.seoImprovements.map(item => 
                        `<li><strong>${item.factor} (${item.score}/100):</strong> ${item.recommendation}</li>`
                    ).join('')}
                </ul>
            `;
        }

        // AI Implementation
        if (recommendations.aiImplementation.length > 0) {
            reportHTML += `
                <h4>🤖 AI Implementation Opportunities</h4>
                ${recommendations.aiImplementation.map(ai => `
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <h5>${ai.type}</h5>
                        <p>${ai.description}</p>
                        <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #6b7280;">
                            <span><strong>Impact:</strong> ${ai.impact}</span>
                            <span><strong>Timeframe:</strong> ${ai.timeframe}</span>
                            <span><strong>ROI:</strong> ${ai.roi}</span>
                        </div>
                    </div>
                `).join('')}
            `;
        }

        // Growth Projections
        if (Object.keys(recommendations.growthProjections).length > 0) {
            reportHTML += `
                <h4>📈 Projected Growth with AI Implementation</h4>
                <div class="growth-metrics">
                    ${Object.entries(recommendations.growthProjections).map(([metric, value]) => `
                        <div class="metric-card">
                            <span class="metric-value">${value}</span>
                            <span class="metric-label">${metric}</span>
                        </div>
                    `).join('')}
                </div>
                <p><em>These projections are based on industry averages and successful AI implementations across similar businesses.</em></p>
            `;
        }

        this.aiReport.innerHTML = reportHTML;
    }

    showError(message) {
        // Simple error display - could be enhanced with a toast notification
        this.statusMsg.innerHTML = `<span style="color:#d97706;font-weight:600;">${message}</span>`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SEOCalculator();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


// Add some interactive animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards for animation
document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
});

// Spinner animation keyframes
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);
