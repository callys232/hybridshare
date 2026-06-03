/**
 * Email service — uses Resend REST API directly via fetch.
 * Zero dependencies. Works without the `resend` npm package.
 */

const FROM    = process.env.EMAIL_FROM    ?? 'HybridShare <no-reply@hybridshare.io>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[EMAIL – no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await send(email, 'Verify your HybridShare email',
    `<p>Click to verify your email (expires in 24h):</p><p><a href="${link}">Verify email</a></p>`);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await send(email, 'Reset your HybridShare password',
    `<p>Click to reset your password (expires in 1h):</p><p><a href="${link}">Reset password</a></p>`);
}

export async function sendShareNotificationEmail(
  recipientEmail: string, senderName: string, fileName: string, shareUrl: string
) {
  await send(recipientEmail, `${senderName} shared "${fileName}" with you`,
    `<p><strong>${senderName}</strong> shared <strong>${fileName}</strong> with you.</p><p><a href="${shareUrl}">View file</a></p>`);
}

export async function sendWelcomeEmail(email: string, name: string) {
  await send(email, 'Welcome to HybridShare!',
    `<p>Hi ${name},</p><p>Thanks for joining HybridShare.</p><p><a href="${APP_URL}/files">Go to your files</a></p>`);
}
