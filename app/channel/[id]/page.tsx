"use client";
import { useState, useEffect } from "react";
import { getChannel, type Channel } from "@/lib/channels";
import Nav from "@/app/components/Nav";
import { defaultCommunityTheme } from "@/lib/theme";
import { getCurrentUsername } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Video = {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
};

type CommPost = {
  id: string;
  channel_id: string;
  author: string;
  type: string;
  title: string | null;
  body: string;
  created_at: string;
};

type PageTab = "community" | "videos";
type CommFilter = "stream" | "spark" | "forum" | "read" | "wiki" | "gathering";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(Math.abs(diff) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

function categoryLabel(id: string) {
  const map: Record<string, string> = {
    film: "Film & Media", tech: "Tech & Science", education: "Education",
    ideas: "Ideas & Thinking", comedy: "Comedy & Entertainment", music: "Music",
    art: "Art & Design", gaming: "Gaming", lifestyle: "Lifestyle",
  };
  return map[id] ?? id;
}

const COMM_TABS: { id: CommFilter; label: string; desc: string }[] = [
  { id: "stream",   label: "Stream",    desc: "Everything flowing together" },
  { id: "spark",    label: "Sparks",    desc: "Quick takes and reactions" },
  { id: "forum",    label: "Forums",    desc: "Questions worth keeping" },
  { id: "read",     label: "Reads",     desc: "Long-form writing" },
  { id: "wiki",     label: "Wiki",      desc: "Collective knowledge" },
  { id: "gathering",label: "Gatherings",desc: "Events and watch parties" },
];

const EMPTY_STATES: Record<CommFilter, { headline: string; body: string; icon: string }> = {
  stream: {
    icon: "✦",
    headline: "Nothing here yet",
    body: "Be the first to share a Spark — a quick take, a reaction, a thought. Start the conversation.",
  },
  spark: {
    icon: "✦",
    headline: "No Sparks yet",
    body: "Sparks are short, warm, quick. A reaction to a video. A thought about the channel. Something you wanted to say.",
  },
  forum: {
    icon: "◉",
    headline: "No forums yet",
    body: "Forums are for the questions worth keeping — the ones someone will still be searching for in two years.",
  },
  read: {
    icon: "◈",
    headline: "No Reads yet",
    body: "Long-form writing about things that matter. Essays, deep dives, retrospectives. No character limit, no rushing.",
  },
  wiki: {
    icon: "⌘",
    headline: "Wiki not started yet",
    body: "The collective memory — everything the community knows about this channel, organised and findable.",
  },
  gathering: {
    icon: "◎",
    headline: "No Gatherings yet",
    body: "Watch parties, video release moments, countdowns. Things to look forward to, together.",
  },
};

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const [channelId, setChannelId] = useState("");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Page-level tabs: Community | Videos
  const [activeTab, setActiveTab] = useState<PageTab>("community");

  // Community section filter
  const [commFilter, setCommFilter] = useState<CommFilter>("stream");

  // Theme
  const [viewMode, setViewMode] = useState<"light" | "dark" | "community">("community");
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Spark posts (loaded from DB)
  const [posts, setPosts] = useState<CommPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // New Spark modal
  const [sparkOpen, setSparkOpen] = useState(false);
  const [sparkBody, setSparkBody] = useState("");
  const [sparkPosting, setSparkPosting] = useState(false);
  const [sparkError, setSparkError] = useState("");

  useEffect(() => {
    params.then(p => setChannelId(p.id));
  }, [params]);

  // Apply community theme to <html>
  useEffect(() => {
    if (!channel) return;
    const ct = defaultCommunityTheme(channel.name);
    const target = viewMode === "community" ? ct.id : viewMode;
    document.documentElement.setAttribute("data-theme", target);
  }, [viewMode, channel]);

  // Restore global theme on unmount
  useEffect(() => {
    return () => {
      const saved = localStorage.getItem("embar-theme") || "light";
      document.documentElement.setAttribute("data-theme", saved);
    };
  }, []);

  useEffect(() => {
    if (!channelId) return;

    getCurrentUsername().then(setCurrentUser);

    getChannel(channelId).then(ch => {
      if (!ch) { setNotFound(true); setLoading(false); return; }
      setChannel(ch);
      setLoading(false);

      const preset = defaultCommunityTheme(ch.name);
      localStorage.setItem(`embar-channel-preset-${channelId}`, preset.id);

      const saved = localStorage.getItem(`embar-channel-theme-${channelId}`);
      if (saved === "light" || saved === "dark" || saved === "community") {
        setViewMode(saved);
      }
    });

    fetch(`/api/channel-feed?channelId=${channelId}`)
      .then(r => r.json())
      .then(data => { setVideos(data.videos ?? []); setVideosLoading(false); })
      .catch(() => setVideosLoading(false));
  }, [channelId]);

  // Load community posts whenever channelId is ready
  useEffect(() => {
    if (!channelId) return;
    setPostsLoading(true);
    supabase
      .from("community_posts")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setPostsLoading(false);
      });
  }, [channelId]);

  async function postSpark() {
    if (!sparkBody.trim() || !currentUser || !channelId) return;
    setSparkPosting(true);
    setSparkError("");
    const { error } = await supabase.from("community_posts").insert({
      channel_id: channelId,
      author: currentUser,
      type: "spark",
      body: sparkBody.trim(),
    });
    if (error) {
      setSparkError("Something went wrong. Try again.");
      setSparkPosting(false);
      return;
    }
    // Reload posts
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
    setSparkBody("");
    setSparkOpen(false);
    setSparkPosting(false);
    setCommFilter("stream");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading channel...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>▶</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Channel not found</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>This channel hasn&apos;t been added to Embar yet.</div>
        <a href="/youtube" style={{ color: "var(--blue)", fontSize: 13, textDecoration: "none", marginTop: 4 }}>← Browse all channels</a>
      </div>
    );
  }

  const communityThemeObj = channel ? defaultCommunityTheme(channel.name) : null;
  const accent = communityThemeObj?.accent ?? "var(--blue)";

  function changeViewMode(mode: "light" | "dark" | "community") {
    setViewMode(mode);
    if (channel) {
      localStorage.setItem(`embar-channel-theme-${channel.youtube_channel_id}`, mode);
    }
  }

  // Filter posts for current tab
  const visiblePosts = commFilter === "stream"
    ? posts
    : posts.filter(p => p.type === commFilter);

  const es = EMPTY_STATES[commFilter];
  const canSpark = commFilter === "stream" || commFilter === "spark";

  const PAGE_TABS: { id: PageTab; label: string }[] = [
    { id: "community", label: "Community" },
    { id: "videos",    label: `Videos${videos.length ? ` (${videos.length})` : ""}` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Nav
        activePage="youtube"
        communityTheme={communityThemeObj ?? undefined}
        viewMode={viewMode}
        onViewModeChange={changeViewMode}
      />

      {/* New Spark modal */}
      {sparkOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setSparkOpen(false); setSparkBody(""); setSparkError(""); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,14,26,.5)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <div style={{
            background: "var(--surface)", borderRadius: 20,
            padding: "28px", maxWidth: 480, width: "92%",
            boxShadow: "0 20px 60px rgba(10,14,26,.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  New Spark
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  A quick take. A reaction. Something you wanted to say.
                </div>
              </div>
              <button
                onClick={() => { setSparkOpen(false); setSparkBody(""); setSparkError(""); }}
                style={{ background: "none", border: "none", fontSize: 18, color: "var(--text-muted)", cursor: "pointer", lineHeight: 1 }}
              >✕</button>
            </div>

            {!currentUser && (
              <div style={{
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "12px 14px", marginBottom: 14,
                fontSize: 13, color: "var(--text-muted)",
              }}>
                You need to be signed in to post. Sign in from the top bar.
              </div>
            )}

            <textarea
              placeholder={`What's on your mind about ${channel?.name}?`}
              value={sparkBody}
              onChange={e => setSparkBody(e.target.value.slice(0, 500))}
              disabled={!currentUser}
              rows={5}
              style={{
                width: "100%", padding: "12px 14px",
                border: "1px solid var(--border)", borderRadius: 12,
                background: "var(--bg)", color: "var(--text)",
                fontSize: 14, fontFamily: "inherit", outline: "none",
                resize: "none", boxSizing: "border-box" as const,
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {sparkBody.length}/500
              </div>
              {sparkError && (
                <div style={{ fontSize: 12, color: "#E85C3A" }}>{sparkError}</div>
              )}
              <button
                onClick={postSpark}
                disabled={!sparkBody.trim() || !currentUser || sparkPosting}
                style={{
                  background: sparkBody.trim() && currentUser ? accent : "var(--surface2)",
                  color: sparkBody.trim() && currentUser ? "white" : "var(--text-muted)",
                  border: "none", borderRadius: 99,
                  padding: "8px 22px", fontSize: 13, fontWeight: 600,
                  cursor: sparkBody.trim() && currentUser ? "pointer" : "default",
                  fontFamily: "inherit", transition: "all .12s",
                }}
              >
                {sparkPosting ? "Posting..." : "Post Spark"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 100px" }}>

        {/* BREADCRUMB */}
        <div style={{ marginBottom: 20 }}>
          <a href="/youtube" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
            ← YouTube channels
          </a>
        </div>

        {/* CHANNEL HEADER */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 0,
        }}>
          {/* Community colour strip */}
          <div style={{ height: 5, background: accent }} />

          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
              {channel?.thumbnail_url ? (
                <img
                  src={channel.thumbnail_url}
                  alt={channel?.name}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,.1)" }}
                />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                  background: accent, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 700,
                }}>{channel?.name[0].toUpperCase()}</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 21, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", margin: 0 }}>
                    {channel?.name}
                  </h1>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px",
                    background: "rgba(26,79,212,.08)", color: "var(--blue)",
                    borderRadius: 99, textTransform: "uppercase" as const, letterSpacing: "0.06em",
                  }}>▶ YouTube</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    — members
                  </span>
                  {channel?.category && (
                    <span style={{
                      fontSize: 11, padding: "2px 9px",
                      background: "var(--surface2)", color: "var(--text-muted)",
                      borderRadius: 99,
                    }}>{categoryLabel(channel.category)}</span>
                  )}
                  {channel?.subcategory && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{channel.subcategory}</span>
                  )}
                  {channel?.added_by && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Added by <strong>{channel.added_by}</strong>
                    </span>
                  )}
                </div>

                {channel?.description && (
                  <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.65, margin: "0 0 14px" }}>
                    {channel.description}
                  </p>
                )}

                <a
                  href={channel?.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 12, color: "var(--text-muted)", textDecoration: "none",
                    border: "1px solid var(--border)", borderRadius: 99,
                    padding: "5px 14px",
                  }}
                >
                  <span style={{ fontSize: 10 }}>▶</span> View on YouTube
                </a>
              </div>
            </div>

            {/* PAGE TAB BAR: Community | Videos */}
            <div style={{
              marginTop: 24,
              borderTop: "1px solid var(--border)", paddingTop: 16,
              display: "flex", gap: 2,
            }}>
              {PAGE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                    padding: "7px 18px", borderRadius: 99, border: "none",
                    background: activeTab === tab.id ? accent : "none",
                    color: activeTab === tab.id ? "white" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all .12s",
                  }}
                >{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── COMMUNITY TAB ── */}
        {activeTab === "community" && (
          <div style={{ marginTop: 20 }}>

            {/* Community filter bar + New Spark button */}
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 16,
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 14px 0",
                borderBottom: "1px solid var(--border)",
              }}>
                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 0, overflowX: "auto" as const }}>
                  {COMM_TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setCommFilter(t.id)}
                      style={{
                        fontSize: 13, fontWeight: commFilter === t.id ? 600 : 400,
                        padding: "11px 14px 10px",
                        border: "none", background: "none",
                        color: commFilter === t.id ? "var(--text)" : "var(--text-muted)",
                        cursor: "pointer", fontFamily: "inherit",
                        borderBottom: `2px solid ${commFilter === t.id ? accent : "transparent"}`,
                        whiteSpace: "nowrap" as const,
                        transition: "color .12s, border-color .12s",
                      }}
                    >{t.label}</button>
                  ))}
                </div>

                {/* New Spark button — only shown on relevant tabs */}
                {canSpark && (
                  <button
                    onClick={() => setSparkOpen(true)}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      padding: "6px 16px",
                      background: accent, color: "white",
                      border: "none", borderRadius: 99,
                      cursor: "pointer", fontFamily: "inherit",
                      flexShrink: 0, marginLeft: 12,
                      transition: "opacity .12s",
                    }}
                  >+ Spark</button>
                )}
              </div>

              {/* Feed area */}
              <div style={{ padding: "16px" }}>
                {postsLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: "var(--text-muted)" }}>
                    Loading...
                  </div>
                ) : visiblePosts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {visiblePosts.map(post => (
                      post.type === "spark" ? (
                        <SparkCard key={post.id} post={post} accent={accent} />
                      ) : null
                    ))}
                  </div>
                ) : (
                  /* Empty state */
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "48px 24px", textAlign: "center",
                    gap: 10,
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      border: `1.5px solid ${accent}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, color: accent, marginBottom: 4,
                    }}>{es.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                      {es.headline}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 340 }}>
                      {es.body}
                    </div>
                    {canSpark && (
                      <button
                        onClick={() => setSparkOpen(true)}
                        style={{
                          marginTop: 8, fontSize: 13, fontWeight: 600,
                          padding: "9px 24px", background: accent, color: "white",
                          border: "none", borderRadius: 99, cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >Start with a Spark</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Videos section inside Community tab */}
            {(commFilter === "stream") && videos.length > 0 && (
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "13px 16px 10px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
                  textTransform: "uppercase" as const, letterSpacing: "0.07em",
                }}>
                  Videos
                </div>
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {videos.slice(0, 5).map(video => (
                    <a
                      key={video.videoId}
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{
                        display: "flex", gap: 12, alignItems: "center",
                        padding: "8px 10px", borderRadius: 10,
                        transition: "background .12s",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          style={{ width: 80, height: 45, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 500, color: "var(--text)",
                            lineHeight: 1.4, marginBottom: 3,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{video.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(video.published)}</div>
                        </div>
                        <div style={{ fontSize: 11, color: accent, fontWeight: 500, flexShrink: 0 }}>
                          {posts.filter(p => p.type === "spark").length > 0
                            ? `${posts.filter(p => p.type === "spark").length} echo${posts.filter(p => p.type === "spark").length === 1 ? "" : "es"}`
                            : "Watch →"}
                        </div>
                      </div>
                    </a>
                  ))}
                  {videos.length > 5 && (
                    <button
                      onClick={() => setActiveTab("videos")}
                      style={{
                        fontSize: 12, color: "var(--text-muted)", background: "none",
                        border: "none", cursor: "pointer", fontFamily: "inherit",
                        padding: "8px 10px", textAlign: "left" as const,
                      }}
                    >
                      + {videos.length - 5} more videos →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VIDEOS TAB ── */}
        {activeTab === "videos" && (
          <div style={{ marginTop: 20 }}>
            {videosLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 13 }}>
                Loading videos...
              </div>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 13 }}>
                No videos found — the channel may have restricted their feed.
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
                  {videos.length} most recent videos · updates automatically
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {videos.map(video => (
                    <a
                      key={video.videoId}
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "border-color .12s, box-shadow .12s, transform .12s",
                      }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = "var(--border-strong)";
                          el.style.boxShadow = `0 4px 20px ${accent}18`;
                          el.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = "var(--border)";
                          el.style.boxShadow = "none";
                          el.style.transform = "none";
                        }}
                      >
                        <div style={{ position: "relative", paddingBottom: "56.25%", background: "var(--surface2)" }}>
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{
                            fontSize: 13, fontWeight: 500, color: "var(--text)",
                            lineHeight: 1.4, marginBottom: 6,
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                          }}>{video.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {timeAgo(video.published)}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Spark card component ──────────────────────────────────────────────────────
function SparkCard({ post, accent }: { post: CommPost; accent: string }) {
  function timeAgoLocal(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(Math.abs(diff) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  const initials = post.author.slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${accent}`,
      borderRadius: "0 10px 10px 0",
      padding: "12px 14px",
    }}>
      <div style={{
        fontSize: 9, fontWeight: 600, letterSpacing: "0.07em",
        textTransform: "uppercase" as const, color: accent,
        marginBottom: 6,
      }}>Spark</div>
      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.55, marginBottom: 10 }}>
        {post.body}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: accent, color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 8, fontWeight: 700, flexShrink: 0,
        }}>{initials}</div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{post.author}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{timeAgoLocal(post.created_at)}</span>
      </div>
    </div>
  );
}
