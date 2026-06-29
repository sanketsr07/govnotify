import { useEffect, useState } from "react"

const API = "https://govnotify-ecxe.onrender.com"
const CATEGORIES = ["All", "Police", "Army", "SSC", "Railway", "Banking", "UPSC", "Post Office", "KPSC"]
const CAT_CONFIG = {
  Police:        { color: "#60A5FA", bg: "#1E3A5F", emoji: "👮" },
  Army:          { color: "#34D399", bg: "#1A3A2A", emoji: "🪖" },
  SSC:           { color: "#FB923C", bg: "#3A1F0A", emoji: "📋" },
  Railway:       { color: "#C084FC", bg: "#2D1A4A", emoji: "🚆" },
  Banking:       { color: "#FBBF24", bg: "#3A2A00", emoji: "🏦" },
  UPSC:          { color: "#F472B6", bg: "#3A0A2A", emoji: "📚" },
  "Post Office": { color: "#2DD4BF", bg: "#0A2A2A", emoji: "📮" },
  KPSC:          { color: "#F87171", bg: "#3A0A0A", emoji: "🏛️" },
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

  if (page === "login" || page === "register") {
    return (
      <div style={{ minHeight: "100vh", background: "#09090B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>🇮🇳</div>
            <h1 style={{ color: "white", margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>
              {page === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p style={{ color: "#71717A", fontSize: 14, margin: 0 }}>
              {page === "login" ? "Sign in to your GovNotify account" : "Start tracking government jobs today"}
            </p>
          </div>

          <div style={{ background: "#18181B", borderRadius: 16, padding: 24, border: "1px solid #27272A" }}>
            {page === "register" && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full Name</label>
                <input placeholder="Sanket S R" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input placeholder="you@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: page === "register" ? 8 : 20 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  placeholder={page === "register" ? "Min 8 chars, A-Z, 0-9, !@#" : "••••••••"}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#52525B", cursor: "pointer", fontSize: 14 }}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {page === "register" && form.password.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#52525B", fontSize: 12 }}>Password strength</span>
                  <span style={{ color: strength.color, fontSize: 12, fontWeight: 600 }}>{strength.label}</span>
                </div>
                <div style={{ background: "#27272A", borderRadius: 4, height: 3 }}>
                  <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 4, transition: "all 0.3s" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 10 }}>
                  {[
                    { rule: /.{8,}/, label: "8+ characters" },
                    { rule: /[A-Z]/, label: "Uppercase" },
                    { rule: /[a-z]/, label: "Lowercase" },
                    { rule: /[0-9]/, label: "Number" },
                    { rule: /[!@#$%^&*]/, label: "Special char" },
                  ].map(({ rule, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: rule.test(form.password) ? "#22C55E" : "#3F3F46", flexShrink: 0 }} />
                      <span style={{ color: rule.test(form.password) ? "#22C55E" : "#52525B", fontSize: 11 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div style={{ background: "#1C0A0A", border: "1px solid #7F1D1D", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                <p style={{ color: "#FCA5A5", fontSize: 13, margin: 0 }}>{formError}</p>
              </div>
            )}

            <button onClick={() => handleAuth(page)} disabled={authLoading} style={{
              width: "100%", padding: "11px", borderRadius: 10,
              background: authLoading ? "#3F3F46" : "#6366F1",
              color: "white", border: "none", fontSize: 14,
              fontWeight: 600, cursor: authLoading ? "not-allowed" : "pointer",
              marginBottom: 16, transition: "background 0.2s"
            }}>
              {authLoading ? "Please wait..." : page === "login" ? "Sign in" : "Create account"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#52525B", margin: 0 }}>
              {page === "login" ? "No account? " : "Have account? "}
              <span onClick={() => { setPage(page === "login" ? "register" : "login"); setFormError(""); setForm({ name: "", email: "", password: "" }) }} style={{ color: "#818CF8", cursor: "pointer", fontWeight: 500 }}>
                {page === "login" ? "Sign up" : "Sign in"}
              </span>
            </p>
          </div>

          <p onClick={() => { setPage("home"); setFormError("") }} style={{ textAlign: "center", fontSize: 13, color: "#3F3F46", cursor: "pointer", marginTop: 16 }}>
            ← Back to home
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "white", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid #18181B", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#09090B", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🇮🇳</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "white" }}>GovNotify</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user ? (
            <>
              <button onClick={() => setPage(page === "bookmarks" ? "home" : "bookmarks")} style={{ ...ghostBtn, color: page === "bookmarks" ? "#818CF8" : "#71717A" }}>
                {page === "bookmarks" ? "← Jobs" : `⭐ Saved (${bookmarkedIds.length})`}
              </button>
              <span style={{ color: "#3F3F46", fontSize: 13 }}>|</span>
              <span style={{ color: "#71717A", fontSize: 13 }}>{user.name.split(" ")[0]}</span>
              <button onClick={logout} style={ghostBtn}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={() => { setPage("login"); setFormError("") }} style={ghostBtn}>Sign in</button>
              <button onClick={() => { setPage("register"); setFormError("") }} style={{ ...ghostBtn, background: "#6366F1", color: "white", border: "none" }}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 20px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#18181B", border: "1px solid #27272A", borderRadius: 999, padding: "4px 12px", marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
          <span style={{ color: "#71717A", fontSize: 12 }}>Live job alerts</span>
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: "0 0 12px", letterSpacing: -1, color: "white", lineHeight: 1.1 }}>
          Never miss a<br />
          <span style={{ background: "linear-gradient(135deg, #818CF8, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>government job</span>
        </h1>
        <p style={{ color: "#52525B", fontSize: 15, margin: "0 0 32px", lineHeight: 1.6 }}>
          Real-time notifications for Army, Police, SSC, Banking and more. All in one place.
        </p>

        {page === "home" && (
          <div style={{ position: "relative", maxWidth: 400, margin: "0 auto" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#3F3F46", fontSize: 15 }}>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs..."
              style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: 10, border: "1px solid #27272A", background: "#18181B", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* Filters */}
        {page === "home" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActive(cat)} style={{
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${active === cat ? "#6366F1" : "#27272A"}`,
                background: active === cat ? "#1E1B4B" : "transparent",
                color: active === cat ? "#818CF8" : "#52525B",
                fontWeight: 500, fontSize: 13, cursor: "pointer"
              }}>
                {CAT_CONFIG[cat]?.emoji} {cat}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        {page === "home" && (
          <p style={{ color: "#3F3F46", fontSize: 12, marginBottom: 16 }}>
            {filtered.length} job{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Bookmarks */}
        {page === "bookmarks" && (
          <>
            <h2 style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Saved Jobs</h2>
            {bookmarkedIds.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#3F3F46" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>⭐</p>
                <p style={{ fontSize: 14 }}>No saved jobs yet</p>
              </div>
            )}
            {notifications.filter(n => bookmarkedIds.includes(n.id)).map(n => (
              <JobCard key={n.id} n={n} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />
            ))}
          </>
        )}

        {/* Loading */}
        {page === "home" && loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ color: "#3F3F46", fontSize: 14 }}>Loading jobs...</div>
          </div>
        )}

        {/* Empty */}
        {page === "home" && !loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#3F3F46" }}>
            <p style={{ fontSize: 14 }}>No jobs found</p>
          </div>
        )}

        {/* Cards */}
        {page === "home" && filtered.map(n => (
          <JobCard key={n.id} n={n} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />
        ))}
      </div>
    </div>
  )
}

function JobCard({ n, bookmarkedIds, toggleBookmark }) {
  const cfg = CAT_CONFIG[n.category] || { color: "#818CF8", bg: "#1E1B4B", emoji: "📌" }
  const daysLeft = getDaysLeft(n.last_date)
  const saved = bookmarkedIds.includes(n.id)
  const urgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const expired = daysLeft !== null && daysLeft <= 0

  return (
    <div style={{
      background: "#18181B",
      borderRadius: 12, padding: "16px 18px", marginBottom: 8,
      border: `1px solid ${urgent ? "#78350F" : expired ? "#3F3F46" : "#27272A"}`,
      display: "flex", justifyContent: "space-between",
      alignItems: "center", gap: 12, flexWrap: "wrap",
      opacity: expired ? 0.5 : 1
    }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
            {cfg.emoji} {n.category}
          </span>
          {isNew(n.posted_on) && !expired && (
            <span style={{ background: "#14532D", color: "#4ADE80", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>New</span>
          )}
          {urgent && (
            <span style={{ background: "#78350F", color: "#FCD34D", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>⚡ {daysLeft}d left</span>
          )}
          {expired && (
            <span style={{ background: "#1C1917", color: "#78716C", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>Expired</span>
          )}
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#E4E4E7", lineHeight: 1.4 }}>{n.title}</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {!expired && daysLeft !== null && !urgent && (
            <span style={{ fontSize: 12, color: "#52525B" }}>📅 {n.last_date}</span>
          )}
          {(daysLeft === null || urgent) && (
            <span style={{ fontSize: 12, color: "#52525B" }}>📅 {n.last_date}</span>
          )}
          <span style={{ fontSize: 12, color: "#3F3F46" }}>{n.source}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
        <button onClick={() => toggleBookmark(n.id)} style={{
          background: "transparent",
          border: "1px solid #27272A",
          color: saved ? "#FBBF24" : "#3F3F46",
          borderRadius: 8, padding: "7px 10px",
          cursor: "pointer", fontSize: 14,
          transition: "all 0.2s"
        }}>{saved ? "★" : "☆"}</button>
        {!expired && (
          <a href={n.link} target="_blank" rel="noreferrer" style={{
            background: "#6366F1",
            color: "white", padding: "8px 16px", borderRadius: 8,
            textDecoration: "none", fontSize: 13, fontWeight: 600,
            whiteSpace: "nowrap"
          }}>Apply</a>
        )}
      </div>
    </div>
  )
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #27272A", background: "#09090B",
  color: "white", fontSize: 14, outline: "none",
  marginTop: 6, boxSizing: "border-box", display: "block"
}

const labelStyle = {
  color: "#A1A1AA", fontSize: 13, fontWeight: 500, display: "block"
}

const ghostBtn = {
  padding: "6px 12px", borderRadius: 8,
  border: "1px solid #27272A",
  background: "transparent", color: "#71717A",
  fontSize: 13, cursor: "pointer", fontWeight: 500
}