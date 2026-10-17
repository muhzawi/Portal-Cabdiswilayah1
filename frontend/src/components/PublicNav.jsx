import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function PublicNav() {
  return (
    <header className="figma-nav">
      <div className="figma-nav-inner">
        <Link className="figma-brand" to="/" aria-label="Portal Cabdisdik Wilayah I">
          <span className="figma-brand-primary">
            <img src="/logo-sumut.webp" alt="" />
            <span>
              CABDISDIK WILAYAH I
              <br />
              PROVINSI SUMATERA UTARA
            </span>
          </span>
          <img
            className="figma-brand-secondary"
            src="/logo-disdik.webp"
            alt="Dinas Pendidikan Provinsi Sumatera Utara"
          />
          <img
            className="figma-brand-secondary figma-brand-berkah"
            src="/logo-berkah.webp"
            alt="Kolaborasi Sumut Berkah"
          />
        </Link>
        <nav className="figma-nav-menu" aria-label="Navigasi utama">
          <a href="#section-hero">Beranda</a>
          <a href="#section-application">Layanan</a>
        </nav>
        <Link className="figma-nav-cta" to="/login">
          <span>Masuk Portal</span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

export default PublicNav;
