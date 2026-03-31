import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");
const FROM = `${process.env.RESEND_FROM_NAME ?? "EduConnect"} <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Shared layout wrapper ─────────────────────────────────────────────────────

function layout(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduConnect</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:32px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 16px;">
                  <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🎓 EduConnect</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              © ${new Date().getFullYear()} EduConnect. All rights reserved.<br/>
              <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">Visit EduConnect</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Button helper ─────────────────────────────────────────────────────────────

function button(label: string, url: string) {
    return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;letter-spacing:0.2px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

// ─── 1. Welcome email ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(name: string, email: string, role: string) {
    const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
    const dashboardUrl = `${APP_URL}/dashboard`;

    const html = layout(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:26px;font-weight:700;">Welcome to EduConnect! 🎉</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      Your <strong>${roleLabel}</strong> account has been created successfully. You're now part of the EduConnect community — a modern academic management platform built for educators and learners.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f3ff;border-radius:10px;padding:20px;margin:20px 0;">
      <tr>
        <td>
          <p style="margin:0 0 12px;color:#4f46e5;font-weight:600;font-size:14px;">Your account details</p>
          <p style="margin:4px 0;color:#374151;font-size:14px;">📧 Email: <strong>${email}</strong></p>
          <p style="margin:4px 0;color:#374151;font-size:14px;">🎭 Role: <strong>${roleLabel}</strong></p>
        </td>
      </tr>
    </table>
    ${button("Go to Dashboard", dashboardUrl)}
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;line-height:1.6;">
      If you didn't create this account, please ignore this email or <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">contact support</a>.
    </p>
  `);

    try {
        await resend.emails.send({
            from: FROM,
            to: email,
            subject: `Welcome to EduConnect, ${name}! 🎓`,
            html,
        });
    } catch (err) {
        console.error("[Email] Failed to send welcome email:", err);
    }
}

// ─── 2. Password reset email ───────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
    const html = layout(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:26px;font-weight:700;">Reset your password 🔐</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      We received a request to reset the password for your EduConnect account. Click the button below to choose a new password.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;margin:20px 0;">
      <tr><td>
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
          ⏰ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </td></tr>
    </table>
    ${button("Reset Password", resetUrl)}
    <p style="margin:20px 0 8px;color:#6b7280;font-size:13px;">Or copy and paste this URL into your browser:</p>
    <p style="margin:0;background:#f3f4f6;border-radius:6px;padding:10px 14px;font-size:12px;word-break:break-all;">
      <a href="${resetUrl}" style="color:#6366f1;text-decoration:none;">${resetUrl}</a>
    </p>
  `);

    await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Reset your EduConnect password",
        html,
    });
}

// ─── 3. Password changed confirmation ─────────────────────────────────────────

export async function sendPasswordChangedEmail(email: string, name: string) {
    const html = layout(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:26px;font-weight:700;">Password changed ✅</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      Your EduConnect password was successfully changed. You can now log in with your new password.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:6px;padding:14px 18px;margin:20px 0;">
      <tr><td>
        <p style="margin:0;color:#065f46;font-size:13px;line-height:1.6;">
          🔒 If you did not make this change, please reset your password immediately or contact support.
        </p>
      </td></tr>
    </table>
    ${button("Log In to EduConnect", `${APP_URL}/auth/login`)}
  `);

    try {
        await resend.emails.send({
            from: FROM,
            to: email,
            subject: "Your EduConnect password has been changed",
            html,
        });
    } catch (err) {
        console.error("[Email] Failed to send password-changed email:", err);
    }
}
