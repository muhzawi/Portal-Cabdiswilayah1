import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import api from "../api";

function SettingsPage() {
  const { theme, changeTheme } = useApp();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    if (form.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password baru minimal 8 karakter." });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password baru tidak cocok." });
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.post("/auth/reset-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage({ type: "success", text: res.data?.message || "Password berhasil diperbarui." });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Gagal memperbarui password." });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Preferensi</span>
          <h1>Pengaturan</h1>
          <p>Sesuaikan pengalaman Anda di portal.</p>
        </div>
      </div>
      <div className="settings-card">
        <div className="setting-row">
          <div>
            <h3>Tampilan portal</h3>
            <p>Pilih tema yang nyaman untuk Anda gunakan.</p>
          </div>
          <div className="theme-switcher">
            <button
              className={theme === "light" ? "selected" : ""}
              onClick={() => changeTheme("light")}
            >
              Terang
            </button>
            <button
              className={theme === "dark" ? "selected" : ""}
              onClick={() => changeTheme("dark")}
            >
              Gelap
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h3>Notifikasi</h3>
            <p>Dapatkan informasi terbaru tentang layanan portal.</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span />
          </label>
        </div>
        <div className="setting-row password-setting">
          <div>
            <h3>Ganti password</h3>
            <p>Validasi password lama sebelum menyimpan password baru.</p>
            {message.text && <div className={`form-${message.type}`}>{message.text}</div>}
          </div>
          <form className="password-form" onSubmit={handlePasswordChange}>
            <input type="password" placeholder="Password lama" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
            <input type="password" placeholder="Password baru" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} minLength={8} required />
            <input type="password" placeholder="Ulangi password baru" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} minLength={8} required />
            <button className="button button-primary" type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;