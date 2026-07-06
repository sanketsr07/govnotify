import { useEffect, useState, useRef } from "react"

const API = "https://govnotify-ecxe.onrender.com"
const CATS = ["All","Police","Army","SSC","Railway","Banking","UPSC","Post Office","KPSC"]
const CC = {
  Police:        { color:"#60A5FA", emoji:"👮" },
  Army:          { color:"#34D399", emoji:"🪖" },
  SSC:           { color:"#FB923C", emoji:"📋" },
  Railway:       { color:"#A78BFA", emoji:"🚆" },
  Banking:       { color:"#FBBF24", emoji:"🏦" },
  UPSC:          { color:"#F472B6", emoji:"📚" },
  "Post Office": { color:"#2DD4BF", emoji:"📮" },
  KPSC:          { color:"#F87171", emoji:"🏛️" },
}

const getDl = d => {
  if (!d || ["TBA","Coming Soon","Check official site"].includes(d)) return null
  const p = new Date(d); if (isNaN(p)) return null
  return Math.ceil((p - new Date()) / 86400000)
}

const isNew = p => Math.ceil((new Date() - new Date(p)) / 86400000) <= 7

const vpwd = p => {
  if (p.length < 8) return "Min 8 characters required"
  if (!/[A-Z]/.test(p)) return "Need at least one uppercase letter"
  if (!/[a-z]/.test(p)) return "Need at least one lowercase letter"
  if (!/[0-9]/.test(p)) return "Need at least one number"
  if (!/[!@#$%^&*]/.test(p)) return "Need a special character (!@#$%^&*)"
  return null
}

const pstr = p => {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[a-z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[!@#$%^&*]/.test(p)) s++
  return [
    {l:"Weak",c:"#ef4444",w:"20%"},
    {l:"Weak",c:"#ef4444",w:"20%"},
    {l:"Fair",c:"#f97316",w:"40%"},
    {l:"Good",c:"#eab308",w:"65%"},
    {l:"Strong",c:"#22c55e",w:"85%"},
    {l:"Very Strong",c:"#6366f1",w:"100%"},
  ][s]
}

const IS = { width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid #27272a", background:"#09090b", color:"#e4e4e7", fontSize:14, outline:"none", marginBottom:14, display:"block" }
const LS = { color:"#71717a", fontSize:12, fontWeight:600, letterSpacing:.5, display:"block", marginBottom:6 }
const NB = { padding:"6px 12px", borderRadius:8, border:"1px solid #27272a", background:"transparent", color:"#71717a", fontSize:13, cursor:"pointer", fontWeight:500 }

export default function App() {
  const [jobs, setJobs] = useState([])
  const [fil, setFil] = useState([])
  const [cat, setCat] = useState("All")
  const [q, setQ] = useState("")
  const [load, setLoad] = useState(true)
  const [loadErr, setLoadErr] = useState(false)
  const [pg, setPg] = useState("home")
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("gn_u")||"null") } catch { return null } })
  const [bm, setBm] = useState([])
  const [prof, setProf] = useState(null)
  const [form, setForm] = useState({n:"",e:"",p:""})
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)
  const [showP, setShowP] = useState(false)
  const [pwf, setPwf] = useState({o:"",n:"",c:""})
  const [pwErr, setPwErr] = useState("")
  const [pwOk, setPwOk] = useState("")
  const [nameV, setNameV] = useState("")
  const [nameOk, setNameOk] = useState("")
  const pingRef = useRef(null)

  // Keep server alive with ping every 10 minutes
  useEffect(() => {
    const ping = () => fetch(`${API}/ping`).catch(() => {})
    ping()
    pingRef.current = setInterval(ping, 600000)
    return () => clearInterval(pingRef.current)
  }, [])

  // Load jobs with retry
  useEffect(() => {
    const load = async (attempt = 1) => {
      try {
        const r = await fetch(`${API}/notifications`)
        const d = await r.json()
        if (Array.isArray(d)) { setJobs(d); setFil(d); setLoad(false) }
        else if (attempt < 4) setTimeout(() => load(attempt + 1), 8000)
        else { setLoad(false); setLoadErr(true) }
      } catch {
        if (attempt < 4) setTimeout(() => load(attempt + 1), 8000)
        else { setLoad(false); setLoadErr(true) }
      }
    }
    load()
  }, [])

  useEffect(() => {
    let r = jobs
    if (cat !== "All") r = r.filter(j => j.category === cat)
    if (q) r = r.filter(j => j.title.toLowerCase().includes(q.toLowerCase()))
    setFil(r)
  }, [cat, q, jobs])

  useEffect(() => {
    if (user?.token) {
      fetch(`${API}/bookmarks/${user.token}`).then(r => r.json()).then(d => Array.isArray(d) && setBm(d.map(j => j.id))).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (pg === "profile" && user?.token) {
      fetch(`${API}/profile/${user.token}`).then(r => r.json()).then(d => { setProf(d); setNameV(d.name) }).catch(() => {})
    }
  }, [pg, user])

  const logout = () => { localStorage.removeItem("gn_u"); setUser(null); setBm([]); setProf(null); setPg("home") }

  const auth = async type => {
    setErr(""); setBusy(true)
    try {
      if (type === "register") {
        if (!form.n.trim()) { setErr("Name is required"); setBusy(false); return }
        if (!form.e.includes("@")) { setErr("Enter a valid email"); setBusy(false); return }
        const ve = vpwd(form.p); if (ve) { setErr(ve); setBusy(false); return }
      }
      if (!form.e || !form.p) { setErr("All fields are required"); setBusy(false); return }
      const body = type === "register" ? {name:form.n,email:form.e,password:form.p} : {email:form.e,password:form.p}
      const res = await fetch(`${API}/${type}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setErr(data.detail || "Something went wrong"); return }
      const u = {token:data.token,name:data.name}
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); setForm({n:"",e:"",p:""}); setPg("home")
    } catch { setErr("Server is starting up. Please wait 30 seconds and try again.") }
    finally { setBusy(false) }
  }

  const chPwd = async () => {
    setPwErr(""); setPwOk("")
    if (!pwf.o||!pwf.n||!pwf.c) { setPwErr("All fields are required"); return }
    if (pwf.n !== pwf.c) { setPwErr("New passwords don't match"); return }
    const e = vpwd(pwf.n); if (e) { setPwErr(e); return }
    try {
      const res = await fetch(`${API}/change-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:user.token,old_password:pwf.o,new_password:pwf.n}) })
      const d = await res.json()
      if (!res.ok) { setPwErr(d.detail); return }
      setPwOk("✓ Password updated!"); setPwf({o:"",n:"",c:""})
    } catch { setPwErr("Server error. Try again.") }
  }

  const chName = async () => {
    setNameOk("")
    if (!nameV.trim()) return
    try {
      const res = await fetch(`${API}/update-name`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:user.token,name:nameV}) })
      const d = await res.json()
      if (!res.ok) return
      const u = {token:d.token,name:d.name}
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); setProf(p => ({...p,name:d.name})); setNameOk("✓ Name updated!")
    } catch {}
  }

  const togBm = async id => {
    if (!user) { setPg("login"); return }
    try {
      await fetch(`${API}/bookmark`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:user.token,notification_id:id}) })
      setBm(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    } catch {}
  }

  const str = pstr(form.p)
  const isReg = pg === "register"

  // ── AUTH ──────────────────────────────────────────────────
  if (pg === "login" || pg === "register") return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px"}}>
      <div style={{position:"fixed",top:"10%",left:"50%",transform:"translateX(-50%)",width:500,height:500,background:"radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420,position:"relative"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:18,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16,boxShadow:"0 8px 28px rgba(99,102,241,.35)"}}>🇮🇳</div>
          <h1 style={{color:"#fff",fontSize:24,fontWeight:800,letterSpacing:-.5,marginBottom:6}}>{isReg?"Create your account":"Welcome back"}</h1>
          <p style={{color:"#52525b",fontSize:14}}>{isReg?"Join free · No spam ever":"Sign in to GovNotify"}</p>
        </div>

        <div style={{background:"#111115",border:"1px solid #1e1e24",borderRadius:20,padding:"28px 24px"}}>
          {isReg && <>
            <label style={LS}>Full Name</label>
            <input placeholder="Your full name" value={form.n} onChange={e=>setForm({...form,n:e.target.value})} onKeyDown={e=>e.key==="Enter"&&auth(pg)} style={IS}/>
          </>}

          <label style={LS}>Email Address</label>
          <input placeholder="you@gmail.com" value={form.e} onChange={e=>setForm({...form,e:e.target.value})} onKeyDown={e=>e.key==="Enter"&&auth(pg)} style={IS}/>

          <label style={LS}>Password</label>
          <div style={{position:"relative",marginBottom:isReg&&form.p.length>0?8:14}}>
            <input placeholder={isReg?"Min 8 chars, A-Z, 0-9, !@#":"••••••••"} type={showP?"text":"password"} value={form.p} onChange={e=>setForm({...form,p:e.target.value})} onKeyDown={e=>e.key==="Enter"&&auth(pg)} style={{...IS,paddingRight:60,marginBottom:0}}/>
            <button onClick={()=>setShowP(!showP)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#52525b",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:.5}}>{showP?"HIDE":"SHOW"}</button>
          </div>

          {isReg && form.p.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:"#52525b",fontSize:11}}>Strength</span>
                <span style={{color:str.c,fontSize:11,fontWeight:700}}>{str.l}</span>
              </div>
              <div style={{background:"#27272a",borderRadius:99,height:3,marginBottom:10}}>
                <div style={{height:"100%",width:str.w,background:str.c,borderRadius:99,transition:"all .3s"}}/>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {[{r:/.{8,}/,t:"8+"},{r:/[A-Z]/,t:"A-Z"},{r:/[a-z]/,t:"a-z"},{r:/[0-9]/,t:"0-9"},{r:/[!@#$%^&*]/,t:"!@#"}].map(({r,t})=>(
                  <span key={t} style={{padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:500,background:r.test(form.p)?"rgba(34,197,94,.12)":"rgba(255,255,255,.04)",color:r.test(form.p)?"#22c55e":"#52525b",border:`1px solid ${r.test(form.p)?"rgba(34,197,94,.25)":"transparent"}`,transition:"all .2s"}}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {err && <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"11px 14px",marginBottom:16}}><p style={{color:"#fca5a5",fontSize:13}}>{err}</p></div>}

          <button onClick={()=>auth(pg)} disabled={busy} style={{width:"100%",padding:13,borderRadius:12,background:busy?"#3f3f46":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:busy?"not-allowed":"pointer",marginBottom:18,boxShadow:busy?"none":"0 4px 16px rgba(99,102,241,.3)"}}>
            {busy?"Please wait...":(isReg?"Create account →":"Sign in →")}
          </button>

          <p style={{textAlign:"center",fontSize:13,color:"#52525b"}}>
            {isReg?"Already have an account? ":"New here? "}
            <span onClick={()=>{setPg(isReg?"login":"register");setErr("");setForm({n:"",e:"",p:""})}} style={{color:"#818cf8",cursor:"pointer",fontWeight:600}}>{isReg?"Sign in":"Create account"}</span>
          </p>
        </div>
        <p onClick={()=>{setPg("home");setErr("")}} style={{textAlign:"center",fontSize:13,color:"#3f3f46",cursor:"pointer",marginTop:16}}>← Back to home</p>
      </div>
    </div>
  )

  // ── PROFILE ───────────────────────────────────────────────
  if (pg === "profile") return (
    <div style={{minHeight:"100vh",background:"#0a0a0f"}}>
      <nav style={{padding:"0 20px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #18181b",background:"rgba(10,10,15,.97)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>🇮🇳</span>
          <span style={{color:"#fff",fontWeight:800,fontSize:15}}>GovNotify</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setPg("home")} style={NB}>← Back</button>
          <button onClick={logout} style={{...NB,color:"#ef4444",borderColor:"rgba(239,68,68,.2)"}}>Sign out</button>
        </div>
      </nav>

      <div style={{maxWidth:560,margin:"0 auto",padding:"36px 16px 80px"}}>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
          <div style={{width:60,height:60,borderRadius:18,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:"#fff",flexShrink:0,boxShadow:"0 8px 20px rgba(99,102,241,.3)"}}>
            {(prof?.name||user?.name||"U")[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{color:"#fff",fontSize:20,fontWeight:700}}>{prof?.name||user?.name}</h1>
            <p style={{color:"#52525b",fontSize:13,marginTop:3}}>{prof?.email}</p>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
          {[{l:"Joined",v:prof?.joined||"—"},{l:"Saved Jobs",v:prof?.bookmarks??bm.length},{l:"Status",v:"Active ✓"}].map(({l,v})=>(
            <div key={l} style={{background:"#111115",border:"1px solid #1e1e24",borderRadius:14,padding:"16px 14px"}}>
              <p style={{color:"#52525b",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:6}}>{l.toUpperCase()}</p>
              <p style={{color:"#fff",fontSize:16,fontWeight:700}}>{v}</p>
            </div>
          ))}
        </div>

        {/* Edit name */}
        <div style={{background:"#111115",border:"1px solid #1e1e24",borderRadius:16,padding:"20px",marginBottom:12}}>
          <h2 style={{color:"#fff",fontSize:14,fontWeight:700,marginBottom:16}}>Profile Info</h2>
          <label style={LS}>Display Name</label>
          <div style={{display:"flex",gap:8}}>
            <input value={nameV} onChange={e=>setNameV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&chName()} style={{...IS,flex:1,marginBottom:0}}/>
            <button onClick={chName} style={{padding:"12px 18px",borderRadius:10,background:"#6366f1",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0}}>Save</button>
          </div>
          {nameOk && <p style={{color:"#22c55e",fontSize:12,marginTop:10}}>{nameOk}</p>}
        </div>

        {/* Change password */}
        <div style={{background:"#111115",border:"1px solid #1e1e24",borderRadius:16,padding:"20px",marginBottom:12}}>
          <h2 style={{color:"#fff",fontSize:14,fontWeight:700,marginBottom:16}}>Change Password</h2>
          <label style={LS}>Current Password</label>
          <input type="password" placeholder="••••••••" value={pwf.o} onChange={e=>setPwf({...pwf,o:e.target.value})} style={IS}/>
          <label style={LS}>New Password</label>
          <input type="password" placeholder="Min 8 chars, A-Z, 0-9, !@#" value={pwf.n} onChange={e=>setPwf({...pwf,n:e.target.value})} style={IS}/>
          <label style={LS}>Confirm New Password</label>
          <input type="password" placeholder="Repeat new password" value={pwf.c} onChange={e=>setPwf({...pwf,c:e.target.value})} onKeyDown={e=>e.key==="Enter"&&chPwd()} style={{...IS,marginBottom:16}}/>
          {pwErr && <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"10px 12px",marginBottom:12}}><p style={{color:"#fca5a5",fontSize:13}}>{pwErr}</p></div>}
          {pwOk && <div style={{background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:8,padding:"10px 12px",marginBottom:12}}><p style={{color:"#86efac",fontSize:13}}>{pwOk}</p></div>}
          <button onClick={chPwd} style={{padding:"11px 20px",borderRadius:10,background:"#6366f1",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Update Password</button>
        </div>

        {/* Sign out */}
        <div style={{background:"#111115",border:"1px solid rgba(239,68,68,.15)",borderRadius:16,padding:"20px"}}>
          <h2 style={{color:"#ef4444",fontSize:14,fontWeight:700,marginBottom:8}}>Sign Out</h2>
          <p style={{color:"#52525b",fontSize:13,marginBottom:14}}>Signs you out on this device.</p>
          <button onClick={logout} style={{padding:"11px 20px",borderRadius:10,background:"rgba(239,68,68,.08)",color:"#ef4444",border:"1px solid rgba(239,68,68,.2)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Sign out</button>
        </div>
      </div>
    </div>
  )

  // ── HOME ──────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#e4e4e7"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .jc{animation:fadeUp .35s ease forwards;opacity:0}
        .jc:hover{border-color:var(--hc)!important;background:var(--hbg)!important}
        .apply-btn:hover{opacity:.85}
        @media(max-width:640px){
          .hero h1{font-size:30px!important;letter-spacing:-1px!important}
          .cat-wrap{overflow-x:auto;flex-wrap:nowrap!important;justify-content:flex-start!important;padding-bottom:6px}
          .cat-wrap::-webkit-scrollbar{height:0}
          .hide-sm{display:none!important}
          .card-btns{flex-direction:column;align-items:stretch!important}
          .card-btns a{text-align:center}
        }
      `}</style>

      {/* Navbar */}
      <nav style={{padding:"0 20px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #18181b",background:"rgba(10,10,15,.98)",backdropFilter:"blur(14px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>🇮🇳</span>
          <span style={{color:"#fff",fontWeight:800,fontSize:16,letterSpacing:-.3}}>GovNotify</span>
          <span style={{fontSize:9,color:"#22c55e",background:"rgba(34,197,94,.1)",padding:"2px 7px",borderRadius:99,border:"1px solid rgba(34,197,94,.2)",fontWeight:700,letterSpacing:.5}}>LIVE</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {user ? <>
            <button onClick={()=>setPg(pg==="bookmarks"?"home":"bookmarks")} style={NB}>
              {pg==="bookmarks"?"← Jobs":`★ ${bm.length}`}
            </button>
            <button onClick={()=>setPg("profile")} style={{...NB,background:"rgba(99,102,241,.1)",color:"#818cf8",borderColor:"rgba(99,102,241,.25)",display:"flex",alignItems:"center",gap:7}}>
              <span style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>
                {user.name[0].toUpperCase()}
              </span>
              <span className="hide-sm">{user.name.split(" ")[0]}</span>
            </button>
          </> : <>
            <button onClick={()=>setPg("login")} style={NB}>Sign in</button>
            <button onClick={()=>setPg("register")} style={{...NB,background:"rgba(99,102,241,.12)",color:"#818cf8",borderColor:"rgba(99,102,241,.25)",fontWeight:600}}>Sign up</button>
          </>}
        </div>
      </nav>

      {/* Hero */}
      {pg === "home" && (
        <div className="hero" style={{textAlign:"center",padding:"60px 20px 40px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(99,102,241,.06) 0%,transparent 60%)",pointerEvents:"none"}}/>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.15)",borderRadius:99,padding:"5px 14px",marginBottom:20}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
            <span style={{color:"#22c55e",fontSize:11,fontWeight:600,letterSpacing:.5}}>LIVE · Updated Daily</span>
          </div>
          <h1 style={{fontSize:48,fontWeight:900,letterSpacing:-2,lineHeight:1.05,marginBottom:14,color:"#fff"}}>
            Your next{" "}
            <span style={{WebkitTextStroke:"1.5px rgba(99,102,241,.7)",WebkitTextFillColor:"transparent"}}>govt job</span>
            <br/>starts here.
          </h1>
          <p style={{color:"#52525b",fontSize:15,maxWidth:380,margin:"0 auto 32px",lineHeight:1.7}}>
            Real-time alerts for Army, Police, SSC, Banking & more across India.
          </p>
          <div style={{maxWidth:380,margin:"0 auto",position:"relative"}}>
            <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",color:"#3f3f46",fontSize:16}}>⌕</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search any job..." style={{width:"100%",padding:"13px 18px 13px 44px",borderRadius:12,border:"1px solid #27272a",background:"rgba(255,255,255,.03)",color:"#e4e4e7",fontSize:14,outline:"none"}}/>
          </div>
        </div>
      )}

      <div style={{maxWidth:740,margin:"0 auto",padding:"0 14px 80px"}}>

        {/* Category pills */}
        {pg === "home" && (
          <div className="cat-wrap" style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap",justifyContent:"center"}}>
            {CATS.map(c => {
              const cfg = CC[c]; const on = cat === c
              return (
                <button key={c} onClick={()=>setCat(c)} style={{padding:"7px 14px",borderRadius:99,fontSize:12,cursor:"pointer",transition:"all .15s",border:`1px solid ${on?(cfg?.color||"#6366f1")+"55":"#27272a"}`,background:on?(cfg?.color||"#6366f1")+"14":"transparent",color:on?(cfg?.color||"#818cf8"):"#52525b",fontWeight:on?700:400,whiteSpace:"nowrap"}}>
                  {cfg?.emoji} {c}
                </button>
              )
            })}
          </div>
        )}

        {/* Count */}
        {pg === "home" && !load && !loadErr && (
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,padding:"0 2px"}}>
            <span style={{color:"#27272a",fontSize:11,fontWeight:500}}>{fil.length} job{fil.length!==1?"s":""} found</span>
            <span style={{color:"#1c1c1f",fontSize:11}}>Updated daily</span>
          </div>
        )}

        {/* Bookmarks */}
        {pg === "bookmarks" && (
          <div style={{paddingTop:28}}>
            <h2 style={{color:"#fff",fontSize:18,fontWeight:700,marginBottom:20}}>Saved Jobs ({bm.length})</h2>
            {bm.length === 0 && (
              <div style={{textAlign:"center",padding:"60px 0",color:"#27272a"}}>
                <p style={{fontSize:40,marginBottom:12}}>★</p>
                <p style={{fontSize:14}}>No saved jobs yet.</p>
                <p style={{fontSize:12,marginTop:4,color:"#1c1c1f"}}>Click ☆ on any job to save it here.</p>
              </div>
            )}
            {jobs.filter(j=>bm.includes(j.id)).map((j,i)=><JCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>)}
          </div>
        )}

        {/* Loading */}
        {pg === "home" && load && (
          <div style={{textAlign:"center",padding:"80px 0"}}>
            <div style={{width:36,height:36,border:"2px solid #27272a",borderTopColor:"#6366f1",borderRadius:"50%",margin:"0 auto 20px",animation:"spin 1s linear infinite"}}/>
            <p style={{color:"#27272a",fontSize:13}}>Loading jobs...</p>
            <p style={{color:"#1c1c1f",fontSize:11,marginTop:6}}>Server waking up, please wait...</p>
          </div>
        )}

        {/* Error */}
        {pg === "home" && loadErr && (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <p style={{color:"#3f3f46",fontSize:14,marginBottom:12}}>Could not load jobs.</p>
            <button onClick={()=>window.location.reload()} style={{padding:"10px 20px",borderRadius:8,background:"#6366f1",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {pg === "home" && !load && !loadErr && fil.length === 0 && (
          <div style={{textAlign:"center",padding:"60px 0",color:"#27272a",fontSize:14}}>No jobs found for "{q}"</div>
        )}

        {/* Cards */}
        {pg === "home" && !load && !loadErr && fil.map((j,i)=><JCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>)}
      </div>

      {/* Footer */}
      {pg === "home" && !load && (
        <footer style={{borderTop:"1px solid #18181b",padding:"24px 20px",textAlign:"center"}}>
          <p style={{color:"#27272a",fontSize:12}}>🇮🇳 GovNotify · Real-time government job alerts for India</p>
          <p style={{color:"#1c1c1f",fontSize:11,marginTop:4}}>Data sourced from official government websites</p>
        </footer>
      )}
    </div>
  )
}

function JCard({j, i, bm, tog}) {
  const cfg = CC[j.category] || {color:"#6366f1",emoji:"📌"}
  const dl = getDl(j.last_date)
  const saved = bm.includes(j.id)
  const urgent = dl !== null && dl <= 7 && dl > 0
  const expired = dl !== null && dl <= 0

  return (
    <div className="jc" style={{
      "--hc": cfg.color+"33",
      "--hbg": cfg.color+"07",
      borderRadius:14, padding:"18px 20px", marginBottom:9,
      border:"1px solid #1e1e24",
      background:"#0d0d12",
      display:"flex", justifyContent:"space-between", alignItems:"center",
      gap:14, flexWrap:"wrap",
      transition:"border .2s,background .2s",
      opacity:expired?.3:1,
      animationDelay:`${i*45}ms`
    }}>
      <div style={{flex:1,minWidth:180}}>
        <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{color:cfg.color,fontSize:10,fontWeight:800,letterSpacing:.8}}>
            {cfg.emoji} {j.category.toUpperCase()}
          </span>
          {isNew(j.posted_on)&&!expired&&(
            <span style={{background:"rgba(34,197,94,.1)",color:"#22c55e",padding:"2px 7px",borderRadius:99,fontSize:9,fontWeight:800,border:"1px solid rgba(34,197,94,.2)"}}>NEW</span>
          )}
          {urgent&&(
            <span style={{background:"rgba(251,191,36,.1)",color:"#fbbf24",padding:"2px 7px",borderRadius:99,fontSize:9,fontWeight:800,border:"1px solid rgba(251,191,36,.2)"}}>⚡ {dl}d left</span>
          )}
          {expired&&<span style={{color:"#3f3f46",fontSize:9,fontWeight:700,letterSpacing:.5}}>CLOSED</span>}
        </div>
        <h3 style={{fontSize:14,fontWeight:600,color:expired?"#3f3f46":"#e4e4e7",lineHeight:1.45,marginBottom:7}}>{j.title}</h3>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"#3f3f46"}}>📅 {j.last_date}</span>
          <span style={{fontSize:11,color:"#27272a"}}>🏛️ {j.source}</span>
        </div>
      </div>
      <div className="card-btns" style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
        <button onClick={()=>tog(j.id)} style={{background:saved?"rgba(251,191,36,.1)":"transparent",border:`1px solid ${saved?"rgba(251,191,36,.3)":"#27272a"}`,color:saved?"#fbbf24":"#3f3f46",borderRadius:9,padding:"8px 11px",cursor:"pointer",fontSize:15,transition:"all .2s",flexShrink:0}}>
          {saved?"★":"☆"}
        </button>
        {!expired&&(
          <a href={j.link} target="_blank" rel="noreferrer" className="apply-btn" style={{background:cfg.color+"18",color:cfg.color,border:`1px solid ${cfg.color}30`,padding:"9px 18px",borderRadius:9,fontSize:13,fontWeight:700,whiteSpace:"nowrap",transition:"opacity .2s"}}>
            Apply →
          </a>
        )}
      </div>
    </div>
  )
}