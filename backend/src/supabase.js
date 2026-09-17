import { createClient } from "@supabase/supabase-js";

// Semua variable ini wajib tersedia agar server tidak berjalan dengan konfigurasi
// yang tidak lengkap atau mencoba mengakses Supabase secara tidak aman.
const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const rawUrl = process.env.SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

export const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Client admin hanya digunakan di server karena service role dapat melewati RLS.
// Jangan pernah mengirim service role key ke frontend/browser.
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export function supabaseForToken(token) {
  // Client ini meneruskan token user agar Supabase dapat memvalidasinya
  // sesuai konteks user yang sedang login.
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
