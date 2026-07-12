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
  return apiFetch('/assets', {
    method: 'POST',
    body: formData, // apiFetch now handles FormData correctly
  });
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
