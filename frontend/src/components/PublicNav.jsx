import React, { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

function PublicNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <button
          type="button"
          className="figma-nav-toggle"
          aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={isMenuOpen}
          aria-controls="figma-nav-panel"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div
          className={`figma-nav-panel${isMenuOpen ? " is-open" : ""}`}
          id="figma-nav-panel"
        >
          <nav className="figma-nav-menu" aria-label="Navigasi utama">
            <a href="#section-hero" onClick={() => setIsMenuOpen(false)}>
              Beranda
            </a>
            <a
              href="#section-application"
              onClick={() => setIsMenuOpen(false)}
            >
              Layanan
            </a>
          </nav>
          <Link
            className="figma-nav-cta"
            to="/login"
            onClick={() => setIsMenuOpen(false)}
          >
            <span>Masuk Portal</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicNav;
