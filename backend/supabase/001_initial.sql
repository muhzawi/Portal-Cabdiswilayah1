-- Super user memiliki akses penuh; medium user dibatasi oleh tabel akses aplikasi.
create type public.user_role as enum ('super_user', 'medium_user');
-- Status menentukan apakah link aplikasi boleh dibuka oleh pengguna.
create type public.application_status as enum ('available', 'maintenance', 'offline');

-- Profile menyimpan data tambahan user yang tidak disimpan di auth.users.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'medium_user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Katalog layanan yang ditampilkan pada portal frontend.
create table public.applications (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  status public.application_status not null default 'available',
  version text not null default '1.0.0',
  url text not null check (url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daftar aplikasi yang boleh diakses oleh setiap medium user.
create table public.user_application_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, application_id)
);

-- Membuat profile otomatis setiap kali user baru mendaftar melalui Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

-- Menjalankan fungsi profile setelah user Auth berhasil dibuat.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS tetap diaktifkan sebagai lapisan keamanan tambahan di Supabase.
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.user_application_access enable row level security;

-- User hanya dapat membaca profile miliknya sendiri.
create policy "users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
-- User yang sudah login dapat membaca katalog aplikasi.
create policy "authenticated users can read applications" on public.applications
  for select to authenticated using (true);
create policy "users can read own application access" on public.user_application_access
  for select to authenticated using (user_id = auth.uid());

-- Data awal aplikasi; ganti URL contoh dengan URL layanan sebenarnya.
insert into public.applications (id, name, category, description, status, version, url)
values
  ('e-arsip', 'E-Arsip', 'Administrasi', 'Kelola arsip digital secara aman dan terstruktur.', 'available', '1.0.0', 'https://example.com/e-arsip'),
  ('akademik', 'Akademik', 'Pendidikan', 'Akses informasi akademik dalam satu dashboard.', 'available', '2.4.1', 'https://example.com/akademik'),
  ('inventaris', 'Inventaris', 'Administrasi', 'Pantau aset dan inventaris sekolah dengan mudah.', 'maintenance', '1.8.0', 'https://example.com/inventaris'),
  ('kepegawaian', 'Kepegawaian', 'Kepegawaian', 'Informasi data dan layanan kepegawaian.', 'available', '1.2.0', 'https://example.com/kepegawaian')
on conflict (id) do nothing;
