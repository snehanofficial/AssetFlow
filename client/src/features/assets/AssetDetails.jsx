import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  Tag,
  Hash,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Wrench,
  ArrowRightLeft,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Info,
  Pencil,
  Trash2,
  Lock,
} from 'lucide-react';
import { fetchAssetById } from './assets.api.js';
import { AssetQRTag } from './components/AssetQRTag.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  ALLOCATED: { label: 'Allocated', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  UNDER_MAINTENANCE: {
    label: 'Maintenance',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  RESERVED: {
    label: 'Reserved',
    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  LOST: { label: 'Lost', className: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  RETIRED: { label: 'Retired', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  DISPOSED: { label: 'Disposed', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
};

const TIMELINE_ICONS = {
  ALLOCATION: <User size={14} className="text-blue-400" />,
  RETURN: <RotateCcw size={14} className="text-emerald-400" />,
  MAINTENANCE: <Wrench size={14} className="text-amber-400" />,
  MAINTENANCE_RESOLVED: <CheckCircle size={14} className="text-emerald-400" />,
  TRANSFER: <ArrowRightLeft size={14} className="text-purple-400" />,
};

const TIMELINE_COLORS = {
  ALLOCATION: 'border-blue-500/30 bg-blue-500/5',
  RETURN: 'border-emerald-500/30 bg-emerald-500/5',
  MAINTENANCE: 'border-amber-500/30 bg-amber-500/5',
  MAINTENANCE_RESOLVED: 'border-emerald-500/30 bg-emerald-500/5',
  TRANSFER: 'border-purple-500/30 bg-purple-500/5',
};

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export const AssetDetails = ({ assetId, onBack, onAllocate, onReturn, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, error } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => fetchAssetById(assetId),
    enabled: !!assetId,
  });

  const asset = data?.data;
  const canManage = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-xs">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={32} className="text-rose-400" />
        <p className="text-text-primary font-medium">Asset not found</p>
        <button onClick={onBack} className="text-xs text-primary hover:underline">
          ← Back to directory
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[asset.status] ?? { label: asset.status, className: '' };
  const activeAlloc = asset.allocations?.find((a) => a.status === 'ACTIVE');
  const isLockedInAudit = Boolean(asset.isLockedInAudit);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-0.5 p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-all"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-text-primary">{asset.name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.className}`}
            >
              {statusCfg.label}
            </span>
            {isLockedInAudit && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                <Lock size={11} />
                Audit locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs font-mono text-primary font-semibold">
              <Tag size={11} />
              {asset.assetTag}
            </span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-text-secondary text-xs">{asset.category?.name}</span>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {asset.status === 'AVAILABLE' && onAllocate && (
              <button
                onClick={() => onAllocate(asset)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                <User size={12} />
                Allocate
              </button>
            )}
            {asset.status === 'ALLOCATED' && activeAlloc && onReturn && (
              <button
                onClick={() => onReturn(activeAlloc)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 rounded-lg text-xs font-semibold hover:bg-emerald-600/30 transition-all"
              >
                <RotateCcw size={12} />
                Return Asset
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(asset)}
                disabled={isLockedInAudit}
                title={isLockedInAudit ? 'Asset is locked due to active audit.' : 'Edit asset'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(asset)}
                disabled={isLockedInAudit}
                title={isLockedInAudit ? 'Asset is locked due to active audit.' : 'Delete asset'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {isLockedInAudit && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          This asset is currently included in an active audit cycle. Edit and delete actions are
          temporarily disabled.
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-border/50">
        {[
          { id: 'overview', label: 'Overview', icon: <Info size={13} /> },
          { id: 'timeline', label: 'History', icon: <Clock size={13} /> },
          { id: 'qr', label: 'QR Tag', icon: <QrCode size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {asset.photoUrl && (
              <div className="card-elevation overflow-hidden rounded-xl">
                <img src={asset.photoUrl} alt={asset.name} className="w-full h-48 object-cover" />
              </div>
            )}

            <div className="card-elevation p-5 space-y-4">
              <h2 className="text-sm font-semibold text-text-primary">Asset Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow
                  icon={<Hash size={12} />}
                  label="Serial Number"
                  value={asset.serialNumber}
                />
                <DetailRow icon={<MapPin size={12} />} label="Location" value={asset.location} />
                <DetailRow
                  icon={<Calendar size={12} />}
                  label="Acquired"
                  value={formatDate(asset.acquisitionDate)}
                />
                <DetailRow
                  icon={<DollarSign size={12} />}
                  label="Cost"
                  value={formatCurrency(asset.acquisitionCost)}
                />
                <DetailRow label="Condition" value={asset.condition} />
                <DetailRow label="Bookable" value={asset.isBookable ? 'Yes' : 'No'} />
              </div>
            </div>

            {asset.customFields && Object.keys(asset.customFields).length > 0 && (
              <div className="card-elevation p-5 space-y-4">
                <h2 className="text-sm font-semibold text-text-primary">Custom Attributes</h2>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(asset.customFields).map(([key, val]) => (
                    <DetailRow key={key} label={key} value={String(val)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card-elevation p-5 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <User size={14} className="text-text-muted" />
                Current Holder
              </h2>
              {activeAlloc ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text-primary">
                    {activeAlloc.employee?.name}
                  </p>
                  <p className="text-xs text-text-muted">{activeAlloc.employee?.email}</p>
                  <p className="text-xs text-text-muted mt-2">
                    Since {formatDate(activeAlloc.allocatedAt)}
                  </p>
                  {activeAlloc.expectedReturnAt && (
                    <p
                      className={`text-xs mt-1 ${new Date(activeAlloc.expectedReturnAt) < new Date() ? 'text-rose-400 font-medium' : 'text-text-muted'}`}
                    >
                      Return by {formatDate(activeAlloc.expectedReturnAt)}
                      {new Date(activeAlloc.expectedReturnAt) < new Date() && ' Overdue'}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">Not currently allocated</p>
              )}
            </div>

            <div className="card-elevation p-5 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Package size={14} className="text-text-muted" />
                Category
              </h2>
              <p className="text-sm text-text-primary">{asset.category?.name}</p>
              {asset.category?.customFieldsSchema?.length > 0 && (
                <p className="text-xs text-text-muted">
                  {asset.category.customFieldsSchema.length} custom field
                  {asset.category.customFieldsSchema.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card-elevation p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-5 flex items-center gap-2">
            <Clock size={14} className="text-text-muted" />
            Activity Timeline
          </h2>

          {!asset.timeline || asset.timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Clock size={32} className="text-text-muted/30" />
              <p className="text-text-muted text-sm">No historical activity recorded yet.</p>
            </div>
          ) : (
            <div className="relative space-y-3">
              <div className="absolute left-5 top-6 bottom-0 w-px bg-border/50" />

              {asset.timeline.map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-2">
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border ${TIMELINE_COLORS[event.type] ?? 'border-border bg-surface'} shrink-0`}
                  >
                    {TIMELINE_ICONS[event.type] ?? <Info size={12} className="text-text-muted" />}
                  </div>

                  <div
                    className={`flex-1 p-3 rounded-lg border ${TIMELINE_COLORS[event.type] ?? 'border-border bg-surface/30'}`}
                  >
                    <p className="text-xs font-medium text-text-primary">{event.description}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{formatDate(event.date)}</p>
                    {event.meta?.returnNotes && (
                      <p className="text-[10px] text-text-muted mt-1 italic">
                        "{event.meta.returnNotes}"
                      </p>
                    )}
                    {event.meta?.reason && (
                      <p className="text-[10px] text-text-muted mt-1 italic">
                        Reason: {event.meta.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="card-elevation p-8 flex flex-col items-center gap-6">
          <div className="text-center space-y-1">
            <h2 className="text-sm font-semibold text-text-primary">Asset QR Label</h2>
            <p className="text-xs text-text-muted">Scan to view this asset's details page</p>
          </div>

          <AssetQRTag
            assetTag={asset.assetTag}
            assetName={asset.name}
            assetId={asset.id}
            companyName="AssetFlow"
            categoryName={asset.category?.name}
            serialNumber={asset.serialNumber}
            location={asset.location}
            status={STATUS_CONFIG[asset.status]?.label ?? asset.status}
          />
        </div>
      )}
    </div>
  );
};

function DetailRow({ icon, label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-xs text-text-primary font-mono break-all">{value ?? '—'}</p>
    </div>
  );
}

export default AssetDetails;
