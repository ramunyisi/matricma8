-- Conversation sessions for WhatsApp inbound bot.
-- Keyed by normalized phone number. Service-role only (no user-facing RLS policies).
create table if not exists public.whatsapp_sessions (
  phone text primary key,
  learner_id uuid references public.learner_profiles(id) on delete set null,
  messages_json jsonb not null default '[]',
  active_subject_name text,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_sessions
  add column if not exists active_subject_name text;

create index if not exists whatsapp_sessions_learner_id_idx on public.whatsapp_sessions(learner_id);

alter table public.whatsapp_sessions enable row level security;
-- No user-facing RLS policies: this table is accessed exclusively via service role in the webhook handler.
