"use client";
import { useState } from "react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "⬡" },
  { id: "youtube", label: "YouTube", icon: "▶" },
  { id: "communities", label: "Communities", icon: "⬡" },
  { id: "blogs", label: "Blogs", icon: "✦" },
];

const FEED_CARDS = [
  {
    id: 1,
    type: "discussion",
    typeLabel: "Discussion",
    community: "Film essay fans",
    communityColor: "#1A4FD4",
    time: "2h ago",
    title: "Like Stories of Old just released something that changed how I think about nostalgia — has anyone else watched it twice already?",
    body: "The video on identity and nostalgia does something more quietly radical than the obvious works. It sneaks up on you. There's a moment around the 18-minute mark that reframes everything that came before it...",
    author: "stellajoy",
    initials: "SJ",
    avatarBg: "#EBF0FC",
    avatarColor: "#1A4FD4",
    replies: 47,
    signal: "💡 Insightful",
  },
  {
    id: 2,
    type: "gem",
    channelName: "Wendover Productions",
    subscribers: "4.2k Embar followers",
    gemDesc: "47 members wrote detailed posts this week · \"One of the most underrated channels explaining how the world works\"",
    isGem: true,
  },
  {
    id: 3,
    type: "blog",
    typeLabel: "Blog",
    community: "Individual post",
    communityColor: "#7B4FD4",
    time: "Yesterday",
    title: "Why Kurzgesagt's video on loneliness is the most important piece of content made this decade",
    body: "Most YouTube content optimises for virality. This video optimised for honesty. The decision to use animation to discuss something so human and uncomfortable turns out to be exactly right...",
    author: "miriamknight",
    initials: "MK",
    avatarBg: "#EDE8FA",
    avatarColor: "#5B35C5",
    replies: 23,
    readTime: "6 min read",
    signal: "❤ Resonates",
  },
  {
    id: 4,
    type: "review",
    typeLabel: "Review",
    community: "Tech YouTube",
    communityColor: "#0F6E56",
    time: "4h ago",
    title: "Veritasium — the most consistent channel on the platform and it isn't even close",
    body: "Three years of watching every upload and the quality curve doesn't exist — it's just a flat line at the top. The video on the illusion of understanding is the best place to start for anyone new...",
    author: "rowanlee",
    initials: "RL",
    avatarBg: "#E1F5EE",
    avatarColor: "#0F6E56",
    replies: 31,
    signal: "💡 Insightful",
  },
  {
    id: 5,
    type: "discussion",
    typeLabel: "Discussion",
    community: "Not in a community",
    communityColor: "#C4830A",
    time: "6h ago",
    title: "What YouTube channel would you show someone who thinks the platform is just gaming and vlogs?",
    body: "Trying to convert a friend who's written off YouTube as low quality. The channels I love most are exactly the thing he doesn't know exists yet...",
    author: "jackmartin",
    initials: "JM",
    avatarBg: "#FFF9EC",
    avatarColor: "#A06010",
    replies: 84,
    signal: "👍 Helpful",
  },
];

const CATEGORIES = [
  { id: "youtube", icon: "▶", label: "YouTube", meta: "6.2k channels · watch in Embar", bg: "#0C1620", accent: "#378ADD" },
  { id: "communities", icon: "⬡", label: "Communities", meta: "4.2k communities · create yours", bg: "#0E0A1A", accent: "#7B4FD4" },
  { id: "blogs", icon: "✦", label: "Blogs", meta: "Individual · community · essays", bg: "#0C1A0E", accent: "#1D9E75" },
  { id: "hidden", icon: "✦", label: "Hidden gems", meta: "Community-surfaced small creators", bg: "#1A0E04", accent: "#E8A020" },
];

const SIDEBAR_COMMUNITIES = [
  { name: "Film essay fans", icon: "🎞", bg: "#0C1620", new: 12 },
  { name: "Tech YouTube", icon: "💻", bg: "#0C1A0E", new: 4 },
  { name: "Small creators ✦", icon: "✦", bg: "#1A0E04", new: 7 },
];

const SIDEBAR_CHANNELS = [
  { name: "Like Stories of Old", meta: "New video · 3h ago", hasNew: true },
  { name: "Kurzgesagt", meta: "11 community posts", hasNew: false },
  { name: "Philosophy Tube ✦", meta: "Hidden gem · growing", hasNew: false },
];

type FilterType = "All" | "YouTube" | "Discussions" | "Blogs" | "Reviews";
const FILTERS: FilterType[] = ["All", "YouTube", "Discussions", "Blogs", "Reviews"];

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SidebarRow({ icon, iconBg, name, meta, hasNew }: { icon: React.ReactNode; iconBg: string; name: string; meta: string; hasNew?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{meta}</div>
      </div>
      {hasNew && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--coral)", flexShrink: 0 }} />}
    </div>
  );
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"join" | "signin">("join");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  const filteredCards = FEED_CARDS.filter((card) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "YouTube") return card.isGem || card.community?.includes("YouTube") || card.community?.includes("film essay") || card.community?.includes("Tech");
    if (activeFilter === "Discussions") return card.type === "discussion";
    if (activeFilter === "Blogs") return card.type === "blog";
    if (activeFilter === "Reviews") return card.type === "review";
    return true;
  });

  return (
    <div data-theme={isDark ? "dark" : "light"} style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 0.2s ease" }}>

      {/* NAV */}
      <nav style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        gap: 0,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: 32 }}>
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, var(--blue), #3B6FE8)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "white", letterSpacing: "-0.03em",
          }}>E</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.04em" }}>embar</span>
        </a>

        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} style={{
              fontSize: 13, color: item.id === "home" ? "var(--blue)" : "var(--text-muted)",
              background: item.id === "home" ? "var(--blue-light)" : "none",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              border: "none", cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: item.id === "home" ? 500 : 400,
              transition: "all .12s",
            }}>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {/* THEME TOGGLE */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 36, height: 36,
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
              transition: "all .15s",
              flexShrink: 0,
            }}>
            {isDark ? "☀" : "☾"}
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-full)", padding: "7px 16px",
            fontSize: 13, color: "var(--text-muted)", cursor: "pointer", width: 200,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search Embar...
          </div>
          <button onClick={() => { setModalType("signin"); setModalOpen(true); }} style={{
            fontSize: 13, color: "var(--text-mid)", border: "1px solid var(--border)",
            background: "var(--surface)", borderRadius: "var(--radius-full)",
            padding: "6px 16px", cursor: "pointer", fontFamily: "inherit",
          }}>Sign in</button>
          <button onClick={() => { setModalType("join"); setModalOpen(true); }} style={{
            background: "var(--blue)", color: "white", border: "none",
            borderRadius: "var(--radius-full)", padding: "7px 18px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}>Join free</button>
        </div>
      </nav>

      {/* PAGE BODY */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 272px",
        maxWidth: 1200,
        margin: "0 auto",
        minHeight: "calc(100vh - 56px)",
      }}>

        {/* MAIN */}
        <main style={{ padding: "28px 24px 60px", minWidth: 0 }}>

          {/* CATEGORY TILES */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Explore
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 32 }}>
            {CATEGORIES.map((cat) => (
              <div key={cat.id} style={{
                background: cat.bg,
                borderRadius: "var(--radius-md)",
                padding: "18px 16px 14px",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "transform .14s, box-shadow .14s",
                position: "relative",
                overflow: "hidden",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(10,14,26,.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
              >
                <div style={{ position: "absolute", right: 10, top: 10, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>›</div>
                <div style={{ fontSize: 20, marginBottom: 10, color: cat.accent }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 4, letterSpacing: "-0.02em" }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{cat.meta}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "var(--border)", marginBottom: 22 }} />

          {/* FEED HEADER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
              What&apos;s happening
            </span>
            <div style={{ display: "flex", gap: 5 }}>
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)} style={{
                  fontSize: 12, padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${activeFilter === f ? "var(--blue)" : "var(--border)"}`,
                  background: activeFilter === f ? "var(--blue)" : "var(--surface)",
                  color: activeFilter === f ? "white" : "var(--text-muted)",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all .1s",
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* FEED */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredCards.map((card) => {
              if (card.isGem) {
                return (
                  <div key={card.id} style={{
                    background: "linear-gradient(135deg,#FFFBF0,#FFF6E8)",
                    border: "1px solid #F0D090",
                    borderRadius: "var(--radius-md)", padding: "14px 16px", cursor: "pointer",
                    transition: "border-color .12s, box-shadow .12s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#D4A030"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(200,140,0,.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#F0D090"; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 9px", background: "#FDE68A", color: "#92400E", borderRadius: "var(--radius-full)", letterSpacing: "0.04em", textTransform: "uppercase" }}>✦ Hidden gem</span>
                      <span style={{ fontSize: 11, color: "#A06010", marginLeft: "auto" }}>YouTube · {card.subscribers}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{card.channelName} — discovered this week by the Embar community</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{card.gemDesc}</div>
                  </div>
                );
              }

              const isHovered = hoveredCard === card.id;
              return (
                <div key={card.id}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${isHovered ? "var(--blue-mid)" : "var(--border)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: isHovered ? "16px 16px 14px" : "14px 16px",
                    cursor: "pointer",
                    transition: "all .15s ease",
                    boxShadow: isHovered ? "0 4px 20px rgba(26,79,212,.07)" : "none",
                    transform: isHovered ? "translateY(-1px)" : "none",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9, flexWrap: "wrap" as const }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 9px",
                      borderRadius: "var(--radius-full)", textTransform: "uppercase" as const, letterSpacing: "0.05em",
                      background: card.type === "discussion" ? "var(--blue-light)" : card.type === "review" ? "#EDFBF3" : "#F0EEFF",
                      color: card.type === "discussion" ? "var(--blue)" : card.type === "review" ? "#0F6E56" : "#5B35C5",
                    }}>{card.typeLabel}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: card.communityColor, display: "inline-block" }} />
                      {card.community}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{card.time}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 6, lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                    {card.title}
                  </div>
                  <div style={{
                    fontSize: 12, color: "var(--text-mid)", lineHeight: 1.6, marginBottom: 11,
                    display: "-webkit-box", WebkitLineClamp: isHovered ? 4 : 2,
                    WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    transition: "all .15s",
                  }}>
                    {card.body}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: card.avatarBg, color: card.avatarColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 700,
                      }}>{card.initials}</div>
                      {card.author}{card.readTime ? ` · ${card.readTime}` : ""}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                      <button style={{
                        display: "flex", alignItems: "center", gap: 3,
                        fontSize: 11, color: "var(--text-muted)", border: "none",
                        background: "none", cursor: "pointer", padding: "3px 8px",
                        borderRadius: "var(--radius)", fontFamily: "inherit",
                        transition: "all .1s",
                      }}>💬 {card.replies}</button>
                      <button style={{
                        display: "flex", alignItems: "center", gap: 3,
                        fontSize: 11, color: "var(--text-muted)", border: "none",
                        background: "none", cursor: "pointer", padding: "3px 8px",
                        borderRadius: "var(--radius)", fontFamily: "inherit",
                      }}>{card.signal}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside style={{
          borderLeft: "1px solid var(--border)",
          padding: "20px 16px",
          position: "sticky",
          top: 56,
          height: "calc(100vh - 56px)",
          overflowY: "auto",
        }}>

          {/* PROFILE / JOIN BLOCK */}
          <div style={{
            background: "var(--text)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            marginBottom: 22,
            textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#1A2340",
              border: "2px solid #2A3860",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5070B0" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 3 }}>Your profile</div>
            <div style={{ fontSize: 11, color: "#6070A8", marginBottom: 14, lineHeight: 1.5 }}>
              Join to see your communities, channels, and saved threads here
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { setModalType("join"); setModalOpen(true); }} style={{
                flex: 1, padding: "8px", background: "var(--blue)", color: "white",
                border: "none", borderRadius: "var(--radius)", fontSize: 12,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Join free</button>
              <button onClick={() => { setModalType("signin"); setModalOpen(true); }} style={{
                flex: 1, padding: "8px", background: "transparent", color: "#8090C0",
                border: "1px solid #2A3860", borderRadius: "var(--radius)",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>Sign in</button>
            </div>
          </div>

          {/* YOUR COMMUNITIES */}
          <SidebarSection title="Your communities">
            {SIDEBAR_COMMUNITIES.map((c) => (
              <SidebarRow key={c.name}
                icon={<span style={{ fontSize: 13 }}>{c.icon}</span>}
                iconBg={c.bg}
                name={c.name}
                meta={`${c.new} new posts`}
                hasNew
              />
            ))}
            <button style={{
              width: "100%", marginTop: 8, padding: "6px", fontSize: 11,
              color: "var(--text-muted)", border: "1px dashed var(--border)",
              background: "none", borderRadius: "var(--radius)", cursor: "pointer",
              fontFamily: "inherit",
            }}>+ Browse communities</button>
          </SidebarSection>

          {/* YOUTUBE CHANNELS FOLLOWING */}
          <SidebarSection title="YouTube channels">
            {SIDEBAR_CHANNELS.map((ch) => (
              <SidebarRow key={ch.name}
                icon={<span style={{ fontSize: 11, color: "#378ADD" }}>▶</span>}
                iconBg="#0C1620"
                name={ch.name}
                meta={ch.meta}
                hasNew={ch.hasNew}
              />
            ))}
            <button style={{
              width: "100%", marginTop: 8, padding: "6px", fontSize: 11,
              color: "var(--text-muted)", border: "1px dashed var(--border)",
              background: "none", borderRadius: "var(--radius)", cursor: "pointer",
              fontFamily: "inherit",
            }}>+ Follow a channel</button>
          </SidebarSection>

          {/* SAVED THREADS */}
          <SidebarSection title="Saved threads">
            {[
              { name: "Like Stories of Old — nostalgia video", meta: "47 replies · active", hasNew: true },
              { name: "Best sci-fi on YouTube right now?", meta: "23 replies · saved", hasNew: false },
            ].map((t) => (
              <SidebarRow key={t.name}
                icon={<span style={{ fontSize: 11 }}>💬</span>}
                iconBg="var(--blue-light)"
                name={t.name}
                meta={t.meta}
                hasNew={t.hasNew}
              />
            ))}
          </SidebarSection>

          {/* PHASE 2 PLACEHOLDERS — greyed out, coming soon */}
          <div style={{
            background: "var(--surface2)", borderRadius: "var(--radius-md)",
            padding: "12px 14px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Coming in Phase 2
            </div>
            {["Films you&apos;re following", "TV shows you&apos;re watching"].map((label) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 0", opacity: 0.45,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }} dangerouslySetInnerHTML={{ __html: label }} />
              </div>
            ))}
          </div>

          {/* ABOUT */}
          <div style={{
            fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7,
            borderTop: "1px solid var(--border)", paddingTop: 14,
          }}>
            <span style={{ fontWeight: 600, color: "var(--text-mid)" }}>Embar</span> — where people who genuinely love content find each other. Warm, human, built around passion.
          </div>

        </aside>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }} style={{
          position: "fixed", inset: 0, background: "rgba(10,14,26,.5)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: 20,
            padding: "28px", maxWidth: 460, width: "92%",
            boxShadow: "0 20px 60px rgba(10,14,26,.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em" }}>
                {modalType === "join" ? "Join Embar" : "Welcome back"}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", fontSize: 18, color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22, lineHeight: 1.6 }}>
              {modalType === "join"
                ? "Free forever. Browse everything without an account — join when you're ready to be part of the conversation."
                : "Sign in to see your communities, followed channels, and personal feed."}
            </div>
            {modalType === "join" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {[
                  { i: "💬", b: "#EBF0FC", t: "Write reviews, discussions, and blog posts" },
                  { i: "⬡", b: "#F0EEFF", t: "Create or join communities around any YouTube channel" },
                  { i: "▶", b: "#E1F5EE", t: "Watch videos inside Embar with community discussion alongside" },
                  { i: "✦", b: "#FFF9EC", t: "Discover hidden gems the algorithm would never surface" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--text-mid)", lineHeight: 1.45 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: item.b, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{item.i}</div>
                    {item.t}
                  </div>
                ))}
              </div>
            )}
            <button style={{
              width: "100%", padding: "11px", borderRadius: "var(--radius-md)",
              background: "var(--blue)", color: "white", border: "none",
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              letterSpacing: "-0.01em",
            }}>
              {modalType === "join" ? "Sign up free" : "Sign in"}
            </button>
            {modalType === "join" && (
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <button onClick={() => setModalType("signin")} style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
