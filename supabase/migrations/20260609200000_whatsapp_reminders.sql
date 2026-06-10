alter table public.learner_profiles
  add column if not exists whatsapp_phone text,
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists whatsapp_study_reminders boolean not null default false,
  add column if not exists whatsapp_deadline_reminders boolean not null default false,
  add column if not exists reminder_email text,
  add column if not exists fallback_email_enabled boolean not null default false,
  add column if not exists reminder_timezone text not null default 'Africa/Johannesburg',
  add column if not exists reminder_paused_until date,
  add column if not exists study_reminder_hour int not null default 18,
  add column if not exists deadline_reminder_hour int not null default 10,
  add column if not exists quiet_hours_start int not null default 20,
  add column if not exists quiet_hours_end int not null default 6,
  add column if not exists whatsapp_last_study_reminder_at date,
  add column if not exists whatsapp_last_deadline_reminder_at date;

create table if not exists public.bursary_reminders (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  bursary_id uuid not null references public.bursaries(id) on delete cascade,
  saved boolean not null default true,
  send_whatsapp boolean not null default false,
  days_before_deadline int,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, bursary_id)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  channel text not null default 'whatsapp',
  delivery_provider text not null default 'twilio',
  recipient text not null,
  reminder_type text not null,
  reminder_key text not null,
  payload_json jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  status text not null default 'sent',
  attempt_count int not null default 1,
  error_message text,
  unique (learner_id, channel, reminder_type, reminder_key)
);

create index if not exists bursary_reminders_learner_id_idx on public.bursary_reminders(learner_id);
create index if not exists bursary_reminders_bursary_id_idx on public.bursary_reminders(bursary_id);
create index if not exists notification_deliveries_lookup_idx on public.notification_deliveries(learner_id, channel, reminder_type, reminder_key);

alter table public.bursary_reminders enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "own bursary reminders" on public.bursary_reminders;
create policy "own bursary reminders" on public.bursary_reminders for all using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = bursary_reminders.learner_id and lp.user_id = auth.uid()
  )
);

drop policy if exists "own notification deliveries" on public.notification_deliveries;
create policy "own notification deliveries" on public.notification_deliveries for select using (
  exists (
    select 1 from public.learner_profiles lp
    where lp.id = notification_deliveries.learner_id and lp.user_id = auth.uid()
  )
);
