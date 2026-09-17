import { supabaseAdmin, supabaseForToken } from "../supabase.js";

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

  // Supabase memvalidasi token dan memastikan user masih terdaftar.
  const { data, error } = await supabaseForToken(token).auth.getUser();
  if (error || !data.user) {
    return res.status(401).json({ error: "Token autentikasi tidak valid." });
  }

  // Ambil role dari database agar role tidak dapat dipalsukan dari client.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", data.user.id)
    .single();

  if (profileError) return next(profileError);
  req.user = { ...data.user, profile };
  req.accessToken = token;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    // Middleware ini harus dipasang setelah requireAuth.
    if (!req.user || !roles.includes(req.user.profile.role)) {
      return res.status(403).json({ error: "Anda tidak memiliki akses." });
    }
    next();
  };
}

export async function requireApplicationAccess(req, res, next) {
  // Super user otomatis memiliki akses ke seluruh aplikasi.
  if (req.user?.profile.role === "super_user") return next();

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
