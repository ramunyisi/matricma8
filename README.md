# MatricSA

An AI Powered Learner Tutor.

MatricSA is a mobile-first MVP for South African Grade 10-12 CAPS learners. It combines AI study coaching, configurable APS prediction, DBE-linked past-paper navigation, and bursary matching.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Gemini API for tutoring and planning
- Vitest for core logic tests

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Add Supabase and Gemini keys in `.env.local`.

4. Create the database schema.

Option A: paste this file into the Supabase SQL editor and run it:

```text
supabase/schema.sql
```

Option B: if you use the Supabase CLI, apply the migration:

```bash
supabase db push
```

The first seed will fail with `Could not find the table 'public.subjects'` until this schema exists in your Supabase project.

5. Seed sample data using either `supabase/seed.sql` in SQL editor or:

```bash
npm run seed
```

6. Optional: sync official DBE paper links into the searchable past-paper library after the schema is applied:

```bash
npm run import:dbe-papers -- --max=3
```

Omit `-- --max=3` to sync every DBE year/session collection discovered from the NSC directory.

7. Start the app:

```bash
npm run dev
```

## Key Pages

- `/` landing page
- `/auth/signup` and `/auth/login`
- `/onboarding`
- `/dashboard`
- `/study-coach`
- `/aps`
- `/past-papers`
- `/bursaries`
- `/admin`

## Compliance Notes

- Past-paper records store metadata, official DBE source URLs, page numbers, and memo links first.
- The MVP does not copy DBE paper content into the database.
- Sample bursaries and APS rules are clearly marked as sample data.
- APS and bursary outputs are predictions from stored rules, not official eligibility decisions.
- Learners should verify university and bursary requirements from official source URLs.
- Parent/guardian support is included as an account role for under-18 learners.

Official DBE NSC past exam source page used for sample paper metadata:

https://www.education.gov.za/?link=599&mid=1741&tabid=593

## Tests

```bash
npm test
```

Coverage currently targets APS calculation, bursary matching, and study-plan generation.

## Production TODO

- Replace sample bursaries and APS rules with verified provider and institution data.
- Add source verification workflow, expiry reminders, and admin audit logs.
- Add protected routes with Supabase session checks.
- Add parent/guardian consent and data minimisation review for under-18 learners.
- Add teacher classroom grouping and learner progress exports.
- Add robust ingestion pipeline for DBE paper metadata without aggressive scraping.
- Add scheduled DBE directory refresh and broken-link checks.
- Add document upload controls only where legally and privacy-wise necessary.
- Add rate limits, prompt logging controls, and AI output review for tutoring safety.
- Add programme-specific APS rule editor with validation.
- Add end-to-end tests for auth, onboarding, and dashboard flows.
