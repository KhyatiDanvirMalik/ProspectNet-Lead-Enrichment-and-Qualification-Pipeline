/**
 * ProspectNet - Website DOM Parser
 * Extracts the company name and URL when viewing a company website[cite: 1].
 */

function extractCompanyData() {
    const data = {
        name: "",
        domain: window.location.hostname.replace(/^www\./, ''),
        url: window.location.href,
        source: "company_website"
    };

    try {
        // 1. Try to get company name from Open Graph meta tag (most reliable for brand name)
        const ogSiteName = document.querySelector('meta[property="og:site_name"]');
        if (ogSiteName && ogSiteName.content) {
            data.name = ogSiteName.content.trim();
        }

        // 2. Try JSON-LD schema markup
        if (!data.name) {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (let script of scripts) {
                try {
                    const jsonData = JSON.parse(script.innerText);
                    // Search for Organization schema
                    if (jsonData["@type"] === "Organization" && jsonData.name) {
                        data.name = jsonData.name.trim();
                        break;
                    }
                    // Handle cases where schema is wrapped in an array or graph
                    if (jsonData["@graph"]) {
                        const org = jsonData["@graph"].find(item => item["@type"] === "Organization");
                        if (org && org.name) {
                            data.name = org.name.trim();
                            break;
                        }
                    }
                } catch (e) {
                    // Ignore JSON parse errors from invalid schema structures
                }
            }
        }

        // 3. Fallback to extracting from the page Title
        if (!data.name) {
            let title = document.title;
            // Often titles are formatted as "Page Name | Company Name" or "Company Name - Catchphrase"
            const separators = ['|', '-', '—', ':', '•'];
            let found = false;
            
            for (let sep of separators) {
                if (title.includes(sep)) {
                    const parts = title.split(sep).map(p => p.trim());
                    // Heuristic: Brand names are typically short (1-4 words). 
                    // Check parts starting from the end (e.g., "Home | Brand") or beginning (e.g., "Brand - Product")
                    data.name = parts.find(p => p.split(/\s+/).length <= 4) || parts[0];
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                data.name = title.trim();
            }
        }

    } catch (error) {
        console.error("ProspectNet Extension: Error extracting website data", error);
    }

    return data;
}

// Listen for messages from the popup or background script to send data back to the extension UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_website_data") {
        const extractedData = extractCompanyData();
        sendResponse({ success: true, data: extractedData });
    }
    // Return true to indicate an asynchronous response
    return true; 
});