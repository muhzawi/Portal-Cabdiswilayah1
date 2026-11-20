import { describe, expect, it } from "vitest";
import {
  createSchoolExcelTemplate,
  readSchoolExcel,
} from "./schoolExcel";

async function loadXlsx() {
  const module = await import("@e965/xlsx");
  return module.default || module;
}

describe("school Excel import", () => {
  it("creates an Excel template with a separate example worksheet", async () => {
    const XLSX = await loadXlsx();
    const buffer = await createSchoolExcelTemplate();
    const workbook = XLSX.read(buffer, { type: "array" });

    expect(workbook.SheetNames).toEqual(["Data Sekolah", "Contoh Pengisian"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Data Sekolah"], { header: 1 }))
      .toEqual([["npsn", "nama_sekolah", "email", "telepon"]]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Contoh Pengisian"], { header: 1 })[1])
      .toEqual(["12345678", "SMA Negeri 1 Contoh", "contoh@sekolah.sch.id", "081234567890"]);
  });

  it("reads account data from the Data Sekolah worksheet and validates rows", async () => {
    const XLSX = await loadXlsx();
    const buffer = await createSchoolExcelTemplate();
    const workbook = XLSX.read(buffer, { type: "array" });
    XLSX.utils.sheet_add_aoa(workbook.Sheets["Data Sekolah"], [
      ["00123456", "SMA Negeri 1", "sekolah@example.id", "081234567890"],
      ["12345679", "SMA Negeri 2", "sekolah@example.id", "081234567891"],
      ["bad", "SMA Negeri 3", "tidak-valid", "0812"],
    ], { origin: -1 });
    const populatedWorkbook = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const rows = await readSchoolExcel({
      arrayBuffer: async () => populatedWorkbook,
    });

    expect(rows[0].npsn).toBe("00123456");
    expect(rows[0].errors).toEqual([]);
    expect(rows[1].errors).toContain("Email duplikat di dalam file.");
    expect(rows[2].errors).toHaveLength(3);
  });

  it("rejects a workbook whose first sheet lacks the required headers", async () => {
    const XLSX = await loadXlsx();
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["npsn", "nama", "email"]]),
      "Data Sekolah",
    );
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    await expect(readSchoolExcel({
      arrayBuffer: async () => buffer,
    })).rejects.toThrow('Kolom wajib "telepon" tidak ditemukan di baris pertama.');
  });
});
