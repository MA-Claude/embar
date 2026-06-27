"use client";
import { useState, useEffect } from "react";
import { signUp, signIn, signOut, getCurrentUsername } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

type Props = {
  activePage?: "home" | "youtube" | "communities" | "blogs";
  // Optional: when on a channel page, pass the community theme so the Nav
  // shows all three options (Light / Dark / Community) instead of just a toggle.
  communityTheme?: { id: string; label: string };
  viewMode?: "light" | "dark" | "community";
  onViewModeChange?: (mode: "light" | "dark" | "community") => void;
};

export default function Nav({ activePage = "home", communityTheme, viewMode, onViewModeChange }: Props) {
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"join" | "signin">("join");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  useEffect(() => {
    getCurrentUsername().then(setCurrentUser);
  }, []);

  function openModal(type: "join" | "signin") {
    setModalType(type);
    setModalOpen(true);
    setUsername("");
    setPassword("");
    setAuthError("");
    setAuthSuccess("");
  }

  async function handleSubmit() {
    setAuthError("");
    setAuthSuccess("");
    if (!username.trim() || !password) { setAuthError("Please fill in both fields"); return; }
    if (password.length < 8) { setAuthError("Password must be at least 8 characters"); return; }
    setAuthLoading(true);

    if (modalType === "join") {
      const result = await signUp(username, password);
      if (result.error) {
        setAuthError(result.error);
      } else {
        setAuthSuccess(`Welcome to Embar, ${result.username}!`);
        setCurrentUser(result.username ?? null);
        setTimeout(() => setModalOpen(false), 1200);
      }
    } else {
      const result = await signIn(username, password);
      if (result.error) {
        setAuthError(result.error);
      } else {
        const name = await getCurrentUsername();
        setCurrentUser(name ?? username.trim());
        setModalOpen(false);
      }
    }
    setAuthLoading(false);
  }

  const NAV_ITEMS = [
    { id: "home", label: "Home", href: "/" },
    { id: "youtube", label: "YouTube", href: "/youtube" },
    { id: "communities", label: "Communities", href: "#" },
    { id: "blogs", label: "Blogs", href: "#" },
  ];

  return (
    <>
      <nav style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        height: 56,
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: 32 }}>
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, var(--blue), #3B6FE8)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "white",
          }}>E</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.04em" }}>embar</span>
        </a>

        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <a key={item.id} href={item.href} style={{
              fontSize: 13,
              color: activePage === item.id ? "var(--blue)" : "var(--text-muted)",
              background: activePage === item.id ? "var(--blue-light)" : "none",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
              fontWeight: activePage === item.id ? 500 : 400,
              transition: "all .12s",
            }}>{item.label}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {/* Theme selector — 3 options on channel pages, simple toggle elsewhere */}
          {communityTheme && onViewModeChange ? (
            <div style={{
              display: "flex", gap: 2,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)",
              padding: 3,
              background: "var(--surface2)",
            }}>
              {([
                { mode: "light"     as const, label: "☀ Light" },
                { mode: "dark"      as const, label: "☾ Dark" },
                { mode: "community" as const, label: `◈ ${communityTheme.label}` },
              ]).map(opt => (
                <button
                  key={opt.mode}
                  onClick={() => {
                    onViewModeChange(opt.mode);
                    if (opt.mode !== "community") setTheme(opt.mode);
                  }}
                  style={{
                    fontSize: 11, fontWeight: viewMode === opt.mode ? 600 : 400,
                    padding: "4px 11px", borderRadius: "var(--radius-full)", border: "none",
                    background: viewMode === opt.mode ? "var(--blue)" : "none",
                    color: viewMode === opt.mode ? "white" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all .12s",
                    whiteSpace: "nowrap" as const,
                  }}
                >{opt.label}</button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: 32, height: 32, borderRadius: "var(--radius-full)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-muted)",
                cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >{theme === 'dark' ? "☀" : "☾"}</button>
          )}
          {currentUser ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--accent)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>{currentUser[0].toUpperCase()}</div>
                {currentUser}
              </div>
              <button onClick={() => signOut().then(() => setCurrentUser(null))} style={{
                fontSize: 13, color: "var(--text-muted)", border: "1px solid var(--border)",
                background: "var(--surface)", borderRadius: "var(--radius-full)",
                padding: "6px 16px", cursor: "pointer", fontFamily: "inherit",
              }}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={() => openModal("signin")} style={{
                fontSize: 13, color: "var(--text-mid)", border: "1px solid var(--border)",
                background: "var(--surface)", borderRadius: "var(--radius-full)",
                padding: "6px 16px", cursor: "pointer", fontFamily: "inherit",
              }}>Sign in</button>
              <button onClick={() => openModal("join")} style={{
                background: "var(--blue)", color: "white", border: "none",
                borderRadius: "var(--radius-full)", padding: "7px 18px",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      {/* MODAL */}
      {modalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }} style={{
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
                ? "Free forever. No email needed — just a username and password."
                : "Sign in to see your communities, followed channels, and personal feed."}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 5 }}>Username</label>
                <input
                  type="text"
                  placeholder="e.g. stellajoy"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  style={{
                    width: "100%", padding: "10px 14px",
                    border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                    background: "var(--bg)", color: "var(--text)",
                    fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                  }}
                />
                {modalType === "join" && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    Letters, numbers, and underscores only. 3–30 characters.
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-mid)", display: "block", marginBottom: 5 }}>Password</label>
                <input
                  type="password"
                  placeholder={modalType === "join" ? "At least 8 characters" : "Your password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  style={{
                    width: "100%", padding: "10px 14px",
                    border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                    background: "var(--bg)", color: "var(--text)",
                    fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {authError && (
              <div style={{
                background: "#FFF0EE", border: "1px solid #F5C0B8",
                borderRadius: "var(--radius)", padding: "9px 13px",
                fontSize: 13, color: "#C03020", marginBottom: 14,
              }}>{authError}</div>
            )}
            {authSuccess && (
              <div style={{
                background: "#EDFBF3", border: "1px solid #B0E8CC",
                borderRadius: "var(--radius)", padding: "9px 13px",
                fontSize: 13, color: "#0F6E56", marginBottom: 14,
              }}>{authSuccess}</div>
            )}

            <button onClick={handleSubmit} disabled={authLoading} style={{
              width: "100%", padding: "11px", borderRadius: "var(--radius-md)",
              background: authLoading ? "var(--muted)" : "var(--blue)",
              color: "white", border: "none",
              fontSize: 14, fontWeight: 600, cursor: authLoading ? "default" : "pointer",
              fontFamily: "inherit",
            }}>
              {authLoading ? "Please wait..." : modalType === "join" ? "Create account" : "Sign in"}
            </button>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
              {modalType === "join" ? (
                <>Already have an account?{" "}
                  <button onClick={() => openModal("signin")} style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Sign in</button>
                </>
              ) : (
                <>New to Embar?{" "}
                  <button onClick={() => openModal("join")} style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Sign up</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
