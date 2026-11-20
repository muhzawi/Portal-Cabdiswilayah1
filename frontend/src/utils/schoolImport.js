export const MAX_SCHOOL_IMPORT_ROWS = 500;

export function validateSchoolRows(rows) {
  const seenNpsn = new Set();
  const seenEmails = new Set();

  return rows.map((row) => {
    const errors = [];
    const phoneDigits = row.phone.replace(/\D/g, "");

    if (!/^\d{8}$/.test(row.npsn)) errors.push("NPSN harus 8 digit angka.");
    if (!row.name || row.name.length > 255) {
      errors.push("Nama sekolah wajib diisi dan maksimal 255 karakter.");
    }
    if (
      row.email.length > 255
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
    ) {
      errors.push("Email sekolah tidak valid.");
    }
    if (
      row.phone.length > 30
      || !/^\+?[0-9][0-9\s()-]*$/.test(row.phone)
      || phoneDigits.length < 8
      || phoneDigits.length > 15
    ) {
      errors.push("Telepon harus berisi 8-15 digit yang valid.");
    }
    if (row.columnCount !== 4) {
      errors.push("Baris harus memiliki tepat 4 kolom.");
    }
    if (/^\d{8}$/.test(row.npsn) && seenNpsn.has(row.npsn)) {
      errors.push("NPSN duplikat di dalam file.");
    }
    if (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
      && seenEmails.has(row.email)
    ) {
      errors.push("Email duplikat di dalam file.");
    }

    if (errors.length === 0) {
      seenNpsn.add(row.npsn);
      seenEmails.add(row.email);
    }

    return { ...row, errors };
  });
}
