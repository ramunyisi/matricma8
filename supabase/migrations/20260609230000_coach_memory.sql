create table if not exists public.coach_topic_memory (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  subject_name text not null,
  topic_key text not null,
  topic_label text not null,
  session_count int not null default 1,
  question_count int not null default 0,
  struggle_count int not null default 0,
  success_count int not null default 0,
  last_mode text not null default 'chat',
  last_summary text,
  last_question text,
  last_answer text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, topic_key)
);

create index if not exists coach_topic_memory_learner_idx on public.coach_topic_memory(learner_id, struggle_count desc, last_seen_at desc);

alter table public.coach_topic_memory enable row level security;

drop policy if exists "own coach memory" on public.coach_topic_memory;
create policy "own coach memory" on public.coach_topic_memory for all using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = coach_topic_memory.learner_id and lp.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = coach_topic_memory.learner_id and lp.user_id = auth.uid()
  )
);
