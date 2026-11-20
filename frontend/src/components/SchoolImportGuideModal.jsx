import { useState } from "react";
import { AlertCircle, Download, FileSpreadsheet, X } from "lucide-react";
import { createSchoolExcelTemplate } from "../utils/schoolExcel";

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export default function SchoolImportGuideModal({ onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    setError("");
    try {
      const buffer = await createSchoolExcelTemplate();
      const url = URL.createObjectURL(new Blob([buffer], { type: EXCEL_MIME_TYPE }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "template-akun-sekolah.xlsx";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (downloadError) {
      setError(downloadError.message || "Template Excel gagal dibuat.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-card school-import-guide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="school-import-guide-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="school-import-guide-heading">
            <FileSpreadsheet size={22} />
            <div>
              <h3 id="school-import-guide-title">Panduan Upload Akun Sekolah</h3>
              <p>Gunakan workbook Excel dengan format yang benar.</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body school-import-guide-body">
          <div className="school-import-guide-actions">
            <p>
              Unduh template Excel. Di dalamnya ada lembar <strong>Data Sekolah</strong>
              untuk diisi dan lembar <strong>Contoh Pengisian</strong> sebagai panduan.
            </p>
            <button
              type="button"
              className="btn-save-changes"
              disabled={isDownloading}
              onClick={handleDownloadTemplate}
            >
              <Download size={16} />
              {isDownloading ? "Menyiapkan template..." : "Unduh Template Excel"}
            </button>
          </div>

          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <h4>Format kolom wajib</h4>
            <div className="school-import-guide-table-wrap">
              <table className="school-import-guide-table">
                <thead>
                  <tr>
                    <th>npsn</th>
                    <th>nama_sekolah</th>
                    <th>email</th>
                    <th>telepon</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>12345678</td>
                    <td>SMA Negeri 1 Contoh</td>
                    <td>contoh@sekolah.sch.id</td>
                    <td>081234567890</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4>Langkah dan ketentuan</h4>
            <ol className="school-import-guide-list">
              <li>Isi data mulai baris kedua di lembar <strong>Data Sekolah</strong>; jangan ubah nama header.</li>
              <li>Satu baris untuk satu sekolah. NPSN harus 8 digit, email harus valid, dan telepon berisi 8-15 digit.</li>
              <li>Format NPSN dan telepon sebagai teks agar angka nol di depan tidak terhapus Excel.</li>
              <li>Unggah file <strong>.xlsx</strong> maksimal 10 MB dan 500 sekolah. Lembar Contoh Pengisian hanya untuk referensi.</li>
              <li>Baris valid tetap dibuat; baris tidak valid atau duplikat dilewati dan dilaporkan. Password sementara dikirim ke email sekolah.</li>
            </ol>
          </div>

          <p className="school-import-guide-note">
            Akun baru mendapat akses awal ke aplikasi kategori Pendidikan.
            Jika email password sementara gagal terkirim, superadmin dapat mengirim ulang dari daftar sekolah.
          </p>
        </div>

        <div className="modal-footer school-import-guide-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Tutup
          </button>
        </div>
      </section>
    </div>
  );
}
