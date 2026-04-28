-- JCE registered campaigns table
create table if not exists jce_registered_campaigns (
  id uuid primary key default gen_random_uuid(),
  jce_number text unique not null,
  candidate_name text not null,
  race_type text not null,
  municipality text,
  party text,
  created_at timestamptz default now()
);

insert into jce_registered_campaigns (jce_number, candidate_name, race_type, municipality, party) values
  ('JCE-2025-00123', 'María Fernández', 'mayor', 'Santo Domingo Este', 'prm'),
  ('JCE-2025-00456', 'Carlos Reyes', 'senator', 'Santiago', 'pld'),
  ('JCE-2025-00789', 'Ana Polanco', 'deputy', 'Distrito Nacional', 'fp'),
  ('JCE-2025-01011', 'Ramón Durán', 'mayor', 'Santiago de los Caballeros', 'prm'),
  ('JCE-2025-01234', 'Demo User', 'mayor', 'Santo Domingo', 'prm')
on conflict (jce_number) do nothing;

-- RLS
alter table jce_registered_campaigns enable row level security;
create policy "public read jce" on jce_registered_campaigns for select using (true);

-- Extend campaigns table
alter table campaigns add column if not exists candidate_cedula text;
alter table campaigns add column if not exists party_affiliation text;
alter table campaigns add column if not exists race_type text;
alter table campaigns add column if not exists election_type text;
alter table campaigns add column if not exists election_deadline date;
alter table campaigns add column if not exists phone text;
alter table campaigns add column if not exists candidate_photo_url text;
alter table campaigns add column if not exists banner_url text;
alter table campaigns add column if not exists description text;
alter table campaigns add column if not exists jce_registration_number text;
alter table campaigns add column if not exists status text default 'pending_verification';
alter table campaigns add column if not exists slug text unique;
alter table campaigns add column if not exists user_id uuid references auth.users(id);
alter table campaigns add column if not exists municipality text;

-- Campaign RLS policies
create policy "users can insert own campaigns" on campaigns
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users can read own campaigns" on campaigns
  for select to authenticated using (auth.uid() = user_id);

-- Storage buckets (create manually in Supabase dashboard Storage tab)
-- Public bucket: candidate-photos
-- Public bucket: campaign-assets
