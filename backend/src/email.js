import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

export function isSmtpConfigured() {
  const hasPartialAuth = Boolean(smtpUser) !== Boolean(smtpPass);
  return Boolean(smtpHost && smtpFrom && !hasPartialAuth);
}

export async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP belum dikonfigurasi.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
    ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
  });

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "Atur ulang password Portal Cabdiswilayah I",
    text: [
      `Halo ${fullName || "Pengguna Portal"},`,
      "",
      "Kami menerima permintaan untuk mengatur ulang password akun Anda.",
      "Buka tautan berikut dalam 1 jam untuk membuat password baru:",
      resetUrl,
      "",
      "Jika Anda tidak meminta pengaturan ulang password, abaikan email ini.",
    ].join("\n"),
  });
}