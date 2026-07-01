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
  const [formSuccess, setFormSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState([])
  const [authLoading, setAuthLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [pwdForm, setPwdForm] = useState({ old: "", new: "", confirm: "" })
  const [pwdError, setPwdError] = useState("")
  const [pwdSuccess, setPwdSuccess] = useState("")
  const [nameEdit, setNameEdit] = useState("")
  const [nameSuccess, setNameSuccess] = useState("")

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

  useEffect(() => {
    if (page === "profile" && user) {
      fetch(`${API}/profile/${user.token}`)
        .then(r => r.json())
        .then(data => { setProfile(data); setNameEdit(data.name) })
        .catch(() => {})
    }
  }, [page, user])

  const logout = () => {
    localStorage.removeItem("govnotify_user")
    setUser(null)
    setBookmarkedIds([])
    setPage("home")
  }

  const handleAuth = async (type) => {
    setFormError("")
    setFormSuccess("")
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

  const handleChangePassword = async () => {
    setPwdError("")
    setPwdSuccess("")
    if (!pwdForm.old || !pwdForm.new || !pwdForm.confirm) { setPwdError("All fields required"); return }
    if (pwdForm.new !== pwdForm.confirm) { setPwdError("Passwords don't match"); return }
    const err = validatePassword(pwdForm.new)
    if (err) { setPwdError(err); return }
    try {
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, old_password: pwdForm.old, new_password: pwdForm.new })
      })
      const data = await res.json()
      if (!res.ok) { setPwdError(data.detail); return }
      setPwdSuccess("Password changed successfully!")
      setPwdForm({ old: "", new: "", confirm: "" })
    } catch {
      setPwdError("Server error. Try again.")
    }
  }

  const handleUpdateName = async () => {
    setNameSuccess("")
    if (!nameEdit.trim()) return
    try {
      const res = await fetch(`${API}/update-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, name: nameEdit })
      })
      const data = await res.json()
      if (!res.ok) return
      const updated = { token: data.token, name: data.name }
      localStorage.setItem("govnotify_user", JSON.stringify(updated))
      setUser(updated)
      setProfile(p => ({ ...p, name: data.name }))
      setNameSuccess("Name updated!")
    } catch {}
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

  // ─── AUTH PAGES ───────────────────────────────────────────────────────────
  if (page === "login" || page === "register") {
    return (
      <div style={{ minHeight: "100vh", background: "#07070c", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 360, position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🇮🇳</div>
            <h1 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
              {page === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p style={{ color: "#374151", fontSize: 13, margin: 0 }}>
              {page === "login" ? "Sign in to GovNotify" : "Join free, no spam ever"}
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 20px" }}>
            {page === "register" && (
              <div style={{ marginBottom: 14 }}>
                <label style={LS}>Full Name</label>
                <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={IS} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={LS}>Email</label>
              <input placeholder="you@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={IS} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={LS}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  placeholder={page === "register" ? "Min 8 chars, A-Z, 0-9, !@#" : "••••••••"}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ ...IS, paddingRight: 52 }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {page === "register" && form.password.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: "#374151", fontSize: 11 }}>Strength</span>
                  <span style={{ color: strength.color, fontSize: 11, fontWeight: 600 }}>{strength.label}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 2 }}>
                  <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 99, transition: "all 0.3s" }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                  {[
                    { rule: /.{8,}/, label: "8+ chars" },
                    { rule: /[A-Z]/, label: "A-Z" },
                    { rule: /[a-z]/, label: "a-z" },
                    { rule: /[0-9]/, label: "0-9" },
                    { rule: /[!@#$%^&*]/, label: "!@#" },
                  ].map(({ rule, label }) => (
                    <span key={label} style={{
                      padding: "2px 7px", borderRadius: 99, fontSize: 10,
                      background: rule.test(form.password) ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                      color: rule.test(form.password) ? "#22C55E" : "#374151",
                      border: `1px solid ${rule.test(form.password) ? "rgba(34,197,94,0.3)" : "transparent"}`
                    }}>{label}</span>
                  ))}
                </div>
              </div>
            )}

            {formError && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "9px 12px", marginBottom: 14 }}><p style={{ color: "#FCA5A5", fontSize: 12, margin: 0 }}>{formError}</p></div>}

            <button onClick={() => handleAuth(page)} disabled={authLoading} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#6366F1", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: authLoading ? "not-allowed" : "pointer", marginBottom: 14, opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? "Please wait..." : page === "login" ? "Sign in →" : "Create account →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "#374151", margin: 0 }}>
              {page === "login" ? "New here? " : "Have account? "}
              <span onClick={() => { setPage(page === "login" ? "register" : "login"); setFormError(""); setForm({ name: "", email: "", password: "" }) }} style={{ color: "#818CF8", cursor: "pointer", fontWeight: 600 }}>
                {page === "login" ? "Create account" : "Sign in"}
              </span>
            </p>
          </div>
          <p onClick={() => { setPage("home"); setFormError("") }} style={{ textAlign: "center", fontSize: 12, color: "#1F2937", cursor: "pointer", marginTop: 14 }}>← Back</p>
        </div>
      </div>
    )
  }

  // ─── PROFILE PAGE ─────────────────────────────────────────────────────────
  if (page === "profile") {
    return (
      <div style={{ minHeight: "100vh", background: "#07070c" }}>
        <header style={NAV}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🇮🇳</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>GovNotify</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage("home")} style={NB}>← Jobs</button>
            <button onClick={logout} style={{ ...NB, color: "#374151" }}>Sign out</button>
          </div>
        </header>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 16px 80px" }}>
          <h1 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Account Settings</h1>

          {/* Profile info */}
          <div style={CARD}>
            <h2 style={SH}>Profile Info</h2>
            <div style={{ marginBottom: 8 }}>
              <label style={LS}>Display Name</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input value={nameEdit} onChange={e => setNameEdit(e.target.value)} style={{ ...IS, flex: 1, marginTop: 0 }} />
                <button onClick={handleUpdateName} style={{ padding: "10px 16px", borderRadius: 8, background: "#6366F1", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
              </div>
              {nameSuccess && <p style={{ color: "#22C55E", fontSize: 12, marginTop: 6 }}>{nameSuccess}</p>}
            </div>
            {profile && (
              <div style={{ marginTop: 16, display: "flex", gap: 20 }}>
                <div>
                  <p style={{ color: "#374151", fontSize: 11, marginBottom: 2 }}>EMAIL</p>
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>{profile.email}</p>
                </div>
                <div>
                  <p style={{ color: "#374151", fontSize: 11, marginBottom: 2 }}>JOINED</p>
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>{profile.joined}</p>
                </div>
                <div>
                  <p style={{ color: "#374151", fontSize: 11, marginBottom: 2 }}>SAVED JOBS</p>
                  <p style={{ color: "#9CA3AF", fontSize: 13 }}>{profile.bookmarks}</p>
                </div>
              </div>
            )}
          </div>

          {/* Change password */}
          <div style={CARD}>
            <h2 style={SH}>Change Password</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={LS}>Current Password</label>
              <input type="password" placeholder="••••••••" value={pwdForm.old} onChange={e => setPwdForm({ ...pwdForm, old: e.target.value })} style={IS} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={LS}>New Password</label>
              <input type="password" placeholder="Min 8 chars, A-Z, 0-9, !@#" value={pwdForm.new} onChange={e => setPwdForm({ ...pwdForm, new: e.target.value })} style={IS} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LS}>Confirm New Password</label>
              <input type="password" placeholder="Repeat new password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} style={IS} />
            </div>
            {pwdError && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "9px 12px", marginBottom: 12 }}><p style={{ color: "#FCA5A5", fontSize: 12, margin: 0 }}>{pwdError}</p></div>}
            {pwdSuccess && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, padding: "9px 12px", marginBottom: 12 }}><p style={{ color: "#86EFAC", fontSize: 12, margin: 0 }}>{pwdSuccess}</p></div>}
            <button onClick={handleChangePassword} style={{ padding: "10px 20px", borderRadius: 8, background: "#6366F1", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Update Password
            </button>
          </div>

          {/* Danger zone */}
          <div style={{ ...CARD, borderColor: "rgba(239,68,68,0.2)" }}>
            <h2 style={{ ...SH, color: "#EF4444" }}>Sign Out</h2>
            <p style={{ color: "#374151", fontSize: 13, marginBottom: 14 }}>You'll be signed out of your account on this device.</p>
            <button onClick={logout} style={{ padding: "10px 20px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── MAIN APP ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#07070c" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .card { animation: fadeUp 0.4s ease forwards; opacity: 0; }
        input::placeholder { color: #1F2937; }
      `}</style>

      {/* Navbar */}
      <header style={NAV}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🇮🇳</span>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>GovNotify</span>
          <span style={{ fontSize: 9, color: "#22C55E", background: "rgba(34,197,94,0.1)", padding: "2px 5px", borderRadius: 99, border: "1px solid rgba(34,197,94,0.2)" }}>LIVE</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {user ? (
            <>
              <button onClick={() => setPage(page === "bookmarks" ? "home" : "bookmarks")} style={NB}>
                {page === "bookmarks" ? "← Jobs" : `★ ${bookmarkedIds.length}`}
              </button>
              <button onClick={() => setPage("profile")} style={{ ...NB, color: "#818CF8", borderColor: "rgba(99,102,241,0.3)" }}>
                {user.name.split(" ")[0]}
              </button>
              <button onClick={logout} style={{ ...NB, color: "#374151" }}>Out</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")} style={NB}>Sign in</button>
              <button onClick={() => setPage("register")} style={{ ...NB, background: "rgba(99,102,241,0.15)", color: "#818CF8", borderColor: "rgba(99,102,241,0.3)" }}>Sign up</button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      {page === "home" && (
        <div style={{ textAlign: "center", padding: "56px 20px 36px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 500, height: 280, background: "radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />
          <p style={{ color: "#374151", fontSize: 11, letterSpacing: 3, marginBottom: 14, fontWeight: 600 }}>INDIA'S SMARTEST JOB TRACKER</p>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 12px", letterSpacing: -2, lineHeight: 1.05, color: "white" }}>
            Your next <span style={{ WebkitTextStroke: "1.5px rgba(99,102,241,0.6)", WebkitTextFillColor: "transparent" }}>govt job</span><br />starts here.
          </h1>
          <p style={{ color: "#374151", fontSize: 14, maxWidth: 360, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Real-time alerts for Army, Police, SSC, Banking & more.
          </p>
          <div style={{ maxWidth: 340, margin: "0 auto" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search any job..." style={{ width: "100%", padding: "12px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "white", fontSize: 14, outline: "none" }} />
          </div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 14px 80px" }}>

        {/* Filters */}
        {page === "home" && (
          <div style={{ display: "flex", gap: 5, marginBottom: 18, flexWrap: "wrap", justifyContent: "center" }}>
            {CATEGORIES.map(cat => {
              const cfg = CAT_CONFIG[cat]
              const on = active === cat
              return (
                <button key={cat} onClick={() => setActive(cat)} style={{
                  padding: "6px 13px", borderRadius: 99, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                  border: `1px solid ${on ? (cfg?.color || "#6366F1") + "44" : "rgba(255,255,255,0.06)"}`,
                  background: on ? (cfg?.color || "#6366F1") + "15" : "transparent",
                  color: on ? (cfg?.color || "#818CF8") : "#374151", fontWeight: on ? 600 : 400,
                }}>{cfg?.emoji} {cat}</button>
              )
            })}
          </div>
        )}

        {/* Stats */}
        {page === "home" && !loading && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#1F2937", fontSize: 11 }}>{filtered.length} jobs</span>
            <span style={{ color: "#1F2937", fontSize: 11 }}>Updated daily</span>
          </div>
        )}

        {/* Bookmarks */}
        {page === "bookmarks" && (
          <div style={{ paddingTop: 28 }}>
            <h2 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Saved Jobs ({bookmarkedIds.length})</h2>
            {bookmarkedIds.length === 0 && <div style={{ textAlign: "center", padding: "50px 0", color: "#1F2937" }}><p>No saved jobs yet</p></div>}
            {notifications.filter(n => bookmarkedIds.includes(n.id)).map((n, i) => (
              <JobCard key={n.id} n={n} index={i} bookmarkedIds={bookmarkedIds} toggleBookmark={toggleBookmark} />
            ))}
          </div>
        )}

        {/* Loading */}
        {page === "home" && loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#1F2937", fontSize: 13 }}>Loading jobs...</div>}

        {/* Empty */}
        {page === "home" && !loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "#1F2937", fontSize: 13 }}>No jobs found</div>}

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
  const [hov, setHov] = useState(false)

  return (
    <div className="card" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius: 12, padding: "14px 16px", marginBottom: 7,
      border: `1px solid ${hov ? cfg.color + "33" : "rgba(255,255,255,0.05)"}`,
      background: hov ? cfg.color + "07" : "rgba(255,255,255,0.01)",
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
      transition: "border 0.2s, background 0.2s", opacity: expired ? 0.35 : 1,
      animationDelay: `${index * 60}ms`
    }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 7, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: cfg.color, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{cfg.emoji} {n.category.toUpperCase()}</span>
          {isNew(n.posted_on) && !expired && <span style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)" }}>NEW</span>}
          {urgent && <span style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24", padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, border: "1px solid rgba(251,191,36,0.2)" }}>⚡ {daysLeft}d</span>}
        </div>
        <h3 style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600, color: expired ? "#374151" : "#E5E7EB", lineHeight: 1.4 }}>{n.title}</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#374151" }}>📅 {n.last_date}</span>
          <span style={{ fontSize: 11, color: "#1F2937" }}>{n.source}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
        <button onClick={() => toggleBookmark(n.id)} style={{ background: saved ? "rgba(251,191,36,0.1)" : "transparent", border: `1px solid ${saved ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.07)"}`, color: saved ? "#FBBF24" : "#1F2937", borderRadius: 7, padding: "6px 9px", cursor: "pointer", fontSize: 13, transition: "all 0.2s" }}>{saved ? "★" : "☆"}</button>
        {!expired && <a href={n.link} target="_blank" rel="noreferrer" style={{ background: cfg.color + "1a", color: cfg.color, border: `1px solid ${cfg.color}33`, padding: "7px 14px", borderRadius: 7, textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Apply →</a>}
      </div>
    </div>
  )
}

const IS = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "white", fontSize: 13, outline: "none", marginTop: 5, display: "block" }
const LS = { color: "#4B5563", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block" }
const NAV = { padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", position: "sticky", top: 0, background: "rgba(7,7,12,0.95)", backdropFilter: "blur(10px)", zIndex: 100 }
const NB = { padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#4B5563", fontSize: 12, cursor: "pointer", fontWeight: 500 }
const CARD = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px", marginBottom: 12 }
const SH = { color: "white", fontSize: 14, fontWeight: 600, marginBottom: 16 }