"use client";
import { useState, useEffect } from "react";
import { getChannels, addChannel, type Channel } from "@/lib/channels";
import { getCurrentUsername } from "@/lib/auth";
import { defaultCommunityTheme } from "@/lib/theme";
import Nav from "@/app/components/Nav";

// ─── Categories ────────────────────────────────────────────────────────────────
// To add a new category: add an entry here AND update embar-site-structure.md
const CATEGORIES: { id: string; label: string; subs: string[] }[] = [
  { id: "film",      label: "Film & Media",           subs: ["Film essays", "Reviews & critique", "Cinema history", "Animation", "Documentary"] },
  { id: "tech",      label: "Tech & Science",          subs: ["Programming", "AI & machine learning", "Space & astronomy", "Biology & nature", "Physics & maths", "Engineering"] },
  { id: "education", label: "Education",               subs: ["History", "Philosophy", "Psychology", "Economics", "Language & linguistics"] },
  { id: "ideas",     label: "Ideas & Thinking",        subs: ["Long-form essays", "Debates & discussion", "Futurism", "Politics & society"] },
  { id: "comedy",    label: "Comedy & Entertainment",  subs: ["Sketch comedy", "Satire", "Reaction", "Storytelling"] },
  { id: "music",     label: "Music",                   subs: ["Music theory", "Covers & originals", "Music history", "Beatmaking"] },
  { id: "art",       label: "Art & Design",            subs: ["Illustration", "Architecture", "Graphic design", "Photography"] },
  { id: "gaming",    label: "Gaming",                  subs: ["Reviews", "Speedrunning", "Game essays", "Indie games"] },
  { id: "lifestyle", label: "Lifestyle",               subs: ["Food", "Travel", "Fitness", "Finance & money"] },
];

const SORT_MODES = [
  { id: "recent",    label: "Recently added" },
  { id: "alpha",     label: "A–Z" },
  { id: "discussed", label: "Most discussed" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(Math.abs(diff) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

function categoryLabel(id: string) {
  return CATEGORIES.find(c => c.id === id)?.label ?? id;
}

// ─── Avatar colours (deterministic from channel name) ─────────────────────────
const AVATAR_COLOURS = ["#1A4FD4", "#8B3DBF", "#C03A2B", "#1A7A4A", "#B85C00", "#2B7A9E"];
function avatarColour(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLOURS[n % AVATAR_COLOURS.length];
}

// ─── Channel card ─────────────────────────────────────────────────────────────
function ChannelCard({ ch, featured }: { ch: Channel; featured?: boolean }) {
  const [hovered, setHovered] = useState(false);

  const catLabel = ch.category ? categoryLabel(ch.category) : null;
  const thumb = ch.thumbnail_url;
  const initials = ch.name.slice(0, 2).toUpperCase();
  const colour = avatarColour(ch.name);
  const communityTheme = defaultCommunityTheme(ch.name);
  const accentColor = communityTheme.accent;

  return (
    <a
      href={`/channel/${ch.youtube_channel_id}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: "var(--surface)",
        border: `1px solid ${hovered ? "var(--border-strong)" : "var(--border)"}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color .15s, box-shadow .15s, transform .15s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? `0 8px 28px ${accentColor}22` : "none",
        height: "100%",
        boxSizing: "border-box" as const,
        display: "flex",
        flexDirection: "column" as const,
      }}>
        {/* Community colour strip */}
        <div style={{
          height: 4,
          background: accentColor,
          opacity: hovered ? 1 : 0.7,
          transition: "opacity .15s",
        }} />
        <div style={{ padding: featured ? "18px 22px 22px" : "14px 18px 18px", display: "flex", flexDirection: "column" as const, flex: 1 }}>
        {/* Top row: avatar + name + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 12 }}>
          {thumb ? (
            <img
              src={thumb}
              alt={ch.name}
              style={{
                width: featured ? 60 : 48,
                height: featured ? 60 : 48,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,.1)",
              }}
            />
          ) : (
            <div style={{
              width: featured ? 60 : 48,
              height: featured ? 60 : 48,
              borderRadius: "50%",
              flexShrink: 0,
              background: colour,
              color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: featured ? 20 : 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}>{initials}</div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: featured ? 16 : 14,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: 3,
            }}>{ch.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
              <span style={{
                fontSize: 10, fontWeight: 600,
                padding: "2px 7px",
                background: "rgba(26,79,212,.08)",
                color: "var(--blue)",
                borderRadius: 99,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}>▶ YouTube</span>
              {catLabel && (
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  padding: "2px 7px",
                  background: "var(--surface2)",
                  color: "var(--text-muted)",
                  borderRadius: 99,
                  letterSpacing: "0.01em",
                }}>{catLabel}</span>
              )}
            </div>
          </div>
        </div>

        {/* Description — always shown on featured, shown on hover for others */}
        <div style={{
          fontSize: 12,
          color: "var(--text-mid)",
          lineHeight: 1.6,
          marginBottom: 10,
          overflow: "hidden",
          maxHeight: (featured || hovered) && ch.description ? "200px" : "0px",
          opacity: (featured || hovered) && ch.description ? 1 : 0,
          transition: "max-height .2s ease, opacity .18s ease",
        }}>
          {ch.description}
        </div>

        {/* Subcategory tag */}
        {ch.subcategory && (hovered || featured) && (
          <div style={{
            fontSize: 10, color: "var(--text-muted)",
            marginBottom: 8,
            opacity: hovered || featured ? 1 : 0,
            transition: "opacity .18s",
          }}>
            {ch.subcategory}
          </div>
        )}

        {/* Stats row — appears on hover */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
          overflow: "hidden",
          maxHeight: hovered ? "60px" : "0px",
          opacity: hovered ? 1 : 0,
          transition: "max-height .2s ease, opacity .18s ease",
          marginBottom: hovered ? 10 : 0,
        }}>
          {[
            { value: "—", label: "Members" },
            { value: "—", label: "Posts" },
            { value: ch.subscriber_count
                ? ch.subscriber_count.replace(/\s*subscribers?/i, "")
                : "—",
              label: ch.subscriber_count ? "YouTube subs" : "Subs" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "var(--surface2)",
              borderRadius: 8, padding: "7px 8px",
              textAlign: "center" as const,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Added {timeAgo(ch.created_at)}
            {ch.added_by && <span style={{ marginLeft: 4, opacity: 0.7 }}>by {ch.added_by}</span>}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: accentColor,
            opacity: hovered ? 1 : 0,
            transition: "opacity .15s",
          }}>
            Explore →
          </div>
        </div>
        </div>{/* end inner padding wrapper */}
      </div>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type VideoResult = {
  video_id: string; title: string; description: string;
  thumbnail_url: string; published_at: string;
  channel_id: string; channel_name: string; channel_thumbnail: string;
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Channel[] | null>(null);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortMode, setSortMode] = useState("recent");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add channel modal
  const [modalOpen, setModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [resolved, setResolved] = useState<{ channelId: string; name: string; thumbnail: string } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [catInput, setCatInput] = useState("");
  const [subInput, setSubInput] = useState("");
  const [subCountResolved, setSubCountResolved] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getCurrentUsername().then(setCurrentUser);
    getChannels().then(ch => { setChannels(ch); setLoading(false); });
  }, []);

  // Full-text search via API — fires 350ms after the user stops typing
  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults(null);
      setVideoResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(search.trim())}`);
      const data = await res.json();
      setSearchResults(data.channels ?? []);
      setVideoResults(data.videos ?? []);
      setSearchLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Use ranked search results when searching, otherwise use the full channel list
  const base = searchResults !== null ? searchResults : channels;

  // Filter + sort
  const filtered = base
    .filter(ch => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        ch.name.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q) ||
        (ch.category && categoryLabel(ch.category).toLowerCase().includes(q)) ||
        (ch.subcategory && ch.subcategory.toLowerCase().includes(q));
      const matchesCategory = activeCategory === "all" || ch.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // When searching, keep the relevance order the API returned
      if (searchResults !== null) return 0;
      if (sortMode === "alpha") return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  async function handleResolve() {
    if (!urlInput.trim()) return;
    setResolving(true);
    setResolveError("");
    setResolved(null);
    const res = await fetch(`/api/resolve-channel?url=${encodeURIComponent(urlInput.trim())}`);
    const data = await res.json();
    if (data.error) {
      setResolveError(data.error);
    } else {
      setResolved(data);
      setNameInput(data.name || "");
      setSubCountResolved(data.subscriberCount || "");
    }
    setResolving(false);
  }

  async function handleSubmit() {
    if (!resolved || !nameInput.trim() || !currentUser) return;
    setSubmitting(true);
    setSubmitError("");
    const { error } = await addChannel({
      youtube_channel_id: resolved.channelId,
      name: nameInput.trim(),
      description: descInput.trim(),
      thumbnail_url: resolved.thumbnail,
      youtube_url: urlInput.trim(),
      added_by: currentUser,
      category: catInput,
      subcategory: subInput,
      subscriber_count: subCountResolved,
    });
    if (error) { setSubmitError(error); setSubmitting(false); return; }
    const updated = await getChannels();
    setChannels(updated);
    closeModal();
  }

  function closeModal() {
    setModalOpen(false);
    setUrlInput("");
    setResolved(null);
    setResolveError("");
    setNameInput("");
    setDescInput("");
    setCatInput("");
    setSubInput("");
    setSubCountResolved("");
    setSubmitError("");
    setSubmitting(false);
  }

  const selectedCat = CATEGORIES.find(c => c.id === catInput);
  const hasActiveFilters = activeCategory !== "all" || search;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      <Nav activePage="youtube" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 100px" }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #0C1620 0%, #0F2235 60%, #162840 100%)",
          borderRadius: 20,
          padding: "28px 28px 26px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* decorative background glyph */}
          <div style={{
            position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
            fontSize: 100, opacity: 0.05, pointerEvents: "none", userSelect: "none",
          }}>▶</div>

          <div style={{ fontSize: 10, fontWeight: 600, color: "#5090D0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
            Content
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "white", letterSpacing: "-0.035em", marginBottom: 6 }}>
            YouTube channels
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.55, marginBottom: 20, maxWidth: 500 }}>
            Every channel here was added by the Embar community. No algorithms. No rankings. Recent videos update automatically.
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.11)",
              borderRadius: 99, padding: "8px 16px",
              flex: 1, maxWidth: 420, minWidth: 200,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search channels, topics, categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: "none", border: "none", outline: "none",
                  color: "white", fontSize: 13, fontFamily: "inherit", flex: 1,
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,.4)",
                  cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1,
                }}>✕</button>
              )}
            </div>
            {currentUser && (
              <button onClick={() => setModalOpen(true)} style={{
                background: "var(--blue)", color: "white", border: "none",
                borderRadius: 99, padding: "8px 20px",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                flexShrink: 0,
              }}>+ Add a channel</button>
            )}
          </div>
        </div>

        {/* ── CATEGORY BROWSER ── */}
        <div style={{ marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ display: "flex", gap: 7, minWidth: "max-content" }}>
            {/* All pill */}
            <button
              onClick={() => setActiveCategory("all")}
              style={{
                fontSize: 12, fontWeight: activeCategory === "all" ? 600 : 400,
                padding: "6px 14px",
                borderRadius: 99,
                border: "1px solid",
                borderColor: activeCategory === "all" ? "var(--blue)" : "var(--border)",
                background: activeCategory === "all" ? "var(--blue)" : "var(--surface)",
                color: activeCategory === "all" ? "white" : "var(--text-mid)",
                cursor: "pointer", fontFamily: "inherit",
                transition: "all .12s",
                whiteSpace: "nowrap" as const,
              }}
            >All channels</button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)}
                style={{
                  fontSize: 12, fontWeight: activeCategory === cat.id ? 600 : 400,
                  padding: "6px 14px",
                  borderRadius: 99,
                  border: "1px solid",
                  borderColor: activeCategory === cat.id ? "var(--blue)" : "var(--border)",
                  background: activeCategory === cat.id ? "var(--blue)" : "var(--surface)",
                  color: activeCategory === cat.id ? "white" : "var(--text-mid)",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all .12s",
                  whiteSpace: "nowrap" as const,
                }}
              >{cat.label}</button>
            ))}
          </div>
        </div>

        {/* ── SORT + RESULTS COUNT ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20, flexWrap: "wrap" as const, gap: 10,
        }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {loading || searchLoading ? (
              searchLoading ? "Searching..." : "Loading..."
            ) : (
              <>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{filtered.length}</span>
                {" channel"}{filtered.length !== 1 ? "s" : ""}
                {search.trim().length >= 2
                  ? " matching your search"
                  : hasActiveFilters
                    ? " matching your filters"
                    : ""}
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {SORT_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setSortMode(mode.id)}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 99,
                  border: "1px solid",
                  borderColor: sortMode === mode.id ? "var(--border-strong)" : "transparent",
                  background: sortMode === mode.id ? "var(--surface)" : "none",
                  color: sortMode === mode.id ? "var(--text)" : "var(--text-muted)",
                  fontWeight: sortMode === mode.id ? 500 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all .12s",
                }}
              >{mode.label}</button>
            ))}
          </div>
        </div>

        {/* ── CHANNEL GRID ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontSize: 14 }}>
            Loading channels...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>▶</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
              {search || activeCategory !== "all" ? "No channels match" : "No channels yet"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22 }}>
              {search || activeCategory !== "all"
                ? "Try a different search or category"
                : currentUser
                  ? "Be the first to add a YouTube channel to Embar"
                  : "Sign in to add the first channel"}
            </div>
            {hasActiveFilters && (
              <button onClick={() => { setSearch(""); setActiveCategory("all"); }} style={{
                fontSize: 13, color: "var(--blue)", background: "none", border: "none",
                cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
              }}>Clear filters</button>
            )}
            {currentUser && !search && activeCategory === "all" && (
              <button onClick={() => setModalOpen(true)} style={{
                background: "var(--blue)", color: "white", border: "none",
                borderRadius: 99, padding: "10px 24px",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>+ Add a channel</button>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: filtered.length === 1
              ? "1fr"
              : filtered.length === 2
                ? "1fr 1fr"
                : "repeat(3, 1fr)",
            gap: 14,
          }}>
            {filtered.map((ch, i) => {
              // First card gets the featured (wider) treatment when there are 4+ channels
              const isFeatured = i === 0 && filtered.length >= 4;
              return (
                <div
                  key={ch.id}
                  style={isFeatured ? { gridColumn: "span 2" } : undefined}
                >
                  <ChannelCard ch={ch} featured={isFeatured} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── VIDEO RESULTS (only when searching) ── */}
        {search.trim().length >= 2 && !searchLoading && videoResults.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "var(--text)",
              letterSpacing: "-0.01em", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Videos matching &ldquo;{search}&rdquo;
              <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>
                {videoResults.length} result{videoResults.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {videoResults.map(v => (
                <a key={v.video_id} href={`/video/${v.video_id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 12, overflow: "hidden",
                    transition: "border-color .12s, transform .12s, box-shadow .12s",
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = "var(--border-strong)";
                      el.style.transform = "translateY(-2px)";
                      el.style.boxShadow = "0 4px 16px rgba(26,79,212,.07)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = "var(--border)";
                      el.style.transform = "none";
                      el.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ position: "relative", paddingBottom: "56.25%", background: "var(--surface2)" }}>
                      <img
                        src={v.thumbnail_url || `https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`}
                        alt={v.title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: "11px 13px" }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500, color: "var(--text)",
                        lineHeight: 1.4, marginBottom: 5,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                      }}>{v.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {v.channel_thumbnail && (
                          <img src={v.channel_thumbnail} alt={v.channel_name}
                            style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                        )}
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.channel_name}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>{/* end content wrapper */}

      {/* ── ADD CHANNEL MODAL ── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,14,26,.55)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(5px)",
          }}
        >
          <div style={{
            background: "var(--surface)", borderRadius: 20,
            padding: "28px", maxWidth: 500, width: "94%",
            boxShadow: "0 20px 60px rgba(10,14,26,.25)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em" }}>
                Add a YouTube channel
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 18, color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22, lineHeight: 1.6 }}>
              Paste any YouTube channel link — we&apos;ll fill in the name and thumbnail automatically.
            </div>

            {/* URL input */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 5 }}>
                YouTube channel URL
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="url"
                  placeholder="Paste YouTube channel URL here..."
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setResolved(null); setResolveError(""); }}
                  onKeyDown={e => { if (e.key === "Enter") handleResolve(); }}
                  style={{
                    flex: 1, padding: "10px 14px",
                    border: "1px solid var(--border)", borderRadius: 10,
                    background: "var(--bg)", color: "var(--text)",
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                  }}
                />
                <button
                  onClick={handleResolve}
                  disabled={resolving || !urlInput.trim()}
                  style={{
                    padding: "10px 16px",
                    background: resolving || !urlInput.trim() ? "var(--surface2)" : "var(--blue)",
                    color: resolving || !urlInput.trim() ? "var(--text-muted)" : "white",
                    border: "1px solid var(--border)", borderRadius: 10,
                    fontSize: 13, fontWeight: 500, cursor: resolving || !urlInput.trim() ? "default" : "pointer",
                    fontFamily: "inherit", flexShrink: 0,
                  }}
                >{resolving ? "..." : "Look up"}</button>
              </div>
              {resolveError && (
                <div style={{ fontSize: 12, color: "#C03020", marginTop: 6 }}>{resolveError}</div>
              )}
            </div>

            {/* After channel found */}
            {resolved && (
              <>
                {/* Found confirmation */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--surface2)", borderRadius: 10,
                  padding: "10px 12px", marginBottom: 16,
                }}>
                  {resolved.thumbnail ? (
                    <img src={resolved.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "var(--blue)", color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700,
                    }}>▶</div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Channel found ✓</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: {resolved.channelId}</div>
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 5 }}>
                    Channel name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px",
                      border: "1px solid var(--border)", borderRadius: 10,
                      background: "var(--bg)", color: "var(--text)",
                      fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 5 }}>
                    Description <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                  </label>
                  <textarea
                    value={descInput}
                    onChange={e => setDescInput(e.target.value)}
                    placeholder="What is this channel about? What makes it worth following?"
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 14px",
                      border: "1px solid var(--border)", borderRadius: 10,
                      background: "var(--bg)", color: "var(--text)",
                      fontSize: 13, fontFamily: "inherit", outline: "none",
                      resize: "none", boxSizing: "border-box" as const,
                    }}
                  />
                </div>

                {/* Category */}
                <div style={{ marginBottom: catInput ? 12 : 18 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 5 }}>
                    Category <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                  </label>
                  <select
                    value={catInput}
                    onChange={e => { setCatInput(e.target.value); setSubInput(""); }}
                    style={{
                      width: "100%", padding: "10px 14px",
                      border: "1px solid var(--border)", borderRadius: 10,
                      background: "var(--bg)", color: catInput ? "var(--text)" : "var(--text-muted)",
                      fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Choose a category...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory — only if a category is chosen */}
                {selectedCat && selectedCat.subs.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 8 }}>
                      Subcategory <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                      {selectedCat.subs.map(sub => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSubInput(subInput === sub ? "" : sub)}
                          style={{
                            fontSize: 11, padding: "5px 11px", borderRadius: 99,
                            border: "1px solid",
                            borderColor: subInput === sub ? "var(--blue)" : "var(--border)",
                            background: subInput === sub ? "rgba(26,79,212,.08)" : "var(--surface2)",
                            color: subInput === sub ? "var(--blue)" : "var(--text-muted)",
                            fontWeight: subInput === sub ? 600 : 400,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all .1s",
                          }}
                        >{sub}</button>
                      ))}
                    </div>
                  </div>
                )}

                {submitError && (
                  <div style={{
                    background: "#FFF0EE", border: "1px solid #F5C0B8",
                    borderRadius: 10, padding: "9px 13px",
                    fontSize: 13, color: "#C03020", marginBottom: 14,
                  }}>{submitError}</div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !nameInput.trim()}
                  style={{
                    width: "100%", padding: 12,
                    background: submitting || !nameInput.trim() ? "var(--surface2)" : "var(--blue)",
                    color: submitting || !nameInput.trim() ? "var(--text-muted)" : "white",
                    border: "none", borderRadius: 10,
                    fontSize: 14, fontWeight: 600,
                    cursor: submitting || !nameInput.trim() ? "default" : "pointer",
                    fontFamily: "inherit",
                  }}
                >{submitting ? "Adding channel..." : "Add to Embar"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
