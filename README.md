# Our Little World 🎀

> A private digital scrapbook for two — built to feel like *our thing*, not an app.

A full-stack web application to preserve trips, memories, love letters, milestones, and little moments together. Mobile-first, beautifully designed, and completely private.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your Supabase credentials
cp .env.local.example .env.local
# → Edit .env.local with your Supabase URL and anon key

# 3. Run the database schema
# → Paste supabase/schema.sql into Supabase SQL Editor and run it

# 4. Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, and your world is created automatically.

Full setup instructions: **[SETUP.md](./SETUP.md)**

---

## Features

| Section | What it does |
|---|---|
| 🏠 **Home** | Days together counter, memory stats, latest memory, "on this day" |
| ✈️ **Trips** | Scrapbook-cover trip cards, trip detail with all memories inside |
| 📸 **Memories** | Photo memories with moods, tags, search, filters, favorites |
| 💌 **Letters** | Private love letters with "open when" conditions and date locks |
| 💗 **Us** | Relationship timeline, milestone events, couple stats |
| ✨ **Future** | Bucket list of things to do together, with satisfying completion |
| ⚙️ **Settings** | World name, tagline, anniversary date, nicknames |

---

## Tech Stack

- **[Next.js 16](https://nextjs.org)** — App Router, TypeScript
- **[Tailwind CSS](https://tailwindcss.com)** — custom kawaii design system
- **[shadcn/ui](https://ui.shadcn.com)** — accessible component primitives
- **[Supabase](https://supabase.com)** — auth, PostgreSQL, photo storage
- **[Lucide React](https://lucide.dev)** — icons
- **[date-fns](https://date-fns.org)** — date formatting
- **Google Fonts** — Dancing Script + Nunito

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup
│   ├── (app)/           # Protected app routes
│   │   ├── home/
│   │   ├── trips/
│   │   ├── memories/
│   │   ├── letters/
│   │   ├── us/
│   │   ├── future/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx         # Root redirect
├── components/
│   ├── cards/           # MemoryCard, TripCard, LetterCard
│   ├── layout/          # SideNav, BottomNav, AddMemoryButton
│   ├── shared/          # AddMemoryModal, PhotoUploader, EmptyState
│   └── ui/              # shadcn/ui primitives
├── lib/
│   ├── supabase/        # Browser + server + middleware clients
│   └── utils.ts
├── types/               # TypeScript interfaces
└── middleware.ts        # Auth protection
supabase/
└── schema.sql           # Full database schema + RLS policies
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=       # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Your Supabase anon key
```

---

## Deployment

Deploy to Vercel in one step:

1. Push this repo to GitHub
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add the two environment variables
4. Deploy

The app runs entirely on Supabase's free tier for personal use.
