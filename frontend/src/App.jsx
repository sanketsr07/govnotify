import { useEffect, useState } from "react"

const API = "http://127.0.0.1:8000"
const CATEGORIES = ["All", "Police", "Army", "SSC", "Railway", "Banking", "UPSC", "Post Office", "KPSC"]
const CAT_CONFIG = {
  Police:       { color: "#3B82F6", emoji: "👮" },
  Army:         { color: "#22C55E", emoji: "🪖" },
  SSC:          { color: "#F97316", emoji: "📋" },
  Railway:      { color: "#A855F7", emoji: "🚆" },
  Banking:      { color: "#EAB308", emoji: "🏦" },
  UPSC:         { color: "#EC4899", emoji: "📚" },
  "Post Office":{ color: "#14B8A6", emoji: "📮" },
  KPSC:         { color: "#F43F5E", emoji: "🏛️" },
}

function getDaysLeft(dateStr) {
  if (!dateStr || ["TBA","Coming Soon","Check official site"].includes(dateStr)) return null
  const parsed = new Date(dateStr)
  if (isNaN(parsed)) return null
  return Math.ceil((parsed - new Date()) / (1000 * 60 * 60 * 24))
}

function isNew(postedOn) {
  return Math.ceil((new Date() - new Date(postedOn)) / (1000 * 60 * 60 * 24)) <= 3
}

export default function App() {
  const [notifications, setNotifications] = useState([])
  const [filtered, setFiltered] = useState([])
  const [active, setActive] = useState("All")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState("home") // home | login | register | bookmarks
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("govnotify_user") || "null"))
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [formError, setFormError] = useState("")
  const [bookmarkedIds, setBookmarkedIds] = useState([])

  useEffect(() => {
    fetch(`${API}/notifications`)
      .then(r => r.json())
      .then(data => { setNotifications(data); setFiltered(data); setLoading(false) })
  }, [])

  useEffect(() => {
    let result = notifications
    if (active !== "All") result = result.filter(n => n.category === active)
    if (search) result = result.filter(n => n.title.toLowerCase().includes(search.toLowerCase()))
    setFiltered(result)
  }, [active, search, notifications])

  useEffect(() => {
    if (user) {
      fetch(`${API}/bookmarks/${user.token}`)
        .then(r => r.json())
        .then(data => setBookmarkedIds(data.map(n => n.id)))
    }
  }, [user])

  const logout = () => {
    localStorage.removeItem("govnotify_user")
    setUser(null)
    setBookmarkedIds([])
    setPage("home")
  }

  const handleAuth = async (type) => {
    setFormError("")
    const body = type === "register"
      ? { name: form.name, email: form.email, password: form.password }
      : { email: form.email, password: form.password }
    const res = await fetch(`${API}/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.detail); return }
    const userData = { token: data.token, name: data.name }
    localStorage.setItem("govnotify_user", JSON.stringify(userData))
    setUser(userData)
    setPage("home")
  }

  const toggleBookmark = async (id) => {
    if (!user) { setPage("login"); return }
    await fetch(`${API}/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: user.token, notification_id: id })
    })
    setBookmarkedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const s = { fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#080814", color: "white" }

  // --- Auth Pages ---
  if (page === "login" || page === "register") {
    return (
      <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#16162A", borderRadius: 20, padding: 36, width: 340, border: "1px solid #2D2D4E" }}>
          <h2 style={{ margin: "0 0 24px", textAlign: "center" }}>{page === "login" ? "Login" : "Create Account"}</h2>
          {page === "register" && (
            <input placeholder="Your name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle} />
          )}
          <input placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle} />
          <input placeholder="Password" type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle} />
          {formError && <p style={{ color: "#EF4444", fontSize: 13 }}>{formError}</p>}
          <button onClick={() => handleAuth(page)} style={btnStyle}>
            {page === "login" ? "Login" : "Register"}
          </button>
          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 16 }}>
            {page === "login" ? "No account? " : "Have account? "}
            <span onClick={() => setPage(page === "login" ? "register" : "login")}
              style={{ color: "#6366F1", cursor: "pointer" }}>
              {page === "login" ? "Register" : "Login"}
            </span>
          </p>
          <p onClick={() => setPage("home")} style={{ textAlign: "center", fontSize: 13, color: "#4B5563", cursor: "pointer" }}>← Back</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", padding: "60px 20px 40px", textAlign: "center", position: "relative" }}>
        
        {/* Nav */}
        <div style={{ position: "absolute", top: 16, right: 20, display: "flex", gap: 10 }}>
          {user ? (
            <>
              <button onClick={() => setPage("bookmarks")} style={{ ...navBtn, background: "#6366F133" }}>⭐ Saved</button>
              <span style={{ color: "#a5b4fc", fontSize: 13, alignSelf: "center" }}>Hi, {user.name}</span>
              <button onClick={logout} style={navBtn}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")} style={navBtn}>Login</button>
              <button onClick={() => setPage("register")} style={{ ...navBtn, background: "#6366F1" }}>Register</button>
            </>
          )}
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>🇮🇳</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: "#a5b4fc" }}>INDIA</span>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, margin: "0 0 10px", background: "linear-gradient(135deg, #fff 30%, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {page === "bookmarks" ? "⭐ Saved Jobs" : "GovNotify"}
        </h1>
        <p style={{ color: "#6B7280", fontSize: 15, margin: "0 0 30px" }}>
          Real-time government job alerts — Army, Police, SSC & more
        </p>

        {page === "home" && (
          <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications..."
              style={{ width: "100%", padding: "14px 16px 14px 46px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 60px" }}>

        {/* Bookmarks page */}
        {page === "bookmarks" && (
          <>
            <p onClick={() => setPage("home")} style={{ color: "#6366F1", cursor: "pointer", marginBottom: 16 }}>← Back to all jobs</p>
            {notifications.filter(n => bookmarkedIds.includes(n.id)).map(n => <Card key={n.id} n={n} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />)}
          </>
        )}

        {/* Home page */}
        {page === "home" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActive(cat)} style={{
                  padding: "9px 18px", borderRadius: 999,
                  border: `1px solid ${active === cat ? "#6366F1" : "rgba(255,255,255,0.1)"}`,
                  background: active === cat ? "#6366F1" : "rgba(255,255,255,0.04)",
                  color: active === cat ? "white" : "#9CA3AF",
                  fontWeight: 600, fontSize: 13, cursor: "pointer"
                }}>{CAT_CONFIG[cat]?.emoji || "🗂️"} {cat}</button>
              ))}
            </div>
            <p style={{ color: "#374151", fontSize: 13, textAlign: "center", marginBottom: 20 }}>{filtered.length} results found</p>
            {loading && <p style={{ textAlign: "center", color: "#6B7280" }}>Loading...</p>}
            {filtered.map(n => <Card key={n.id} n={n} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />)}
            {!loading && filtered.length === 0 && <p style={{ textAlign: "center", color: "#374151", padding: 40 }}>No results found</p>}
          </>
        )}
      </div>
    </div>
  )
}

function Card({ n, bookmarkedIds, toggleBookmark }) {
  const cfg = CAT_CONFIG[n.category] || { color: "#6366F1", emoji: "📌" }
  const daysLeft = getDaysLeft(n.last_date)
  const saved = bookmarkedIds.includes(n.id)

  return (
    <div style={{
      background: "linear-gradient(135deg, #111128, #16162e)", borderRadius: 20,
      padding: "20px 24px", marginBottom: 14,
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: `0 0 0 1px ${cfg.color}22, 0 4px 24px rgba(0,0,0,0.3)`,
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap"
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ background: cfg.color + "22", color: cfg.color, padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            {cfg.emoji} {n.category}
          </span>
          {isNew(n.posted_on) && (
            <span style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "white", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>🔥 NEW</span>
          )}
          {daysLeft !== null && (
            <span style={{ background: daysLeft <= 5 ? "#EF444422" : "#22C55E22", color: daysLeft <= 5 ? "#EF4444" : "#22C55E", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              {daysLeft <= 0 ? "⛔ Expired" : `⏳ ${daysLeft}d left`}
            </span>
          )}
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#E5E7EB" }}>{n.title}</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#F59E0B" }}>📅 {n.last_date}</span>
          <span style={{ fontSize: 13, color: "#4B5563" }}>🏛️ {n.source}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
        <button onClick={() => toggleBookmark(n.id)} style={{
          background: saved ? "#6366F133" : "transparent",
          border: `1px solid ${saved ? "#6366F1" : "#2D2D4E"}`,
          color: saved ? "#6366F1" : "#6B7280",
          borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 16
        }}>{saved ? "⭐" : "☆"}</button>
        <a href={n.link} target="_blank" rel="noreferrer" style={{
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`,
          color: "white", padding: "11px 24px", borderRadius: 14,
          textDecoration: "none", fontSize: 14, fontWeight: 700,
          boxShadow: `0 4px 15px ${cfg.color}44`
        }}>Apply →</a>
      </div>
    </div>
  )
}

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1px solid #2D2D4E", background: "#0F0F1A",
  color: "white", fontSize: 14, outline: "none",
  marginBottom: 12, boxSizing: "border-box"
}

const btnStyle = {
  width: "100%", padding: "12px", borderRadius: 10,
  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
  color: "white", border: "none", fontSize: 15,
  fontWeight: 700, cursor: "pointer"
}

const navBtn = {
  padding: "7px 14px", borderRadius: 8, border: "1px solid #2D2D4E",
  background: "transparent", color: "white", fontSize: 13,
  cursor: "pointer", fontWeight: 600
}