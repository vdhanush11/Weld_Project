/**
 * API Service for communicating with the FastAPI Welding Quality Backend
 */

const API_BASE = '/api/v1';

export const api = {
  // Submit image for inspection
  async inspectImage(fileOrBlob, deviceId = 'WEB-CLIENT', notes = '') {
    const formData = new FormData();
    formData.append('file', fileOrBlob, fileOrBlob.name || 'capture.jpg');
    if (deviceId) formData.append('device_id', deviceId);
    if (notes) formData.append('notes', notes);

    const response = await fetch(`${API_BASE}/inspections`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Network error or invalid response.' }));
      throw new Error(err.detail || 'Inspection failed.');
    }

    return response.json();
  },

  // Get paginated inspection history
  async getHistory(status = 'ALL', page = 1, limit = 20, sort = 'desc') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sort
    });
    if (status && status !== 'ALL') {
      params.append('status', status);
    }

    const response = await fetch(`${API_BASE}/inspections?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch inspection history.');
    }
    return response.json();
  },

  // Get single inspection details
  async getInspectionById(inspectionId) {
    const response = await fetch(`${API_BASE}/inspections/${inspectionId}`);
    if (!response.ok) {
      throw new Error(`Failed to load inspection ${inspectionId}`);
    }
    return response.json();
  },

  // Delete an inspection
  async deleteInspection(inspectionId) {
    const response = await fetch(`${API_BASE}/inspections/${inspectionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete inspection.');
    }
    return response.json();
  },

  // Get aggregate stats
  async getStats() {
    const response = await fetch(`${API_BASE}/inspections/stats/summary`);
    if (!response.ok) {
      throw new Error('Failed to fetch statistics.');
    }
    return response.json();
  },

  // System Health
  async getHealth() {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error('Health check failed.');
    }
    return response.json();
  },

  // Model Info
  async getModelInfo() {
    const response = await fetch(`${API_BASE}/model-info`);
    if (!response.ok) {
      throw new Error('Failed to fetch model info.');
    }
    return response.json();
  },

  // Update Decision Thresholds
  async updateThresholds(thresholds) {
    const response = await fetch(`${API_BASE}/config/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thresholds),
    });
    if (!response.ok) {
      throw new Error('Failed to update thresholds.');
    }
    return response.json();
  }
};
