alter table public.aps_rules
  add column if not exists prospectus_url text,
  add column if not exists prospectus_notes jsonb not null default '[]'::jsonb;
