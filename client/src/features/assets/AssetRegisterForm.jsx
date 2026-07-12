import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Package, AlertCircle, CheckCircle, Pencil } from 'lucide-react';
import { fetchCategories, createAsset, updateAsset } from './assets.api.js';
import { useToast } from '../../components/common/Providers.jsx';

const assetSchema = z.object({
  name: z.string().min(2, 'Asset name must be at least 2 characters.').max(255),
  categoryId: z.string().uuid('Please select a valid category.'),
  serialNumber: z.string().min(1, 'Serial number is required.').max(255),
  location: z.string().min(1, 'Location is required.').max(255),
  acquisitionDate: z.string().min(1, 'Acquisition date is required.'),
  acquisitionCost: z.string().optional(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR'], { required_error: 'Condition is required.' }),
  isBookable: z.boolean().default(false),
});

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

function formatDateInput(date) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

export const AssetRegisterForm = ({ asset = null, onClose, onSuccess }) => {
  const isEditMode = Boolean(asset?.id);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(asset?.photoUrl ?? null);
  const [fileError, setFileError] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState(asset?.customFields ?? {});
  const [customFieldErrors, setCustomFieldErrors] = useState({});

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: asset?.name ?? '',
      categoryId: asset?.categoryId ?? '',
      serialNumber: asset?.serialNumber ?? '',
      location: asset?.location ?? '',
      acquisitionDate: formatDateInput(asset?.acquisitionDate),
      acquisitionCost:
        asset?.acquisitionCost !== null && asset?.acquisitionCost !== undefined
          ? String(asset.acquisitionCost)
          : '',
      condition: asset?.condition ?? 'GOOD',
      isBookable: asset?.isBookable ?? false,
    },
  });

  const watchedCategoryId = useWatch({ control, name: 'categoryId' });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(
    () => categoriesData?.data?.records ?? categoriesData?.data ?? [],
    [categoriesData]
  );

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === watchedCategoryId) ?? null,
    [categories, watchedCategoryId]
  );

  const mutation = useMutation({
    mutationFn: async (formData) => {
      if (isEditMode) {
        return updateAsset(asset.id, formData);
      }
      return createAsset(formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (data?.data?.id) {
        queryClient.invalidateQueries({ queryKey: ['asset', data.data.id] });
      }
      showToast(
        isEditMode
          ? `Asset "${data.data.name}" updated successfully.`
          : `Asset "${data.data.name}" (${data.data.assetTag}) registered successfully!`,
        'success'
      );
      onSuccess?.(data.data);
      onClose?.();
    },
    onError: (err) => {
      showToast(err.message || `Failed to ${isEditMode ? 'update' : 'register'} asset.`, 'error');
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      setFilePreview(asset?.photoUrl ?? null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFileError('Only image files are allowed.');
      setSelectedFile(null);
      setFilePreview(asset?.photoUrl ?? null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be under 5MB.');
      setSelectedFile(null);
      setFilePreview(asset?.photoUrl ?? null);
      return;
    }
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const validateCustomFields = () => {
    const schema = selectedCategory?.customFieldsSchema ?? [];
    const errs = {};
    let valid = true;

    for (const field of schema) {
      const val = customFieldValues[field.name];
      if (field.required && (val === undefined || val === null || val === '')) {
        errs[field.name] = `${field.name} is required.`;
        valid = false;
      }
    }

    setCustomFieldErrors(errs);
    return valid;
  };

  const onSubmit = async (formData) => {
    if (!validateCustomFields()) return;

    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('categoryId', formData.categoryId);
    fd.append('serialNumber', formData.serialNumber);
    fd.append('location', formData.location);
    fd.append('acquisitionDate', formData.acquisitionDate);
    if (formData.acquisitionCost) fd.append('acquisitionCost', formData.acquisitionCost);
    fd.append('condition', formData.condition);
    fd.append('isBookable', String(formData.isBookable));
    fd.append('customFields', JSON.stringify(customFieldValues));
    if (selectedFile) fd.append('photo', selectedFile);

    await mutation.mutateAsync(fd);
  };

  const customSchema = selectedCategory?.customFieldsSchema ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Pencil size={18} className="text-primary" />
            ) : (
              <Package size={18} className="text-primary" />
            )}
            <h2 className="text-base font-semibold text-text-primary">
              {isEditMode ? 'Edit Asset' : 'Register New Asset'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                Core Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Asset Name" error={errors.name?.message} required>
                  <input
                    {...register('name')}
                    placeholder="e.g. MacBook Pro 16"
                    className={inputClass(errors.name)}
                  />
                </FormField>

                <FormField label="Category" error={errors.categoryId?.message} required>
                  <select {...register('categoryId')} className={inputClass(errors.categoryId)}>
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Serial Number" error={errors.serialNumber?.message} required>
                  <input
                    {...register('serialNumber')}
                    placeholder="e.g. C02XYZABC123"
                    className={inputClass(errors.serialNumber)}
                    spellCheck={false}
                  />
                </FormField>

                <FormField label="Location" error={errors.location?.message} required>
                  <input
                    {...register('location')}
                    placeholder="e.g. Floor 3, Room 302"
                    className={inputClass(errors.location)}
                  />
                </FormField>

                <FormField
                  label="Acquisition Date"
                  error={errors.acquisitionDate?.message}
                  required
                >
                  <input
                    type="date"
                    {...register('acquisitionDate')}
                    className={inputClass(errors.acquisitionDate)}
                  />
                </FormField>

                <FormField label="Acquisition Cost (USD)" error={errors.acquisitionCost?.message}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('acquisitionCost')}
                    placeholder="e.g. 2499.99"
                    className={inputClass(errors.acquisitionCost)}
                  />
                </FormField>

                <FormField label="Condition" error={errors.condition?.message} required>
                  <select {...register('condition')} className={inputClass(errors.condition)}>
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Shared / Bookable">
                  <label className="mt-1 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('isBookable')}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-xs text-text-secondary">
                      Allow employees to book this asset
                    </span>
                  </label>
                </FormField>
              </div>
            </div>

            {customSchema.length > 0 && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                    {selectedCategory?.name}
                  </span>
                  Custom Attributes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {customSchema.map((field) => (
                    <FormField
                      key={field.name}
                      label={field.name}
                      error={customFieldErrors[field.name]}
                      required={field.required}
                    >
                      {field.type === 'boolean' ? (
                        <select
                          value={
                            customFieldValues[field.name] === true
                              ? 'true'
                              : customFieldValues[field.name] === false
                                ? 'false'
                                : ''
                          }
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.name]: e.target.value === 'true',
                            }))
                          }
                          className={inputClass(customFieldErrors[field.name])}
                        >
                          <option value="">Select...</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={customFieldValues[field.name] ?? ''}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.name]:
                                field.type === 'number'
                                  ? e.target.value === ''
                                    ? ''
                                    : Number(e.target.value)
                                  : e.target.value,
                            }))
                          }
                          placeholder={field.type === 'number' ? '0' : `Enter ${field.name}...`}
                          className={inputClass(customFieldErrors[field.name])}
                        />
                      )}
                    </FormField>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Photo {isEditMode ? '(Upload to replace current image)' : '(Optional)'}
              </h3>
              <div
                className={`relative rounded-xl border-2 border-dashed p-6 transition-all ${
                  fileError ? 'border-rose-500/40' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                {filePreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-primary">
                        {selectedFile?.name ?? 'Current asset photo'}
                      </p>
                      {selectedFile && (
                        <p className="text-[10px] text-text-muted">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      <label className="mt-1 inline-flex cursor-pointer text-[10px] text-primary transition-colors hover:text-primary/80">
                        Replace image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <Upload size={20} className="text-text-muted" />
                    <span className="text-center text-xs text-text-muted">
                      Drop an image here or{' '}
                      <span className="text-primary underline">click to browse</span>
                    </span>
                    <span className="text-[10px] text-text-muted">PNG, JPG, WEBP - max 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
              {fileError && (
                <p className="flex items-center gap-1 text-xs text-rose-400">
                  <AlertCircle size={11} />
                  {fileError}
                </p>
              )}
            </div>

            {mutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-rose-400" />
                <p className="text-xs text-rose-300">{mutation.error?.message}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border bg-background px-6 py-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isEditMode ? 'Saving...' : 'Registering...'}
                </>
              ) : (
                <>
                  <CheckCircle size={13} />
                  {isEditMode ? 'Save Changes' : 'Register Asset'}
                </>
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

function FormField({ label, children, error, required }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-0.5 text-xs font-medium text-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[10px] text-rose-400">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  );
}

export default AssetRegisterForm;
