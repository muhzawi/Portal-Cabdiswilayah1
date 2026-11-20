import React from "react";
import { useApp } from "../context/AppContext";

function SettingsPage() {
  const { theme, setTheme } = useApp();

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Preferensi</span>
          <h1>Pengaturan</h1>
          <p>Sesuaikan pengalaman Anda di portal.</p>
        </div>
      </div>
      <div className="settings-card settings-preferences-card">
        <div className="setting-row">
          <div>
            <h3>Notifikasi</h3>
            <p>Dapatkan informasi terbaru tentang layanan portal.</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked aria-label="Aktifkan notifikasi" />
            <span />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <h3>Mode gelap</h3>
            <p>Gunakan tampilan gelap di portal.</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
              aria-label="Aktifkan mode gelap"
            />
            <span />
          </label>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;