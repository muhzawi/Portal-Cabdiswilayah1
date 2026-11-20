import React, { useState } from "react";
import { ArrowLeft, KeyRound, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import api from "../api";

function EditProfile() {
  const { user, updateUser } = useApp();
  const navigate = useNavigate();
  const isSuperUser = user?.role === "super_user";
  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    institution: user?.institution || "",
    nip: user?.nip || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const { data } = await api.patch("/api/profile", form);
      updateUser(data.profile);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        currentPassword,
        newPassword,
      });
      setPasswordMessage(data?.message || "Password berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(
        err.response?.data?.error || "Gagal mengganti password. Silakan coba lagi.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="page-content edit-profile-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/profile")}
      >
        <ArrowLeft size={16} />
        <span>Kembali ke profil</span>
      </button>
      <div className="edit-profile-heading">
        <span className="eyebrow">Pengaturan akun</span>
        <h1>Edit profil</h1>
        <p>Perbarui informasi pribadi Anda agar data akun tetap akurat.</p>
      </div>
      <form className="edit-profile-card" onSubmit={handleSubmit}>
        <div className="edit-profile-card-header">
          <div>
            <h2>Data profil</h2>
            <p>Lengkapi informasi berikut untuk memperbarui profil Anda.</p>
          </div>
        </div>
        <div className="profile-form-grid">
          <label>
            Nama lengkap
            <input
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Masukkan nama lengkap"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="nama@instansi.go.id"
              required
            />
          </label>
          <label>
            Asal instansi
            <input
              value={form.institution}
              onChange={(event) => updateField("institution", event.target.value)}
              placeholder="Masukkan asal instansi"
            />
          </label>
          <label>
            NIP
            <input
              value={form.nip}
              onChange={(event) => updateField("nip", event.target.value)}
              placeholder="Masukkan NIP"
            />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="edit-profile-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/profile")}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Menyimpan..." : "Simpan perubahan"}
          </Button>
        </div>
      </form>
      {isSuperUser && (
        <section className="settings-card password-settings-card">
          <div className="password-settings-heading">
            <KeyRound size={20} />
            <div>
              <h2>Ganti password</h2>
              <p>Masukkan password saat ini untuk mengatur password baru.</p>
            </div>
          </div>
          <form className="password-change-form" onSubmit={handlePasswordChange}>
            <label>
              Password lama
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                disabled={isChangingPassword}
              />
            </label>
            <label>
              Password baru
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
                disabled={isChangingPassword}
              />
              <span>Password baru minimal 8 karakter.</span>
            </label>
            {passwordError && <div className="form-error">{passwordError}</div>}
            {passwordMessage && <div className="form-success">{passwordMessage}</div>}
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Menyimpan..." : "Simpan password baru"}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

export default EditProfile;
