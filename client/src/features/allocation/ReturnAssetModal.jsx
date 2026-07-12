import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, RotateCcw, AlertCircle, Package } from 'lucide-react';
import { returnAsset } from './allocation.api.js';
import { useToast } from '../../components/common/Providers.jsx';

const returnSchema = z.object({
  returnCondition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR'], {
    required_error: 'Please select return condition.',
  }),
  returnNotes: z.string().trim().min(1, 'Return notes are required.'),
});

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New', description: 'No wear, pristine condition' },
  { value: 'GOOD', label: 'Good', description: 'Minor wear, fully functional' },
  { value: 'FAIR', label: 'Fair', description: 'Noticeable wear, functional' },
  { value: 'POOR', label: 'Poor', description: 'Significant damage — will require maintenance' },
];

/**
 * ReturnAssetModal
 * Check-in dialog for returning an allocated asset.
 *
 * @param {Object} props
 * @param {Object} props.allocation - The active AssetAllocation record
 * @param {Function} props.onClose
 * @param {Function} [props.onSuccess]
 */
export const ReturnAssetModal = ({ allocation, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      returnCondition: 'GOOD',
      returnNotes: '',
    },
  });

  const watchedCondition = watch('returnCondition');

  const mutation = useMutation({
    mutationFn: ({ id, data }) => returnAsset(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      showToast('Asset returned successfully!', 'success');
      onSuccess?.(data.data);
      onClose?.();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to process return.', 'error');
    },
  });

  const onSubmit = async (formData) => {
    await mutation.mutateAsync({ id: allocation.id, data: formData });
  };

  const isPoorCondition = watchedCondition === 'POOR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-text-primary">Return Asset</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Asset summary */}
          <div className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg border border-border/50">
            <Package size={16} className="text-text-muted flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-primary">{allocation.asset?.name}</p>
              <p className="text-[10px] text-primary font-mono font-semibold">
                {allocation.asset?.assetTag}
              </p>
              <p className="text-[10px] text-text-muted">
                Checked out by: {allocation.employee?.name}
              </p>
            </div>
          </div>

          {/* Return condition */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">
              Return Condition <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`relative flex flex-col p-2.5 rounded-lg border cursor-pointer transition-all ${
                    watchedCondition === opt.value
                      ? opt.value === 'POOR'
                        ? 'border-rose-500/50 bg-rose-500/10'
                        : 'border-primary/50 bg-primary/10'
                      : 'border-border hover:border-border/80 hover:bg-surface/30'
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('returnCondition')}
                    className="sr-only"
                  />
                  <span
                    className={`text-xs font-semibold ${
                      watchedCondition === opt.value
                        ? opt.value === 'POOR'
                          ? 'text-rose-300'
                          : 'text-primary'
                        : 'text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-text-muted leading-tight mt-0.5">
                    {opt.description}
                  </span>
                </label>
              ))}
            </div>
            {errors.returnCondition && <FieldError msg={errors.returnCondition.message} />}
          </div>

          {/* Poor condition warning */}
          {isPoorCondition && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Asset will be automatically set to <strong>Under Maintenance</strong> status upon
                return due to poor condition.
              </p>
            </div>
          )}

          {/* Return notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Return Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              {...register('returnNotes')}
              rows={3}
              placeholder="Describe the condition of the returned asset, any damage, accessories included, etc."
              className={`w-full bg-background border ${errors.returnNotes ? 'border-rose-500/50' : 'border-border'} rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none transition-all`}
            />
            {errors.returnNotes && <FieldError msg={errors.returnNotes.message} />}
          </div>

          {/* Generic error */}
          {mutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle size={13} className="text-rose-400" />
              <p className="text-xs text-rose-300">{mutation.error?.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-secondary border border-border rounded-lg hover:bg-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw size={12} />
                  Confirm Return
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function FieldError({ msg }) {
  return (
    <p className="flex items-center gap-1 text-[10px] text-rose-400">
      <AlertCircle size={10} />
      {msg}
    </p>
  );
}

export default ReturnAssetModal;
