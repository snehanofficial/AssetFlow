import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';

export const ForgotPassword = () => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [simulationData, setSimulationData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSimulationData(null);
    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email: data.email },
      });
      showToast('Reset request received!', 'success');
      
      // If we are in development, the API may return simulation data
      if (response.data) {
        setSimulationData(response.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-text-primary">Reset Password</h2>
        <p className="text-text-secondary text-xs">
          Enter your email address and we'll help you reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-text-secondary text-xs font-medium" htmlFor="email-input">
            Email Address
          </label>
          <input
            id="email-input"
            type="email"
            className={`w-full bg-background border rounded-md px-3 py-2 text-sm text-text-primary focus:outline ${
              errors.email
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-primary'
            }`}
            placeholder="name@organization.com"
            disabled={submitting}
            {...register('email', {
              required: 'Email address is required.',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address format.',
              },
            })}
          />
          {errors.email && (
            <p className="text-destructive text-xxs font-medium mt-1">{errors.email.message}</p>
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
              <span>Requesting Reset Link...</span>
            </>
          ) : (
            'Send Reset Instructions'
          )}
        </button>
      </form>

      {simulationData && (
        <div className="p-4 bg-surface border border-primary/30 rounded-md space-y-2 animate-fade-in">
          <p className="text-xxs uppercase tracking-wider font-semibold text-primary">
            Email Simulation Console
          </p>
          <p className="text-text-secondary text-xxs leading-relaxed">
            In production, a password recovery email is sent. In development, click the simulated link below:
          </p>
          <a
            href={`/reset-password?token=${simulationData.token}`}
            className="block text-primary hover:underline font-mono text-xxs break-all bg-background p-2 rounded border border-border"
          >
            Reset URL: /reset-password?token={simulationData.token}
          </a>
        </div>
      )}

      <div className="text-center text-xs text-text-muted">
        Back to{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
