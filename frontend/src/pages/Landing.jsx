import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import AppCard from "../components/AppCard";
import { publicApps, getAppIcon } from "../constants";
import api from "../api";

function Landing() {
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

          {/* 2. Foto Pejabat — berdampingan di tengah */}
          <div className="hero-photos-row">
            <div className="hero-official-photo">
              <img
                src="/pejabat/1.webp"
                alt="Gubernur Sumatera Utara"
                className="hero-official-img"
              />
            </div>
            <div className="hero-official-photo">
              <img
                src="/pejabat/2.webp"
                alt="Wakil Gubernur Sumatera Utara"
                className="hero-official-img"
              />
            </div>
          </div>

          {/* 3. Button */}
          <div className="hero-actions hero-actions--centered">
            <a href="/login" className="button button-primary">
              Masuk ke Portal <ArrowRight size={16} />
            </a>
          </div>
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
              <span className="eyebrow">Aplikasi unggulan</span>
              <h2>Layanan dalam genggaman.</h2>
            </div>
            <Link className="text-link" to="/">
              Lihat semua aplikasi <ArrowRight size={16} />
            </Link>
          </div>
          <div className="featured-grid">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} showFavorite={false} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Landing;
