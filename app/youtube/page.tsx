"use client";
import { useState, useEffect } from "react";
import { getChannels, addChannel, type Channel } from "@/lib/channels";
import { getCurrentUsername } from "@/lib/auth";
import Nav from "@/app/components/Nav";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(Math.abs(diff) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // currentUser is still needed here to show/hide the Add channel button

  // Add channel modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [resolved, setResolved] = useState<{ channelId: string; name: string; thumbnail: string } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getCurrentUsername().then(setCurrentUser);
    getChannels().then(ch => { setChannels(ch); setLoading(false); });
  }, []);

  const filtered = channels.filter(ch =>
    ch.name.toLowerCase().includes(search.toLowerCase()) ||
    ch.description.toLowerCase().includes(search.toLowerCase())
  );

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
    }
    setResolving(false);
  }

  async function handleSubmit() {
    if (!resolved || !nameInput.trim()) return;
    if (!currentUser) return;
    setSubmitting(true);
    setSubmitError("");

    const { error } = await addChannel({
      youtube_channel_id: resolved.channelId,
      name: nameInput.trim(),
      description: descInput.trim(),
      thumbnail_url: resolved.thumbnail,
      youtube_url: urlInput.trim(),
      added_by: currentUser,
    });

    if (error) {
      setSubmitError(error);
      setSubmitting(false);
      return;
    }

    // Refresh channel list
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
    setSubmitError("");
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      <Nav activePage="youtube" />

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #0C1620, #102232)",
          borderRadius: "var(--radius-lg)",
          padding: "28px 28px 24px",
          marginBottom: 28,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", fontSize: 80, opacity: 0.08 }}>▶</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#378ADD", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Content</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "white", letterSpacing: "-0.03em", marginBottom: 6 }}>YouTube channels</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 18 }}>
            Every channel here was added by the Embar community. No ratings on creators, ever. Recent videos update automatically.
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "var(--radius-full)",
              padding: "8px 16px",
              flex: 1, maxWidth: 380,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search channels..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: "none", border: "none", outline: "none",
                  color: "white", fontSize: 13, fontFamily: "inherit",
                  flex: 1,
                }}
              />
            </div>
            {currentUser && (
              <button onClick={() => setModalOpen(true)} style={{
                background: "var(--blue)", color: "white", border: "none",
                borderRadius: "var(--radius-full)", padding: "8px 20px",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>+ Add a channel</button>
            )}
          </div>
        </div>

        {/* CHANNELS GRID */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 14 }}>
            Loading channels...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>▶</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              {search ? "No channels match that search" : "No channels yet"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              {search ? "Try a different search term" : currentUser ? "Be the first to add a YouTube channel to Embar" : "Sign in to add the first channel"}
            </div>
            {currentUser && !search && (
              <button onClick={() => setModalOpen(true)} style={{
                background: "var(--blue)", color: "white", border: "none",
                borderRadius: "var(--radius-full)", padding: "10px 24px",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>+ Add a channel</button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filtered.map(ch => (
              <a key={ch.id} href={`/channel/${ch.youtube_channel_id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
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
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    {ch.thumbnail_url ? (
                      <img
                        src={ch.thumbnail_url}
                        alt={ch.name}
                        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                        background: "var(--accent)", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 700,
                      }}>{ch.name[0].toUpperCase()}</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: "var(--text)",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{ch.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Added {timeAgo(ch.created_at)}
                      </div>
                    </div>
                  </div>
                  {ch.description && (
                    <div style={{
                      fontSize: 12, color: "var(--text-mid)", lineHeight: 1.55,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>{ch.description}</div>
                  )}
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 8px",
                      background: "var(--accent-light)", color: "var(--blue)",
                      borderRadius: "var(--radius-full)", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>▶ YouTube</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ADD CHANNEL MODAL */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em" }}>
                Add a YouTube channel
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 18, color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22, lineHeight: 1.6 }}>
              Paste any YouTube channel link — we&apos;ll fill in the name and thumbnail automatically.
            </div>

            {/* STEP 1 — URL */}
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
                    border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                    background: "var(--bg)", color: "var(--text)",
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                  }}
                />
                <button
                  onClick={handleResolve}
                  disabled={resolving || !urlInput.trim()}
                  style={{
                    padding: "10px 16px", background: resolving ? "var(--muted)" : "var(--accent)",
                    color: "white", border: "none", borderRadius: "var(--radius-md)",
                    fontSize: 13, fontWeight: 500, cursor: resolving ? "default" : "pointer",
                    fontFamily: "inherit", flexShrink: 0,
                  }}
                >{resolving ? "..." : "Look up"}</button>
              </div>
              {resolveError && (
                <div style={{ fontSize: 12, color: "#C03020", marginTop: 6 }}>{resolveError}</div>
              )}
            </div>

            {/* STEP 2 — once resolved, show name + description fields */}
            {resolved && (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--surface2)", borderRadius: "var(--radius-md)",
                  padding: "10px 12px", marginBottom: 14,
                }}>
                  {resolved.thumbnail ? (
                    <img src={resolved.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "var(--accent)", color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700,
                    }}>▶</div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Channel found</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: {resolved.channelId}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 16 }}>✓</span>
                </div>

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
                      border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                      background: "var(--bg)", color: "var(--text)",
                      fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 5 }}>
                    Short description <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                  </label>
                  <textarea
                    value={descInput}
                    onChange={e => setDescInput(e.target.value)}
                    placeholder="What is this channel about? What makes it worth following?"
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 14px",
                      border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                      background: "var(--bg)", color: "var(--text)",
                      fontSize: 13, fontFamily: "inherit", outline: "none",
                      resize: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                {submitError && (
                  <div style={{
                    background: "#FFF0EE", border: "1px solid #F5C0B8",
                    borderRadius: "var(--radius)", padding: "9px 13px",
                    fontSize: 13, color: "#C03020", marginBottom: 14,
                  }}>{submitError}</div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !nameInput.trim()}
                  style={{
                    width: "100%", padding: 11, background: submitting || !nameInput.trim() ? "var(--muted)" : "var(--blue)",
                    color: "white", border: "none", borderRadius: "var(--radius-md)",
                    fontSize: 14, fontWeight: 600, cursor: submitting || !nameInput.trim() ? "default" : "pointer",
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
