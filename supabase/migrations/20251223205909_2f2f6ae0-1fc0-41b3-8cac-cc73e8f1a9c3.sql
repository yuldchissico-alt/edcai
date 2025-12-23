-- Fotos privadas por usuário

-- 1) Tabela de fotos
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  storage_path text not null,
  title text,
  created_at timestamptz not null default now()
);

-- Habilitar RLS na tabela de fotos
alter table public.photos enable row level security;

-- Políticas: cada usuário só enxerga e gerencia suas próprias fotos
drop policy if exists "Users can select own photos" on public.photos;
create policy "Users can select own photos"
  on public.photos
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own photos" on public.photos;
create policy "Users can insert own photos"
  on public.photos
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own photos" on public.photos;
create policy "Users can update own photos"
  on public.photos
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own photos" on public.photos;
create policy "Users can delete own photos"
  on public.photos
  for delete
  using (auth.uid() = user_id);


-- 2) Bucket de storage para fotos (privado)
insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', false)
on conflict (id) do nothing;

-- 3) Políticas de RLS no storage.objects para o bucket de fotos
drop policy if exists "Users can read own photos" on storage.objects;
create policy "Users can read own photos"
  on storage.objects
  for select
  using (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can insert own photos" on storage.objects;
create policy "Users can insert own photos"
  on storage.objects
  for insert
  with check (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own photos" on storage.objects;
create policy "Users can update own photos"
  on storage.objects
  for update
  using (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own photos" on storage.objects;
create policy "Users can delete own photos"
  on storage.objects
  for delete
  using (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );