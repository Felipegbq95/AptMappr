# AptMappr 🏙️🗺️

Map-first apartment hunting. Drop every listing you're considering onto a map,
keep the notes, links, WhatsApp contact and viewing appointment for each one in
a single place, then compute the **most efficient route** to see as many as
possible in a day.

Built to run with **zero configuration** for instant local use, and to become a
real **cloud, multi-user, monetizable** app the moment you add a Supabase
project.

---

## ✨ Features

- **Mobile-first**: on a phone it's a full-screen map with a draggable bottom
  sheet (like Airbnb/Zillow); on desktop it's a map + sidebar. Built for hunting
  on the go.
- **Interactive map** of every apartment, with pins color-coded by status
  (lead → contacted → scheduled → visited → favorite → rejected).
- **Add apartments** by searching an address _or_ dropping a pin directly on the
  map (auto reverse-geocoded to an address).
- **Photos** per apartment — upload from your device or paste image URLs, shown
  as list thumbnails and a swipeable gallery.
- **Rich detail per apartment**: monthly rent, bedrooms, size, notes, a link to
  the original listing, a one-tap **WhatsApp** button, a **Directions**
  (Google Maps) hand-off, and a **viewing appointment** date/time.
- **Search & filter** by text and status.
- **Commute anchors** — save the places that matter (work, gym, a friend's
  flat) and every apartment shows the **driving time and distance** to each,
  right in its detail panel. Answers the #1 question: "how far is it, really?"
- **Route optimizer** — pick a set of apartments (or auto-pick everything with a
  viewing on a given day), optionally set a start point ("use my location" or one
  of your saved places), and get the optimal visiting order drawn on the map with
  total distance and driving time. Solves the travelling-salesman problem via
  OSRM's trip service.
- **Two storage modes, same code**:
  - **Local mode** (default): data lives in your browser — no accounts, no keys.
  - **Cloud mode**: add a Supabase project and it turns into a synced,
    multi-user app with email + Google sign-in and per-user data isolation.

---

## 🚀 Quick start (local, no config)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. That's it — add apartments and everything is saved
in your browser. Great for trying it out or personal use on one device.

---

## ☁️ Turn on cloud sync + login (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and **Run**. This creates the
   `apartments` table with row-level security so each user only sees their own
   data.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public
   key**.
4. Create `.env.local` (copy from [`.env.example`](./.env.example)):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

5. Restart `npm run dev`. You'll now get a sign-in screen, and data syncs to the
   cloud.

**To enable photo uploads** in cloud mode: in the Supabase dashboard go to
**Storage → New bucket**, name it `apartment-photos`, and mark it **public**.
The storage access policies are included at the bottom of
[`supabase/schema.sql`](./supabase/schema.sql). (In local mode, photos are
downscaled and stored in the browser automatically — no bucket needed.)

**Email magic links** work out of the box. To enable **Google sign-in**, go to
**Authentication → Providers → Google** in Supabase and follow the prompts
(create a Google OAuth client, paste the client id/secret). Add your site URL
(e.g. `http://localhost:3000` and your production domain) under
**Authentication → URL Configuration**.

---

## ▲ Deploy to the cloud (Vercel)

1. Push this repo to GitHub.
2. Import it at [vercel.com](https://vercel.com) — it auto-detects Next.js.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel
   project settings.
4. Deploy. Add your Vercel domain to Supabase's allowed redirect URLs.

---

## ⚙️ Configuration reference

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud mode | Supabase project URL. Leave blank for local mode. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud mode | Supabase anon key (safe in the browser; RLS protects data). |
| `NEXT_PUBLIC_MAP_TILE_URL` | No | Custom `{z}/{x}/{y}` raster tile template. Defaults to CARTO Voyager. |
| `NOMINATIM_URL` | No | Geocoding base URL. Defaults to the public OSM Nominatim server. |
| `OSRM_URL` | No | Routing base URL. Defaults to the public OSRM demo server. |

### ⚠️ About the default geocoding & routing services

By default the app uses the **public OpenStreetMap Nominatim** (address search)
and **OSRM demo** (route optimization) servers. These are perfect for personal
use and development, but their usage policies **do not allow heavy or commercial
traffic**. Before you monetize, point `NOMINATIM_URL` / `OSRM_URL` at your own
hosted instances, or swap in a commercial provider (Mapbox, Google, LocationIQ,
etc.). The geocoding/routing calls are isolated in
`src/app/api/geocode/route.ts` and `src/app/api/optimize/route.ts`, so switching
providers is a small, contained change.

---

## 💳 Monetization roadmap

The architecture is deliberately ready for a paid SaaS:

- **Accounts & per-user data** — already handled by Supabase Auth + RLS.
- **Add Stripe** — gate premium features (unlimited apartments, route planning,
  export) behind a subscription. Supabase has an official Stripe pattern; the
  natural place to check entitlement is the storage layer (`src/lib/storage.ts`)
  and the route/geocode API handlers.
- **Production maps/routing** — move to a commercial or self-hosted provider (see
  the warning above) so usage scales cleanly.

---

## 🧱 Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Leaflet** / react-leaflet with CARTO/OpenStreetMap tiles
- **Supabase** (Postgres + Auth + Row Level Security) — optional
- **Nominatim** geocoding + **OSRM** route optimization (swappable)
- **lucide-react** icons

## 📁 Project structure

```
src/
├── app/
│   ├── api/geocode/route.ts    # Address search + reverse geocode proxy
│   ├── api/optimize/route.ts   # OSRM trip (TSP) route optimizer
│   ├── api/commute/route.ts    # OSRM table (driving-time matrix)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AppShell.tsx            # Top-level state + layout
│   ├── MapView.tsx             # Leaflet map, pins, places, route polyline
│   ├── ApartmentList.tsx
│   ├── ApartmentDetail.tsx     # Detail incl. photo gallery + commute times
│   ├── ApartmentForm.tsx       # Add / edit modal
│   ├── PhotoInput.tsx          # Upload / paste-URL photo manager
│   ├── AddressSearch.tsx       # Debounced geocoding autocomplete
│   ├── RoutePlanner.tsx        # Route optimization UI
│   ├── PlacesPanel.tsx         # Manage commute anchors (work, gym, …)
│   ├── StatusPill.tsx
│   └── Auth.tsx                # Login screen + sign-out (cloud mode)
└── lib/
    ├── types.ts                # Domain model
    ├── storage.ts              # Local + Supabase adapters (apartments + places)
    ├── supabase.ts             # Browser Supabase client (null in local mode)
    ├── photos.ts               # Photo upload (Storage) / downscale (local)
    ├── commute.ts              # Cached commute-time lookups
    ├── useApartments.ts        # Data hook (CRUD)
    ├── usePlaces.ts            # Places data hook
    ├── useAuth.ts              # Session hook
    ├── api.ts                  # Client helpers for geocode/optimize
    └── utils.ts                # WhatsApp links, formatting, geo helpers
```

---

Made for the apartment-hunting grind. Happy house hunting! 🔑
