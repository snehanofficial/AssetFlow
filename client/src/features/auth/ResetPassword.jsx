import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';

export const ResetPassword = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [submitting, setSubmitting] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  // Password requirements state
  const [checks, setChecks] = useState({
    length: false,
    number: false,
    special: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password', '');

  useEffect(() => {
    setPasswordValue(watchedPassword);
    setChecks({
      length: watchedPassword.length >= 8,
      number: /\d/.test(watchedPassword),
      special: /[^a-zA-Z0-9]/.test(watchedPassword),
    });
  }, [watchedPassword]);

  const onSubmit = async (data) => {
    if (!token) {
      showToast('Reset token is missing from the URL.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: {
          token,
          password: data.password,
        },
      });
      showToast('Password updated successfully. Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-text-primary">Invalid Link</h2>
          <p className="text-text-secondary text-xs">
            This password recovery link is missing its authentication token or is invalid.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/forgot-password"
            className="inline-block bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm py-2 px-4 rounded-md transition-all"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-text-primary">New Password</h2>
        <p className="text-text-secondary text-xs">
          Create a secure, strong password for your AssetFlow account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div className="space-y-1">
          <label className="text-text-secondary text-xs font-medium" htmlFor="password-input">
            New Password
          </label>
          <input
            id="password-input"
            type="password"
            className={`w-full bg-background border rounded-md px-3 py-2 text-sm text-text-primary focus:outline ${
              errors.password
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-primary'
            }`}
            placeholder="••••••••"
            disabled={submitting}
            {...register('password', {
              required: 'Password is required.',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters.',
              },
              validate: {
                hasNumber: (value) =>
                  /\d/.test(value) || 'Password must contain at least 1 number.',
                hasSpecial: (value) =>
                  /[^a-zA-Z0-9]/.test(value) ||
                  'Password must contain at least 1 special character.',
              },
            })}
          />
          {errors.password && (
            <p className="text-destructive text-xxs font-medium mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Real-time Password Strength Requirements */}
        <div className="bg-surface p-3 border border-border rounded-md space-y-1.5 text-xxs text-text-secondary transition-all">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                checks.length ? 'bg-success' : 'bg-text-muted'
              }`}
            />
            <span className={checks.length ? 'text-success font-medium' : ''}>
              At least 8 characters long
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                checks.number ? 'bg-success' : 'bg-text-muted'
              }`}
            />
            <span className={checks.number ? 'text-success font-medium' : ''}>
              At least 1 number (0-9)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                checks.special ? 'bg-success' : 'bg-text-muted'
              }`}
            />
            <span className={checks.special ? 'text-success font-medium' : ''}>
              At least 1 special character (e.g. ! @ # $)
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-text-secondary text-xs font-medium" htmlFor="confirm-password-input">
            Confirm New Password
          </label>
          <input
            id="confirm-password-input"
            type="password"
            className={`w-full bg-background border rounded-md px-3 py-2 text-sm text-text-primary focus:outline ${
              errors.confirmPassword
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-primary'
            }`}
            placeholder="••••••••"
            disabled={submitting}
            {...register('confirmPassword', {
              required: 'Please confirm your new password.',
              validate: (val) => val === passwordValue || 'Passwords do not match.',
            })}
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xxs font-medium mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/55 disabled:opacity-50 text-primary-foreground font-medium text-sm py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              <span>Resetting Password...</span>
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-text-muted">
        Back to{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
