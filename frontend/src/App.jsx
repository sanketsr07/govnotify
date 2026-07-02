import { useEffect, useState } from "react"

const API = "https://govnotify-ecxe.onrender.com"
const CATS = ["All","Police","Army","SSC","Railway","Banking","UPSC","Post Office","KPSC"]
const CC = {
  Police:        { color: "#60A5FA", emoji: "👮" },
  Army:          { color: "#34D399", emoji: "🪖" },
  SSC:           { color: "#FB923C", emoji: "📋" },
  Railway:       { color: "#A78BFA", emoji: "🚆" },
  Banking:       { color: "#FBBF24", emoji: "🏦" },
  UPSC:          { color: "#F472B6", emoji: "📚" },
  "Post Office": { color: "#2DD4BF", emoji: "📮" },
  KPSC:          { color: "#F87171", emoji: "🏛️" },
}

const getDl = (d) => {
  if (!d || ["TBA","Coming Soon","Check official site"].includes(d)) return null
  const p = new Date(d); if (isNaN(p)) return null
  return Math.ceil((p - new Date()) / 86400000)
}

const isNew = (p) => Math.ceil((new Date() - new Date(p)) / 86400000) <= 3

const vpwd = (p) => {
  if (p.length < 8) return "Min 8 characters"
  if (!/[A-Z]/.test(p)) return "Need uppercase letter (A-Z)"
  if (!/[a-z]/.test(p)) return "Need lowercase letter (a-z)"
  if (!/[0-9]/.test(p)) return "Need a number (0-9)"
  if (!/[!@#$%^&*]/.test(p)) return "Need special char (!@#$%^&*)"
  return null
}

const pstr = (p) => {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[a-z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[!@#$%^&*]/.test(p)) s++
  return [{l:"Weak",c:"#ef4444",w:"20%"},{l:"Weak",c:"#ef4444",w:"20%"},{l:"Fair",c:"#f97316",w:"40%"},{l:"Good",c:"#eab308",w:"65%"},{l:"Strong",c:"#22c55e",w:"85%"},{l:"Very Strong",c:"#6366f1",w:"100%"}][s]
}

// Shared styles
const IS = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid #27272a", background: "#09090b",
  color: "#e4e4e7", fontSize: 14, outline: "none",
  marginBottom: 14, display: "block", transition: "border .2s"
}
const LS = { color: "#71717a", fontSize: 12, fontWeight: 600, letterSpacing: .5, display: "block", marginBottom: 6 }
const NB = {
  padding: "6px 12px", borderRadius: 8,
  border: "1px solid #27272a", background: "transparent",
  color: "#71717a", fontSize: 13, cursor: "pointer", fontWeight: 500,
  transition: "all .15s"
}

export default function App() {
  const [jobs, setJobs] = useState([])
  const [fil, setFil] = useState([])
  const [cat, setCat] = useState("All")
  const [q, setQ] = useState("")
  const [load, setLoad] = useState(true)
  const [pg, setPg] = useState("home")
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gn_u") || "null") } catch { return null }
  })
  const [bm, setBm] = useState([])
  const [prof, setProf] = useState(null)
  const [form, setForm] = useState({ n: "", e: "", p: "" })
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)
  const [showP, setShowP] = useState(false)
  const [pwf, setPwf] = useState({ o: "", n: "", c: "" })
  const [pwErr, setPwErr] = useState("")
  const [pwOk, setPwOk] = useState("")
  const [nameV, setNameV] = useState("")
  const [nameOk, setNameOk] = useState("")

  // Load jobs
  useEffect(() => {
    fetch(`${API}/notifications`)
      .then(r => r.json())
      .then(d => { setJobs(d); setFil(d); setLoad(false) })
      .catch(() => setLoad(false))
  }, [])

  // Filter
  useEffect(() => {
    let r = jobs
    if (cat !== "All") r = r.filter(j => j.category === cat)
    if (q) r = r.filter(j => j.title.toLowerCase().includes(q.toLowerCase()))
    setFil(r)
  }, [cat, q, jobs])

  // Bookmarks
  useEffect(() => {
    if (user?.token) {
      fetch(`${API}/bookmarks/${user.token}`)
        .then(r => r.json())
        .then(d => Array.isArray(d) && setBm(d.map(j => j.id)))
        .catch(() => {})
    }
  }, [user])

  // Profile
  useEffect(() => {
    if (pg === "profile" && user?.token) {
      fetch(`${API}/profile/${user.token}`)
        .then(r => r.json())
        .then(d => { setProf(d); setNameV(d.name) })
        .catch(() => {})
    }
  }, [pg, user])

  const logout = () => {
    localStorage.removeItem("gn_u")
    setUser(null); setBm([]); setProf(null); setPg("home")
  }

  const auth = async (type) => {
    setErr(""); setBusy(true)
    try {
      if (type === "register") {
        if (!form.n.trim()) { setErr("Name is required"); setBusy(false); return }
        if (!form.e.includes("@")) { setErr("Enter a valid email"); setBusy(false); return }
        const ve = vpwd(form.p); if (ve) { setErr(ve); setBusy(false); return }
      }
      if (!form.e || !form.p) { setErr("All fields are required"); setBusy(false); return }
      const body = type === "register"
        ? { name: form.n, email: form.e, password: form.p }
        : { email: form.e, password: form.p }
      const res = await fetch(`${API}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.detail || "Something went wrong"); return }
      const u = { token: data.token, name: data.name }
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); setForm({ n: "", e: "", p: "" }); setPg("home")
    } catch {
      setErr("Server is waking up. Please wait 30 seconds and try again.")
    } finally { setBusy(false) }
  }

  const chPwd = async () => {
    setPwErr(""); setPwOk("")
    if (!pwf.o || !pwf.n || !pwf.c) { setPwErr("All fields are required"); return }
    if (pwf.n !== pwf.c) { setPwErr("New passwords don't match"); return }
    const e = vpwd(pwf.n); if (e) { setPwErr(e); return }
    try {
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, old_password: pwf.o, new_password: pwf.n })
      })
      const d = await res.json()
      if (!res.ok) { setPwErr(d.detail); return }
      setPwOk("✓ Password updated successfully!"); setPwf({ o: "", n: "", c: "" })
    } catch { setPwErr("Server error. Try again.") }
  }

  const chName = async () => {
    setNameOk("")
    if (!nameV.trim()) return
    try {
      const res = await fetch(`${API}/update-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, name: nameV })
      })
      const d = await res.json()
      if (!res.ok) return
      const u = { token: d.token, name: d.name }
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); setProf(p => ({ ...p, name: d.name })); setNameOk("✓ Name updated!")
    } catch {}
  }

  const togBm = async (id) => {
    if (!user) { setPg("login"); return }
    try {
      await fetch(`${API}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, notification_id: id })
      })
      setBm(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    } catch {}
  }

  const str = pstr(form.p)
  const isReg = pg === "register"

  // ── AUTH ──────────────────────────────────────────────────
  if (pg === "login" || pg === "register") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
        {/* Glow */}
        <div style={{ position: "fixed", top: "15%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 16, boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}>🇮🇳</div>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: -.5, marginBottom: 4 }}>
              {isReg ? "Create your account" : "Welcome back"}
            </h1>
            <p style={{ color: "#52525b", fontSize: 14 }}>
              {isReg ? "Join free · No spam ever" : "Sign in to GovNotify"}
            </p>
          </div>

          {/* Card */}
          <div style={{ background: "#111115", border: "1px solid #1e1e24", borderRadius: 20, padding: "28px 24px" }}>
            {isReg && (
              <div>
                <label style={LS}>Full Name</label>
                <input
                  placeholder="Sanket S R"
                  value={form.n}
                  onChange={e => setForm({ ...form, n: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && auth(pg)}
                  style={IS}
                />
              </div>
            )}

            <div>
              <label style={LS}>Email Address</label>
              <input
                placeholder="you@gmail.com"
                value={form.e}
                onChange={e => setForm({ ...form, e: e.target.value })}
                onKeyDown={e => e.key === "Enter" && auth(pg)}
                style={IS}
              />
            </div>

            <div>
              <label style={LS}>Password</label>
              <div style={{ position: "relative", marginBottom: isReg && form.p.length > 0 ? 8 : 14 }}>
                <input
                  placeholder={isReg ? "Min 8 chars, A-Z, 0-9, !@#" : "••••••••"}
                  type={showP ? "text" : "password"}
                  value={form.p}
                  onChange={e => setForm({ ...form, p: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && auth(pg)}
                  style={{ ...IS, paddingRight: 56, marginBottom: 0 }}
                />
                <button
                  onClick={() => setShowP(!showP)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: .5 }}
                >{showP ? "HIDE" : "SHOW"}</button>
              </div>
            </div>

            {/* Password strength */}
            {isReg && form.p.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: "#52525b", fontSize: 11 }}>Password strength</span>
                  <span style={{ color: str.c, fontSize: 11, fontWeight: 700 }}>{str.l}</span>
                </div>
                <div style={{ background: "#27272a", borderRadius: 99, height: 3, marginBottom: 10 }}>
                  <div style={{ height: "100%", width: str.w, background: str.c, borderRadius: 99, transition: "all .3s" }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[{ r: /.{8,}/, t: "8+ chars" }, { r: /[A-Z]/, t: "A-Z" }, { r: /[a-z]/, t: "a-z" }, { r: /[0-9]/, t: "0-9" }, { r: /[!@#$%^&*]/, t: "!@#" }].map(({ r, t }) => (
                    <span key={t} style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: r.test(form.p) ? "rgba(34,197,94,.12)" : "rgba(255,255,255,.04)", color: r.test(form.p) ? "#22c55e" : "#52525b", border: `1px solid ${r.test(form.p) ? "rgba(34,197,94,.25)" : "transparent"}`, transition: "all .2s" }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {err && (
              <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, padding: "11px 14px", marginBottom: 16 }}>
                <p style={{ color: "#fca5a5", fontSize: 13 }}>{err}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => auth(pg)}
              disabled={busy}
              style={{ width: "100%", padding: "13px", borderRadius: 12, background: busy ? "#3f3f46" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", marginBottom: 18, boxShadow: busy ? "none" : "0 4px 16px rgba(99,102,241,.3)", transition: "all .2s" }}
            >
              {busy ? "Please wait..." : isReg ? "Create account →" : "Sign in →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#52525b" }}>
              {isReg ? "Already have an account? " : "New here? "}
              <span
                onClick={() => { setPg(isReg ? "login" : "register"); setErr(""); setForm({ n: "", e: "", p: "" }) }}
                style={{ color: "#818cf8", cursor: "pointer", fontWeight: 600 }}
              >{isReg ? "Sign in" : "Create account"}</span>
            </p>
          </div>

          <p onClick={() => { setPg("home"); setErr("") }} style={{ textAlign: "center", fontSize: 13, color: "#3f3f46", cursor: "pointer", marginTop: 16 }}>← Back to home</p>
        </div>
      </div>
    )
  }

  // ── PROFILE ───────────────────────────────────────────────
  if (pg === "profile") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
        <nav style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #18181b", background: "rgba(10,10,15,.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>🇮🇳</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>GovNotify</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPg("home")} style={NB}>← Back</button>
            <button onClick={logout} style={{ ...NB, color: "#ef4444", borderColor: "rgba(239,68,68,.2)" }}>Sign out</button>
          </div>
        </nav>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 16px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 8px 20px rgba(99,102,241,.3)" }}>
              {(prof?.name || user?.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{prof?.name || user?.name}</h1>
              <p style={{ color: "#52525b", fontSize: 13, marginTop: 3 }}>{prof?.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
            {[
              { l: "Joined", v: prof?.joined || "—" },
              { l: "Saved Jobs", v: prof?.bookmarks ?? bm.length },
              { l: "Status", v: "Active ✓" }
            ].map(({ l, v }) => (
              <div key={l} style={{ background: "#111115", border: "1px solid #1e1e24", borderRadius: 14, padding: "16px 14px" }}>
                <p style={{ color: "#52525b", fontSize: 10, fontWeight: 700, letterSpacing: .8, marginBottom: 6 }}>{l.toUpperCase()}</p>
                <p style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Edit name */}
          <div style={{ background: "#111115", border: "1px solid #1e1e24", borderRadius: 16, padding: "20px 20px", marginBottom: 14 }}>
            <h2 style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Profile Info</h2>
            <label style={LS}>Display Name</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={nameV}
                onChange={e => setNameV(e.target.value)}
                onKeyDown={e => e.key === "Enter" && chName()}
                style={{ ...IS, flex: 1, marginBottom: 0 }}
              />
              <button
                onClick={chName}
                style={{ padding: "11px 18px", borderRadius: 10, background: "#6366f1", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
              >Save</button>
            </div>
            {nameOk && <p style={{ color: "#22c55e", fontSize: 12, marginTop: 10 }}>{nameOk}</p>}
          </div>

          {/* Change password */}
          <div style={{ background: "#111115", border: "1px solid #1e1e24", borderRadius: 16, padding: "20px 20px", marginBottom: 14 }}>
            <h2 style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Change Password</h2>
            <label style={LS}>Current Password</label>
            <input type="password" placeholder="••••••••" value={pwf.o} onChange={e => setPwf({ ...pwf, o: e.target.value })} style={IS} />
            <label style={LS}>New Password</label>
            <input type="password" placeholder="Min 8 chars, A-Z, 0-9, !@#" value={pwf.n} onChange={e => setPwf({ ...pwf, n: e.target.value })} style={IS} />
            <label style={LS}>Confirm New Password</label>
            <input type="password" placeholder="Repeat new password" value={pwf.c} onChange={e => setPwf({ ...pwf, c: e.target.value })} onKeyDown={e => e.key === "Enter" && chPwd()} style={{ ...IS, marginBottom: 16 }} />
            {pwErr && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}><p style={{ color: "#fca5a5", fontSize: 13 }}>{pwErr}</p></div>}
            {pwOk && <div style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}><p style={{ color: "#86efac", fontSize: 13 }}>{pwOk}</p></div>}
            <button onClick={chPwd} style={{ padding: "11px 20px", borderRadius: 10, background: "#6366f1", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Update Password</button>
          </div>

          {/* Sign out */}
          <div style={{ background: "#111115", border: "1px solid rgba(239,68,68,.15)", borderRadius: 16, padding: "20px 20px" }}>
            <h2 style={{ color: "#ef4444", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Sign Out</h2>
            <p style={{ color: "#52525b", fontSize: 13, marginBottom: 16 }}>Signs you out on this device.</p>
            <button onClick={logout} style={{ padding: "11px 20px", borderRadius: 10, background: "rgba(239,68,68,.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,.2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign out</button>
          </div>
        </div>
      </div>
    )
  }

  // ── HOME ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e4e4e7" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        .jc { animation: fadeUp .4s ease forwards; opacity:0 }
        .jc:hover { border-color: var(--hc) !important; background: var(--hbg) !important; }
        @media (max-width: 600px) {
          .hero-title { font-size: 32px !important; }
          .cat-pills { justify-content: flex-start !important; overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 4px; }
          .cat-pills::-webkit-scrollbar { height: 0; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #18181b", background: "rgba(10,10,15,.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🇮🇳</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: -.3 }}>GovNotify</span>
          <span style={{ fontSize: 9, color: "#22c55e", background: "rgba(34,197,94,.1)", padding: "2px 7px", borderRadius: 99, border: "1px solid rgba(34,197,94,.2)", fontWeight: 700, letterSpacing: .5 }}>LIVE</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {user ? (
            <>
              <button onClick={() => setPg(pg === "bookmarks" ? "home" : "bookmarks")} style={NB}>
                {pg === "bookmarks" ? "← Jobs" : `★ ${bm.length}`}
              </button>
              <button
                onClick={() => setPg("profile")}
                style={{ ...NB, background: "rgba(99,102,241,.1)", color: "#818cf8", borderColor: "rgba(99,102,241,.25)", display: "flex", alignItems: "center", gap: 7 }}
              >
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {user.name[0].toUpperCase()}
                </span>
                <span className="hide-mobile">{user.name.split(" ")[0]}</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPg("login")} style={NB}>Sign in</button>
              <button onClick={() => setPg("register")} style={{ ...NB, background: "rgba(99,102,241,.12)", color: "#818cf8", borderColor: "rgba(99,102,241,.25)", fontWeight: 600 }}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      {pg === "home" && (
        <div style={{ textAlign: "center", padding: "56px 20px 36px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 700, height: 350, background: "radial-gradient(ellipse, rgba(99,102,241,.06) 0%, transparent 65%)", pointerEvents: "none" }} />
          <p style={{ color: "#3f3f46", fontSize: 11, letterSpacing: 3, marginBottom: 14, fontWeight: 700 }}>INDIA'S SMARTEST JOB TRACKER</p>
          <h1 className="hero-title" style={{ fontSize: 46, fontWeight: 900, letterSpacing: -2, lineHeight: 1.06, marginBottom: 14, color: "#fff" }}>
            Your next{" "}
            <span style={{ WebkitTextStroke: "1.5px rgba(99,102,241,.7)", WebkitTextFillColor: "transparent" }}>govt job</span>
            <br />starts here.
          </h1>
          <p style={{ color: "#3f3f46", fontSize: 14, maxWidth: 340, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Real-time alerts · Army · Police · SSC · Banking & more
          </p>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search any job..."
            style={{ width: "100%", maxWidth: 360, padding: "13px 20px", borderRadius: 12, border: "1px solid #27272a", background: "rgba(255,255,255,.03)", color: "#e4e4e7", fontSize: 14, outline: "none", transition: "border .2s" }}
          />
        </div>
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 14px 80px" }}>

        {/* Category pills */}
        {pg === "home" && (
          <div className="cat-pills" style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap", justifyContent: "center" }}>
            {CATS.map(c => {
              const cfg = CC[c]; const on = cat === c
              return (
                <button key={c} onClick={() => setCat(c)} style={{ padding: "7px 14px", borderRadius: 99, fontSize: 12, cursor: "pointer", transition: "all .15s", border: `1px solid ${on ? (cfg?.color || "#6366f1") + "55" : "#27272a"}`, background: on ? (cfg?.color || "#6366f1") + "15" : "transparent", color: on ? (cfg?.color || "#818cf8") : "#52525b", fontWeight: on ? 700 : 400, whiteSpace: "nowrap" }}>
                  {cfg?.emoji} {c}
                </button>
              )
            })}
          </div>
        )}

        {/* Stats */}
        {pg === "home" && !load && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#27272a", fontSize: 11, fontWeight: 500 }}>{fil.length} jobs found</span>
            <span style={{ color: "#1c1c1f", fontSize: 11 }}>Updated daily</span>
          </div>
        )}

        {/* Bookmarks page */}
        {pg === "bookmarks" && (
          <div style={{ paddingTop: 28 }}>
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginBottom: 18 }}>Saved Jobs ({bm.length})</h2>
            {bm.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#27272a" }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>★</p>
                <p style={{ fontSize: 14 }}>No saved jobs yet. Click ☆ to save.</p>
              </div>
            )}
            {jobs.filter(j => bm.includes(j.id)).map((j, i) => <JCard key={j.id} j={j} i={i} bm={bm} tog={togBm} />)}
          </div>
        )}

        {/* Loading */}
        {pg === "home" && load && (
          <div style={{ textAlign: "center", padding: "70px 0", color: "#27272a" }}>
            <div style={{ width: 32, height: 32, border: "2px solid #27272a", borderTopColor: "#6366f1", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize: 13 }}>Loading jobs...</p>
            <p style={{ fontSize: 11, marginTop: 6, color: "#1c1c1f" }}>Server may be waking up (30s)</p>
          </div>
        )}

        {/* Empty */}
        {pg === "home" && !load && fil.length === 0 && (
          <div style={{ textAlign: "center", padding: "70px 0", color: "#27272a", fontSize: 14 }}>No jobs found</div>
        )}

        {/* Cards */}
        {pg === "home" && !load && fil.map((j, i) => <JCard key={j.id} j={j} i={i} bm={bm} tog={togBm} />)}
      </div>
    </div>
  )
}

function JCard({ j, i, bm, tog }) {
  const cfg = CC[j.category] || { color: "#6366f1", emoji: "📌" }
  const dl = getDl(j.last_date)
  const saved = bm.includes(j.id)
  const urgent = dl !== null && dl <= 7 && dl > 0
  const expired = dl !== null && dl <= 0

  return (
    <div
      className="jc"
      style={{
        "--hc": cfg.color + "33",
        "--hbg": cfg.color + "07",
        borderRadius: 14, padding: "16px 18px", marginBottom: 8,
        border: "1px solid #1e1e24",
        background: "rgba(255,255,255,.01)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, flexWrap: "wrap",
        transition: "border .2s, background .2s",
        opacity: expired ? .35 : 1,
        animationDelay: `${i * 50}ms`
      }}
    >
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: cfg.color, fontSize: 10, fontWeight: 800, letterSpacing: .8 }}>
            {cfg.emoji} {j.category.toUpperCase()}
          </span>
          {isNew(j.posted_on) && !expired && (
            <span style={{ background: "rgba(34,197,94,.1)", color: "#22c55e", padding: "2px 7px", borderRadius: 99, fontSize: 9, fontWeight: 800, border: "1px solid rgba(34,197,94,.2)", letterSpacing: .3 }}>NEW</span>
          )}
          {urgent && (
            <span style={{ background: "rgba(251,191,36,.1)", color: "#fbbf24", padding: "2px 7px", borderRadius: 99, fontSize: 9, fontWeight: 800, border: "1px solid rgba(251,191,36,.2)" }}>⚡ {dl}d left</span>
          )}
          {expired && (
            <span style={{ color: "#3f3f46", fontSize: 9, fontWeight: 600 }}>CLOSED</span>
          )}
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: expired ? "#3f3f46" : "#e4e4e7", lineHeight: 1.4, marginBottom: 6 }}>{j.title}</h3>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#3f3f46" }}>📅 {j.last_date}</span>
          <span style={{ fontSize: 11, color: "#27272a" }}>{j.source}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={() => tog(j.id)}
          style={{ background: saved ? "rgba(251,191,36,.1)" : "transparent", border: `1px solid ${saved ? "rgba(251,191,36,.3)" : "#27272a"}`, color: saved ? "#fbbf24" : "#3f3f46", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 14, transition: "all .2s" }}
        >{saved ? "★" : "☆"}</button>
        {!expired && (
          
            href={j.link}
            target="_blank"
            rel="noreferrer"
            style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30`, padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", transition: "all .2s" }}
          >Apply →</a>
        )}
      </div>
    </div>
  )
}