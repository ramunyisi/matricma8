create table if not exists public.caps_content_sections (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  grade int check (grade in (10, 11, 12)),
  term int check (term in (1, 2, 3, 4)),
  topic text not null,
  section_title text not null,
  section_summary text not null,
  section_text text not null,
  source_type text not null check (source_type in ('caps', 'mind-the-gap', 'workbook', 'digital')),
  source_title text not null,
  source_url text not null,
  page_start int,
  page_end int,
  keywords text[] not null default '{}',
  version int not null default 1,
  last_verified_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_url, section_title, version)
);

alter table public.caps_content_sections enable row level security;

drop policy if exists "public read caps content sections" on public.caps_content_sections;
create policy "public read caps content sections" on public.caps_content_sections for select to authenticated using (true);
