import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { AssetList } from './AssetList.jsx';
import { AssetDetails } from './AssetDetails.jsx';
import { AssetRegisterForm } from './AssetRegisterForm.jsx';
import { deleteAsset } from './assets.api.js';
import { AllocationForm } from '../allocation/AllocationForm.jsx';
import { ReturnAssetModal } from '../allocation/ReturnAssetModal.jsx';
import { TransferInbox } from '../allocation/TransferInbox.jsx';
import { useToast } from '../../components/common/Providers.jsx';

export const AssetsPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAssetId = searchParams.get('id');
  const view = selectedAssetId ? 'detail' : 'list';

  const [showRegister, setShowRegister] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [allocationTarget, setAllocationTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [showTransferInbox, setShowTransferInbox] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (assetId) => deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (deleteTarget?.id) {
        queryClient.removeQueries({ queryKey: ['asset', deleteTarget.id] });
      }
      showToast(`Asset "${deleteTarget?.name}" deleted successfully.`, 'success');
      setDeleteTarget(null);
      setSearchParams({});
    },
    onError: (error) => {
      showToast(error.message || 'Failed to delete asset.', 'error');
    },
  });

  const handleViewDetail = (assetId) => {
    setSearchParams({ id: assetId });
  };

  const handleAllocate = (asset) => {
    setAllocationTarget(asset);
  };

  const handleReturn = (allocation) => {
    setReturnTarget(allocation);
  };

  const handleBack = () => {
    setSearchParams({});
  };

  return (
    <div>
      {view === 'list' && (
        <AssetList onRegister={() => setShowRegister(true)} onViewDetail={handleViewDetail} />
      )}

      {view === 'detail' && selectedAssetId && (
        <AssetDetails
          assetId={selectedAssetId}
          onBack={handleBack}
          onAllocate={handleAllocate}
          onReturn={handleReturn}
          onEdit={setEditingAsset}
          onDelete={setDeleteTarget}
        />
      )}

      {showRegister && (
        <AssetRegisterForm
          onClose={() => setShowRegister(false)}
          onSuccess={(asset) => handleViewDetail(asset.id)}
        />
      )}

      {editingAsset && (
        <AssetRegisterForm
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={(asset) => {
            setEditingAsset(null);
            handleViewDetail(asset.id);
          }}
        />
      )}

      {allocationTarget && (
        <AllocationForm
          preselectedAsset={allocationTarget}
          onClose={() => setAllocationTarget(null)}
          onSuccess={() => setAllocationTarget(null)}
          onTransferRequest={() => {
            setAllocationTarget(null);
            setShowTransferInbox(true);
          }}
        />
      )}

      {showTransferInbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-background border border-border rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-1.5">
                The asset is already allocated. Create a Transfer Request below.
              </p>
              <button
                onClick={() => setShowTransferInbox(false)}
                className="text-text-muted hover:text-text-primary transition-colors text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-surface"
              >
                Close
              </button>
            </div>
            <TransferInbox />
          </div>
        </div>
      )}

      {returnTarget && (
        <ReturnAssetModal
          allocation={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSuccess={() => setReturnTarget(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2 text-text-primary">
                <Trash2 size={16} className="text-rose-400" />
                <h2 className="text-sm font-semibold">Delete Asset</h2>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertTriangle size={16} className="mt-0.5 text-rose-300" />
                <div className="space-y-1 text-xs text-rose-100">
                  <p className="font-medium">This will hide the asset from active directories.</p>
                  <p>
                    Delete <span className="font-semibold">{deleteTarget.name}</span> (
                    {deleteTarget.assetTag}) only if it is no longer part of active allocations,
                    bookings, maintenance, or transfer workflows.
                  </p>
                </div>
              </div>

              {deleteMutation.isError && (
                <p className="text-xs text-rose-300">{deleteMutation.error?.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  deleteMutation.reset();
                }}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
