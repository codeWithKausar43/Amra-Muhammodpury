import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

let transporter: Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export const emailService = {
  async sendVerificationEmail(to: string, url: string, name: string) {
    const subject = 'আপনার ইমেইল যাচাই করুন — মোহাম্মদপুর কমিউনিটি';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #087A55; margin-bottom: 16px;">মোহাম্মদপুর কমিউনিটি</h2>
        <p style="font-size: 16px; color: #1e293b;">আসসালামু আলাইকুম ${name},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          মোহাম্মদপুর কমিউনিটি কমিউনিটি প্ল্যাটফর্মে আপনার অ্যাকাউন্ট নিবন্ধন সম্পন্ন করতে অনুগ্রহ করে নিচের বাটনে ক্লিক করে আপনার ইমেইল যাচাই করুন:
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${url}" style="background-color: #087A55; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            ইমেইল যাচাই করুন
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
          বাটন কাজ না করলে এই লিঙ্কে প্রবেশ করুন: <br/>
          <a href="${url}" style="color: #087A55;">${url}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।
        </p>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      console.info(`[EmailService] Verification email sent to ${to}`);
    } else {
      console.info(
        `[EmailService DEV] Real SMTP not configured. Verification URL for ${to}:\n${url}`,
      );
    }
  },

  async sendResetPasswordEmail(to: string, url: string) {
    const subject = 'পাসওয়ার্ড রিসেট নির্দেশনা — মোহাম্মদপুর কমিউনিটি';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #087A55; margin-bottom: 16px;">মোহাম্মদপুর কমিউনিটি</h2>
        <p style="font-size: 16px; color: #1e293b;">আসসালামু আলাইকুম,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          আপনার পাসওয়ার্ড পরিবর্তনের জন্য একটি অনুরোধ পেয়েছি। পাসওয়ার্ড রিসেট করতে নিচের বাটনে ক্লিক করুন:
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${url}" style="background-color: #087A55; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            পাসওয়ার্ড রিসেট করুন
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
          বাটন কাজ না করলে এই লিঙ্কে প্রবেশ করুন: <br/>
          <a href="${url}" style="color: #087A55;">${url}</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">এই লিংকটি একটি নির্দিষ্ট সময় পর্যন্ত সক্রিয় থাকবে।</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          আপনি যদি এই পাসওয়ার্ড রিসেটের অনুরোধ না করে থাকেন, তবে আপনার অ্যাকাউন্টের নিরাপত্তা যাচাই করুন।
        </p>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      console.info(`[EmailService] Password reset email sent to ${to}`);
    } else {
      console.info(
        `[EmailService DEV] Real SMTP not configured. Password Reset URL for ${to}:\n${url}`,
      );
    }
  },
};
