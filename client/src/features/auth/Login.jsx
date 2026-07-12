import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/common/Providers.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';

export const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      showToast('Welcome back to AssetFlow!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-[hsl(var(--text-primary))]">Sign In</h2>
        <p className="text-[hsl(var(--text-secondary))] text-xs">
          Enter your organizational credentials to access AssetFlow.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <Input
          label="Email Address"
          id="email-input"
          type="email"
          placeholder="name@organization.com"
          disabled={submitting}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email address is required.',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address format.',
            },
          })}
        />

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="text-[hsl(var(--text-secondary))] text-xs font-medium"
              htmlFor="password-input"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[hsl(var(--primary))] hover:underline text-[11px] font-medium"
            >
              Forgot Password?
            </Link>
          </div>
          <Input
            id="password-input"
            type="password"
            placeholder="••••••••"
            disabled={submitting}
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required.',
            })}
          />
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={submitting}
        >
          Sign In
        </Button>
      </form>

      <div className="text-center text-xs text-[hsl(var(--text-muted))]">
        Don't have an account?{' '}
        <Link to="/signup" className="text-[hsl(var(--primary))] hover:underline">
          Request registration
        </Link>
      </div>
    </div>
  );
};

export default Login;
