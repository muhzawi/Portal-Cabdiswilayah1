import React, { useState, useEffect } from "react";
import { X, Plus, Pencil } from "lucide-react";
import api from "../api";
import { useApp } from "../context/AppContext";

const DEFAULT_CATEGORIES = [
  "Administrasi",
  "Pendidikan",
  "Kepegawaian",
  "Layanan",
];

const CUSTOM_CATEGORY_OPTION = "__OTHER__";

function AppFormModal({ isOpen, onClose, appToEdit = null, onSuccess }) {
  const { apps = [], refreshApps } = useApp() || {};

  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Administrasi");
  const [customCategory, setCustomCategory] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");
  const [version, setVersion] = useState("1.0.0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Ambil semua kategori unik dari data aplikasi yang ada + kategori standar
  const existingCategories = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...apps.map((a) => a.category).filter(Boolean),
    ])
  );

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg("");
    if (appToEdit) {
      // Mode Edit
      setName(appToEdit.name || "");
      setUrl(appToEdit.url || "");
      setDescription(appToEdit.description || "");
      setStatus(appToEdit.status || "available");
      setVersion(appToEdit.version || "1.0.0");

      const cat = appToEdit.category || "";
      if (existingCategories.includes(cat)) {
        setSelectedCategory(cat);
        setCustomCategory("");
      } else {
        setSelectedCategory(CUSTOM_CATEGORY_OPTION);
        setCustomCategory(cat);
      }
    } else {
      // Mode Tambah Baru
      setName("");
      setSelectedCategory("Administrasi");
      setCustomCategory("");
      setUrl("");
      setDescription("");
      setStatus("available");
      setVersion("1.0.0");
    }
  }, [isOpen, appToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const finalCategory =
      selectedCategory === CUSTOM_CATEGORY_OPTION
        ? customCategory.trim()
        : selectedCategory.trim();

    if (!name.trim()) {
      return setErrorMsg("Nama aplikasi wajib diisi.");
    }
    if (!finalCategory) {
      return setErrorMsg("Kategori aplikasi wajib diisi.");
    }
    if (!url.trim() || !/^https?:\/\//i.test(url.trim())) {
      return setErrorMsg("URL aplikasi wajib diawali http:// atau https://");
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        category: finalCategory,
        url: url.trim(),
        description: description.trim(),
        status,
        version: version.trim() || "1.0.0",
      };

      let responseMessage = "";

      if (appToEdit) {
        // PATCH edit aplikasi
        const res = await api.patch(`/api/apps/${appToEdit.id}`, payload);
        responseMessage =
          res.data?.message || `Aplikasi ${name} berhasil diperbarui!`;
      } else {
        // POST tambah aplikasi baru
        const res = await api.post("/api/apps", payload);
        responseMessage =
          res.data?.message || `Aplikasi ${name} berhasil ditambahkan!`;
      }

      if (refreshApps) {
        await refreshApps();
      }

      if (onSuccess) {
        onSuccess(responseMessage);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          `Gagal ${appToEdit ? "memperbarui" : "menambahkan"} aplikasi.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-form-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            {appToEdit ? (
              <>
                <Pencil size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Edit Aplikasi
              </>
            ) : (
              <>
                <Plus size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Tambah Aplikasi Baru
              </>
            )}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          <label>
            Nama Aplikasi *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: E-Perpustakaan, Si-Akademik"
              required
            />
          </label>

          <div className="form-grid-2">
            <label>
              Kategori Aplikasi *
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
              >
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value={CUSTOM_CATEGORY_OPTION}>
                  + Kategori Lainnya...
                </option>
              </select>
            </label>

            <label>
              Status Aplikasi
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="available">Available (Tersedia)</option>
                <option value="maintenance">Maintenance (Pemeliharaan)</option>
                <option value="offline">Offline</option>
              </select>
            </label>
          </div>

          {selectedCategory === CUSTOM_CATEGORY_OPTION && (
            <label className="custom-category-field">
              Nama Kategori Baru / Lainnya *
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Contoh: Keuangan, Sarpras, IT Support..."
                required
                autoFocus
              />
            </label>
          )}

          <label>
            URL Aplikasi / Link Web *
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://perpustakaan.disdikwil1.go.id"
              required
            />
          </label>

          <label>
            Deskripsi Singkat
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara singkat fungsi utama aplikasi..."
              rows={3}
            />
          </label>

          <label>
            Versi Aplikasi
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
          </label>

          {errorMsg && <div className="form-error">{errorMsg}</div>}

          <div
            className="action-buttons"
            style={{ justifyContent: "flex-end", marginTop: "15px" }}
          >
            <button
              type="button"
              className="btn-detail"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-approve"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Menyimpan..."
                : appToEdit
                ? "Simpan Perubahan"
                : "Simpan Aplikasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppFormModal;
