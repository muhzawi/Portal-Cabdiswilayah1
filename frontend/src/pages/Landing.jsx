import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import { publicApps, getAppIcon } from "../constants";
import api from "../api";
import { useApp } from "../context/AppContext";

const categoryOrder = ["Pendidikan", "Administrasi", "Kepegawaian"];

const officials = [
  {
    name: "Muhammad Bobby Afif Nasution, S.E., M.M",
    title: "Gubernur Sumatera Utara",
    image: "/bobby.webp",
    imageAlt: "Gubernur Sumatera Utara Muhammad Bobby Afif Nasution",
  },
  {
    name: "H. Surya, Bsc",
    title: "Wakil Gubernur Sumatera Utara",
    image: "/surya.webp",
    imageAlt: "Wakil Gubernur Sumatera Utara H. Surya",
  },
  {
    name: "Alexander Sinulingga, S.STP., M.Si",
    title: "Kepala Dinas Pendidikan Wilayah I Sumut",
    image: "/kadis.webp",
    imageAlt: "Kepala Dinas Pendidikan Wilayah I Sumatera Utara",
    isCompact: true,
  },
];

function Landing() {
  const { user } = useApp() || {};
  const navigate = useNavigate();
  const [apps, setApps] = useState(publicApps);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const carouselRef = useRef(null);

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
    const groups = new Map();
    apps.forEach((app) => {
      const category = app.category || "Lainnya";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(app);
    });

    return [...groups.entries()].sort(([first], [second]) => {
      const firstIndex = categoryOrder.indexOf(first);
      const secondIndex = categoryOrder.indexOf(second);
      if (firstIndex === -1 && secondIndex === -1) {
        return first.localeCompare(second);
      }
      if (firstIndex === -1) return 1;
      if (secondIndex === -1) return -1;
      return firstIndex - secondIndex;
    });
  }, [apps]);

  useEffect(() => {
    const viewport = carouselRef.current;
    if (!viewport) return undefined;

    const updateScrollButtons = () => {
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      setCanScrollBack(viewport.scrollLeft > 2);
      setCanScrollForward(maxScrollLeft - viewport.scrollLeft > 2);
    };

    updateScrollButtons();
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(viewport);
    viewport.addEventListener("scroll", updateScrollButtons, { passive: true });

    return () => {
      resizeObserver.disconnect();
      viewport.removeEventListener("scroll", updateScrollButtons);
    };
  }, [groupedApps]);

  const scrollCarousel = (direction) => {
    const viewport = carouselRef.current;
    if (!viewport) return;
    viewport.scrollBy({
      left: direction * viewport.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const openPortal = () => navigate(user ? "/dashboard" : "/login");

  return (
    <div className="landing landing-figma">
      <PublicNav />
      <main>
        <section
          className="figma-hero"
          id="section-hero"
          aria-labelledby="hero-title"
        >
          <div className="figma-hero-copy">
            <p className="figma-hero-eyebrow">Portal Resmi</p>
            <h1 id="hero-title">
              <span>Cabang Dinas</span>
              <span>Pendidikan Wilayah I</span>
              <span> Sumatera Utara</span>
            </h1>
            <p className="figma-hero-description">
              Bersama mewujudkan pendidikan yang berkualitas, inklusif, dan
              berdaya saing untuk generasi muda Sumatera Utara
            </p>
            <button
              type="button"
              className="figma-hero-cta"
              onClick={openPortal}
            >
              Masuk Portal <ArrowRight size={22} aria-hidden="true" />
            </button>
          </div>
          <p className="figma-hero-motto">
            Pendidikan
            <br />
            Hari Ini,
            <br />
            Masa Depan
            <br />
            Sumut Esok
          </p>
        </section>

        <section
          className="figma-officials"
          aria-label="Pejabat Sumatera Utara"
        >
          <div className="figma-officials-panel">
            <div className="figma-officials-copy">
              <h2>
                <span>Bersama</span> Mewujudkan Pendidikan Unggul di Sumatera
                Utara
              </h2>
              <p>
                Sinergi pemerintah Provinsi dan Dinas Pendidikan Wilayah I Sumut
                untuk mencetak generasi muda yang cerdas, berkarakter, dan
                berdaya saing global.
              </p>
            </div>
            {officials.map((official) => (
              <article
                className={`figma-official-card${official.isCompact ? " figma-official-card-compact" : ""}`}
                key={official.name}
              >
                <img
                  src={official.image}
                  alt={official.imageAlt}
                  loading="lazy"
                />
                <div className="figma-official-details">
                  <h3>{official.name}</h3>
                  <p>{official.title}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="figma-applications"
          id="section-application"
          aria-labelledby="applications-title"
        >
          <div className="figma-applications-heading">
            <span className="figma-applications-accent" aria-hidden="true" />
            <div className="figma-applications-title" id="cara-kerja">
              <span>Informasi Layanan</span>
              <h2 id="applications-title">Info Layanan Portal</h2>
            </div>
            <span className="figma-applications-divider" aria-hidden="true" />
            <p>
              Akses berbagai layanan aplikasi Dinas Pendidikan Wilayah I
              Sumatera Utara dengan mudah melalui satu portal terpadu.
            </p>
          </div>

          <div
            className="figma-carousel-viewport"
            ref={carouselRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Kategori layanan aplikasi"
          >
            <div className="figma-carousel-track">
              {groupedApps.map(([category, categoryApps]) => {
                const Icon = getAppIcon(category);
                return (
                  <article className="figma-app-card" key={category}>
                    <div className="figma-app-card-summary">
                      <div className="figma-app-icon">
                        <Icon size={66} strokeWidth={1.8} aria-hidden="true" />
                      </div>
                      <span className="figma-app-count">
                        {categoryApps.length} aplikasi tersedia
                      </span>
                    </div>
                    <div className="figma-app-card-details">
                      <div>
                        <h3>{category}</h3>
                        <p>
                          Layanan terkurasi untuk mendukung pekerjaan di bidang{" "}
                          {category.toLowerCase()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="figma-app-card-cta"
                        onClick={openPortal}
                        aria-label={`Selengkapnya: layanan ${category}`}
                      >
                        Selengkapnya <ArrowRight size={20} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="figma-carousel-controls">
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              disabled={!canScrollBack}
              aria-label="Geser ke kategori sebelumnya"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              disabled={!canScrollForward}
              aria-label="Geser ke kategori berikutnya"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Landing;
