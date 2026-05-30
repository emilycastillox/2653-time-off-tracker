# 2653 Legacy Place — Time-Off Tracker

Internal staff portal for submitting and managing time-off requests at 2653 Legacy Place.

## Features

- **Employee portal** — submit time-off requests or time restriction requests (e.g. 10am or later, 4pm or earlier)
- **Admin portal** — review pending requests, approve or deny with one click
- **Calendar view** — color-coded monthly calendar showing approved time off (green) and restrictions (purple) with name initials
- **Spreadsheet view** — sortable table of all approved requests with type badges
- **Email notifications** — employees receive an approval or denial email via Mailgun when a manager acts on their request
- **Role-based access** — employees see only their own requests; admins see everything

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk v7 |
| Database | Supabase (Postgres) |
| Email | Mailgun |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

## Environment Variables

Create a `.env.local` file in the project root with the following:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mailgun
MAILGUN_API_KEY=        # Account-level private API key (not a domain sending key)
MAILGUN_DOMAIN=         # e.g. 2653time.com

# App
NEXT_PUBLIC_APP_URL=    # e.g. https://your-app.vercel.app
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Clerk Setup

1. Create a Clerk application and add the publishable + secret keys to `.env.local`
2. Go to **Configure → Sessions → Customize session token** and add:
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
3. To grant admin access, set a user's public metadata in the Clerk dashboard:
   ```json
   { "role": "admin" }
   ```
4. The user must sign out and back in for the role to take effect

## Mailgun Setup

1. Add and verify your sending domain in the Mailgun dashboard (Sending → Domains)
2. Ensure all DNS records (SPF, DKIM, CNAME) show green checkmarks
3. Use the **account-level private API key** (not a domain sending key) as `MAILGUN_API_KEY`

## Database

Run the following in the Supabase SQL editor to create the requests table:

```sql
create table requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  clerk_user_id text not null,
  employee_name text not null,
  employee_position text not null,
  employee_id text not null,
  employee_email text not null,
  request_type text not null default 'time_off' check (request_type in ('time_off', 'time_restriction')),
  reason text not null,
  start_date date not null,
  end_date date not null,
  location text not null,
  num_days int not null,
  time_start text,
  time_end text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  reviewed_at timestamptz,
  reviewed_by text
);
```

## Roles

| Role | Access |
|---|---|
| Employee (default) | `/dashboard` — submit requests, view own history |
| Admin | `/admin/requests` — review all requests; `/admin/approved` — calendar + spreadsheet of approved time off |

## Deploy

Push to GitHub and import into [Vercel](https://vercel.com). Add all environment variables from `.env.local` in the Vercel project settings.
