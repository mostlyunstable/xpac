import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      handleVerify();
    }

    const stateEmail = location.state?.email;
    if (stateEmail) setEmail(stateEmail);
  }, [location.search]);

  async function handleVerify() {
    if (!token) {
      notifyError('Verification token required');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ token });
      setVerified(true);
      notifySuccess('Email verified successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      notifyError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      notifyError('No email found to resend verification');
      return;
    }

    setResending(true);
    try {
      await resendVerification();
      notifySuccess('Verification email sent! Please check your inbox.');
    } catch (err) {
      notifyError(err.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-lg">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-xl text-center animate-fade-in">
          <span className="material-symbols-outlined text-green-500 text-6xl mb-4 block">check_circle</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Email Verified!</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Your account has been verified. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-xl animate-fade-in">
        <div className="text-center mb-xl">
          <span className="material-symbols-outlined text-primary text-5xl mb-4 block">mark_email_read</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Verify Your Email</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            {token
              ? 'Verifying your email address...'
              : 'Enter the verification token sent to your email'}
          </p>
        </div>

        {token ? (
          <div className="space-y-lg">
            {loading ? (
              <div className="flex items-center justify-center py-xl">
                <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {!verified && (
                  <p className="font-body-md text-body-md text-on-surface-variant text-center">
                    The verification token is being processed...
                  </p>
                )}
                {verified && (
                  <p className="font-body-md text-body-md text-green-600 text-center">Successfully verified!</p>
                )}
              </>
            )}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-lg">
            <div>
              <label htmlFor="token" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
                Verification Token
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
                placeholder="Enter verification token"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
            >
              {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        {email && !verified && (
          <div className="mt-lg pt-lg border-t border-outline-variant">
            <p className="font-body-md text-body-md text-on-surface-variant text-center mb-sm">
              Didn't receive the email?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-primary hover:underline font-medium disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </p>
          </div>
        )}

        <div className="mt-xl text-center">
          <Link to="/login" className="text-primary hover:underline font-label-md text-label-md">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}