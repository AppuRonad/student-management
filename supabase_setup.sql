-- Run this entire block in:
-- Supabase Dashboard → SQL Editor → New query → paste → Run

create table if not exists messages (
  id          uuid default gen_random_uuid() primary key,
  student_id  text not null,
  sender_id   text not null,
  ciphertext  text not null,
  iv          text not null,
  encrypted   boolean default true,
  edited      boolean default false,
  unsent      boolean default false,
  edited_at   timestamptz,
  created_at  timestamptz default now()
);

-- Row Level Security (open for development)
alter table messages enable row level security;

drop policy if exists "allow all" on messages;
create policy "allow all" on messages
  for all using (true) with check (true);

-- Enable real-time updates
alter publication supabase_realtime add table messages;
