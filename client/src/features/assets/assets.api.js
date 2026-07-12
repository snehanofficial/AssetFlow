import apiFetch from '../../utils/api.js';

/**
 * Asset API client functions.
 * Used with TanStack Query for data fetching and mutations.
 */

/**
 * Fetch paginated/filtered asset list.
 * @param {Object} params - { page, limit, search, categoryId, status, departmentId }
 */
export async function fetchAssets(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return apiFetch(`/assets${qs ? `?${qs}` : ''}`);
}

/**
 * Fetch single asset with full history timeline.
 * @param {string} assetId
 */
export async function fetchAssetById(assetId) {
  return apiFetch(`/assets/${assetId}`);
}

/**
 * Create a new asset (multipart/form-data for optional photo).
 * @param {FormData} formData
 */
export async function createAsset(formData) {
  const accessToken = sessionStorage.getItem('accessToken');
  const headers = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch('/api/v1/assets', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData, // FormData handles multipart content-type automatically
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Failed to create asset.');
    error.status = response.status;
    error.code = data.error?.code;
    error.details = data.error?.details || [];
    throw error;
  }
  return data;
}

/**
 * Update asset status.
 * @param {string} assetId
 * @param {string} status
 */
export async function updateAssetStatus(assetId, status) {
  return apiFetch(`/assets/${assetId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

/**
 * Fetch all asset categories (for dynamic form fields).
 */
export async function fetchCategories() {
  return apiFetch('/organization/categories');
}

export default { fetchAssets, fetchAssetById, createAsset, updateAssetStatus, fetchCategories };
