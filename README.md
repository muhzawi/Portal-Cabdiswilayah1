# Portal Cabang Dinas Pendidikan Wilayah 1

Portal web terpusat untuk Cabang Dinas Pendidikan Wilayah 1 Sumatera Utara. Portal ini menjadi satu pintu untuk menemukan dan mengakses aplikasi serta layanan pendidikan, dengan hak akses yang dikelola berdasarkan akun pengguna.

## Deskripsi Proyek

Proyek ini terdiri dari aplikasi frontend untuk pengguna dan REST API backend yang terhubung ke Supabase. Pengguna dapat melihat katalog layanan yang tersedia, sedangkan backend menangani autentikasi, profil, pengelolaan aplikasi, dan pemeriksaan hak akses. Informasi aplikasi seperti kategori, status layanan, versi, URL, dan ikon dikelola melalui katalog.

## Fitur Utama

- **Katalog aplikasi** dengan pencarian, kategori, deskripsi, versi, ikon, dan status layanan seperti tersedia, pemeliharaan, atau offline.
- **Autentikasi pengguna** untuk staf melalui Supabase, termasuk pendaftaran, login, reset kata sandi, dan pengelolaan profil.
- **Login sekolah menggunakan NPSN** serta pengaturan akses aplikasi untuk akun sekolah.
- **Kontrol akses berbasis peran**: `super_user` mengelola pengguna dan aplikasi; `medium_user` hanya dapat mengakses aplikasi yang diberikan; akun sekolah hanya dapat membuka aplikasi yang diizinkan.
- **Persetujuan akun**: pendaftaran pengguna baru dapat menunggu persetujuan pengelola sebelum dapat masuk.
- **Pengelolaan aplikasi dan pengguna** oleh super user, termasuk informasi katalog, status layanan, role, dan hak akses.
- **Favorit dan riwayat aplikasi terbaru** yang disimpan pada browser pengguna.
- **Halaman profil, pengaturan, dan tampilan responsif** untuk penggunaan desktop maupun perangkat seluler.

## Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8 |
| Styling dan ikon | Tailwind CSS 4, CSS, Lucide React, clsx |
| Komunikasi API | Axios |
| Backend | Node.js, Express 5 |
| Keamanan dan middleware backend | Supabase JS, bcryptjs, jsonwebtoken, Helmet, CORS, Morgan |
| Database dan autentikasi | Supabase PostgreSQL, Supabase Auth, Supabase Storage |
| Kualitas kode frontend | Oxlint |

## Struktur Proyek

```text
Portal-Cabdiswilayah1/
├── backend/
│   ├── api/                      # Entrypoint serverless untuk deployment
│   ├── scripts/                  # Skrip administrasi, termasuk seed pengguna
│   ├── src/
│   │   ├── middleware/           # Middleware autentikasi dan pemeriksaan akses
│   │   ├── server.js             # Endpoint REST API
│   │   └── supabase.js           # Inisialisasi klien Supabase
│   ├── supabase/
│   │   ├── full_schema_setup.sql # Skema lengkap untuk database baru
│   │   └── *.sql                 # Migrasi database bertahap
│   ├── .env.example              # Contoh konfigurasi backend
│   └── package.json
├── frontend/
│   ├── public/                   # Gambar, logo, dan favicon
│   ├── src/
│   │   ├── assets/               # Aset frontend
│   │   ├── components/           # Komponen UI
│   │   ├── context/              # State aplikasi dan sesi pengguna
│   │   ├── layouts/              # Layout halaman
│   │   ├── pages/                # Landing, login, dashboard, profil, dan lainnya
│   │   ├── App.jsx               # Routing utama
│   │   └── api.js                # Klien HTTP untuk backend
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Readme/                       # Dokumentasi pendukung
├── deploy.md                     # Catatan deployment
└── README.md
```

## Cara Menjalankan Proyek

### Persyaratan

- Node.js versi 20 atau lebih baru.
- npm versi 10 atau lebih baru.
- Project Supabase aktif dengan URL dan API key yang diperlukan.

### 1. Siapkan database Supabase

Untuk database baru, jalankan `backend/supabase/full_schema_setup.sql` melalui **SQL Editor** di dashboard Supabase. Jika database sudah menggunakan skema proyek ini, terapkan hanya migrasi `backend/supabase/*.sql` yang belum dijalankan, sesuai urutannya. Jangan jalankan skrip skema lengkap dan seluruh migrasi sekaligus pada database yang sudah terpasang.

### 2. Konfigurasikan dan jalankan backend

Dari direktori root proyek, buka terminal:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Isi `backend/.env` dengan kredensial project Supabase:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
JWT_SECRET=<secret-acak-yang-kuat>
```

Jangan gunakan service role key di frontend atau commit file `.env` ke repository. `JWT_SECRET` perlu berupa nilai rahasia yang kuat dan unik, terutama untuk token login sekolah.

Jalankan server backend:

```bash
npm run dev
```

API berjalan pada `http://localhost:3000`. Perintah produksi lokal tersedia melalui `npm start`.

### 3. Konfigurasikan dan jalankan frontend

Buka terminal baru dari direktori root proyek:

```powershell
cd frontend
npm install
```

Buat `frontend/.env` dan atur URL backend:

```env
VITE_API_URL=http://localhost:3000
```

Jalankan frontend:

```bash
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya [http://localhost:5173](http://localhost:5173).

### Perintah Pengembangan

Jalankan perintah dari direktori masing-masing (`backend` atau `frontend`).

| Direktori | Perintah | Keterangan |
| --- | --- | --- |
| `backend` | `npm run dev` | Menjalankan API dengan pemantauan perubahan source. |
| `backend` | `npm start` | Menjalankan API. |
| `backend` | `npm run seed` | Menjalankan skrip seed pengguna. |
| `frontend` | `npm run dev` | Menjalankan server pengembangan Vite. |
| `frontend` | `npm run build` | Membuat build produksi di `frontend/dist`. |
| `frontend` | `npm run preview` | Meninjau build produksi secara lokal. |
| `frontend` | `npm run lint` | Memeriksa kode dengan Oxlint. |

Hak Cipta © Cabang Dinas Pendidikan Wilayah 1 Sumatera Utara.
