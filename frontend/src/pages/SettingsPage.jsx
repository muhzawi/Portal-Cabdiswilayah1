import React from "react";
import { useApp } from "../context/AppContext";

function SettingsPage() {
  const { theme, changeTheme } = useApp();
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Preferensi</span>
          <h1>Pengaturan</h1>
          <p>Sesuaikan pengalaman Anda di portal.</p>
        </div>
      </div>
      <div className="settings-card">
        <div className="setting-row">
          <div>
            <h3>Tampilan portal</h3>
            <p>Pilih tema yang nyaman untuk Anda gunakan.</p>
          </div>
          <div className="theme-switcher">
            <button
              className={theme === "light" ? "selected" : ""}
              onClick={() => changeTheme("light")}
            >
              Terang
            </button>
            <button
              className={theme === "dark" ? "selected" : ""}
              onClick={() => changeTheme("dark")}
            >
              Gelap
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <h3>Notifikasi</h3>
            <p>Dapatkan informasi terbaru tentang layanan portal.</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span />
          </label>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;