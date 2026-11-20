import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import api from "../api";

export default function SchoolPasswordChange() {
  const { user, completeSchoolPasswordChange } = useApp();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user?.passwordChangeRequired) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/school/change-password", {
        newPassword,
        confirmPassword,
      });
      completeSchoolPasswordChange(user);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Gagal mengganti password. Silakan coba kembali.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Keamanan akun sekolah</span>
          <h1>Ganti password sementara</h1>
          <p>
            Buat password baru untuk melanjutkan. Password sementara dari email
            tidak dapat digunakan lagi setelah ini.
          </p>
        </div>
      </div>
      <section className="settings-card password-settings-card">
        <div className="password-settings-heading">
          <KeyRound size={20} />
          <div>
            <h2>Password baru</h2>
            <p>Gunakan minimal 8 karakter dan jangan bagikan kepada orang lain.</p>
          </div>
        </div>
        <form className="password-change-form" onSubmit={handleSubmit}>
          <label>
            Password baru
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            Konfirmasi password baru
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Ganti password dan lanjut"}
          </Button>
        </form>
      </section>
    </div>
  );
}
