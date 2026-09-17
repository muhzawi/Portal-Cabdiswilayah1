-- Migrasi dari role lama ke dua role baru.
-- Jalankan file ini hanya pada database yang sudah menjalankan 001_initial.sql.
alter table public.profiles alter column role drop default;

alter table public.profiles
  alter column role type text using role::text;

update public.profiles
set role = case
  when role = 'admin' then 'super_user'
  else 'medium_user'
end;

drop type public.user_role;
create type public.user_role as enum ('super_user', 'medium_user');

alter table public.profiles
  alter column role type public.user_role using role::public.user_role;
alter table public.profiles
  alter column role set default 'medium_user'::public.user_role;

create table if not exists public.user_application_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id text not null references public.applications(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, application_id)
);

alter table public.user_application_access enable row level security;

create policy "users can read own application access"
  on public.user_application_access
  for select to authenticated
  using (user_id = auth.uid());
