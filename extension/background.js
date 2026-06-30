/**
 * ProspectNet - Background Service Worker
 * Handles API communication between the extension and the Railway backend.
 * This prevents CORS issues and keeps the extension running smoothly.
 */

// Configure this to point to the live Railway backend URL upon deployment
const BACKEND_URL = "http://localhost:8000"; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "enrich_lead") {
        sendLeadToBackend(request.payload)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message || String(error) }));
            
        // Return true to indicate that the response will be sent asynchronously
        return true; 
    }
});

/**
 * Sends the extracted lead data to the FastAPI backend for enrichment.
 * 
 * @param {Object} payload - The data extracted from the content scripts (LinkedIn or Website)
 * @returns {Promise<Object>} - The enriched lead data, ICP score, and status returned from the backend
 */
async function sendLeadToBackend(payload) {
    try {
        const response = await fetch(`${BACKEND_URL}/leads/extension-enrich`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                name: payload.name || null,
                company_name: payload.company || (payload.source === 'company_website' ? payload.name : null),
                domain: payload.domain || null,
                source: payload.source
            })
        });

        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // Ignore JSON parse error if response is not JSON
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("ProspectNet Background Error:", error);
        throw error;
    }
}