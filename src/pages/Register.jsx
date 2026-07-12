import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export default function Register() {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        company: formData.company.trim(),
        phone: formData.phone.trim(),
      });
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      if (err.message.includes('already exists')) {
        setErrors({ email: 'An account with this email already exists' });
      } else {
        notifyError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-xl animate-fade-in">
        <div className="text-center mb-xl">
          <span className="material-symbols-outlined text-primary text-5xl mb-4 block">clinical_notes</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Create Account</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Start managing your IVR broadcasts today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg" noValidate>
          <div>
            <label htmlFor="name" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                errors.name ? 'border-error' : 'border-outline-variant'
              }`}
              placeholder="John Doe"
              autoComplete="name"
              disabled={loading}
              aria-invalid={errors.name ? 'true' : 'false'}
            />
            {errors.name && <p className="mt-1 font-label-md text-label-md text-error">{errors.name}</p>}
          </div>

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
            <label htmlFor="company" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Company (optional)
            </label>
            <input
              id="company"
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="Acme Corp"
              autoComplete="organization"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Phone (optional)
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="+1 (555) 123-4567"
              autoComplete="tel"
              disabled={loading}
            />
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
              autoComplete="new-password"
              disabled={loading}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && <p className="mt-1 font-label-md text-label-md text-error">{errors.password}</p>}
            <p className="mt-1 font-label-md text-label-md text-outline">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-xl text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}