alter table public.bursaries
  add column if not exists funding_type text,
  add column if not exists study_levels text[] not null default '{}'::text[],
  add column if not exists eligibility_criteria_json jsonb not null default '[]'::jsonb,
  add column if not exists official_status text not null default 'unknown',
  add column if not exists last_checked_at date,
  add column if not exists application_window text,
  add column if not exists summary text,
  add column if not exists notes text;

create index if not exists bursaries_official_status_idx on public.bursaries(official_status);
