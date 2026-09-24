import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Edit3, LockKeyhole, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import api from "../api";

function Profile() {
  const { user, updateUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.name || "");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.name || "");
  }, [user?.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSaving(true);
    try {
      const res = await api.patch("/auth/profile", { fullName });
      updateUser(res.data.user);
      setIsEditing(false);
      setMessage({ type: "success", text: res.data.message || "Profil berhasil diperbarui." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Gagal memperbarui profil." });
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = ["superadmin", "super_user"].includes(user?.role)
    ? "Superadmin"
    : user?.role === "admin" ? "Admin" : "Staff";

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Akun</span>
          <h1>Profil pengguna</h1>
          <p>Kelola informasi dasar akun Anda.</p>
        </div>
      </div>
      <div className="settings-card profile-card profile-card-expanded">
        <div className="profile-avatar">{(user.name || user.email || "U")[0].toUpperCase()}</div>
        {!isEditing ? (
          <div className="profile-info">
            <span className="eyebrow">Nama lengkap</span>
            <h2>{user.name}</h2>
            <span className="eyebrow">Email organisasi</span>
            <p>{user.email}</p>
            <div className="profile-meta">
              <span><strong>Role</strong>{roleLabel}</span>
              <span><strong>Status akun</strong>{user.status || "Approved"}</span>
            </div>
          </div>
        ) : (
          <form className="profile-edit-form" onSubmit={handleSubmit}>
            <label>
              Nama lengkap
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={100} required />
            </label>
            <label>
              Email organisasi
              <input value={user.email} readOnly />
              <small>Email hanya dapat diubah melalui proses verifikasi akun.</small>
            </label>
            <div className="profile-form-actions">
              <Button type="submit" disabled={isSaving}><Check size={16} /> {isSaving ? "Menyimpan..." : "Simpan"}</Button>
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}><X size={16} /> Batal</Button>
            </div>
          </form>
        )}
        {!isEditing && (
          <div className="profile-actions">
            <Button variant="secondary" onClick={() => setIsEditing(true)}><Edit3 size={16} /> Edit profil</Button>
            <Link className="button button-secondary" to="/settings"><LockKeyhole size={16} /> Ganti password</Link>
          </div>
        )}
      </div>
      {message.text && <div className={`form-${message.type} profile-message`}>{message.text}</div>}
    </div>
  );
}

export default Profile;