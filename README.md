# Portal Cabang Dinas Pendidikan Wilayah 1

Portal web terpadu dan terpusat untuk **Cabang Dinas Pendidikan Wilayah 1 Sumatera Utara**. Aplikasi ini mengintegrasikan berbagai aplikasi dan layanan pendidikan (seperti E-Arsip, Akademik, Inventaris, Kepegawaian, dll.) ke dalam satu platform yang aman, responsif, dan mudah diakses.

---

## 📌 Ringkasan Proyek

Portal ini dirancang untuk mempermudah akses pengguna (aparatur sipil, staf, dan pengelola sekolah) terhadap seluruh aplikasi dinas dari satu gerbang utama tanpa perlu mengingat banyak URL terpisah.

### Fitur Utama

- **Katalog Layanan & Aplikasi**: Menampilkan seluruh aplikasi pendidikan yang tersedia beserta deskripsi, status layanan (*Available*, *Maintenance*, *Offline*), versi, dan kategori.
- **Autentikasi & Role-Based Access Control (RBAC)**:
  - **`super_user`**: Memiliki hak akses penuh ke seluruh aplikasi di portal, manajemen peran pengguna, serta pengelolaan katalog dan URL aplikasi target.
  - **`medium_user`**: Dibatasi hanya untuk mengakses aplikasi tertentu yang telah ditugaskan melalui hak akses pengguna (`user_application_access`).
- **Pengalihan URL Aman (Secure Redirection)**: Pengguna dialihkan ke URL aplikasi yang dituju melalui API backend yang terlebih dahulu memverifikasi token autentikasi dan status hak akses pengguna.
- **Manajemen Pengguna & Hak Akses (Panel Super User)**: Mengatur role pengguna serta menentukan aplikasi mana saja yang boleh dibuka oleh *medium user*.
- **Pencarian, Filter, & Favorit**: Pengguna dapat mencari aplikasi, menyaring berdasarkan kategori, menandai aplikasi favorit, dan melihat riwayat aplikasi yang baru dibuka.
- **Tampilan Modern & Responsif**: Menggunakan mode tampilan (Dark/Light mode) dan desain yang adaptif untuk perangkat desktop maupun mobile.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

### **Frontend**
- **React 19** – Library utama untuk membangun antarmuka pengguna berbasis komponen.
- **Vite 8** – Build tool & development server performa tinggi.
- **React Router v7** – Manajemen rilis halaman (Landing, Login, Register, Dashboard, Detail Aplikasi, Profile, Settings).
- **Tailwind CSS v4** – Framework utility-first CSS untuk styling antarmuka.
- **Axios** – HTTP client untuk komunikasi data dengan API backend.
- **Lucide React** – Koleksi ikon modern untuk UI.
- **Oxlint & Vitest** – Tooling linting kode cepat dan framework unit testing.

### **Backend**
- **Node.js (v20+) & Express v5** – Runtime dan framework API web server backend.
- **Supabase JS Client (`@supabase/supabase-js`)** – SDK untuk integrasi autentikasi dan PostgreSQL Supabase.
- **Helmet** – Middleware keamanan header HTTP.
- **CORS** – Pengaturan izin akses *Cross-Origin Resource Sharing*.
- **Morgan** – Middleware logging permintaan HTTP.

### **Database & Autentikasi**
- **Supabase Authentication** – Layanan otentikasi berbasis JWT (JSON Web Token).
- **Supabase PostgreSQL** – Database relasional yang dilengkapi *Row Level Security* (RLS) dan trigger otomatis untuk sinkronisasi profil pengguna (`profiles`).

---

## 📁 Struktur Proyek

```text
Portal-Disdikwilayah1/
├── backend/                  # Server Node.js + Express & Integrasi Supabase
│   ├── api/                  # Vercel serverless function entrypoint
│   ├── src/
│   │   ├── middleware/       # Middleware autentikasi JWT & verifikasi role
│   │   ├── server.js         # Entrypoint utama Express API & endpoint
│   │   └── supabase.js       # Inisialisasi Supabase client (Anon & Service Role)
│   ├── supabase/
│   │   └── 001_initial.sql   # Skrip migrasi skema database PostgreSQL Supabase
│   ├── .env.example          # Template variabel lingkungan backend
│   └── package.json
│
├── frontend/                 # Aplikasi Web Client React + Vite
│   ├── src/
│   │   ├── assets/           # Asset gambar & icon
│   │   ├── components/       # Komponen UI terpisah (Navbar, Sidebar, AppCard, dll)
│   │   ├── context/          # State management global (AuthContext, ThemeContext)
│   │   ├── layouts/          # Layout template halaman
│   │   ├── pages/            # Halaman utama (Dashboard, Landing, Login, dll)
│   │   ├── api.js            # Konfigurasi instance Axios
│   │   └── App.jsx           # Routing & komponen utama
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── Readme/                   # Dokumentasi pendukung & catatan pengujian
│   ├── ReadmeV1.md
│   ├── ReadmeV2.md
│   └── user.md               # Catatan akun pengujian demo
└── README.md                 # Dokumentasi utama proyek
```

---

## 🚀 Cara Menggunakan & Jalankan Proyek

### Prasyarat Sistem
- **Node.js** versi `20.x` atau lebih baru.
- **npm** versi `10.x` atau lebih baru.
- Akun dan project aktif di **Supabase**.

---

### 1. Konfigurasi Backend

1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```

2. Install dependensi backend:
   ```bash
   npm install
   ```

3. Buat file `.env` berdasarkan file `.env.example`:
   - Pada Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - Pada Linux/macOS:
     ```bash
     cp .env.example .env
     ```

4. Konfigurasi isi `.env`:
   ```env
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   SUPABASE_URL=https://<project-id>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

5. Setup Database Supabase:
   - Buka SQL Editor di Dashboard Supabase Anda.
   - Jalankan seluruh isi skrip [backend/supabase/001_initial.sql](file:///d:/Portal-Disdikwilayah1%20-%20backup/backend/supabase/001_initial.sql).
   - Skrip ini membuat tipe enum, tabel `profiles`, `applications`, `user_application_access`, trigger registrasi otomatis, RLS policies, serta data aplikasi awal (*seed data*).

6. Jalankan server backend dalam mode pengembangan:
   ```bash
   npm run dev
   ```
   Server backend akan berjalan di `http://localhost:3000`.

---

### 2. Konfigurasi Frontend

1. Buka terminal baru dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```

2. Install dependensi frontend:
   ```bash
   npm install
   ```

3. Buat/pastikan file `.env` berisi URL API backend:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Jalankan development server frontend:
   ```bash
   npm run dev
   ```

5. Buka alamat lokal yang muncul di terminal (biasanya `http://localhost:5173`).

---



---

## 📡 Dokumentasi Endpoint API Backend

 Header Autentikasi: `Authorization: Bearer <access_token_supabase>`

### Autentikasi (`/auth`)
- `POST /auth/signup` – Pendaftaran pengguna baru.
- `POST /auth/login` – Login pengguna (mengembalikan session & access token).
- `POST /auth/logout` – Logout dari sistem.
- `GET /auth/me` – Mengambil profil pengguna terautentikasi dan daftar aplikasi yang boleh diakses.

### Aplikasi & Katalog (`/api/apps`)
- `GET /api/apps` – Mengambil daftar aplikasi yang boleh diakses pengguna saat ini.
- `GET /api/apps/:id` – Mengambil detail informasi 1 aplikasi.
- `GET /api/apps/:id/redirect` – Memverifikasi hak akses dan mengembalikan URL tujuan aplikasi.
- `POST /api/apps` *(Super User)* – Menambahkan aplikasi baru ke katalog.
- `PATCH /api/apps/:id` *(Super User)* – Mengubah informasi/URL/status aplikasi.

### Manajemen Pengguna *(Super User)* (`/api/users`)
- `GET /api/users` – Mengambil seluruh daftar pengguna dan role masing-masing.
- `PATCH /api/users/:id/role` – Mengubah role pengguna (`super_user` / `medium_user`).
- `PUT /api/users/:id/app-access` – Mengatur daftar aplikasi yang dapat diakses oleh *medium user*.

---

## 📜 Perintah NPM (Scripts)

### Backend (`/backend`)
| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Jalankan backend dengan fitur `--watch` auto-reload saat ada perubahan kode. |
| `npm start` | Jalankan backend untuk lingkungan produksi. |

### Frontend (`/frontend`)
| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan Vite development server dengan HMR (Hot Module Replacement). |
| `npm run build` | Membuat bundel produksi di direktori `dist/`. |
| `npm run preview` | Menjalankan preview server lokal dari hasil build `dist/`. |
| `npm run lint` | Memeriksa kualitas & sintaks kode menggunakan Oxlint. |

---

## 📄 Lisensi

Hak Cipta © Cabang Dinas Pendidikan Wilayah 1 Sumatera Utara.
