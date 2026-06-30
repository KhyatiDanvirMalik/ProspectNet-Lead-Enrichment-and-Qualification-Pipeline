/**
 * ProspectNet - API Service
 * Centralized configuration and functions for all backend communication.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper for consistent error handling and JSON parsing
 * 
 * @param {string} endpoint - The API endpoint (e.g., '/leads/')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} - The parsed JSON response
 */
async function apiFetch(endpoint, options = {}) {
  // Setup default headers if not uploading form data
  const headers = {
    ...options.headers,
  };

  // Automatically add Content-Type for JSON payloads if not already set
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // Ignore JSON parse error if the response is empty or HTML
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// --- Lead API Endpoints ---
export const leadService = {
  /**
   * Fetch all leads in the pipeline
   */
  getLeads: () => apiFetch('/leads/'),
  
  /**
   * Fetch a specific lead by ID
   * @param {string|number} id 
   */
  getLeadById: (id) => apiFetch(`/leads/${id}`),
  
  /**
   * Trigger CRM sync for a specific lead
   * @param {string|number} id 
   */
  syncCRM: (id) => apiFetch(`/leads/${id}/sync`, { method: 'POST' }),
  
  /**
   * Upload a CSV file of leads for bulk enrichment
   * @param {FormData} formData - Must contain the 'file' parameter
   */
  uploadLeads: async (formData) => {
    // Note: We bypass the generic apiFetch here because fetch automatically 
    // sets the correct Content-Type with boundary for FormData. If we set it 
    // manually to application/json, the upload will fail.
    const response = await fetch(`${API_BASE_URL}/leads/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload and process file');
    }
    return response.json();
  }
};

// --- ICP Configuration API Endpoints ---
export const icpService = {
  /**
   * Get the current Ideal Customer Profile configuration
   */
  getConfig: () => apiFetch('/icp/'),
  
  /**
   * Create or update the Ideal Customer Profile configuration
   * @param {Object} configData 
   */
  updateConfig: (configData) => apiFetch('/icp/', {
    method: 'POST',
    body: JSON.stringify(configData),
  })
};

// Default export for convenience
export default {
  leads: leadService,
  icp: icpService
};