import {useEffect,useRef,useState} from 'react'
import {marked} from 'marked'
import {db,auth,provider,ADMIN,SITE,CLOUD,PRESET,MUSIC} from './firebase'
import {collection,addDoc,getDocs,getDoc,query,orderBy,where,doc,setDoc,updateDoc,deleteDoc,increment,serverTimestamp} from 'firebase/firestore'
import {signInWithPopup,signOut,onAuthStateChanged} from 'firebase/auth'

const SEC=[['post','Updates','✎'],['review','Movies','▶'],['poem','Poems','❀'],['essay','Essays','¶'],['creative','Creative','✦'],['project','Work','⚙'],['interest','Interests','♥'],['thought','Thoughts','☁'],['quote','Quotes','❝'],['find','Finds','⌕'],['letter','Letters','✉'],['bucket','Bucket List','☑'],['timeline','Timeline','◷'],['scrap','Scrapbook','▣'],['fact','About Me','☺']]
const EXTRA={review:'Rating & year (e.g. 4/5 · 2019)',bucket:'Date done (blank = not yet)',timeline:'Date',find:'Link URL'}
const SHORT=['poem','thought','quote','fact','bucket','timeline','letter']
const NAME=Object.fromEntries(SEC.map(s=>[s[0],s[1]]))
let ctx
const beep=()=>{try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=520;g.gain.value=.03;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.05)}catch{}}
const md=t=>({__html:marked.parse(t||'')})

function Card({r,admin,onEdit,reload,open}){
  const [o,setO]=useState(open)
  return <article className="card">
    <h3 onClick={()=>setO(!o)}>{r.title||'untitled'}</h3>
    <small>{NAME[r.type]} · {r.date?.toDate().toLocaleDateString()||''}{r.extra&&r.type!=='find'?' · '+r.extra:''}</small>
    {r.type==='find'&&r.extra&&<p><a href={r.extra} target="_blank" rel="noreferrer">{r.extra}</a></p>}
    {r.image&&<img src={r.image} loading="lazy"/>}
    {o&&<div className="md" dangerouslySetInnerHTML={md(r.body)}/>}
    {admin&&<p><button onClick={()=>onEdit(r)}>edit</button> <button onClick={async()=>{if(confirm('delete?')){await deleteDoc(doc(db,'entries',r.id));reload()}}}>delete</button></p>}
  </article>
}

function Scrap({items}){
  const [pos,setPos]=useState({}),d=useRef(null),box=useRef()
  const get=(it,i)=>pos[it.id]||{x:(i*37)%65,y:(i*29)%55}
  const move=e=>{if(!d.current)return;const b=box.current.getBoundingClientRect()
    setPos(p=>({...p,[d.current]:{x:Math.min(75,Math.max(0,(e.clientX-b.left)/b.width*100-12)),y:Math.min(80,Math.max(0,(e.clientY-b.top)/b.height*100-10))}}))}
  return <div ref={box} className="scrap" onPointerMove={move} onPointerUp={()=>d.current=null}>
    {items.map((it,i)=>{const q=get(it,i);return <img key={it.id} src={it.image} draggable={false} style={{left:q.x+'%',top:q.y+'%',transform:`rotate(${(i*7)%11-5}deg)`}} onPointerDown={e=>{e.target.setPointerCapture(e.pointerId);d.current=it.id}}/>})}
    {!items.length&&<p>no pictures yet.</p>}</div>
}

function List({t,admin,onEdit}){
  const [rows,setRows]=useState(null)
  const load=()=>getDocs(t==='archive'?query(collection(db,'entries'),orderBy('date','desc')):query(collection(db,'entries'),where('type','==',t))).then(s=>{
    const r=s.docs.map(d=>({id:d.id,...d.data()}));r.sort((a,b)=>(b.date?.seconds||0)-(a.date?.seconds||0));setRows(r)})
  useEffect(()=>{setRows(null);load()},[t])
  if(!rows)return <p>loading…</p>
  if(t==='scrap')return <Scrap items={rows.filter(r=>r.image)}/>
  return rows.length?rows.map(r=><Card key={r.id} r={r} admin={admin} onEdit={onEdit} reload={load} open={SHORT.includes(r.type)}/>):<p>nothing here yet.</p>
}

function Editor({init,done}){
  const [f,setF]=useState(init||{type:'post',title:'',body:'',image:'',extra:''})
  const s=k=>e=>setF({...f,[k]:e.target.value})
  const save=async()=>{const {id,date,...d}=f;id?await updateDoc(doc(db,'entries',id),d):await addDoc(collection(db,'entries'),{...d,date:serverTimestamp()});done()}
  const up=async e=>{const fd=new FormData();fd.append('file',e.target.files[0]);fd.append('upload_preset',PRESET)
    const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,{method:'POST',body:fd});const j=await r.json();setF({...f,image:j.secure_url||f.image})}
  return <div className="ed">
    <select value={f.type} onChange={s('type')}>{SEC.map(([k,n])=><option key={k} value={k}>{n}</option>)}</select>
    <input placeholder="title" value={f.title} onChange={s('title')}/>
    {EXTRA[f.type]&&<input placeholder={EXTRA[f.type]} value={f.extra} onChange={s('extra')}/>}
    <input placeholder="image url (or upload below)" value={f.image} onChange={s('image')}/>
    <input type="file" accept="image/*" onChange={up}/>
    <div className="split"><textarea placeholder="write in markdown…" value={f.body} onChange={s('body')}/><div className="md" dangerouslySetInnerHTML={md(f.body)}/></div>
    <button onClick={save}>save</button> <button onClick={done}>cancel</button></div>
}

function Admin({admin}){
  const [ed,setEd]=useState(null),[st,setSt]=useState({}),[k,setK]=useState(0)
  useEffect(()=>{getDoc(doc(db,'meta','status')).then(s=>setSt(s.data()||{}))},[])
  if(!admin)return <button onClick={()=>signInWithPopup(auth,provider)}>sign in with Google</button>
  if(ed)return <Editor init={ed==='new'?null:ed} done={()=>{setEd(null);setK(k+1)}}/>
  return <div><button onClick={()=>setEd('new')}>+ new entry</button> <button onClick={()=>signOut(auth)}>sign out</button>
    <h3>now</h3>{['listening','watching','reading','thought'].map(x=><input key={x} placeholder={x} value={st[x]||''} onChange={e=>setSt({...st,[x]:e.target.value})}/>)}
    <button onClick={()=>setDoc(doc(db,'meta','status'),st)}>save now</button>
    <h3>all entries</h3><List key={k} t="archive" admin onEdit={setEd}/></div>
}

function Guest({admin}){
  const [rows,setRows]=useState([]),[n,setN]=useState(''),[m,setM]=useState(''),[trap,setTrap]=useState(''),[ok,setOk]=useState(false)
  const load=()=>getDocs(admin?collection(db,'guestbook'):query(collection(db,'guestbook'),where('approved','==',true))).then(s=>setRows(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))))
  useEffect(()=>{load()},[admin])
  const send=async()=>{const last=+localStorage.gb||0;if(trap||!n.trim()||!m.trim()||Date.now()-last<60000)return
    await addDoc(collection(db,'guestbook'),{name:n.slice(0,40),msg:m.slice(0,300),approved:false,createdAt:serverTimestamp()});localStorage.gb=Date.now();setN('');setM('');setOk(true)}
  return <div>
    <input placeholder="name" value={n} onChange={e=>setN(e.target.value)} maxLength={40}/>
    <textarea placeholder="leave a message" value={m} onChange={e=>setM(e.target.value)} maxLength={300}/>
    <input className="trap" tabIndex={-1} autoComplete="off" value={trap} onChange={e=>setTrap(e.target.value)}/>
    <button onClick={send}>sign</button>{ok&&<small> thanks! it shows up after I approve it.</small>}
    {rows.map(r=><article className="card" key={r.id}><b>{r.name}</b><p>{r.msg}</p>
      {admin&&<>{!r.approved&&<button onClick={async()=>{await updateDoc(doc(db,'guestbook',r.id),{approved:true});load()}}>approve</button>} <button onClick={async()=>{await deleteDoc(doc(db,'guestbook',r.id));load()}}>delete</button></>}</article>)}</div>
}

export default function App(){
  const [sec,setSec]=useState(location.hash.slice(1)),[admin,setAdmin]=useState(false),[st,setSt]=useState({}),[cnt,setCnt]=useState(null),[rnd,setRnd]=useState(null),[play,setPlay]=useState(false),au=useRef()
  const go=s=>{beep();location.hash=s}
  useEffect(()=>{const h=()=>setSec(location.hash.slice(1));addEventListener('hashchange',h)
    onAuthStateChanged(auth,u=>setAdmin(!!u&&u.email===ADMIN))
    getDoc(doc(db,'meta','status')).then(s=>setSt(s.data()||{}))
    const c=doc(db,'meta','counter');(async()=>{try{if(!sessionStorage.v){sessionStorage.v=1;await setDoc(c,{n:increment(1)},{merge:true})}setCnt((await getDoc(c)).data()?.n)}catch{}})()
    return()=>removeEventListener('hashchange',h)},[])
  const random=async()=>{beep();const s=await getDocs(collection(db,'entries'));const a=s.docs.map(d=>d.data()).filter(d=>d.type!=='letter');const facts=a.filter(d=>d.type==='fact')
    const pool=Math.random()<.5&&facts.length?facts:a;const p=pool[Math.floor(Math.random()*pool.length)];setRnd(p||{title:'nothing yet',body:''})}
  const toggle=()=>{if(!au.current)return;play?au.current.pause():au.current.play();setPlay(!play)}
  const title=sec==='guest'?'Guestbook':sec==='archive'?'Archive':sec==='admin'?'Admin':NAME[sec]
  return <>
    <main className="desk" onClick={e=>e.target.closest('button,a,.ico')&&beep()}>
      {!sec&&<><h1 className="glitch" data-t={SITE}>{SITE}</h1><p className="by">by Sachin · 2026</p>
        <div className="icons">{SEC.map(([k,n,i])=><a className="ico" key={k} href={'#'+k}><span>{i}</span>{n}</a>)}
          <a className="ico" href="#archive"><span>☰</span>Archive</a><a className="ico" href="#guest"><span>✍</span>Guestbook</a><a className="ico" onClick={random}><span>?</span>Random Me</a></div>
        <section className="win"><div className="bar">now.txt</div><div className="body">
          {['listening','watching','reading'].map(x=>st[x]&&<p key={x}><b>currently {x}:</b> {st[x]}</p>)}{st.thought&&<p><b>thought of the day:</b> {st.thought}</p>}</div></section></>}
      {sec&&<section className="win"><div className="bar"><span>{title}</span><a href="#">✕</a></div><div className="body">
        {sec==='guest'?<Guest admin={admin}/>:sec==='admin'?<Admin admin={admin}/>:<List t={sec} admin={false}/>}</div></section>}
      {rnd&&<div className="modal" onClick={()=>setRnd(null)}><div className="win"><div className="bar">random me ✕</div><div className="body"><h3>{rnd.title}</h3>{rnd.image&&<img src={rnd.image}/>}<div className="md" dangerouslySetInnerHTML={md(rnd.body)}/></div></div></div>}
    </main>
    <footer className="task"><a href="#">▶ {SITE}</a><span>{cnt!=null&&`visitors: ${String(cnt).padStart(6,'0')}`}</span>
      {MUSIC&&<><audio ref={au} src={MUSIC} loop/><button onClick={toggle}>{play?'❚❚':'♪'}</button></>}<a href="#admin">⚙</a></footer>
  </>
}
