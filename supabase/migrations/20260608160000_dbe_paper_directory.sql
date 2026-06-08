create table if not exists public.dbe_exam_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int,
  exam_session text,
  grade_scope text not null default 'Grade 12',
  source_url text not null unique,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.past_papers add column if not exists language text;
alter table public.past_papers add column if not exists collection_title text;
alter table public.past_papers add column if not exists external_id text;

create unique index if not exists past_papers_external_id_idx on public.past_papers(external_id) where external_id is not null;
create index if not exists past_papers_search_idx on public.past_papers(year, exam_session, paper_number, language);

alter table public.dbe_exam_collections enable row level security;

drop policy if exists "public read dbe exam collections" on public.dbe_exam_collections;
create policy "public read dbe exam collections" on public.dbe_exam_collections for select to authenticated using (true);
