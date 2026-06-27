# Embar — Project Memory

This file is read by Claude Code at the start of every session. It contains everything needed to continue building Embar without re-explaining context.

**Companion file:** `C:\Users\gabbe\Documents\Embar\embar-site-structure.md` — maps every page, feature, file, and database table on the site. Read this before making changes to understand where things live. Update it whenever new features are added.

---

## What Embar is

A community platform for people who love content — YouTube channels, videos, and eventually films and TV. The place where passionate communities gather, discuss, and discover. Warm, human, anti-algorithm. Champions small creators and niche communities.

Live URL: https://embar-tawny.vercel.app/
GitHub: https://github.com/MA-Claude/embar

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
| YouTube Data API | Channel and video data (Phase 1) |
| TMDB API | Films and TV data (Phase 2) |
| Resend | Emails and notifications (later) |
| Google AdSense | Ad monetisation (after launch) |
| browser-image-compression | Client-side image compression before upload |

---

## Phase 1 decisions (all finalised)

**Content scope:** YouTube channels and videos only. Films and TV in Phase 2.

**Community customisation:** Preset themes only (more than 6 — to be designed together). No profile picture or banner image uploads in Phase 1. Generated avatars from user initials + chosen colour instead.

**Onboarding:** Single screen, all three threads together (what you love watching / how you feeling / what world to explore). Options within each thread to be expansive — designed together before building.

**Post layout:** Post on left, replies on right. Hover enlarges card and shows preview with extra info (no click needed). Click opens a dedicated full post page. Design to be done together before building.

**Post card creativity:** Individual post cards (discussions, blogs, reviews) should eventually have unique visual designs chosen by the creator — different layouts, accent colours, textures. The feed should feel alive and slightly unpredictable, not a uniform grid of identical boxes. This is a Phase 1 enhancement to build once core features are stable.

**Images in posts/blogs/threads:** Users CAN upload images. Auto-compressed client-side using browser-image-compression before upload. Max 1920px wide, ~80% quality, 10MB hard cap. Result: ~150-400KB per image. Profile pictures and community banners deferred to Phase 2.

---

## Platform structure (three contexts)

**1. Content pages** (a YouTube channel or video)
Neutral ground. Aggregates reviews, discussions, and blog posts from everyone — individuals and communities alike. The universal meeting point.

**2. Communities**
Two parallel layers:
- Main chat — flowing, always-on conversation (Discord-like) with branches that spin off and can be pinned
- Content layer — structured reviews, discussions, and blog posts by members

Plus a sidebar for filtering by content type: All / Chat / Discussions / Blogs / Reviews / Pinned. Each filtered view supports keyword search.

**3. Individual profiles**
Users can write their own reviews, discussions, and blog posts independently. Other users can follow them. Their content appears on their profile and on relevant content pages.

---

## Community chat branches (categories)

When a branch spins off from the main community chat, it gets a category:
- New video release
- Live stream / watch-along
- Watch party
- Hot debate
- Deep dive
- Q&A
- Recommendations
- Creator news
- Collaboration announcement
- Fan contributions
- Weekly topic
- Off-topic
- Community challenge
- Milestone celebration

---

## User accounts — sign up approach

Sign up requires only a username and password. Email is completely optional.

**How it works technically:** Supabase requires an email internally, so we auto-generate a placeholder (username@embar.users) that the user never sees. To the user, they just have a username + password.

**Email is optional and added later** — for account recovery, or to connect external apps (YouTube, Reddit, Discord). When added, it replaces the placeholder in Supabase.

**Never ask for email during sign up.** Only surface it as an optional setting in their profile after they have an account.

---

## Wiki system (confirmed feature)

Every content page (YouTube channel, video, film, TV show) has a community wiki section alongside reviews, discussions, and blogs. Community members collaboratively write and maintain it.

**What a wiki page contains:**
- Creator/film background and history
- Content style and what to expect
- Notable videos/episodes/moments
- Community significance and history
- For YouTube: fills the gap that APIs don't cover

**Moderation safeguards:**
- Full edit history — nothing permanently deleted, everything reversible
- New users: edits go into review queue before going live
- Trusted members (earned over time): can edit and approve directly
- Flagging system: any member can flag a change, freezes that section pending review
- Community leaders have moderation powers on their community's pages

**Phase placement:** Basic wiki (community-editable description + info) in Phase 1 for YouTube channels. Full wiki system with edit history, review queues, and trusted member tiers in Phase 2.

---

## Social structure (three tiers)

This structure should be designed carefully before building. Do not rush into it.

---

### Individual
The foundation of everything. A single person with their own Embar account.

- Has their own profile page showing everything they've written — reviews, discussions, blogs
- Follows YouTube channels and communities they care about
- Can be followed by other users who enjoy their writing
- Their content appears on their profile AND on the relevant channel/community pages
- Completely independent — they don't need to be in a crew or community to participate
- Think of them like a writer or contributor who exists across the whole platform

---

### Crew
A small, tight-knit group — usually friends, a friend group, or a collective of people with overlapping tastes.

- Can be **private** (invite only, content visible only to members) or **public** (anyone can see and request to join)
- The key difference from a community: a crew is **not tied to one channel or topic** — a crew's interests span multiple communities. A crew of five friends might all love film essays, tech YouTube, AND horror, so they exist across all three communities together
- Crews give smaller groups a shared space without forcing everyone into the same giant public community
- A crew member is still also an individual — they keep their own profile and content
- Crews can have their own internal feed showing activity across all the communities they follow together
- The word "group" was deliberately avoided — "Crew" feels warmer and more personal

---

### Community
The main focus and heart of Embar. This is where the majority of activity lives.

- **One community per YouTube channel** (Phase 1). Not multiple communities per channel — each channel has exactly one community. The channel page and its community are the same place.
- In Phase 2: one community per film, TV show, or genre
- Communities are large and public — anyone can join and contribute
- Each community has: a main flowing chat (Discord-like with branches), a content layer (reviews, discussions, blogs by members), a wiki (community-maintained information about the channel), and a sidebar navigator
- Communities are built around shared passion for content — not around people. The content (the channel, the show) is the anchor
- Designed to feel like the natural home for fans of that channel — warm, organised, and alive

---

## Phase 1 build order

1. ✅ Project setup (Next.js + GitHub + Vercel)
2. ✅ CLAUDE.md project memory file
3. Supabase connection
4. User accounts and profiles
5. Content pages (YouTube channels and videos)
6. Communities (creation, themes, joining)
7. Individual reviews, discussions, blogs
8. Community content layer (reviews/discussions/blogs within communities)
9. Community main chat + branches
10. Community sidebar / content navigator
11. Global feed
12. Onboarding rabbit hole
13. Image uploads with compression (posts/blogs/threads)
14. Basic search

---

## What Phase 1 does NOT include

- Films or TV (Phase 2)
- Profile picture uploads (Phase 2)
- Community banner image uploads (Phase 2)
- Rating system for films/TV (Phase 2)
- Google AdSense (after launch, once content and traffic exist)
- Creator claim and verification (Phase 3)
- Full-text community search (Phase 3)

---

## Supabase project

URL: https://wntaftiaptuzwzcekfhq.supabase.co
Region: West Europe (London)

---

## Theme system

Six founding themes at minimum — more to be designed together:
- Nova (light, cobalt blue, coral) — default
- Dusk (dark indigo, purple, warm rose)
- Ember (deep brown-black, coral, amber)
- Grove (forest green, cream, terracotta)
- Rose (deep rose-black, pink, blush)
- Ocean (deep blue-black, electric blue, cyan)

Community members get generated avatars (initials + colour) not uploaded photos in Phase 1.

---

## Cost overview

All costs fall on the Embar owner, not users.
- Supabase: free up to 500MB database, 1GB storage. ~$0.021/GB after.
- Vercel: free personal tier — covers everything at this stage
- YouTube Data API: free, 10,000 requests/day. Caching means this goes very far.
- Running cost at launch: ~$0/month
