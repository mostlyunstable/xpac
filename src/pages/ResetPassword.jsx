import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifyError } = useNotification();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const token = new URLSearchParams(location.search).get('token');

  function validate() {
    const newErrors = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      setErrors({ general: 'Invalid or missing reset token' });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      navigate('/login', { state: { reset: true } });
    } catch (err) {
      setErrors({ general: err.message || 'Reset failed' });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, e) {
    if (field === 'password') setPassword(e.target.value);
    else setConfirmPassword(e.target.value);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-xl animate-fade-in">
        <div className="text-center mb-xl">
          <span className="material-symbols-outlined text-primary text-5xl mb-4 block">lock_reset</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Reset Password</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg" noValidate>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-body-md text-sm animate-fade-in" role="alert">
              {errors.general}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleChange('password', e)}
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                errors.password ? 'border-error' : 'border-outline-variant'
              }`}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && <p className="mt-1 font-label-md text-label-md text-error">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e)}
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                errors.confirmPassword ? 'border-error' : 'border-outline-variant'
              }`}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            />
            {errors.confirmPassword && <p className="mt-1 font-label-md text-label-md text-error">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-xl text-center">
          <Link to="/login" className="text-primary hover:underline font-label-md text-label-md">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}