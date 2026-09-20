import React from "react";
import { Link } from "react-router-dom";

function Logo({ showSecondary = true }) {
  return (
    <Link className="brand" to="/">
      <div className="brand-primary">
        <img
          className="brand-logo logo-disdik"
          src="/logo-disdik.webp"
          alt="Logo Dinas Pendidikan"
        />
        <span className="brand-text">
          CABDISDIK WILAYAH I
          <br />
          <strong>PROVINSI SUMATERA UTARA</strong>
        </span>
      </div>
      {showSecondary && (
        <div className="brand-secondary">
          <img
            className="brand-logo-large logo-dik"
            src="/logo-dik.webp"
            alt="Logo Kemendikdasmen"
          />
          <img
            className="brand-logo-large logo-berkah"
            src="/logo-berkah.webp"
            alt="Logo Sumut Berkah"
          />
        </div>
      )}
    </Link>
  );
}

export default Logo;