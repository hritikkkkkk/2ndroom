-- Feedback table for 2ndroom user suggestions
-- Run this in your Supabase SQL Editor

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null check (char_length(message) > 0),
  created_at timestamptz default now()
);

-- Index for faster queries by user
create index if not exists feedback_user_id_idx on public.feedback(user_id);

-- Index for chronological queries
create index if not exists feedback_created_at_idx on public.feedback(created_at desc);

-- Row Level Security
alter table public.feedback enable row level security;

-- Policy: authenticated users can insert their own feedback
create policy "Users can submit feedback"
  on public.feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: only admins can read feedback (optional — adjust as needed)
-- If you want users to see their own feedback history, modify this policy
create policy "Admins can read feedback"
  on public.feedback
  for select
  to authenticated
  using (false); -- change to true or add admin role check if needed

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant insert on public.feedback to authenticated;
