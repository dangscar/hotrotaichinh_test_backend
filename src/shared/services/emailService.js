import nodemailer from 'nodemailer';
import config from '../../config/index.js';

let transporter = null;

export const isSmtpConfigured = () =>
  Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

const createTransporter = () => {
  const { host, port, user, pass } = config.smtp;

  if (host === 'smtp.gmail.com' || user?.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });
};

export const getMailTransporter = () => {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export const verifySmtpConnection = async () => {
  const transport = getMailTransporter();
  if (!transport) {
    throw new Error('SMTP chưa cấu hình. Cập nhật SMTP_USER và SMTP_PASS trong server/.env');
  }
  await transport.verify();
};

export const sendPasswordResetEmail = async ({ to, resetUrl, fullName }) => {
  const from = config.smtp.from || config.smtp.user;

  const mailOptions = {
    from: `"CTUT e-Portal" <${from}>`,
    to,
    subject: '[CTUT e-Portal] Đặt lại mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Đặt lại mật khẩu</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản CTUT e-Portal.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Đặt lại mật khẩu</a></p>
        <p>Liên kết có hiệu lực trong <strong>30 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        <p style="color:#64748b;font-size:12px;">CTUT e-Portal — Hệ thống Thủ tục Hành chính Điện tử</p>
      </div>
    `,
  };

  if (!isSmtpConfigured()) {
    throw new Error(
      'Chưa cấu hình Gmail SMTP. Mở server/.env và điền SMTP_USER + SMTP_PASS (App Password).',
    );
  }

  const transport = getMailTransporter();

  try {
    await transport.sendMail(mailOptions);
    console.log(`[Email] Đã gửi link đặt lại mật khẩu → ${to}`);
    return { sent: true };
  } catch (error) {
    console.error('[Email] Gửi Gmail thất bại:', error.message);
    throw new Error(
      'Không gửi được email qua Gmail. Kiểm tra SMTP_USER, SMTP_PASS (App Password 16 ký tự) và bật xác minh 2 bước trên Google.',
    );
  }
};
