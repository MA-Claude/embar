# Embar — Project Memory

This file is read by Claude Code at the start of every session. It contains everything needed to continue building Embar without re-explaining context.

**Companion file:** `C:\Users\gabbe\Documents\Embar\embar-site-structure.md` — maps every page, feature, file, and database table on the site. Read this before making changes to understand where things live. Update it whenever new features are added.

---

## What Embar is

A community platform built around **Forums and Wiki** as its primary purpose — a permanent, searchable knowledge base and discussion space for any topic, built and maintained by the community. Warm, human, anti-algorithm.

Embar is **not limited to any one subject**. It covers everything — film, TV, YouTube, music, sport, tech, hobbies, life. The YouTube section was built first as a starting point, but the platform is designed to expand to all topics.

The key problem Embar solves: Reddit buries old threads and makes finding answers hard. Embar keeps everything searchable forever, ranked by relevance not age.

Live URL: https://embar-tawny.vercel.app/
GitHub: https://github.com/MA-Claude/embar

---

## Platform direction (confirmed)

**Primary features — build these properly first:**
- **Forums** — durable, titled discussions that stay findable forever. Not ranked by age. Searchable by relevance.
- **Wiki** — community-built knowledge base. Trusted members write and edit. Everyone else can suggest changes.

**Secondary features — already partially built, complete after primary:**
- **Sparks** — quick takes and reactions (Discord-style chat layer)
- **Reads** — long-form writing / blog posts
- **Gatherings** — community events

**Why this order:** Forums and Wiki create permanent value. Sparks are useful but ephemeral. The goal is to be the place people find when searching for something, not just a chat room.

---

## The user

No coding experience. Explain everything in plain English. No jargon without an explanation. Be patient and thorough.

---

## Rules to follow always

- Explain everything in plain English before doing it
- Build one phase at a time — test before moving on
- Save to GitHub after each working phase
- Pause before anything that costs money or can't be undone
- Keep scope tight — don't add anything not agreed on without asking first
- Never assume technical knowledge

---

## Tech stack

| Tool | Purpose |
|---|---|
| Next.js | The app framework — builds the website |
| Supabase | Database, user login, file storage, real-time feed |
| Vercel | Hosting — puts the site on the internet automatically |
| YouTube Data API | Channel and video data |
| TMDB API | Films and TV data (future) |
| Resend | Emails and notifications (later) |
| Google AdSense | Ad monetisation — banner/sidebar ads in empty spaces, after launch |
| browser-image-compression | Client-side image compression before upload |

**Future tools to consider when scaling:**
- **Meilisearch or Typesense** — dedicated search engine for relevance-first forum/wiki search (typo tolerance, filters, instant results). Better than basic SQL search at scale. Meilisearch is MIT licensed and easiest to start with.
- **Cloudflare R2** — zero egress fee storage. Replace Supabase storage when costs rise.
- **Backblaze B2** — cheap object storage (~$6/TB/month). Pairs with Cloudflare for free bandwidth.
- **Redis** — caching layer to reduce database load by ~90% at scale.
- **Cloudflare CDN** — serves images and static files from edge locations worldwide, fast and free egress.

**Infrastructure migration path (when needed, not now):**
- Phase 1 (now): Supabase + Vercel + GitHub. Cost ~$0/month.
- Phase 2 (growth, ~50k users/day): Move file storage to Cloudflare R2 or Backblaze B2 + Cloudflare CDN.
- Phase 3 (scale, ~500k users/day): Move compute to Cloudflare Workers or a VPS (Hetzner/DigitalOcean). Export Postgres from Supabase to self-hosted. Everything is migrateable — Supabase uses standard Postgres, Vercel uses standard Next.js.

---

## Forum system (primary feature — to be built properly)

Forums are durable, titled posts designed to stay findable forever. The biggest problem with Reddit is threads get buried by age. Embar fixes this.

**Search and discovery:**
- Ranked by **relevance**, not recency. An old thread with a great answer beats a new thread with no answer.
- Relevance score = keyword match weight + solution/quality signals + minor recency factor.
- Target search engine: **Meilisearch** or **Typesense** (to be integrated when basic SQL search isn't enough).
- Faceted filters in search UI: Status (Solved/Unsolved/Open), Date range, Content type, Topic tags.

**Tagging and categories — crowdsourced (folksonomy model):**
- The OP (person posting) adds tags and categories they think it fits.
- Any other user can also suggest additional categories — so a post gets discovered from multiple angles.
- If users disagree on a category, both can be valid. No single "correct" category.
- Tags are optional when posting but encouraged — the system can suggest tags based on keywords in the post.
- Auto-merge similar tags (e.g. "F1" and "Formula 1" get suggested as the same thing).

**Category structure — poly-hierarchical (multi-parent):**
- A post can live in multiple categories simultaneously. Example: a Blade Runner thread can be in Films → Sci-Fi AND Films → 1980s AND Directors → Ridley Scott.
- Main trunk → branches → sub-branches. But a post isn't locked to one branch.
- Top-level categories cover all topics — not just YouTube or film. Sport, tech, food, music, life, etc.
- Users can filter down to just the topics they care about (e.g. only see forum posts about TV shows).

**Multiple valid answers:**
- No single "Accepted Answer" that buries everything else.
- Search results group threads by approach (e.g. "Software fix", "Hardware fix", "Workaround").
- Users can vote per-approach, not just per-thread.
- Old threads that still work get a "Still valid" confirmation button — if enough users confirm, the thread gets resurfaced automatically.

**Pre-post duplicate detection:**
- As a user types a forum title, search suggests existing threads that match.
- User can choose to add to an existing thread instead of creating a duplicate.
- Reduces fragmentation without forcing it.

---

## Wiki system (primary feature — to be built properly)

The wiki is the curated, permanent knowledge layer. Forums feed into it.

**How it works:**
- Trusted members write and edit wiki entries directly.
- All other users can submit "change requests" — proposed edits that trusted members review and approve (like a pull request).
- Full edit history — nothing permanently deleted, everything reversible.
- Flagging system — any user can flag a suspicious change, which freezes that section for review.

**Wiki–Forum connection:**
- Trusted members can click "Promote to Wiki" on any forum post to pull its content into the wiki.
- The wiki entry links back to the original forum thread for ongoing discussion.
- The wiki stays fresh because it's fed by the best forum content, not by separate writing effort.

**What a wiki page can cover:**
- Any topic — a film, a YouTube channel, a sport, a concept, a place, anything.
- Background and history, what to expect, notable moments, community context.

**Trust tiers:**
- General users: can post in forums, submit wiki change requests, suggest tags/categories.
- Trusted members (earned over time): can edit wiki directly, approve change requests, promote forum posts to wiki.
- Community leaders: moderation powers within their topic area.

---

## Search (to be built as a core feature)

Search is not an afterthought — it's one of the main reasons Embar exists.

**Principles:**
- Relevance first, not recency. A 3-year-old solved thread ranks above a 1-day-old unanswered one.
- All content is always searchable — forums, wiki, sparks, reads. Nothing gets buried by age.
- Faceted filters: content type, date range, topic, solved/unsolved status, tags.
- "Show me everything" default view: wiki summary at top if available, then top forum threads, then recent discussion.

**Implementation path:**
- Current: basic Postgres full-text search (good enough for now).
- Future: replace with Meilisearch or Typesense for typo tolerance, instant results, complex filtering.

---

## Content modes (two types, both always searchable)

**Library mode (evergreen):**
- Forums, wiki entries, Reads.
- Permanent. Never archived. Indexed forever.
- Resurfaced by relevance when searched.
- Example: a forum post about fixing a software bug from 3 years ago still appears first if it's the best answer.

**Lounge mode (discussion):**
- Sparks, reaction threads, "what did you think of X" posts, top 10 lists.
- Still searchable forever — just not under pressure to be "solved".
- Example: an F1 race reaction thread from 2024 still appears when someone searches "Monaco GP 2024 controversy" in 2027.
- No "accepted answer" pressure. Engagement is measured by conversation quality, not resolution.

Both modes live in the same platform and search index. The difference is expectation, not visibility.

---

## Monetisation plan

**Core principle: content is always free and open. You charge for features and convenience, never for access to information.**

**Revenue streams (in order of when to introduce them):**

1. **Google AdSense — banner/sidebar ads** (after launch, once traffic exists)
   - Static banners in empty spaces — sidebar, below the fold, between content sections.
   - Keep ads visually separated from content. Non-animated, clearly labelled.
   - Contextual ads (relevant to the page topic) perform better and feel less intrusive.
   - Won't damage the feel if design quality is high and ads stay in their lane.

2. **Freemium membership** (after community is established)
   - Free tier: full access to all content, forums, wiki, posting.
   - Paid tier: ad-free experience, profile badge, fast-track to trusted member status, possible custom themes.
   - Never put knowledge behind a paywall.

3. **API / data access** (long-term, once data is substantial)
   - Structured wiki and forum data can be sold to researchers, developers, or AI companies.
   - "Free for humans, paid for machines."
   - Aligns with Stack Overflow's fastest-growing revenue stream.

4. **Affiliate links** (natural fit for recommendation-heavy discussions)
   - If a forum recommends a product, relevant affiliate links can be appended.
   - Feels helpful rather than exploitative — user was already going to buy it.

**Revenue benchmarks for context:**
- Top niche forums: $100k–$500k/year.
- Stack Overflow (forum/wiki hybrid): ~$115M/year.
- Fandom (open wiki network): ~$130M/year.
- Wikipedia (donations only): ~$185M/year.

---

## Cost overview and projections

All costs fall on the Embar owner, not users.

| Stage | Users/day | Est. monthly cost |
|---|---|---|
| Launch | 0–5k | ~$0–35/month |
| Growth | 50k | ~$200/month |
| Scale | 500k | ~$1,350/month |
| Enterprise | 2M+ | ~$6,000+/month |

**Cost-saving strategies:**
- Use Cloudflare R2 for storage (zero egress fees) instead of AWS S3.
- Pair Backblaze B2 with Cloudflare CDN for images — free bandwidth.
- Use Redis caching to reduce database queries by ~90%.
- Convert user image uploads to WebP/AVIF automatically — 40–60% smaller files.
- Move old attachments (2+ years) to cold storage (~$0.002/GB).

**Current costs:** ~$0/month (free tiers of Supabase, Vercel, GitHub).

---

## Phase 1 decisions (all finalised)

**Content scope:** YouTube channels built first. All topics to follow.

**Community customisation:** Preset themes only. No profile picture or banner image uploads in Phase 1. Generated avatars from user initials + chosen colour instead.

**Post card creativity:** Individual post cards should eventually have unique visual designs — different layouts, accent colours, textures. The feed should feel alive, not a uniform grid of identical boxes. Build once core features are stable.

**Images in posts:** Users CAN upload images. Auto-compressed client-side using browser-image-compression. Max 1920px wide, ~80% quality, 10MB hard cap. Profile pictures and community banners deferred to Phase 2.

---

## Platform structure

**1. Forums** (primary)
Durable titled discussions. Poly-hierarchical categories. Relevance-first search. Never buried by age.

**2. Wiki** (primary)
Community-built knowledge base. Trusted member editing. Change request system. Fed by forum content via "Promote to Wiki".

**3. Topic communities**
Each topic (a YouTube channel, a film, a sport, anything) has its own community space with all content types available within it.

**4. Individual profiles**
Users have their own profile showing everything they've written. Others can follow them.

**5. Crews**
Small private or public groups of friends with shared interests across multiple topics.

---

## Community content naming system

| Display name (UI) | Internal name (code/DB) | What it is |
|---|---|---|
| **Stream** | `all` | Default tab — all content types in one feed |
| **Sparks** | `threads` | Quick takes, reactions. Fast and light. Secondary feature. |
| **Forums** | `forums` | Durable titled posts. Primary feature. |
| **Reads** | `blogs` | Long-form writing. |
| **Wiki** | `wiki` | Community knowledge base. Primary feature. |
| **Gatherings** | `events` | Events, watch parties. |

### Card type labels
| Label | Content type |
|---|---|
| Spark | A quick reaction post |
| Root | A forum post |
| Read | A long-form post |
| Lore | A wiki entry |
| Gathering | An event |

### Rules
- Never show internal names (threads, blogs, events) in the UI
- Never call the all-feed tab "All" — it is Stream
- Do not invent new names without updating this table

---

## What's been built so far

1. ✅ Project setup (Next.js + GitHub + Vercel)
2. ✅ CLAUDE.md project memory file
3. ✅ Supabase connection
4. ✅ User accounts (username + password, no email required)
5. ✅ YouTube channel pages with community themes
6. ✅ Community tab with Discord-style layout (sidebar nav + feed + pinned input)
7. ✅ Sparks — posting and display
8. ✅ Responsive layout (mobile/tablet/desktop)
9. ✅ Forums — titled threads with tags, inline thread expansion, replies

## Pending before next session

**SQL migration needed:** Run `supabase-forums-migration.sql` in Supabase to create/update the community_posts table with parent_id and tags columns:
1. Go to https://supabase.com/dashboard/project/wntaftiaptuzwzcekfhq/sql/new
2. Paste the full contents of `supabase-forums-migration.sql` (in the project root)
3. Click Run
This is safe to run even if the table already exists. It takes 30 seconds.

## What to build next

- **Wiki** — editable entries with edit history and change request system
- **Topic category tree** — top-level categories covering all subjects, not just YouTube
- **Relevance-first search** — upgrade from basic SQL to Meilisearch or Typesense
- **Reply counts in Stream tab** — forum threads showing in Stream should also show reply count
- **Forum status** — Solved / Unsolved / Open flag on threads

---

## Theme system

10 themes built and working. Registered in `lib/theme.ts` (THEMES array) and `app/globals.css`.

**Platform themes:**
- Nova (`light`) — cobalt blue, coral — default
- Dusk (`dark`) — dark indigo, purple, warm rose

**Community themes:**
- Ember — accent `#E07550`
- Grove — accent `#4A8C5C`
- Rose — accent `#C46B8A`
- Ocean — accent `#0EA5E9`
- Obsidian — accent `#7C5CE8`
- Sand — accent `#C4A570`
- Midnight — accent `#4B5FD4`
- Gold — accent `#D4A820`

**How theme works:**
- `data-theme` on `<html>` drives all CSS variables
- Anti-flash script in `app/layout.tsx` sets it before first paint
- `suppressHydrationWarning` on `<html>` prevents React mismatch error
- `useTheme()` reads localStorage only — does NOT touch DOM on init
- `defaultCommunityTheme(channelName)` — deterministic hash, picks community theme from channel name

---

## Key files

| File | What it does |
|---|---|
| `app/page.tsx` | Home page |
| `app/youtube/page.tsx` | YouTube channels listing |
| `app/channel/[id]/page.tsx` | Channel page — community tab (sidebar + feed + input), videos tab |
| `app/components/Nav.tsx` | Nav bar — auth modal, theme toggle |
| `app/layout.tsx` | Root layout — anti-flash script |
| `app/globals.css` | All CSS variables and theme blocks |
| `lib/theme.ts` | THEMES array, useTheme(), defaultCommunityTheme() |
| `lib/channels.ts` | Supabase read/write for channels table |
| `lib/auth.ts` | Sign up, sign in, sign out, getCurrentUsername |
| `lib/supabase.ts` | Supabase client instance (exports `supabase`) |
| `app/api/channel-feed/route.ts` | YouTube RSS feed fetcher |
| `app/api/resolve-channel/route.ts` | Scrapes YouTube for channel metadata |
| `app/api/search/route.ts` | Full-text search via Postgres RPC functions |
| `supabase-migration.sql` | SQL to create community_posts table — run this in Supabase dashboard |

## Supabase database tables

| Table | Columns |
|---|---|
| `channels` | id, youtube_channel_id, name, description, thumbnail_url, youtube_url, added_by, created_at, category, subcategory, subscriber_count |
| `videos` | id, video_id, channel_id, title, description, thumbnail_url, published_at, youtube_url, created_at |
| `community_posts` | id, channel_id, author, type, title, body, created_at, updated_at — **table not yet created, run supabase-migration.sql** |
| `users` (auth) | Managed by Supabase Auth — username stored as display_name |

## Supabase RPC functions

- `search_channels_ranked(query text)` — searches channels
- `search_videos_ranked(query text)` — searches videos
