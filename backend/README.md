# Portal Disdikwilayah API

Backend Node.js + Express + MySQL untuk autentikasi, role, pembatasan akses
aplikasi, katalog aplikasi, dan resolusi URL layanan.

Role yang digunakan:

- `super_user`: dapat mengakses seluruh aplikasi dan mengelola user/aplikasi.
- `medium_user`: hanya dapat mengakses aplikasi yang ada di
  `user_application_access`.
- `school_user`: login menggunakan NPSN, lalu hanya dapat mengakses aplikasi
  dengan password yang diberikan administrator; akses aplikasi memerlukan
  email terverifikasi dan persetujuan admin.

## Menjalankan

1. Buat database MySQL, lalu jalankan `database.sql` dari root repo untuk instalasi baru.
2. Atur `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, dan `JWT_SECRET` di `backend/.env`.
   `JWT_SECRET` wajib berisi minimal 32 karakter acak; server tidak akan berjalan
   jika nilainya tidak dikonfigurasi dengan benar.
3. Untuk database baru yang dibuat dari `database.sql`, jalankan
  `mysql/002_create_password_reset_tokens.sql`. Untuk database lama yang belum
  memiliki kolom profil/ikon, jalankan `mysql/001_add_profile_and_app_icons.sql`
  sekali sebelum migrasi `002`.
4. Jalankan `mysql/003_add_school_accounts.sql` untuk menambahkan akun sekolah
   dan token verifikasi email.
5. Jalankan `mysql/004_create_login_protection.sql` untuk tabel blokir IP dan sesi.
6. Isi konfigurasi SMTP di bawah ini untuk mengaktifkan reset password dan
   verifikasi email sekolah.
7. Jalankan `npm install` dan `npm run dev` dari folder `backend`.

Login staf dan sekolah diblokir selama 10 menit setelah 5 kegagalan dari IP yang
sama. Sesi berakhir setelah 10 menit tanpa aktivitas dan maksimal 24 jam.
Jika aplikasi berjalan di belakang reverse proxy, atur `TRUST_PROXY` hanya
untuk jumlah hop atau alamat proxy yang benar agar alamat IP klien tidak dapat
dipalsukan melalui header.

Endpoint utama:

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`,
  `POST /auth/reset-password/confirm`, `POST /auth/reset-password`, `POST /auth/logout`, `GET /auth/me`
- `GET /api/users`, `PATCH /api/users/:id/role`, dan
  `PUT /api/users/:id/app-access` (admin/superadmin; perubahan role hanya superadmin)
- `PATCH /api/users/:id/approve` dan `PATCH /api/users/:id/reject` (admin/superadmin)
- `GET /api/activity-logs` (superadmin)
- `GET /api/apps`, `GET /api/apps/:id`, `GET /api/apps/:id/redirect`
- `POST /api/apps` (admin/superadmin), `PATCH /api/apps/:id` dan `DELETE /api/apps/:id` (superadmin)
- `POST /auth/school-login` (NPSN dan password), `POST /auth/school/request-link`, dan
  `POST /auth/school/verify` untuk login serta verifikasi email sekolah
- `GET /api/schools`, `POST /api/schools`, `PATCH /api/schools/:npsn`,
  `DELETE /api/schools/:npsn`, dan
  `PUT /api/schools/:npsn/app-access` untuk pengelolaan sekolah oleh super user

Untuk memberi akses aplikasi kepada medium user, tambahkan baris pada tabel
`user_application_access` di MySQL:

```sql
INSERT INTO user_application_access (user_id, application_id)
VALUES ('USER_ID', 'e-arsip');
```

Atau gunakan API:

```http
PUT /api/users/USER_UUID/app-access
Authorization: Bearer <access-token>
Content-Type: application/json

{"applicationIds":["e-arsip","akademik"]}
```

Perubahan password saat sudah login memakai `POST /auth/reset-password` dengan
`currentPassword` dan `newPassword`.

Reset password via email memakai token acak sekali pakai yang berlaku selama 1 jam.
Konfigurasikan variabel berikut di `backend/.env`. Konfigurasi ini dibutuhkan
untuk reset password dan verifikasi email sekolah:

```env
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=Portal Cabdiswilayah I <no-reply@example.com>
```

Untuk SMTP tanpa autentikasi, kosongkan `SMTP_USER` dan `SMTP_PASS`. Pastikan
`SMTP_FROM` berisi alamat pengirim yang diizinkan oleh penyedia email.
Token tidak disimpan dalam bentuk mentah di database; tautan hanya bisa digunakan sekali.
Kirim JWT MySQL pada header `Authorization: Bearer <token>`.
