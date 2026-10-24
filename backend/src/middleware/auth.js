import jwt from "jsonwebtoken";
import { supabaseAdmin, supabaseForToken } from "../supabase.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

function bearerToken(req) {
  // Token dikirim client melalui header: Authorization: Bearer <token>.
  const header = req.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Token autentikasi diperlukan." });
  }

  // Coba verifikasi sebagai JWT sekolah terlebih dahulu
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type === "school") {
      // Token sekolah valid — set req.user dengan data sekolah
      req.user = {
        id: decoded.npsn,
        npsn: decoded.npsn,
        name: decoded.name,
        role: "school_user",
        type: "school",
        profile: { role: "school_user" },
      };
      req.accessToken = token;
      return next();
    }
  } catch (_jwtError) {
    // Bukan token JWT sekolah — lanjut ke Supabase Auth
  }

  // Supabase memvalidasi token dan memastikan user masih terdaftar.
  const { data, error } = await supabaseForToken(token).auth.getUser();
  if (error || !data.user) {
    return res.status(401).json({ error: "Token autentikasi tidak valid." });
  }

  // Ambil role dari database agar role tidak dapat dipalsukan dari client.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("requireAuth profileError:", profileError);
    return res.status(500).json({ error: "Gagal mengambil data profil pengguna." });
  }

  if (!profile) {
    return res.status(401).json({ error: "Profil pengguna tidak ditemukan. Silakan login kembali." });
  }

  req.user = { ...data.user, profile };
  req.accessToken = token;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    // Middleware ini harus dipasang setelah requireAuth.
    const userRole = req.user?.profile?.role || req.user?.role;
    if (!req.user || !roles.includes(userRole)) {
      return res.status(403).json({ error: "Anda tidak memiliki akses." });
    }
    next();
  };
}

export async function requireApplicationAccess(req, res, next) {
  const userRole = req.user?.profile?.role || req.user?.role;

  // Super user otomatis memiliki akses ke seluruh aplikasi.
  if (userRole === "super_user") return next();

  // School user: cek akses dari tabel school_application_access
  if (userRole === "school_user") {
    const { data, error } = await supabaseAdmin
      .from("school_application_access")
      .select("application_id")
      .eq("school_npsn", req.user.npsn || req.user.id)
      .eq("application_id", req.params.id)
      .maybeSingle();

    if (error) return next(error);
    if (!data) {
      return res
        .status(403)
        .json({ error: "Sekolah Anda tidak memiliki akses ke aplikasi ini." });
    }
    return next();
  }

  // Medium user harus memiliki baris akses untuk aplikasi yang diminta.
  const { data, error } = await supabaseAdmin
    .from("user_application_access")
    .select("application_id")
    .eq("user_id", req.user.id)
    .eq("application_id", req.params.id)
    .maybeSingle();

  if (error) return next(error);
  if (!data) {
    return res
      .status(403)
      .json({ error: "Anda tidak memiliki akses ke aplikasi ini." });
  }
  next();
}
