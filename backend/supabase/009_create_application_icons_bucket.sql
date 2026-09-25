insert into storage.buckets (id, name, public)
values ('application-icons', 'application-icons', true)
on conflict (id) do update set public = true;
