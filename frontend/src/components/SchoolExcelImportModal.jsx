import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import api from "../api";
import { readSchoolExcel } from "../utils/schoolExcel";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function rowLabel(row) {
  const school = row.name || row.npsn || "Data sekolah";
  return `Baris ${row.rowNumber} — ${school}`;
}

export default function SchoolExcelImportModal({ onClose, onImported }) {
  const [fileName, setFileName] = useState("");
  const [schoolRows, setSchoolRows] = useState([]);
  const [fileError, setFileError] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);

  const validRows = useMemo(
    () => schoolRows.filter((row) => row.errors.length === 0),
    [schoolRows],
  );
  const skippedRows = useMemo(
    () => schoolRows.filter((row) => row.errors.length > 0),
    [schoolRows],
  );

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setFileName(file?.name || "");
    setSchoolRows([]);
    setFileError("");
    setImportResult(null);
    setProgress(0);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setFileError("Pilih file Excel dengan format .xlsx.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("Ukuran file maksimal 10 MB.");
      return;
    }

    setIsReadingFile(true);
    try {
      setSchoolRows(await readSchoolExcel(file));
    } catch (error) {
      setFileError(error.message || "File Excel tidak dapat dibaca.");
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleImport = async () => {
    if (isImporting || validRows.length === 0) return;

    setIsImporting(true);
    setProgress(0);
    const createdRows = [];
    const emailFailures = [];
    const requestFailures = [];
    const serverSkippedRows = [];

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      try {
        const { data } = await api.post("/api/schools", {
          npsn: row.npsn,
          name: row.name,
          email: row.email,
          phone: row.phone,
        });
        createdRows.push(row);
        if (data.notificationSent === false) {
          emailFailures.push({
            ...row,
            message: data.message || "Email password sementara gagal dikirim.",
          });
        }
      } catch (error) {
        const failedRow = {
          ...row,
          message: error.response?.data?.error || "Permintaan gagal. Periksa koneksi dan coba lagi.",
        };
        if ([400, 409].includes(error.response?.status)) {
          serverSkippedRows.push({ ...failedRow, errors: [failedRow.message] });
        } else {
          requestFailures.push(failedRow);
        }
      } finally {
        setProgress(index + 1);
      }
    }

    const result = {
      createdRows,
      emailFailures,
      requestFailures,
      skippedRows: [...skippedRows, ...serverSkippedRows],
    };
    setImportResult(result);
    setIsImporting(false);
    if (createdRows.length > 0) onImported?.(createdRows.length);
  };

  const issueRows = importResult
    ? [
        ...importResult.skippedRows.map((row) => ({
          ...row,
          message: row.errors.join(" "),
          type: "Dilewati",
        })),
        ...importResult.requestFailures.map((row) => ({ ...row, type: "Gagal dibuat" })),
        ...importResult.emailFailures.map((row) => ({
          ...row,
          type: "Akun dibuat, email gagal",
        })),
      ]
    : [];
  const hasSuccessfulImport = Boolean(importResult?.createdRows.length);

  return (
    <div
      className="modal-overlay"
      onClick={() => !isImporting && !isReadingFile && onClose()}
    >
      <section
        className="modal-card school-excel-import-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="school-excel-import-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 id="school-excel-import-title">Upload Akun Sekolah (Excel)</h3>
            <p className="school-excel-subtitle">
              Impor beberapa akun sekolah sekaligus dari workbook .xlsx.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            disabled={isImporting || isReadingFile}
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body school-excel-import-body">
          <label className="school-excel-file-input">
            <span><FileSpreadsheet size={18} /> Pilih file Excel (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={isReadingFile || isImporting}
              onChange={handleFileChange}
            />
          </label>
          {fileName && <span className="school-excel-filename">{fileName}</span>}
          {isReadingFile && <p role="status">Membaca file Excel...</p>}
          {fileError && (
            <div className="form-error" role="alert">
              <AlertCircle size={16} /> {fileError}
            </div>
          )}

          {schoolRows.length > 0 && (
            <div className="school-excel-preview" aria-live="polite">
              <p>
                Ditemukan <strong>{schoolRows.length}</strong> baris:{" "}
                <strong>{validRows.length}</strong> siap diimpor dan{" "}
                <strong>{skippedRows.length}</strong> akan dilewati.
              </p>
              {skippedRows.length > 0 && (
                <ul className="school-excel-issues">
                  {skippedRows.map((row) => (
                    <li key={`${row.rowNumber}-${row.npsn}`}>
                      <strong>{rowLabel(row)}:</strong> {row.errors.join(" ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isImporting && (
            <p className="school-excel-progress" role="status">
              Mengimpor {progress} dari {validRows.length} akun...
            </p>
          )}

          {importResult && (
            <div className="school-excel-result" aria-live="polite">
              <div className={hasSuccessfulImport ? "form-success" : "form-error"}>
                {hasSuccessfulImport
                  ? <CheckCircle2 size={16} />
                  : <AlertCircle size={16} />}
                <span>
                  {hasSuccessfulImport
                    ? `Impor selesai: ${importResult.createdRows.length} akun berhasil dibuat.`
                    : "Upload gagal: tidak ada akun yang berhasil dibuat."}
                  {" "}{importResult.requestFailures.length} gagal dibuat,{" "}
                  {importResult.skippedRows.length} dilewati, dan{" "}
                  {importResult.emailFailures.length} akun dibuat tetapi email password gagal dikirim.
                  {importResult.emailFailures.length > 0
                    && " Password sementara dapat dikirim ulang dari daftar sekolah."}
                </span>
              </div>
              {issueRows.length > 0 && (
                <ul className="school-excel-issues">
                  {issueRows.map((row) => (
                    <li key={`${row.type}-${row.rowNumber}-${row.npsn}`}>
                      <strong>{row.type} — {rowLabel(row)}:</strong> {row.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer school-excel-import-footer">
          <button
            type="button"
            className="btn-cancel"
            disabled={isImporting || isReadingFile}
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            type="button"
            className="btn-save-changes"
            disabled={
              isReadingFile
              || isImporting
              || validRows.length === 0
              || Boolean(importResult)
            }
            onClick={handleImport}
          >
            <Upload size={16} />
            {isImporting
              ? `Mengimpor ${progress}/${validRows.length}...`
              : `Impor ${validRows.length} Akun Valid`}
          </button>
        </div>
      </section>
    </div>
  );
}
