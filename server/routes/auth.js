import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, logActivity } from '../db.js';
import { generateTokens, verifyRefreshToken, authenticate } from '../middleware/auth.js';
import { sendEmail, emailTemplates } from '../services/email.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

function hashToken(token) {
  return bcrypt.hashSync(token, 10);
}

function generateVerificationToken() {
  return uuidv4() + '-' + Date.now();
}

router.post('/login', validate(schemas.login), (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is suspended. Contact support.' });
  }

  if (!user.email_verified) {
    return res.status(403).json({ error: 'Please verify your email before logging in', code: 'EMAIL_NOT_VERIFIED' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

  const { accessToken, refreshToken } = generateTokens(user.id);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
    uuidv4(), user.id, tokenHash, expiresAt
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
  if (rememberMe) {
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
  }

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined });

  logActivity(user.id, 'login', 'user', user.id, null, { email: user.email }, req);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company },
    accessToken,
    refreshToken,
  });
});

router.post('/register', validate(schemas.register), async (req, res) => {
  const { name, email, password, company, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = 'user-' + uuidv4().slice(0, 8);
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (id, name, email, password_hash, role, status, company, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, name, email, passwordHash, 'customer', 'active', company || '', phone || ''
  );

  const verificationToken = generateVerificationToken();
  const tokenHash = hashToken(verificationToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO email_verifications (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
    uuidv4(), id, tokenHash, expiresAt
  );

  const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
  const template = emailTemplates().verification(name, verificationUrl);
  await sendEmail({ to: email, subject: template.subject, html: template.html });

  const { accessToken, refreshToken } = generateTokens(id);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
    uuidv4(), id, refreshTokenHash, refreshExpiresAt
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  logActivity(id, 'register', 'user', id, null, { email }, req);

  res.status(201).json({
    user: { id, name, email, role: 'customer', company: company || '', phone: phone || '' },
    accessToken,
    refreshToken,
    message: 'Registration successful. Please check your email to verify your account.',
  });
});

router.post('/verify-email', validate(schemas.verifyEmail), (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Verification token required' });
  }

  const verifications = db.prepare(
    'SELECT * FROM email_verifications WHERE used = 0 AND expires_at > datetime(\'now\') ORDER BY created_at DESC'
  ).all();

  let matched = null;
  for (const v of verifications) {
    if (bcrypt.compareSync(token, v.token_hash)) {
      matched = v;
      break;
    }
  }

  if (!matched) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }

  db.prepare('UPDATE users SET email_verified = 1, updated_at = datetime(\'now\') WHERE id = ?').run(matched.user_id);
  db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').run(matched.id);

  const user = db.prepare('SELECT id, name, email, role, company FROM users WHERE id = ?').get(matched.user_id);

  const { accessToken, refreshToken } = generateTokens(user.id);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
    uuidv4(), user.id, tokenHash, expiresAt
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  logActivity(user.id, 'verify_email', 'user', user.id, null, { email: user.email }, req);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company },
    accessToken,
    refreshToken,
    message: 'Email verified successfully',
  });
});

router.post('/resend-verification', authenticate, validate(schemas.resendVerification), async (req, res) => {
  const user = req.user;

  if (user.email_verified) {
    return res.status(400).json({ error: 'Email already verified' });
  }

  db.prepare('DELETE FROM email_verifications WHERE user_id = ? AND used = 1').run(user.id);

  const verificationToken = generateVerificationToken();
  const tokenHash = hashToken(verificationToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO email_verifications (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
    uuidv4(), user.id, tokenHash, expiresAt
  );

  const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
  const template = emailTemplates().verification(user.name, verificationUrl);
  await sendEmail({ to: user.email, subject: template.subject, html: template.html });

  logActivity(user.id, 'resend_verification', 'user', user.id, null, { email: user.email }, req);

  res.json({ message: 'Verification email sent' });
});

router.post('/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = db.prepare(
      'SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND expires_at > datetime(\'now\') AND used = 0'
    ).get(decoded.userId, tokenHash);

    if (!stored) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    db.prepare('UPDATE refresh_tokens SET used = 1 WHERE id = ?').run(stored.id);

    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or suspended' });
    }

    const tokens = generateTokens(user.id);
    const newTokenHash = hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
      uuidv4(), user.id, newTokenHash, expiresAt
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?').run(req.user.id, tokenHash);
  }

  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  logActivity(req.user.id, 'logout', 'user', req.user.id, null, {}, req);
  res.json({ message: 'Logged out' });
});

router.post('/forgot-password', validate(schemas.forgotPassword), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  }

  db.prepare('DELETE FROM password_resets WHERE user_id = ? AND used = 1').run(user.id);

  const resetToken = uuidv4() + '-' + Date.now();
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
    uuidv4(), user.id, tokenHash, expiresAt
  );

  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  const template = emailTemplates().passwordReset(user.name, resetUrl);
  await sendEmail({ to: email, subject: template.subject, html: template.html });

  res.json({ message: 'If an account exists, a reset link has been sent' });
});

router.post('/reset-password', validate(schemas.resetPassword), (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const resets = db.prepare(
    'SELECT * FROM password_resets WHERE used = 0 AND expires_at > datetime(\'now\') ORDER BY created_at DESC'
  ).all();

  let matchedReset = null;
  for (const reset of resets) {
    if (bcrypt.compareSync(token, reset.token_hash)) {
      matchedReset = reset;
      break;
    }
  }

  if (!matchedReset) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(passwordHash, matchedReset.user_id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(matchedReset.id);
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(matchedReset.user_id);

  logActivity(matchedReset.user_id, 'reset_password', 'user', matchedReset.user_id, null, {}, null);

  res.json({ message: 'Password reset successfully' });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/impersonate', authenticate, validate(schemas.impersonate), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const targetUser = db.prepare('SELECT id, name, email, role, status, company FROM users WHERE id = ?').get(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const tokens = generateTokens(targetUser.id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

  logActivity(req.user.id, 'impersonate_start', 'user', targetUser.id, null, { targetEmail: targetUser.email }, req);

  res.json({
    user: targetUser,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    impersonating: true,
    impersonator: req.user.id,
  });
});

router.post('/stop-impersonation', authenticate, validate(schemas.stopImpersonation), (req, res) => {
  const { adminId } = req.body;
  if (!adminId) return res.status(400).json({ error: 'Admin ID required' });

  const admin = db.prepare('SELECT id, name, email, role, status, company FROM users WHERE id = ? AND role = ?').get(adminId, 'admin');
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  const tokens = generateTokens(admin.id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  logActivity(admin.id, 'impersonate_end', 'user', admin.id, null, {}, req);

  res.json({
    user: admin,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

export default router;