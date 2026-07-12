import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/common/Providers.jsx';

export const Signup = () => {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await signup(data.name, data.email, data.password);
      showToast('Registration requested successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-text-primary">Create Account</h2>
        <p className="text-text-secondary text-xs">
          Request access to the organization ERP platform.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-text-secondary text-xs font-medium" htmlFor="name-input">
            Full Name
          </label>
          <input
            id="name-input"
            type="text"
            className={`w-full bg-background border rounded-md px-3 py-2 text-sm text-text-primary focus:outline ${
              errors.name
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-primary'
            }`}
            placeholder="John Doe"
            disabled={submitting}
            {...register('name', {
              required: 'Full name is required.',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters.',
              },
            })}
          />
          {errors.name && (
            <p className="text-destructive text-xxs font-medium mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div className="space-y-1">
          <label className="text-text-secondary text-xs font-medium" htmlFor="password-input">
            Password
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

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/55 disabled:opacity-50 text-primary-foreground font-medium text-sm py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              <span>Registering...</span>
            </>
          ) : (
            'Request Account'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Signup;
