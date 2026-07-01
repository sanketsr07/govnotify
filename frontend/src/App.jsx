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

function getDl(d) {
  if (!d || ["TBA","Coming Soon","Check official site"].includes(d)) return null
  const p = new Date(d); if (isNaN(p)) return null
  return Math.ceil((p - new Date()) / 86400000)
}

function iN(p) { return Math.ceil((new Date() - new Date(p)) / 86400000) <= 3 }

function vp(p) {
  if (p.length < 8) return "Min 8 characters"
  if (!/[A-Z]/.test(p)) return "Need uppercase letter"
  if (!/[a-z]/.test(p)) return "Need lowercase letter"
  if (!/[0-9]/.test(p)) return "Need a number"
  if (!/[!@#$%^&*]/.test(p)) return "Need special char (!@#$%^&*)"
  return null
}

function ps(p) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[a-z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[!@#$%^&*]/.test(p)) s++
  return [
    { l: "Weak", c: "#EF4444", w: "20%" },
    { l: "Weak", c: "#EF4444", w: "20%" },
    { l: "Fair", c: "#F97316", w: "40%" },
    { l: "Good", c: "#EAB308", w: "65%" },
    { l: "Strong", c: "#22C55E", w: "85%" },
    { l: "Very Strong", c: "#6366F1", w: "100%" },
  ][s]
}

const IS = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #27272a", background: "#09090b", color: "#fff", fontSize: 13, outline: "none", marginBottom: 12, display: "block" }
const LS = { color: "#71717a", fontSize: 11, fontWeight: 600, letterSpacing: .5, display: "block", marginBottom: 4 }
const NB = { padding: "5px 10px", borderRadius: 7, border: "1px solid #27272a", background: "transparent", color: "#71717a", fontSize: 12, cursor: "pointer", fontWeight: 500 }
const CARD = { background: "#111113", border: "1px solid #1c1c1f", borderRadius: 14, padding: 20, marginBottom: 12 }

export default function App() {
  const [jobs, setJobs] = useState([])
  const [fil, setFil] = useState([])
  const [cat, setCat] = useState("All")
  const [q, setQ] = useState("")
  const [load, setLoad] = useState(true)
  const [pg, setPg] = useState("home")
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("gn_u") || "null"))
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

  useEffect(() => {
    fetch(`${API}/notifications`)
      .then(r => r.json())
      .then(d => { setJobs(d); setFil(d); setLoad(false) })
      .catch(() => setLoad(false))
  }, [])

  useEffect(() => {
    let r = jobs
    if (cat !== "All") r = r.filter(j => j.category === cat)
    if (q) r = r.filter(j => j.title.toLowerCase().includes(q.toLowerCase()))
    setFil(r)
  }, [cat, q, jobs])

  useEffect(() => {
    if (user) {
      fetch(`${API}/bookmarks/${user.token}`)
        .then(r => r.json())
        .then(d => Array.isArray(d) && setBm(d.map(j => j.id)))
        .catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (pg === "profile" && user) {
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
        if (!form.n.trim()) { setErr("Name required"); setBusy(false); return }
        if (!form.e.includes("@")) { setErr("Valid email required"); setBusy(false); return }
        const ve = vp(form.p); if (ve) { setErr(ve); setBusy(false); return }
      }
      if (!form.e || !form.p) { setErr("All fields required"); setBusy(false); return }
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
      setErr("Server waking up. Wait 30 seconds and try again.")
    } finally {
      setBusy(false)
    }
  }

  const chPwd = async () => {
    setPwErr(""); setPwOk("")
    if (!pwf.o || !pwf.n || !pwf.c) { setPwErr("All fields required"); return }
    if (pwf.n !== pwf.c) { setPwErr("Passwords don't match"); return }
    const e = vp(pwf.n); if (e) { setPwErr(e); return }
    try {
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: user.token, old_password: pwf.o, new_password: pwf.n })
      })
      const d = await res.json()
      if (!res.ok) { setPwErr(d.detail); return }
      setPwOk("Password updated!"); setPwf({ o: "", n: "", c: "" })
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
      setUser(u); setProf(p => ({ ...p, name: d.name })); setNameOk("Name updated!")
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

  const str = ps(form.p)

  // ── AUTH PAGE ─────────────────────────────────────────────
  if (pg === "login" || pg === "register") {
    const isReg = pg === "register"
    return (
      <div style={{ minHeight: "100vh", background: "#0c0c0f", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 14 }}>🇮🇳</div>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>
              {isReg ? "Create account" : "Welcome back"}
            </h1>
            <p style={{ color: "#52525b", fontSize: 13, marginTop: 4 }}>
              {isReg ? "Free forever · No spam" : "Sign in to GovNotify"}
            </p>
          </div>

          <div style={{ background: "#111113", borderRadius: 16, padding: 24, border: "1px solid #1c1c1f" }}>
            {isReg && (
              <div style={{ marginBottom: 4 }}>
                <label style={LS}>Full Name</label>
                <input placeholder="Your name" value={form.n} onChange={e => setForm({ ...form, n: e.target.value })} onKeyDown={e => e.key === "Enter" && auth(pg)} style={IS} />
              </div>
            )}
            <div style={{ marginBottom: 4 }}>
              <label style={LS}>Email</label>
              <input placeholder="you@gmail.com" value={form.e} onChange={e => setForm({ ...form, e: e.target.value })} onKeyDown={e => e.key === "Enter" && auth(pg)} style={IS} />
            </div>
            <div style={{ marginBottom: isReg ? 4 : 16 }}>
              <label style={LS}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  placeholder={isReg ? "Min 8 chars, A-Z, 0-9, !@#" : "••••••••"}
                  type={showP ? "text" : "password"}
                  value={form.p}
                  onChange={e => setForm({ ...form, p: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && auth(pg)}
                  style={{ ...IS, paddingRight: 52 }}
                />
                <button onClick={() => setShowP(!showP)} style={{ position: "absolute", right: 12, top: 10, background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  {showP ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {isReg && form.p.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#52525b", fontSize: 11 }}>Strength</span>
                  <span style={{ color: str.c, fontSize: 11, fontWeight: 600 }}>{str.l}</span>
                </div>
                <div style={{ background: "#27272a", borderRadius: 99, height: 3 }}>
                  <div style={{ height: "100%", width: str.w, background: str.c, borderRadius: 99, transition: "all .3s" }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                  {[{ r: /.{8,}/, t: "8+ chars" }, { r: /[A-Z]/, t: "A-Z" }, { r: /[a-z]/, t: "a-z" }, { r: /[0-9]/, t: "0-9" }, { r: /[!@#$%^&*]/, t: "!@#" }].map(({ r, t }) => (
                    <span key={t} style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, background: r.test(form.p) ? "rgba(34,197,94,.12)" : "rgba(255,255,255,.04)", color: r.test(form.p) ? "#22c55e" : "#52525b", border: `1px solid ${r.test(form.p) ? "rgba(34,197,94,.3)" : "transparent"}` }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {err && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}><p style={{ color: "#fca5a5", fontSize: 12 }}>{err}</p></div>}

            <button onClick={() => auth(pg)} disabled={busy} style={{ width: "100%", padding: 12, borderRadius: 10, background: busy ? "#3f3f46" : "#6366f1", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", marginBottom: 16 }}>
              {busy ? "Please wait..." : isReg ? "Create account →" : "Sign in →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "#52525b" }}>
              {isReg ? "Already have account? " : "New here? "}
              <span onClick={() => { setPg(isReg ? "login" : "register"); setErr(""); setForm({ n: "", e: "", p: "" }) }} style={{ color: "#818cf8", cursor: "pointer", fontWeight: 600 }}>
                {isReg ? "Sign in" : "Create account"}
              </span>
            </p>
          </div>
          <p onClick={() => { setPg("home"); setErr("") }} style={{ textAlign: "center", fontSize: 12, color: "#3f3f46", cursor: "pointer", marginTop: 14 }}>← Back to home</p>
        </div>
      </div>
    )
  }

  // ── PROFILE PAGE ──────────────────────────────────────────
  if (pg === "profile") {
    return (
      <div style={{ minHeight: "100vh", background: "#0c0c0f" }}>
        <nav style={{ padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #18181b", background: "rgba(12,12,15,.97)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🇮🇳</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>GovNotify</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPg("home")} style={NB}>← Jobs</button>
            <button onClick={logout} style={{ ...NB, color: "#ef4444", borderColor: "rgba(239,68,68,.2)" }}>Sign out</button>
          </div>
        </nav>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 16px 80px" }}>
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {(prof?.name || user?.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{prof?.name || user?.name}</h1>
              <p style={{ color: "#52525b", fontSize: 13, marginTop: 2 }}>{prof?.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
            {[{ l: "Joined", v: prof?.joined || "—" }, { l: "Saved", v: prof?.bookmarks ?? bm.length }, { l: "Status", v: "Active ✓" }].map(({ l, v }) => (
              <div key={l} style={{ background: "#111113", border: "1px solid #1c1c1f", borderRadius: 12, padding: "14px 12px" }}>
                <p style={{ color: "#52525b", fontSize: 10, fontWeight: 600, letterSpacing: .5, marginBottom: 4 }}>{l.toUpperCase()}</p>
                <p style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Edit name */}
          <div style={CARD}>
            <h2 style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Profile Info</h2>
            <label style={LS}>Display Name</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={nameV} onChange={e => setNameV(e.target.value)} onKeyDown={e => e.key === "Enter" && chName()} style={{ ...IS, flex: 1, marginBottom: 0 }} />
              <button onClick={chName} style={{ padding: "10px 16px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Save</button>
            </div>
            {nameOk && <p style={{ color: "#22c55e", fontSize: 12, marginTop: 8 }}>{nameOk}</p>}
          </div>

          {/* Change password */}
          <div style={CARD}>
            <h2 style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Change Password</h2>
            <label style={LS}>Current Password</label>
            <input type="password" placeholder="••••••••" value={pwf.o} onChange={e => setPwf({ ...pwf, o: e.target.value })} style={IS} />
            <label style={LS}>New Password</label>
            <input type="password" placeholder="Min 8 chars, A-Z, 0-9, !@#" value={pwf.n} onChange={e => setPwf({ ...pwf, n: e.target.value })} style={IS} />
            <label style={LS}>Confirm New Password</label>
            <input type="password" placeholder="Repeat new password" value={pwf.c} onChange={e => setPwf({ ...pwf, c: e.target.value })} onKeyDown={e => e.key === "Enter" && chPwd()} style={IS} />
            {pwErr && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "9px 12px", marginBottom: 12 }}><p style={{ color: "#fca5a5", fontSize: 12 }}>{pwErr}</p></div>}
            {pwOk && <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, padding: "9px 12px", marginBottom: 12 }}><p style={{ color: "#86efac", fontSize: 12 }}>{pwOk}</p></div>}
            <button onClick={chPwd} style={{ padding: "10px 18px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Update Password</button>
          </div>

          {/* Sign out */}
          <div style={{ ...CARD, borderColor: "rgba(239,68,68,.15)" }}>
            <h2 style={{ color: "#ef4444", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sign Out</h2>
            <p style={{ color: "#52525b", fontSize: 13, marginBottom: 14 }}>Signs you out on this device.</p>
            <button onClick={logout} style={{ padding: "10px 18px", borderRadius: 8, background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.25)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign out</button>
          </div>
        </div>
      </div>
    )
  }

  // ── HOME PAGE ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0f", color: "#fff" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .jc { animation: fadeUp .35s ease forwards; opacity:0 }
        * { box-sizing:border-box }
        input::placeholder { color:#3f3f46 }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-track { background:#0c0c0f }
        ::-webkit-scrollbar-thumb { background:#27272a; border-radius:2px }
      `}</style>

      {/* Navbar */}
      <nav style={{ padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #18181b", background: "rgba(12,12,15,.97)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🇮🇳</span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -.3 }}>GovNotify</span>
          <span style={{ fontSize: 9, color: "#22c55e", background: "rgba(34,197,94,.1)", padding: "2px 6px", borderRadius: 99, border: "1px solid rgba(34,197,94,.2)", marginLeft: 2 }}>LIVE</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {user ? (
            <>
              <button onClick={() => setPg(pg === "bookmarks" ? "home" : "bookmarks")} style={NB}>
                {pg === "bookmarks" ? "← Jobs" : `★ ${bm.length}`}
              </button>
              <button onClick={() => setPg("profile")} style={{ ...NB, background: "rgba(99,102,241,.12)", color: "#818cf8", borderColor: "rgba(99,102,241,.25)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                  {user.name[0].toUpperCase()}
                </span>
                {user.name.split(" ")[0]}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPg("login")} style={NB}>Sign in</button>
              <button onClick={() => setPg("register")} style={{ ...NB, background: "rgba(99,102,241,.15)", color: "#818cf8", borderColor: "rgba(99,102,241,.3)" }}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      {pg === "home" && (
        <div style={{ textAlign: "center", padding: "52px 20px 32px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse,rgba(99,102,241,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
          <p style={{ color: "#3f3f46", fontSize: 11, letterSpacing: 3, marginBottom: 12, fontWeight: 600 }}>INDIA'S SMARTEST JOB TRACKER</p>
          <h1 style={{ fontSize: "clamp(28px,6vw,44px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1.08, marginBottom: 12 }}>
            Your next{" "}
            <span style={{ WebkitTextStroke: "1.5px rgba(99,102,241,.65)", WebkitTextFillColor: "transparent" }}>govt job</span>
            <br />starts here.
          </h1>
          <p style={{ color: "#3f3f46", fontSize: 14, maxWidth: 340, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Real-time alerts · Army · Police · SSC · Banking & more
          </p>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search any job..."
            style={{ width: "100%", maxWidth: 340, padding: "12px 18px", borderRadius: 10, border: "1px solid #27272a", background: "rgba(255,255,255,.03)", color: "#fff", fontSize: 14, outline: "none" }}
          />
        </div>
      )}

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 14px 80px" }}>

        {/* Category pills */}
        {pg === "home" && (
          <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {CATS.map(c => {
              const cfg = CC[c]; const on = cat === c
              return (
                <button key={c} onClick={() => setCat(c)} style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", transition: "all .15s", border: `1px solid ${on ? (cfg?.color || "#6366f1") + "44" : "#27272a"}`, background: on ? (cfg?.color || "#6366f1") + "14" : "transparent", color: on ? (cfg?.color || "#818cf8") : "#52525b", fontWeight: on ? 600 : 400 }}>
                  {cfg?.emoji} {c}
                </button>
              )
            })}
          </div>
        )}

        {/* Count */}
        {pg === "home" && !load && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#27272a", fontSize: 11 }}>{fil.length} jobs found</span>
            <span style={{ color: "#27272a", fontSize: 11 }}>Updated daily</span>
          </div>
        )}

        {/* Bookmarks */}
        {pg === "bookmarks" && (
          <div style={{ paddingTop: 28 }}>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Saved Jobs ({bm.length})</h2>
            {bm.length === 0 && <div style={{ textAlign: "center", padding: "50px 0", color: "#27272a" }}><p style={{ fontSize: 14 }}>Save jobs by clicking ☆</p></div>}
            {jobs.filter(j => bm.includes(j.id)).map((j, i) => <JCard key={j.id} j={j} i={i} bm={bm} tog={togBm} />)}
          </div>
        )}

        {/* Loading */}
        {pg === "home" && load && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#27272a" }}>
            <p style={{ fontSize: 13 }}>Loading jobs...</p>
            <p style={{ fontSize: 11, marginTop: 8, color: "#1c1c1f" }}>Server may be waking up (30s)</p>
          </div>
        )}

        {/* Empty */}
        {pg === "home" && !load && fil.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#27272a", fontSize: 13 }}>No jobs found</div>
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
  const [hov, setHov] = useState(false)

  return (
    <div className="jc" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius: 12, padding: "14px 16px", marginBottom: 7,
      border: `1px solid ${hov ? cfg.color + "33" : "#1c1c1f"}`,
      background: hov ? cfg.color + "07" : "rgba(255,255,255,.01)",
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
      transition: "border .2s,background .2s", opacity: expired ? .35 : 1,
      animationDelay: `${i * 55}ms`
    }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 7, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: cfg.color, fontSize: 10, fontWeight: 700, letterSpacing: .5 }}>{cfg.emoji} {j.category.toUpperCase()}</span>
          {iN(j.posted_on) && !expired && <span style={{ background: "rgba(34,197,94,.1)", color: "#22c55e", padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, border: "1px solid rgba(34,197,94,.2)" }}>NEW</span>}
          {urgent && <span style={{ background: "rgba(251,191,36,.1)", color: "#fbbf24", padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, border: "1px solid rgba(251,191,36,.2)" }}>⚡ {dl}d</span>}
        </div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: expired ? "#3f3f46" : "#e4e4e7", lineHeight: 1.4, marginBottom: 5 }}>{j.title}</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#3f3f46" }}>📅 {j.last_date}</span>
          <span style={{ fontSize: 11, color: "#27272a" }}>{j.source}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
        <button onClick={() => tog(j.id)} style={{ background: saved ? "rgba(251,191,36,.1)" : "transparent", border: `1px solid ${saved ? "rgba(251,191,36,.3)" : "#27272a"}`, color: saved ? "#fbbf24" : "#3f3f46", borderRadius: 7, padding: "6px 9px", cursor: "pointer", fontSize: 13, transition: "all .2s" }}>{saved ? "★" : "☆"}</button>
        {!expired && <a href={j.link} target="_blank" rel="noreferrer" style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30`, padding: "7px 13px", borderRadius: 7, textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Apply →</a>}
      </div>
    </div>
  )
}