# Embar — Project Memory

This file is read by Claude Code at the start of every session. It contains everything needed to continue building Embar without re-explaining context.

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
