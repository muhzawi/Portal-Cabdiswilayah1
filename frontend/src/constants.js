import { BookOpen, FileText, Grid2X2, ShieldCheck } from "lucide-react";

export const publicApps = [
  { id: "e-arsip", name: "E-Arsip", category: "Administrasi", description: "Kelola arsip digital secara aman dan terstruktur.", icon: FileText, status: "available", version: "1.0.0" },
  { id: "kepegawaian", name: "Kepegawaian", category: "Kepegawaian", description: "Informasi data dan layanan kepegawaian.", icon: ShieldCheck, status: "available", version: "1.2.0" },
  { id: "inventaris", name: "Inventaris", category: "Administrasi", description: "Pantau aset dan inventaris sekolah dengan mudah.", icon: FileText, status: "maintenance", version: "1.8.0" },
  { id: "akademik", name: "Akademik", category: "Pendidikan", description: "Akses informasi akademik dalam satu dashboard.", icon: BookOpen, status: "offline", version: "2.4.1" }
];

export const categoryIcons = {
  "Administrasi": FileText,
  "Pendidikan": BookOpen,
  "Kepegawaian": ShieldCheck,
  "default": Grid2X2
};

export const getAppIcon = (category) => categoryIcons[category] || categoryIcons.default;