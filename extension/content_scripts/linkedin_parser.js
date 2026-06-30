/**
 * ProspectNet - LinkedIn DOM Parser
 * Extracts visible profile data without making any API calls.[cite: 1]
 */

function extractLinkedInProfileData() {
    const profileData = {
        name: "",
        title: "",
        company: "",
        location: "",
        source: "linkedin_profile"
    };

    try {
        // 1. Extract Name
        // Typically found in an h1 tag with specific classes on the top card
        const nameNode = document.querySelector('h1.text-heading-xlarge') || document.querySelector('h1');
        if (nameNode) {
            profileData.name = nameNode.innerText.trim();
        }

        // 2. Extract Title / Role
        // Typically found directly under the name
        const titleNode = document.querySelector('div.text-body-medium.break-words');
        if (titleNode) {
            profileData.title = titleNode.innerText.trim();
        }

        // 3. Extract Company
        // LinkedIn often displays the current company in the right panel of the top card or as a button
        const companyNode = document.querySelector('button[aria-label^="Current company"] div') || 
                            document.querySelector('a[href*="/company/"] h2') ||
                            document.querySelector('.pv-text-details__right-panel .inline-show-more-text');
        
        if (companyNode) {
            // Clean up text if it includes extra hidden spans
            profileData.company = companyNode.innerText.replace(/[\n\r]+/g, ' ').trim();
        }

        // 4. Extract Location
        const locationNode = document.querySelector('span.text-body-small.inline.t-black--light.break-words');
        if (locationNode) {
            profileData.location = locationNode.innerText.trim();
        }

    } catch (error) {
        console.error("ProspectNet Extension: Error extracting LinkedIn profile data", error);
    }

    return profileData;
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_linkedin_data") {
        const extractedData = extractLinkedInProfileData();
        sendResponse({ success: true, data: extractedData });
    }
    // Return true to indicate we wish to send a response asynchronously (even though this is synchronous, it's good practice)
    return true; 
});