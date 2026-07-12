import { useEffect, useState, useRef } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, LayoutDashboard, Bookmark, LogIn, UserPlus,
  Search, ChevronDown, ChevronUp, ArrowRight, Star,
  Shield, Clock, Users, FileText, MapPin, Send,
  CheckCircle, LogOut, User, Settings, X
} from "lucide-react"

// ─── Config ──────────────────────────────────────────────────────────────────
const API = "https://govnotify-ecxe.onrender.com"

const CAT_CONFIG = {
  Police:        { color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20",   emoji: "👮", hex: "#60A5FA" },
  Army:          { color: "text-emerald-400",bg: "bg-emerald-400/10",border: "border-emerald-400/20",emoji: "🪖", hex: "#34D399" },
  SSC:           { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", emoji: "📋", hex: "#FB923C" },
  Railway:       { color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", emoji: "🚆", hex: "#A78BFA" },
  Banking:       { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", emoji: "🏦", hex: "#FBBF24" },
  UPSC:          { color: "text-pink-400",   bg: "bg-pink-400/10",   border: "border-pink-400/20",   emoji: "📚", hex: "#F472B6" },
  "Post Office": { color: "text-teal-400",   bg: "bg-teal-400/10",   border: "border-teal-400/20",   emoji: "📮", hex: "#2DD4BF" },
  KPSC:          { color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20",    emoji: "🏛️", hex: "#F87171" },
}
const CATS = ["All", ...Object.keys(CAT_CONFIG)]

const FAQS = [
  { q: "Is GovNotify connected to official sites?",  a: "Yes. Every Apply link goes directly to the official government recruitment portal — KSP, SSC, Indian Army, SBI, IBPS, UPSC, India Post, KPSC, and more. No third-party redirects." },
  { q: "Can I bookmark jobs?",                       a: "Yes. Create a free account and click the bookmark icon on any job card. Your saved jobs are available anytime under Bookmarks." },
  { q: "Is it mobile responsive?",                   a: "Fully. GovNotify works seamlessly on phones, tablets, and desktops." },
  { q: "How often is the data updated?",             a: "The job database auto-seeds on every server startup from official sources." },
  { q: "Is GovNotify free to use?",                  a: "Completely free. No ads, no paywalls. Create an account to unlock bookmarks." },
]

const TESTIMONIALS = [
  { name: "Rahul M.",  role: "Banking Candidate", stars: 5, text: "The official-source badges and deadline tracking make it easier to trust what I am seeing." },
  { name: "Sneha K.", role: "Final Year Student", stars: 5, text: "It feels like a modern startup product, but the data model is serious and government-source first." },
  { name: "Ananya R.",role: "UPSC Aspirant",      stars: 5, text: "GovNotify replaced scattered bookmarks with one verified interface for official portals." },
  { name: "Kiran B.", role: "SSC Candidate",      stars: 5, text: "The deadline countdown on each card saved me from missing the Karnataka Police application." },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getDl = d => {
  if (!d || ["TBA","Coming Soon","Check official site"].includes(d)) return null
  const p = new Date(d); if (isNaN(p)) return null
  return Math.ceil((p - new Date()) / 86400000)
}
const isNew  = p => Math.ceil((new Date() - new Date(p)) / 86400000) <= 7
const vpwd   = p => {
  if (p.length < 8)           return "Min 8 characters"
  if (!/[A-Z]/.test(p))      return "Need uppercase letter"
  if (!/[a-z]/.test(p))      return "Need lowercase letter"
  if (!/[0-9]/.test(p))      return "Need a number"
  if (!/[!@#$%^&*]/.test(p)) return "Need special char (!@#$%^&*)"
  return null
}
const pstr = p => {
  let s = 0
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++
  if (/[a-z]/.test(p)) s++; if (/[0-9]/.test(p)) s++
  if (/[!@#$%^&*]/.test(p)) s++
  return [
    { l: "Weak",       c: "#ef4444", w: "16%" },
    { l: "Weak",       c: "#ef4444", w: "16%" },
    { l: "Fair",       c: "#f97316", w: "38%" },
    { l: "Good",       c: "#eab308", w: "62%" },
    { l: "Strong",     c: "#22c55e", w: "84%" },
    { l: "Very Strong",c: "#6366f1", w: "100%" },
  ][s]
}

// ─── Shared Navbar ────────────────────────────────────────────────────────────
function Navbar({ user, onLogout }) {
  const nav = useNavigate()
  const loc = useLocation()

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/[0.06] bg-ink/95 backdrop-blur-xl">
      {/* Logo */}
      <button onClick={()=>nav("/")} className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-glow">
          <Bell size={18} className="text-white" />
        </div>
        <span className="text-white font-bold text-base tracking-tight">GovNotify</span>
        <span className="text-[9px] text-success font-bold tracking-widest bg-success/10 px-1.5 py-0.5 rounded-full border border-success/20">LIVE</span>
      </button>

      {/* Center nav */}
      <div className="hidden md:flex items-center gap-1">
        {[
          { label: "Dashboard",  icon: <LayoutDashboard size={14}/>, path: "/" },
          { label: "Bookmarks",  icon: <Bookmark size={14}/>,        path: user ? "/bookmarks" : "/login" },
          { label: user ? user.name.split(" ")[0] : "Login",
            icon: user ? <User size={14}/> : <LogIn size={14}/>,
            path: user ? "/profile" : "/login" },
        ].map(({ label, icon, path }) => (
          <button key={label} onClick={()=>nav(path)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${loc.pathname === path ? "text-white bg-white/08" : "text-muted hover:text-white hover:bg-white/[0.06]"}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Right */}
      {user
        ? <button onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-ink text-sm font-bold hover:bg-zinc-200 transition-all shrink-0">
            <LogOut size={14}/> Sign out
          </button>
        : <button onClick={()=>nav("/register")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-ink text-sm font-bold hover:bg-zinc-200 transition-all shrink-0">
            <UserPlus size={14}/> Register
          </button>
      }
    </nav>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ j, bm, tog, index = 0 }) {
  const cfg     = CAT_CONFIG[j.category] || { color:"text-indigo-400", bg:"bg-indigo-400/10", border:"border-indigo-400/20", emoji:"📌", hex:"#6366f1" }
  const dl      = getDl(j.last_date)
  const saved   = bm.includes(j.id)
  const urgent  = dl !== null && dl <= 7 && dl > 0
  const expired = dl !== null && dl <= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={`group relative flex flex-col gap-4 p-5 rounded-2xl border border-white/[0.08] bg-card hover:border-white/[0.16] transition-all duration-300 ${expired ? "opacity-40" : ""}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
            {cfg.emoji} {j.category.toUpperCase()}
          </span>
          {!expired && isNew(j.posted_on) && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-400/20">New</span>
          )}
          {urgent && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/12 text-amber-400 border border-amber-400/20">⚡ {dl}d left</span>
          )}
          {expired && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/[0.04] text-zinc-500">Closed</span>
          )}
        </div>
        <button onClick={() => tog(j.id)}
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border
            ${saved ? "bg-indigo-500/15 border-indigo-400/30 text-indigo-400" : "bg-white/[0.05] border-white/[0.08] text-zinc-500 hover:text-amber-400"}`}>
          {saved ? <Bookmark size={14} fill="currentColor"/> : <Bookmark size={14}/>}
        </button>
      </div>

      {/* Title */}
      <h3 className={`text-base font-700 leading-snug ${expired ? "text-zinc-500" : "text-zinc-100"}`}
        style={{ fontWeight: 700 }}>
        {j.title}
      </h3>

      {/* Source badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] w-fit">
        <span className="text-[10px]">🏛️</span>
        <span className="text-zinc-400 text-[11px]">{j.source}</span>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2">
        {[
          { icon: <Clock size={12}/>, text: `Last date: ${j.last_date}`, extra: dl !== null && dl > 0 && dl <= 30 ? <span className={`ml-auto text-[11px] font-semibold ${dl <= 7 ? "text-rose-400" : "text-emerald-400"}`}>⏳ {dl}d left</span> : null },
          { icon: <MapPin size={12}/>, text: "All India", extra: null },
        ].map(({ icon, text, extra }) => (
          <div key={text} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-zinc-500">{icon}</span>
            <span className="text-zinc-400 text-[13px]">{text}</span>
            {extra}
          </div>
        ))}
      </div>

      {/* Apply button */}
      {!expired ? (
        <a href={j.link} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: `${cfg.hex}20`, color: cfg.hex, border: `1px solid ${cfg.hex}30` }}>
          <ArrowRight size={14}/> Apply Now
        </a>
      ) : (
        <div className="flex items-center justify-center py-3 rounded-xl text-sm font-semibold bg-white/[0.03] text-zinc-500 border border-white/[0.05]">
          Application Closed
        </div>
      )}
    </motion.div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs,    setJobs]    = useState([])
  const [load,    setLoad]    = useState(true)
  const [loadErr, setLoadErr] = useState(false)
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem("gn_u") || "null") } catch { return null } })
  const [bm,      setBm]      = useState([])
  const pingRef = useRef(null)

  // Keep-alive ping
  useEffect(() => {
    const ping = () => fetch(`${API}/ping`).catch(() => {})
    ping()
    pingRef.current = setInterval(ping, 600000)
    return () => clearInterval(pingRef.current)
  }, [])

  // Load jobs with retry
  useEffect(() => {
    const go = async (attempt = 1) => {
      try {
        const r = await fetch(`${API}/notifications`)
        const d = await r.json()
        if (Array.isArray(d)) { setJobs(d); setLoad(false) }
        else if (attempt < 5) setTimeout(() => go(attempt + 1), 8000)
        else { setLoad(false); setLoadErr(true) }
      } catch {
        if (attempt < 5) setTimeout(() => go(attempt + 1), 8000)
        else { setLoad(false); setLoadErr(true) }
      }
    }
    go()
  }, [])

  // Bookmarks
  useEffect(() => {
    if (user?.token) {
      fetch(`${API}/bookmarks/${user.token}`)
        .then(r => r.json()).then(d => Array.isArray(d) && setBm(d.map(j => j.id))).catch(() => {})
    }
  }, [user])

  const logout = () => { localStorage.removeItem("gn_u"); setUser(null); setBm([]) }

  const togBm = async id => {
    if (!user) return
    try {
      await fetch(`${API}/bookmark`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: user.token, notification_id: id }) })
      setBm(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    } catch {}
  }

  return (
    <div className="min-h-screen bg-ink text-zinc-200">
      <Navbar user={user} onLogout={logout}/>
      <Routes>
        <Route path="/"          element={<HomePage    jobs={jobs} load={load} loadErr={loadErr} bm={bm} togBm={togBm} user={user}/>}/>
        <Route path="/login"     element={<LoginPage   setUser={setUser}/>}/>
        <Route path="/register"  element={<RegisterPage setUser={setUser}/>}/>
        <Route path="/profile"   element={<ProfilePage  user={user} bm={bm} logout={logout} setUser={setUser}/>}/>
        <Route path="/bookmarks" element={<BookmarksPage jobs={jobs} bm={bm} togBm={togBm} user={user}/>}/>
      </Routes>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ jobs, load, loadErr, bm, togBm, user }) {
  const nav = useNavigate()
  const [cat, setCat] = useState("All")
  const [q,   setQ]   = useState("")
  const [faqOpen, setFaqOpen] = useState(null)

  const fil = jobs.filter(j => {
    const catOk = cat === "All" || j.category === cat
    const qOk   = !q || j.title.toLowerCase().includes(q.toLowerCase())
    return catOk && qOk
  })
  const activeJobs = fil.filter(j => { const d = getDl(j.last_date); return d === null || d > 0 })
  const closedJobs = fil.filter(j => { const d = getDl(j.last_date); return d !== null && d <= 0 })
  const urgentCount = jobs.filter(j => { const d = getDl(j.last_date); return d !== null && d > 0 && d <= 7 }).length

  return (
    <main>
      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden px-6 md:px-12 lg:px-20"
        style={{ background: "linear-gradient(180deg,#0a0a16 0%,#0d0d1a 60%,#050505 100%)" }}>
        {/* Grid background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 100%)" }}/>
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(99,102,241,.1) 0%,transparent 60%)" }}/>

        <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_420px] gap-16 items-center py-20">
          {/* Left */}
          <div>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }}>
              {/* Badges */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.05] text-zinc-400 text-sm mb-6">
                ✦ {jobs.length || 10} official recruitment source tracks
              </div>
              <div className="mb-5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.05] text-zinc-400 text-sm">✦ GovNotify</span>
              </div>

              {/* Title */}
              <h1 className="text-[72px] md:text-[88px] font-black leading-[0.92] tracking-[-4px] text-white mb-7">
                Your next<br/>
                <span className="text-white">government</span><br/>
                <span style={{ WebkitTextStroke:"1px rgba(255,255,255,.25)", WebkitTextFillColor:"transparent" }}>job.</span>
              </h1>

              <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mb-10">
                Track official recruitment portals, bookmark important exams, and keep every deadline in one calm workspace.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <button onClick={()=>document.getElementById("jobs")?.scrollIntoView({behavior:"smooth"})}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-ink text-sm font-bold hover:bg-zinc-200 transition-all">
                  <ArrowRight size={16}/> Get Started
                </button>
                <button onClick={()=>document.getElementById("jobs")?.scrollIntoView({behavior:"smooth"})}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/15 text-zinc-200 text-sm font-semibold hover:bg-white/[0.06] transition-all">
                  Browse Jobs
                </button>
              </div>

              {/* Ticker */}
              {!load && jobs.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/[0.06] overflow-hidden">
                  <div className="flex gap-8 whitespace-nowrap" style={{ animation: "marquee 30s linear infinite" }}>
                    {[...jobs,...jobs].map((j,i) => (
                      <span key={i} className="inline-flex items-center gap-2 text-zinc-500 text-sm shrink-0">
                        <span style={{ color: CAT_CONFIG[j.category]?.hex || "#6366f1", fontSize:10 }}>●</span>
                        {j.title}
                      </span>
                    ))}
                  </div>
                  <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right — floating cards */}
          <div className="hidden lg:block relative h-[440px]">
            {/* Live badge */}
            <div className="absolute top-0 right-0 px-3 py-1.5 rounded-lg text-[10px] font-bold text-success bg-success/10 border border-success/20 tracking-widest">
              Live 2026
            </div>

            {/* Deadline card */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-0 glass rounded-2xl p-4 min-w-[220px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
                  <Clock size={18} className="text-zinc-300"/>
                </div>
                <div>
                  <p className="text-zinc-500 text-[11px] mb-0.5">Deadline</p>
                  <p className="text-white text-sm font-bold">{urgentCount > 0 ? `${urgentCount} closing soon` : "Check now"}</p>
                </div>
              </div>
            </motion.div>

            {/* Main notification card */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute top-[130px] right-5 left-[-20px] glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-white"/>
                  <span className="text-white font-bold text-sm">GovNotify</span>
                </div>
                <div className="flex gap-1.5">
                  {["#FF5F57","#FEBC2E","#28C840"].map((c,i) => <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background:c }}/>)}
                </div>
              </div>
              {!load && jobs.slice(0,3).map((j,i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-2">
                  <div>
                    <p className="text-zinc-200 text-[13px] font-medium">{j.title}</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5">Official portal verified</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0 ml-3">
                    <Bookmark size={12} className="text-rose-400"/>
                  </div>
                </div>
              ))}
              {load && [1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/[0.04] mb-2 animate-pulse"/>)}
            </motion.div>

            {/* Search card */}
            <div className="absolute bottom-5 right-0 left-5 glass rounded-2xl p-4">
              <div className="flex items-center gap-2 bg-white/[0.05] rounded-xl px-3 py-2.5">
                <Search size={14} className="text-zinc-500"/>
                <span className="text-zinc-500 text-sm">Search SSC, UPSC, Railway…</span>
                <span className="ml-auto bg-white/[0.08] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 font-semibold">⌘K</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 md:px-12 lg:px-20" style={{ background: "linear-gradient(180deg,#0d0d1a 0%,#050505 100%)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <FileText size={22}/>, n: jobs.length || 10, label: "Official source tracks" },
            { icon: <Clock size={22}/>,    n: jobs.length || 10, label: "Verified organizations" },
            { icon: <FileText size={22}/>, n: Object.keys(CAT_CONFIG).length, label: "Recruitment categories" },
            { icon: <Users size={22}/>,    n: jobs.filter(j=>{const d=getDl(j.last_date);return d===null||d>0}).length || 2, label: "Active application windows" },
          ].map(({ icon, n, label }) => (
            <div key={label} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-white/[0.06]">
              <div className="text-zinc-500 mb-4">{icon}</div>
              <p className="text-5xl font-black text-white tracking-tight mb-2">{n}</p>
              <p className="text-zinc-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED JOBS ── */}
      <section id="jobs" className="py-20 px-6 md:px-12 lg:px-20 bg-ink">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[3px] text-accent mb-4 uppercase">FEATURED JOBS</p>
            <h2 className="text-5xl font-black text-white tracking-tight mb-4">Official portals, neatly organized.</h2>
            <p className="text-zinc-400 text-base max-w-lg mx-auto">Search, filter, bookmark, and jump to verified exam and recruitment pages without noise.</p>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
            <input value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Search SSC, UPSC, Railway…"
              className="w-full pl-11 pr-16 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-200 placeholder-zinc-500 text-sm outline-none focus:border-accent/50 transition-all"/>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/[0.07] border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-500 font-semibold">⌘K</span>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            {CATS.map(c => {
              const cfg = CAT_CONFIG[c]; const on = cat === c
              return (
                <button key={c} onClick={() => setCat(c)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border
                    ${on ? "bg-white text-ink border-white font-bold" : "border-white/[0.1] text-zinc-400 hover:text-zinc-200 hover:border-white/20"}`}>
                  <FileText size={12}/> {c}
                </button>
              )
            })}
          </div>

          {!load && !loadErr && (
            <p className="text-zinc-500 text-xs text-center mb-6">{fil.length} recruitment{fil.length !== 1 ? "s" : ""} found</p>
          )}

          {/* Loading */}
          {load && (
            <div className="flex flex-col items-center py-24">
              <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-accent animate-spin mb-5"/>
              <p className="text-zinc-400 text-sm">Loading jobs…</p>
              <p className="text-zinc-600 text-xs mt-2">Server waking up — takes ~30 seconds</p>
            </div>
          )}

          {/* Error */}
          {loadErr && (
            <div className="text-center py-20">
              <p className="text-zinc-400 mb-4">Could not load jobs</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-full bg-accent text-white text-sm font-semibold">Retry</button>
            </div>
          )}

          {/* Empty */}
          {!load && !loadErr && fil.length === 0 && (
            <p className="text-center text-zinc-500 py-20">No jobs found{q ? ` for "${q}"` : ""}</p>
          )}

          {/* Active jobs grid */}
          {!load && !loadErr && activeJobs.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {activeJobs.map((j, i) => <JobCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>)}
            </div>
          )}

          {/* Closed */}
          {!load && !loadErr && closedJobs.length > 0 && (
            <div>
              <p className="text-zinc-600 text-[11px] font-bold tracking-widest mb-3">CLOSED</p>
              <div className="grid md:grid-cols-2 gap-3">
                {closedJobs.map((j, i) => <JobCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── WHY GOVNOTIFY ── */}
      <section className="py-20 px-6 md:px-12 lg:px-20" style={{ background: "linear-gradient(180deg,#050505 0%,#0d0d1a 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[3px] text-accent mb-4 uppercase">WHY GOVNOTIFY</p>
            <h2 className="text-5xl font-black text-white tracking-tight mb-4">Everything important stays close.</h2>
            <p className="text-zinc-400 text-base max-w-lg mx-auto">A clean system for aspirants who need clarity more than clutter.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Shield size={28}/>, title: "Verified Government Jobs", desc: "Curated opportunities with official sources, departments, and application links kept visible.", features: ["Official link scan","Department verified","No third-party noise"] },
              { icon: <Bell   size={28}/>, title: "Daily Updates",             desc: "A notification-first interface built around deadlines, categories, and new openings.",           features: ["Deadline countdowns","Category filters","NEW badge alerts"] },
            ].map(({ icon, title, desc, features }) => (
              <div key={title} className="p-8 rounded-2xl bg-card border border-white/[0.08] hover:border-white/[0.14] transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-300 mb-6">{icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-5">{desc}</p>
                {features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                    <span className="text-accent text-xs">✦</span> {f}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-0 bg-ink overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 mb-12">
          <p className="text-xs font-bold tracking-[3px] text-accent mb-4 uppercase text-center">TESTIMONIALS</p>
          <h2 className="text-5xl font-black text-white tracking-tight text-center">Built for focused aspirants.</h2>
        </div>
        <div className="flex gap-4 px-6 overflow-x-auto pb-4 scrollbar-none">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="shrink-0 w-80 p-6 rounded-2xl bg-card border border-white/[0.08]">
              <div className="flex gap-1 mb-4">{[...Array(t.stars)].map((_,j)=><Star key={j} size={14} fill="#FBBF24" className="text-amber-400"/>)}</div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-violet flex items-center justify-center text-white text-sm font-bold shrink-0">{t.name[0]}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-zinc-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 md:px-12 lg:px-20" style={{ background:"linear-gradient(180deg,#050505 0%,#0d0d1a 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-white tracking-tight mb-12 text-center">Production-minded from day one.</h2>
          {FAQS.map((f, i) => (
            <div key={i} className="border-b border-white/[0.08]">
              <button className="w-full flex items-center justify-between py-5 text-left text-zinc-200 text-base font-medium hover:text-white transition-colors"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                {f.q}
                {faqOpen === i ? <ChevronUp size={16} className="text-zinc-500 shrink-0"/> : <ChevronDown size={16} className="text-zinc-500 shrink-0"/>}
              </button>
              <AnimatePresence>
                {faqOpen === i && (
                  <motion.p initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.2 }}
                    className="text-zinc-400 text-sm leading-relaxed pb-5 overflow-hidden">
                    {f.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#07070d] border-t border-white/[0.06] pt-16 pb-8 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[260px_1fr_1fr_280px] gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center"><Bell size={18} className="text-white"/></div>
                <span className="text-white font-black text-lg">GovNotify</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">A verified government recruitment interface designed for speed, clarity, and deadline confidence.</p>
              <div className="flex gap-2">
                {["𝕏","▲","in","✉"].map((s,i)=>(
                  <div key={i} className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-500 text-sm cursor-pointer hover:text-zinc-200 transition-colors">{s}</div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white text-sm font-bold mb-5">Product</p>
              {["Dashboard","Bookmarks","Profile","Categories"].map(l=>(
                <p key={l} className="text-zinc-500 text-sm mb-3 cursor-pointer hover:text-zinc-300 transition-colors">{l}</p>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-bold mb-5">Resources</p>
              {["Notifications","Categories","FAQ"].map(l=>(
                <p key={l} className="text-zinc-500 text-sm mb-3 cursor-pointer hover:text-zinc-300 transition-colors">{l}</p>
              ))}
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
              <p className="text-white font-bold mb-2">Stay updated</p>
              <p className="text-zinc-500 text-sm leading-relaxed mb-4">Get product updates and new exam tracking improvements.</p>
              <div className="flex gap-2">
                <input placeholder="Email address" className="flex-1 px-3 py-2 rounded-lg bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none placeholder-zinc-600 focus:border-accent/40 transition-all"/>
                <button className="p-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"><Send size={14}/></button>
              </div>
              <div className="flex gap-4 mt-4">
                {["Privacy-ready","Terms-ready","Contact"].map(t=><span key={t} className="text-zinc-600 text-[11px] cursor-pointer hover:text-zinc-400 transition-colors">{t}</span>)}
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-6 text-center">
            <p className="text-zinc-600 text-xs">Copyright 2026 GovNotify. Built for portfolio presentation.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ setUser }) {
  const nav = useNavigate()
  const [form,  setForm]  = useState({ e: "", p: "" })
  const [err,   setErr]   = useState("")
  const [busy,  setBusy]  = useState(false)
  const [showP, setShowP] = useState(false)

  const submit = async () => {
    setErr(""); setBusy(true)
    try {
      if (!form.e || !form.p) { setErr("All fields required"); setBusy(false); return }
      const res  = await fetch(`${API}/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email:form.e,password:form.p}) })
      const data = await res.json()
      if (!res.ok) { setErr(data.detail || "Invalid credentials"); return }
      const u = { token:data.token, name:data.name }
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); nav("/")
    } catch { setErr("Server waking up. Wait 30s and try again.") }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background:"radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 65%)" }}/>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-violet mx-auto mb-5 flex items-center justify-center shadow-glow">
            <Bell size={26} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Welcome back</h1>
          <p className="text-zinc-400 text-sm">Sign in to your GovNotify account</p>
        </div>
        <div className="bg-card border border-white/[0.08] rounded-2xl p-7">
          <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">Email Address</label>
          <input className="w-full px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all mb-5 placeholder-zinc-600"
            placeholder="you@gmail.com" value={form.e} onChange={e=>setForm({...form,e:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">Password</label>
          <div className="relative mb-6">
            <input className="w-full px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all placeholder-zinc-600 pr-16"
              placeholder="••••••••" type={showP?"text":"password"} value={form.p} onChange={e=>setForm({...form,p:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <button onClick={()=>setShowP(!showP)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors">{showP?"HIDE":"SHOW"}</button>
          </div>
          {err && <div className="bg-rose-500/10 border border-rose-400/20 rounded-xl px-4 py-3 mb-5"><p className="text-rose-400 text-sm">{err}</p></div>}
          <button onClick={submit} disabled={busy}
            className="w-full py-3.5 rounded-xl font-bold text-sm mb-5 transition-all"
            style={{ background: busy?"#3f3f46":"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", opacity:busy?.7:1, boxShadow: busy?"none":"0 4px 20px rgba(99,102,241,.28)", cursor:busy?"not-allowed":"pointer" }}>
            {busy ? "Please wait…" : "Sign in →"}
          </button>
          <p className="text-center text-zinc-500 text-sm">New here? <span onClick={()=>nav("/register")} className="text-indigo-400 font-semibold cursor-pointer hover:text-indigo-300">Create account</span></p>
        </div>
        <p onClick={()=>nav("/")} className="text-center text-zinc-600 text-xs mt-4 cursor-pointer hover:text-zinc-400 transition-colors">← Back to home</p>
      </motion.div>
    </div>
  )
}

// ─── Register Page (split screen) ─────────────────────────────────────────────
function RegisterPage({ setUser }) {
  const nav = useNavigate()
  const [form,  setForm]  = useState({ n:"", e:"", p:"", cp:"" })
  const [err,   setErr]   = useState("")
  const [busy,  setBusy]  = useState(false)
  const [showP, setShowP] = useState(false)
  const str = pstr(form.p)

  const submit = async () => {
    setErr(""); setBusy(true)
    try {
      if (!form.n.trim())       { setErr("Name is required"); setBusy(false); return }
      if (!form.e.includes("@")){ setErr("Enter a valid email"); setBusy(false); return }
      const ve = vpwd(form.p);  if (ve) { setErr(ve); setBusy(false); return }
      if (form.p !== form.cp)   { setErr("Passwords don't match"); setBusy(false); return }
      const res  = await fetch(`${API}/register`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:form.n,email:form.e,password:form.p}) })
      const data = await res.json()
      if (!res.ok) { setErr(data.detail || "Something went wrong"); return }
      const u = { token:data.token, name:data.name }
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); nav("/")
    } catch { setErr("Server waking up. Wait 30s and try again.") }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grid md:grid-cols-2">
      {/* Left form */}
      <div className="flex flex-col justify-center px-8 md:px-14 py-12 border-r border-white/[0.06] overflow-y-auto">
        <div className="text-accent text-xs font-bold tracking-[3px] mb-4 uppercase">STEP 1 OF 2</div>
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">Create your GovNotify account.</h1>
        <p className="text-zinc-500 text-sm mb-8">Free forever · No spam · No ads</p>

        <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">Name</label>
        <input className="w-full px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all mb-4 placeholder-zinc-600"
          placeholder="Sanket Shivaji" value={form.n} onChange={e=>setForm({...form,n:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}/>

        <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">Email</label>
        <input className="w-full px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all mb-4 placeholder-zinc-600"
          placeholder="you@example.com" value={form.e} onChange={e=>setForm({...form,e:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}/>

        <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">Password</label>
        <div className="relative mb-2">
          <input className="w-full px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all placeholder-zinc-600 pr-16"
            placeholder="Create a strong password" type={showP?"text":"password"} value={form.p} onChange={e=>setForm({...form,p:e.target.value})}/>
          <button onClick={()=>setShowP(!showP)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500">{showP?"HIDE":"SHOW"}</button>
        </div>

        {form.p.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between mb-1.5"><span className="text-zinc-600 text-[10px] font-bold tracking-wider uppercase">Strength</span><span className="text-[10px] font-bold" style={{color:str.c}}>{str.l}</span></div>
            <div className="h-1 bg-zinc-800 rounded-full"><div className="h-full rounded-full transition-all" style={{width:str.w,background:str.c}}/></div>
          </div>
        )}

        <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">Confirm Password</label>
        <input className="w-full px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all mb-6 placeholder-zinc-600"
          placeholder="Repeat password" type="password" value={form.cp} onChange={e=>setForm({...form,cp:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()}/>

        {err && <div className="bg-rose-500/10 border border-rose-400/20 rounded-xl px-4 py-3 mb-5"><p className="text-rose-400 text-sm">{err}</p></div>}

        <button onClick={submit} disabled={busy}
          className="w-full py-4 rounded-xl font-bold text-sm mb-5 transition-all"
          style={{ background:busy?"#3f3f46":"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", opacity:busy?.7:1, boxShadow:busy?"none":"0 4px 20px rgba(99,102,241,.28)", cursor:busy?"not-allowed":"pointer" }}>
          {busy ? "Please wait…" : "Create account →"}
        </button>
        <p className="text-center text-zinc-500 text-sm">Already have account? <span onClick={()=>nav("/login")} className="text-indigo-400 font-semibold cursor-pointer">Sign in</span></p>
      </div>

      {/* Right brand panel */}
      <div className="hidden md:flex flex-col justify-center px-14 relative overflow-hidden"
        style={{ background:"linear-gradient(135deg,#0f0c29 0%,#1a1040 50%,#0d1a2e 100%)" }}>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none" style={{ background:"radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)" }}/>
        <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-10 relative">Never miss the last date again.</h2>
        <div className="flex flex-col gap-4 relative">
          {["Verified official links","Bookmarks and deadline tracking","Secure password encryption","Profile & account management"].map(t=>(
            <div key={t} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <CheckCircle size={12} className="text-emerald-400"/>
              </div>
              <span className="text-zinc-200 text-base">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, bm, logout, setUser }) {
  const nav = useNavigate()
  const [prof,   setProf]   = useState(null)
  const [nameV,  setNameV]  = useState("")
  const [nameOk, setNameOk] = useState("")
  const [pwf,    setPwf]    = useState({ o:"", n:"", c:"" })
  const [pwErr,  setPwErr]  = useState("")
  const [pwOk,   setPwOk]   = useState("")
  const [tab,    setTab]    = useState("profile") // profile | security

  useEffect(() => {
    if (!user) { nav("/login"); return }
    fetch(`${API}/profile/${user.token}`)
      .then(r=>r.json()).then(d=>{setProf(d);setNameV(d.name)}).catch(()=>{})
  }, [user])

  const chName = async () => {
    setNameOk("")
    if (!nameV.trim()) return
    try {
      const res  = await fetch(`${API}/update-name`,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:user.token,name:nameV}) })
      const d    = await res.json()
      if (!res.ok) return
      const u = { token:d.token, name:d.name }
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); setProf(p=>({...p,name:d.name})); setNameOk("✓ Name updated!")
    } catch {}
  }

  const chPwd = async () => {
    setPwErr(""); setPwOk("")
    if (!pwf.o||!pwf.n||!pwf.c) { setPwErr("All fields required"); return }
    if (pwf.n!==pwf.c)          { setPwErr("Passwords don't match"); return }
    const e = vpwd(pwf.n);       if (e) { setPwErr(e); return }
    try {
      const res = await fetch(`${API}/change-password`,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:user.token,old_password:pwf.o,new_password:pwf.n}) })
      const d   = await res.json()
      if (!res.ok) { setPwErr(d.detail); return }
      setPwOk("✓ Password updated!"); setPwf({o:"",n:"",c:""})
    } catch { setPwErr("Server error.") }
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Profile header card */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
        className="bg-card border border-white/[0.08] rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-violet flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-glow">
          {(prof?.name||user.name||"U")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white tracking-tight truncate">{prof?.name||user.name}</h1>
          <p className="text-zinc-500 text-sm mt-1 truncate">{prof?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">✓ Active</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-400/20">Free Plan</span>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { l:"Joined",    v:prof?.joined||"—" },
          { l:"Saved Jobs",v:prof?.bookmarks??bm.length },
          { l:"Status",    v:"Active ✓" },
        ].map(({l,v})=>(
          <div key={l} className="bg-card border border-white/[0.08] rounded-2xl p-5 text-center">
            <p className="text-zinc-600 text-[9px] font-bold tracking-widest uppercase mb-2">{l}</p>
            <p className="text-white text-xl font-black">{v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-white/[0.08] rounded-xl mb-6 w-fit">
        {[{k:"profile",label:"Profile"},{k:"security",label:"Security"}].map(({k,label})=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab===k?"bg-white/[0.1] text-white":"text-zinc-500 hover:text-zinc-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "profile" && (
          <motion.div key="profile" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-4">
            <div className="bg-card border border-white/[0.08] rounded-2xl p-6">
              <p className="text-white text-sm font-bold mb-5">Profile Info</p>
              <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">Display Name</label>
              <div className="flex gap-3">
                <input value={nameV} onChange={e=>setNameV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&chName()}
                  className="flex-1 px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all placeholder-zinc-600"/>
                <button onClick={chName} className="px-5 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/80 transition-colors shrink-0">Save</button>
              </div>
              {nameOk && <p className="text-emerald-400 text-xs mt-3">{nameOk}</p>}
            </div>

            <div className="bg-card border border-white/[0.08] rounded-2xl p-6">
              <p className="text-white text-sm font-bold mb-5">Quick Links</p>
              <div className="grid grid-cols-2 gap-3">
                {[{l:"Browse Jobs",fn:()=>nav("/")},{l:"Saved Jobs",fn:()=>nav("/bookmarks")}].map(({l,fn})=>(
                  <button key={l} onClick={fn} className="py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] transition-all">{l}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "security" && (
          <motion.div key="security" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-4">
            <div className="bg-card border border-white/[0.08] rounded-2xl p-6">
              <p className="text-white text-sm font-bold mb-5">Change Password</p>
              {[
                {k:"o",label:"Current Password",ph:"••••••••"},
                {k:"n",label:"New Password",    ph:"Min 8 chars, A–Z, 0–9, !@#"},
                {k:"c",label:"Confirm Password",ph:"Repeat new password"},
              ].map(({k,label,ph})=>(
                <div key={k} className="mb-4">
                  <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block mb-2">{label}</label>
                  <input type="password" placeholder={ph} value={pwf[k]} onChange={e=>setPwf({...pwf,[k]:e.target.value})} onKeyDown={e=>e.key==="Enter"&&chPwd()}
                    className="w-full px-4 py-3 rounded-xl bg-ink border border-white/[0.08] text-zinc-200 text-sm outline-none focus:border-accent/50 transition-all placeholder-zinc-600"/>
                </div>
              ))}
              {pwErr && <div className="bg-rose-500/10 border border-rose-400/20 rounded-xl px-4 py-3 mb-4"><p className="text-rose-400 text-sm">{pwErr}</p></div>}
              {pwOk  && <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl px-4 py-3 mb-4"><p className="text-emerald-400 text-sm">{pwOk}</p></div>}
              <button onClick={chPwd} className="px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/80 transition-colors">Update Password</button>
            </div>

            <div className="bg-card border border-rose-400/15 rounded-2xl p-6">
              <p className="text-rose-400 text-sm font-bold mb-2">Sign Out</p>
              <p className="text-zinc-500 text-sm mb-5">Signs you out on this device.</p>
              <button onClick={()=>{logout();nav("/")}} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-400 text-sm font-semibold hover:bg-rose-500/15 transition-all">
                <LogOut size={14}/> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Bookmarks Page ───────────────────────────────────────────────────────────
function BookmarksPage({ jobs, bm, togBm, user }) {
  const nav = useNavigate()

  useEffect(() => { if (!user) nav("/login") }, [user])

  const saved = jobs.filter(j => bm.includes(j.id))

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Saved Jobs</h1>
          <p className="text-zinc-500 text-sm mt-1">{bm.length} job{bm.length!==1?"s":""} saved</p>
        </div>
        <button onClick={()=>nav("/")} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-zinc-300 text-sm font-semibold hover:bg-white/[0.06] transition-all">
          ← All Jobs
        </button>
      </div>

      {saved.length === 0 ? (
        <div className="flex flex-col items-center py-24">
          <Bookmark size={48} className="text-zinc-700 mb-5"/>
          <p className="text-zinc-400 text-lg font-semibold mb-2">No saved jobs yet</p>
          <p className="text-zinc-600 text-sm">Click the bookmark icon on any job card to save it here</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {saved.map((j,i) => <JobCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>)}
        </div>
      )}
    </div>
  )
}