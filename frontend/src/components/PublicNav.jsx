import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "./ui/Logo";

function PublicNav() {
  return (
    <header className="public-nav container">
      <Logo />
      <nav>
        <a href="#cara-kerja">Cara kerja</a>
        <a href="#aplikasi">Aplikasi</a>
       
      </nav>
      <Link className="button button-primary nav-cta" to="/login">
        Masuk<ArrowRight size={16} />
      </Link>
    </header>
  );
}

export default PublicNav;