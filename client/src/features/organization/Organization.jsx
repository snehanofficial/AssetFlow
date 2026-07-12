import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../utils/api.js';
import { ChevronDown, ChevronRight, User, Users, Network, AlertTriangle } from 'lucide-react';
import { useToast } from '../../components/common/Providers.jsx';

export const Organization = () => {
  const { showToast } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['departments', 'tree'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/organization/departments?tree=true');
        return res;
      } catch (err) {
        showToast(err.message || 'Failed to load organization tree.', 'error');
        throw err;
      }
    },
  });

  const departments = data?.data?.records || [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Network className="w-6 h-6 text-primary" />
          Organization Hierarchy
        </h1>
        <p className="text-text-secondary text-xs">
          View organizational tree structure, departments, and active leadership.
        </p>
      </div>

      {isLoading ? (
        <div className="card-elevation p-12 flex flex-col items-center justify-center space-y-4 h-96">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-secondary text-xs">Loading hierarchy graph...</span>
        </div>
      ) : isError ? (
        <div className="card-elevation p-12 flex flex-col items-center justify-center text-center space-y-4 h-96 border-destructive/30 bg-destructive/10">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Error Loading Hierarchy</h3>
          <p className="text-text-secondary text-xs max-w-sm">
            {error?.message || 'An unexpected error occurred while fetching department tree.'}
          </p>
        </div>
      ) : departments.length === 0 ? (
        <div className="card-elevation p-12 flex flex-col items-center justify-center text-center space-y-4 h-96">
          <Users className="w-12 h-12 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">No departments found</h3>
          <p className="text-text-secondary text-xs max-w-sm">
            Configure your corporate structure in the System Administration settings.
          </p>
        </div>
      ) : (
        <div className="card-elevation p-6 bg-surface/50 space-y-6">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-border pb-3">
            Corporate Tree View
          </div>
          <div className="max-w-4xl space-y-4">
            {departments.map((dept) => (
              <DepartmentTreeNode key={dept.id} node={dept} level={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DepartmentTreeNode = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-2 select-none">
      <div
        className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border hover:border-border-focus transition-all cursor-pointer"
        style={{ marginLeft: `${level * 1.5}rem` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-center w-6 h-6">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            )
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{node.name}</span>
            {node.status === 'INACTIVE' && (
              <span className="px-2 py-0.5 rounded text-xxs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                Inactive
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-text-secondary">
            {node.head ? (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Head: {node.head.name}</span>
              </div>
            ) : (
              <span className="text-text-muted text-xxs italic">No leader assigned</span>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-2 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-border">
          {node.children.map((child) => (
            <DepartmentTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Organization;
