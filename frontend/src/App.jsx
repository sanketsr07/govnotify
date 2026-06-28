import { useEffect, useState } from "react"

const API = "https://govnotify-ecxe.onrender.com"
const CATEGORIES = ["All", "Police", "Army", "SSC", "Railway", "Banking", "UPSC", "Post Office", "KPSC"]
const CAT_CONFIG = {
  Police:        { color: "#3B82F6", emoji: "👮" },
  Army:          { color: "#22C55E", emoji: "🪖" },
  SSC:           { color: "#F97316", emoji: "📋" },
  Railway:       { color: "#A855F7", emoji: "🚆" },
  Banking:       { color: "#EAB308", emoji: "🏦" },
  UPSC:          { color: "#EC4899", emoji: "📚" },
  "Post Office": { color: "#14B8A6", emoji: "📮" },
  KPSC:          { color: "#F43F5E", emoji: "🏛️" },
}

function getDaysLeft(dateStr) {
  if (!dateStr || ["TBA", "Coming Soon", "Check official site"].includes(dateStr)) return null
  const parsed = new Date(dateStr)
  if (isNaN(parsed)) return null
  return Math.ceil((parsed - new Date()) / (1000 * 60 * 60 * 24))
}

function isNew(postedOn) {
  return Math.ceil((new Date() - new Date(postedOn)) / (1000 * 60 * 60 * 24)) <= 3
}

function getPasswordStrength(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[!@#$%^&*]/.test(pwd)) score++
  if (score <= 1) return { label: "Weak", color: "#EF4444", width: "20%" }
  if (score === 2) return { label: "Fair", color: "#F97316", width: "40%" }
  if (score === 3) return { label: "Good", color: "#EAB308", width: "60%" }
  if (score === 4) return { label: "Strong", color: "#22C55E", width: "80%" }
  return { label: "Very Strong", color: "#6366F1", width: "100%" }
}

function validatePassword(pwd) {
  if (pwd.length < 8) return "At least 8 characters required"
  if (!/[A-Z]/.test(pwd)) return "At least one uppercase letter required"
  if (!/[a-z]/.test(pwd)) return "At least one lowercase letter required"
  if (!/[0-9]/.test(pwd)) return "At least one number required"
  if (!/[!@#$%^&*]/.test(pwd)) return "At least one special character required (!@#$%^&*)"
  return null
}

export default function App() {
  const [notifications, setNotifications] = useState([])
  const [filtered, setFiltered] = useState([])
  const [active, setActive] = useState("All")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState("home")
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("govnotify_user") || "null"))
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [formError, setFormError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState([])
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/notifications`)
      .then(r => r.json())
      .then(data => { setNotifications(data); setFiltered(data); setLoading(false) })
      .catch(() => setLoading(false))
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
        .then(data => Array.isArray(data) && setBookmarkedIds(data.map(n => n.id)))
        .catch(() => {})
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
    if (type === "register") {
      if (!form.name.trim()) { setFormError("Name is required"); return }
      if (!form.email.includes("@")) { setFormError("Enter a valid email"); return }
      const pwdError = validatePassword(form.password)
      if (pwdError) { setFormError(pwdError); return }
    }
    if (!form.email || !form.password) { setFormError("All fields are required"); return }
    setAuthLoading(true)
    try {
      const body = type === "register"
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password }
      const res = await fetch(`${API}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.detail || "Something went wrong"); return }
      const userData = { token: data.token, name: data.name }
      localStorage.setItem("govnotify_user", JSON.stringify(userData))
      setUser(userData)
      setForm({ name: "", email: "", password: "" })
      setPage("home")
    } catch {
      setFormError("Cannot connect to server. Try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  const toggleBookmark = async (id) => {
    if (!user) { setPage("login"); return }
    try {
      await fetch(`${API}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, notification_id: id })
      })
      setBookmarkedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    } catch {}
  }

  const strength = getPasswordStrength(form.password)

  // Auth Pages
  if (page === "login" || page === "register") {
    return (
      <div style={{ minHeight: "100vh", background: "#080814", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", padding: 16 }}>
        <div style={{ background: "#16162A", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 400, border: "1px solid #2D2D4E", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🇮🇳</div>
            <h2 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 800 }}>
              {page === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "6px 0 0" }}>
              {page === "login" ? "Login to access your saved jobs" : "Join GovNotify for free"}
            </p>
          </div>

          {/* Form */}
          {page === "register" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>FULL NAME</label>
              <input
                placeholder="Enter your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>EMAIL</label>
            <input
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                placeholder={page === "register" ? "Min 8 chars, uppercase, number, symbol" : "Enter your password"}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 16 }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Password strength bar */}
          {page === "register" && form.password.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ background: "#0F0F1A", borderRadius: 4, height: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: strength.width, background: strength.color, transition: "all 0.3s", borderRadius: 4 }} />
              </div>
              <p style={{ color: strength.color, fontSize: 11, margin: "4px 0 0", fontWeight: 600 }}>{strength.label}</p>
            </div>
          )}

          {/* Password rules */}
          {page === "register" && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "#0F0F1A", borderRadius: 10, border: "1px solid #2D2D4E" }}>
              {[
                { rule: /.{8,}/, label: "At least 8 characters" },
                { rule: /[A-Z]/, label: "One uppercase letter" },
                { rule: /[a-z]/, label: "One lowercase letter" },
                { rule: /[0-9]/, label: "One number" },
                { rule: /[!@#$%^&*]/, label: "One special character (!@#$%^&*)" },
              ].map(({ rule, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: rule.test(form.password) ? "#22C55E" : "#4B5563", fontSize: 12 }}>
                    {rule.test(form.password) ? "✅" : "○"}
                  </span>
                  <span style={{ color: rule.test(form.password) ? "#22C55E" : "#4B5563", fontSize: 12 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {formError && (
            <div style={{ background: "#EF444422", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>⚠️ {formError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => handleAuth(page)}
            disabled={authLoading}
            style={{
              width: "100%", padding: "13px", borderRadius: 12,
              background: authLoading ? "#4B5563" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "white", border: "none", fontSize: 15,
              fontWeight: 700, cursor: authLoading ? "not-allowed" : "pointer",
              marginBottom: 16
            }}
          >
            {authLoading ? "Please wait..." : page === "login" ? "Login →" : "Create Account →"}
          </button>

          {/* Switch */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
            {page === "login" ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => { setPage(page === "login" ? "register" : "login"); setFormError(""); setForm({ name: "", email: "", password: "" }) }}
              style={{ color: "#6366F1", cursor: "pointer", fontWeight: 600 }}
            >
              {page === "login" ? "Register" : "Login"}
            </span>
          </p>

          <p onClick={() => { setPage("home"); setFormError("") }} style={{ textAlign: "center", fontSize: 13, color: "#4B5563", cursor: "pointer", margin: 0 }}>
            ← Back to home
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080814", color: "white", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", padding: "70px 20px 40px", textAlign: "center", position: "relative" }}>

        {/* Nav */}
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {user ? (
            <>
              <button onClick={() => setPage("bookmarks")} style={{ ...navBtn, background: "#6366F133", borderColor: "#6366F1" }}>⭐ Saved</button>
              <span style={{ color: "#a5b4fc", fontSize: 13 }}>Hi, {user.name.split(" ")[0]}!</span>
              <button onClick={logout} style={navBtn}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { setPage("login"); setFormError("") }} style={navBtn}>Login</button>
              <button onClick={() => { setPage("register"); setFormError("") }} style={{ ...navBtn, background: "#6366F1", borderColor: "#6366F1" }}>Register</button>
            </>
          )}
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "6px 16px", marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>🇮🇳</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#a5b4fc" }}>INDIA</span>
        </div>

        <h1 style={{ fontSize: 38, fontWeight: 900, margin: "0 0 8px", background: "linear-gradient(135deg, #fff 30%, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {page === "bookmarks" ? "⭐ Saved Jobs" : "GovNotify"}
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 24px" }}>
          Real-time government job alerts — Army, Police, SSC & more
        </p>

        {page === "home" && (
          <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications..."
              style={{ width: "100%", padding: "13px 16px 13px 44px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Bookmarks page */}
        {page === "bookmarks" && (
          <>
            <p onClick={() => setPage("home")} style={{ color: "#6366F1", cursor: "pointer", marginBottom: 16, fontSize: 14 }}>← Back to all jobs</p>
            {bookmarkedIds.length === 0 && <p style={{ textAlign: "center", color: "#4B5563", padding: 40 }}>No saved jobs yet. Click ☆ to save a job.</p>}
            {notifications.filter(n => bookmarkedIds.includes(n.id)).map(n => (
              <Card key={n.id} n={n} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />
            ))}
          </>
        )}

        {/* Home page */}
        {page === "home" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActive(cat)} style={{
                  padding: "8px 16px", borderRadius: 999,
                  border: `1px solid ${active === cat ? "#6366F1" : "rgba(255,255,255,0.1)"}`,
                  background: active === cat ? "#6366F1" : "rgba(255,255,255,0.04)",
                  color: active === cat ? "white" : "#9CA3AF",
                  fontWeight: 600, fontSize: 13, cursor: "pointer"
                }}>{CAT_CONFIG[cat]?.emoji || "🗂️"} {cat}</button>
              ))}
            </div>

            <p style={{ color: "#374151", fontSize: 13, textAlign: "center", marginBottom: 16 }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
            </p>

            {loading && (
              <div style={{ textAlign: "center", padding: 60 }}>
                <p style={{ color: "#6B7280" }}>Loading notifications...</p>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#374151" }}>
                <p style={{ fontSize: 36 }}>🔍</p>
                <p>No notifications found</p>
              </div>
            )}

            {filtered.map(n => (
              <Card key={n.id} n={n} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />
            ))}
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
      background: "linear-gradient(135deg, #111128, #16162e)",
      borderRadius: 20, padding: "18px 20px", marginBottom: 12,
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: `0 0 0 1px ${cfg.color}22, 0 4px 24px rgba(0,0,0,0.3)`,
      display: "flex", justifyContent: "space-between",
      alignItems: "center", gap: 14, flexWrap: "wrap"
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ background: cfg.color + "22", color: cfg.color, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
            {cfg.emoji} {n.category}
          </span>
          {isNew(n.posted_on) && (
            <span style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "white", padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>🔥 NEW</span>
          )}
          {daysLeft !== null && (
            <span style={{ background: daysLeft <= 5 ? "#EF444422" : "#22C55E22", color: daysLeft <= 5 ? "#EF4444" : "#22C55E", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
              {daysLeft <= 0 ? "⛔ Expired" : `⏳ ${daysLeft}d left`}
            </span>
          )}
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#E5E7EB", lineHeight: 1.4 }}>{n.title}</h3>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#F59E0B" }}>📅 {n.last_date}</span>
          <span style={{ fontSize: 12, color: "#4B5563" }}>🏛️ {n.source}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <button onClick={() => toggleBookmark(n.id)} style={{
          background: saved ? "#6366F133" : "transparent",
          border: `1px solid ${saved ? "#6366F1" : "#2D2D4E"}`,
          color: saved ? "#6366F1" : "#6B7280",
          borderRadius: 10, padding: "9px 12px", cursor: "pointer", fontSize: 15
        }}>{saved ? "⭐" : "☆"}</button>
        <a href={n.link} target="_blank" rel="noreferrer" style={{
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`,
          color: "white", padding: "10px 18px", borderRadius: 12,
          textDecoration: "none", fontSize: 13, fontWeight: 700,
          boxShadow: `0 4px 15px ${cfg.color}44`, whiteSpace: "nowrap"
        }}>Apply →</a>
      </div>
    </div>
  )
}

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1px solid #2D2D4E", background: "#0F0F1A",
  color: "white", fontSize: 14, outline: "none",
  marginTop: 6, marginBottom: 0, boxSizing: "border-box",
  display: "block"
}

const navBtn = {
  padding: "7px 14px", borderRadius: 8,
  border: "1px solid #2D2D4E",
  background: "transparent", color: "white",
  fontSize: 13, cursor: "pointer", fontWeight: 600
}