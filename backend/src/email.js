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

function createSmtpTransport() {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
    ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
  });
}

export async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP belum dikonfigurasi.");
  }

  const transporter = createSmtpTransport();

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

export async function sendSchoolVerificationEmail({ to, schoolName, verifyUrl }) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP belum dikonfigurasi.");
  }

  const transporter = createSmtpTransport();

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "Verifikasi email akun sekolah Portal Cabdiswilayah I",
    text: [
      `Halo ${schoolName || "Sekolah"},`,
      "",
      "Gunakan tautan berikut untuk memverifikasi email akun sekolah. Tautan berlaku selama 1 jam:",
      verifyUrl,
      "",
      "Jika Anda tidak meminta verifikasi ini, abaikan email ini.",
    ].join("\n"),
  });
}

export async function sendSchoolLoginCodeEmail({ to, schoolName, code }) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP belum dikonfigurasi.");
  }

  const transporter = createSmtpTransport();

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "Kode login Portal Cabdiswilayah I",
    text: [
      `Halo ${schoolName || "Sekolah"},`,
      "",
      `Kode login sekolah Anda: ${code}`,
      "",
      "Kode ini hanya dapat digunakan sekali dan berlaku selama 5 menit.",
      "Jika Anda tidak meminta kode ini, abaikan email ini.",
    ].join("\n"),
  });
}

export async function sendSchoolTemporaryPasswordEmail({
  to,
  schoolName,
  npsn,
  password,
  loginUrl,
  isReset = false,
}) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP belum dikonfigurasi.");
  }

  const transporter = createSmtpTransport();

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: isReset
      ? "Password sementara akun sekolah Portal Cabdiswilayah I"
      : "Akun sekolah Portal Cabdiswilayah I telah dibuat",
    text: [
      `Halo ${schoolName || "Sekolah"},`,
      "",
      isReset
        ? "Administrator Portal Cabdiswilayah I telah mengatur ulang password akun sekolah Anda."
        : "Akun sekolah Anda telah dibuat oleh administrator Portal Cabdiswilayah I.",
      ...(npsn ? [`NPSN: ${npsn}`] : []),
      "",
      `Password sementara: ${password}`,
      "",
      ...(loginUrl ? [`Masuk melalui: ${loginUrl}`, ""] : []),
      "Masukkan NPSN dan password sementara. Kode verifikasi akan dikirim ke email ini dan berlaku selama 5 menit.",
      "Setelah verifikasi kode, portal mewajibkan Anda membuat password baru sebelum membuka layanan.",
      "Jangan bagikan password sementara ini. Setelah password baru dibuat, hapus email ini.",
      "",
      "Jika Anda tidak mengharapkan email ini, hubungi administrator portal.",
    ].join("\n"),
  });
}