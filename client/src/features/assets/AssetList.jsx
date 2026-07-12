import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { fetchAssets, fetchCategories } from './assets.api.js';
import apiFetch from '../../utils/api.js';
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

const CONDITION_LABELS = { NEW: 'New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' };

const ALL_STATUSES = [
  'AVAILABLE',
  'ALLOCATED',
  'UNDER_MAINTENANCE',
  'RESERVED',
  'LOST',
  'RETIRED',
  'DISPOSED',
];

export const AssetList = ({ onRegister, onViewDetail }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Debounce search
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(window._assetSearchTimer);
    window._assetSearchTimer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const {
    data: assetsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      'assets',
      {
        page,
        limit,
        search: debouncedSearch,
        status: selectedStatus,
        categoryId: selectedCategory,
        departmentId: selectedDepartment,
      },
    ],
    queryFn: () =>
      fetchAssets({
        page,
        limit,
        search: debouncedSearch,
        status: selectedStatus,
        categoryId: selectedCategory,
        departmentId: selectedDepartment,
      }),
    keepPreviousData: true,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Departments for filter — Admin/Asset Manager only (DEPT_HEAD is auto-scoped server-side)
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-flat'],
    queryFn: () => apiFetch('/organization/departments'),
    staleTime: 5 * 60 * 1000,
    enabled: user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER',
  });

  const records = assetsData?.data?.records ?? [];
  const total = assetsData?.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const categories = categoriesData?.data?.records ?? categoriesData?.data ?? [];
  const departments = departmentsData?.data?.records ?? departmentsData?.data ?? [];

  const canRegister = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  const handleRowClick = (assetId) => {
    if (onViewDetail) {
      onViewDetail(assetId);
    } else {
      navigate(`/assets/${assetId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Package size={24} className="text-primary" />
            Asset Directory
          </h1>
          <p className="text-text-secondary text-xs">
            {total > 0 ? `${total} asset${total !== 1 ? 's' : ''} registered` : 'No assets yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
          {canRegister && (
            <button
              onClick={onRegister}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={14} />
              Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevation p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by tag, serial, name, location..."
              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          <Filter size={13} className="text-text-muted" />

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s]?.label ?? s}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Department filter — Admin/Asset Manager only */}
          {(user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER') && departments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}

          {(selectedStatus || selectedCategory || selectedDepartment || debouncedSearch) && (
            <button
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setSelectedStatus('');
                setSelectedCategory('');
                setSelectedDepartment('');
                setPage(1);
              }}
              className="text-xs text-text-muted hover:text-primary transition-colors px-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-elevation overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-text-muted text-xs">Loading assets...</p>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Package size={40} className="text-text-muted/30" />
            <p className="text-text-muted text-sm font-medium">No assets found</p>
            <p className="text-text-muted text-xs">
              {debouncedSearch || selectedStatus || selectedCategory
                ? 'Try adjusting your filters'
                : canRegister
                  ? 'Register your first asset to get started'
                  : 'No assets are available to view'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-surface/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Tag
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Asset
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Condition
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Holder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {records.map((asset) => {
                  const statusCfg = STATUS_CONFIG[asset.status] ?? {
                    label: asset.status,
                    className: 'bg-zinc-500/20 text-zinc-400',
                  };
                  const activeAlloc = asset.allocations?.[0];
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => handleRowClick(asset.id)}
                      className="hover:bg-surface/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-mono text-primary font-semibold">
                          <Tag size={11} />
                          {asset.assetTag}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-text-primary group-hover:text-primary transition-colors">
                            {asset.name}
                          </p>
                          <p className="text-[10px] text-text-muted font-mono">
                            {asset.serialNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">
                          {asset.category?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary truncate max-w-32 block">
                          {asset.location}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">
                          {CONDITION_LABELS[asset.condition] ?? asset.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {activeAlloc ? (
                          <div>
                            <p className="text-xs text-text-primary">
                              {activeAlloc.employee?.name}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {activeAlloc.employee?.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-text-muted">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-border text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-text-secondary px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-border text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetList;
