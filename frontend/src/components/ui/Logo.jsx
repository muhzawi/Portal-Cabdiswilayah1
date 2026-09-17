import React from "react";
import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link className="brand" to="/">
      <img className="brand-logo" src="/logo-disdik.webp" alt="" />
      <span>
        Cabang Dinas Pendidikan
        <br />
        <strong>Wilayah I Sumatera Utara</strong>
      </span>
    </Link>
  );
}

export default Logo;