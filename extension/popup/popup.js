/**
 * ProspectNet - Chrome Extension Popup Logic
 * Handles UI state transitions, messaging with content scripts to auto-fill data,
 * and communicating with the background script to trigger the enrichment pipeline.
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements - Views
    const viewForm = document.getElementById('view-form');
    const viewLoading = document.getElementById('view-loading');
    const viewResult = document.getElementById('view-result');

    // UI Elements - Form
    const inputName = document.getElementById('input-name');
    const inputCompany = document.getElementById('input-company');
    const inputSource = document.getElementById('input-source');
    const btnEnrich = document.getElementById('btn-enrich');
    const errorAlert = document.getElementById('error-alert');

    // UI Elements - Results
    const resultScore = document.getElementById('result-score');
    const resultSignal = document.getElementById('result-signal');
    const resultDraftStatus = document.getElementById('result-draft-status');
    const btnDashboard = document.getElementById('btn-dashboard');

    // Web App URL (Update if deployed elsewhere)
    const DASHBOARD_URL = 'http://localhost:5173'; 

    /**
     * Switch the visible view state in the popup
     */
    function switchView(activeView) {
        viewForm.classList.remove('active');
        viewLoading.classList.remove('active');
        viewResult.classList.remove('active');
        activeView.classList.add('active');
    }

    /**
     * Show an error message on the form view
     */
    function showError(message) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        switchView(viewForm);
    }

    /**
     * Helper to set the color of the score badge
     */
    function updateScoreBadge(score) {
        resultScore.textContent = score;
        resultScore.className = 'score-badge'; // Reset classes
        
        if (score >= 75) {
            resultScore.classList.add('score-high');
        } else if (score >= 40) {
            resultScore.classList.add('score-med');
        } else {
            resultScore.classList.add('score-low');
        }
    }

    // 1. Auto-extract data from the active tab on load
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        
        if (!currentTab || !currentTab.url) return;
        
        const url = currentTab.url;

        // Check if we are on LinkedIn
        if (url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/')) {
            chrome.tabs.sendMessage(currentTab.id, { action: "extract_linkedin_data" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Could not communicate with LinkedIn content script.");
                    return;
                }
                if (response && response.success) {
                    inputName.value = response.data.name || '';
                    inputCompany.value = response.data.company || '';
                    inputSource.value = 'linkedin_profile';
                    
                    // Optional: If it's a company page, hide/disable the Name input
                    if (url.includes('linkedin.com/company/')) {
                        inputName.placeholder = "Company Profile (No Name)";
                        inputName.disabled = true;
                    }
                }
            });
        } 
        // Check if on a standard website (ignoring system pages and search engines)
        else if (!url.includes('chrome://') && !url.includes('google.com')) {
            chrome.tabs.sendMessage(currentTab.id, { action: "extract_website_data" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Could not communicate with website content script.");
                    return;
                }
                if (response && response.success) {
                    inputCompany.value = response.data.name || response.data.domain || '';
                    inputName.placeholder = "Company-level enrichment";
                    inputSource.value = 'company_website';
                }
            });
        }
    });

    // 2. Handle "Enrich Lead" button click
    btnEnrich.addEventListener('click', () => {
        errorAlert.style.display = 'none';
        
        const payload = {
            name: inputName.value.trim(),
            company: inputCompany.value.trim(),
            source: inputSource.value
        };

        if (!payload.company && !payload.name) {
            showError('Please provide a Name or Company/Domain.');
            return;
        }

        switchView(viewLoading);

        // Send to background.js to route to the backend (avoids CORS in popup)
        chrome.runtime.sendMessage({ action: "enrich_lead", payload: payload }, (response) => {
            if (chrome.runtime.lastError) {
                showError("Extension error: Could not contact background script.");
                return;
            }

            if (response && response.success) {
                const lead = response.data;
                
                // Populate results
                updateScoreBadge(lead.icp_score || 0);
                
                resultSignal.textContent = lead.top_buying_signal || "No strong signals detected.";
                
                // Check if drafts were generated (requires drafts object with keys)
                if (lead.outreach_drafts && Object.keys(lead.outreach_drafts).length > 0) {
                    resultDraftStatus.innerHTML = `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg> Generated
                    `;
                    resultDraftStatus.style.backgroundColor = '#e0f2fe';
                    resultDraftStatus.style.color = '#0369a1';
                } else {
                    resultDraftStatus.textContent = "Pending";
                    resultDraftStatus.style.backgroundColor = 'var(--surface)';
                    resultDraftStatus.style.color = 'var(--text-muted)';
                }

                switchView(viewResult);
            } else {
                showError(response.error || "An unknown error occurred during enrichment.");
            }
        });
    });

    // 3. Handle Dashboard navigation
    btnDashboard.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL });
    });
});