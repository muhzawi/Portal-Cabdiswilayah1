import React from "react";
import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link className="brand" to="/">
      <img className="brand-logo" src="/logo-disdik.webp" alt="" />
      <span>
        CABDISDIK WILAYAH I
        <br />
        <strong>PROVINSI SUMATERA UTARA</strong>
      </span>
    </Link>
  );
}

export default Logo;