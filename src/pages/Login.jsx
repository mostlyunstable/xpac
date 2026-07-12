import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await login({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.message.includes('EMAIL_NOT_VERIFIED')) {
        setErrors({ email: 'Please verify your email before logging in' });
      } else if (err.message.includes('suspended')) {
        setErrors({ email: 'Account is suspended. Contact support.' });
      } else {
        setErrors({ general: err.message || 'Login failed' });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-xl animate-fade-in">
        <div className="text-center mb-xl">
          <span className="material-symbols-outlined text-primary text-5xl mb-4 block">clinical_notes</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Welcome Back</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Sign in to your XPAC account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg" noValidate>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-body-md text-sm animate-fade-in" role="alert">
              {errors.general}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                errors.email ? 'border-error' : 'border-outline-variant'
              }`}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={loading}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && <p className="mt-1 font-label-md text-label-md text-error">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                errors.password ? 'border-error' : 'border-outline-variant'
              }`}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && <p className="mt-1 font-label-md text-label-md text-error">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <span className="font-body-md text-body-md text-on-surface">Remember me</span>
            </label>
            <Link to="/forgot-password" className="font-label-md text-label-md text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-xl text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}