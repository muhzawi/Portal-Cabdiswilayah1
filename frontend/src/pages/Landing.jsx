import React, { useEffect, useState, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import { publicApps, getAppIcon } from "../constants";
import api from "../api";
import { useApp } from "../context/AppContext";

function Landing() {
  const { user } = useApp() || {};
  const navigate = useNavigate();
  const [apps, setApps] = useState(publicApps);

  useEffect(() => {
    api
      .get("/api/public-apps")
      .then((res) => {
        if (res.data?.applications && Array.isArray(res.data.applications)) {
          setApps(res.data.applications);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data aplikasi dari database:", err);
      });
  }, []);

  const groupedApps = useMemo(() => {
    const groups = {};
    apps.forEach((app) => {
      const cat = app.category || "Lainnya";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(app);
    });
    return groups;
  }, [apps]);

  return (
    <div className="landing">
      <PublicNav />
      <main>
        <section className="hero hero--officials container">
          {/* 1. Teks Tengah */}
          <div className="hero-copy hero-copy--centered">
            <h1>
              Satu Portal untuk <em>semua layanan</em> pendidikan.
            </h1>
            <p>
              Portal terpusat Cabang Dinas Pendidikan Wilayah I Sumatera Utara
              untuk menemukan dan mengakses aplikasi kerja dengan lebih mudah.
            </p>
          </div>

          {/* 2. Foto Pejabat — Gubernur & Wakil lebih besar, Kepala Dinas lebih kecil */}
          <div className="hero-photos-row">
            {/* Grup utama: Gubernur & Wakil */}
            <div className="hero-photos-main">
              <div className="hero-official-photo hero-official-photo--large">
                <img
                  src="/pejabat/1.webp"
                  alt="Gubernur dan Wakil Gubernur Sumatera Utara"
                  className="hero-official-img hero-official-img--large"
                />
              </div>
            </div>

            {/* Foto terpisah: Kepala Dinas */}
            <div className="hero-photos-secondary">
              <div className="hero-official-photo hero-official-photo--small">
                <img
                  src="/pejabat/2.webp"
                  alt="Kepala Dinas Pendidikan Provinsi Sumatera Utara"
                  className="hero-official-img hero-official-img--small"
                />
              </div>
            </div>
          </div>

          {/* <div className="hero-actions hero-actions--centered">
            <a href="/login" className="button button-primary">
              Masuk ke Portal <ArrowRight size={16} />
            </a>
          </div> */}
        </section>

        <section className="steps section container" id="cara-kerja">
          <div className="section-heading centered">
            <span className="eyebrow">Cara kerja</span>
            <h2>Mulai bekerja dalam tiga langkah.</h2>
            <p>Semua yang Anda butuhkan dalam satu pintu.</p>
          </div>
          <div className="step-grid">
            {[
              [
                "01",
                "Masuk",
                "Gunakan akun Anda untuk masuk ke portal dengan aman.",
              ],
              ["02", "Temukan aplikasi", "Cari aplikasi yang Anda perlukan."],
              [
                "03",
                "Mulai bekerja",
                "Buka layanan dan lanjutkan pekerjaan Anda dengan cepat.",
              ],
            ].map(([number, title, text]) => (
              <div className="step" key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="featured section container" id="aplikasi">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Kategori layanan</span>
              <h2>Temukan layanan berdasarkan kebutuhan.</h2>
            </div>
            <p className="section-heading-description">
              Jelajahi portal berdasarkan area kerja Anda. Masuk untuk membuka
              aplikasi di dalam setiap kategori.
            </p>
          </div>
          <div className="category-showcase-grid">
            {Object.entries(groupedApps).map(([catName, catApps]) => {
              const Icon = getAppIcon(catName);
              return (
                <article
                  className="category-card category-card--showcase"
                  key={catName}
                >
                  <div className="category-card-icon">
                    <Icon size={25} />
                  </div>
                  <div>
                    <span className="category-count">
                      {catApps.length} aplikasi tersedia
                    </span>
                    <h3>{catName}</h3>
                    <p>
                      Layanan terkurasi untuk mendukung pekerjaan di bidang{" "}
                      {catName.toLowerCase()}.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="category-card-note"
                    onClick={() => navigate(user ? "/dashboard" : "/login")}
                    aria-label={
                      user ? "Buka dashboard" : "Masuk untuk membuka layanan"
                    }
                    title={
                      user ? "Buka dashboard" : "Masuk untuk membuka layanan"
                    }
                  >
                    <span>Selengkapnya</span>
                    <ArrowRight size={17} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Landing;
