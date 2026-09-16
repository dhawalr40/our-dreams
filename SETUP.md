# Setup Guide — Our Little World 🎀

Complete setup from zero to running app.

---

## Prerequisites

- Node.js 18+ (`node -v`)
- A free [Supabase](https://supabase.com) account

---

## Step 1 — Install dependencies

```bash
npm install
```

---

## Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name (e.g. `our-little-world`) and a strong database password
3. Select a region close to you
4. Wait ~2 minutes for provisioning

---

## Step 3 — Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find both values in:
**Supabase Dashboard → Settings → API → Project URL & anon/public key**

> The anon key is safe to expose in the browser — Row Level Security prevents any cross-account data access.

---

## Step 4 — Run the database schema

1. In Supabase Dashboard, go to **SQL Editor → New Query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

This creates:

| Table | Purpose |
|---|---|
| `worlds` | Each couple's private space |
| `world_members` | Links users to a world (owner / partner) |
| `trips` | Travel adventures |
| `memories` | Individual memory entries |
| `memory_photos` | Photos attached to memories |
| `letters` | Private written letters |
| `future_memories` | Bucket list items |
| `tags` | User-created tags |
| `memory_tags` | Junction table: memories ↔ tags |
| `timeline_events` | Our Story timeline milestones |

It also creates:
- A `is_world_member()` helper function used by all RLS policies
- A trigger that **automatically creates a world** when any new user signs up, and adds them as owner

---

## Step 5 — Set up photo storage

In Supabase Dashboard → **Storage**:

1. Click **New Bucket**
2. Name: `photos`
3. **Public bucket:** OFF (private)
4. File size limit: `20971520` (20 MB)
5. Allowed MIME types: `image/*`
6. Click **Save**

Then go to **Storage → Policies** and add these three policies for the `photos` bucket:

```sql
-- Upload
create policy "Auth users can upload"
  on storage.objects for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'photos');

-- Read
create policy "Auth users can read"
  on storage.objects for select
  using (auth.role() = 'authenticated' and bucket_id = 'photos');

-- Delete
create policy "Auth users can delete"
  on storage.objects for delete
  using (auth.role() = 'authenticated' and bucket_id = 'photos');
```

---

## Step 6 — Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 7 — First login

1. Click **Create your world** → fill in your name, email, and password
2. Check your email and click the confirmation link
3. Sign in — a world named "Our Little World" is created automatically for you
4. Go to **Settings** and personalize:
   - **World name** — e.g. `Dhawal & ❤️` or `Us, Always 🎀`
   - **Tagline** — a subtitle shown on the home page
   - **Anniversary date** — used to calculate days together
   - **Your nickname**

---

## Step 8 — Add your partner

The simplest approach is to share one login. For a proper two-account setup:

1. Your partner signs up at `/signup`
2. They confirm their email and log in once (this creates their own separate world)
3. In **Supabase → SQL Editor**, find both user IDs and your world ID:

```sql
-- Find your world ID
select id, name from worlds order by created_at;

-- Find your partner's user ID
select id, email from auth.users order by created_at;
```

4. Add your partner to your world:

```sql
insert into world_members (world_id, user_id, role)
values ('<your-world-id>', '<partner-user-id>', 'partner');
```

5. Your partner can now delete their own empty world if desired:

```sql
delete from worlds where created_by = '<partner-user-id>'
  and id != '<your-world-id>';
```

---

## Deployment

### Vercel (recommended, free)

1. Push this repository to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

Your app will be live at `your-project.vercel.app` in ~60 seconds.

### Other platforms

The app is a standard Next.js App Router project. It runs anywhere Next.js runs: Netlify, Railway, Fly.io, self-hosted VPS. Set the two environment variables and run `npm run build && npm start`.

---

## Development reference

```bash
npm run dev      # Start development server on :3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## Troubleshooting

**"Invalid supabaseUrl" on first load**
→ `.env.local` is missing or the URL is still the placeholder. Add your real Supabase URL.

**Photos not uploading**
→ Check that the `photos` storage bucket exists and the three storage policies are applied.

**"No world found" error after login**
→ The signup trigger may not have run. In SQL Editor, manually create a world and world_member row for your user ID.

**Partner can't see memories**
→ Confirm the `world_members` row exists for their user ID pointing to your world ID. Check RLS policies are active on all tables.

**Middleware redirect loop**
→ Verify `NEXT_PUBLIC_SUPABASE_URL` doesn't have a trailing slash and matches exactly what's in the Supabase dashboard.
