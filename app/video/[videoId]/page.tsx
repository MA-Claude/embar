"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Nav from "@/app/components/Nav";

type VideoData = {
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  channel_id: string;
};

type ChannelData = {
  name: string;
  thumbnail_url: string;
  youtube_channel_id: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(Math.abs(diff) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

export default function VideoPage({ params }: { params: Promise<{ videoId: string }> }) {
  const [videoId, setVideoId] = useState("");
  const [video, setVideo] = useState<VideoData | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setVideoId(p.videoId));
  }, [params]);

  useEffect(() => {
    if (!videoId) return;
    async function load() {
      const { data: v } = await supabase
        .from("videos")
        .select("*")
        .eq("video_id", videoId)
        .single();

      setVideo(v);

      if (v?.channel_id) {
        const { data: ch } = await supabase
          .from("channels")
          .select("name, thumbnail_url, youtube_channel_id")
          .eq("youtube_channel_id", v.channel_id)
          .single();
        setChannel(ch);
      }

      setLoading(false);
    }
    load();
  }, [videoId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading video...</div>
      </div>
    );
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Nav activePage="youtube" />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 100px" }}>

        {/* BREADCRUMB */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <a href="/youtube" style={{ color: "var(--text-muted)", textDecoration: "none" }}>YouTube</a>
          {channel && (
            <>
              <span>›</span>
              <a href={`/channel/${channel.youtube_channel_id}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                {channel.name}
              </a>
            </>
          )}
          <span>›</span>
          <span style={{ color: "var(--text)" }}>Video</span>
        </div>

        {/* VIDEO EMBED */}
        <div style={{
          position: "relative", paddingBottom: "56.25%",
          borderRadius: 16, overflow: "hidden",
          background: "#000", marginBottom: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={video?.title ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        </div>

        {/* VIDEO INFO */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "22px 24px",
          marginBottom: 20,
        }}>
          <h1 style={{
            fontSize: 20, fontWeight: 700, color: "var(--text)",
            letterSpacing: "-0.03em", lineHeight: 1.3,
            margin: "0 0 12px",
          }}>
            {video?.title ?? "Video"}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const, marginBottom: 16 }}>
            {channel && (
              <a href={`/channel/${channel.youtube_channel_id}`} style={{
                display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
              }}>
                {channel.thumbnail_url ? (
                  <img src={channel.thumbnail_url} alt={channel.name}
                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--blue)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>{channel.name[0]}</div>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{channel.name}</span>
              </a>
            )}
            {video?.published_at && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Uploaded {timeAgo(video.published_at)}
              </span>
            )}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "auto",
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "var(--text-muted)", textDecoration: "none",
                border: "1px solid var(--border)", borderRadius: 99,
                padding: "5px 12px",
              }}
            >
              <span style={{ fontSize: 10 }}>▶</span> Watch on YouTube
            </a>
          </div>

          {video?.description && (
            <div style={{
              fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7,
              paddingTop: 16, borderTop: "1px solid var(--border)",
              whiteSpace: "pre-wrap" as const,
            }}>
              {video.description}
            </div>
          )}

          {!video && (
            <div style={{ fontSize: 13, color: "var(--text-muted)", paddingTop: 8 }}>
              This video hasn&apos;t been indexed by Embar yet. Visit its channel page to index it.
            </div>
          )}
        </div>

        {/* COMMUNITY DISCUSSION */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "24px",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Community discussion
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Reviews, discussions, and thoughts about this video will live here.
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
          }}>
            {["💬 Discussions", "★ Reviews", "📝 Blog posts"].map(label => (
              <div key={label} style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "14px",
                opacity: 0.6,
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Coming soon</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
