# Our Little World — Technical Documentation

> This document covers architecture, data model, design system, component inventory, security, and extension points for the app.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Design System](#3-design-system)
4. [Data Model](#4-data-model)
5. [Authentication & Security](#5-authentication--security)
6. [Pages & Routes](#6-pages--routes)
7. [Component Inventory](#7-component-inventory)
8. [TypeScript Types](#8-typescript-types)
9. [Utilities](#9-utilities)
10. [Photo Storage](#10-photo-storage)
11. [Adding New Features](#11-adding-new-features)

---

## 1. Architecture Overview

```
Browser
  └── Next.js App Router (client + server components)
        ├── Middleware — auth guard, session refresh
        ├── (auth) group — login, signup (public)
        └── (app) group — all protected pages
              └── Supabase JS client (browser)
                    ├── supabase.auth   — sessions
                    ├── supabase.from() — PostgreSQL via REST
                    └── supabase.storage — photo files
```

All data fetching in protected pages happens client-side via the Supabase browser client. The server client (`lib/supabase/server.ts`) is used only in the root `page.tsx` redirect and the middleware session refresh.

The middleware runs at the edge and refreshes the Supabase session cookie on every request. If the user is unauthenticated and tries to reach a protected route, they are redirected to `/login`. If authenticated and visiting `/login` or `/signup`, they are redirected to `/home`.

---

## 2. Directory Structure

```
our-dream/
├── src/
│   ├── app/
│   │   ├── globals.css              # Design tokens, Tailwind base, custom classes
│   │   ├── layout.tsx               # Root layout — fonts, metadata, viewport
│   │   ├── page.tsx                 # Root redirect (→ /home or /login)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx       # Login form
│   │   │   └── signup/page.tsx      # Registration form
│   │   └── (app)/
│   │       ├── layout.tsx           # App shell — SideNav + BottomNav + FAB
│   │       ├── home/page.tsx
│   │       ├── trips/
│   │       │   ├── page.tsx
│   │       │   ├── CreateTripModal.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── memories/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── letters/
│   │       │   ├── page.tsx
│   │       │   ├── CreateLetterModal.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── us/
│   │       │   ├── page.tsx
│   │       │   └── AddEventModal.tsx
│   │       ├── future/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── cards/
│   │   │   ├── MemoryCard.tsx       # 3 variants: grid, featured, compact
│   │   │   ├── TripCard.tsx         # Scrapbook cover style
│   │   │   └── LetterCard.tsx       # Envelope style
│   │   ├── layout/
│   │   │   ├── SideNav.tsx          # Desktop sidebar (hidden on mobile)
│   │   │   ├── BottomNav.tsx        # Mobile bottom navigation
│   │   │   └── AddMemoryButton.tsx  # Floating action button
│   │   ├── shared/
│   │   │   ├── AddMemoryModal.tsx   # Full create-memory flow with photo upload
│   │   │   ├── PhotoUploader.tsx    # Drag-drop + tap photo picker with preview
│   │   │   └── EmptyState.tsx       # Consistent empty state component
│   │   └── ui/                      # shadcn/ui primitives (do not edit directly)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client
│   │   │   ├── server.ts            # Server component Supabase client
│   │   │   └── middleware.ts        # Edge middleware session handler
│   │   └── utils.ts                 # cn(), date formatters, constants
│   ├── middleware.ts                 # Next.js middleware entry point
│   └── types/
│       └── index.ts                 # All shared TypeScript interfaces
├── supabase/
│   └── schema.sql                   # Complete DB schema + RLS + trigger
├── public/                          # Static assets
├── .env.local                       # Local env vars (not committed)
├── README.md                        # Quick start
├── SETUP.md                         # Step-by-step setup guide
└── DOCS.md                          # This file
```

---

## 3. Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `cream` | `#faf6f1` | Page background, scrapbook feel |
| `cream-dark` | `#f5ede3` | Alternate backgrounds, hover states |
| `blush` | `#fde8e8` | Card backgrounds, pills, secondary fills |
| `rose` | `#f4b8c1` | Borders, accents, washi tape |
| `pink` | `#e8839a` | Mid-weight accents |
| `strawberry` | `#d94f6c` | Primary brand color — buttons, active states, highlights |
| `red` | `#c0392b` | Hover on primary, destructive |
| `warm-gray` | `#8c7b7b` | Muted text, secondary labels |
| `charcoal` | `#3d2b2b` | Primary text |

These are set as CSS custom properties in `globals.css` under `@theme inline` and also as shadcn/ui semantic tokens (mapped to `--primary`, `--muted`, etc.).

### Typography

| Font | Variable | Usage |
|---|---|---|
| **Nunito** | `--font-nunito` | Body text, labels, UI chrome — weights 400–800 |
| **Dancing Script** | `--font-dancing` | Display headings, page titles, romantic copy |

Apply Dancing Script with the `font-display` utility class defined in `globals.css`:

```tsx
<h1 className="font-display text-3xl">Our Little World</h1>
```

### Spacing & Radius

Uses Tailwind defaults. Key custom radius values via shadcn token `--radius: 0.75rem`:
- `rounded-xl` (12px) — inputs, tags, small cards
- `rounded-2xl` (16px) — list items
- `rounded-3xl` (24px) — primary cards, modals, large surfaces

### Reusable CSS Classes

Defined in `globals.css`:

| Class | Effect |
|---|---|
| `.scrapbook-bg` | Page background with subtle dot pattern and radial gradient tints |
| `.paper-texture` | Soft radial overlay for paper feel |
| `.polaroid` | White card with bottom-heavy padding — classic Polaroid look |
| `.font-display` | Dancing Script typeface |
| `.card-shadow` | Soft multi-layer box shadow |
| `.card-shadow-lg` | Larger version for elevated cards |
| `.photo-corner` | CSS `::before`/`::after` decorative corner brackets |
| `.washi-tape` | `::before` pseudo-element that draws a semi-transparent tape strip |
| `.pb-nav` | Padding-bottom equal to bottom nav height + safe area inset |

---

## 4. Data Model

### Entity Relationship

```
auth.users (Supabase managed)
    │
    ├── worlds (1 per couple)
    │       ├── world_members (up to 2 users per world)
    │       ├── trips
    │       │       └── memories (via trip_id, optional)
    │       ├── memories (also exists without a trip)
    │       │       ├── memory_photos
    │       │       └── memory_tags → tags
    │       ├── letters
    │       ├── future_memories
    │       ├── tags
    │       └── timeline_events
    └── (trigger auto-creates world + world_member on signup)
```

### Table Definitions

#### `worlds`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Default: "Our Little World" |
| `tagline` | text | Optional subtitle |
| `anniversary_date` | date | Used for days-together counter |
| `cover_photo_url` | text | |
| `theme_color` | text | Default: `#d94f6c` |
| `created_by` | uuid FK → auth.users | |
| `created_at` | timestamptz | |

#### `world_members`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `world_id` | uuid FK → worlds | |
| `user_id` | uuid FK → auth.users | |
| `nickname` | text | Displayed in UI |
| `role` | text | `'owner'` or `'partner'` |
| `joined_at` | timestamptz | |

Unique constraint on `(world_id, user_id)`.

#### `trips`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `world_id` | uuid FK → worlds | |
| `title` | text | |
| `description` | text | |
| `location` | text | |
| `start_date` | date | Required |
| `end_date` | date | Optional |
| `cover_photo_url` | text | |
| `song_url` | text | For future Spotify integration |
| `theme_color` | text | |
| `created_by` | uuid FK → auth.users | |
| `created_at` | timestamptz | |

#### `memories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `world_id` | uuid FK → worlds | |
| `trip_id` | uuid FK → trips | Nullable — memories can be standalone |
| `title` | text | |
| `description` | text | |
| `date` | date | Required |
| `location` | text | |
| `mood` | text | Enum: `happy`, `romantic`, `adventurous`, `peaceful`, `funny`, `nostalgic`, `grateful`, `excited` |
| `is_favorite` | boolean | Default false |
| `created_by` | uuid FK → auth.users | |
| `created_at` | timestamptz | |

#### `memory_photos`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `memory_id` | uuid FK → memories | Cascade delete |
| `url` | text | Public URL from Supabase Storage |
| `caption` | text | |
| `width` / `height` | integer | For aspect ratio hints |
| `sort_order` | integer | Controls display order |
| `created_at` | timestamptz | |

#### `letters`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `world_id` | uuid FK → worlds | |
| `title` | text | Shown on envelope |
| `body` | text | Full letter content |
| `recipient` | text | Display name |
| `open_condition` | text | e.g. "Open when you miss me" |
| `open_date` | date | If set + is_locked, hides content until this date |
| `is_locked` | boolean | Default false |
| `photo_url` | text | Optional attached photo |
| `music_url` | text | Optional music link |
| `created_by` | uuid FK → auth.users | |
| `created_at` | timestamptz | |

#### `future_memories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `world_id` | uuid FK → worlds | |
| `title` | text | |
| `description` | text | |
| `emoji` | text | Single emoji character |
| `is_completed` | boolean | Default false |
| `completed_at` | timestamptz | Set when marked done |
| `memory_id` | uuid FK → memories | Optional — link to the memory created when done |
| `created_by` | uuid FK → auth.users | |
| `created_at` | timestamptz | |

#### `timeline_events`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `world_id` | uuid FK → worlds | |
| `title` | text | |
| `description` | text | |
| `date` | date | Required, used for year grouping |
| `type` | text | Enum: `milestone`, `trip`, `birthday`, `anniversary`, `date`, `custom` |
| `emoji` | text | Override icon |
| `memory_id` | uuid FK → memories | Optional cross-link |
| `trip_id` | uuid FK → trips | Optional cross-link |
| `created_by` | uuid FK → auth.users | |
| `created_at` | timestamptz | |

#### `tags` + `memory_tags`
`tags` stores named tags scoped to a world. `memory_tags` is the junction table. Both have RLS policies.

---

## 5. Authentication & Security

### Auth Flow

1. User submits email + password to `/login`
2. `supabase.auth.signInWithPassword()` returns a session
3. Session is stored in a browser cookie
4. Middleware (`src/middleware.ts`) refreshes the session on every request and redirects unauthenticated users to `/login`
5. All Supabase queries from the browser automatically include the session token in the `Authorization` header

### Row Level Security

Every table has RLS enabled. The core helper function is:

```sql
create or replace function public.is_world_member(wid uuid)
returns boolean as $$
  select exists (
    select 1 from public.world_members
    where world_id = wid and user_id = auth.uid()
  );
$$ language sql security definer stable;
```

All `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies on every table call `is_world_member(world_id)`. This means:

- Users can only ever read data from their own world
- Even if a user knows another world's UUID, they get zero rows
- This holds at the database level, independent of application code

### Storage Security

Photos are in a **private** bucket. Storage policies require `auth.role() = 'authenticated'` for all operations. Because all authenticated users share the bucket, the path convention provides organizational structure:

```
worlds/{world_id}/memories/{memory_id}/{timestamp}_{index}.{ext}
worlds/{world_id}/trips/covers/{timestamp}.{ext}
```

For production hardening, storage policies can be tightened to validate the `world_id` path segment against the user's world membership.

### Auto World Creation Trigger

```sql
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_world_id uuid;
begin
  insert into public.worlds (name, created_by)
  values ('Our Little World', new.id)
  returning id into new_world_id;

  insert into public.world_members (world_id, user_id, role)
  values (new_world_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;
```

This fires `after insert on auth.users`, so every new signup immediately has a world without any client-side setup step.

---

## 6. Pages & Routes

### Route Groups

| Group | Purpose | Auth |
|---|---|---|
| `(auth)` | Login, signup | Public — redirects to `/home` if already signed in |
| `(app)` | All main pages | Protected — redirects to `/login` if signed out |

### Page Inventory

#### `/` — Root
Server component. Checks auth and redirects to `/home` (logged in) or `/login` (logged out). No UI rendered.

#### `/login`
Client component. Email/password sign-in. Shows friendly error on wrong credentials. Redirects to `/home` on success.

#### `/signup`
Client component. Creates a Supabase account. Shows success screen prompting email confirmation.

#### `/home`
Client component. Loads on mount:
- Current user's display name
- World record (name, tagline, anniversary_date)
- Aggregate counts (trips, memories, letters, photo_count, favorites)
- Latest memory with first photo
- "On This Day" — memories whose `date` matches today's month-day from a prior year
- 4 most recent memories after the latest

Renders: hero greeting, stats grid, latest memory card, on-this-day section, recent memories grid, quick-links grid.

#### `/trips`
Client component. Loads all trips for the world ordered by `start_date` descending with memory count. Renders a 2-column grid of `TripCard`. Contains `CreateTripModal`.

#### `/trips/[id]`
Client component. Loads the trip record and all memories with `trip_id = id` ordered by `date`. Renders full-width hero cover (photo or gradient), trip metadata, memory grid. Contains `AddMemoryModal` scoped to this trip.

#### `/memories`
Client component. Loads all memories for the world with photos and tags. Client-side filtering by mood/favorites and text search across title, description, location, and tag names. Renders 2-column polaroid grid.

#### `/memories/[id]`
Client component. Loads single memory with photos, tags, and creator. Full-screen photo viewer with dot pagination. Toggleable favorite. Photo thumbnail strip when multiple photos.

#### `/letters`
Client component. Loads all letters ordered by `created_at` descending. Renders 2-column `LetterCard` grid on tablet+, single column on mobile. Contains `CreateLetterModal`.

#### `/letters/[id]`
Client component. Loads single letter. If `is_locked` and `open_date` is in the future, shows a locked state with unlock date. Otherwise renders the full letter on styled paper with washi tape decoration.

#### `/us`
Client component. Loads the world record (for stats), all timeline events, and aggregated counts. Renders:
- Relationship stats card (days together, trip/memory/letter counts)
- Timeline grouped by year, with connecting vertical line
- `AddEventModal` for new milestones

#### `/future`
Client component. Loads all future memories. Renders pending items with a "We did it! ♡" completion button, and completed items in a struck-through list below. Includes preset suggestions for empty state.

#### `/settings`
Client component. Loads world record and current user's membership row. Form to update `worlds.name`, `worlds.tagline`, `worlds.anniversary_date`, and `world_members.nickname`. Saved with parallel Supabase updates.

---

## 7. Component Inventory

### Cards

#### `MemoryCard`
```tsx
<MemoryCard
  memory={memory}
  variant="grid" | "featured" | "compact"
  rotation={-2 | -1 | 0 | 1 | 2}  // optional, randomised if omitted
/>
```

- **grid** — Polaroid card with slight CSS rotation. Used in the main memories grid.
- **featured** — Landscape card with no rotation. Used on home page and trip detail.
- **compact** — Horizontal thumbnail + text row. Used for on-this-day and lists.

#### `TripCard`
```tsx
<TripCard trip={trip} />
```

Portrait card with cover photo (or branded gradient), title, location, date range, memory count. Corner bracket decorations, gradient overlay. Links to `/trips/[id]`.

#### `LetterCard`
```tsx
<LetterCard letter={letter} />
```

Envelope-style card with a decorative flap, heart wax seal, lock icon when date-locked. Shows `open_condition` tag. Links to `/letters/[id]` unless locked.

### Layout

#### `SideNav`
Desktop sidebar (hidden on mobile via `md:flex`). Contains logo, nav links with emoji, settings link, logout button. Active state uses blush background with strawberry text.

#### `BottomNav`
Mobile bottom nav (hidden on desktop via `md:hidden`). Five primary destinations. Active tab has blush pill background. Respects `safe-area-inset-bottom`.

#### `AddMemoryButton`
Floating action button, fixed position. Bottom-right on mobile (above bottom nav), bottom-right on desktop. Opens `AddMemoryModal`.

### Shared

#### `AddMemoryModal`
Full create-memory form:
- Title (required), description, date (required), location
- Mood selector (pill buttons)
- Tags input (comma-separated, auto-creates)
- `PhotoUploader`
- Favorite toggle
- Optionally scoped to a `tripId`

On submit: creates `memories` row, uploads photos to Storage, creates `memory_photos` rows, creates/links `tags`.

#### `PhotoUploader`
```tsx
<PhotoUploader
  files={files}       // File[]
  onChange={setFiles} // (files: File[]) => void
  maxFiles={10}       // optional, default 10
/>
```

Drag-and-drop drop zone + tap-to-open file picker. Image-only filter. 20MB per file limit. Live preview grid with individual remove buttons.

#### `EmptyState`
```tsx
<EmptyState
  emoji="✈️"
  title="Every adventure starts somewhere..."
  subtitle="You haven't added any trips yet."
  action={<Button>Create our first trip</Button>}  // optional
/>
```

Centered layout used on all list pages when data is empty.

---

## 8. TypeScript Types

All types are in `src/types/index.ts`. Key interfaces:

```ts
interface World { id, name, tagline, anniversary_date, cover_photo_url, theme_color, created_at, created_by }
interface WorldMember { id, world_id, user_id, nickname, role: 'owner' | 'partner', joined_at, user? }
interface Trip { id, world_id, title, description, location, start_date, end_date, cover_photo_url, song_url, theme_color, created_by, created_at, memory_count?, photo_count? }
interface Memory { id, world_id, trip_id, title, description, date, location, mood, is_favorite, created_by, created_at, photos?, tags?, trip?, creator? }
interface MemoryPhoto { id, memory_id, url, caption, width, height, sort_order, created_at }
interface Letter { id, world_id, title, body, recipient, open_condition, open_date, is_locked, photo_url, music_url, created_by, created_at, creator? }
interface FutureMemory { id, world_id, title, description, emoji, is_completed, completed_at, memory_id, created_by, created_at }
interface TimelineEvent { id, world_id, title, description, date, type, emoji, memory_id, trip_id, created_by, created_at }
interface WorldStats { days_together, trip_count, memory_count, letter_count, photo_count, place_count, favorite_count }
```

Constants exported from the same file:

```ts
MOOD_LABELS: Record<Mood, string>   // display labels for each mood
STICKERS: { id, emoji, label }[]    // sticker library for future scrapbook editor
```

---

## 9. Utilities

`src/lib/utils.ts`:

| Export | Signature | Purpose |
|---|---|---|
| `cn` | `(...inputs: ClassValue[]) => string` | Merge Tailwind classes (clsx + tailwind-merge) |
| `formatDate` | `(date: string \| Date) => string` | "Sep 15, 2026" |
| `formatDateShort` | `(date: string \| Date) => string` | "Sep 15" |
| `formatDateRelative` | `(date: string \| Date) => string` | "3 days ago" |
| `daysTogether` | `(anniversaryDate: string) => number` | Days since anniversary |
| `formatNumber` | `(n: number) => string` | Locale-formatted number |
| `getInitials` | `(name: string) => string` | "Dhawal Rastogi" → "DR" |
| `generateId` | `() => string` | Short random ID |
| `PLACEHOLDER_PHOTOS` | `string[]` | Unsplash URLs for dev/demo |

---

## 10. Photo Storage

### Upload path

```
photos/                                    ← bucket
  worlds/{world_id}/
    memories/{memory_id}/
      {timestamp}_{index}.{ext}           ← memory photos
    trips/
      covers/
        {timestamp}.{ext}                  ← trip cover photos
```

### Upload flow (in `AddMemoryModal`)

1. Create the `memories` row first (need the `id`)
2. For each `File` in the array:
   - Build the storage path using world_id + memory_id
   - `supabase.storage.from('photos').upload(path, file)`
   - Get public URL via `supabase.storage.from('photos').getPublicUrl(path)`
   - Insert `memory_photos` row with that URL
3. The URL stored in the DB is the Supabase CDN URL

### Notes

- Files are validated client-side (type = `image/*`, size < 20MB) in `PhotoUploader`
- Storage policies allow any authenticated user to read/write. For stricter control, validate the world_id path prefix in the policy.
- Photos are served directly from Supabase's CDN — no proxy needed

---

## 11. Adding New Features

### Adding a new page

1. Create `src/app/(app)/new-page/page.tsx`
2. Add it to `SideNav.tsx` and `BottomNav.tsx` nav arrays
3. Add a Supabase table/RLS policy if it needs new data
4. Export any new TypeScript interfaces from `src/types/index.ts`

### Adding a new card variant

1. Create `src/components/cards/NewCard.tsx`
2. Accept a typed prop from `src/types/index.ts`
3. Use the existing design tokens (polaroid class, card-shadow, etc.)

### Adding Framer Motion animations

`framer-motion` is installed. Wrap elements with `motion.div` and add `initial`, `animate`, `transition` props. Always respect `prefers-reduced-motion` — either check `window.matchMedia('(prefers-reduced-motion: reduce)')` or use Framer's `useReducedMotion()` hook.

### Connecting Spotify

The `trips.song_url` column already exists. Store a Spotify track URL there. To embed, use Spotify's oEmbed API or the `<iframe>` embed URL format:

```
https://open.spotify.com/embed/track/{track_id}
```

Expose this as an optional field in the trip detail page.

### AI scrapbook pages

The architecture is ready for a Scrapbook Page Editor. The planned tables are `scrapbook_pages` (parent) and `scrapbook_elements` (positioned elements with type, content, transform). A page editor would render elements with absolute positioning, allow drag-to-reposition, and save element state as JSON. Claude API via the Anthropic SDK could auto-generate layouts from a set of memory photos.

### World map

The `trips.location` field stores a plain text location. For map integration:
1. Add `latitude` and `longitude` columns to `trips`
2. Geocode addresses via a server action using a maps API (Google Maps Geocoding, Mapbox, etc.)
3. Render with `react-map-gl` (Mapbox) or `leaflet`. Store the API key server-side only.

### Push notifications

Add a `notifications` table and a Supabase Edge Function triggered on inserts to `memories` or `letters`. Use the Web Push API or a service like OneSignal. Store device tokens in a `push_tokens` table scoped to `world_members`.
