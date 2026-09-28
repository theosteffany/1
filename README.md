# Theo — UGC Creator Portfolio

A cinematic, single-page UGC portfolio with a protected `/admin` dashboard.
Built with **Next.js 15 (App Router) · Tailwind CSS · Framer Motion · Supabase**.

```
HERO → ABOUT → BRANDS → GALLERY → MY WORK → CONTACT
```

The site runs straight away with clearly labelled **placeholder content**. You'll see an orange
"Placeholder content" badge until Supabase is connected. After that, everything is edited in `/admin`
and nothing is hard-coded.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

## Connect Supabase (database, login, media)

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql). This creates the tables,
   security rules, the public `media` storage bucket and the starter gallery categories
   (Lifestyle / Fitness / Fashion / Travel / Brands). You can run it again safely.
3. Copy `.env.example` → `.env.local` and fill in values from **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
4. **Authentication → Users → Add user** (email + password). Then make that user an admin in the SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
5. Restart `npm run dev`, go to **/admin** and sign in.

> Turn off public sign-ups in **Authentication → Providers → Email** so only you can create accounts.
> Even if someone signs up, they can't edit anything: only users in `admins` can write, and that's
> enforced by the database (row level security), not only by the UI.

## Deploy

Vercel works out of the box: import the repo, add the three environment variables and deploy.
The home page is statically generated. When you save in `/admin` it's rebuilt straight away
(on-demand revalidation), and it also refreshes every 5 minutes as a fallback.

---

## Using the admin

| Section | What you manage |
| --- | --- |
| **Hero** | Name, tagline, desktop video, optional vertical mobile video, poster image |
| **About** | Heading, bio (blank line = new paragraph), main photo, small inset photo |
| **Brands / Gallery / My Work sections** | Section headings |
| **Contact & socials** | Email, phone (optional), Instagram, TikTok, location, intro |
| **SEO & sharing** | Page title, description, favicon, social preview image |
| **Brands** | Add/remove/reorder logos, website link, show/hide |
| **Gallery** | Bulk upload photos, category, orientation (auto-detected), featured, show/hide, reorder |
| **Gallery categories** | Rename, add, remove and reorder the filter tabs |
| **Projects** | Video, thumbnail, brand, title, description, category, format, external link, featured, show/hide, reorder |
| **Messages** | Enquiries sent through the contact form |

**Reordering:** drag rows on desktop, or use the ↑ ↓ buttons on any device.
**Accent words:** in any heading, wrap words in `*asterisks*` to show them in the italic serif,
e.g. `UGC MADE TO *STOP THE SCROLL.*`

### Media tips
- **Hero video:** 10–20s, no audio, H.264 MP4, around 1080p, ideally under ~15MB. Add a vertical cut for phones.
- **Project videos:** compressed MP4. They never autoplay on phones. On desktop they preview on hover,
  and they open in a muted player with controls when clicked.
- **Photos:** upload full-quality JPGs. The site generates responsive AVIF/WebP sizes automatically.
- **Logos:** transparent PNG or SVG. They show in greyscale and turn full colour on hover.

---

## Customising

### Colours: one place
All colours are CSS variables in [`src/app/globals.css`](src/app/globals.css):

```css
--bone:  244 240 232;  /* warm off-white */
--mist:  234 228 215;  /* alternate section */
--ink:    28  27  25;  /* deep charcoal */
--olive:  91  95  58;  /* earthy accent */
--sand:  217 203 176;  /* soft sand */
--ember: 217 113  60;  /* single highlight */
```

Tailwind classes (`bg-ink`, `text-olive/60`, …) all read from these, so changing a value re-themes the whole site.

### Fonts
Set in [`src/app/fonts.ts`](src/app/fonts.ts): **Archivo** (variable width, used expanded for headings)
and **Instrument Serif** (italic accent). Swap for any Google font.

### Adding a new field
- **One-off text/media** (e.g. a new line in the hero): add it to `SiteSettings` in `src/lib/types.ts`,
  give it a default in `src/lib/placeholder-content.ts`, and list it in `settingsGroups` in
  `src/components/admin/SettingsEditor.tsx`. Settings are stored as JSON, so no database migration is needed.
- **A field on a collection** (e.g. "year" on projects): add the column in `supabase/schema.sql`,
  add it to the type in `src/lib/types.ts`, and list it in `src/components/admin/collections.ts`.
  The admin form, list and saving pick it up automatically.

---

## Project structure

```
src/
  app/
    page.tsx                 # the one-page site
    layout.tsx               # fonts + SEO metadata (from admin settings)
    og/route.tsx             # fallback social preview image
    admin/                   # dashboard + login
    api/contact/             # contact form → Supabase
    api/revalidate/          # admin-only: refresh the public page after edits
  components/
    site/                    # Hero, About, Brands, Gallery, Lightbox, Work, VideoModal, Contact…
    admin/                   # CollectionManager, SettingsEditor, MediaUpload, fields…
    ui/                      # Reveal, Media (next/image wrapper), icons, shared bits
  lib/
    content.ts               # loads everything from Supabase (falls back to placeholders)
    placeholder-content.ts   # defaults + placeholder data
    types.ts                 # content model
  middleware.ts              # guards /admin
supabase/schema.sql          # tables, RLS, storage bucket
public/placeholders/         # labelled placeholder artwork
```

## Motion & accessibility
- Scroll reveals, parallax and the hero title animation all turn off when the visitor has
  **Reduce motion** enabled (the brand marquee becomes a static row).
- Lightbox and video player support keyboard (← → Esc), swipe on touch, focus return and scroll lock.
- The hero video pauses when scrolled off-screen, and the poster image loads first for fast LCP.

## Content rules
Placeholders are clearly labelled. No brands, testimonials, statistics, awards or clients are invented.
Add only real partnerships through the admin.
