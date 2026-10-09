alter table public.applications
add column if not exists icon_url text
check (icon_url is null or icon_url ~ '^https?://');
