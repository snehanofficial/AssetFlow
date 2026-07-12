import { useState } from 'react';
import { AssetList } from './AssetList.jsx';
import { AssetDetails } from './AssetDetails.jsx';
import { AssetRegisterForm } from './AssetRegisterForm.jsx';
import { AllocationForm } from '../allocation/AllocationForm.jsx';
import { ReturnAssetModal } from '../allocation/ReturnAssetModal.jsx';
import { TransferInbox } from '../allocation/TransferInbox.jsx';

/**
 * Assets Page
 * Orchestrates routing between AssetList, AssetDetails, and modals.
 */
export const AssetsPage = () => {
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [allocationTarget, setAllocationTarget] = useState(null); // { id, name, assetTag }
  const [returnTarget, setReturnTarget] = useState(null); // allocation record
  const [showTransferInbox, setShowTransferInbox] = useState(false);

  const handleViewDetail = (assetId) => {
    setSelectedAssetId(assetId);
    setView('detail');
  };

  const handleAllocate = (asset) => {
    setAllocationTarget(asset);
  };

  const handleReturn = (allocation) => {
    setReturnTarget(allocation);
  };

  return (
    <div>
      {view === 'list' && (
        <AssetList onRegister={() => setShowRegister(true)} onViewDetail={handleViewDetail} />
      )}

      {view === 'detail' && selectedAssetId && (
        <AssetDetails
          assetId={selectedAssetId}
          onBack={() => {
            setView('list');
            setSelectedAssetId(null);
          }}
          onAllocate={handleAllocate}
          onReturn={handleReturn}
        />
      )}

      {/* Register modal */}
      {showRegister && (
        <AssetRegisterForm
          onClose={() => setShowRegister(false)}
          onSuccess={(asset) => handleViewDetail(asset.id)}
        />
      )}

      {/* Allocation modal */}
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

      {/* Transfer Inbox — shown when user is redirected from a double-allocation error */}
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

      {/* Return modal */}
      {returnTarget && (
        <ReturnAssetModal
          allocation={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSuccess={() => setReturnTarget(null)}
        />
      )}
    </div>
  );
};

export default AssetsPage;
