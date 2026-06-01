import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls: { rejectUnauthorized: env.NODE_ENV === 'production' },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
      logger.debug('Email sent', { to, subject });
    } catch (error) {
      logger.error('Email send failed', { to, subject, error });
      throw error;
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const url = `${env.APP_URL}/auth/verify-email?token=${token}`;
    await this.send(
      email,
      'Verify your HybridShare account',
      this.verificationTemplate(name, url)
    );
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const url = `${env.APP_URL}/auth/reset-password?token=${token}`;
    await this.send(
      email,
      'Reset your HybridShare password',
      this.passwordResetTemplate(name, url)
    );
  }

  async sendShareNotification(
    email: string,
    senderName: string,
    resourceName: string,
    shareUrl: string
  ): Promise<void> {
    await this.send(
      email,
      `${senderName} shared "${resourceName}" with you`,
      this.shareNotificationTemplate(senderName, resourceName, shareUrl)
    );
  }

  async sendWorkspaceInvite(
    email: string,
    inviterName: string,
    workspaceName: string,
    inviteUrl: string
  ): Promise<void> {
    await this.send(
      email,
      `You've been invited to join ${workspaceName} on HybridShare`,
      this.workspaceInviteTemplate(inviterName, workspaceName, inviteUrl)
    );
  }

  async sendWeeklyDigest(
    email: string,
    name: string,
    stats: {
      filesUploaded: number;
      storageUsed: string;
      activeWorkspaces: number;
      recentFiles: Array<{ name: string; url: string }>;
    }
  ): Promise<void> {
    await this.send(email, 'Your HybridShare Weekly Digest', this.weeklyDigestTemplate(name, stats));
  }

  private baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HybridShare</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:#000;padding:28px 32px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:32px;height:32px;background:#c12129;border-radius:6px;display:flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-weight:700;font-size:16px;">H</span>
          </div>
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">HybridShare</span>
        </div>
      </div>
      <div style="padding:40px 32px;">
        ${content}
      </div>
      <div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
        <p style="color:#666;font-size:12px;margin:0;">© ${new Date().getFullYear()} HybridShare. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private verificationTemplate(name: string, url: string): string {
    return this.baseTemplate(`
      <h2 style="color:#000;font-size:24px;font-weight:700;margin:0 0 16px;">Verify your email</h2>
      <p style="color:#444;line-height:1.6;margin:0 0 24px;">Hi ${name}, thanks for joining HybridShare. Click the button below to verify your email address and activate your account.</p>
      <a href="${url}" style="display:inline-block;background:#c12129;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">Verify Email</a>
      <p style="color:#888;font-size:13px;margin:24px 0 0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    `);
  }

  private passwordResetTemplate(name: string, url: string): string {
    return this.baseTemplate(`
      <h2 style="color:#000;font-size:24px;font-weight:700;margin:0 0 16px;">Reset your password</h2>
      <p style="color:#444;line-height:1.6;margin:0 0 24px;">Hi ${name}, we received a request to reset your password. Click the button below to create a new one.</p>
      <a href="${url}" style="display:inline-block;background:#c12129;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
      <p style="color:#888;font-size:13px;margin:24px 0 0;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `);
  }

  private shareNotificationTemplate(sender: string, resource: string, url: string): string {
    return this.baseTemplate(`
      <h2 style="color:#000;font-size:24px;font-weight:700;margin:0 0 16px;">Someone shared a file with you</h2>
      <p style="color:#444;line-height:1.6;margin:0 0 24px;"><strong>${sender}</strong> has shared <strong>"${resource}"</strong> with you on HybridShare.</p>
      <a href="${url}" style="display:inline-block;background:#c12129;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">View File</a>
    `);
  }

  private workspaceInviteTemplate(inviter: string, workspace: string, url: string): string {
    return this.baseTemplate(`
      <h2 style="color:#000;font-size:24px;font-weight:700;margin:0 0 16px;">Workspace invitation</h2>
      <p style="color:#444;line-height:1.6;margin:0 0 24px;"><strong>${inviter}</strong> has invited you to join the <strong>"${workspace}"</strong> workspace on HybridShare.</p>
      <a href="${url}" style="display:inline-block;background:#c12129;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">Accept Invitation</a>
    `);
  }

  private weeklyDigestTemplate(
    name: string,
    stats: { filesUploaded: number; storageUsed: string; activeWorkspaces: number; recentFiles: Array<{ name: string; url: string }> }
  ): string {
    const files = stats.recentFiles
      .map((f) => `<li style="margin:8px 0;"><a href="${f.url}" style="color:#c12129;text-decoration:none;">${f.name}</a></li>`)
      .join('');

    return this.baseTemplate(`
      <h2 style="color:#000;font-size:24px;font-weight:700;margin:0 0 8px;">Your weekly digest</h2>
      <p style="color:#444;margin:0 0 28px;">Hi ${name}, here's what happened in your HybridShare this week.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;">
        <div style="background:#f9f9f9;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#c12129;">${stats.filesUploaded}</div>
          <div style="color:#666;font-size:13px;margin-top:4px;">Files uploaded</div>
        </div>
        <div style="background:#f9f9f9;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#000;">${stats.storageUsed}</div>
          <div style="color:#666;font-size:13px;margin-top:4px;">Storage used</div>
        </div>
        <div style="background:#f9f9f9;border-radius:8px;padding:20px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#000;">${stats.activeWorkspaces}</div>
          <div style="color:#666;font-size:13px;margin-top:4px;">Active workspaces</div>
        </div>
      </div>
      ${files ? `<h3 style="color:#000;font-size:16px;margin:0 0 12px;">Recent files</h3><ul style="list-style:none;padding:0;margin:0;">${files}</ul>` : ''}
    `);
  }
}

export const emailService = new EmailService();
