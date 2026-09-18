import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, X, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import api from "../api";

function Login() {
  const { user, login } = useApp();
  const navigate = useNavigate();

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("portal_remember_me") === "true";
  });

  const [email, setEmail] = useState(() => {
    const savedEmail = localStorage.getItem("portal_saved_email");
    return savedEmail || "";
  });

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (!email || !password) return setError("Email dan password wajib diisi.");
    setIsLoading(true);
    setError("");
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem("portal_saved_email", email);
        localStorage.setItem("portal_remember_me", "true");
      } else {
        localStorage.removeItem("portal_saved_email");
        localStorage.removeItem("portal_remember_me");
      }
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  const openForgotModal = (e) => {
    e.preventDefault();
    setForgotEmail(email || "");
    setForgotSuccess("");
    setForgotError("");
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotSuccess("");
    setForgotError("");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError("Email wajib diisi.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const response = await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotSuccess(
        response.data?.message || "Jika email terdaftar, instruksi reset password telah dikirim."
      );
    } catch (err) {
      setForgotError(
        err.response?.data?.error || "Gagal mengirim instruksi reset password. Silakan coba lagi."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Logo />
        <div>
          <span className="pill">PORTAL</span>
          <h1>
            Semua Aplikasi
            <br />
            <em> Dalam Satu Portal.</em>
          </h1>
          <p>
            Kelola aktivitas layanan pendidikan Anda melalui portal terpusat
            yang aman dan mudah digunakan.
          </p>
        </div>
        <span className="auth-aside-footer">
          © 2026 Cabang Dinas Pendidikan Wilayah I Sumatera Utara
        </span>
      </div>
      <main className="auth-main">
        <div className="auth-form">
          <Link className="back-link" to="/">
            <ArrowRight size={16} className="back-icon" /> Kembali ke beranda
          </Link>
          <span className="eyebrow">Selamat datang kembali</span>
          <h2>Masuk ke portal</h2>
          <p className="form-intro">
            Gunakan akun organisasi Anda untuk melanjutkan.
          </p>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
              />
            </label>
            <div className="form-row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{" "}
                Ingat saya
              </label>
              <a href="#forgot" onClick={openForgotModal}>
                Lupa password?
              </a>
            </div>
            {error && <div className="form-error">{error}</div>}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                "Memuat..."
              ) : (
                <>
                  Masuk ke portal <ArrowRight size={17} />
                </>
              )}
            </Button>
          </form>
          <p className="auth-note">
            Belum memiliki akun?{" "}
            <Link to="/register" style={{ color: "var(--green-700)", fontWeight: 600 }}>
              Daftar sekarang
            </Link>
          </p>
        </div>
      </main>

      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Lupa Password</h3>
              <button type="button" className="modal-close" onClick={closeForgotModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", margin: 0 }}>
                Masukkan alamat email yang terdaftar pada portal. Kami akan mengirimkan tautan instruksi untuk mengatur ulang password Anda.
              </p>
              <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: 600, fontSize: "0.85rem" }}>
                  Email
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder=""
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      fontSize: "0.9rem",
                      outline: "none"
                    }}
                    required
                  />
                </label>

                {forgotError && <div className="form-error">{forgotError}</div>}
                {forgotSuccess && (
                  <div className="form-success" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                  <Button type="button" variant="secondary" onClick={closeForgotModal}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={forgotLoading}>
                    {forgotLoading ? "Mengirim..." : "Kirim Instruksi"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;