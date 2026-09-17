import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Globe, ArrowUpRight } from "lucide-react";
import Logo from "./ui/Logo";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>
            Portal terpusat Cabang Dinas Pendidikan Wilayah I Sumatera Utara
          </p>
        </div>
        <div>
          <span className="footer-title">Navigasi Portal</span>
          <Link to="/login">Masuk ke Portal</Link>
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#aplikasi">Layanan & Aplikasi</a>
        </div>
        <div>
          <span className="footer-title">Kontak & Informasi</span>
          <a
            href="mailto:info@disdikwil1.sumutprov.go.id"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Mail size={14} /> info@disdikwil1.sumutprov.go.id
          </a>
          <span
            style={{ display: "inline-flex", alignItems: "flex-start", gap: "6px" }}
          >
            <MapPin size={14} style={{ marginTop: "2px", flexShrink: 0 }} /> Medan & Deli Serdang, Sumut
          </span>
          <a
            href="https://disdik.sumutprov.go.id"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <Globe size={14} /> Disdik Sumut <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {currentYear} Cabang Dinas Pendidikan Wilayah I Sumatera Utara. Hak Cipta Dilindungi.</span>
        <span>Portal • Terintegrasi & Terpercaya</span>
      </div>
    </footer>
  );
}

export default Footer;