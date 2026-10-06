import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  X,
  ChevronDown
} from "lucide-react";

const HOTSPOTS = [
  {
    id: "sma",
    x: 17, // percentage from left
    y: 56, // percentage from top
    label: "Sektor SMA",
    category: "Pendidikan & Akademik",
    badge: "🏛️ SMA",
    title: "SMA — Sekolah Menengah Atas",
    subtitle: "Pendidikan Akademik Unggul & Karakter",
    description:
      "Membina siswa berprestasi di bidang sains, humaniora, dan teknologi, serta menumbuhkan jiwa kepemimpinan melalui organisasi kepramukaan dan riset.",
    tags: ["Akademik Unggul", "Kepramukaan", "Literasi Sains", "Persiapan Kampus"],
    color: "#2563eb",
    filterKey: "Pendidikan",
  },
  {
    id: "portal",
    x: 50,
    y: 28,
    label: "Gerbang Utama",
    category: "Pintu Layanan Terpadu",
    badge: "🚪 Portal Utama",
    title: "Gerbang Cabdisdik Wilayah I",
    subtitle: "Kebersamaan dalam Kebhinekaan",
    description:
      "Satu pintu layanan digital terintegrasi untuk seluruh satuan pendidikan SMA, SMK, dan SLB di lingkungan Cabang Dinas Pendidikan Wilayah I Prov. Sumatera Utara.",
    tags: ["Layanan Terpadu", "Akses Cepat", "Sistem Terkoneksi", "Multi-Peran"],
    color: "#059669",
    actionLink: "/login",
  },
  {
    id: "smk",
    x: 51,
    y: 69,
    label: "Sektor SMK",
    category: "Vokasi & Keahlian",
    badge: "⚙️ SMK",
    title: "SMK — Kejuruan & Vokasi",
    subtitle: "Terampil, Mandiri & Siap Kerja",
    description:
      "Menempa keahlian praktis berdaya saing global: teknologi drone/TI, tata boga kuliner nusantara & internasional, serta teknik mesin otomotif modern.",
    tags: ["SMK Teknologi & Drone", "SMK Kuliner & Boga", "SMK Otomotif Modern", "Siap Industri"],
    color: "#dc2626",
    filterKey: "Administrasi",
  },
  {
    id: "slb",
    x: 82,
    y: 58,
    label: "Sektor SLB",
    category: "Pendidikan Inklusif",
    badge: "🤝 SLB — Kita Sama",
    title: "SLB — Pendidikan Khusus & Inklusi",
    subtitle: "Setara, Berdaya & Berprestasi Bersama",
    description:
      "Pendidikan ramah disabilitas yang menjamin kesetaraan hak belajar, menggali potensi minat bakat seni, teknologi, dan kecakapan hidup tanpa batasan.",
    tags: ["Inklusi & Kesetaraan", "Fasilitas Ramah Disabilitas", "Bakat Seni & Budaya", "Kita Sama"],
    color: "#16a34a",
    filterKey: "Lainnya",
  },
];

export default function InteractiveHero({ user }) {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, tx: 0, ty: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [parallaxEnabled] = useState(true);

  // Mouse move handler for 3D parallax & dynamic spotlight
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width - 0.5) * 2; // -1 to 1
    const normY = (y / rect.height - 0.5) * 2; // -1 to 1

    setMousePos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    });

    if (parallaxEnabled) {
      setTilt({
        rx: Number((-normY * 4.5).toFixed(2)),
        ry: Number((normX * 5.5).toFixed(2)),
        tx: Number((normX * 12).toFixed(1)),
        ty: Number((normY * 8).toFixed(1)),
      });
    }
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0, tx: 0, ty: 0 });
  };

  const selectHotspot = (spot) => {
    if (activeHotspot?.id === spot.id) {
      setActiveHotspot(null);
    } else {
      setActiveHotspot(spot);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={heroRef}
      className="interactive-hero-wrapper"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Selamat Datang di Portal Cabdisdik Wilayah I"
    >
      {/* 1. Background Image Layer with 3D Parallax Tilt */}
      <div
        className="interactive-hero-viewport"
        style={{
          perspective: "1200px",
        }}
      >
        <div
          className="interactive-hero-canvas"
          style={{
            transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translate3d(${tilt.tx}px, ${tilt.ty}px, 0) scale(1.04)`,
            transition: isHovered
              ? "transform 0.12s cubic-bezier(0.2, 0, 0, 1)"
              : "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {/* Main Background Artwork */}
          <img
            src="/hero-bg.jpg"
            alt="Ilustrasi Selamat Datang di Portal Cabang Dinas Pendidikan Wilayah I - Siswa SMA, SMK, SLB Terkoneksi dan Berprestasi"
            className="interactive-hero-bg-img"
            loading="eager"
            fetchpriority="high"
          />

          {/* Dynamic Interactive Cursor Spotlight */}
          <div
            className="interactive-hero-spotlight"
            style={{
              background: `radial-gradient(circle 380px at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`,
              opacity: isHovered ? 1 : 0.3,
            }}
          />

          {/* Vignette & Soft Gradient Masks (guarantees seamless blending without empty gaps) */}
          <div className="interactive-hero-top-blend" />
          <div className="interactive-hero-bottom-blend" />

          {/* 2. Interactive Hotspots */}
          <div className="interactive-hero-hotspots-layer">
            {HOTSPOTS.map((spot) => {
              const isActive = activeHotspot?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  className={`hero-hotspot-anchor ${isActive ? "is-active" : ""}`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                  }}
                >
                  {/* Pulsing Beacon Button */}
                  <button
                    type="button"
                    className="hero-hotspot-pin"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectHotspot(spot);
                    }}
                    aria-label={`Informasi ${spot.label}`}
                    title={`Klik untuk info: ${spot.title}`}
                    style={{
                      "--spot-color": spot.color,
                    }}
                  >
                    <span className="hero-hotspot-pulse" />
                    <span className="hero-hotspot-core">
                      <span className="hero-hotspot-dot" />
                    </span>
                    <span className="hero-hotspot-badge-pill">
                      {spot.badge}
                    </span>
                  </button>

                  {/* Hotspot Floating Info Card */}
                  {isActive && (
                    <div
                      className={`hero-hotspot-popover ${
                        spot.y < 42 ? "hero-hotspot-popover--down" : "hero-hotspot-popover--up"
                      } ${
                        spot.x < 25 ? "hero-popover-align-left" : spot.x > 75 ? "hero-popover-align-right" : ""
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="hero-popover-header">
                        <span
                          className="hero-popover-tag"
                          style={{ backgroundColor: `${spot.color}15`, color: spot.color }}
                        >
                          {spot.category}
                        </span>
                        <button
                          type="button"
                          className="hero-popover-close"
                          onClick={() => setActiveHotspot(null)}
                          aria-label="Tutup"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <h4 className="hero-popover-title">{spot.title}</h4>
                      <p className="hero-popover-desc">{spot.description}</p>

                      <div className="hero-popover-tags">
                        {spot.tags.map((tag, idx) => (
                          <span key={idx} className="hero-tag-item">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="hero-popover-actions">
                        {spot.actionLink ? (
                          <button
                            type="button"
                            className="hero-popover-btn hero-popover-btn--primary"
                            onClick={() => navigate(user ? "/dashboard" : "/login")}
                          >
                            <span>{user ? "Buka Dashboard" : "Masuk ke Portal"}</span>
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="hero-popover-btn hero-popover-btn--primary"
                            onClick={() => scrollToSection("aplikasi")}
                          >
                            <span>Lihat Aplikasi</span>
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Floating Overlay Navigation Bar & Quick Controls */}
      <div className="interactive-hero-controls-bar">
        <div className="hero-pills-cluster">
          <button
            type="button"
            className={`hero-nav-pill ${activeHotspot === null ? "is-active" : ""}`}
            onClick={() => setActiveHotspot(null)}
          >
            <Sparkles size={14} />
            <span>Jelajahi Semua</span>
          </button>

          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              className={`hero-nav-pill ${activeHotspot?.id === spot.id ? "is-active" : ""}`}
              onClick={() => selectHotspot(spot)}
            >
              <span>{spot.badge}</span>
            </button>
          ))}
        </div>

        {/* Quick CTA Actions */}
        <div className="hero-quick-actions">
          <button
            type="button"
            className="hero-action-chip"
            onClick={() => scrollToSection("cara-kerja")}
            title="Gulir ke Panduan"
          >
            <span>Cara Kerja</span>
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="hero-action-chip hero-action-chip--primary"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
          >
            <span>{user ? "Dashboard" : "Masuk"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Bottom Hint */}
      <div className="interactive-hero-hint">
        <span className="hint-indicator" />
        <span>Gerakkan mouse & klik titik interaktif untuk info sektor SMA, SMK & SLB</span>
      </div>
    </section>
  );
}
