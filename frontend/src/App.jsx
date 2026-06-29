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
  if (!/[A-Z]/.test(pwd)) return "Uppercase letter required"
  if (!/[a-z]/.test(pwd)) return "Lowercase letter required"
  if (!/[0-9]/.test(pwd)) return "Number required"
  if (!/[!@#$%^&*]/.test(pwd)) return "Special character required (!@#$%^&*)"
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
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0a0f 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif", padding: 16,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "20%", left: "30%", width: 300, height: 300, background: "radial-gradient(circle, #6366F133 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "30%", width: 200, height: 200, background: "radial-gradient(circle, #8B5CF633 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🇮🇳</div>
            <h1 style={{ color: "white", margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
              {page === "login" ? "Sign in to GovNotify" : "Join GovNotify"}
            </h1>
            <p style={{ color: "#4B5563", fontSize: 13, margin: 0 }}>
              {page === "login" ? "Track your dream government job" : "Free forever. No spam."}
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", borderRadius: 20, padding: "24px 20px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {page === "register" && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelS}>Name</label>
                <input placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inpS} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={labelS}>Email</label>
              <input placeholder="you@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inpS} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  placeholder={page === "register" ? "Strong password" : "••••••••"}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...inpS, paddingRight: 50 }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {page === "register" && form.password.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#4B5563", fontSize: 11 }}>Strength</span>
                  <span style={{ color: strength.color, fontSize: 11, fontWeight: 600 }}>{strength.label}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 3 }}>
                  <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 99, transition: "all 0.3s" }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {[
                    { rule: /.{8,}/, label: "8+ chars" },
                    { rule: /[A-Z]/, label: "A-Z" },
                    { rule: /[a-z]/, label: "a-z" },
                    { rule: /[0-9]/, label: "0-9" },
                    { rule: /[!@#$%^&*]/, label: "!@#" },
                  ].map(({ rule, label }) => (
                    <span key={label} style={{
                      padding: "2px 8px", borderRadius: 99, fontSize: 11,
                      background: rule.test(form.password) ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                      color: rule.test(form.password) ? "#22C55E" : "#4B5563",
                      border: `1px solid ${rule.test(form.password) ? "#22C55E44" : "transparent"}`
                    }}>{label}</span>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                <p style={{ color: "#FCA5A5", fontSize: 12, margin: 0 }}>{formError}</p>
              </div>
            )}

            <button onClick={() => handleAuth(page)} disabled={authLoading} style={{
              width: "100%", padding: "12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              color: "white", border: "none", fontSize: 14,
              fontWeight: 600, cursor: authLoading ? "not-allowed" : "pointer",
              marginBottom: 14, opacity: authLoading ? 0.7 : 1,
              boxShadow: "0 8px 20px rgba(99,102,241,0.3)"
            }}>
              {authLoading ? "Please wait..." : page === "login" ? "Sign in →" : "Create account →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "#4B5563", margin: 0 }}>
              {page === "login" ? "New here? " : "Already joined? "}
              <span onClick={() => { setPage(page === "login" ? "register" : "login"); setFormError(""); setForm({ name: "", email: "", password: "" }) }}
                style={{ color: "#818CF8", cursor: "pointer", fontWeight: 600 }}>
                {page === "login" ? "Create account" : "Sign in"}
              </span>
            </p>
          </div>

          <p onClick={() => { setPage("home"); setFormError("") }} style={{ textAlign: "center", fontSize: 12, color: "#374151", cursor: "pointer", marginTop: 16 }}>
            ← Back
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#07070c", fontFamily: "'Segoe UI', sans-serif", color: "white" }}>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .job-card {
          animation: fadeSlideUp 0.4s ease forwards;
          opacity: 0;
        }
        .hero-text {
          animation: fadeIn 0.8s ease forwards;
        }
        input::placeholder { color: #374151; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Navbar */}
      <header style={{ padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(7,7,12,0.95)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🇮🇳</span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>GovNotify</span>
          <span style={{ fontSize: 10, color: "#22C55E", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 99, border: "1px solid rgba(34,197,94,0.2)", marginLeft: 4 }}>LIVE</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {user ? (
            <>
              <button onClick={() => setPage(page === "bookmarks" ? "home" : "bookmarks")} style={navPill}>
                {page === "bookmarks" ? "← All Jobs" : `★ ${bookmarkedIds.length} Saved`}
              </button>
              <span style={{ color: "#374151", fontSize: 12 }}>{user.name.split(" ")[0]}</span>
              <button onClick={logout} style={{ ...navPill, color: "#374151" }}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")} style={navPill}>Sign in</button>
              <button onClick={() => setPage("register")} style={{ ...navPill, background: "rgba(99,102,241,0.15)", color: "#818CF8", borderColor: "rgba(99,102,241,0.3)" }}>Sign up</button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      {page === "home" && (
        <div className="hero-text" style={{ textAlign: "center", padding: "64px 20px 40px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <p style={{ color: "#4B5563", fontSize: 12, letterSpacing: 3, marginBottom: 16, fontWeight: 600 }}>INDIA'S SMARTEST JOB TRACKER</p>
          <h1 style={{ fontSize: 46, fontWeight: 900, margin: "0 0 14px", letterSpacing: -2, lineHeight: 1.05, color: "white" }}>
            Your next<br />
            <span style={{ WebkitTextStroke: "1.5px rgba(99,102,241,0.7)", WebkitTextFillColor: "transparent" }}>govt job</span>
            <br />starts here.
          </h1>
          <p style={{ color: "#4B5563", fontSize: 14, maxWidth: 380, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Real-time alerts for Army, Police, SSC, Banking & more. All in one place.
          </p>
          <div style={{ position: "relative", maxWidth: 360, margin: "0 auto" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search any job..."
              style={{ width: "100%", padding: "13px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: 14, outline: "none", backdropFilter: "blur(10px)" }}
            />
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* Category filters */}
        {page === "home" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {CATEGORIES.map(cat => {
              const cfg = CAT_CONFIG[cat]
              const isActive = active === cat
              return (
                <button key={cat} onClick={() => setActive(cat)} style={{
                  padding: "6px 14px", borderRadius: 99,
                  border: `1px solid ${isActive ? (cfg?.color || "#6366F1") + "55" : "rgba(255,255,255,0.07)"}`,
                  background: isActive ? (cfg?.color || "#6366F1") + "18" : "transparent",
                  color: isActive ? (cfg?.color || "#818CF8") : "#4B5563",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13, cursor: "pointer", transition: "all 0.15s"
                }}>
                  {cfg?.emoji} {cat}
                </button>
              )
            })}
          </div>
        )}

        {/* Stats */}
        {page === "home" && !loading && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, padding: "0 2px" }}>
            <span style={{ color: "#374151", fontSize: 12 }}>{filtered.length} jobs found</span>
            <span style={{ color: "#1F2937", fontSize: 12 }}>Updated daily</span>
          </div>
        )}

        {/* Bookmarks page */}
        {page === "bookmarks" && (
          <div style={{ paddingTop: 32 }}>
            <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Saved Jobs ({bookmarkedIds.length})
            </h2>
            {bookmarkedIds.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#374151" }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>★</p>
                <p style={{ fontSize: 14 }}>No saved jobs yet. Click ☆ to save.</p>
              </div>
            )}
            {notifications.filter(n => bookmarkedIds.includes(n.id)).map((n, i) => (
              <JobCard key={n.id} n={n} index={i} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />
            ))}
          </div>
        )}

        {/* Loading */}
        {page === "home" && loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#374151" }}>
            <div style={{ fontSize: 13 }}>Fetching jobs...</div>
          </div>
        )}

        {/* Empty */}
        {page === "home" && !loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#374151" }}>
            <p style={{ fontSize: 14 }}>No jobs found</p>
          </div>
        )}

        {/* Cards */}
        {page === "home" && !loading && filtered.map((n, i) => (
          <JobCard key={n.id} n={n} index={i} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />
        ))}
      </div>
    </div>
  )
}

function JobCard({ n, bookmarkedIds, toggleBookmark, index }) {
  const cfg = CAT_CONFIG[n.category] || { color: "#6366F1", emoji: "📌" }
  const daysLeft = getDaysLeft(n.last_date)
  const saved = bookmarkedIds.includes(n.id)
  const urgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const expired = daysLeft !== null && daysLeft <= 0
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="job-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14, padding: "16px 18px", marginBottom: 8,
        border: `1px solid ${hovered ? cfg.color + "44" : "rgba(255,255,255,0.06)"}`,
        background: hovered ? cfg.color + "0a" : "rgba(255,255,255,0.015)",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: 12, flexWrap: "wrap",
        transition: "border 0.2s, background 0.2s",
        opacity: expired ? 0.4 : 1,
        animationDelay: `${index * 70}ms`,
        cursor: "default"
      }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
            {cfg.emoji} {n.category.toUpperCase()}
          </span>
          {isNew(n.posted_on) && !expired && (
            <span style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, border: "1px solid rgba(34,197,94,0.25)" }}>NEW</span>
          )}
          {urgent && (
            <span style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, border: "1px solid rgba(251,191,36,0.25)" }}>⚡ {daysLeft}d left</span>
          )}
          {expired && (
            <span style={{ color: "#374151", fontSize: 10 }}>Closed</span>
          )}
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: expired ? "#374151" : "#E5E7EB", lineHeight: 1.4 }}>{n.title}</h3>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ fontSize: 12, color: "#4B5563" }}>📅 {n.last_date}</span>
          <span style={{ fontSize: 12, color: "#1F2937" }}>{n.source}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        <button onClick={() => toggleBookmark(n.id)} style={{
          background: saved ? "rgba(251,191,36,0.1)" : "transparent",
          border: `1px solid ${saved ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"}`,
          color: saved ? "#FBBF24" : "#374151",
          borderRadius: 8, padding: "7px 10px",
          cursor: "pointer", fontSize: 14, transition: "all 0.2s"
        }}>{saved ? "★" : "☆"}</button>
        {!expired && (
          <a href={n.link} target="_blank" rel="noreferrer" style={{
            background: cfg.color + "20",
            color: cfg.color,
            border: `1px solid ${cfg.color}40`,
            padding: "8px 16px", borderRadius: 8,
            textDecoration: "none", fontSize: 13, fontWeight: 600,
            whiteSpace: "nowrap"
          }}>Apply →</a>
        )}
      </div>
    </div>
  )
}

const inpS = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white", fontSize: 14, outline: "none",
  marginTop: 6, display: "block"
}

const labelS = {
  color: "#6B7280", fontSize: 12, fontWeight: 600,
  letterSpacing: 0.5, display: "block"
}

const navPill = {
  padding: "5px 12px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent", color: "#6B7280",
  fontSize: 12, cursor: "pointer", fontWeight: 500
}