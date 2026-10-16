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
        <Link className="figma-nav-cta" to="/login">
          <ArrowRight size={17} aria-hidden="true" />
          <span>Masuk Portal</span>
        </Link>
      </div>
    </header>
  );
}

export default PublicNav;
