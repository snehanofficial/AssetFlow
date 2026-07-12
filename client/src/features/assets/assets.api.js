import apiFetch from '../../utils/api.js';

/**
 * Asset API client functions.
 * Used with TanStack Query for data fetching and mutations.
 */

export async function fetchAssets(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return apiFetch(`/assets${qs ? `?${qs}` : ''}`);
}

export async function fetchAssetById(assetId) {
  return apiFetch(`/assets/${assetId}`);
}

export async function createAsset(formData) {
  return apiFetch('/assets', {
    method: 'POST',
    body: formData,
  });
}

export async function updateAsset(assetId, formData) {
  return apiFetch(`/assets/${assetId}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteAsset(assetId) {
  return apiFetch(`/assets/${assetId}`, {
    method: 'DELETE',
  });
}

export async function updateAssetStatus(assetId, status) {
  return apiFetch(`/assets/${assetId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function fetchCategories() {
  return apiFetch('/organization/categories');
}

export default {
  fetchAssets,
  fetchAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  updateAssetStatus,
  fetchCategories,
};
