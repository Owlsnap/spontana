-- Create saved_events table for user bookmarks
create table if not exists saved_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, event_id)
);

alter table saved_events enable row level security;

create policy "Users can view their own saved events"
  on saved_events for select
  using (auth.uid() = user_id);

create policy "Users can save events"
  on saved_events for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave events"
  on saved_events for delete
  using (auth.uid() = user_id);
