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
  X,
} from 'lucide-react';
import { fetchAssets, fetchCategories } from './assets.api.js';
import apiFetch from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { AssetStatusBadge } from '../../components/ui/Badge.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState, FilterEmptyState } from '../../components/ui/EmptyState.jsx';
import { Button } from '../../components/ui/Button.jsx';

const CONDITION_LABELS = {
  NEW: { label: 'New', className: 'text-[hsl(var(--success))]' },
  GOOD: { label: 'Good', className: 'text-[hsl(var(--info))]' },
  FAIR: { label: 'Fair', className: 'text-[hsl(var(--warning))]' },
  POOR: { label: 'Poor', className: 'text-[hsl(var(--danger))]' },
};

const ALL_STATUSES = [
  'AVAILABLE',
  'ALLOCATED',
  'UNDER_MAINTENANCE',
  'RESERVED',
  'LOST',
  'RETIRED',
  'DISPOSED',
];

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  UNDER_MAINTENANCE: 'Maintenance',
  RESERVED: 'Reserved',
  LOST: 'Lost',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed',
};

// ─── Table column headers ─────────────────────────────────────────────────────
const COLUMNS = ['Tag', 'Asset', 'Category', 'Location', 'Status', 'Condition', 'Holder'];

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

  const hasActiveFilters =
    debouncedSearch || selectedStatus || selectedCategory || selectedDepartment;

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(window._assetSearchTimer);
    window._assetSearchTimer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedDepartment('');
    setPage(1);
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
    placeholderData: (prev) => prev,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-flat'],
    queryFn: () => apiFetch('/organization/departments'),
    staleTime: 5 * 60_000,
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
    <div className="space-y-5">
      {/* ── Header ── */}
      <PageHeader
        title="Asset Directory"
        description={
          total > 0
            ? `${total.toLocaleString()} asset${total !== 1 ? 's' : ''} registered`
            : undefined
        }
        icon={Package}
      >
        <button
          onClick={() => refetch()}
          className="
            w-8 h-8 flex items-center justify-center rounded-lg
            border border-[hsl(var(--border))]
            text-[hsl(var(--text-secondary))]
            hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))]
            transition-colors duration-100 cursor-pointer
          "
          aria-label="Refresh asset list"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>
        {canRegister && (
          <Button variant="primary" size="sm" onClick={onRegister}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Register Asset
          </Button>
        )}
      </PageHeader>

      {/* ── Filter toolbar ── */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--text-muted))] pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tag, serial, name, location…"
              aria-label="Search assets"
              className="
                w-full h-8 pl-8 pr-3
                bg-[hsl(var(--background))] border border-[hsl(var(--border))]
                rounded-lg text-xs text-[hsl(var(--text-primary))]
                placeholder:text-[hsl(var(--text-muted))]
                focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))]
                transition-all duration-100
              "
            />
          </div>

          <span
            className="flex items-center gap-1 text-[hsl(var(--text-muted))] text-xs"
            aria-hidden="true"
          >
            <Filter className="w-3.5 h-3.5" />
          </span>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="
              h-8 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))]
              rounded-lg text-xs text-[hsl(var(--text-primary))]
              focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
              transition-all duration-100 cursor-pointer
            "
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
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
            aria-label="Filter by category"
            className="
              h-8 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))]
              rounded-lg text-xs text-[hsl(var(--text-primary))]
              focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
              transition-all duration-100 cursor-pointer
            "
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Department filter */}
          {(user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER') && departments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by department"
              className="
                h-8 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))]
                rounded-lg text-xs text-[hsl(var(--text-primary))]
                focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
                transition-all duration-100 cursor-pointer
              "
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="
                flex items-center gap-1
                h-8 px-2.5 rounded-lg text-xs font-medium
                text-[hsl(var(--text-muted))] hover:text-[hsl(var(--danger))]
                hover:bg-[hsl(var(--danger)/0.06)]
                transition-colors duration-100 cursor-pointer
              "
              aria-label="Clear all filters"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <SkeletonTable rows={8} columns={COLUMNS.length} columnLabels={COLUMNS} />
      ) : (
        <div
          className="card overflow-hidden"
          aria-busy={isFetching}
          aria-label="Asset directory table"
        >
          {records.length === 0 ? (
            hasActiveFilters ? (
              <FilterEmptyState onClear={clearFilters} />
            ) : (
              <EmptyState
                icon={Package}
                title="No assets registered yet"
                description="Register your organization's physical assets to start tracking custody, condition, and location."
              >
                {canRegister && (
                  <Button variant="primary" size="sm" onClick={onRegister}>
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Register First Asset
                  </Button>
                )}
              </EmptyState>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Asset Directory">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))]">
                    {COLUMNS.map((col) => (
                      <th key={col} scope="col" className="table-header-cell">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                  {records.map((asset) => {
                    const conditionCfg = CONDITION_LABELS[asset.condition];
                    const activeAlloc = asset.allocations?.[0];

                    return (
                      <tr
                        key={asset.id}
                        onClick={() => handleRowClick(asset.id)}
                        className="
                          hover:bg-[hsl(var(--surface-hover)/0.60)]
                          transition-colors duration-100
                          cursor-pointer group
                        "
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${asset.name}`}
                        onKeyDown={(e) => e.key === 'Enter' && handleRowClick(asset.id)}
                      >
                        {/* Tag */}
                        <td className="table-cell">
                          <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[hsl(var(--primary))]">
                            <Tag className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            {asset.assetTag}
                          </span>
                        </td>
                        {/* Asset name + serial */}
                        <td className="table-cell">
                          <div>
                            <p className="text-xs font-medium text-[hsl(var(--text-primary))] group-hover:text-[hsl(var(--primary))] transition-colors duration-100 truncate max-w-[200px]">
                              {asset.name}
                            </p>
                            {asset.serialNumber && (
                              <p className="text-[10px] font-mono text-[hsl(var(--text-muted))] mt-0.5">
                                {asset.serialNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        {/* Category */}
                        <td className="table-cell">
                          <span className="text-xs text-[hsl(var(--text-secondary))]">
                            {asset.category?.name ?? '—'}
                          </span>
                        </td>
                        {/* Location */}
                        <td className="table-cell">
                          <span className="text-xs text-[hsl(var(--text-secondary))] truncate block max-w-[120px]">
                            {asset.location || '—'}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="table-cell">
                          <AssetStatusBadge status={asset.status} />
                        </td>
                        {/* Condition */}
                        <td className="table-cell">
                          <span
                            className={`text-xs font-medium ${conditionCfg?.className ?? 'text-[hsl(var(--text-secondary))]'}`}
                          >
                            {conditionCfg?.label ?? asset.condition ?? '—'}
                          </span>
                        </td>
                        {/* Holder */}
                        <td className="table-cell">
                          {activeAlloc ? (
                            <div>
                              <p className="text-xs text-[hsl(var(--text-primary))] font-medium truncate max-w-[140px]">
                                {activeAlloc.employee?.name}
                              </p>
                              <p className="text-[10px] text-[hsl(var(--text-muted))] truncate max-w-[140px]">
                                {activeAlloc.employee?.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-[hsl(var(--text-muted))]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border-subtle))]">
              <p className="text-xs text-[hsl(var(--text-muted))]">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}{' '}
                assets
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="
                    w-7 h-7 flex items-center justify-center
                    rounded border border-[hsl(var(--border))]
                    text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))]
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-100 cursor-pointer
                  "
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="text-xs text-[hsl(var(--text-secondary))] px-2 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="
                    w-7 h-7 flex items-center justify-center
                    rounded border border-[hsl(var(--border))]
                    text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))]
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-100 cursor-pointer
                  "
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetList;
