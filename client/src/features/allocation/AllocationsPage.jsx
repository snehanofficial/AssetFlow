import { useState } from 'react';
import { AllocationList } from './AllocationList.jsx';
import { AllocationForm } from './AllocationForm.jsx';
import { ReturnAssetModal } from './ReturnAssetModal.jsx';
import { TransferInbox } from './TransferInbox.jsx';

/**
 * AllocationsPage
 * Tab-based orchestrator for Allocations and Transfers sub-features.
 */
export const AllocationsPage = () => {
  const [activeTab, setActiveTab] = useState('allocations');
  const [showAllocate, setShowAllocate] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null); // { assetId }

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-1 border-b border-border/50">
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'allocations'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Allocations
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === 'transfers'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Transfer Requests
        </button>

        {/* Allocate Asset button — only visible on Allocations tab */}
        {activeTab === 'allocations' && (
          <button
            onClick={() => setShowAllocate(true)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            + Allocate Asset
          </button>
        )}
      </div>

      {activeTab === 'allocations' && (
        <AllocationList
          onReturn={(allocation) => setReturnTarget(allocation)}
          onTransfer={(allocation) => setTransferTarget({ assetId: allocation.assetId })}
        />
      )}

      {activeTab === 'transfers' && <TransferInbox />}

      {/* Modals */}
      {showAllocate && (
        <AllocationForm
          onClose={() => setShowAllocate(false)}
          onSuccess={() => setShowAllocate(false)}
          onTransferRequest={() => {
            setShowAllocate(false);
            setActiveTab('transfers');
          }}
        />
      )}

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

export default AllocationsPage;
