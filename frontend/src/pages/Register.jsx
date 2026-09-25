import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import api from "../api";

function Register() {
  const { user } = useApp() || {};
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Validasi input di frontend
    if (!name.trim()) return setError("Nama lengkap wajib diisi.");
    if (!email.trim()) return setError("Email wajib diisi.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Format email tidak valid.");
    }
    if (!password) return setError("Password wajib diisi.");
    if (password.length < 8) {
      return setError("Password minimal 8 karakter.");
    }
    if (password !== confirmPassword) {
      return setError("Konfirmasi password tidak cocok dengan password.");
    }

    setIsLoading(true);

    try {
      const res = await api.post("/api/auth/register", {
        name,
        email,
        password,
        confirmPassword,
      });

      setSuccess(
        res.data?.message ||
          "Registrasi berhasil! Akun Anda sedang dalam status pending. Silakan tunggu persetujuan (approval) dari Super User sebelum dapat masuk."
      );

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.error || "Registrasi gagal. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Logo showSecondary={false} />
        <div>
          <span className="pill">PORTAL</span>
          <h1>
            Buat Akun Baru
            <br />
            <em>Dalam Satu Portal.</em>
          </h1>
          <p>
            Daftarkan akun Anda untuk mengakses fasilitas dan layanan.
          </p>
        </div>
        <span className="auth-aside-footer">
          © {new Date().getFullYear()} Cabang Dinas Pendidikan Wilayah I Sumatera Utara
        </span>
      </div>
      <main className="auth-main">
        <div className="auth-form">
          <Link className="back-link" to="/">
            <ArrowRight size={16} className="back-icon" /> Kembali ke beranda
          </Link>
          <span className="eyebrow">Pendaftaran Akun</span>
          <h2>Buat akun baru</h2>
          <p className="form-intro">
            Lengkapi formulir di bawah ini untuk mendaftar akun portal.
          </p>
          <form onSubmit={submit}>
            <label>
              Nama lengkap
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                required
              />
            </label>
            <label>
              Email 
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
              />
            </label>
            <label>
              Password (min. 8 karakter)
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label>
              Konfirmasi password
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <div className="form-error">{error}</div>}
            {success && (
              <div className="form-success">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}
            <Button type="submit" disabled={isLoading || Boolean(success)}>
              {isLoading ? "Memproses..." : <>Daftar Akun Baru <ArrowRight size={17} /></>}
            </Button>
          </form>
          <p className="auth-note">
            Sudah memiliki akun?{" "}
            <Link to="/login" style={{ color: "var(--green-700)", fontWeight: 600 }}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;
