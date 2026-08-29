# WokChords 🎸🎹

> **The fast, clean, and accurate chord sheet platform for guitarists and pianists.**  
> Powered by **Wokdens** · © 2026 wokchords.wokdens.com

---

## 🌟 Tech Stack & Architecture

- **Framework:** [Astro 4](https://astro.build/) with TypeScript & React 18 Islands
- **Styling:** Tailwind CSS with custom acoustic ambient mesh gradients and dark/light theme persistence (`localStorage`)
- **Chord Engine:** [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) (ChordPro Parser & HTML Formatter)
- **Deployment Mode:** Hybrid SSR/SSG with `@astrojs/node` adapter (`prerender = true` across all public routes for global sub-20ms edge CDN delivery)

---

## 📁 Content & Catalog Architecture

- **Catalog Size:** **4,047 ChordPro song files** stored in `src/content/songs/*.chopro`
- **Layout Format:** Compact **2-lines-per-row** lyric alignment to minimize vertical scrolling on stage and mobile
- **Frontmatter Schema:**
  ```yaml
  ---
  title: "Song Title"
  artist: "Artist Name"
  movie: "Movie / Soundtrack Name"       # Optional
  movieSlug: "movie-slug"                # Optional
  key: "Am"                              # Musical Key
  tempo: 120                             # Optional BPM
  tags: ["hindi", "bollywood"]           # Language / Genre tags
  ---
  ```

---

## 🚀 Key Features

1. **Interactive Musician Toolbar:**
   - **Key Transposition:** Shift $\pm 12$ semitones with automatic sharp (`#`) vs. flat (`b`) key inference.
   - **Capo Selector:** Transpose chords dynamically relative to capo fret position.
   - **Hands-Free Auto-Scroll:** Smooth continuous viewport scrolling with speed multiplier ($0.5\times$ to $1.5\times$) and end-of-song auto-stop.
   - **Screen Wake Lock:** Keeps device screens awake while playing instruments.
   - **Fingering Diagrams:** Interactive SVG chord diagrams with Guitar & Ukulele toggle.
2. **Instant Search Index:**
   - Client-side search index (`/songs-index.json`) cached in `localStorage` for **0ms instant query latency**.
3. **Multi-Language Collections:**
   - `#Hindi` (2,774 songs), `#English` (1,273 songs), `#Punjabi` (49 songs), `#Marathi` (29 songs), `#Spanish` (25 songs), `#Bengali` (12 songs), `#Tamil` (12 songs).
4. **Site Navigation & Routes:**
   - `/` — Homepage with animated musical vector artwork, trending chords, top artists, and curated film soundtracks
   - `/songs/` — Alphabetical A–Z directory of all 4,000+ songs
   - `/artists/` — Artists directory & `/artist/[slug]/` profile pages
   - `/movies/` — Movie soundtracks & `/movie/[slug]/` dedicated album pages
   - `/about/` — About Us & Wokdens mission
   - `/privacy-policy/` — Legal, GDPR/CCPA privacy policy & DMCA copyright info
   - `/404` — Custom branded error page with search bar

---

## 🔒 Admin Panel & Content Management

- **Route:** `/admin/`
- **Authentication:** Protected with timing-safe HMAC-signed session cookies (`wok_admin_sess`).
- **Configuration:** Set password via `.env`:
  ```env
  ADMIN_PASSWORD=Dell@Hp
  ADMIN_SECRET=wokchords-dell-hp-secret-key-2026
  ```
- **Capabilities:** In-browser ChordPro source editor with real-time preview, direct disk writeback (`/api/admin/song/[slug]`), and draft management.

---

## 🛡️ Anti-Scraper & Data Protection

- **Sitemap Redaction:** XML sitemaps have been deleted to prevent automated scrapers from downloading the full catalog URL list.
- **Bot Disallow:** `public/robots.txt` explicitly blocks automated AI training crawlers (`GPTBot`, `CCBot`, `ClaudeBot`, `anthropic-ai`).

---

## 💻 CLI Commands & Development

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:4321)
npm run dev

# Run production build
npm run build

# Start production server
npm run start

# Validate 100% of all 4,047 ChordPro files
node scripts/test-all-songs.mjs

# Verify live song rendering across test endpoints
node scripts/verify-songs-rendering.mjs
```

---

## 📄 License & Attribution

- **Copyright:** © 2026 [wokchords.wokdens.com](https://wokchords.wokdens.com) · Powered by **Wokdens**
- **Contact:** `copyright@wokdens.com` / `admin@wokdens.com`