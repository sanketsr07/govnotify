import { useEffect, useState, useRef } from "react"

const API = "https://govnotify-ecxe.onrender.com"
const CATS = ["All","Police","Army","SSC","Railway","Banking","UPSC","Post Office","KPSC"]
const CC = {
  Police:        { color:"#60A5FA", dim:"rgba(96,165,250,.12)",  emoji:"👮" },
  Army:          { color:"#34D399", dim:"rgba(52,211,153,.12)",  emoji:"🪖" },
  SSC:           { color:"#FB923C", dim:"rgba(251,146,60,.12)",  emoji:"📋" },
  Railway:       { color:"#A78BFA", dim:"rgba(167,139,250,.12)", emoji:"🚆" },
  Banking:       { color:"#FBBF24", dim:"rgba(251,191,36,.12)",  emoji:"🏦" },
  UPSC:          { color:"#F472B6", dim:"rgba(244,114,182,.12)", emoji:"📚" },
  "Post Office": { color:"#2DD4BF", dim:"rgba(45,212,191,.12)",  emoji:"📮" },
  KPSC:          { color:"#F87171", dim:"rgba(248,113,113,.12)", emoji:"🏛️" },
}

const getDl = d => {
  if (!d || ["TBA","Coming Soon","Check official site"].includes(d)) return null
  const p = new Date(d); if (isNaN(p)) return null
  return Math.ceil((p - new Date()) / 86400000)
}
const isNew = p => Math.ceil((new Date() - new Date(p)) / 86400000) <= 7

const vpwd = p => {
  if (p.length < 8)           return "Min 8 characters required"
  if (!/[A-Z]/.test(p))      return "Need at least one uppercase letter"
  if (!/[a-z]/.test(p))      return "Need at least one lowercase letter"
  if (!/[0-9]/.test(p))      return "Need at least one number"
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
    {l:"Weak",      c:"#ef4444", w:"16%"},
    {l:"Weak",      c:"#ef4444", w:"16%"},
    {l:"Fair",      c:"#f97316", w:"38%"},
    {l:"Good",      c:"#eab308", w:"62%"},
    {l:"Strong",    c:"#22c55e", w:"84%"},
    {l:"Very Strong",c:"#6366f1",w:"100%"},
  ][s]
}

// ── Tiny shared style objects ────────────────────────────────────────────────
const NB = {
  padding:"5px 12px", borderRadius:7,
  border:"1px solid #1f1f23", background:"transparent",
  color:"#71717a", fontSize:12, cursor:"pointer", fontWeight:500,
}
const LS = {
  color:"#71717a", fontSize:11, fontWeight:600,
  letterSpacing:.6, display:"block", marginBottom:6, textTransform:"uppercase",
}

export default function App() {
  const [jobs,    setJobs]    = useState([])
  const [fil,     setFil]     = useState([])
  const [cat,     setCat]     = useState("All")
  const [q,       setQ]       = useState("")
  const [load,    setLoad]    = useState(true)
  const [loadErr, setLoadErr] = useState(false)
  const [pg,      setPg]      = useState("home")
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("gn_u")||"null") } catch { return null }
  })
  const [bm,      setBm]      = useState([])
  const [prof,    setProf]    = useState(null)
  const [form,    setForm]    = useState({n:"",e:"",p:""})
  const [err,     setErr]     = useState("")
  const [busy,    setBusy]    = useState(false)
  const [showP,   setShowP]   = useState(false)
  const [pwf,     setPwf]     = useState({o:"",n:"",c:""})
  const [pwErr,   setPwErr]   = useState("")
  const [pwOk,    setPwOk]    = useState("")
  const [nameV,   setNameV]   = useState("")
  const [nameOk,  setNameOk]  = useState("")
  const pingRef = useRef(null)

  // Keep server alive
  useEffect(() => {
    const ping = () => fetch(`${API}/ping`).catch(()=>{})
    ping()
    pingRef.current = setInterval(ping, 600000)
    return () => clearInterval(pingRef.current)
  }, [])

  // Load jobs with retry
  useEffect(() => {
    const go = async (attempt=1) => {
      try {
        const r = await fetch(`${API}/notifications`)
        const d = await r.json()
        if (Array.isArray(d)) { setJobs(d); setFil(d); setLoad(false) }
        else if (attempt < 5) setTimeout(()=>go(attempt+1), 8000)
        else { setLoad(false); setLoadErr(true) }
      } catch {
        if (attempt < 5) setTimeout(()=>go(attempt+1), 8000)
        else { setLoad(false); setLoadErr(true) }
      }
    }
    go()
  }, [])

  useEffect(() => {
    let r = jobs
    if (cat !== "All") r = r.filter(j => j.category === cat)
    if (q) r = r.filter(j => j.title.toLowerCase().includes(q.toLowerCase()))
    setFil(r)
  }, [cat, q, jobs])

  useEffect(() => {
    if (user?.token) {
      fetch(`${API}/bookmarks/${user.token}`)
        .then(r=>r.json())
        .then(d=>Array.isArray(d)&&setBm(d.map(j=>j.id)))
        .catch(()=>{})
    }
  }, [user])

  useEffect(() => {
    if (pg==="profile" && user?.token) {
      fetch(`${API}/profile/${user.token}`)
        .then(r=>r.json())
        .then(d=>{ setProf(d); setNameV(d.name) })
        .catch(()=>{})
    }
  }, [pg, user])

  const logout = () => {
    localStorage.removeItem("gn_u")
    setUser(null); setBm([]); setProf(null); setPg("home")
  }

  const auth = async type => {
    setErr(""); setBusy(true)
    try {
      if (type==="register") {
        if (!form.n.trim())       { setErr("Name is required"); setBusy(false); return }
        if (!form.e.includes("@")){ setErr("Enter a valid email"); setBusy(false); return }
        const ve = vpwd(form.p);  if (ve) { setErr(ve); setBusy(false); return }
      }
      if (!form.e||!form.p) { setErr("All fields are required"); setBusy(false); return }
      const body = type==="register"
        ? {name:form.n,email:form.e,password:form.p}
        : {email:form.e,password:form.p}
      const res  = await fetch(`${API}/${type}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.detail||"Something went wrong"); return }
      const u = {token:data.token, name:data.name}
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); setForm({n:"",e:"",p:""}); setPg("home")
    } catch { setErr("Server is starting up. Wait 30 seconds and try again.") }
    finally { setBusy(false) }
  }

  const chPwd = async () => {
    setPwErr(""); setPwOk("")
    if (!pwf.o||!pwf.n||!pwf.c) { setPwErr("All fields are required"); return }
    if (pwf.n!==pwf.c)          { setPwErr("New passwords don't match"); return }
    const e = vpwd(pwf.n);      if (e) { setPwErr(e); return }
    try {
      const res = await fetch(`${API}/change-password`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token:user.token,old_password:pwf.o,new_password:pwf.n}),
      })
      const d = await res.json()
      if (!res.ok) { setPwErr(d.detail); return }
      setPwOk("✓ Password updated!"); setPwf({o:"",n:"",c:""})
    } catch { setPwErr("Server error. Try again.") }
  }

  const chName = async () => {
    setNameOk("")
    if (!nameV.trim()) return
    try {
      const res = await fetch(`${API}/update-name`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token:user.token,name:nameV}),
      })
      const d = await res.json()
      if (!res.ok) return
      const u = {token:d.token, name:d.name}
      localStorage.setItem("gn_u", JSON.stringify(u))
      setUser(u); setProf(p=>({...p,name:d.name})); setNameOk("✓ Name updated!")
    } catch {}
  }

  const togBm = async id => {
    if (!user) { setPg("login"); return }
    try {
      await fetch(`${API}/bookmark`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token:user.token,notification_id:id}),
      })
      setBm(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev,id])
    } catch {}
  }

  const str   = pstr(form.p)
  const isReg = pg==="register"

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  if (pg==="login"||pg==="register") return (
    <div style={{minHeight:"100vh",background:"#09090b",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:"24px 16px",position:"relative",overflow:"hidden"}}>

      {/* Ambient glow */}
      <div style={{position:"fixed",top:"8%",left:"50%",
        transform:"translateX(-50%)",width:600,height:600,
        background:"radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 65%)",
        pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:400,position:"relative"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{
            width:54,height:54,borderRadius:16,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"inline-flex",alignItems:"center",justifyContent:"center",
            fontSize:26,marginBottom:16,
            boxShadow:"0 0 0 1px rgba(99,102,241,.3),0 8px 32px rgba(99,102,241,.28)"}}>
            🇮🇳
          </div>
          <h1 style={{color:"#fff",fontSize:22,fontWeight:800,
            letterSpacing:-.5,marginBottom:6}}>
            {isReg?"Create your account":"Welcome back"}
          </h1>
          <p style={{color:"#71717a",fontSize:14}}>
            {isReg?"Free forever · No spam ever":"Sign in to GovNotify"}
          </p>
        </div>

        {/* Form card */}
        <div style={{background:"#111113",border:"1px solid #1f1f23",
          borderRadius:18,padding:"26px 22px"}}>

          {isReg&&<>
            <label style={LS}>Full Name</label>
            <input className="input-field" placeholder="Your full name"
              value={form.n} onChange={e=>setForm({...form,n:e.target.value})}
              onKeyDown={e=>e.key==="Enter"&&auth(pg)}/>
          </>}

          <label style={LS}>Email Address</label>
          <input className="input-field" placeholder="you@gmail.com"
            value={form.e} onChange={e=>setForm({...form,e:e.target.value})}
            onKeyDown={e=>e.key==="Enter"&&auth(pg)}/>

          <label style={LS}>Password</label>
          <div style={{position:"relative",
            marginBottom:isReg&&form.p.length>0?6:0}}>
            <input className="input-field"
              placeholder={isReg?"Min 8 chars, A–Z, 0–9, !@#":"••••••••"}
              type={showP?"text":"password"} value={form.p}
              onChange={e=>setForm({...form,p:e.target.value})}
              onKeyDown={e=>e.key==="Enter"&&auth(pg)}
              style={{paddingRight:58,marginBottom:0}}/>
            <button onClick={()=>setShowP(!showP)}
              style={{position:"absolute",right:12,top:"50%",
                transform:"translateY(-50%)",background:"none",
                border:"none",color:"#3f3f46",cursor:"pointer",
                fontSize:10,fontWeight:700,letterSpacing:.7}}>
              {showP?"HIDE":"SHOW"}
            </button>
          </div>

          {/* Strength bar */}
          {isReg&&form.p.length>0&&(
            <div style={{marginBottom:16,marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"#3f3f46",fontSize:10,fontWeight:600,letterSpacing:.5}}>
                  STRENGTH
                </span>
                <span style={{color:str.c,fontSize:10,fontWeight:700}}>{str.l}</span>
              </div>
              <div style={{background:"#27272a",borderRadius:99,height:2,marginBottom:10}}>
                <div style={{height:"100%",width:str.w,background:str.c,
                  borderRadius:99,transition:"all .3s"}}/>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {[{r:/.{8,}/,t:"8+ chars"},{r:/[A-Z]/,t:"A–Z"},
                  {r:/[a-z]/,t:"a–z"},{r:/[0-9]/,t:"0–9"},
                  {r:/[!@#$%^&*]/,t:"!@#"}].map(({r,t})=>(
                  <span key={t} style={{
                    padding:"3px 9px",borderRadius:99,fontSize:10,fontWeight:500,
                    background:r.test(form.p)?"rgba(34,197,94,.1)":"rgba(255,255,255,.04)",
                    color:r.test(form.p)?"#22c55e":"#52525b",
                    border:`1px solid ${r.test(form.p)?"rgba(34,197,94,.25)":"transparent"}`,
                    transition:"all .2s"}}>
                    {r.test(form.p)?"✓ ":""}{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {err&&(
            <div style={{background:"rgba(239,68,68,.07)",
              border:"1px solid rgba(239,68,68,.18)",
              borderRadius:9,padding:"10px 13px",marginBottom:14,marginTop:4}}>
              <p style={{color:"#fca5a5",fontSize:13}}>{err}</p>
            </div>
          )}

          <button onClick={()=>auth(pg)} disabled={busy} style={{
            width:"100%",padding:"13px",borderRadius:10,marginTop:isReg?0:16,
            marginBottom:18,
            background:busy?"#3f3f46":"linear-gradient(135deg,#6366f1,#8b5cf6)",
            color:"#fff",border:"none",fontSize:14,fontWeight:700,
            cursor:busy?"not-allowed":"pointer",
            boxShadow:busy?"none":"0 4px 20px rgba(99,102,241,.28)",
            transition:"all .2s"}}>
            {busy?"Please wait…":(isReg?"Create account →":"Sign in →")}
          </button>

          <p style={{textAlign:"center",fontSize:13,color:"#71717a"}}>
            {isReg?"Already have an account? ":"New here? "}
            <span onClick={()=>{
              setPg(isReg?"login":"register")
              setErr(""); setForm({n:"",e:"",p:""})
            }} style={{color:"#818cf8",cursor:"pointer",fontWeight:600}}>
              {isReg?"Sign in":"Create account"}
            </span>
          </p>
        </div>

        <p onClick={()=>{setPg("home");setErr("")}}
          style={{textAlign:"center",fontSize:12,color:"#3f3f46",
            cursor:"pointer",marginTop:16}}>
          ← Back to home
        </p>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  if (pg==="profile") return (
    <div style={{minHeight:"100vh",background:"#09090b"}}>
      <nav style={{padding:"0 20px",height:56,display:"flex",alignItems:"center",
        justifyContent:"space-between",borderBottom:"1px solid #18181b",
        background:"rgba(9,9,11,.97)",backdropFilter:"blur(14px)",
        position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>🇮🇳</span>
          <span style={{color:"#fff",fontWeight:800,fontSize:15,letterSpacing:-.3}}>
            GovNotify
          </span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button className="nav-btn" onClick={()=>setPg("home")} style={NB}>
            ← Back
          </button>
          <button className="nav-btn" onClick={logout}
            style={{...NB,color:"#ef4444",borderColor:"rgba(239,68,68,.2)"}}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth:560,margin:"0 auto",padding:"36px 16px 80px"}}>

        {/* Avatar + info */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
          <div style={{
            width:62,height:62,borderRadius:18,flexShrink:0,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:28,fontWeight:800,color:"#fff",
            boxShadow:"0 0 0 1px rgba(99,102,241,.3),0 8px 24px rgba(99,102,241,.22)"}}>
            {(prof?.name||user?.name||"U")[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{color:"#fff",fontSize:20,fontWeight:700,letterSpacing:-.3}}>
              {prof?.name||user?.name}
            </h1>
            <p style={{color:"#71717a",fontSize:13,marginTop:3}}>{prof?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid section-card"
          style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",
            gap:10,marginBottom:12,padding:0,border:"none",background:"transparent"}}>
          {[
            {l:"Joined",   v:prof?.joined||"—"},
            {l:"Saved",    v:prof?.bookmarks??bm.length},
            {l:"Status",   v:"Active ✓"},
          ].map(({l,v})=>(
            <div key={l} style={{background:"#111113",border:"1px solid #1f1f23",
              borderRadius:12,padding:"14px 14px"}}>
              <p style={{color:"#3f3f46",fontSize:9,fontWeight:700,
                letterSpacing:.8,marginBottom:5}}>
                {l.toUpperCase()}
              </p>
              <p style={{color:"#fff",fontSize:16,fontWeight:700}}>{v}</p>
            </div>
          ))}
        </div>

        {/* Edit name */}
        <div className="section-card">
          <p className="section-title">Profile Info</p>
          <label style={LS}>Display Name</label>
          <div style={{display:"flex",gap:8}}>
            <input className="input-field" value={nameV}
              onChange={e=>setNameV(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&chName()}
              style={{flex:1,marginBottom:0}}/>
            <button onClick={chName} style={{
              padding:"11px 18px",borderRadius:9,background:"#6366f1",
              color:"#fff",border:"none",fontSize:13,fontWeight:600,
              cursor:"pointer",flexShrink:0}}>
              Save
            </button>
          </div>
          {nameOk&&<p style={{color:"#22c55e",fontSize:12,marginTop:10}}>{nameOk}</p>}
        </div>

        {/* Change password */}
        <div className="section-card">
          <p className="section-title">Change Password</p>
          <label style={LS}>Current Password</label>
          <input className="input-field" type="password" placeholder="••••••••"
            value={pwf.o} onChange={e=>setPwf({...pwf,o:e.target.value})}/>
          <label style={LS}>New Password</label>
          <input className="input-field" type="password"
            placeholder="Min 8 chars, A–Z, 0–9, !@#"
            value={pwf.n} onChange={e=>setPwf({...pwf,n:e.target.value})}/>
          <label style={LS}>Confirm New Password</label>
          <input className="input-field" type="password"
            placeholder="Repeat new password" value={pwf.c}
            onChange={e=>setPwf({...pwf,c:e.target.value})}
            onKeyDown={e=>e.key==="Enter"&&chPwd()}
            style={{marginBottom:16}}/>
          {pwErr&&(
            <div style={{background:"rgba(239,68,68,.07)",
              border:"1px solid rgba(239,68,68,.18)",borderRadius:8,
              padding:"10px 12px",marginBottom:12}}>
              <p style={{color:"#fca5a5",fontSize:13}}>{pwErr}</p>
            </div>
          )}
          {pwOk&&(
            <div style={{background:"rgba(34,197,94,.07)",
              border:"1px solid rgba(34,197,94,.18)",borderRadius:8,
              padding:"10px 12px",marginBottom:12}}>
              <p style={{color:"#86efac",fontSize:13}}>{pwOk}</p>
            </div>
          )}
          <button onClick={chPwd} style={{
            padding:"11px 20px",borderRadius:9,background:"#6366f1",
            color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            Update Password
          </button>
        </div>

        {/* Sign out */}
        <div style={{background:"#111113",border:"1px solid rgba(239,68,68,.15)",
          borderRadius:14,padding:"20px"}}>
          <p style={{color:"#ef4444",fontSize:14,fontWeight:700,marginBottom:8}}>
            Sign Out
          </p>
          <p style={{color:"#71717a",fontSize:13,marginBottom:14}}>
            Signs you out on this device.
          </p>
          <button onClick={logout} style={{
            padding:"10px 20px",borderRadius:9,
            background:"rgba(239,68,68,.08)",color:"#ef4444",
            border:"1px solid rgba(239,68,68,.2)",fontSize:13,
            fontWeight:600,cursor:"pointer"}}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // HOME PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#09090b",color:"#e4e4e7"}}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav style={{
        padding:"0 24px",height:56,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        borderBottom:"1px solid #18181b",
        background:"rgba(9,9,11,.97)",backdropFilter:"blur(16px)",
        position:"sticky",top:0,zIndex:100}}>

        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:20}}>🇮🇳</span>
          <span style={{color:"#fff",fontWeight:800,fontSize:15,letterSpacing:-.4}}>
            GovNotify
          </span>
          <span style={{
            fontSize:9,color:"#22c55e",fontWeight:700,letterSpacing:.6,
            background:"rgba(34,197,94,.09)",padding:"2px 7px",
            borderRadius:99,border:"1px solid rgba(34,197,94,.18)"}}>
            LIVE
          </span>
        </div>

        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {user ? <>
            <button className="nav-btn"
              onClick={()=>setPg(pg==="bookmarks"?"home":"bookmarks")} style={NB}>
              {pg==="bookmarks"?"← Jobs":`★ ${bm.length}`}
            </button>
            <button className="nav-btn" onClick={()=>setPg("profile")}
              style={{...NB,background:"rgba(99,102,241,.1)",color:"#818cf8",
                borderColor:"rgba(99,102,241,.22)",
                display:"flex",alignItems:"center",gap:7}}>
              <span style={{
                width:22,height:22,borderRadius:"50%",flexShrink:0,
                background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                display:"inline-flex",alignItems:"center",
                justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>
                {user.name[0].toUpperCase()}
              </span>
              <span className="hide-sm">{user.name.split(" ")[0]}</span>
            </button>
          </> : <>
            <button className="nav-btn" onClick={()=>setPg("login")} style={NB}>
              Sign in
            </button>
            <button className="nav-btn" onClick={()=>setPg("register")}
              style={{...NB,background:"rgba(99,102,241,.12)",color:"#818cf8",
                borderColor:"rgba(99,102,241,.22)",fontWeight:600}}>
              Sign up
            </button>
          </>}
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {pg==="home"&&(
        <div style={{textAlign:"center",padding:"62px 20px 38px",
          position:"relative",overflow:"hidden"}}>

          {/* Grid lines */}
          <div className="hero-grid"/>

          {/* Glow blob */}
          <div style={{position:"absolute",top:-60,left:"50%",
            transform:"translateX(-50%)",width:1000,height:500,
            background:"radial-gradient(ellipse,rgba(99,102,241,.08) 0%,transparent 60%)",
            pointerEvents:"none"}}/>

          <div style={{position:"relative"}}>
            {/* Live pill */}
            <div style={{
              display:"inline-flex",alignItems:"center",gap:7,
              background:"rgba(34,197,94,.07)",
              border:"1px solid rgba(34,197,94,.15)",
              borderRadius:99,padding:"5px 14px",marginBottom:22}}>
              <span style={{
                width:6,height:6,borderRadius:"50%",background:"#22c55e",
                display:"inline-block",animation:"pulse 2s infinite"}}/>
              <span style={{color:"#22c55e",fontSize:11,fontWeight:600,letterSpacing:.5}}>
                LIVE · Updated Daily
              </span>
            </div>

            <h1 className="hero-title" style={{
              fontSize:50,fontWeight:900,letterSpacing:-2.5,
              lineHeight:1.04,marginBottom:16,color:"#fff"}}>
              Your next{" "}
              <span style={{
                WebkitTextStroke:"1.5px rgba(99,102,241,.65)",
                WebkitTextFillColor:"transparent"}}>
                govt job
              </span>
              <br/>starts here.
            </h1>

            <p style={{color:"#52525b",fontSize:15,
              maxWidth:360,margin:"0 auto 32px",lineHeight:1.75}}>
              Real-time alerts for Army, Police, SSC, Banking &amp; more across India.
            </p>

            {/* Search */}
            <div style={{maxWidth:400,margin:"0 auto",position:"relative"}}>
              <span style={{
                position:"absolute",left:16,top:"50%",
                transform:"translateY(-50%)",
                color:"#3f3f46",fontSize:16,pointerEvents:"none"}}>
                ⌕
              </span>
              <input value={q} onChange={e=>setQ(e.target.value)}
                placeholder="Search any recruitment…"
                style={{
                  width:"100%",padding:"13px 20px 13px 46px",
                  borderRadius:12,border:"1px solid #27272a",
                  background:"rgba(255,255,255,.03)",
                  color:"#e4e4e7",fontSize:14,outline:"none",
                  transition:"border-color .2s"}}/>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div style={{maxWidth:760,margin:"0 auto",padding:"0 16px 80px"}}>

        {/* Category pills */}
        {pg==="home"&&(
          <div className="pill-wrap pill-scroll"
            style={{display:"flex",gap:6,marginBottom:20,
              flexWrap:"wrap",justifyContent:"center"}}>
            {CATS.map(c=>{
              const cfg=CC[c]; const on=cat===c
              return (
                <button key={c} className="cat-pill" onClick={()=>setCat(c)}
                  style={{
                    padding:"7px 15px",borderRadius:99,fontSize:12,
                    border:`1px solid ${on?(cfg?.color||"#6366f1")+"44":"#27272a"}`,
                    background:on?(cfg?.color||"#6366f1")+"13":"transparent",
                    color:on?(cfg?.color||"#818cf8"):"#52525b",
                    fontWeight:on?700:400}}>
                  {cfg?.emoji} {c}
                </button>
              )
            })}
          </div>
        )}

        {/* Count bar */}
        {pg==="home"&&!load&&!loadErr&&(
          <div style={{display:"flex",justifyContent:"space-between",
            marginBottom:14,padding:"0 2px"}}>
            <span style={{color:"#27272a",fontSize:11,fontWeight:500}}>
              {fil.length} recruitment{fil.length!==1?"s":""} found
            </span>
            <span style={{color:"#1c1c1f",fontSize:11}}>Official sources only</span>
          </div>
        )}

        {/* Bookmarks */}
        {pg==="bookmarks"&&(
          <div style={{paddingTop:28}}>
            <div style={{display:"flex",alignItems:"center",
              justifyContent:"space-between",marginBottom:20}}>
              <h2 style={{color:"#fff",fontSize:18,fontWeight:700}}>Saved Jobs</h2>
              <span style={{color:"#71717a",fontSize:13}}>{bm.length} saved</span>
            </div>
            {bm.length===0&&(
              <div style={{textAlign:"center",padding:"70px 0"}}>
                <div style={{fontSize:40,marginBottom:12,opacity:.3}}>★</div>
                <p style={{fontSize:15,color:"#3f3f46",marginBottom:6}}>
                  No saved jobs yet
                </p>
                <p style={{fontSize:13,color:"#27272a"}}>
                  Click ☆ on any job card to save it here
                </p>
              </div>
            )}
            {jobs.filter(j=>bm.includes(j.id)).map((j,i)=>(
              <JCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>
            ))}
          </div>
        )}

        {/* Loading spinner */}
        {pg==="home"&&load&&(
          <div style={{textAlign:"center",padding:"90px 0"}}>
            <div style={{
              width:38,height:38,
              border:"2px solid #27272a",borderTopColor:"#6366f1",
              borderRadius:"50%",margin:"0 auto 20px",
              animation:"spin 1s linear infinite"}}/>
            <p style={{color:"#3f3f46",fontSize:14}}>Loading jobs…</p>
            <p style={{color:"#27272a",fontSize:12,marginTop:7}}>
              Server waking up — takes ~30 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {pg==="home"&&loadErr&&(
          <div style={{textAlign:"center",padding:"70px 20px"}}>
            <p style={{color:"#3f3f46",fontSize:15,marginBottom:6}}>
              Could not load jobs
            </p>
            <p style={{color:"#27272a",fontSize:13,marginBottom:20}}>
              Server may be waking up. Try again in a moment.
            </p>
            <button onClick={()=>window.location.reload()} style={{
              padding:"10px 22px",borderRadius:9,background:"#6366f1",
              color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {pg==="home"&&!load&&!loadErr&&fil.length===0&&(
          <div style={{textAlign:"center",padding:"70px 0",
            color:"#3f3f46",fontSize:14}}>
            No jobs found{q?` for "${q}"`:""}
          </div>
        )}

        {/* Job cards */}
        {pg==="home"&&!load&&!loadErr&&fil.map((j,i)=>(
          <JCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>
        ))}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      {pg==="home"&&!load&&(
        <footer style={{borderTop:"1px solid #18181b",padding:"28px 24px"}}>
          <div className="footer-row"
            style={{maxWidth:760,margin:"0 auto",
              display:"flex",flexWrap:"wrap",gap:12,
              justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span>🇮🇳</span>
              <span style={{color:"#3f3f46",fontSize:13,fontWeight:600}}>GovNotify</span>
              <span style={{color:"#27272a"}}>·</span>
              <span style={{color:"#27272a",fontSize:12}}>
                Government job alerts for India
              </span>
            </div>
            <a href="https://govnotify-xi.vercel.app" target="_blank" rel="noreferrer"
              style={{color:"#3f3f46",fontSize:11}}>
              govnotify-xi.vercel.app
            </a>
          </div>
        </footer>
      )}
    </div>
  )
}

// ─── Job Card component ───────────────────────────────────────────────────────
function JCard({j, i, bm, tog}) {
  const cfg     = CC[j.category] || {color:"#6366f1",dim:"rgba(99,102,241,.12)",emoji:"📌"}
  const dl      = getDl(j.last_date)
  const saved   = bm.includes(j.id)
  const urgent  = dl!==null && dl<=7 && dl>0
  const expired = dl!==null && dl<=0

  return (
    <div className="jc"
      style={{"--hc":cfg.color+"33","--hbg":cfg.color+"07",
        animationDelay:`${i*45}ms`,marginBottom:8,
        opacity:expired?.28:1}}>
      <div className="jc-inner">
        {/* Left */}
        <div style={{flex:1,minWidth:180}}>
          {/* Badges */}
          <div style={{display:"flex",gap:5,marginBottom:9,
            alignItems:"center",flexWrap:"wrap"}}>
            <span style={{
              color:cfg.color,fontSize:9,fontWeight:800,letterSpacing:.9,
              background:cfg.dim,padding:"3px 9px",borderRadius:6}}>
              {cfg.emoji} {j.category.toUpperCase()}
            </span>
            {isNew(j.posted_on)&&!expired&&(
              <span style={{
                background:"rgba(34,197,94,.1)",color:"#22c55e",
                padding:"2px 7px",borderRadius:99,fontSize:9,fontWeight:800,
                border:"1px solid rgba(34,197,94,.2)"}}>
                NEW
              </span>
            )}
            {urgent&&(
              <span style={{
                background:"rgba(251,191,36,.1)",color:"#fbbf24",
                padding:"2px 7px",borderRadius:99,fontSize:9,fontWeight:800,
                border:"1px solid rgba(251,191,36,.2)"}}>
                ⚡ {dl}d left
              </span>
            )}
            {expired&&(
              <span style={{color:"#3f3f46",fontSize:9,fontWeight:700,letterSpacing:.4}}>
                CLOSED
              </span>
            )}
          </div>

          <h3 style={{fontSize:14,fontWeight:600,lineHeight:1.45,marginBottom:7,
            color:expired?"#3f3f46":"#e4e4e7"}}>
            {j.title}
          </h3>

          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"#3f3f46"}}>📅 {j.last_date}</span>
            <span style={{fontSize:11,color:"#27272a"}}>🏛️ {j.source}</span>
          </div>
        </div>

        {/* Right */}
        <div className="card-row"
          style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
          <button className="bm-btn" onClick={()=>tog(j.id)} style={{
            background:saved?"rgba(251,191,36,.09)":"transparent",
            border:`1px solid ${saved?"rgba(251,191,36,.28)":"#27272a"}`,
            color:saved?"#fbbf24":"#3f3f46",
            borderRadius:9,padding:"8px 11px",cursor:"pointer",
            fontSize:15,flexShrink:0,transition:"all .2s"}}>
            {saved?"★":"☆"}
          </button>
          {!expired&&(
            <a href={j.link} target="_blank" rel="noreferrer"
              className="apply-btn"
              style={{
                background:`linear-gradient(135deg,${cfg.color}22,${cfg.color}11)`,
                color:cfg.color,border:`1px solid ${cfg.color}33`,
                padding:"9px 18px",borderRadius:9,
                fontSize:12,fontWeight:700,whiteSpace:"nowrap",
                display:"inline-block",transition:"filter .15s"}}>
              Apply →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}