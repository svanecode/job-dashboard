-- Chat history schema inspired by Vercel AI Chatbot template, adapted for Supabase
-- Tables: chat_sessions, chat_messages

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_created_idx on public.chat_sessions (user_id, created_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx on public.chat_messages (session_id, created_at asc);