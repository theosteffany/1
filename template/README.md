# UGC Creator Portfolio — Template

A cinematic one-page portfolio for UGC creators: full-screen video intro, about,
brands, photo gallery, video work and a contact form.

**No database, no logins, no coding.** Everything lives in one file:
[`site.config.ts`](site.config.ts).

---

## 1. Make it yours

1. Open **`site.config.ts`** and replace the example text with your own.
2. Put your photos and videos in **`public/images/`** and point to them in the
   config, e.g. `photo: "/images/me.jpg"`.
3. Pick your colours in the `colors` section (any hex code, try
   [coolors.co](https://coolors.co)).

Tips:
- Photos: `.jpg` or `.webp`, around 2000px on the long edge, under ~500 KB each.
- Intro video: `.mp4`, 10 to 20 seconds, under ~15 MB. Add a vertical cut as `videoMobile` for phones.
- Wrap words in `*stars*` in headings to show them in the italic accent font.

## 2. Put it online (free)

**Easiest: Netlify + GitHub, no installs needed**
1. Create a free [GitHub](https://github.com) account → **New repository** →
   *uploading an existing file* → drag in all the files from this folder.
2. Create a free [Netlify](https://netlify.com) account → **Add new site** →
   **Import an existing project** → pick your repository. Netlify fills in the
   settings for you. Click **Deploy**.
3. To change something later, edit `site.config.ts` on GitHub (pencil icon) and
   save. Your site updates itself in about a minute.

[Vercel](https://vercel.com) works the same way: **Add New → Project** → import the repository.

**Connect your own domain:** in Netlify or Vercel open **Domains** and follow the
steps. Then set `seo.siteUrl` in the config to your new address.

## 3. Get contact form messages in your inbox (optional)

Out of the box, the form opens the visitor's email app with their message
filled in. To receive messages directly instead:
1. Create a free form at [formspree.io](https://formspree.io).
2. Copy its link (looks like `https://formspree.io/f/abcdwxyz`).
3. Paste it into `contact.formEndpoint` in `site.config.ts`.

## Previewing on your computer (optional, for the technical)

Needs [Node.js](https://nodejs.org) 18.18 or newer.

```bash
npm install
npm run dev     # http://localhost:3000, updates live as you edit
npm run build   # builds the finished site into the `out` folder
```

The `out` folder is plain HTML and can be hosted anywhere, including by
dragging it onto [Netlify Drop](https://app.netlify.com/drop).

---

Built with Next.js, Tailwind CSS and Framer Motion. See [LICENSE.md](LICENSE.md)
for what you can and can't do with this template.
