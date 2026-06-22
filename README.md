# V&A Express — Full-Stack Rebuild

A complete Next.js 14 + Supabase rebuild of vaexpress.com.vn with an owned backend.

## Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 14 (App Router), TypeScript |
| Styling   | Tailwind CSS, custom design tokens  |
| Backend   | Supabase (PostgreSQL + Auth + RLS)  |
| i18n      | next-intl (EN + VI)                 |
| Hosting   | Vercel (recommended)                |

## Features

- **Public site**: Home, About, Air/Sea/Road Freight service pages
- **Track & Trace**: Real-time shipment tracking by tracking number
- **Quote Calculator**: Instant cost estimate + form submission to Supabase
- **Customer Portal**: Login → view own shipments and quotes
- **Admin Panel**: Full CRUD on shipments, add tracking events, manage quotes
- **Bilingual**: English + Vietnamese with URL-based locale routing

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at https://supabase.com
2. In the SQL Editor, run the entire contents of `supabase/schema.sql`
3. In Authentication → Settings, configure your site URL

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and keys
```

### 4. Set up your admin user

1. Go to Supabase → Authentication → Users → Invite user
2. After they sign up, run this SQL to make them admin:
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<their-user-id>';
```

### 5. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/              # All pages (EN/VI routing)
│   │   ├── page.tsx           # Home
│   │   ├── about/
│   │   ├── services/
│   │   │   ├── air-freight/
│   │   │   ├── sea-freight/
│   │   │   └── road-freight/
│   │   ├── tracking/          # Public track & trace
│   │   ├── quote/             # Quote request + calculator
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── portal/            # Customer dashboard (protected)
│   │   └── admin/             # Admin panel (admin-only)
│   └── api/
│       └── tracking/          # Public tracking API
├── components/
│   ├── layout/                # Navbar, Footer
│   └── home/                  # Hero, ServicesSection, WhyUs
├── lib/supabase/              # Client + Server + Service clients
└── types/                     # TypeScript types, estimator logic
```

## Deployment to Vercel

```bash
npm install -g vercel
vercel
# Set environment variables in Vercel dashboard
```

## Customisation Checklist

- [ ] Replace company name/logo in Navbar and Footer
- [ ] Update contact details in Footer and About page
- [ ] Update the stat numbers in WhyUs component
- [ ] Add real pricing rates in `src/types/index.ts` → `SERVICE_RATES`
- [ ] Configure email notifications in Supabase Edge Functions
- [ ] Add your own tracking number format/prefix
- [ ] Set up custom domain in Vercel

## Database Schema

```
profiles          — extends Supabase auth.users
shipments         — cargo shipments with status
tracking_events   — history events per shipment (EN+VI)
quotes            — quote requests with calculator estimate
```

All tables use Row Level Security (RLS):
- Customers only see their own data
- Admins see everything
- Public API uses service role for tracking lookup only
