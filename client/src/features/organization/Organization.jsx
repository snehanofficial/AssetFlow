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
        <h1 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Network className="w-6 h-6 text-indigo-500" />
          Organization Hierarchy
        </h1>
        <p className="text-slate-400 text-xs">
          View organizational tree structure, departments, and active leadership.
        </p>
      </div>

      {isLoading ? (
        <div className="card-elevation p-12 flex flex-col items-center justify-center space-y-4 h-96">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs">Loading hierarchy graph...</span>
        </div>
      ) : isError ? (
        <div className="card-elevation p-12 flex flex-col items-center justify-center text-center space-y-4 h-96 border-rose-900/50 bg-rose-950/15">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <h3 className="text-lg font-semibold text-rose-200">Error Loading Hierarchy</h3>
          <p className="text-slate-400 text-xs max-w-sm">
            {error?.message || 'An unexpected error occurred while fetching department tree.'}
          </p>
        </div>
      ) : departments.length === 0 ? (
        <div className="card-elevation p-12 flex flex-col items-center justify-center text-center space-y-4 h-96">
          <Users className="w-12 h-12 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-300">No departments found</h3>
          <p className="text-slate-500 text-xs max-w-sm">
            Configure your corporate structure in the System Administration settings.
          </p>
        </div>
      ) : (
        <div className="card-elevation p-6 bg-slate-900/20 space-y-6">
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-3">
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
        className="flex items-center gap-4 p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        style={{ marginLeft: `${level * 1.5}rem` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-center w-6 h-6">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{node.name}</span>
            {node.status === 'INACTIVE' && (
              <span className="px-2 py-0.5 rounded text-xxs font-medium bg-rose-950/40 text-rose-400 border border-rose-900/50">
                Inactive
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
            {node.head ? (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Head: {node.head.name}</span>
              </div>
            ) : (
              <span className="text-slate-600 text-xxs italic">No leader assigned</span>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-2 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-slate-800">
          {node.children.map((child) => (
            <DepartmentTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Organization;
