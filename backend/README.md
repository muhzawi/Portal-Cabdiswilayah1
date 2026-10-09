# Portal Disdikwilayah API

Backend Node.js + Express + MySQL untuk autentikasi, role, pembatasan akses
aplikasi, katalog aplikasi, dan resolusi URL layanan.

Role yang digunakan:

- `super_user`: dapat mengakses seluruh aplikasi dan mengelola user/aplikasi.
- `medium_user`: hanya dapat mengakses aplikasi yang ada di
  `user_application_access`.

## Menjalankan

1. Buat database MySQL, lalu jalankan `database.sql` dari root repo untuk instalasi baru.
2. Atur `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, dan `JWT_SECRET` di `backend/.env`.
3. Untuk database baru yang dibuat dari `database.sql`, jalankan
  `mysql/002_create_password_reset_tokens.sql`. Untuk database lama yang belum
  memiliki kolom profil/ikon, jalankan `mysql/001_add_profile_and_app_icons.sql`
  sekali sebelum migrasi `002`.
4. Isi konfigurasi SMTP di bawah ini untuk mengaktifkan reset password melalui email.
5. Jalankan `npm install` dan `npm run dev` dari folder `backend`.

Endpoint utama:

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`,
  `POST /auth/reset-password/confirm`, `POST /auth/reset-password`, `POST /auth/logout`, `GET /auth/me`
- `GET /api/users`, `PATCH /api/users/:id/role`, dan
  `PUT /api/users/:id/app-access` (admin/superadmin; perubahan role hanya superadmin)
- `PATCH /api/users/:id/approve` dan `PATCH /api/users/:id/reject` (admin/superadmin)
- `GET /api/activity-logs` (superadmin)
- `GET /api/apps`, `GET /api/apps/:id`, `GET /api/apps/:id/redirect`
- `POST /api/apps` (admin/superadmin), `PATCH /api/apps/:id` dan `DELETE /api/apps/:id` (superadmin)

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
Konfigurasikan variabel berikut di `backend/.env`:

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
