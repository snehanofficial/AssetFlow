import apiFetch from '../../utils/api.js';

/**
 * Allocation API client functions.
 */

export async function fetchAllocations(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return apiFetch(`/allocations${qs ? `?${qs}` : ''}`);
}

export async function createAllocation(data) {
  return apiFetch('/allocations', { method: 'POST', body: data });
}

export async function returnAsset(allocationId, data) {
  return apiFetch(`/allocations/${allocationId}/return`, { method: 'POST', body: data });
}

export async function fetchTransfers(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return apiFetch(`/allocations/transfers${qs ? `?${qs}` : ''}`);
}

export async function createTransfer(data) {
  return apiFetch('/allocations/transfers', { method: 'POST', body: data });
}

export async function updateTransferStatus(transferId, data) {
  return apiFetch(`/allocations/transfers/${transferId}/status`, { method: 'PATCH', body: data });
}

export default {
  fetchAllocations,
  createAllocation,
  returnAsset,
  fetchTransfers,
  createTransfer,
  updateTransferStatus,
};
