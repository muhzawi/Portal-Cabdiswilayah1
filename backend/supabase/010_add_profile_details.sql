alter table public.profiles
  add column if not exists institution text not null default '',
  add column if not exists nip text not null default '';
