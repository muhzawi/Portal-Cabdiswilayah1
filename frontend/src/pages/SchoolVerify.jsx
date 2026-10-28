import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "../components/ui/Logo";
import api from "../api";

export default function SchoolVerify() {
  const [message, setMessage] = useState("Memverifikasi email sekolah...");
  const [isError, setIsError] = useState(false);
  const { completeSchoolLogin } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("access_token");
    if (!token) {
      setMessage("Tautan verifikasi tidak valid atau sudah kedaluwarsa.");
      setIsError(true);
      return;
    }
    api.post("/auth/school/verify", {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        completeSchoolLogin(data.user, data.session);
        setMessage("Email terverifikasi. Mengalihkan ke portal...");
        navigate("/dashboard", { replace: true });
      })
      .catch((error) => {
        setMessage(error.response?.data?.error || "Verifikasi gagal. Silakan coba kembali.");
        setIsError(true);
      });
  }, [completeSchoolLogin, navigate]);

  return <div className="auth-page"><div className="auth-aside"><Logo showSecondary={false} /><div><span className="pill">PORTAL</span><h1>Verifikasi<br /><em>Email Sekolah.</em></h1><p>Satu langkah lagi untuk mengakses layanan pendidikan.</p></div><span className="auth-aside-footer">© 2026 Cabang Dinas Pendidikan Wilayah I Sumatera Utara</span></div><main className="auth-main"><div className="auth-form"><span className="eyebrow">Verifikasi akun</span><h2>Konfirmasi email</h2><div className={isError ? "form-error" : "form-success"} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>{isError ? <CheckCircle2 size={18} /> : <LoaderCircle size={18} className="spin" />}{message}</div>{isError && <p className="auth-note"><Link to="/login">Kembali ke halaman login</Link></p>}</div></main></div>;
}
