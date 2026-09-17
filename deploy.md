# 🚀 Panduan Deploy Portal Disdik Wilayah 1 ke Vercel

Dokumen ini menjelaskan langkah-langkah lengkap untuk melakukan **deployment** aplikasi **Portal Disdik Wilayah 1** (Backend API & Frontend Client) ke platform **Vercel**.

---

## 📌 Arsitektur Deployment

Proyek ini menggunakan struktur **Monorepo** yang terdiri dari dua komponen utama:

1. **`backend/`**: Node.js + Express API serverless function (`api/index.js` & `vercel.json`).
2. **`frontend/`**: React 19 + Vite single-page application (`dist/` & `vercel.json`).

> 💡 **Metode Terbaik (Rekomendasi)**: Deploy **Backend** dan **Frontend** sebagai **2 Project Terpisah** di akun Vercel yang sama. Hal ini mempermudah pengelolaan *environment variables*, konfigurasi CORS, dan isolasi build.

---

## 📋 Prasyarat

Sebelum memulai deployment, pastikan Anda telah menyiapkan:

- Akun aktif di [Vercel](https://vercel.com).
- Repository proyek sudah di-push ke GitHub / GitLab / Bitbucket (misalnya: `https://github.com/muhzawi/Portal-Cabdiswilayah1`).
- Database Supabase sudah aktif dan skrip [backend/supabase/001_initial.sql](file:///d:/Portal-Disdikwilayah1%20-%20backup/backend/supabase/001_initial.sql) telah dijalankan di SQL Editor Supabase.

---

## 🌐 Langkah 1: Deploy Backend (API Express)

### A. Melalui Vercel Dashboard

1. Buka [vercel.com/new](https://vercel.com/new) dan login ke akun Vercel Anda.
2. Pilih repository GitHub proyek Anda: **`Portal-Cabdiswilayah1`**, lalu klik **Import**.
3. Beri nama project Vercel untuk backend, contoh: `portal-disdik-backend`.
4. Pada bagian **Root Directory**, klik **Edit** dan pilih folder **`backend`**.
5. Pada bagian **Framework Preset**, pilih **`Other`**.
6. Buka bagian **Environment Variables** dan tambahkan variabel berikut:

   | Nama Variabel | Nilai / Contoh | Keterangan |
   | --- | --- | --- |
   | `SUPABASE_URL` | `https://dpoywrmjbwpaufjutfnt.supabase.co` | URL Project Supabase Anda |
   | `SUPABASE_ANON_KEY` | `eyJhbGci...` | Anon Public Key Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Service Role Key Supabase |
   | `FRONTEND_URL` | `https://portal-disdik-frontend.vercel.app` | URL domain frontend Vercel Anda (dapat diupdate setelah frontend di-deploy) |
   | `PORT` | `3000` | (Opsional) Port internal server |

7. Klik **Deploy**.
8. Setelah deployment berhasil, Vercel akan memberikan **URL Production Backend**, contoh:
   `https://portal-disdik-backend.vercel.app`

---

### B. Melalui Vercel CLI (Terminal)

Jika menggunakan CLI:

```bash
cd backend
npx vercel
```
- Ikuti petunjuk di terminal:
  - *Set up and deploy?* -> `y`
  - *Which scope?* -> pilih akun/tim Anda
  - *Link to existing project?* -> `N`
  - *What's your project's name?* -> `portal-disdik-backend`
  - *In which directory is your code located?* -> `./`
- Setelah awal deploy, atur environment variables via CLI atau Dashboard:
  ```bash
  npx vercel env add SUPABASE_URL
  npx vercel env add SUPABASE_ANON_KEY
  npx vercel env add SUPABASE_SERVICE_ROLE_KEY
  npx vercel env add FRONTEND_URL
  ```
- Deploy ke produksi:
  ```bash
  npx vercel --prod
  ```

---

## 🖥️ Langkah 2: Deploy Frontend (React + Vite)

### A. Melalui Vercel Dashboard

1. Kembali ke [vercel.com/new](https://vercel.com/new).
2. Import kembali repository **`Portal-Cabdiswilayah1`** (sebagai project kedua).
3. Beri nama project Vercel untuk frontend, contoh: `portal-disdik-frontend`.
4. Pada bagian **Root Directory**, klik **Edit** dan pilih folder **`frontend`**.
5. Pengaturan Build & Output (Vercel biasanya mendeteksi secara otomatis):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Buka bagian **Environment Variables** dan tambahkan:

   | Nama Variabel | Nilai / Contoh | Keterangan |
   | --- | --- | --- |
   | `VITE_API_URL` | `https://portal-disdik-backend.vercel.app` | URL Production Backend dari **Langkah 1** |

7. Klik **Deploy**.
8. Setelah berhasil, Vercel akan memberikan **URL Production Frontend**, contoh:
   `https://portal-disdik-frontend.vercel.app`

---

### B. Melalui Vercel CLI (Terminal)

```bash
cd frontend
npx vercel
```
- Ikuti petunjuk di terminal:
  - *Project name:* `portal-disdik-frontend`
  - *Directory:* `./`
- Tambahkan environment variable API URL:
  ```bash
  npx vercel env add VITE_API_URL
  ```
- Deploy ke produksi:
  ```bash
  npx vercel --prod
  ```

---

## 🔗 Langkah 3: Menghubungkan Backend & Frontend (CORS Update)

Setelah kedua project berhasil di-deploy:

1. Salin **URL Production Frontend** (misal: `https://portal-disdik-frontend.vercel.app`).
2. Buka Project Vercel **Backend** (`portal-disdik-backend`) di Dashboard Vercel.
3. Masuk ke menu **Settings** > **Environment Variables**.
4. Perbarui nilai `FRONTEND_URL` menjadi URL Production Frontend Anda.
5. Masuk ke tab **Deployments** pada Backend, klik titik tiga (`...`) pada deployment terbaru, lalu pilih **Redeploy** agar variabel lingkungan baru berlaku.

---

## 🛠️ Ringkasan Konfigurasi Vercel dalam Kode

### File `backend/vercel.json`
Mengkonfigurasi Express API agar berjalan sebagai *Vercel Serverless Function*:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

### File `frontend/vercel.json`
Mengkonfigurasi *URL Rewrite* agar halaman Single Page Application (SPA) React Router tidak error `404 Not Found` saat di-refresh pada sub-route (seperti `/dashboard` atau `/login`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## ❓ Troubleshooting (Pemecahan Masalah)

### 1. Error CORS (*Access to XMLHttpRequest at ... has been blocked by CORS policy*)
- **Penyebab**: Variabel `FRONTEND_URL` pada backend belum sesuai dengan URL frontend Vercel Anda.
- **Solusi**: Pastikan `FRONTEND_URL` di Environment Variables backend bernilai persis sama dengan domain frontend Vercel (misal: `https://portal-disdik-frontend.vercel.app`), lalu lakukan *Redeploy* pada project backend.

### 2. Halaman Refresh Mengembalikan Error 404 pada Frontend
- **Penyebab**: Vercel mencoba mencari file fisik untuk route React.
- **Solusi**: Pastikan file `frontend/vercel.json` berisi konfigurasi `rewrites` ke `/index.html` dan sudah ter-commit ke git.

### 3. API Return `500 Internal Server Error` (Database Failure)
- **Penyebab**: Variabel `SUPABASE_URL`, `SUPABASE_ANON_KEY`, atau `SUPABASE_SERVICE_ROLE_KEY` belum diset di Vercel Backend.
- **Solusi**: Periksa tab **Settings > Environment Variables** di project backend Vercel dan pastikan seluruh kunci Supabase terisi dengan benar.

---

## 📞 Ringkasan Check-List Deployment

- [x] Push perubahan terbaru ke repository GitHub.
- [x] Run skrip Supabase `001_initial.sql` di Supabase SQL Editor.
- [x] Deploy `backend` ke Vercel (Root: `backend`, set Env Vars Supabase & FRONTEND_URL).
- [x] Deploy `frontend` ke Vercel (Root: `frontend`, set Env Var `VITE_API_URL` mengarah ke URL Backend Vercel).
- [x] Update `FRONTEND_URL` backend dan Redeploy backend jika diperlukan.
