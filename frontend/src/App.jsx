import { useEffect, useState, useRef } from "react"

// ─── Config ───────────────────────────────────────────────────────────────────
const API = "https://govnotify-ecxe.onrender.com"

const CATS = ["All","Police","Army","SSC","Railway","Banking","UPSC","Post Office","KPSC"]

const CC = {
  Police:        { color:"#60A5FA", emoji:"👮", dim:"rgba(96,165,250,.12)"  },
  Army:          { color:"#34D399", emoji:"🪖", dim:"rgba(52,211,153,.12)"  },
  SSC:           { color:"#FB923C", emoji:"📋", dim:"rgba(251,146,60,.12)"  },
  Railway:       { color:"#A78BFA", emoji:"🚆", dim:"rgba(167,139,250,.12)" },
  Banking:       { color:"#FBBF24", emoji:"🏦", dim:"rgba(251,191,36,.12)"  },
  UPSC:          { color:"#F472B6", emoji:"📚", dim:"rgba(244,114,182,.12)" },
  "Post Office": { color:"#2DD4BF", emoji:"📮", dim:"rgba(45,212,191,.12)"  },
  KPSC:          { color:"#F87171", emoji:"🏛️", dim:"rgba(248,113,113,.12)" },
}

const FAQS = [
  { q:"Is GovNotify connected to official sites?",
    a:"Yes. Every Apply link goes directly to the official government recruitment portal — KSP, SSC, Indian Army, SBI, IBPS, UPSC, India Post, KPSC, and more. No third-party redirects." },
  { q:"Can I bookmark jobs?",
    a:"Yes. Create a free account and click the bookmark icon on any job card. Your saved jobs are available anytime under the Bookmarks section." },
  { q:"Is it mobile responsive?",
    a:"Fully. GovNotify works on phones, tablets, and desktops. The category filters scroll horizontally on small screens." },
  { q:"How often is the data updated?",
    a:"The job database is seeded from official sources and updated whenever new recruitment notifications are released. The server auto-seeds on every startup." },
  { q:"Is GovNotify free to use?",
    a:"Completely free. No ads, no paywalls. Create an account to unlock bookmarks and a personal dashboard." },
]

const TESTIMONIALS = [
  { name:"Rahul M.",    role:"Banking Candidate",  stars:5, text:"The official-source badges and deadline tracking make it easier to trust what I am seeing." },
  { name:"Sneha K.",   role:"Final Year Student",  stars:5, text:"It feels like a modern startup product, but the data model is serious and government-source first." },
  { name:"Ananya R.",  role:"UPSC Aspirant",       stars:5, text:"GovNotify replaced scattered bookmarks with one verified interface for official portals." },
  { name:"Kiran B.",   role:"SSC Candidate",       stars:5, text:"The deadline countdown on each card saved me from missing the Karnataka Police application." },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDl = d => {
  if (!d || ["TBA","Coming Soon","Check official site"].includes(d)) return null
  const p = new Date(d); if (isNaN(p)) return null
  return Math.ceil((p - new Date()) / 86400000)
}
const isNew  = p => Math.ceil((new Date() - new Date(p)) / 86400000) <= 7
const vpwd   = p => {
  if (p.length < 8)           return "Min 8 characters required"
  if (!/[A-Z]/.test(p))      return "Need at least one uppercase letter"
  if (!/[a-z]/.test(p))      return "Need at least one lowercase letter"
  if (!/[0-9]/.test(p))      return "Need at least one number"
  if (!/[!@#$%^&*]/.test(p)) return "Need a special character (!@#$%^&*)"
  return null
}
const pstr = p => {
  let s=0
  if(p.length>=8)s++; if(/[A-Z]/.test(p))s++
  if(/[a-z]/.test(p))s++; if(/[0-9]/.test(p))s++
  if(/[!@#$%^&*]/.test(p))s++
  return [{l:"Weak",c:"#ef4444",w:"16%"},{l:"Weak",c:"#ef4444",w:"16%"},
          {l:"Fair",c:"#f97316",w:"38%"},{l:"Good",c:"#eab308",w:"62%"},
          {l:"Strong",c:"#22c55e",w:"84%"},{l:"Very Strong",c:"#6366f1",w:"100%"}][s]
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = {
  Bell:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Grid:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Bookmark: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  Login:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  User:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Star:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  Shield:   ()=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  BellBig:  ()=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Clock:    ()=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Arrow:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Plus:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevUp:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  ChevDown: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  Send:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Briefcase:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  Radio:    ()=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  Users:    ()=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  File:     ()=><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  MapPin:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Rupee:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="18" y2="3"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="13" x2="12" y2="21"/><path d="M6 8a6 6 0 0 1 0 5H6"/></svg>,
  Vacancies:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs,    setJobs]    = useState([])
  const [fil,     setFil]     = useState([])
  const [cat,     setCat]     = useState("All")
  const [q,       setQ]       = useState("")
  const [load,    setLoad]    = useState(true)
  const [loadErr, setLoadErr] = useState(false)
  const [pg,      setPg]      = useState("home")
  const [user,    setUser]    = useState(()=>{
    try{return JSON.parse(localStorage.getItem("gn_u")||"null")}catch{return null}
  })
  const [bm,      setBm]      = useState([])
  const [prof,    setProf]    = useState(null)
  const [form,    setForm]    = useState({n:"",e:"",p:"",cp:""})
  const [err,     setErr]     = useState("")
  const [busy,    setBusy]    = useState(false)
  const [showP,   setShowP]   = useState(false)
  const [pwf,     setPwf]     = useState({o:"",n:"",c:""})
  const [pwErr,   setPwErr]   = useState("")
  const [pwOk,    setPwOk]    = useState("")
  const [nameV,   setNameV]   = useState("")
  const [nameOk,  setNameOk]  = useState("")
  const [faqOpen, setFaqOpen] = useState(null)
  const pingRef = useRef(null)

  // Keep-alive
  useEffect(()=>{
    const ping=()=>fetch(`${API}/ping`).catch(()=>{})
    ping()
    pingRef.current=setInterval(ping,600000)
    return()=>clearInterval(pingRef.current)
  },[])

  // Load jobs with retry
  useEffect(()=>{
    const go=async(attempt=1)=>{
      try{
        const r=await fetch(`${API}/notifications`)
        const d=await r.json()
        if(Array.isArray(d)){setJobs(d);setFil(d);setLoad(false)}
        else if(attempt<5)setTimeout(()=>go(attempt+1),8000)
        else{setLoad(false);setLoadErr(true)}
      }catch{
        if(attempt<5)setTimeout(()=>go(attempt+1),8000)
        else{setLoad(false);setLoadErr(true)}
      }
    }
    go()
  },[])

  useEffect(()=>{
    let r=jobs
    if(cat!=="All")r=r.filter(j=>j.category===cat)
    if(q)r=r.filter(j=>j.title.toLowerCase().includes(q.toLowerCase()))
    setFil(r)
  },[cat,q,jobs])

  useEffect(()=>{
    if(user?.token){
      fetch(`${API}/bookmarks/${user.token}`)
        .then(r=>r.json()).then(d=>Array.isArray(d)&&setBm(d.map(j=>j.id))).catch(()=>{})
    }
  },[user])

  useEffect(()=>{
    if(pg==="profile"&&user?.token){
      fetch(`${API}/profile/${user.token}`)
        .then(r=>r.json()).then(d=>{setProf(d);setNameV(d.name)}).catch(()=>{})
    }
  },[pg,user])

  const logout=()=>{
    localStorage.removeItem("gn_u")
    setUser(null);setBm([]);setProf(null);setPg("home")
  }

  const auth=async type=>{
    setErr("");setBusy(true)
    try{
      if(type==="register"){
        if(!form.n.trim()){setErr("Name is required");setBusy(false);return}
        if(!form.e.includes("@")){setErr("Enter a valid email");setBusy(false);return}
        const ve=vpwd(form.p);if(ve){setErr(ve);setBusy(false);return}
        if(form.p!==form.cp){setErr("Passwords don't match");setBusy(false);return}
      }
      if(!form.e||!form.p){setErr("All fields are required");setBusy(false);return}
      const body=type==="register"
        ?{name:form.n,email:form.e,password:form.p}
        :{email:form.e,password:form.p}
      const res=await fetch(`${API}/${type}`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
      })
      const data=await res.json()
      if(!res.ok){setErr(data.detail||"Something went wrong");return}
      const u={token:data.token,name:data.name}
      localStorage.setItem("gn_u",JSON.stringify(u))
      setUser(u);setForm({n:"",e:"",p:"",cp:""});setPg("home")
    }catch{setErr("Server is starting up. Wait 30 seconds and try again.")}
    finally{setBusy(false)}
  }

  const chPwd=async()=>{
    setPwErr("");setPwOk("")
    if(!pwf.o||!pwf.n||!pwf.c){setPwErr("All fields are required");return}
    if(pwf.n!==pwf.c){setPwErr("Passwords don't match");return}
    const e=vpwd(pwf.n);if(e){setPwErr(e);return}
    try{
      const res=await fetch(`${API}/change-password`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token:user.token,old_password:pwf.o,new_password:pwf.n})
      })
      const d=await res.json()
      if(!res.ok){setPwErr(d.detail);return}
      setPwOk("✓ Password updated!");setPwf({o:"",n:"",c:""})
    }catch{setPwErr("Server error. Try again.")}
  }

  const chName=async()=>{
    setNameOk("")
    if(!nameV.trim())return
    try{
      const res=await fetch(`${API}/update-name`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token:user.token,name:nameV})
      })
      const d=await res.json()
      if(!res.ok)return
      const u={token:d.token,name:d.name}
      localStorage.setItem("gn_u",JSON.stringify(u))
      setUser(u);setProf(p=>({...p,name:d.name}));setNameOk("✓ Name updated!")
    }catch{}
  }

  const togBm=async id=>{
    if(!user){setPg("login");return}
    try{
      await fetch(`${API}/bookmark`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token:user.token,notification_id:id})
      })
      setBm(prev=>prev.includes(id)?prev.filter(i=>i!==id):[...prev,id])
    }catch{}
  }

  const str=pstr(form.p)

  // ── SHARED NAV ─────────────────────────────────────────────────────────────
  const Nav=({transparent=false})=>(
    <nav style={{
      position:"sticky",top:0,zIndex:100,
      padding:"0 32px",height:64,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      background:transparent?"rgba(10,10,16,.6)":"rgba(10,10,16,.97)",
      backdropFilter:"blur(20px)",
      borderBottom:"1px solid rgba(255,255,255,.06)",
    }}>
      {/* Logo */}
      <div onClick={()=>setPg("home")}
        style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",flexShrink:0}}>
        <div style={{
          width:36,height:36,borderRadius:10,
          background:"linear-gradient(135deg,#1a1a2e,#16213e)",
          border:"1px solid rgba(255,255,255,.12)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18
        }}>🔔</div>
        <span style={{color:"#fff",fontWeight:800,fontSize:16,letterSpacing:-.3}}>GovNotify</span>
        <span style={{
          fontSize:9,color:"#22c55e",fontWeight:700,letterSpacing:.6,
          background:"rgba(34,197,94,.1)",padding:"2px 7px",
          borderRadius:99,border:"1px solid rgba(34,197,94,.2)"
        }}>LIVE</span>
      </div>

      {/* Center links */}
      <div className="nav-center" style={{display:"flex",alignItems:"center",gap:4}}>
        <button className="nav-link" onClick={()=>setPg("home")}>
          <Icon.Grid/> Dashboard
        </button>
        <button className="nav-link" onClick={()=>user?setPg("bookmarks"):setPg("login")}>
          <Icon.Bookmark/> Bookmarks
        </button>
        {user
          ? <button className="nav-link" onClick={()=>setPg("profile")}>
              <Icon.User/> {user.name.split(" ")[0]}
            </button>
          : <button className="nav-link" onClick={()=>setPg("login")}>
              <Icon.Login/> Login
            </button>
        }
      </div>

      {/* Right */}
      <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
        {user
          ? <button className="btn-primary" onClick={logout}
              style={{padding:"8px 18px",fontSize:13}}>
              Sign out
            </button>
          : <button className="btn-register" onClick={()=>setPg("register")}>
              <Icon.Plus/> Register
            </button>
        }
      </div>
    </nav>
  )

  // ── LOGIN PAGE ─────────────────────────────────────────────────────────────
  if(pg==="login") return(
    <div style={{minHeight:"100vh",background:"#09090b"}}>
      <Nav/>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"center",
        minHeight:"calc(100vh - 64px)",padding:"40px 20px",
        position:"relative",overflow:"hidden"
      }}>
        <div style={{
          position:"absolute",top:"10%",left:"50%",transform:"translateX(-50%)",
          width:600,height:600,
          background:"radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 65%)",
          pointerEvents:"none"
        }}/>
        <div style={{width:"100%",maxWidth:420,position:"relative"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{
              width:54,height:54,borderRadius:16,
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              display:"inline-flex",alignItems:"center",justifyContent:"center",
              fontSize:26,marginBottom:16,
              boxShadow:"0 0 0 1px rgba(99,102,241,.3),0 8px 32px rgba(99,102,241,.28)"
            }}>🇮🇳</div>
            <h1 style={{color:"#fff",fontSize:24,fontWeight:800,letterSpacing:-.5,marginBottom:6}}>
              Welcome back
            </h1>
            <p style={{color:"#71717a",fontSize:14}}>Sign in to your GovNotify account</p>
          </div>

          <div style={{background:"#111118",border:"1px solid #1f1f2e",borderRadius:18,padding:"26px 22px"}}>
            <label className="label">Email Address</label>
            <input className="inp" placeholder="you@gmail.com" value={form.e}
              onChange={e=>setForm({...form,e:e.target.value})}
              onKeyDown={e=>e.key==="Enter"&&auth("login")}
              style={{marginBottom:14}}/>

            <label className="label">Password</label>
            <div style={{position:"relative",marginBottom:20}}>
              <input className="inp" placeholder="••••••••"
                type={showP?"text":"password"} value={form.p}
                onChange={e=>setForm({...form,p:e.target.value})}
                onKeyDown={e=>e.key==="Enter"&&auth("login")}
                style={{paddingRight:58}}/>
              <button onClick={()=>setShowP(!showP)} style={{
                position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                background:"none",border:"none",color:"#3f3f46",
                cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:.7
              }}>{showP?"HIDE":"SHOW"}</button>
            </div>

            {err&&<div className="msg-err" style={{marginBottom:14}}>
              <p style={{color:"#fca5a5",fontSize:13}}>{err}</p>
            </div>}

            <button onClick={()=>auth("login")} disabled={busy} style={{
              width:"100%",padding:"13px",borderRadius:10,marginBottom:18,
              background:busy?"#3f3f46":"linear-gradient(135deg,#6366f1,#8b5cf6)",
              color:"#fff",border:"none",fontSize:14,fontWeight:700,
              cursor:busy?"not-allowed":"pointer",
              boxShadow:busy?"none":"0 4px 20px rgba(99,102,241,.28)"
            }}>
              {busy?"Please wait…":"Sign in →"}
            </button>

            <p style={{textAlign:"center",fontSize:13,color:"#71717a"}}>
              New here?{" "}
              <span onClick={()=>{setPg("register");setErr("")}}
                style={{color:"#818cf8",cursor:"pointer",fontWeight:600}}>
                Create account
              </span>
            </p>
          </div>
          <p onClick={()=>setPg("home")}
            style={{textAlign:"center",fontSize:12,color:"#3f3f46",cursor:"pointer",marginTop:16}}>
            ← Back to home
          </p>
        </div>
      </div>
    </div>
  )

  // ── REGISTER PAGE (split screen) ──────────────────────────────────────────
  if(pg==="register") return(
    <div style={{minHeight:"100vh",background:"#09090b",display:"flex",flexDirection:"column"}}>
      <Nav/>
      <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"calc(100vh - 64px)"}}>

        {/* Left — form */}
        <div style={{
          padding:"48px 56px",display:"flex",flexDirection:"column",justifyContent:"center",
          borderRight:"1px solid #1f1f2e"
        }}>
          <div style={{color:"#6366f1",fontSize:12,fontWeight:700,letterSpacing:2,marginBottom:16}}>
            STEP 1 OF 2
          </div>
          <h1 style={{color:"#fff",fontSize:32,fontWeight:800,lineHeight:1.2,marginBottom:8}}>
            Create your GovNotify account.
          </h1>
          <p style={{color:"#71717a",fontSize:14,marginBottom:32}}>
            Free forever · No spam · No ads
          </p>

          <div style={{marginBottom:16}}>
            <label className="label">Name</label>
            <input className="inp" placeholder="Sanket Shivaji"
              value={form.n} onChange={e=>setForm({...form,n:e.target.value})}
              onKeyDown={e=>e.key==="Enter"&&auth("register")}/>
          </div>
          <div style={{marginBottom:16}}>
            <label className="label">Email</label>
            <input className="inp" placeholder="you@example.com"
              value={form.e} onChange={e=>setForm({...form,e:e.target.value})}
              onKeyDown={e=>e.key==="Enter"&&auth("register")}/>
          </div>
          <div style={{marginBottom:16}}>
            <label className="label">Password</label>
            <div style={{position:"relative"}}>
              <input className="inp" placeholder="Create a strong password"
                type={showP?"text":"password"} value={form.p}
                onChange={e=>setForm({...form,p:e.target.value})}/>
              <button onClick={()=>setShowP(!showP)} style={{
                position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                background:"none",border:"none",color:"#3f3f46",
                cursor:"pointer",fontSize:10,fontWeight:700
              }}>{showP?"HIDE":"SHOW"}</button>
            </div>
          </div>

          {/* Strength */}
          {form.p.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"#3f3f46",fontSize:10,fontWeight:600,letterSpacing:.5}}>STRENGTH</span>
                <span style={{color:str.c,fontSize:10,fontWeight:700}}>{str.l}</span>
              </div>
              <div style={{background:"#27272a",borderRadius:99,height:2}}>
                <div style={{height:"100%",width:str.w,background:str.c,borderRadius:99,transition:"all .3s"}}/>
              </div>
            </div>
          )}

          <div style={{marginBottom:20}}>
            <label className="label">Confirm Password</label>
            <input className="inp" placeholder="Repeat password"
              type="password" value={form.cp}
              onChange={e=>setForm({...form,cp:e.target.value})}
              onKeyDown={e=>e.key==="Enter"&&auth("register")}/>
          </div>

          {err&&<div className="msg-err" style={{marginBottom:14}}>
            <p style={{color:"#fca5a5",fontSize:13}}>{err}</p>
          </div>}

          <button onClick={()=>auth("register")} disabled={busy} style={{
            width:"100%",padding:"14px",borderRadius:10,marginBottom:16,
            background:busy?"#3f3f46":"linear-gradient(135deg,#6366f1,#8b5cf6)",
            color:"#fff",border:"none",fontSize:15,fontWeight:700,
            cursor:busy?"not-allowed":"pointer",
            boxShadow:busy?"none":"0 4px 20px rgba(99,102,241,.28)"
          }}>
            {busy?"Please wait…":"Create account →"}
          </button>

          <p style={{textAlign:"center",fontSize:13,color:"#71717a"}}>
            Already have account?{" "}
            <span onClick={()=>{setPg("login");setErr("")}}
              style={{color:"#818cf8",cursor:"pointer",fontWeight:600}}>Sign in</span>
          </p>
        </div>

        {/* Right — brand panel */}
        <div className="split-right" style={{
          background:"linear-gradient(135deg,#0f0c29 0%,#1a1040 50%,#0d1a2e 100%)",
          padding:"48px 56px",display:"flex",flexDirection:"column",justifyContent:"center",
          position:"relative",overflow:"hidden"
        }}>
          <div style={{
            position:"absolute",top:"20%",right:"10%",width:300,height:300,
            background:"radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)",
            pointerEvents:"none"
          }}/>
          <h2 style={{
            fontSize:48,fontWeight:900,color:"#fff",lineHeight:1.1,
            letterSpacing:-2,marginBottom:32,position:"relative"
          }}>
            Never miss the last date again.
          </h2>
          <div style={{display:"flex",flexDirection:"column",gap:16,position:"relative"}}>
            {["Verified official links","Bookmarks and deadline tracking","Secure password encryption","Profile & account management"].map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{
                  width:24,height:24,borderRadius:"50%",
                  background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.3)",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0
                }}><Icon.Check/></div>
                <span style={{color:"#e4e4e7",fontSize:15}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── PROFILE PAGE ──────────────────────────────────────────────────────────
  if(pg==="profile") return(
    <div style={{minHeight:"100vh",background:"#09090b"}}>
      <Nav/>
      <div style={{maxWidth:600,margin:"0 auto",padding:"36px 16px 80px"}}>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
          <div style={{
            width:64,height:64,borderRadius:18,flexShrink:0,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:28,fontWeight:800,color:"#fff",
            boxShadow:"0 0 0 1px rgba(99,102,241,.3),0 8px 24px rgba(99,102,241,.22)"
          }}>
            {(prof?.name||user?.name||"U")[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{color:"#fff",fontSize:22,fontWeight:700,letterSpacing:-.3}}>
              {prof?.name||user?.name}
            </h1>
            <p style={{color:"#71717a",fontSize:13,marginTop:3}}>{prof?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
          {[{l:"Joined",v:prof?.joined||"—"},{l:"Saved Jobs",v:prof?.bookmarks??bm.length},{l:"Status",v:"Active ✓"}]
            .map(({l,v})=>(
            <div key={l} className="stat-card">
              <p style={{color:"#3f3f46",fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:5}}>
                {l.toUpperCase()}
              </p>
              <p style={{color:"#fff",fontSize:18,fontWeight:700}}>{v}</p>
            </div>
          ))}
        </div>

        {/* Edit name */}
        <div className="section-card">
          <p className="section-title">Profile Info</p>
          <label className="label">Display Name</label>
          <div style={{display:"flex",gap:8}}>
            <input className="inp" value={nameV}
              onChange={e=>setNameV(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&chName()}
              style={{flex:1,marginBottom:0}}/>
            <button onClick={chName} style={{
              padding:"11px 18px",borderRadius:9,background:"#6366f1",
              color:"#fff",border:"none",fontSize:13,fontWeight:600,
              cursor:"pointer",flexShrink:0
            }}>Save</button>
          </div>
          {nameOk&&<p style={{color:"#22c55e",fontSize:12,marginTop:10}}>{nameOk}</p>}
        </div>

        {/* Change password */}
        <div className="section-card">
          <p className="section-title">Change Password</p>
          <label className="label">Current Password</label>
          <input className="inp" type="password" placeholder="••••••••"
            value={pwf.o} onChange={e=>setPwf({...pwf,o:e.target.value})}/>
          <label className="label">New Password</label>
          <input className="inp" type="password"
            placeholder="Min 8 chars, A–Z, 0–9, !@#"
            value={pwf.n} onChange={e=>setPwf({...pwf,n:e.target.value})}/>
          <label className="label">Confirm New Password</label>
          <input className="inp" type="password" placeholder="Repeat new password"
            value={pwf.c} onChange={e=>setPwf({...pwf,c:e.target.value})}
            onKeyDown={e=>e.key==="Enter"&&chPwd()}
            style={{marginBottom:16}}/>
          {pwErr&&<div className="msg-err"><p style={{color:"#fca5a5",fontSize:13}}>{pwErr}</p></div>}
          {pwOk &&<div className="msg-ok" ><p style={{color:"#86efac",fontSize:13}}>{pwOk}</p></div>}
          <button onClick={chPwd} style={{
            padding:"11px 20px",borderRadius:9,background:"#6366f1",
            color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"
          }}>Update Password</button>
        </div>

        {/* Sign out */}
        <div style={{background:"#111118",border:"1px solid rgba(239,68,68,.15)",
          borderRadius:14,padding:"20px"}}>
          <p style={{color:"#ef4444",fontSize:14,fontWeight:700,marginBottom:8}}>Sign Out</p>
          <p style={{color:"#71717a",fontSize:13,marginBottom:14}}>Signs you out on this device.</p>
          <button onClick={logout} style={{
            padding:"10px 20px",borderRadius:9,
            background:"rgba(239,68,68,.08)",color:"#ef4444",
            border:"1px solid rgba(239,68,68,.2)",fontSize:13,fontWeight:600,cursor:"pointer"
          }}>Sign out</button>
        </div>
      </div>
    </div>
  )

  // ── BOOKMARKS PAGE ────────────────────────────────────────────────────────
  if(pg==="bookmarks") return(
    <div style={{minHeight:"100vh",background:"#09090b"}}>
      <Nav/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 20px 80px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <h1 style={{color:"#fff",fontSize:24,fontWeight:800,letterSpacing:-.5}}>Saved Jobs</h1>
            <p style={{color:"#71717a",fontSize:14,marginTop:4}}>{bm.length} job{bm.length!==1?"s":""} saved</p>
          </div>
          <button onClick={()=>setPg("home")} className="btn-ghost" style={{fontSize:13,padding:"8px 16px"}}>
            ← All Jobs
          </button>
        </div>
        {bm.length===0?(
          <div style={{textAlign:"center",padding:"80px 0"}}>
            <div style={{fontSize:48,marginBottom:16,opacity:.3}}>🔖</div>
            <p style={{fontSize:18,color:"#3f3f46",marginBottom:8,fontWeight:600}}>No saved jobs yet</p>
            <p style={{fontSize:14,color:"#27272a"}}>Click the bookmark icon on any job card to save it here</p>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))",gap:16}}>
            {jobs.filter(j=>bm.includes(j.id)).map((j,i)=>(
              <JobCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ── HOME PAGE ─────────────────────────────────────────────────────────────
  const activeJobs  = fil.filter(j=>{ const d=getDl(j.last_date); return d===null||d>0 })
  const closedJobs  = fil.filter(j=>{ const d=getDl(j.last_date); return d!==null&&d<=0 })
  const urgentCount = jobs.filter(j=>{ const d=getDl(j.last_date); return d!==null&&d>0&&d<=7 }).length

  return(
    <div style={{minHeight:"100vh",background:"#0a0a10",color:"#e4e4e7"}}>
      <Nav transparent/>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight:"92vh",display:"flex",alignItems:"center",
        padding:"60px 48px",position:"relative",overflow:"hidden",
        background:"linear-gradient(180deg,#0a0a16 0%,#0d0d1a 60%,#0a0a10 100%)"
      }}>
        {/* Background gradients */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"radial-gradient(ellipse 60% 50% at 50% -10%,rgba(99,102,241,.12) 0%,transparent 60%)",
          pointerEvents:"none"
        }}/>
        {/* Grid */}
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:`linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)`,
          backgroundSize:"72px 72px",
          maskImage:"radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 100%)",
          WebkitMaskImage:"radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 100%)",
          pointerEvents:"none"
        }}/>

        <div style={{maxWidth:1280,margin:"0 auto",width:"100%",
          display:"grid",gridTemplateColumns:"1fr 420px",gap:80,alignItems:"center",
          position:"relative"}}>

          {/* Left content */}
          <div>
            {/* Badge */}
            <div style={{
              display:"inline-flex",alignItems:"center",gap:8,
              background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
              borderRadius:99,padding:"6px 16px",marginBottom:24,
              fontSize:13,color:"#a1a1aa"
            }}>
              ✦ {jobs.length||10} official recruitment source tracks
            </div>

            {/* GovNotify pill */}
            <div style={{marginBottom:20}}>
              <div style={{
                display:"inline-flex",alignItems:"center",gap:6,
                background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                borderRadius:99,padding:"5px 14px",fontSize:13,color:"#a1a1aa"
              }}>
                ✦ GovNotify
              </div>
            </div>

            <h1 className="hero-title" style={{
              fontSize:76,fontWeight:900,lineHeight:.95,
              letterSpacing:-4,color:"#fff",marginBottom:28
            }}>
              Your next<br/>
              <span style={{color:"#fff"}}>government</span><br/>
              <span style={{
                WebkitTextStroke:"1px rgba(255,255,255,.3)",
                WebkitTextFillColor:"transparent"
              }}>job.</span>
            </h1>

            <p style={{
              color:"#71717a",fontSize:16,lineHeight:1.7,
              maxWidth:480,marginBottom:36
            }}>
              Track official recruitment portals, bookmark important exams, and
              keep every deadline in one calm workspace.
            </p>

            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button className="btn-primary" onClick={()=>{
                document.getElementById("jobs-section")?.scrollIntoView({behavior:"smooth"})
              }}>
                <Icon.Arrow/> Get Started
              </button>
              <button className="btn-ghost" onClick={()=>{
                document.getElementById("jobs-section")?.scrollIntoView({behavior:"smooth"})
              }}>
                Browse Jobs
              </button>
            </div>

            {/* Ticker */}
            {!load&&jobs.length>0&&(
              <div style={{marginTop:40,paddingTop:32,borderTop:"1px solid rgba(255,255,255,.06)"}}>
                <div className="ticker-wrap">
                  <div className="ticker-inner">
                    {[...jobs,...jobs].map((j,i)=>(
                      <span key={i} style={{
                        display:"inline-flex",alignItems:"center",gap:8,
                        marginRight:32,color:"#52525b",fontSize:13,
                      }}>
                        <span style={{color:CC[j.category]?.color||"#6366f1",fontSize:10}}>●</span>
                        {j.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — floating cards */}
          <div className="hide-mobile" style={{position:"relative",height:420}}>
            {/* Live badge top right */}
            <div style={{
              position:"absolute",top:0,right:0,
              background:"rgba(20,20,32,.9)",backdropFilter:"blur(20px)",
              border:"1px solid rgba(255,255,255,.1)",borderRadius:10,
              padding:"6px 14px",fontSize:11,color:"#22c55e",
              fontWeight:700,letterSpacing:.5
            }}>
              Live 2026
            </div>

            {/* Deadline card */}
            <div className="notif-card float-card" style={{
              position:"absolute",top:40,right:0,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{
                  width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.08)",
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}>
                  <Icon.Clock/>
                </div>
                <div>
                  <p style={{color:"#71717a",fontSize:11,marginBottom:2}}>Deadline</p>
                  <p style={{color:"#fff",fontSize:15,fontWeight:700}}>
                    {urgentCount>0?`${urgentCount} closing soon`:"Check now"}
                  </p>
                </div>
              </div>
            </div>

            {/* Main notification card */}
            <div className="notif-card float-card2" style={{
              position:"absolute",top:130,right:20,left:-20,
              padding:"20px",
            }}>
              <div style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                marginBottom:16
              }}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:18}}>🔔</div>
                  <span style={{color:"#fff",fontWeight:700}}>GovNotify</span>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{
                      width:8,height:8,borderRadius:"50%",
                      background:i===0?"#ff5f57":i===1?"#febc2e":"#28c840"
                    }}/>
                  ))}
                </div>
              </div>
              {!load&&jobs.slice(0,3).map((j,i)=>(
                <div key={i} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"12px 14px",background:"rgba(255,255,255,.04)",
                  borderRadius:10,marginBottom:8,
                  border:"1px solid rgba(255,255,255,.06)"
                }}>
                  <div>
                    <p style={{color:"#e4e4e7",fontSize:13,fontWeight:500}}>{j.title}</p>
                    <p style={{color:"#52525b",fontSize:11,marginTop:2}}>Official portal verified</p>
                  </div>
                  <div style={{
                    width:28,height:28,borderRadius:7,
                    background:"rgba(239,68,68,.15)",
                    display:"flex",alignItems:"center",justifyContent:"center"
                  }}>🔖</div>
                </div>
              ))}
              {load&&[1,2,3].map(i=>(
                <div key={i} style={{
                  height:52,borderRadius:10,background:"rgba(255,255,255,.04)",
                  marginBottom:8,animation:"pulse 1.5s ease infinite",
                  animationDelay:`${i*.2}s`
                }}/>
              ))}
            </div>

            {/* Search card */}
            <div className="notif-card" style={{
              position:"absolute",bottom:20,right:0,left:20,
            }}>
              <div style={{
                display:"flex",alignItems:"center",gap:8,
                background:"rgba(255,255,255,.05)",borderRadius:8,padding:"10px 14px",
              }}>
                <span style={{color:"#52525b",fontSize:15}}>⌕</span>
                <span style={{color:"#3f3f46",fontSize:13}}>Search SSC, UPSC, Railway…</span>
                <span style={{
                  marginLeft:"auto",background:"rgba(255,255,255,.08)",
                  border:"1px solid rgba(255,255,255,.1)",borderRadius:5,
                  padding:"2px 7px",fontSize:10,color:"#71717a",fontWeight:600
                }}>⌘ K</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section style={{
        background:"linear-gradient(180deg,#0d0d1a 0%,#0a0a10 100%)",
        padding:"60px 48px"
      }}>
        <div style={{maxWidth:1280,margin:"0 auto"}}>
          <div className="four-col" style={{
            display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16
          }}>
            {[
              {icon:<Icon.Radio/>, n:jobs.length||10, label:"Official source tracks"},
              {icon:<Icon.Clock/>, n:jobs.length||10, label:"Verified organizations"},
              {icon:<Icon.File/>, n:CATS.length-1,   label:"Recruitment categories"},
              {icon:<Icon.Users/>,n:activeJobs.length||2, label:"Active application windows"},
            ].map(({icon,n,label})=>(
              <div key={label} className="stat-card">
                <div style={{color:"#52525b",marginBottom:16}}>{icon}</div>
                <p style={{color:"#fff",fontSize:40,fontWeight:900,letterSpacing:-2,marginBottom:6}}>{n}</p>
                <p style={{color:"#52525b",fontSize:13}}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ─────────────────────────────────────────────────── */}
      <section id="jobs-section" style={{padding:"80px 48px",background:"#09090b"}}>
        <div style={{maxWidth:1280,margin:"0 auto"}}>
          {/* Section header */}
          <div style={{textAlign:"center",marginBottom:48}}>
            <p className="section-label" style={{marginBottom:12}}>FEATURED JOBS</p>
            <h2 className="serif" style={{
              fontSize:48,fontWeight:900,color:"#fff",
              letterSpacing:-1,lineHeight:1.1,marginBottom:16
            }}>
              Official portals, neatly organized.
            </h2>
            <p style={{color:"#71717a",fontSize:15,maxWidth:480,margin:"0 auto"}}>
              Search, filter, bookmark, and jump to verified exam and recruitment pages without noise.
            </p>
          </div>

          {/* Search bar */}
          <div style={{position:"relative",maxWidth:640,margin:"0 auto 32px"}}>
            <span style={{
              position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",
              color:"#3f3f46",fontSize:16,pointerEvents:"none"
            }}>⌕</span>
            <input value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Search SSC, UPSC, Railway…"
              style={{
                width:"100%",padding:"14px 20px 14px 48px",
                borderRadius:12,border:"1px solid #27272a",
                background:"rgba(255,255,255,.03)",color:"#e4e4e7",
                fontSize:15,outline:"none"
              }}/>
            <span style={{
              position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",
              background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",
              borderRadius:6,padding:"3px 9px",fontSize:11,color:"#71717a",fontWeight:600
            }}>⌘K</span>
          </div>

          {/* Category pills */}
          <div className="cat-scroll" style={{
            display:"flex",gap:8,marginBottom:32,
            justifyContent:"center",flexWrap:"wrap"
          }}>
            {CATS.map(c=>(
              <button key={c} className={`cat-pill${cat===c?" active":""}`}
                onClick={()=>setCat(c)}>
                <Icon.Briefcase/> {c}
              </button>
            ))}
          </div>

          {/* Job count */}
          {!load&&!loadErr&&(
            <p style={{color:"#52525b",fontSize:13,marginBottom:24,textAlign:"center"}}>
              {fil.length} recruitment{fil.length!==1?"s":""} found
            </p>
          )}

          {/* Loading */}
          {load&&(
            <div style={{textAlign:"center",padding:"80px 0"}}>
              <div style={{
                width:40,height:40,border:"2px solid #27272a",borderTopColor:"#6366f1",
                borderRadius:"50%",margin:"0 auto 20px",animation:"spin 1s linear infinite"
              }}/>
              <p style={{color:"#3f3f46",fontSize:14}}>Loading jobs…</p>
              <p style={{color:"#27272a",fontSize:12,marginTop:7}}>
                Server waking up — takes ~30 seconds
              </p>
            </div>
          )}

          {/* Error */}
          {loadErr&&(
            <div style={{textAlign:"center",padding:"60px 0"}}>
              <p style={{color:"#3f3f46",fontSize:15,marginBottom:16}}>Could not load jobs</p>
              <button onClick={()=>window.location.reload()} style={{
                padding:"10px 24px",borderRadius:99,background:"#6366f1",
                color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"
              }}>Retry</button>
            </div>
          )}

          {/* Empty */}
          {!load&&!loadErr&&fil.length===0&&(
            <div style={{textAlign:"center",padding:"60px 0",color:"#3f3f46",fontSize:14}}>
              No jobs found{q?` for "${q}"`:""}
            </div>
          )}

          {/* Active jobs grid */}
          {!load&&!loadErr&&activeJobs.length>0&&(
            <div className="two-col" style={{
              display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:24
            }}>
              {activeJobs.map((j,i)=><JobCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>)}
            </div>
          )}

          {/* Closed jobs */}
          {!load&&!loadErr&&closedJobs.length>0&&(
            <div>
              <p style={{color:"#3f3f46",fontSize:12,fontWeight:600,letterSpacing:.5,marginBottom:12}}>
                CLOSED
              </p>
              <div className="two-col" style={{
                display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12
              }}>
                {closedJobs.map((j,i)=><JobCard key={j.id} j={j} i={i} bm={bm} tog={togBm}/>)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── WHY GOVNOTIFY ─────────────────────────────────────────────────── */}
      <section style={{
        padding:"80px 48px",
        background:"linear-gradient(180deg,#09090b 0%,#0d0d1a 100%)"
      }}>
        <div style={{maxWidth:1280,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <p className="section-label" style={{marginBottom:12}}>WHY GOVNOTIFY</p>
            <h2 className="serif" style={{
              fontSize:48,fontWeight:900,color:"#fff",letterSpacing:-1,lineHeight:1.1
            }}>
              Everything important stays close.
            </h2>
            <p style={{color:"#71717a",fontSize:15,marginTop:16,maxWidth:480,margin:"16px auto 0"}}>
              A clean system for aspirants who need clarity more than clutter.
            </p>
          </div>

          <div className="two-col" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
            {[
              {
                icon:<Icon.Shield/>,
                title:"Verified Government Jobs",
                desc:"Curated opportunities with official sources, departments, and application links kept visible.",
                features:["Official link scan","Department verified","No third-party noise"]
              },
              {
                icon:<Icon.BellBig/>,
                title:"Daily Updates",
                desc:"A notification-first interface built around deadlines, categories, and new openings.",
                features:["Deadline countdowns","Category filters","NEW badge alerts"]
              },
            ].map(({icon,title,desc,features})=>(
              <div key={title} className="feature-card">
                <div style={{
                  width:52,height:52,borderRadius:14,
                  background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  marginBottom:20,color:"#e4e4e7"
                }}>{icon}</div>
                <h3 style={{color:"#fff",fontSize:20,fontWeight:700,marginBottom:10}}>{title}</h3>
                <p style={{color:"#71717a",fontSize:14,lineHeight:1.7,marginBottom:20}}>{desc}</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {features.map(f=>(
                    <div key={f} style={{
                      display:"flex",alignItems:"center",gap:8,
                      color:"#52525b",fontSize:13
                    }}>
                      <span style={{color:"#6366f1",fontSize:12}}>✦</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section style={{padding:"80px 0",background:"#09090b",overflow:"hidden"}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 48px"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <p className="section-label" style={{marginBottom:12}}>TESTIMONIALS</p>
            <h2 className="serif" style={{
              fontSize:48,fontWeight:900,color:"#fff",letterSpacing:-1
            }}>
              Built for focused aspirants.
            </h2>
          </div>
        </div>
        <div style={{
          display:"flex",gap:16,padding:"0 48px",
          overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"
        }}>
          {TESTIMONIALS.map((t,i)=>(
            <div key={i} className="test-card">
              <div style={{display:"flex",gap:3,marginBottom:14}}>
                {[...Array(t.stars)].map((_,j)=><Icon.Star key={j}/>)}
              </div>
              <p style={{color:"#a1a1aa",fontSize:14,lineHeight:1.7,marginBottom:16}}>
                "{t.text}"
              </p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{
                  width:36,height:36,borderRadius:"50%",
                  background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:14,fontWeight:700,color:"#fff",flexShrink:0
                }}>{t.name[0]}</div>
                <div>
                  <p style={{color:"#fff",fontSize:13,fontWeight:600}}>{t.name}</p>
                  <p style={{color:"#52525b",fontSize:11}}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding:"80px 48px",
        background:"linear-gradient(180deg,#09090b 0%,#0d0d1a 100%)"
      }}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <h2 style={{
              fontSize:32,fontWeight:800,color:"#fff",letterSpacing:-.5,marginBottom:8
            }}>
              Production-minded from day one.
            </h2>
          </div>
          <div style={{marginTop:40}}>
            {FAQS.map((f,i)=>(
              <div key={i} className="faq-item">
                <button className="faq-q" onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
                  {f.q}
                  {faqOpen===i?<Icon.ChevUp/>:<Icon.ChevDown/>}
                </button>
                {faqOpen===i&&<p className="faq-a">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{
        background:"#07070d",borderTop:"1px solid #1f1f2e",padding:"64px 48px 32px"
      }}>
        <div style={{maxWidth:1280,margin:"0 auto"}}>
          <div style={{
            display:"grid",gridTemplateColumns:"280px 1fr 1fr 300px",
            gap:48,marginBottom:48
          }}>
            {/* Brand */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{
                  width:40,height:40,borderRadius:12,
                  background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20
                }}>🔔</div>
                <span style={{color:"#fff",fontWeight:800,fontSize:18}}>GovNotify</span>
              </div>
              <p style={{color:"#52525b",fontSize:13,lineHeight:1.7,marginBottom:20}}>
                A verified government recruitment interface designed for speed, clarity, and deadline confidence.
              </p>
              <div style={{display:"flex",gap:10}}>
                {["𝕏","Y","in","✉"].map((s,i)=>(
                  <div key={i} style={{
                    width:36,height:36,borderRadius:8,
                    background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:13,color:"#71717a",cursor:"pointer"
                  }}>{s}</div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p style={{color:"#fff",fontSize:14,fontWeight:700,marginBottom:16}}>Product</p>
              {["Dashboard","Bookmarks","Profile","Categories"].map(l=>(
                <p key={l} style={{color:"#52525b",fontSize:13,marginBottom:10,cursor:"pointer"}}
                  onClick={()=>{
                    if(l==="Dashboard")setPg("home")
                    else if(l==="Bookmarks")setPg(user?"bookmarks":"login")
                    else if(l==="Profile")setPg(user?"profile":"login")
                  }}>
                  {l}
                </p>
              ))}
            </div>

            {/* Resources */}
            <div>
              <p style={{color:"#fff",fontSize:14,fontWeight:700,marginBottom:16}}>Resources</p>
              {["Notifications","Categories","FAQ"].map(l=>(
                <p key={l} style={{color:"#52525b",fontSize:13,marginBottom:10,cursor:"pointer"}}>
                  {l}
                </p>
              ))}
            </div>

            {/* Newsletter */}
            <div style={{
              background:"rgba(255,255,255,.03)",border:"1px solid #1f1f2e",
              borderRadius:14,padding:"20px"
            }}>
              <p style={{color:"#fff",fontSize:15,fontWeight:700,marginBottom:8}}>Stay updated</p>
              <p style={{color:"#52525b",fontSize:13,lineHeight:1.6,marginBottom:16}}>
                Get product updates and new exam tracking improvements.
              </p>
              <div style={{display:"flex",gap:8}}>
                <input placeholder="Email address"
                  style={{
                    flex:1,padding:"9px 12px",borderRadius:8,
                    border:"1px solid #27272a",background:"#0a0a10",
                    color:"#e4e4e7",fontSize:13,outline:"none"
                  }}/>
                <button style={{
                  padding:"9px 12px",borderRadius:8,background:"#6366f1",
                  color:"#fff",border:"none",cursor:"pointer"
                }}><Icon.Send/></button>
              </div>
              <div style={{display:"flex",gap:12,marginTop:14}}>
                {["Privacy-ready","Terms-ready","Contact"].map(t=>(
                  <span key={t} style={{color:"#3f3f46",fontSize:11,cursor:"pointer"}}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{
            borderTop:"1px solid #1f1f2e",paddingTop:24,
            display:"flex",justifyContent:"center",
          }}>
            <p style={{color:"#3f3f46",fontSize:12}}>
              Copyright 2026 GovNotify. Built for portfolio presentation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({j, i, bm, tog}) {
  const cfg     = CC[j.category]||{color:"#6366f1",emoji:"📌",dim:"rgba(99,102,241,.12)"}
  const dl      = getDl(j.last_date)
  const saved   = bm.includes(j.id)
  const urgent  = dl!==null&&dl<=7&&dl>0
  const expired = dl!==null&&dl<=0

  return(
    <div className="jc job-card"
      style={{animationDelay:`${i*40}ms`,opacity:expired?.35:1}}>

      {/* Top badges */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        <span style={{
          fontSize:9,fontWeight:800,letterSpacing:.8,
          background:cfg.dim,color:cfg.color,
          padding:"3px 9px",borderRadius:6
        }}>
          {cfg.emoji} {j.category.toUpperCase()}
        </span>
        {!expired&&<span style={{
          fontSize:9,fontWeight:800,
          background:"rgba(251,113,133,.15)",color:"#f87171",
          padding:"3px 9px",borderRadius:6
        }}>New</span>}
        {urgent&&<span style={{
          fontSize:9,fontWeight:800,
          background:"rgba(251,191,36,.12)",color:"#fbbf24",
          padding:"3px 9px",borderRadius:6
        }}>Closing soon</span>}
        {expired&&<span style={{
          fontSize:9,fontWeight:700,color:"#3f3f46",padding:"3px 9px",
          background:"rgba(255,255,255,.04)",borderRadius:6
        }}>Closed</span>}

        {/* Bookmark */}
        <button onClick={()=>tog(j.id)} style={{
          marginLeft:"auto",
          width:32,height:32,borderRadius:8,cursor:"pointer",
          background:saved?"rgba(99,102,241,.15)":"rgba(255,255,255,.05)",
          border:`1px solid ${saved?"rgba(99,102,241,.3)":"rgba(255,255,255,.08)"}`,
          color:saved?"#818cf8":"#52525b",fontSize:14,
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all .2s"
        }}>{saved?"★":"☆"}</button>
      </div>

      {/* Title */}
      <h3 style={{
        color:expired?"#3f3f46":"#f4f4f5",
        fontSize:16,fontWeight:700,lineHeight:1.35,marginBottom:10
      }}>{j.title}</h3>

      {/* Source */}
      <div style={{
        display:"inline-flex",alignItems:"center",gap:6,
        background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",
        borderRadius:6,padding:"4px 10px",marginBottom:16
      }}>
        <span style={{fontSize:10}}>🏛️</span>
        <span style={{color:"#71717a",fontSize:11}}>{j.source}</span>
      </div>

      {/* Details */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
        {[
          {icon:<Icon.Clock/>, text:`Last date: ${j.last_date}`},
          {icon:<Icon.MapPin/>,text:"All India"},
        ].map(({icon,text})=>(
          <div key={text} style={{
            display:"flex",alignItems:"center",gap:8,
            padding:"9px 12px",background:"rgba(255,255,255,.03)",
            borderRadius:8,border:"1px solid rgba(255,255,255,.05)"
          }}>
            <span style={{color:"#52525b",fontSize:12}}>{icon}</span>
            <span style={{color:"#71717a",fontSize:13}}>{text}</span>
            {dl!==null&&dl>0&&dl<=30&&(
              <span style={{
                marginLeft:"auto",color:dl<=7?"#f87171":"#22c55e",
                fontSize:11,fontWeight:600
              }}>⏳ {dl}d left</span>
            )}
          </div>
        ))}
      </div>

      {/* Apply button */}
      {!expired?(
        <a href={j.link} target="_blank" rel="noreferrer" style={{
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          padding:"12px",borderRadius:10,
          background:`linear-gradient(135deg,${cfg.color}22,${cfg.color}11)`,
          color:cfg.color,border:`1px solid ${cfg.color}33`,
          fontSize:13,fontWeight:700,transition:"all .2s"
        }}>
          <Icon.Arrow/> Apply Now
        </a>
      ):(
        <div style={{
          padding:"12px",borderRadius:10,
          background:"rgba(255,255,255,.03)",
          color:"#3f3f46",fontSize:13,fontWeight:600,
          textAlign:"center",border:"1px solid rgba(255,255,255,.05)"
        }}>Application Closed</div>
      )}
    </div>
  )
}
