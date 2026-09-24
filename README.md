# Portal Cabang Dinas Pendidikan Wilayah 1

Portal web terpusat untuk mengakses katalog aplikasi dan layanan pendidikan Cabang Dinas Pendidikan Wilayah 1 Sumatera Utara. Repository ini berisi frontend React/Vite dan backend Express dalam satu monorepo.

## Fitur Utama

- Login, registrasi staff, JWT session, dan auto logout setelah 10 menit tidak aktif.
- Role-based access control dengan tiga role: **superadmin**, **admin**, dan **staff**.
- Approval/rejection pengguna baru oleh admin atau superadmin.
- Superadmin dapat mengelola role, akses aplikasi, katalog, dan log aktivitas.
- Admin dapat mengunggah aplikasi dan mengelola approval pengguna.
- Staff hanya dapat membuka aplikasi yang diberikan dan mengirim dokumen melalui aplikasi tersebut.
- Pencarian aplikasi, kategori, favorit, aplikasi terakhir dibuka, tema light/dark, dan tampilan responsive mobile.

## Tech Stack

### Frontend

- **React 19** untuk UI berbasis komponen.
- **Vite 8** sebagai development server dan production bundler.
- **React Router 7** untuk routing SPA.
- **Axios** untuk komunikasi REST API.
- **Lucide React** untuk ikon antarmuka.
- **CSS custom responsive** untuk desktop dan mobile.
- **Oxlint** untuk linting dan **Vitest/Testing Library** untuk kebutuhan testing.

### Backend

- **Node.js 20+** sebagai runtime.
- **Express 5** sebagai REST API server.
- **MySQL** melalui package `mysql2/promise`.
- **JWT** melalui `jsonwebtoken` untuk autentikasi session.
- **bcryptjs** untuk hashing password.
- **Helmet**, **CORS**, **Morgan**, dan **dotenv** untuk keamanan, konfigurasi, serta logging.

### Deployment

- **Vercel** dapat digunakan untuk frontend dan backend sebagai dua project terpisah.
- Backend menyediakan entrypoint serverless melalui `backend/api/index.js`.

## Struktur Repository

```text
Portal-Cabdiswilayah1/
├── backend/
│   ├── api/                  # Entry point serverless Vercel
│   ├── mysql/                # Migrasi database MySQL
│   ├── src/
│   │   ├── config/           # Konfigurasi CORS
│   │   ├── middleware/       # JWT auth dan role guard
│   │   ├── routes/           # Auth, users, apps, dan activity logs
│   │   ├── audit.js          # Helper pencatatan audit log
│   │   ├── db.js             # MySQL connection pool
│   │   └── server.js         # Bootstrap Express
│   ├── supabase/             # Migrasi legacy/reference Supabase
│   └── package.json
├── frontend/
│   ├── public/               # Asset publik
│   ├── src/
│   │   ├── components/       # Komponen UI
│   │   ├── context/          # State user, aplikasi, tema, dan session
│   │   ├── layouts/          # Layout dashboard
│   │   ├── pages/            # Landing, auth, dashboard, profile, settings
│   │   ├── api.js            # Axios instance dan token interceptor
│   │   └── App.jsx           # Routing utama
│   ├── vite.config.js
│   └── package.json
├── backup.sql                # Referensi backup database
├── deploy.md                 # Panduan deployment Vercel
└── README.md
```

## Prasyarat

- Git.
- Node.js `20.x` atau lebih baru.
- npm `10.x` atau lebih baru.
- MySQL `8.x` atau kompatibel.
- Terminal PowerShell, Command Prompt, atau shell Linux/macOS.

## Clone Repository

Ganti `<URL_REPOSITORY>` dengan URL Git repository proyek:

```bash
git clone <URL_REPOSITORY>
cd Portal-Cabdiswilayah1
```

Contoh GitHub:

```bash
git clone https://github.com/USERNAME/Portal-Cabdiswilayah1.git
cd Portal-Cabdiswilayah1
```

## Setup Database MySQL

1. Buat database kosong:

```sql
CREATE DATABASE portal_cabdiswilayah1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Jalankan skema tabel aplikasi dan user dari schema/backup database yang digunakan project.
3. Jalankan migrasi audit log:

```bash
mysql -u root -p portal_cabdiswilayah1 < backend/mysql/008_activity_logs.sql
```

4. Pastikan tabel berikut tersedia:

   - `users`
   - `applications`
   - `user_application_access`
   - `activity_logs`

> `backend/supabase/` adalah migrasi legacy/reference. Runtime backend saat ini memakai MySQL dari `backend/src/db.js`.

## Konfigurasi Backend

```bash
cd backend
npm install
```

Buat file `backend/.env`:

```env
PORT=3000
JWT_SECRET=ganti-dengan-secret-yang-kuat
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password_mysql_anda
DB_NAME=portal_cabdiswilayah1
```

Jangan commit file `.env` atau memasukkan password/database secret ke repository.

Jalankan backend:

```bash
npm run dev
```

API tersedia di `http://localhost:3000`.

## Konfigurasi Frontend

Buka terminal baru dari root project:

```bash
cd frontend
npm install
```

Buat file `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Jalankan frontend:

```bash
npm run dev
```

Buka URL Vite, biasanya `http://localhost:5173`.

## Menjalankan Keduanya

Gunakan dua terminal:

```text
Terminal 1: cd backend  && npm run dev
Terminal 2: cd frontend && npm run dev
```

Frontend membaca API dari `VITE_API_URL`. Backend harus mengizinkan origin frontend melalui `FRONTEND_URL`.

## Role dan Hak Akses

| Role | Hak akses |
| --- | --- |
| `superadmin` / `super_user` | Akses semua aplikasi, kelola aplikasi, user, role, hak akses, dan audit log. |
| `admin` | Upload aplikasi, melihat katalog, serta menyetujui atau menolak pendaftaran staff. |
| `staff` / `medium_user` | Membuka aplikasi yang ditugaskan dan mengirim dokumen melalui aplikasi tersebut. |

Pendaftaran publik selalu menghasilkan akun `staff` dengan status `pending`. Role `admin` hanya dapat diberikan oleh superadmin.

## Endpoint Utama

Endpoint terproteksi memakai header:

```http
Authorization: Bearer <jwt_token>
```

### Auth

- `POST /auth/register` - registrasi staff publik.
- `POST /auth/login` - login dan mendapatkan JWT.
- `PATCH /auth/profile` - mengubah nama lengkap user aktif.
- `POST /auth/reset-password` - ganti password dengan validasi password lama.
- `GET /auth/me` - mengambil data user aktif.
- `POST /auth/logout` - logout stateless.

### Aplikasi

- `GET /api/apps` - katalog sesuai role/akses user.
- `GET /api/apps/:id/redirect` - memvalidasi akses dan mengembalikan URL aplikasi.
- `POST /api/apps` - upload aplikasi oleh admin/superadmin.
- `PATCH /api/apps/:id` - edit aplikasi oleh superadmin.
- `DELETE /api/apps/:id` - hapus aplikasi oleh superadmin.

### User dan Audit

- `GET /api/users` - daftar user untuk admin/superadmin.
- `PATCH /api/users/:id/approve` - menyetujui user baru.
- `PATCH /api/users/:id/reject` - menolak user baru.
- `PATCH /api/users/:id/role` - mengubah role menjadi `admin` atau `staff`, khusus superadmin.
- `PUT /api/users/:id/app-access` - mengatur akses aplikasi, khusus superadmin.
- `GET /api/activity-logs` - melihat audit log, khusus superadmin.

## Perintah Development

### Backend

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan API dengan Nodemon. |
| `npm start` | Menjalankan API mode normal/production. |

### Frontend

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan Vite dengan hot reload. |
| `npm run build` | Memeriksa dan membuat bundle production. |
| `npm run preview` | Menjalankan preview hasil build. |
| `npm run lint` | Menjalankan Oxlint. |

Sebelum membuat pull request:

```bash
cd frontend
npm run lint
npm run build

cd ../backend
node --check src/server.js
```

## Deployment

Deployment frontend dan backend direkomendasikan sebagai dua project Vercel:

1. Deploy folder `backend` sebagai API.
2. Atur environment variable MySQL, `JWT_SECRET`, dan `FRONTEND_URL` di Vercel.
3. Deploy folder `frontend` dengan `VITE_API_URL` mengarah ke URL backend.
4. Pastikan CORS backend mengizinkan domain frontend production.

Panduan detail tersedia di [deploy.md](deploy.md).

## Lisensi

Hak Cipta © Cabang Dinas Pendidikan Wilayah 1 Sumatera Utara.
