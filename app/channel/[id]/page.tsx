"use client";
import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { getChannel, type Channel } from "@/lib/channels";
import Nav from "@/app/components/Nav";
import { defaultCommunityTheme } from "@/lib/theme";
import { getCurrentUsername } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────
type Video = { videoId: string; title: string; published: string; thumbnail: string; url: string };
type CommPost = {
  id: string; channel_id: string; author: string; type: string;
  title: string | null; body: string; created_at: string;
  parent_id: string | null; tags: string[] | null;
};
type PageTab      = "community" | "videos" | "about";
type CommSection  = "stream" | "spark" | "forum" | "read" | "wiki" | "chat" | "gathering";
type SparkSort    = "hot" | "new" | "top";
type StreamFilter = "all" | "spark" | "forum" | "read" | "wiki";

const F = { syne: "'Syne',sans-serif", body: "'Manrope',sans-serif" };

// ── Configurable status/category data ─────────────────────────────────────────
// To add a new forum status or read category, add an entry here. Nothing else needs changing.

export const FORUM_STATUSES = [
  { id:"open",       label:"Open",        col:"#4ABA5A",  bg:"rgba(42,122,58,.13)",    bd:"rgba(42,122,58,.26)" },
  { id:"question",   label:"Question",    col:"#8888C8",  bg:"rgba(80,80,180,.09)",    bd:"rgba(80,80,180,.18)" },
  { id:"discussion", label:"Discussion",  col:"#A0C8A8",  bg:"rgba(42,122,58,.08)",    bd:"rgba(42,122,58,.18)" },
  { id:"answered",   label:"✔ Answered",  col:"#60B890",  bg:"rgba(80,160,120,.1)",    bd:"rgba(80,160,120,.22)" },
  { id:"hot",        label:"Hot",         col:"#C8906A",  bg:"rgba(212,132,90,.1)",    bd:"rgba(212,132,90,.22)" },
  { id:"pinned",     label:"✦ Pinned",    col:"#4ABA5A",  bg:"rgba(42,122,58,.13)",    bd:"rgba(42,122,58,.26)" },
];

export const READ_CATEGORIES = [
  { id:"essay",    label:"Essay",      col:"#D4845A", bg:"rgba(212,132,90,.12)",  bd:"rgba(212,132,90,.26)" },
  { id:"analysis", label:"Analysis",   col:"#8888C8", bg:"rgba(80,80,180,.09)",   bd:"rgba(80,80,180,.18)" },
  { id:"personal", label:"Personal",   col:"#C8906A", bg:"rgba(212,132,90,.1)",   bd:"rgba(212,132,90,.2)"  },
  { id:"deepdive", label:"Deep dive",  col:"#4ABA5A", bg:"rgba(42,122,58,.1)",    bd:"rgba(42,122,58,.18)" },
];

// ── Tag helpers ────────────────────────────────────────────────────────────────
function getForumStatus(post: CommPost): string {
  const t = post.tags?.find(x => x.startsWith("__s:"));
  return t ? t.slice(4) : "open";
}
function getReadCategory(post: CommPost): string {
  const t = post.tags?.find(x => x.startsWith("__c:"));
  return t ? t.slice(4) : "essay";
}
function getVisibleTags(post: CommPost): string[] {
  return (post.tags ?? []).filter(t => !t.startsWith("__s:") && !t.startsWith("__c:"));
}
function statusMeta(id: string) {
  return FORUM_STATUSES.find(s => s.id === id) ?? FORUM_STATUSES[0];
}
function categoryMeta(id: string) {
  return READ_CATEGORIES.find(c => c.id === id) ?? READ_CATEGORIES[0];
}
function readMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
function catLabel(id: string) {
  return ({ film:"Film & Media",tech:"Tech & Science",education:"Education",ideas:"Ideas",comedy:"Comedy",music:"Music",art:"Art",gaming:"Gaming",lifestyle:"Lifestyle" } as Record<string,string>)[id] ?? id;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
function IcoStream(c: string) { return <svg width="14" height="14" viewBox="0 0 16 16" fill={c} style={{flexShrink:0}}><circle cx="3" cy="4" r="1.4"/><rect x="6.5" y="3.3" width="7" height="1.4" rx=".7"/><circle cx="3" cy="8" r="1.4"/><rect x="6.5" y="7.3" width="7" height="1.4" rx=".7"/><circle cx="3" cy="12" r="1.4"/><rect x="6.5" y="11.3" width="7" height="1.4" rx=".7"/></svg>; }
function IcoSpark(c: string) { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M9.5 2L5 8.5H10L7 15L14 6.5H9.5Z"/></svg>; }
function IcoForum(c: string) { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" style={{flexShrink:0}}><rect x="2" y="2" width="5.5" height="4" rx="1.2"/><rect x="8.5" y="2" width="5.5" height="4" rx="1.2"/><rect x="2" y="9" width="5.5" height="4" rx="1.2"/><rect x="8.5" y="9" width="5.5" height="4" rx="1.2"/></svg>; }
function IcoReads(c: string) { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" style={{flexShrink:0}}><path d="M8 4C6.5 2.5 4.5 2 2 2V13C4.5 13 6.5 13.5 8 15"/><path d="M8 4C9.5 2.5 11.5 2 14 2V13C11.5 13 9.5 13.5 8 15"/></svg>; }
function IcoWiki(c: string) { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" style={{flexShrink:0}}><ellipse cx="8" cy="4.5" rx="5" ry="1.75"/><path d="M3 4.5V7.5C3 8.47 5.24 9.25 8 9.25S13 8.47 13 7.5V4.5"/><path d="M3 7.5V10.5C3 11.47 5.24 12.25 8 12.25S13 11.47 13 10.5V7.5"/></svg>; }
function IcoChat(c: string) { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M2 2.5H14V11H9L6 14V11H2Z"/></svg>; }
function IcoGather(c: string) { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" style={{flexShrink:0}}><rect x="2" y="3.5" width="12" height="10.5" rx="1.5"/><line x1="2" y1="7.5" x2="14" y2="7.5"/><line x1="5.5" y1="3.5" x2="5.5" y2="1.5"/><line x1="10.5" y1="3.5" x2="10.5" y2="1.5"/></svg>; }
function IcoSearch() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14.5" y2="14.5"/></svg>; }
function IcoFilter() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="6" y1="12" x2="10" y2="12"/></svg>; }
function IcoChevron() { return <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4L6 8L10 4"/></svg>; }
function IcoFlame() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--coral)"><path d="M8 2C8 2 4 5 4 8.5a4 4 0 0 0 8 0c0-1.5-.5-2.5-1-3-.5 1.5-1.5 2-2 2 1-2 .5-4-1-5.5z"/></svg>; }
function IcoReplyBubble(col: string) { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3H14V11H9L6 14V11H2Z"/></svg>; }
function IcoBold() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3h5a3 3 0 0 1 0 6H4V3zm0 6h5.5a3.5 3.5 0 0 1 0 7H4V9z"/></svg>; }
function IcoItalic() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3h5l-1 2H8.5L6.5 11H8l-1 2H3l1-2h1.5L6.5 5H5L6 3z"/></svg>; }
function IcoH2() { return <svg width="16" height="13" viewBox="0 0 20 16" fill="currentColor"><text x="0" y="13" fontFamily="serif" fontSize="14" fontWeight="700">H2</text></svg>; }
function IcoQuote() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h4v5H4.5C4.5 9 5 10 7 10v2C4 12 3 10 3 8V3zm7 0h4v5h-2.5C11.5 9 12 10 14 10v2c-3 0-4-2-4-4V3z"/></svg>; }
function IcoList() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="3" width="2" height="2"/><rect x="4" y="3.5" width="11" height="1"/><rect x="1" y="7" width="2" height="2"/><rect x="4" y="7.5" width="11" height="1"/><rect x="1" y="11" width="2" height="2"/><rect x="4" y="11.5" width="11" height="1"/></svg>; }
function IcoImg() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="2" width="14" height="12" rx="1.5"/><circle cx="5.5" cy="6" r="1.5"/><path d="M1 11l4-3 3 3 2-2 5 4"/></svg>; }

const SIDEBAR_ITEMS: { id: CommSection; label: string; ico: (c: string) => React.ReactElement }[] = [
  { id:"stream",    label:"Stream",     ico: IcoStream },
  { id:"spark",     label:"Sparks",     ico: IcoSpark  },
  { id:"forum",     label:"Forums",     ico: IcoForum  },
  { id:"read",      label:"Reads",      ico: IcoReads  },
  { id:"wiki",      label:"Wiki",       ico: IcoWiki   },
];
const LIVE_ITEMS: { id: CommSection; label: string; ico: (c: string) => React.ReactElement }[] = [
  { id:"chat",      label:"Chat",       ico: IcoChat   },
  { id:"gathering", label:"Gatherings", ico: IcoGather },
];

const ONLINE_AVATARS = [
  {i:"K",bg:"#1E3A28",bd:"#2A5A38",c:"#60B870"},
  {i:"I",bg:"#281A38",bd:"#1A4A22",c:"#A080D0"},
  {i:"R",bg:"#181E34",bd:"#1A4A22",c:"#6090D0"},
  {i:"D",bg:"#281A12",bd:"#1A4A22",c:"#D07850"},
  {i:"P",bg:"#1A1828",bd:"#1A4A22",c:"#8870C0"},
];

// ── Rich editor ────────────────────────────────────────────────────────────────
const TEXT_COLORS = [
  { col:"var(--text)",    label:"Default" },
  { col:"#4ABA5A",       label:"Green"   },
  { col:"#D4845A",       label:"Coral"   },
  { col:"#8888C8",       label:"Purple"  },
  { col:"#60B8D8",       label:"Blue"    },
  { col:"#D4A838",       label:"Gold"    },
  { col:"#D46A6A",       label:"Red"     },
];

function RichEditor({ placeholder, onChange, minHeight=160 }: { placeholder:string; onChange:(html:string)=>void; minHeight?:number }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    onUpdate({ editor }) { onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        style: [
          `min-height:${minHeight}px`,
          "outline:none",
          "padding:12px 14px",
          `font-family:${F.body}`,
          "font-size:13px",
          "line-height:1.7",
          "color:var(--text)",
        ].join(";"),
      },
    },
  });

  function addImage() {
    const url = prompt("Image URL:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }

  if (!editor) return null;

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    display:"flex", alignItems:"center", justifyContent:"center",
    width:28, height:28, borderRadius:6, border:"none", cursor:"pointer",
    background: active ? "var(--surface2)" : "transparent",
    color: active ? "var(--text)" : "var(--text-muted)",
  });

  return (
    <div style={{ border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", background:"var(--bg)" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:2, padding:"6px 10px", borderBottom:"1px solid var(--border)", background:"var(--surface)", flexWrap:"wrap" }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive("bold"))} title="Bold"><IcoBold/></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive("italic"))} title="Italic"><IcoItalic/></button>
        <div style={{ width:1, height:18, background:"var(--border)", margin:"0 4px" }} />
        <button onClick={() => editor.chain().focus().toggleHeading({ level:2 }).run()} style={btnStyle(editor.isActive("heading",{level:2}))} title="Heading"><IcoH2/></button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btnStyle(editor.isActive("blockquote"))} title="Quote"><IcoQuote/></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive("bulletList"))} title="List"><IcoList/></button>
        <div style={{ width:1, height:18, background:"var(--border)", margin:"0 4px" }} />
        <button onClick={addImage} style={btnStyle()} title="Add image"><IcoImg/></button>
        <div style={{ width:1, height:18, background:"var(--border)", margin:"0 4px" }} />
        {/* Text colour swatches */}
        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
          {TEXT_COLORS.map(tc => (
            <button key={tc.label} title={tc.label} onClick={() => {
              if (tc.col === "var(--text)") editor.chain().focus().unsetColor().run();
              else editor.chain().focus().setColor(tc.col).run();
            }} style={{ width:16, height:16, borderRadius:"50%", border:"1.5px solid var(--border-strong)", background:tc.col, cursor:"pointer", flexShrink:0 }} />
          ))}
        </div>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--border-strong);
          padding-left: 12px;
          margin: 8px 0;
          color: var(--text-mid);
        }
        .ProseMirror h2 { font-family: ${F.syne}; font-size: 17px; font-weight: 700; margin: 10px 0 4px; color: var(--text); }
        .ProseMirror ul { padding-left: 20px; margin: 4px 0; }
        .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 6px 0; }
      `}</style>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const [channelId, setChannelId] = useState("");
  const [channel,   setChannel]   = useState<Channel | null>(null);
  const [videos,    setVideos]    = useState<Video[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [vidLoading,setVidLoading]= useState(true);

  const [pageTab,     setPageTab]    = useState<PageTab>("community");
  const [section,     setSection]    = useState<CommSection>("spark");
  const [viewMode,    setViewMode]   = useState<"light"|"dark"|"community">("community");
  const [currentUser, setCurrentUser]= useState<string | null>(null);

  const [posts,       setPosts]      = useState<CommPost[]>([]);
  const [postsLoading,setPostsLoading]= useState(false);
  const [replyCounts, setReplyCounts]= useState<Record<string, number>>({});

  const [search,       setSearch]      = useState("");
  const [sparkSort,    setSparkSort]   = useState<SparkSort>("hot");
  const [forumStatusFilter, setForumStatusFilter] = useState("all");
  const [readCatFilter,     setReadCatFilter]      = useState("all");
  const [streamFilter, setStreamFilter]= useState<StreamFilter>("all");

  // Spark compose
  const [sparkOpen,   setSparkOpen]   = useState(false);
  const [sparkBody,   setSparkBody]   = useState("");
  const [sparkPosting,setSparkPosting]= useState(false);

  // Forum modal
  const [forumOpen,   setForumOpen]   = useState(false);
  const [fTitle,      setFTitle]      = useState("");
  const [fBody,       setFBody]       = useState("");
  const [fTags,       setFTags]       = useState("");
  const [fStatus,     setFStatus]     = useState("open");
  const [fPosting,    setFPosting]    = useState(false);

  // Read modal
  const [readOpen,    setReadOpen]    = useState(false);
  const [rTitle,      setRTitle]      = useState("");
  const [rBody,       setRBody]       = useState("");
  const [rTags,       setRTags]       = useState("");
  const [rCategory,   setRCategory]   = useState("essay");
  const [rPosting,    setRPosting]    = useState(false);

  // Thread
  const [openPost,    setOpenPost]    = useState<CommPost | null>(null);
  const [replies,     setReplies]     = useState<CommPost[]>([]);
  const [repliesLoad, setRepliesLoad] = useState(false);
  const [replyBody,   setReplyBody]   = useState("");
  const [replyPosting,setReplyPosting]= useState(false);

  useEffect(() => { params.then(p => setChannelId(p.id)); }, [params]);

  useEffect(() => {
    if (!channel) return;
    const ct = defaultCommunityTheme(channel.name);
    const target = viewMode === "community" ? ct.id : viewMode;
    document.documentElement.setAttribute("data-theme", target);
  }, [viewMode, channel]);

  useEffect(() => {
    return () => {
      const saved = localStorage.getItem("embar-theme") || "light";
      document.documentElement.setAttribute("data-theme", saved);
    };
  }, []);

  const loadPosts = useCallback(async () => {
    if (!channelId) return;
    setPostsLoading(true);
    const { data } = await supabase
      .from("community_posts").select("*")
      .eq("channel_id", channelId).is("parent_id", null)
      .order("created_at", { ascending: false });
    const top = data ?? [];
    setPosts(top);
    setPostsLoading(false);
    if (top.length > 0) {
      const { data: rd } = await supabase.from("community_posts")
        .select("parent_id").in("parent_id", top.map(p => p.id));
      const c: Record<string,number> = {};
      (rd ?? []).forEach(r => { if (r.parent_id) c[r.parent_id] = (c[r.parent_id] ?? 0) + 1; });
      setReplyCounts(c);
    }
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    getCurrentUsername().then(setCurrentUser);
    getChannel(channelId).then(ch => {
      if (!ch) { setNotFound(true); setLoading(false); return; }
      setChannel(ch);
      setLoading(false);
      const saved = localStorage.getItem(`embar-channel-theme-${channelId}`);
      if (saved === "light" || saved === "dark" || saved === "community") setViewMode(saved as "light"|"dark"|"community");
    });
    fetch(`/api/channel-feed?channelId=${channelId}`)
      .then(r => r.json()).then(d => { setVideos(d.videos ?? []); setVidLoading(false); })
      .catch(() => setVidLoading(false));
  }, [channelId]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  async function postSpark() {
    if (!sparkBody.trim() || !currentUser || !channelId) return;
    setSparkPosting(true);
    await supabase.from("community_posts").insert({ channel_id:channelId, author:currentUser, type:"spark", body:sparkBody.trim(), parent_id:null, tags:[] });
    await loadPosts(); setSparkBody(""); setSparkOpen(false); setSparkPosting(false);
  }
  async function postForum() {
    if (!fTitle.trim() || !fBody.trim() || !currentUser || !channelId) return;
    setFPosting(true);
    const userTags = fTags.split(",").map(t => t.trim()).filter(Boolean);
    const tags = [`__s:${fStatus}`, ...userTags];
    await supabase.from("community_posts").insert({ channel_id:channelId, author:currentUser, type:"forum", title:fTitle.trim(), body:fBody.trim(), parent_id:null, tags });
    await loadPosts(); setFTitle(""); setFBody(""); setFTags(""); setFStatus("open"); setForumOpen(false); setFPosting(false);
  }
  async function postRead() {
    if (!rTitle.trim() || !rBody.trim() || !currentUser || !channelId) return;
    setRPosting(true);
    const userTags = rTags.split(",").map(t => t.trim()).filter(Boolean);
    const tags = [`__c:${rCategory}`, ...userTags];
    await supabase.from("community_posts").insert({ channel_id:channelId, author:currentUser, type:"read", title:rTitle.trim(), body:rBody.trim(), parent_id:null, tags });
    await loadPosts(); setRTitle(""); setRBody(""); setRTags(""); setRCategory("essay"); setReadOpen(false); setRPosting(false);
  }
  async function openThread(post: CommPost) {
    setOpenPost(post); setRepliesLoad(true); setReplies([]);
    const { data } = await supabase.from("community_posts").select("*").eq("parent_id", post.id).order("created_at", { ascending: true });
    setReplies(data ?? []); setRepliesLoad(false);
  }
  function closeThread() { setOpenPost(null); setReplies([]); setReplyBody(""); }
  async function postReply() {
    if (!replyBody.trim() || !currentUser || !openPost) return;
    setReplyPosting(true);
    await supabase.from("community_posts").insert({ channel_id:channelId, author:currentUser, type:openPost.type, body:replyBody.trim(), parent_id:openPost.id, tags:[] });
    const { data } = await supabase.from("community_posts").select("*").eq("parent_id", openPost.id).order("created_at", { ascending: true });
    setReplies(data ?? []);
    setReplyCounts(p => ({ ...p, [openPost.id]: (p[openPost.id] ?? 0) + 1 }));
    setReplyBody(""); setReplyPosting(false);
  }
  function changeSection(s: CommSection) { setSection(s); closeThread(); setSearch(""); setSparkOpen(false); }
  function changeViewMode(m: "light"|"dark"|"community") {
    setViewMode(m);
    if (channel) localStorage.setItem(`embar-channel-theme-${channel.youtube_channel_id}`, m);
  }

  const communityTheme = channel ? defaultCommunityTheme(channel.name) : null;
  const AB = "var(--accent-bright, #4ABA5A)";
  const A  = "var(--accent)";
  const CORAL = "var(--coral)";

  function bySearch(list: CommPost[]) {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(p => p.title?.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q)));
  }
  const sparkPosts = bySearch([...posts.filter(p => p.type==="spark")].sort((a,b) => {
    if (sparkSort==="new") return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
    return (replyCounts[b.id]??0)-(replyCounts[a.id]??0);
  }));
  const forumPosts = bySearch(posts.filter(p => p.type==="forum").filter(p => {
    if (forumStatusFilter === "all") return true;
    return getForumStatus(p) === forumStatusFilter;
  }));
  const readPosts = bySearch(posts.filter(p => p.type==="read").filter(p => {
    if (readCatFilter === "all") return true;
    return getReadCategory(p) === readCatFilter;
  }));
  const streamPosts = bySearch(streamFilter==="all" ? posts : posts.filter(p => p.type===streamFilter));
  const totalPosts  = posts.length;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontFamily:F.body, fontSize:13, color:"var(--text-muted)" }}>Loading channel...</span>
    </div>
  );
  if (notFound) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <span style={{ fontSize:32 }}>▶</span>
      <span style={{ fontFamily:F.syne, fontSize:16, fontWeight:700, color:"var(--text)" }}>Channel not found</span>
      <a href="/youtube" style={{ fontFamily:F.body, fontSize:13, color:A, textDecoration:"none" }}>← Back to channels</a>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      <Nav activePage="youtube" communityTheme={communityTheme ?? undefined} viewMode={viewMode} onViewModeChange={changeViewMode} />

      {/* ── CHANNEL HEADER ── */}
      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        <div style={{ height:3, background:"linear-gradient(90deg,var(--accent) 0%,var(--accent-bright,#4ABA5A) 50%,var(--coral) 100%)" }} />
        <div style={{ padding:"14px 24px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            {channel?.thumbnail_url ? (
              <img src={channel.thumbnail_url} alt={channel.name}
                style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", border:`2px solid ${A}`, boxShadow:"0 0 0 4px rgba(42,122,58,.13)", flexShrink:0 }} />
            ) : (
              <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(145deg,#1A3E22,#2A5A32)", border:`2px solid ${A}`, boxShadow:"0 0 0 4px rgba(42,122,58,.13)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.syne, fontSize:17, fontWeight:800, color:AB }}>
                {channel?.name[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                <span style={{ fontFamily:F.syne, fontSize:17, fontWeight:700, color:"var(--text)", letterSpacing:"-.025em" }}>{channel?.name}</span>
                <span style={{ fontFamily:F.body, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:999, background:"rgba(232,168,48,.1)", color:"#D4A838", letterSpacing:".07em", textTransform:"uppercase", border:"1px solid rgba(232,168,48,.22)" }}>▶ YouTube</span>
                {communityTheme && <span style={{ fontFamily:F.body, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:999, background:"rgba(42,122,58,.14)", color:AB, letterSpacing:".07em", textTransform:"uppercase", border:"1px solid rgba(42,122,58,.3)" }}>{communityTheme.label}</span>}
              </div>
              <div style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)", marginBottom:8 }}>
                847 members{channel?.added_by ? ` · Added by ${channel.added_by}` : ""}
              </div>
              <div style={{ display:"flex", gap:7 }}>
                <a href={channel?.youtube_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily:F.body, fontSize:11.5, fontWeight:500, padding:"4px 13px", borderRadius:999, border:"1px solid var(--border-strong)", background:"transparent", color:"var(--text-mid)", cursor:"pointer", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:5 }}>▶ View on YouTube</a>
                {currentUser && <button style={{ fontFamily:F.body, fontSize:11.5, fontWeight:600, padding:"4px 14px", borderRadius:999, border:"none", background:A, color:"var(--text)", cursor:"pointer" }}>+ Join community</button>}
              </div>
            </div>
            <div style={{ display:"flex", gap:20, paddingLeft:20, borderLeft:"1px solid var(--border)", flexShrink:0 }}>
              {[{label:"Members",val:"847"},{label:"Posts",val:String(totalPosts)},{label:"Online",val:"43",dot:true}].map(s => (
                <div key={s.label} style={{ textAlign:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    <span style={{ fontFamily:F.syne, fontSize:18, fontWeight:700, color:"var(--text)", lineHeight:1.1 }}>{s.val}</span>
                    {s.dot && <span style={{ width:5, height:5, borderRadius:"50%", background:AB, display:"inline-block", boxShadow:"0 0 5px rgba(74,186,90,.75)" }} />}
                  </div>
                  <div style={{ fontFamily:F.body, fontSize:9, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".08em", marginTop:1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Page tabs */}
          <div style={{ display:"flex", gap:3, paddingTop:6, paddingBottom:10 }}>
            {([["community","Community"],["videos",`Videos${videos.length?` (${videos.length})`:"(0)"}`],["about","About"]] as [PageTab,string][]).map(([id,label]) => (
              <button key={id} onClick={() => setPageTab(id)} style={{
                fontFamily:F.body, fontSize:12, fontWeight:pageTab===id ? 600 : 400, padding:"5px 14px", borderRadius:999, border:"none",
                background:pageTab===id ? "var(--surface2)" : "transparent",
                color:pageTab===id ? "var(--text)" : "var(--text-muted)", cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMMUNITY TAB ── */}
      {pageTab === "community" && (
        <div style={{ display:"flex", flex:1 }}>
          {/* SIDEBAR */}
          <div style={{ width:208, flexShrink:0, background:"var(--surface)", borderRight:"1px solid var(--border)", padding:"12px 8px", display:"flex", flexDirection:"column", gap:1, minHeight:"calc(100vh - 200px)" }}>
            <div style={{ fontFamily:F.syne, fontSize:"8.5px", fontWeight:700, color:"var(--text-muted)", letterSpacing:".14em", textTransform:"uppercase", padding:"6px 10px 5px" }}>Community</div>
            {SIDEBAR_ITEMS.map(item => {
              const active = section === item.id;
              const isReads = item.id === "read";
              const accentCol = isReads ? "var(--coral)" : A;
              const countBg   = isReads ? (active ? "var(--coral)" : "#231610") : (active ? A : "#162A18");
              const countCol  = isReads ? (active ? "#1A0A04" : "var(--text-muted)") : (active ? "#C0F0C8" : "var(--text-muted)");
              const count = item.id==="spark" ? sparkPosts.length : item.id==="forum" ? forumPosts.length : item.id==="read" ? posts.filter(p=>p.type==="read").length : 0;
              return (
                <button key={item.id} onClick={() => changeSection(item.id)} style={{
                  display:"flex", alignItems:"center", gap:9,
                  padding: active ? "7px 8px 7px 7px" : "7px 10px",
                  borderRadius:7, border:"none", borderLeft:active?`2.5px solid ${accentCol}`:"2.5px solid transparent",
                  background:active?(isReads?"#231610":"var(--surface2)"):"transparent", cursor:"pointer", width:"100%", textAlign:"left",
                }}>
                  {item.ico(active ? (isReads ? "var(--coral)" : "#4ABA5A") : "var(--text-muted)")}
                  <span style={{ fontFamily:F.body, fontSize:12.5, fontWeight:active?600:400, color:active?"var(--text)":"var(--text-muted)", flex:1 }}>{item.label}</span>
                  {count > 0 && <span style={{ fontFamily:F.body, fontSize:"8.5px", fontWeight:700, borderRadius:999, padding:"1px 6px", lineHeight:1.7, background:countBg, color:countCol }}>{count}</span>}
                </button>
              );
            })}

            <div style={{ height:1, background:"var(--border)", margin:"5px 2px" }} />
            <div style={{ fontFamily:F.syne, fontSize:"8.5px", fontWeight:700, color:"var(--text-muted)", letterSpacing:".14em", textTransform:"uppercase", padding:"3px 10px 5px" }}>Live</div>
            {LIVE_ITEMS.map(item => {
              const active = section === item.id;
              return (
                <button key={item.id} onClick={() => changeSection(item.id)} style={{
                  display:"flex", alignItems:"center", gap:9,
                  padding: active ? "7px 8px 7px 7px" : "7px 10px",
                  borderRadius:7, border:"none", borderLeft:active?`2.5px solid ${A}`:"2.5px solid transparent",
                  background:active?"var(--surface2)":"transparent", cursor:"pointer", width:"100%", textAlign:"left",
                }}>
                  {item.ico(active?"#4ABA5A":"var(--text-muted)")}
                  <span style={{ fontFamily:F.body, fontSize:12.5, fontWeight:active?600:400, color:active?"var(--text)":"var(--text-muted)", flex:1 }}>{item.label}</span>
                  {item.id==="chat" && <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ABA5A", boxShadow:"0 0 6px rgba(74,186,90,.65)", flexShrink:0 }} />}
                </button>
              );
            })}

            <div style={{ flex:1, minHeight:10 }} />
            <div style={{ borderTop:"1px solid var(--border)", padding:"10px 8px 4px" }}>
              <div style={{ fontFamily:F.syne, fontSize:"8px", fontWeight:700, color:"var(--text-muted)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:8 }}>Online · 43</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {ONLINE_AVATARS.map(av => (
                  <div key={av.i} style={{ width:22, height:22, borderRadius:"50%", background:av.bg, border:`1.5px solid ${av.bd}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.syne, fontSize:8, fontWeight:700, color:av.c }}>{av.i}</div>
                ))}
                <div style={{ width:22, height:22, borderRadius:"50%", background:"var(--surface)", border:"1.5px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.body, fontSize:8, fontWeight:700, color:"var(--text-muted)" }}>+38</div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div style={{ flex:1, overflowY:"auto", background:"var(--bg)", padding:"18px 22px 40px" }}>

            {/* STREAM */}
            {section==="stream" && !openPost && (
              <>
                <SHdr icon={IcoStream("#4ABA5A")} title="Stream" sub="Everything happening in this community" />
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
                  <div style={{ display:"flex", gap:8, marginBottom:9 }}>
                    <SBox placeholder="Search everything in this community..." value={search} onChange={setSearch} />
                    <DdBtn label="Date: Any" />
                    <DdBtn label="Author" />
                    <DdBtn label="Tags" />
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    {(["all","spark","forum","read","wiki"] as StreamFilter[]).map(f => (
                      <ChipBtn key={f} label={f==="all"?"All":f==="spark"?"✦ Sparks":f==="forum"?"⊞ Forums":f==="read"?"◈ Reads":"⊟ Wiki"}
                        active={streamFilter===f} onClick={() => setStreamFilter(f)} />
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {postsLoading ? <Spin/>
                    : streamPosts.length === 0
                    ? <Empty icon={IcoStream("#4ABA5A")} title="Nothing here yet" sub="Posts from all sections appear here once the community gets going." />
                    : streamPosts.map(p => <StreamCard key={p.id} post={p} replyCount={replyCounts[p.id]??0} onClick={() => openThread(p)} AB="#4ABA5A" />)}
                </div>
              </>
            )}

            {/* SPARKS */}
            {section==="spark" && !openPost && (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:13 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    {IcoSpark("#4ABA5A")}
                    <span style={{ fontFamily:F.syne, fontSize:16, fontWeight:700, color:"var(--text)", letterSpacing:"-.025em" }}>Sparks</span>
                    <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{sparkPosts.length} conversation{sparkPosts.length!==1?"s":""}</span>
                  </div>
                  {currentUser && (
                    <button onClick={() => setSparkOpen(v=>!v)} style={{ fontFamily:F.body, fontSize:12, fontWeight:600, padding:"7px 15px", borderRadius:8, border:"none", background:A, color:"var(--text)", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                      <span>✦</span> Start a spark
                    </button>
                  )}
                </div>

                {sparkOpen && currentUser && (
                  <div style={{ background:"var(--surface)", border:"1px solid var(--border-strong)", borderRadius:10, padding:14, marginBottom:13 }}>
                    <textarea autoFocus placeholder="What's on your mind? Start a conversation..." value={sparkBody}
                      onChange={e => setSparkBody(e.target.value.slice(0,500))} rows={3}
                      onKeyDown={e => { if (e.key==="Enter" && e.ctrlKey) { e.preventDefault(); postSpark(); }}}
                      style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:8, background:"var(--bg)", color:"var(--text)", fontSize:13, fontFamily:F.body, outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.6 }}
                      onFocus={e=>{e.currentTarget.style.borderColor=A;}} onBlur={e=>{e.currentTarget.style.borderColor="var(--border)";}}
                    />
                    <div style={{ display:"flex", justifyContent:"flex-end", gap:7, marginTop:9 }}>
                      <button onClick={() => { setSparkOpen(false); setSparkBody(""); }} style={{ fontFamily:F.body, fontSize:12, padding:"6px 14px", borderRadius:7, border:"1px solid var(--border)", background:"none", color:"var(--text-muted)", cursor:"pointer" }}>Cancel</button>
                      <button onClick={postSpark} disabled={!sparkBody.trim()||sparkPosting} style={{ fontFamily:F.body, fontSize:12, fontWeight:600, padding:"6px 18px", borderRadius:7, border:"none", background:sparkBody.trim()?A:"var(--surface2)", color:sparkBody.trim()?"var(--text)":"var(--text-muted)", cursor:sparkBody.trim()?"pointer":"default" }}>
                        {sparkPosting?"Posting…":"Post Spark"}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                  <SBox placeholder="Search sparks, topics, tags..." value={search} onChange={setSearch} />
                  <div style={{ display:"flex", gap:1, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:3 }}>
                    {(["hot","new","top"] as SparkSort[]).map(s => (
                      <button key={s} onClick={() => setSparkSort(s)} style={{ fontFamily:F.body, fontSize:11.5, fontWeight:sparkSort===s?600:400, padding:"4px 11px", borderRadius:6, border:"none", background:sparkSort===s?"var(--surface2)":"transparent", color:sparkSort===s?"var(--text)":"var(--text-muted)", cursor:"pointer" }}>
                        {s.charAt(0).toUpperCase()+s.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:7, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 12px", cursor:"pointer" }}>
                    <IcoFilter/><span style={{ fontFamily:F.body, fontSize:12, color:"var(--text-muted)" }}>Filter</span>
                  </div>
                </div>

                {postsLoading ? <Spin/>
                  : sparkPosts.length===0
                  ? <Empty icon={IcoSpark("#4ABA5A")} title="No Sparks yet" sub="Start the first spark — a question, take, or thought." action={currentUser?{label:"Start a spark",onClick:()=>setSparkOpen(true)}:undefined} />
                  : sparkPosts.map(p => <SparkCard key={p.id} post={p} replyCount={replyCounts[p.id]??0} onClick={() => openThread(p)} A={A} />)}
              </>
            )}

            {/* FORUMS */}
            {section==="forum" && !openPost && (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:13 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    {IcoForum("#4ABA5A")}
                    <span style={{ fontFamily:F.syne, fontSize:16, fontWeight:700, color:"var(--text)", letterSpacing:"-.025em" }}>Forums</span>
                    <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{posts.filter(p=>p.type==="forum").length} topics · {Object.values(replyCounts).reduce((a,b)=>a+b,0)} replies</span>
                  </div>
                  {currentUser && (
                    <button onClick={() => setForumOpen(true)} style={{ fontFamily:F.body, fontSize:12, fontWeight:600, padding:"7px 15px", borderRadius:8, border:"none", background:A, color:"var(--text)", cursor:"pointer" }}>+ New Topic</button>
                  )}
                </div>

                {/* Search + sort */}
                <div style={{ display:"flex", gap:8, marginBottom:11 }}>
                  <SBox placeholder="Search topics, tags, keywords..." value={search} onChange={setSearch} />
                  <DdBtn label="Sort: Latest" />
                </div>

                {/* Filter chips — driven by FORUM_STATUSES */}
                <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                  <ChipBtn label="All" active={forumStatusFilter==="all"} onClick={() => setForumStatusFilter("all")} />
                  {FORUM_STATUSES.map(s => (
                    <button key={s.id} onClick={() => setForumStatusFilter(forumStatusFilter===s.id?"all":s.id)} style={{
                      fontFamily:F.body, fontSize:11, fontWeight:forumStatusFilter===s.id?600:400,
                      padding:"4px 12px", borderRadius:999, cursor:"pointer",
                      background: forumStatusFilter===s.id ? s.bg : "transparent",
                      color: forumStatusFilter===s.id ? s.col : "var(--text-muted)",
                      border: forumStatusFilter===s.id ? `1px solid ${s.bd}` : "1px solid var(--border)",
                    }}>{s.label}</button>
                  ))}
                </div>

                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
                  {postsLoading ? <div style={{ padding:24 }}><Spin/></div>
                    : forumPosts.length===0
                    ? <div style={{ padding:40 }}><Empty icon={IcoForum("#4ABA5A")} title="No threads yet" sub="Start the first forum thread." action={currentUser?{label:"New Topic",onClick:()=>setForumOpen(true)}:undefined} /></div>
                    : forumPosts.map((p,i) => <ForumRow key={p.id} post={p} replyCount={replyCounts[p.id]??0} isLast={i===forumPosts.length-1} onClick={() => openThread(p)} A={A} />)}
                </div>
              </>
            )}

            {/* READS */}
            {section==="read" && !openPost && (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:13 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    {IcoReads("var(--coral)")}
                    <span style={{ fontFamily:F.syne, fontSize:16, fontWeight:700, color:"var(--text)", letterSpacing:"-.025em" }}>Reads</span>
                    <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{posts.filter(p=>p.type==="read").length} essays · {new Set(posts.filter(p=>p.type==="read").map(p=>p.author)).size} authors</span>
                  </div>
                  {currentUser && (
                    <button onClick={() => setReadOpen(true)} style={{ fontFamily:F.body, fontSize:12, fontWeight:600, padding:"7px 15px", borderRadius:8, border:"none", background:CORAL, color:"#1A0A04", cursor:"pointer" }}>✎ Write a Read</button>
                  )}
                </div>

                {/* Category filter chips — driven by READ_CATEGORIES */}
                <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
                  <button onClick={() => setReadCatFilter("all")} style={{
                    fontFamily:F.body, fontSize:11, fontWeight:readCatFilter==="all"?600:400,
                    padding:"4px 12px", borderRadius:999, cursor:"pointer",
                    background: readCatFilter==="all" ? "#231610" : "transparent",
                    color: readCatFilter==="all" ? "var(--coral)" : "var(--text-muted)",
                    border: readCatFilter==="all" ? "1px solid rgba(212,132,90,.35)" : "1px solid var(--border)",
                  }}>All</button>
                  {READ_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setReadCatFilter(readCatFilter===c.id?"all":c.id)} style={{
                      fontFamily:F.body, fontSize:11, fontWeight:readCatFilter===c.id?600:400,
                      padding:"4px 12px", borderRadius:999, cursor:"pointer",
                      background: readCatFilter===c.id ? c.bg : "transparent",
                      color: readCatFilter===c.id ? c.col : "var(--text-muted)",
                      border: readCatFilter===c.id ? `1px solid ${c.bd}` : "1px solid var(--border)",
                    }}>{c.label}</button>
                  ))}
                </div>

                {postsLoading ? <Spin/>
                  : readPosts.length===0
                  ? <Empty icon={IcoReads("var(--coral)")} title="No Reads yet" sub="The first essay in this community hasn't been written yet." action={currentUser?{label:"Write the first Read",onClick:()=>setReadOpen(true)}:undefined} />
                  : (
                    <>
                      <ReadFeatured post={readPosts[0]} replyCount={replyCounts[readPosts[0].id]??0} onClick={() => openThread(readPosts[0])} />
                      {readPosts.length > 1 && (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10, marginTop:10 }}>
                          {readPosts.slice(1).map(p => <ReadCard key={p.id} post={p} replyCount={replyCounts[p.id]??0} onClick={() => openThread(p)} />)}
                        </div>
                      )}
                    </>
                  )}
              </>
            )}

            {/* WIKI */}
            {section==="wiki" && (
              <>
                <SHdr icon={IcoWiki("#4ABA5A")} title="Wiki" sub="Community knowledge base" />
                <div style={{ marginTop:32 }}><Empty icon={IcoWiki("#4ABA5A")} title="Wiki coming soon" sub="Trusted members will write and maintain articles here." /></div>
              </>
            )}

            {/* CHAT */}
            {section==="chat" && (
              <>
                <SHdr icon={IcoChat("#4ABA5A")} title="Chat" sub="Live conversation" />
                <div style={{ marginTop:32 }}><Empty icon={IcoChat("#4ABA5A")} title="Chat coming soon" sub="Real-time community chat will live here." /></div>
              </>
            )}

            {/* GATHERINGS */}
            {section==="gathering" && (
              <>
                <SHdr icon={IcoGather("#4ABA5A")} title="Gatherings" sub="Events and watch parties" />
                <div style={{ marginTop:32 }}><Empty icon={IcoGather("#4ABA5A")} title="Gatherings coming soon" sub="Community events and watch parties will be organised here." /></div>
              </>
            )}

            {/* THREAD VIEW */}
            {openPost && (
              <ThreadView
                post={openPost} replies={replies} repliesLoading={repliesLoad}
                replyBody={replyBody} setReplyBody={setReplyBody}
                onReply={postReply} replyPosting={replyPosting}
                currentUser={currentUser} A={A}
                onBack={closeThread}
                backLabel={openPost.type==="spark"?"← Back to Sparks":openPost.type==="forum"?"← Back to Forums":"← Back to Reads"}
              />
            )}
          </div>
        </div>
      )}

      {/* ── VIDEOS TAB ── */}
      {pageTab==="videos" && (
        <div style={{ padding:"24px 24px 80px" }}>
          {vidLoading ? (
            <div style={{ textAlign:"center", padding:"60px 0", fontFamily:F.body, fontSize:13, color:"var(--text-muted)" }}>Loading videos...</div>
          ) : videos.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", fontFamily:F.body, fontSize:13, color:"var(--text-muted)" }}>No videos found.</div>
          ) : (
            <>
              <div style={{ fontFamily:F.body, fontSize:12, color:"var(--text-muted)", marginBottom:14 }}>{videos.length} most recent · updated automatically</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
                {videos.map(v => (
                  <a key={v.videoId} href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", transition:"border-color .12s,transform .12s" }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLElement).style.borderColor="var(--border-strong)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.borderColor="var(--border)";}}>
                      <div style={{ position:"relative", paddingBottom:"56.25%", background:"var(--surface2)" }}>
                        <img src={v.thumbnail} alt={v.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                      <div style={{ padding:"12px 14px" }}>
                        <div style={{ fontFamily:F.body, fontSize:13, fontWeight:500, color:"var(--text)", lineHeight:1.4, marginBottom:5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{v.title}</div>
                        <div style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{timeAgo(v.published)}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ABOUT TAB ── */}
      {pageTab==="about" && (
        <div style={{ padding:"24px 24px 80px" }}>
          <div style={{ maxWidth:600, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24 }}>
            <div style={{ fontFamily:F.syne, fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:10 }}>{channel?.name}</div>
            {channel?.description
              ? <p style={{ fontFamily:F.body, fontSize:13, color:"var(--text-mid)", lineHeight:1.7 }}>{channel.description}</p>
              : <p style={{ fontFamily:F.body, fontSize:13, color:"var(--text-muted)", fontStyle:"italic" }}>No description available.</p>}
            {channel?.category && (
              <div style={{ marginTop:14, display:"flex", gap:7 }}>
                <span style={{ fontFamily:F.body, fontSize:11, padding:"3px 10px", background:"var(--surface2)", color:"var(--text-muted)", borderRadius:999 }}>{catLabel(channel.category)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FORUM MODAL ── */}
      {forumOpen && (
        <BigModal title="Start a Thread" onClose={() => setForumOpen(false)}>
          <MField label="Title *" value={fTitle} onChange={setFTitle} placeholder="What's this thread about?" autoFocus />

          {/* Status picker */}
          <div>
            <label style={{ fontFamily:F.body, fontSize:12, fontWeight:500, color:"var(--text-mid)", display:"block", marginBottom:8 }}>Thread type</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {FORUM_STATUSES.filter(s => !["hot","pinned","answered"].includes(s.id)).map(s => (
                <button key={s.id} onClick={() => setFStatus(s.id)} style={{
                  fontFamily:F.body, fontSize:11, fontWeight:fStatus===s.id?600:400,
                  padding:"5px 14px", borderRadius:999, cursor:"pointer",
                  background: fStatus===s.id ? s.bg : "transparent",
                  color: fStatus===s.id ? s.col : "var(--text-muted)",
                  border: fStatus===s.id ? `1px solid ${s.bd}` : "1px solid var(--border)",
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Rich editor */}
          <div>
            <label style={{ fontFamily:F.body, fontSize:12, fontWeight:500, color:"var(--text-mid)", display:"block", marginBottom:8 }}>Body *</label>
            <RichEditor placeholder="Share your thoughts, question, or discussion…" onChange={setFBody} minHeight={180} />
          </div>

          <MField label="Tags (optional)" value={fTags} onChange={setFTags} placeholder="philosophy, sources, science (comma-separated)" />

          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={() => setForumOpen(false)} style={{ fontFamily:F.body, fontSize:13, padding:"10px 18px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--text-muted)", cursor:"pointer" }}>Cancel</button>
            <button onClick={postForum} disabled={!fTitle.trim()||!fBody.trim()||fPosting} style={{ flex:1, fontFamily:F.body, fontSize:13, fontWeight:600, padding:10, borderRadius:9, border:"none", background:fTitle.trim()&&fBody.trim()?A:"var(--surface2)", color:fTitle.trim()&&fBody.trim()?"var(--text)":"var(--text-muted)", cursor:fTitle.trim()&&fBody.trim()?"pointer":"default" }}>{fPosting?"Posting…":"Post Thread"}</button>
          </div>
        </BigModal>
      )}

      {/* ── READ MODAL ── */}
      {readOpen && (
        <BigModal title="Write a Read" onClose={() => setReadOpen(false)}>
          <MField label="Title *" value={rTitle} onChange={setRTitle} placeholder="Your essay title" autoFocus />

          {/* Category picker */}
          <div>
            <label style={{ fontFamily:F.body, fontSize:12, fontWeight:500, color:"var(--text-mid)", display:"block", marginBottom:8 }}>Category</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {READ_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setRCategory(c.id)} style={{
                  fontFamily:F.body, fontSize:11, fontWeight:rCategory===c.id?600:400,
                  padding:"5px 14px", borderRadius:999, cursor:"pointer",
                  background: rCategory===c.id ? c.bg : "transparent",
                  color: rCategory===c.id ? c.col : "var(--text-muted)",
                  border: rCategory===c.id ? `1px solid ${c.bd}` : "1px solid var(--border)",
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Rich editor */}
          <div>
            <label style={{ fontFamily:F.body, fontSize:12, fontWeight:500, color:"var(--text-mid)", display:"block", marginBottom:8 }}>Body *</label>
            <RichEditor placeholder="Write your essay, analysis, or personal piece…" onChange={setRBody} minHeight={240} />
          </div>

          <MField label="Tags (optional)" value={rTags} onChange={setRTags} placeholder="animation, philosophy, media (comma-separated)" />

          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={() => setReadOpen(false)} style={{ fontFamily:F.body, fontSize:13, padding:"10px 18px", borderRadius:9, border:"1px solid var(--border)", background:"var(--surface2)", color:"var(--text-muted)", cursor:"pointer" }}>Cancel</button>
            <button onClick={postRead} disabled={!rTitle.trim()||!rBody.trim()||rPosting} style={{ flex:1, fontFamily:F.body, fontSize:13, fontWeight:600, padding:10, borderRadius:9, border:"none", background:rTitle.trim()&&rBody.trim()?"var(--coral)":"var(--surface2)", color:rTitle.trim()&&rBody.trim()?"#1A0A04":"var(--text-muted)", cursor:rTitle.trim()&&rBody.trim()?"pointer":"default" }}>{rPosting?"Publishing…":"Publish Read"}</button>
          </div>
        </BigModal>
      )}
    </div>
  );
}

// ── Shared atoms ───────────────────────────────────────────────────────────────

function SHdr({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:13 }}>
      {icon}
      <span style={{ fontFamily:F.syne, fontSize:16, fontWeight:700, color:"var(--text)", letterSpacing:"-.025em" }}>{title}</span>
      <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{sub}</span>
    </div>
  );
}

function SBox({ placeholder, value, onChange }: { placeholder:string; value:string; onChange:(v:string)=>void }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 13px" }}>
      <IcoSearch/>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:F.body, fontSize:12, color:"var(--text)", padding:0 }}
        onFocus={e=>{(e.currentTarget.closest("div") as HTMLElement)!.style.borderColor="var(--border-strong)";}}
        onBlur={e=>{(e.currentTarget.closest("div") as HTMLElement)!.style.borderColor="var(--border)";}} />
    </div>
  );
}

function DdBtn({ label }: { label:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:7, padding:"6px 11px", cursor:"pointer" }}>
      <span style={{ fontFamily:F.body, fontSize:11.5, color:"var(--text-muted)" }}>{label}</span>
      <IcoChevron/>
    </div>
  );
}

function ChipBtn({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return <button onClick={onClick} style={{ fontFamily:F.body, fontSize:11, fontWeight:active?600:400, padding:"4px 12px", borderRadius:999, border:active?"none":"1px solid var(--border)", background:active?"var(--surface2)":"transparent", color:active?"var(--text)":"var(--text-muted)", cursor:"pointer" }}>{label}</button>;
}

function TagPill({ tag }: { tag:string }) {
  return <span style={{ fontFamily:F.body, fontSize:"9.5px", fontWeight:600, padding:"2px 8px", borderRadius:999, background:"rgba(42,122,58,.1)", color:"#6AB870", border:"1px solid rgba(42,122,58,.18)" }}>#{tag}</span>;
}

function Av({ name, size=26 }: { name:string; size?:number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"#1E4228", border:"1.5px solid #2A6038", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.syne, fontSize:Math.floor(size*0.38), fontWeight:700, color:"#60B870", flexShrink:0 }}>
      {name.slice(0,2).toUpperCase()}
    </div>
  );
}

function Spin() { return <div style={{ textAlign:"center", padding:"30px 0", fontFamily:F.body, fontSize:12, color:"var(--text-muted)" }}>Loading...</div>; }

function Empty({ icon, title, sub, action }: { icon:React.ReactNode; title:string; sub:string; action?:{label:string;onClick:()=>void} }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"44px 20px", textAlign:"center" }}>
      <div style={{ width:44, height:44, borderRadius:12, border:"1.5px solid var(--border-strong)", display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
      <div style={{ fontFamily:F.syne, fontSize:14, fontWeight:700, color:"var(--text)" }}>{title}</div>
      <div style={{ fontFamily:F.body, fontSize:12, color:"var(--text-muted)", maxWidth:300, lineHeight:1.65 }}>{sub}</div>
      {action && <button onClick={action.onClick} style={{ marginTop:4, fontFamily:F.body, fontSize:12, fontWeight:600, padding:"8px 18px", borderRadius:8, border:"none", background:"var(--accent)", color:"var(--text)", cursor:"pointer" }}>{action.label}</button>}
    </div>
  );
}

// ── Stream card ────────────────────────────────────────────────────────────────
const TYPE_META: Record<string,{label:string;col:string;bg:string}> = {
  spark: { label:"✦ Spark", col:"#4ABA5A", bg:"rgba(42,122,58,.13)" },
  forum: { label:"⊞ Forum", col:"var(--text-mid)", bg:"var(--surface2)" },
  read:  { label:"◈ Read",  col:"var(--coral)", bg:"rgba(212,132,90,.1)" },
  wiki:  { label:"⊟ Wiki",  col:"var(--text-muted)", bg:"var(--surface2)" },
};
function StreamCard({ post, replyCount, onClick, AB }: { post:CommPost; replyCount:number; onClick:()=>void; AB:string }) {
  const [h,setH] = useState(false);
  const t = TYPE_META[post.type] ?? TYPE_META.spark;
  const visibleTags = getVisibleTags(post);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:"var(--surface)", border:`1px solid ${h?"var(--border-strong)":"var(--border)"}`, borderRadius:10, overflow:"hidden", display:"flex", cursor:"pointer", transition:"border-color .12s" }}>
      <div style={{ width:3, background:t.col, flexShrink:0 }} />
      <div style={{ padding:"12px 15px", flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
          <span style={{ fontFamily:F.syne, fontSize:"8.5px", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:t.col, background:t.bg, padding:"1px 7px", borderRadius:999, border:`1px solid ${t.col}40` }}>{t.label}</span>
          <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{post.author}</span>
          <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)", marginLeft:"auto" }}>{timeAgo(post.created_at)}</span>
        </div>
        {post.title && <div style={{ fontFamily:F.syne, fontSize:13, fontWeight:600, color:"var(--text)", lineHeight:1.35, marginBottom:5 }}>{post.title}</div>}
        <div style={{ fontFamily:F.body, fontSize:12, color:"var(--text-mid)", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", marginBottom:visibleTags.length?7:0 }} dangerouslySetInnerHTML={{__html: post.body}} />
        {visibleTags.length>0 && <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:7 }}>{visibleTags.map(tg=><TagPill key={tg} tag={tg}/>)}</div>}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>{IcoReplyBubble("var(--text-muted)")}<span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{replyCount} replies</span></div>
          <span style={{ fontFamily:F.body, fontSize:11, fontWeight:600, color:AB, marginLeft:"auto", opacity:h?1:0, transition:"opacity .1s" }}>Open →</span>
        </div>
      </div>
    </div>
  );
}

// ── Spark card ─────────────────────────────────────────────────────────────────
function SparkCard({ post, replyCount, onClick, A }: { post:CommPost; replyCount:number; onClick:()=>void; A:string }) {
  const [h,setH] = useState(false);
  const visibleTags = getVisibleTags(post);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:"var(--surface)", border:`1px solid ${h?"var(--border-strong)":"var(--border)"}`, borderRadius:10, padding:"14px 16px", cursor:"pointer", marginBottom:9, transition:"border-color .12s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
        <Av name={post.author} size={26} />
        <span style={{ fontFamily:F.body, fontSize:12, fontWeight:600, color:"var(--text-mid)" }}>{post.author}</span>
        <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)", marginLeft:"auto" }}>{timeAgo(post.created_at)}</span>
      </div>
      {post.title && <div style={{ fontFamily:F.syne, fontSize:14.5, fontWeight:600, color:"var(--text)", lineHeight:1.35, marginBottom:6, letterSpacing:"-.015em" }}>{post.title}</div>}
      <div style={{ fontFamily:F.body, fontSize:12, color:"var(--text-mid)", lineHeight:1.6, marginBottom:11, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{post.body}</div>
      {visibleTags.length>0 && <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>{visibleTags.map(tg=><TagPill key={tg} tag={tg}/>)}</div>}
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}><IcoFlame/><span style={{ fontFamily:F.body, fontSize:11, fontWeight:600, color:"var(--coral)" }}>0</span></div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>{IcoReplyBubble("var(--text-muted)")}<span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{replyCount} replies</span></div>
        <span style={{ fontFamily:F.body, fontSize:11, fontWeight:600, color:"#4ABA5A", marginLeft:"auto" }}>View thread →</span>
      </div>
    </div>
  );
}

// ── Forum row ──────────────────────────────────────────────────────────────────
function ForumRow({ post, replyCount, isLast, onClick, A }: { post:CommPost; replyCount:number; isLast:boolean; onClick:()=>void; A:string }) {
  const [h,setH] = useState(false);
  const statusId = getForumStatus(post);
  const s = statusMeta(statusId);
  const visibleTags = getVisibleTags(post);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ padding:"14px 16px", borderBottom:isLast?"none":"1px solid var(--border)", cursor:"pointer", background:h?"var(--surface2)":"transparent", transition:"background .1s" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        {/* Status badge — driven by config */}
        <div style={{ flexShrink:0, paddingTop:2 }}>
          <span style={{ fontFamily:F.syne, fontSize:"8.5px", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:s.col, background:s.bg, padding:"2px 8px", borderRadius:999, border:`1px solid ${s.bd}`, whiteSpace:"nowrap" }}>{s.label}</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:F.syne, fontSize:14, fontWeight:600, color:"var(--text)", lineHeight:1.35, marginBottom:6, letterSpacing:"-.015em" }}>{post.title}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <Av name={post.author} size={20} />
            <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-mid)" }}>{post.author}</span>
            <span style={{ fontFamily:F.body, fontSize:9, fontWeight:600, padding:"1px 6px", borderRadius:999, background:"rgba(106,144,112,.1)", color:"var(--text-muted)", border:"1px solid rgba(106,144,112,.18)" }}>Member</span>
            <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>· {timeAgo(post.created_at)}</span>
          </div>
          <div style={{ fontFamily:F.body, fontSize:12, color:"var(--text-mid)", lineHeight:1.55, marginBottom:visibleTags.length?9:0, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }} dangerouslySetInnerHTML={{__html: post.body}} />
          {visibleTags.length>0 && <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{visibleTags.map(tg=><TagPill key={tg} tag={tg}/>)}</div>}
        </div>
        <div style={{ flexShrink:0, textAlign:"right", minWidth:90 }}>
          <div style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{replyCount} replies</div>
          <div style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)", marginTop:2 }}>0 views</div>
          <div style={{ fontFamily:F.body, fontSize:11, color:"var(--text-mid)", marginTop:2 }}>{replyCount>0?`Last reply ${timeAgo(post.created_at)}`:"No replies"}</div>
        </div>
      </div>
    </div>
  );
}

// ── Read cards ─────────────────────────────────────────────────────────────────
function ReadFeatured({ post, replyCount, onClick }: { post:CommPost; replyCount:number; onClick:()=>void }) {
  const [h,setH] = useState(false);
  const catId = getReadCategory(post);
  const cat = categoryMeta(catId);
  const mins = readMinutes(post.body);
  const visibleTags = getVisibleTags(post);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:"var(--surface)", border:`1px solid ${h?"var(--border-strong)":"var(--border)"}`, borderRadius:10, overflow:"hidden", display:"flex", cursor:"pointer", transition:"border-color .12s", marginBottom:10 }}>
      <div style={{ width:220, flexShrink:0, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:160 }}>
        <span style={{ fontFamily:F.body, fontSize:9, color:"var(--text-muted)", letterSpacing:".06em", textTransform:"uppercase" }}>Cover image</span>
      </div>
      <div style={{ flex:1, padding:"18px 22px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <div style={{ marginBottom:10 }}>
            <span style={{ fontFamily:F.syne, fontSize:"9px", fontWeight:700, padding:"2px 8px", background:cat.bg, color:cat.col, borderRadius:999, letterSpacing:".1em", textTransform:"uppercase", border:`1px solid ${cat.bd}` }}>✦ Featured · {cat.label}</span>
          </div>
          <div style={{ fontFamily:F.syne, fontSize:16, fontWeight:700, color:"var(--text)", lineHeight:1.4, letterSpacing:"-.02em", marginBottom:8 }}>{post.title}</div>
          <div style={{ fontFamily:F.body, fontSize:12, color:"var(--text-mid)", lineHeight:1.6, marginBottom:10, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }} dangerouslySetInnerHTML={{__html: post.body}} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <Av name={post.author} size={22} />
          <span style={{ fontFamily:F.body, fontSize:12, fontWeight:600, color:"var(--text-mid)" }}>{post.author}</span>
          <span style={{ fontFamily:F.body, fontSize:9, fontWeight:600, padding:"1px 7px", borderRadius:999, background:"rgba(212,132,90,.1)", color:"var(--coral)", border:"1px solid rgba(212,132,90,.2)" }}>Contributor</span>
          <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>· {mins} min read · {timeAgo(post.created_at)}</span>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}><IcoFlame/><span style={{ fontFamily:F.body, fontSize:11, fontWeight:600, color:"var(--coral)" }}>0</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>{IcoReplyBubble("var(--text-muted)")}<span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{replyCount}</span></div>
          </div>
        </div>
        {visibleTags.length>0 && <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>{visibleTags.map(tg=><TagPill key={tg} tag={tg}/>)}</div>}
      </div>
    </div>
  );
}
function ReadCard({ post, replyCount, onClick }: { post:CommPost; replyCount:number; onClick:()=>void }) {
  const [h,setH] = useState(false);
  const catId = getReadCategory(post);
  const cat = categoryMeta(catId);
  const mins = readMinutes(post.body);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:"var(--surface)", border:`1px solid ${h?"var(--border-strong)":"var(--border)"}`, borderRadius:10, overflow:"hidden", cursor:"pointer", transition:"border-color .12s" }}>
      <div style={{ height:90, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:F.body, fontSize:9, color:"var(--text-muted)", letterSpacing:".06em", textTransform:"uppercase" }}>Cover</span>
      </div>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ marginBottom:6 }}>
          <span style={{ fontFamily:F.body, fontSize:"9px", fontWeight:600, padding:"1px 7px", borderRadius:999, background:cat.bg, color:cat.col, border:`1px solid ${cat.bd}` }}>{cat.label}</span>
        </div>
        <div style={{ fontFamily:F.syne, fontSize:13, fontWeight:600, color:"var(--text)", lineHeight:1.35, marginBottom:8, letterSpacing:"-.015em" }}>{post.title}</div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Av name={post.author} size={18} />
          <span style={{ fontFamily:F.body, fontSize:10.5, color:"var(--text-muted)" }}>{post.author} · {mins} min</span>
          <span style={{ fontFamily:F.body, fontSize:10.5, color:"var(--text-muted)", marginLeft:"auto" }}>{timeAgo(post.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Thread view ────────────────────────────────────────────────────────────────
function ThreadView({ post, replies, repliesLoading, replyBody, setReplyBody, onReply, replyPosting, currentUser, A, onBack, backLabel }: {
  post:CommPost; replies:CommPost[]; repliesLoading:boolean;
  replyBody:string; setReplyBody:(v:string)=>void;
  onReply:()=>void; replyPosting:boolean;
  currentUser:string|null; A:string;
  onBack:()=>void; backLabel:string;
}) {
  const isRead = post.type === "read";
  const mins = isRead ? readMinutes(post.body) : 0;
  const visibleTags = getVisibleTags(post);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
        <button onClick={onBack} style={{ fontFamily:F.body, fontSize:12, color:"var(--text-muted)", border:"none", background:"transparent", cursor:"pointer", padding:0 }}>{backLabel}</button>
      </div>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border-strong)", borderRadius:10, padding:"16px 18px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
          <Av name={post.author} size={30} />
          <span style={{ fontFamily:F.body, fontSize:12.5, fontWeight:600, color:"var(--text-mid)" }}>{post.author}</span>
          <span style={{ fontFamily:F.body, fontSize:9, fontWeight:600, padding:"1px 7px", borderRadius:999, background:"rgba(42,122,58,.16)", color:"#4ABA5A", border:"1px solid rgba(42,122,58,.28)" }}>Member</span>
          {isRead && <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{mins} min read</span>}
          <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>· {timeAgo(post.created_at)}</span>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <button style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)", border:"none", background:"transparent", cursor:"pointer", padding:0 }}>Share</button>
            <button style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)", border:"none", background:"transparent", cursor:"pointer", padding:0 }}>Bookmark</button>
          </div>
        </div>
        {post.title && <div style={{ fontFamily:F.syne, fontSize:isRead?20:16.5, fontWeight:700, color:"var(--text)", lineHeight:1.35, marginBottom:10, letterSpacing:"-.02em" }}>{post.title}</div>}
        <div style={{ fontFamily:F.body, fontSize:isRead?14:13, color:"var(--text-mid)", lineHeight:isRead?1.85:1.7, marginBottom:12 }} dangerouslySetInnerHTML={{__html: post.body}} />
        {visibleTags.length>0 && <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>{visibleTags.map(tg=><TagPill key={tg} tag={tg}/>)}</div>}
        <div style={{ display:"flex", alignItems:"center", gap:14, borderTop:"1px solid var(--border)", paddingTop:11 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}><IcoFlame/><span style={{ fontFamily:F.body, fontSize:12, fontWeight:600, color:"var(--coral)" }}>0 warmth</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>{IcoReplyBubble("var(--text-muted)")}<span style={{ fontFamily:F.body, fontSize:12, color:"var(--text-muted)" }}>{replies.length} replies</span></div>
        </div>
      </div>

      {currentUser ? (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", gap:10 }}>
            <Av name={currentUser} size={28} />
            <div style={{ flex:1 }}>
              <textarea placeholder="Add to this thread…" value={replyBody} onChange={e=>setReplyBody(e.target.value.slice(0,5000))} rows={2}
                onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey){e.preventDefault();onReply();}}}
                style={{ width:"100%", padding:"9px 13px", border:"1px solid var(--border)", borderRadius:8, background:"var(--bg)", color:"var(--text)", fontSize:13, fontFamily:F.body, outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.6 }}
                onFocus={e=>{e.currentTarget.style.borderColor=A;}} onBlur={e=>{e.currentTarget.style.borderColor="var(--border)";}}
              />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:7 }}>
                <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>Ctrl+Enter to post</span>
                <button onClick={onReply} disabled={!replyBody.trim()||replyPosting} style={{ fontFamily:F.body, fontSize:12, fontWeight:600, padding:"7px 18px", borderRadius:7, border:"none", background:replyBody.trim()?A:"var(--surface2)", color:replyBody.trim()?"var(--text)":"var(--text-muted)", cursor:replyBody.trim()?"pointer":"default" }}>{replyPosting?"Posting…":"Post"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 16px", marginBottom:14, textAlign:"center", fontFamily:F.body, fontSize:13, color:"var(--text-muted)" }}>Sign in to reply</div>
      )}

      <div style={{ fontFamily:F.syne, fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:11 }}>{replies.length} {replies.length===1?"Reply":"Replies"}</div>
      {repliesLoading ? <Spin/>
        : replies.length===0
        ? <div style={{ textAlign:"center", padding:"24px 0", fontFamily:F.body, fontSize:13, color:"var(--text-muted)" }}>No replies yet — be the first.</div>
        : replies.map(r => (
          <div key={r.id} style={{ display:"flex", gap:10, padding:"11px 0", borderBottom:"1px solid var(--border)" }}>
            <Av name={r.author} size={24} />
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontFamily:F.body, fontSize:12.5, fontWeight:600, color:"var(--text-mid)" }}>{r.author}</span>
                <span style={{ fontFamily:F.body, fontSize:11, color:"var(--text-muted)" }}>{timeAgo(r.created_at)}</span>
              </div>
              <p style={{ fontFamily:F.body, fontSize:13, color:"var(--text-mid)", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{r.body}</p>
            </div>
          </div>
        ))}
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────────
function BigModal({ title, children, onClose }: { title:string; children:React.ReactNode; onClose:()=>void }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"center", backdropFilter:"blur(4px)", padding:"40px 20px 20px", overflowY:"auto" }}>
      <div style={{ background:"var(--surface)", borderRadius:16, padding:"26px 28px", maxWidth:640, width:"100%", boxShadow:"0 32px 80px rgba(0,0,0,.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:F.syne, fontSize:20, fontWeight:700, color:"var(--text)", letterSpacing:"-.025em" }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, color:"var(--text-muted)", cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>{children}</div>
      </div>
    </div>
  );
}
function MField({ label, value, onChange, placeholder, autoFocus }: { label:string; value:string; onChange:(v:string)=>void; placeholder:string; autoFocus?:boolean }) {
  return (
    <div>
      <label style={{ fontFamily:F.body, fontSize:12, fontWeight:500, color:"var(--text-mid)", display:"block", marginBottom:6 }}>{label}</label>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        style={{ width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:9, background:"var(--bg)", color:"var(--text)", fontFamily:F.body, fontSize:13, outline:"none", boxSizing:"border-box" }}
        onFocus={e=>{e.currentTarget.style.borderColor="var(--border-strong)";}} onBlur={e=>{e.currentTarget.style.borderColor="var(--border)";}} />
    </div>
  );
}
