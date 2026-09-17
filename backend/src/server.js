import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { supabase, supabaseAdmin, supabaseForToken } from "./supabase.js";
import {
  requireApplicationAccess,
  requireAuth,
  requireRole,
} from "./middleware/auth.js";

// Membuat instance Express dan mengambil port dari environment.
const app = express();
const port = Number(process.env.PORT || 3000);

const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const configuredOrigins = new Set(
  [rawFrontendUrl, "http://localhost:5173", "http://127.0.0.1:5173", ...envOrigins].map(
    (url) => url.replace(/\/+$/, ""),
  ),
);

// Middleware keamanan, CORS, parsing JSON, dan logging request.
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan permintaan tanpa origin (misal: Postman, curl, mobile app, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, "");

      if (
        configuredOrigins.has("*") ||
        configuredOrigins.has(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked] Origin tidak diizinkan: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan("tiny"));

// Endpoint sederhana untuk memeriksa apakah API sedang berjalan.
app.get("/", (_req, res) =>
  res.json({ message: "Portal Disdikwilayah API is running", health: "/health" })
);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Endpoint publik untuk mengambil daftar aplikasi publik dari database.
app.get("/api/public-apps", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("id, name, category, description, status, version, url")
      .order("name");
    if (error) return next(error);
    res.json({ applications: data });
  } catch (error) {
    next(error);
  }
});

// Membuat akun baru melalui Supabase Auth.
app.post("/auth/signup", async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Email dan password minimal 8 karakter wajib diisi." });
    }

    const targetRole = role === "super_user" ? "super_user" : "medium_user";

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split("@")[0],
        role: targetRole,
        status: targetRole === "super_user" ? "approved" : "pending",
      },
    });
    if (error) return res.status(400).json({ error: error.message });

    if (data?.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName || email.split("@")[0],
        role: targetRole,
        status: targetRole === "super_user" ? "approved" : "pending",
        updated_at: new Date().toISOString(),
      });
    }

    res.status(201).json({ session: data.session, user: data.user });
  } catch (error) {
    next(error);
  }
});

// Endpoint registrasi user baru (POST /api/auth/register)
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Validasi Input di Backend
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Nama lengkap minimal 2 karakter wajib diisi." });
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password minimal 8 karakter wajib diisi." });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "Konfirmasi password tidak cocok dengan password." });
    }

    // 2. Simpan Data User ke Supabase menggunakan Admin API (menghindari email rate limit dan konfirmasi email manual)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name.trim(),
        role: "medium_user",
        status: "pending",
      },
    });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("unique constraint") ||
        error.status === 422
      ) {
        return res.status(400).json({
          error: "Email sudah terdaftar. Silakan gunakan email lain.",
        });
      }
      return res.status(400).json({ error: error.message });
    }

    // Pastikan profile tersimpan dengan status 'pending'
    if (data?.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        full_name: name.trim(),
        role: "medium_user",
        status: "pending",
        updated_at: new Date().toISOString(),
      });
    }

    res.status(201).json({
      message:
        "Registrasi berhasil! Akun Anda sedang dalam status pending. Silakan tunggu persetujuan (approval) dari Super User sebelum dapat masuk.",
      user: data.user,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    // Supabase memverifikasi email dan password lalu mengembalikan access token.
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      return res.status(401).json({ error: "Email atau password salah." });

    // Data role dan status disimpan di tabel profiles dan user_metadata.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (profileError) return next(profileError);

    // Cek status konfirmasi/persetujuan akun
    const accountStatus =
      profile.status || data.user.user_metadata?.status || "approved";

    if (accountStatus === "pending") {
      return res.status(403).json({
        error:
          "Akun Anda masih dalam proses verifikasi (pending). Silakan hubungi Super User untuk konfirmasi.",
      });
    }

    if (accountStatus === "rejected") {
      return res.status(403).json({
        error:
          "Akun Anda telah ditolak (rejected). Anda tidak dapat masuk ke portal.",
      });
    }

    const fullProfile = { ...profile, status: accountStatus };
    res.json({
      session: data.session,
      user: { ...data.user, profile: fullProfile },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/forgot-password", async (req, res, next) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Alamat email tidak valid." });
    }

    const redirectTo =
      process.env.RESET_PASSWORD_URL ||
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      const msg = error.message || "";
      if (
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("security purposes") ||
        msg.toLowerCase().includes("exceeded") ||
        error.status === 429
      ) {
        return res.status(429).json({
          error:
            "Batas pengiriman email tercapai. Silakan tunggu 1 hingga 5 menit sebelum mencoba mengirim ulang instruksi reset password.",
        });
      }
      return res.status(400).json({ error: error.message });
    }

    // Gunakan respons yang sama untuk email terdaftar maupun tidak terdaftar.
    // Ini mencegah endpoint mengungkap keberadaan akun.
    res.json({
      message: "Jika email terdaftar, instruksi reset password telah dikirim.",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/reset-password", requireAuth, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password baru minimal 8 karakter." });
    }

    const { error } = await supabaseForToken(req.accessToken).auth.updateUser({
      password,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Password berhasil diperbarui." });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/logout", requireAuth, async (req, res, next) => {
  try {
    // Token sudah divalidasi oleh requireAuth sebelum proses logout dijalankan.
    const { error } = await supabaseAdmin.auth.admin.signOut(req.accessToken);
    if (error) return next(error);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/auth/me", requireAuth, (req, res) => {
  // Mengembalikan user dan profile yang sudah ditempel oleh middleware.
  res.json({ user: req.user });
});

// Hanya super user yang dapat melihat dan mengelola seluruh pengguna.
app.get(
  "/api/users",
  requireAuth,
  requireRole("super_user"),
  async (_req, res, next) => {
    try {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (profileError) return next(profileError);

      const { data: authUsers, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (authError) return next(authError);

      const { data: accessData } = await supabaseAdmin
        .from("user_application_access")
        .select("user_id, application_id");

      const accessMap = new Map();
      (accessData || []).forEach((row) => {
        if (!accessMap.has(row.user_id)) {
          accessMap.set(row.user_id, []);
        }
        accessMap.get(row.user_id).push(row.application_id);
      });

      const userMap = new Map((authUsers?.users || []).map((u) => [u.id, u]));

      const users = (profiles || []).map((p) => {
        const authUser = userMap.get(p.id);
        return {
          id: p.id,
          full_name:
            p.full_name || authUser?.user_metadata?.full_name || "Tanpa Nama",
          email: authUser?.email || "-",
          role: p.role || "medium_user",
          status: p.status || authUser?.user_metadata?.status || "approved",
          app_access: accessMap.get(p.id) || [],
          created_at: p.created_at || authUser?.created_at,
          updated_at: p.updated_at || authUser?.updated_at,
        };
      });

      res.json({ users });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  "/api/users/:id",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", req.params.id)
        .single();
      if (profileError) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan." });
      }

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
        req.params.id,
      );
      const authUser = authData?.user;

      const { data: accessData } = await supabaseAdmin
        .from("user_application_access")
        .select("application_id")
        .eq("user_id", req.params.id);

      const app_access = (accessData || []).map((item) => item.application_id);

      const user = {
        id: profile.id,
        full_name:
          profile.full_name ||
          authUser?.user_metadata?.full_name ||
          "Tanpa Nama",
        email: authUser?.email || "-",
        role: profile.role || "medium_user",
        status: profile.status || authUser?.user_metadata?.status || "approved",
        app_access,
        created_at: profile.created_at || authUser?.created_at,
        updated_at: profile.updated_at || authUser?.updated_at,
      };

      res.json({ user });
    } catch (error) {
      next(error);
    }
  },
);

app.patch(
  "/api/users/:id/approve",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    try {
      const now = new Date().toISOString();
      // Update profiles
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .update({ status: "approved", updated_at: now })
        .eq("id", req.params.id)
        .select("*")
        .single();

      // Update auth user_metadata
      await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
        user_metadata: { status: "approved" },
      });

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
        req.params.id,
      );
      const authUser = authData?.user;

      const updatedUser = {
        id: req.params.id,
        full_name:
          profile?.full_name ||
          authUser?.user_metadata?.full_name ||
          "Tanpa Nama",
        email: authUser?.email || "-",
        role: profile?.role || "medium_user",
        status: "approved",
        created_at: profile?.created_at || authUser?.created_at,
        updated_at: now,
      };

      res.json({
        message: "Akun pengguna berhasil disetujui (Approved).",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.patch(
  "/api/users/:id/reject",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    try {
      const now = new Date().toISOString();
      // Update profiles
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .update({ status: "rejected", updated_at: now })
        .eq("id", req.params.id)
        .select("*")
        .single();

      // Update auth user_metadata
      await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
        user_metadata: { status: "rejected" },
      });

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
        req.params.id,
      );
      const authUser = authData?.user;

      const updatedUser = {
        id: req.params.id,
        full_name:
          profile?.full_name ||
          authUser?.user_metadata?.full_name ||
          "Tanpa Nama",
        email: authUser?.email || "-",
        role: profile?.role || "medium_user",
        status: "rejected",
        created_at: profile?.created_at || authUser?.created_at,
        updated_at: now,
      };

      res.json({
        message: "Akun pengguna telah ditolak (Rejected).",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.delete(
  "/api/users/:id",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    try {
      const targetId = req.params.id;

      if (targetId === req.user.id) {
        return res
          .status(400)
          .json({ error: "Anda tidak dapat menghapus akun Anda sendiri." });
      }

      // Hapus data akses aplikasi & profile dari database
      await supabaseAdmin
        .from("user_application_access")
        .delete()
        .eq("user_id", targetId);
      await supabaseAdmin.from("profiles").delete().eq("id", targetId);

      // Hapus akun dari Supabase Auth
      const { error: deleteAuthError } =
        await supabaseAdmin.auth.admin.deleteUser(targetId);
      if (deleteAuthError) {
        console.error(
          "Gagal menghapus user dari Supabase Auth:",
          deleteAuthError.message,
        );
      }

      res.json({
        message: "Akun pengguna berhasil dihapus secara permanen.",
        userId: targetId,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.patch(
  "/api/users/:id/role",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    const { role } = req.body;
    // Batasi nilai role agar tidak ada nilai sembarang masuk ke database.
    if (!["super_user", "medium_user"].includes(role)) {
      return res.status(400).json({ error: "Role tidak valid." });
    }
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("id, full_name, role, created_at, updated_at")
      .single();
    if (error) return next(error);
    res.json({ user: data });
  },
);

app.put(
  "/api/users/:id/app-access",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    const { applicationIds } = req.body;
    if (
      !Array.isArray(applicationIds) ||
      applicationIds.some((id) => typeof id !== "string")
    ) {
      return res
        .status(400)
        .json({ error: "applicationIds harus berupa array string." });
    }

    // Cek role dari user target
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.params.id)
      .single();
    if (targetError) return next(targetError);

    const targetRole = targetProfile.role;

    // Untuk menghindari penghentian oleh DB trigger lama, switch role sementara ke super_user saat insert
    if (targetRole === "medium_user") {
      await supabaseAdmin
        .from("profiles")
        .update({ role: "super_user" })
        .eq("id", req.params.id);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("user_application_access")
      .delete()
      .eq("user_id", req.params.id);

    if (deleteError) {
      if (targetRole === "medium_user") {
        await supabaseAdmin
          .from("profiles")
          .update({ role: targetRole })
          .eq("id", req.params.id);
      }
      return next(deleteError);
    }

    if (applicationIds.length) {
      const rows = applicationIds.map((applicationId) => ({
        user_id: req.params.id,
        application_id: applicationId,
      }));
      const { error: insertError } = await supabaseAdmin
        .from("user_application_access")
        .insert(rows);

      if (insertError) {
        if (targetRole === "medium_user") {
          await supabaseAdmin
            .from("profiles")
            .update({ role: targetRole })
            .eq("id", req.params.id);
        }
        return next(insertError);
      }
    }

    // Kembalikan role target pengguna ke role sebenarnya
    if (targetRole === "medium_user") {
      await supabaseAdmin
        .from("profiles")
        .update({ role: targetRole })
        .eq("id", req.params.id);
    }

    res.json({ userId: req.params.id, applicationIds });
  },
);

app.get("/api/apps", requireAuth, async (_req, res, next) => {
  // Super user melihat semua aplikasi; medium user melihat semua aplikasi yang diizinkan oleh Super Admin.
  let query = supabaseAdmin
    .from("applications")
    .select("id, name, category, description, status, version, url")
    .order("name");
  if (_req.user.profile.role === "medium_user") {
    const { data: access, error: accessError } = await supabaseAdmin
      .from("user_application_access")
      .select("application_id")
      .eq("user_id", _req.user.id);
    if (accessError) return next(accessError);
    const ids = (access || []).map((item) => item.application_id);
    query = query.in("id", ids.length ? ids : ["__no_access__"]);
  }
  const { data, error } = await query;
  if (error) return next(error);
  res.json({ applications: data });
});

app.get(
  "/api/apps/:id",
  requireAuth,
  requireApplicationAccess,
  async (req, res, next) => {
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("id, name, category, description, status, version, url")
      .eq("id", req.params.id)
      .single();
    if (error)
      return res.status(404).json({ error: "Aplikasi tidak ditemukan." });
    res.json({ application: data });
  },
);

app.get(
  "/api/apps/:id/redirect",
  requireAuth,
  requireApplicationAccess,
  async (req, res, next) => {
    // URL diambil dari database, bukan dari input URL milik client.
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("url, status")
      .eq("id", req.params.id)
      .single();
    if (error)
      return res.status(404).json({ error: "Aplikasi tidak ditemukan." });
    // Aplikasi dalam maintenance/offline tidak boleh dibuka.
    if (data.status !== "available") {
      return res.status(409).json({ error: "Aplikasi sedang tidak tersedia." });
    }
    res.json({ url: data.url });
  },
);

app.post(
  "/api/apps",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    try {
      const { name, category, description, status, version, url, id } =
        req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Nama aplikasi wajib diisi." });
      }

      if (!category || typeof category !== "string" || !category.trim()) {
        return res
          .status(400)
          .json({ error: "Kategori aplikasi wajib diisi." });
      }

      if (!url || typeof url !== "string" || !/^https?:\/\//.test(url.trim())) {
        return res
          .status(400)
          .json({ error: "URL aplikasi wajib diawali http:// atau https://" });
      }

      const generatedId =
        id?.trim() ||
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      const appData = {
        id: generatedId || `app-${Date.now()}`,
        name: name.trim(),
        category: category.trim(),
        description: description ? description.trim() : "",
        status: ["available", "maintenance", "offline"].includes(status)
          ? status
          : "available",
        version: version ? version.trim() : "1.0.0",
        url: url.trim(),
      };

      const { data, error } = await supabaseAdmin
        .from("applications")
        .insert(appData)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res
            .status(400)
            .json({
              error: "Aplikasi dengan ID / nama tersebut sudah terdaftar.",
            });
        }
        return next(error);
      }

      res.status(201).json({
        message: `Aplikasi ${data.name} berhasil ditambahkan!`,
        application: data,
      });
    } catch (err) {
      next(err);
    }
  },
);

app.patch(
  "/api/apps/:id",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    // Hanya kolom berikut yang boleh diubah oleh super user.
    const allowed = [
      "name",
      "category",
      "description",
      "status",
      "version",
      "url",
    ];
    const changes = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );
    const { data, error } = await supabaseAdmin
      .from("applications")
      .update(changes)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return next(error);
    res.json({ application: data });
  },
);

app.delete(
  "/api/apps/:id",
  requireAuth,
  requireRole("super_user"),
  async (req, res, next) => {
    try {
      const appId = req.params.id;

      // Hapus keterhubungan akses aplikasi terlebih dahulu
      await supabaseAdmin
        .from("user_application_access")
        .delete()
        .eq("application_id", appId);

      // Hapus aplikasi dari katalog database
      const { data, error } = await supabaseAdmin
        .from("applications")
        .delete()
        .eq("id", appId)
        .select()
        .single();

      if (error) {
        return res
          .status(400)
          .json({ error: "Gagal menghapus aplikasi atau aplikasi tidak ditemukan." });
      }

      res.json({
        message: `Aplikasi ${data?.name || appId} berhasil dihapus dari portal.`,
        appId,
      });
    } catch (err) {
      next(err);
    }
  },
);

app.use((error, _req, res, _next) => {
  // Satu error handler terpusat agar detail error internal tidak dikirim ke client.
  console.error(error);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

if (!process.env.VERCEL) {
  app.listen(port, () =>
    console.log(`API listening on http://localhost:${port}`)
  );
}

export default app;
