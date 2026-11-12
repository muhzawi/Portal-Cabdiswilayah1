import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import api from "../api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Tautan reset password tidak valid atau tidak lengkap.");
      return;
    }
    if (password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password/confirm", {
        token,
        password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error || "Tautan reset gagal diproses. Silakan minta tautan baru.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Logo showSecondary={false} />
        <div>
          <span className="pill">PORTAL</span>
          <h1>
            Atur Ulang
            <br />
            <em>Password Anda.</em>
          </h1>
          <p>Buat password baru untuk kembali mengakses layanan portal.</p>
        </div>
        <span className="auth-aside-footer">
          © {new Date().getFullYear()} Cabang Dinas Pendidikan Wilayah I Sumatera Utara
        </span>
      </div>
      <main className="auth-main">
        <div className="auth-form">
          <Link className="back-link" to="/login">
            <ArrowRight size={16} className="back-icon" /> Kembali ke masuk
          </Link>
          <span className="eyebrow">Keamanan akun</span>
          <h2>Password baru</h2>
          <p className="form-intro">Gunakan password minimal 8 karakter.</p>

          {success ? (
            <>
              <div className="form-success">
                <CheckCircle2 size={16} /> Password berhasil diperbarui.
              </div>
              <Link className="button button-primary reset-login-link" to="/login">
                Masuk ke portal <ArrowRight size={17} />
              </Link>
            </>
          ) : (
            <form onSubmit={submit}>
              <label>
                Password baru
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <label>
                Konfirmasi password baru
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              {error && <div className="form-error">{error}</div>}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Memperbarui..." : "Simpan password baru"}
                {!isSubmitting && <ArrowRight size={17} />}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;