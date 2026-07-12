const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '1025');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@xpac.io';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  
  const nodemailer = await import('nodemailer');
  transporter = nodemailer.default.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const t = await getTransporter();
    await t.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

export function emailTemplates() {
  return {
    verification: (name, url) => ({
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #191b23;">Welcome to XPAC</h1>
          <p>Hi ${name},</p>
          <p>Thanks for signing up. Please verify your email address to access your account.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${url}" style="display: inline-block; background: #004ac6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">Verify Email</a>
          </p>
          <p>Or copy this link: <a href="${url}">${url}</a></p>
          <p>This link expires in 24 hours.</p>
          <hr style="margin: 24px 0; border-color: #e1e2ed;">
          <p style="color: #737686; font-size: 12px;">If you didn't create an account, you can ignore this email.</p>
        </div>
      `,
    }),
    passwordReset: (name, url) => ({
      subject: 'Reset your password',
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #191b23;">Password Reset Request</h1>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${url}" style="display: inline-block; background: #004ac6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">Reset Password</a>
          </p>
          <p>Or copy this link: <a href="${url}">${url}</a></p>
          <p>This link expires in 1 hour.</p>
          <hr style="margin: 24px 0; border-color: #e1e2ed;">
          <p style="color: #737686; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    }),
    orderPlaced: (name, orderId) => ({
      subject: `Broadcast Order Placed — ${orderId}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #191b23;">Order Confirmed</h1>
          <p>Hi ${name},</p>
          <p>Your broadcast order <strong>${orderId}</strong> has been placed successfully and is now <strong>Placed</strong>.</p>
          <p>Our team will review and begin processing shortly.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/orders/${orderId}" style="display: inline-block; background: #004ac6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Order</a>
          </p>
        </div>
      `,
    }),
    statusInProgress: (name, orderId) => ({
      subject: `Broadcast In Progress — ${orderId}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #191b23;">Status Update</h1>
          <p>Hi ${name},</p>
          <p>Your broadcast <strong>${orderId}</strong> is now <strong>In Progress</strong>.</p>
          <p>Our team is currently executing the campaign on the IVR infrastructure.</p>
        </div>
      `,
    }),
    orderCompleted: (name, orderId, reportUrl) => ({
      subject: `Broadcast Completed — ${orderId}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #15803d;">Broadcast Completed</h1>
          <p>Hi ${name},</p>
          <p>Your broadcast <strong>${orderId}</strong> has been <strong>Completed</strong>.</p>
          <p>The performance report is ready for download.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${reportUrl}" style="display: inline-block; background: #004ac6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">Download Report</a>
          </p>
        </div>
      `,
    }),
    ticketCreated: (name, ticketId) => ({
      subject: `Support Ticket Created — ${ticketId}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #191b23;">Ticket Received</h1>
          <p>Hi ${name},</p>
          <p>Your support ticket <strong>${ticketId}</strong> has been created. Our team will respond shortly.</p>
        </div>
      `,
    }),
    ticketReply: (name, ticketId, adminMessage) => ({
      subject: `Update on Ticket ${ticketId}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #191b23;">Ticket Update</h1>
          <p>Hi ${name},</p>
          <p>Our team has replied to your ticket <strong>${ticketId}</strong>:</p>
          <div style="background: #f3f3fe; border-left: 4px solid #004ac6; padding: 16px; margin: 16px 0;">
            ${adminMessage}
          </div>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/support/${ticketId}" style="display: inline-block; background: #004ac6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Ticket</a>
          </p>
        </div>
      `,
    }),
    adminNewTicket: (ticketId, customerName, subject) => ({
      subject: `New Support Ticket — ${ticketId}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #ba1a1a;">New Support Ticket</h1>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/admin/support/${ticketId}" style="display: inline-block; background: #ba1a1a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Ticket</a>
          </p>
        </div>
      `,
    }),
  };
}