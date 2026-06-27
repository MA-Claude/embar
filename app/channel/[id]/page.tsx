"use client";
import { useState, useEffect } from "react";
import { getChannel, type Channel } from "@/lib/channels";
import Nav from "@/app/components/Nav";
import { defaultCommunityTheme } from "@/lib/theme";
import { getCurrentUsername } from "@/lib/auth";

type Video = {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
};

type Tab = "community" | "videos";

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
  const map: Record<string, string> = {
    film: "Film & Media", tech: "Tech & Science", education: "Education",
    ideas: "Ideas & Thinking", comedy: "Comedy & Entertainment", music: "Music",
    art: "Art & Design", gaming: "Gaming", lifestyle: "Lifestyle",
  };
  return map[id] ?? id;
}

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const [channelId, setChannelId] = useState("");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("community");
  const [viewMode, setViewMode] = useState<"light" | "dark" | "community">("community");
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setChannelId(p.id));
  }, [params]);

  // Apply theme to the whole page (html element) when viewMode or channel changes
  useEffect(() => {
    if (!channel) return;
    const ct = defaultCommunityTheme(channel.name);
    const target = viewMode === "community" ? ct.id : viewMode;
    document.documentElement.setAttribute("data-theme", target);
  }, [viewMode, channel]);

  // When leaving the channel page, restore the user's saved global theme
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

      // If the user has a saved theme preference for this channel, use it.
      // Otherwise default to the community theme.
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "community", label: "Community" },
    { id: "videos",    label: `Videos${videos.length ? ` (${videos.length})` : ""}` },
  ];

  const communityThemeObj = channel ? defaultCommunityTheme(channel.name) : null;

  function changeViewMode(mode: "light" | "dark" | "community") {
    setViewMode(mode);
    // Remember the user's choice for this channel — logged in or not
    if (channel) {
      localStorage.setItem(`embar-channel-theme-${channel.youtube_channel_id}`, mode);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Nav
        activePage="youtube"
        communityTheme={communityThemeObj ?? undefined}
        viewMode={viewMode}
        onViewModeChange={changeViewMode}
      />

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
          padding: "24px",
          marginBottom: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            {channel?.thumbnail_url ? (
              <img
                src={channel.thumbnail_url}
                alt={channel?.name}
                style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,.1)" }}
              />
            ) : (
              <div style={{
                width: 76, height: 76, borderRadius: "50%", flexShrink: 0,
                background: "var(--blue)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700,
              }}>{channel?.name[0].toUpperCase()}</div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", margin: 0 }}>
                  {channel?.name}
                </h1>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  background: "rgba(26,79,212,.08)", color: "var(--blue)",
                  borderRadius: 99, textTransform: "uppercase" as const, letterSpacing: "0.06em",
                }}>▶ YouTube</span>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const, marginBottom: 10 }}>
                {channel?.subscriber_count && (
                  <span style={{ fontSize: 12, color: "var(--text-mid)", fontWeight: 500 }}>
                    {channel.subscriber_count}
                  </span>
                )}
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
                    Added by <strong>{channel.added_by}</strong> · {timeAgo(channel.created_at)}
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

          {/* TAB BAR */}
          <div style={{
            marginTop: 24,
            borderTop: "1px solid var(--border)", paddingTop: 16,
            display: "flex", gap: 2,
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                  padding: "7px 18px", borderRadius: 99, border: "none",
                  background: activeTab === tab.id ? "var(--blue)" : "none",
                  color: activeTab === tab.id ? "white" : "var(--text-muted)",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all .12s",
                }}
              >{tab.label}</button>
            ))}
          </div>
        </div>

        {/* ── COMMUNITY TAB ── */}
        {activeTab === "community" && (
          <div style={{ marginTop: 20 }}>

            {/* Coming soon — compact */}
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>💬</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3, letterSpacing: "-0.01em" }}>
                  Community features coming soon
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Live chat · Reviews · Discussions · Wiki — the full community space for {channel?.name} is on the way.
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {["💬", "★", "📝", "📖"].map(icon => (
                  <div key={icon} style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, opacity: 0.5,
                  }}>{icon}</div>
                ))}
              </div>
            </div>
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
                      href={`/video/${video.videoId}`}
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
                          el.style.boxShadow = "0 4px 20px rgba(26,79,212,.07)";
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
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(10,14,26,.35)",
                            opacity: 0, transition: "opacity .15s",
                          }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                          >
                            <div style={{
                              width: 44, height: 44, borderRadius: "50%",
                              background: "rgba(255,255,255,.9)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 16, paddingLeft: 3,
                            }}>▶</div>
                          </div>
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{
                            fontSize: 13, fontWeight: 500, color: "var(--text)",
                            lineHeight: 1.4, marginBottom: 6,
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                          }}>{video.title}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {timeAgo(video.published)}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--blue)", fontWeight: 500 }}>
                              Discuss on Embar →
                            </div>
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
