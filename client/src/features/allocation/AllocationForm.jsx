import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Package, Calendar, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { createAllocation } from './allocation.api.js';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';

const allocationSchema = z.object({
  assetId: z.string().uuid('Please select an asset.'),
  employeeId: z.string().uuid('Please select an employee.'),
  expectedReturnAt: z.string().optional().nullable(),
});

/**
 * AllocationForm
 * Wizard-style form for allocating an asset to an employee.
 * Supports pre-filling the asset when launched from the asset directory.
 *
 * @param {Object} props
 * @param {Object} [props.preselectedAsset] - Pre-fill asset field { id, name, assetTag }
 * @param {Function} props.onClose
 * @param {Function} props.onTransferRequest - Called when double-allocation is detected
 */
export const AllocationForm = ({ preselectedAsset, onClose, onSuccess, onTransferRequest }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      assetId: preselectedAsset?.id ?? '',
      employeeId: '',
      expectedReturnAt: '',
    },
  });

  useEffect(() => {
    if (preselectedAsset?.id) {
      setValue('assetId', preselectedAsset.id);
    }
  }, [preselectedAsset, setValue]);

  const watchedEmployeeId = watch('employeeId');

  // Fetch all available assets for the asset selector
  const { data: assetsData } = useQuery({
    queryKey: ['assets', { status: 'AVAILABLE', limit: 100 }],
    queryFn: () => apiFetch('/assets?status=AVAILABLE&limit=100'),
    enabled: !preselectedAsset,
  });
  const availableAssets = assetsData?.data?.records ?? [];

  // Fetch active employees for the employee selector
  const { data: employeesData } = useQuery({
    queryKey: ['employees', { status: 'ACTIVE' }],
    queryFn: () => apiFetch('/organization/employees?status=ACTIVE&limit=200'),
  });
  const employees = employeesData?.data?.records ?? employeesData?.data ?? [];

  // Get department info from selected employee
  const selectedEmployee = employees.find((e) => e.id === watchedEmployeeId);

  const mutation = useMutation({
    mutationFn: createAllocation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      showToast('Asset allocated successfully!', 'success');
      onSuccess?.(data.data);
      onClose?.();
    },
    onError: (err) => {
      // Handled below — do NOT show toast for ASSET_ALREADY_ALLOCATED
      if (err.code !== 'ASSET_ALREADY_ALLOCATED') {
        showToast(err.message || 'Failed to allocate asset.', 'error');
      }
    },
  });

  const onSubmit = (formData) => {
    mutation.mutate({
      assetId: formData.assetId,
      employeeId: formData.employeeId,
      expectedReturnAt: formData.expectedReturnAt || null,
    });
  };

  const isDoubleAllocation = mutation.isError && mutation.error?.code === 'ASSET_ALREADY_ALLOCATED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Allocate Asset</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Asset selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <Package size={12} />
              Asset <span className="text-rose-400">*</span>
            </label>
            {preselectedAsset ? (
              <div className="px-3 py-2 bg-surface rounded-lg border border-border text-xs text-text-primary">
                <span className="text-primary font-mono font-semibold">
                  {preselectedAsset.assetTag}
                </span>
                {' — '}
                {preselectedAsset.name}
              </div>
            ) : (
              <select {...register('assetId')} className={inputClass(errors.assetId)}>
                <option value="">Select an available asset...</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.name}
                  </option>
                ))}
              </select>
            )}
            {errors.assetId && <FieldError msg={errors.assetId.message} />}
          </div>

          {/* Employee selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <User size={12} />
              Employee <span className="text-rose-400">*</span>
            </label>
            <select {...register('employeeId')} className={inputClass(errors.employeeId)}>
              <option value="">Select an employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
            {errors.employeeId && <FieldError msg={errors.employeeId.message} />}
          </div>

          {/* Auto-filled department (read-only) */}
          {selectedEmployee?.department?.name && (
            <div className="px-3 py-2 bg-surface/50 rounded-lg border border-border/50 text-xs text-text-muted">
              Department:{' '}
              <span className="text-text-primary font-medium">
                {selectedEmployee.department.name}
              </span>
            </div>
          )}

          {/* Expected return date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <Calendar size={12} />
              Expected Return Date
              <span className="text-text-muted text-[10px] ml-1">(optional)</span>
            </label>
            <input
              type="date"
              {...register('expectedReturnAt')}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              className={inputClass(errors.expectedReturnAt)}
            />
          </div>

          {/* Double allocation error with transfer CTA */}
          {isDoubleAllocation && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">{mutation.error?.message}</p>
              </div>
              {onTransferRequest && (
                <button
                  type="button"
                  onClick={() => {
                    onTransferRequest({ assetId: watch('assetId') });
                    onClose?.();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-all"
                >
                  <ArrowRightLeft size={12} />
                  Request Transfer Instead
                </button>
              )}
            </div>
          )}

          {/* Generic error */}
          {mutation.isError && !isDoubleAllocation && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle size={13} className="text-rose-400" />
              <p className="text-xs text-rose-300">{mutation.error?.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-secondary border border-border rounded-lg hover:bg-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Allocating...
                </>
              ) : (
                'Allocate Asset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function inputClass(error) {
  return `w-full bg-background border ${error ? 'border-rose-500/50' : 'border-border'} rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all`;
}

function FieldError({ msg }) {
  return (
    <p className="flex items-center gap-1 text-[10px] text-rose-400">
      <AlertCircle size={10} />
      {msg}
    </p>
  );
}

export default AllocationForm;
