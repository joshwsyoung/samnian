import "server-only";
import nodemailer from "nodemailer";

const BRAND_GREEN = "#a2e435";

function transporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  const t = transporter();
  if (!t) {
    // No SMTP configured (e.g. local dev without .env.local secrets) — log
    // instead of throwing, so the rest of the flow still works.
    console.warn(`[mailer] SMTP not configured — skipping email to ${to}: ${subject}`);
    console.info(html);
    return;
  }

  await t.sendMail({
    from: process.env.SMTP_FROM ?? `"TalkTable" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

function emailShell(innerHtml: string) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: ${BRAND_GREEN}; padding: 24px; border-radius: 10px; max-width: 500px; margin: auto; color: #000000;">
      ${innerHtml}
    </div>
  `;
}

export function verificationCodeEmail(code: string) {
  return emailShell(`
    <h2 style="color:#000;">Verify Your Email</h2>
    <p style="font-size: 16px;">Hi there! 👋</p>
    <p style="font-size: 16px;">Your TalkTable verification code is:</p>
    <p style="text-align: center; margin: 30px 0;">
      <span style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:bold;color:#000;background:#fff;border-radius:6px;border:2px solid #000;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        ${code}
      </span>
    </p>
    <p style="font-size: 14px;">Please enter this code on the website to complete your registration.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #000;">
    <p style="font-size: 12px; color: #555;">If you didn't sign up for TalkTable, you can safely ignore this email.</p>
    <p style="font-size: 14px; margin-top: 40px;">Thanks,<br>The TalkTable Team</p>
  `);
}

export function passwordResetEmail(resetLink: string) {
  return emailShell(`
    <h2 style="color:#000;">Reset Your Password</h2>
    <p style="font-size: 16px;">Hi there 👋</p>
    <p style="font-size: 16px;">Click the button below to choose a new password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:bold;color:#000;background:#fff;text-decoration:none;border-radius:6px;border:2px solid #000;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
        Reset Password
      </a>
    </p>
    <p style="font-size: 14px;">If you didn't request this, just ignore this email — no changes will be made.</p>
    <p style="font-size: 14px; margin-top: 20px;">This link will expire in 1 hour for your security.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #000;">
    <p style="font-size: 12px; word-break: break-all;"><a href="${resetLink}" style="color:#000;">${resetLink}</a></p>
    <p style="font-size: 14px; margin-top: 40px;">Thanks,<br>The TalkTable Team</p>
  `);
}
