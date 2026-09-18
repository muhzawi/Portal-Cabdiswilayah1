import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import Logo from "./ui/Logo";

function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="public-nav-wrapper">
      <div className="public-nav container">
        <Logo />
        <nav className="public-nav-links">
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#aplikasi">Aplikasi</a>
        </nav>
        <div className="public-nav-actions">
          <Link className="button button-primary nav-cta" to="/login">
            Masuk <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            className="public-nav-hamburger"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && (
        <>
          <div
            className="public-nav-backdrop"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <div className="public-nav-mobile-menu">
            <div className="container mobile-menu-inner">
              <a
                href="#cara-kerja"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                Cara kerja
              </a>
              <a
                href="#aplikasi"
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                Aplikasi
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default PublicNav;