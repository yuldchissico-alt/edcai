-- Sistema de salvamento de conversas do chat

-- 1) Tabela de conversas
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

drop policy if exists "Users can view own conversations" on public.conversations;
create policy "Users can view own conversations"
  on public.conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own conversations" on public.conversations;
create policy "Users can create own conversations"
  on public.conversations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own conversations" on public.conversations;
create policy "Users can update own conversations"
  on public.conversations
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own conversations" on public.conversations;
create policy "Users can delete own conversations"
  on public.conversations
  for delete
  using (auth.uid() = user_id);


-- 2) Tabela de mensagens do chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "Users can view own messages" on public.chat_messages;
create policy "Users can view own messages"
  on public.chat_messages
  for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = chat_messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create own messages" on public.chat_messages;
create policy "Users can create own messages"
  on public.chat_messages
  for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = chat_messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own messages" on public.chat_messages;
create policy "Users can delete own messages"
  on public.chat_messages
  for delete
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = chat_messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );


-- 3) Trigger para atualizar updated_at
create or replace function public.update_conversation_timestamp()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.chat_messages;
create trigger on_message_created
  after insert on public.chat_messages
  for each row
  execute function public.update_conversation_timestamp();