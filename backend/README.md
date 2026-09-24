# Portal Disdikwilayah API

Backend Node.js + Express + Supabase untuk autentikasi, role, pembatasan akses
aplikasi, katalog aplikasi, dan resolusi URL layanan.

Role yang digunakan:

- `super_user`: dapat mengakses seluruh aplikasi dan mengelola user/aplikasi.
- `medium_user`: hanya dapat mengakses aplikasi yang ada di
  `user_application_access`.

## Menjalankan

1. Buat project di Supabase dan jalankan `supabase/001_initial.sql` melalui SQL Editor.
2. Salin `.env.example` menjadi `.env`, lalu isi URL, anon key, dan service role key.
3. Ganti URL seed `example.com` dengan URL layanan sebenarnya melalui SQL Editor atau
   endpoint super user `PATCH /api/apps/:id`.
4. Jalankan `npm install` dan `npm run dev` dari folder `backend`.

Endpoint utama:

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`,
  `POST /auth/reset-password`, `POST /auth/logout`, `GET /auth/me`
- `GET /api/users`, `PATCH /api/users/:id/role`, dan
  `PUT /api/users/:id/app-access` (admin/superadmin; perubahan role hanya superadmin)
- `PATCH /api/users/:id/approve` dan `PATCH /api/users/:id/reject` (admin/superadmin)
- `GET /api/activity-logs` (superadmin)
- `GET /api/apps`, `GET /api/apps/:id`, `GET /api/apps/:id/redirect`
- `POST /api/apps` (admin/superadmin), `PATCH /api/apps/:id` dan `DELETE /api/apps/:id` (superadmin)

Untuk memberi akses aplikasi kepada medium user, tambahkan baris pada tabel
`user_application_access` di Supabase:

```sql
insert into public.user_application_access (user_id, application_id)
values ('USER_UUID', 'e-arsip');
```

Atau gunakan API:

```http
PUT /api/users/USER_UUID/app-access
Authorization: Bearer <access-token>
Content-Type: application/json

{"applicationIds":["e-arsip","akademik"]}
```

Jalankan `mysql/008_activity_logs.sql` sekali pada database MySQL untuk mengaktifkan audit log.
Perubahan password memakai `POST /auth/reset-password` dengan `currentPassword` dan `newPassword`.

Kirim access token Supabase pada header `Authorization: Bearer <token>`.
