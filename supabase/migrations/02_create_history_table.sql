-- Create a table to store daily asset snapshots
create table public.daily_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  snapshot_date date not null default current_date,
  total_assets numeric not null default 0,
  total_liabilities numeric not null default 0,
  net_assets numeric not null default 0,
  asset_breakdown jsonb default '{}'::jsonb, -- Store breakdown by category (stock, fund, etc.)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one snapshot per user per day
  unique(user_id, snapshot_date)
);

-- Enable RLS
alter table public.daily_snapshots enable row level security;

-- Policies
create policy "Users can view their own snapshots"
  on public.daily_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert their own snapshots"
  on public.daily_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own snapshots"
  on public.daily_snapshots for update
  using (auth.uid() = user_id);
