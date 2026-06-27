"use client";
import { useState, useEffect } from "react";
import { getChannel, type Channel } from "@/lib/channels";
import Nav from "@/app/components/Nav";

type Video = {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const [channelId, setChannelId] = useState<string>("");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    params.then(p => setChannelId(p.id));
  }, [params]);

  useEffect(() => {
    if (!channelId) return;

    getChannel(channelId).then(ch => {
      if (!ch) { setNotFound(true); setLoading(false); return; }
      setChannel(ch);
      setLoading(false);
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      <Nav activePage="youtube" />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 24px 80px" }}>

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
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-start",
          gap: 20,
        }}>
          {channel?.thumbnail_url ? (
            <img
              src={channel.thumbnail_url}
              alt={channel?.name}
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              background: "var(--accent)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700,
            }}>{channel?.name[0].toUpperCase()}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", margin: 0 }}>
                {channel?.name}
              </h1>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px",
                background: "var(--accent-light)", color: "var(--blue)",
                borderRadius: "var(--radius-full)", textTransform: "uppercase", letterSpacing: "0.05em",
              }}>▶ YouTube</span>
            </div>
            {channel?.description && (
              <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.6, margin: "0 0 14px" }}>
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
                border: "1px solid var(--border)", borderRadius: "var(--radius-full)",
                padding: "5px 12px", transition: "border-color .12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <span style={{ fontSize: 10 }}>▶</span> View on YouTube
            </a>
          </div>
        </div>

        {/* RECENT VIDEOS */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 16 }}>
            Recent videos
          </div>

          {videosLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
              No videos found — the channel may have restricted their feed.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {videos.map(video => (
                <a
                  key={video.videoId}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
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
                        opacity: 0, transition: "opacity .15s",
                        background: "rgba(10,14,26,.4)",
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
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {timeAgo(video.published)}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* COMMUNITY SECTION — placeholder for Phase 6 */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "28px",
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Community discussion
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Reviews, discussions, and blog posts about {channel?.name} will appear here. Community features are coming soon.
          </div>
          <div style={{
            background: "var(--surface2)", borderRadius: "var(--radius-md)",
            padding: "16px", display: "flex", alignItems: "center", gap: 12, opacity: 0.7,
          }}>
            <div style={{ fontSize: 20 }}>💬</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                Be the first to start a discussion
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Community features coming in the next phase of Embar
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
