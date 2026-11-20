import { MAX_SCHOOL_IMPORT_ROWS, validateSchoolRows } from "./schoolImport";

const SCHOOL_HEADERS = ["npsn", "nama_sekolah", "email", "telepon"];
const HEADER_ALIASES = {
  npsn: ["npsn"],
  name: ["nama_sekolah", "nama"],
  email: ["email"],
  phone: ["telepon", "nomor_telepon", "no_telepon"],
};

async function loadXlsx() {
  const module = await import("@e965/xlsx");
  return module.default || module;
}

function normalizeHeader(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function getHeaderIndexes(headers) {
  const headerIndexes = {};
  for (const [fieldName, aliases] of Object.entries(HEADER_ALIASES)) {
    const matches = headers
      .map((header, index) => (aliases.includes(normalizeHeader(header)) ? index : -1))
      .filter((index) => index >= 0);
    if (matches.length === 0) {
      const label = fieldName === "name"
        ? "nama_sekolah"
        : fieldName === "phone"
          ? "telepon"
          : fieldName;
      throw new Error(`Kolom wajib "${label}" tidak ditemukan di baris pertama.`);
    }
    if (matches.length > 1) {
      throw new Error(`Kolom "${fieldName}" muncul lebih dari satu kali.`);
    }
    headerIndexes[fieldName] = matches[0];
  }
  return headerIndexes;
}

export async function readSchoolExcel(file) {
  const XLSX = await loadXlsx();
  let workbook;
  try {
    workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  } catch {
    throw new Error("File Excel tidak dapat dibaca. Pastikan formatnya .xlsx.");
  }

  const sheetName = workbook.SheetNames.includes("Data Sekolah")
    ? "Data Sekolah"
    : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error("File Excel tidak memiliki lembar kerja.");
  }

  const worksheetRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });
  if (worksheetRows.length === 0) {
    throw new Error("Lembar Data Sekolah harus memiliki header di baris pertama.");
  }

  const headerIndexes = getHeaderIndexes(worksheetRows[0]);
  const rows = worksheetRows.slice(1)
    .map((cells, index) => ({
      rowNumber: index + 2,
      columnCount: cells.length,
      npsn: String(cells[headerIndexes.npsn] ?? "").trim(),
      name: String(cells[headerIndexes.name] ?? "").trim(),
      email: String(cells[headerIndexes.email] ?? "").trim().toLowerCase(),
      phone: String(cells[headerIndexes.phone] ?? "").trim(),
    }))
    .filter((row) => row.npsn || row.name || row.email || row.phone);

  if (rows.length === 0) {
    throw new Error("Lembar Data Sekolah belum berisi data akun.");
  }
  if (rows.length > MAX_SCHOOL_IMPORT_ROWS) {
    throw new Error(`Maksimal ${MAX_SCHOOL_IMPORT_ROWS} baris akun sekolah per upload.`);
  }

  return validateSchoolRows(rows);
}

export async function createSchoolExcelTemplate() {
  const XLSX = await loadXlsx();
  const workbook = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.aoa_to_sheet([SCHOOL_HEADERS]);
  dataSheet["!cols"] = [{ wch: 14 }, { wch: 32 }, { wch: 36 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Data Sekolah");

  const exampleSheet = XLSX.utils.aoa_to_sheet([
    SCHOOL_HEADERS,
    ["12345678", "SMA Negeri 1 Contoh", "contoh@sekolah.sch.id", "081234567890"],
    [],
    ["Contoh saja. Salin baris data ke lembar Data Sekolah dan ganti dengan data sebenarnya."],
  ]);
  exampleSheet["!cols"] = [{ wch: 14 }, { wch: 32 }, { wch: 36 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, exampleSheet, "Contoh Pengisian");

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}
