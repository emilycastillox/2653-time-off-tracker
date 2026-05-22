create extension if not exists "uuid-ossp";

create table if not exists requests (
  id               uuid primary key default uuid_generate_v4(),
  employee_name    text not null,
  employee_position text not null,
  employee_id      text not null,
  reason           text not null,
  start_date       date not null,
  end_date         date not null,
  location         text not null default '2653 Legacy Place',
  num_days         integer not null,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  clerk_user_id    text not null,
  employee_email   text not null,
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  reviewed_by      text
);

-- Index for employee queries
create index if not exists requests_clerk_user_id_idx on requests(clerk_user_id);
create index if not exists requests_status_idx on requests(status);
create index if not exists requests_start_date_idx on requests(start_date);
