/* ================= yardımcılar ================= */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const two=n=>String(n).padStart(2,'0');
const fmt=m=>two(Math.floor(m/60))+':'+two(m%60);
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TYPES={course:{n:'Course',c:'--c-course',i:'i-course'},exam:{n:'Exam',c:'--c-exam',i:'i-exam'},homework:{n:'Homework',c:'--c-homework',i:'i-homework'},custom:{n:'Custom',c:'--c-custom',i:'i-custom'}};
const PRI={high:'High',med:'Medium',low:'Low'};
const PALETTE=['#8FA9C2','#C98F86','#9CB394','#BDAA8C','#7FA7A0','#A58BA8','#C7A46E','#8D93A8'];
const START=8,END=18,SLIM=16; let FULL=56, lastHdr=60, HS=[];
const NOWDATE=window.__NOW?new Date(window.__NOW):new Date();
const MID=new Date(NOWDATE.getFullYear(),NOWDATE.getMonth(),NOWDATE.getDate());
const TODAY=(MID.getDay()+6)%7;                       /* bu haftanın gün indeksi (0 = Pazartesi) */
const BASE=new Date(MID.getFullYear(),MID.getMonth(),MID.getDate()-TODAY);
const NOWM=NOWDATE.getHours()*60+NOWDATE.getMinutes();
const dateOf=d=>new Date(BASE.getFullYear(),BASE.getMonth(),BASE.getDate()+d);
const offOf=dt=>Math.round((Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate())-Date.UTC(BASE.getFullYear(),BASE.getMonth(),BASE.getDate()))/864e5);
const dow=d=>((d%7)+7)%7;
const dayLbl=d=>DOW[dow(d)]+' '+dateOf(d).getDate();
const isoOf=d=>{ if(d==null) return ''; const x=dateOf(d); return x.getFullYear()+'-'+two(x.getMonth()+1)+'-'+two(x.getDate()); };
const ico=n=>`<span class="ti"><svg viewBox="0 0 24 24"><use href="#i-${n}"/></svg></span>`;
const ibSvg=n=>`<svg viewBox="0 0 24 24"><use href="#i-${n}"/></svg>`;
const sheet=$('#sheet'), calbody=$('#calbody'), stage=$('#stage');

/* ================= veri ================= */
let uid=1; const tasks=[]; let trash=null;
function mk(o){
  const t={id:uid++,title:'',type:'course',kind:'timed',d:0,d2:null,s:540,e:600,pri:'med',color:null,desc:'',tags:[],pinned:false,done:false,...o};
  if(t.kind==='allday'){t.s=0;t.e=0;}
  if(t.kind==='open'||t.kind==='deadline'){t.e=t.s;}
  if(t.kind==='anytime'){t.d=null;t.d2=null;t.s=0;t.e=0;}
  return t;
}
function seed(){
  const weekly=[[0,'Data Structures',540,630,'course','med','Arrays, linked lists and stacks.',['cs']],
    [0,'Linear Algebra',780,870,'course','med','Eigenvalues and diagonalization.',['math']],
    [2,'Data Structures',540,630,'course','med','Trees and traversal.',['cs']],
    [2,'Linear Algebra',780,870,'course','med','Eigenvalues and diagonalization.',['math']],
    [1,'Physics Lab',780,900,'course','low','Pendulum experiment.',['physics','lab']],
    [1,'Project meeting',600,645,'custom','low','',['group']],
    [4,'Physics Lab',780,900,'course','low','Pendulum experiment.',['physics','lab']],
    [4,'Project meeting',600,645,'custom','low','',['group']]];
  for(const w of [-7,0,7]) weekly.forEach(r=>tasks.push(mk({d:w+r[0],title:r[1],s:r[2],e:r[3],type:r[4],pri:r[5],desc:r[6],tags:r[7],pinned:r[1]==='Project meeting'&&w===0})));
  tasks.push(mk({title:'Algorithms Midterm',type:'exam',d:3,s:540,e:660,pri:'high',pinned:true,desc:'Rooms B2 and B3. Pencil only.',tags:['cs','exam']}));
  tasks.push(mk({title:'Study group',type:'custom',d:5,s:660,e:750,color:'#7FA7A0',desc:'Library, second floor.',tags:['group','review']}));
  tasks.push(mk({title:'Office hours',type:'custom',d:3,s:700,e:760,pri:'low',tags:['math']}));
  tasks.push(mk({title:'Seminar',type:'custom',d:2,s:990,e:1050,color:'#A58BA8',tags:['talk']}));
  tasks.push(mk({title:'Linear Algebra Final',type:'exam',d:24,s:600,e:720,pri:'high',desc:'Chapters 1 to 6.',tags:['math','exam']}));
  tasks.push(mk({title:'Project week',type:'custom',kind:'allday',d:7,d2:9,color:'#7FA7A0',desc:'Team sprint, no lectures.',tags:['group']}));
  tasks.push(mk({title:'Field trip',type:'course',kind:'allday',d:16,d2:17,pri:'low',tags:['physics']}));
  tasks.push(mk({title:'Reading',type:'homework',kind:'open',d:3,s:840,desc:'Chapter 6, no fixed end.',tags:['reading']}));
  tasks.push(mk({title:'Database HW 2',type:'homework',kind:'deadline',d:3,s:1020,pri:'high',pinned:true,tags:['cs']}));
  tasks.push(mk({title:'Report due',type:'homework',kind:'deadline',d:4,s:900,pri:'high',tags:['physics','writing']}));
  tasks.push(mk({title:'Thesis outline',type:'homework',kind:'deadline',d:2,s:1200,pri:'high',desc:'Chapters and rough page counts.',tags:['writing']}));
  tasks.push(mk({title:'Essay draft',type:'homework',kind:'deadline',d:10,s:1020,pri:'low',tags:['writing']}));
  tasks.push(mk({title:'Lab prep',type:'homework',kind:'deadline',d:2,s:420,pri:'low',done:true,tags:['physics','prep']}));
  tasks.push(mk({title:'Read chapter 7',type:'homework',kind:'anytime',desc:'Skim first, then take notes.',tags:['reading']}));
  tasks.push(mk({title:'Buy lab notebook',type:'custom',kind:'anytime',pri:'low',tags:['physics']}));
  tasks.push(mk({title:'Update CV',type:'custom',kind:'anytime',pinned:true,tags:['writing']}));
  tasks.push(mk({title:'Back up thesis files',type:'custom',kind:'anytime',pri:'high',tags:['writing']}));
}
seed();
const isAny=t=>t.kind==='anytime', isLine=t=>t.kind==='open'||t.kind==='deadline';
const onDay=(t,d)=>t.kind==='allday'?(d>=t.d&&d<=(t.d2??t.d)):(!isAny(t)&&t.d===d);
const key=t=>isAny(t)?1e9:t.d*1440+t.s;
const endK=t=>t.kind==='timed'?t.d*1440+t.e:key(t);
const byKey=(a,b)=>key(a)-key(b);
const priRank={high:0,med:1,low:2};
const colorOf=t=>t.color||`var(${TYPES[t.type].c})`;
const allTags=()=>[...new Set(tasks.flatMap(t=>t.tags))].sort();
const iconOf=t=>t.kind==='deadline'?'flag':t.kind==='open'?'start':t.kind==='anytime'?'any':t.type;
function when(t){
  switch(t.kind){
    case 'timed': return `${fmt(t.s)}–${fmt(t.e)}`;
    case 'open': return `From ${fmt(t.s)}`;
    case 'deadline': return `Due ${fmt(t.s)}`;
    case 'allday': return 'All day';
    default: return 'Anytime';
  }
}
function sched(t){
  if(isAny(t)) return 'Anytime';
  if(t.kind==='allday') return t.d2!=null&&t.d2>t.d?`${dayLbl(t.d)} – ${dayLbl(t.d2)}`:`${dayLbl(t.d)} · All day`;
  return `${dayLbl(t.d)} · ${when(t)}`;
}
function dur(m){ if(m<60) return m+' min'; if(m<1440){const h=Math.floor(m/60),r=m%60;return h+' h'+(r?' '+r+' min':'');} return Math.floor(m/1440)+' d'; }

/* ================= durum ================= */
const S={page:'dashboard',back:'dashboard',span:'today',compact:true,theme:'light',
  profile:{name:'Selim',headline:'CS student, year 2',color:'#8FA9C2'},
  f:{q:'',types:new Set(),pri:new Set(),tags:new Set(),status:'all',sort:'date'},loaded:false,
  view:'week',mode:7,startD:0,selDay:TODAY,vy:MID.getFullYear(),vm:MID.getMonth()};
const CATS={course:'#8FA9C2',exam:'#C98F86',homework:'#9CB394',custom:'#BDAA8C'};

/* ================= kısa bildirim, modal ================= */
let tt; const toastEl=$('#toast');
function toast(msg,label,fn){
  toastEl.innerHTML=`<span>${esc(msg)}</span>${label?`<button class="link" type="button" id="t-a">${label}</button>`:''}`;
  toastEl.hidden=false;
  if(label) $('#t-a').onclick=()=>{fn();toastEl.hidden=true;};
  clearTimeout(tt); tt=setTimeout(()=>toastEl.hidden=true,label?6000:2600);
}
let lastFocus=null;
function openModal(html,onMount){
  lastFocus=document.activeElement;
  $('#modalhost').innerHTML=`<div class="scrim" id="scrim"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const sc=$('#scrim');
  sc.addEventListener('pointerdown',e=>{ if(e.target===sc) closeModal(); });
  sc.querySelector('button')?.focus();
  onMount&&onMount();
}
function closeModal(){ $('#modalhost').innerHTML=''; if(lastFocus&&document.contains(lastFocus)) lastFocus.focus({preventScroll:true}); }

function openTask(id){
  const t=tasks.find(x=>x.id===id); if(!t) return;
  const dt=isAny(t)?'':`${MONTHS[dateOf(t.d).getMonth()]} ${dateOf(t.d).getDate()}, `;
  openModal(`<div class="band ty-${t.type}" style="--c:${colorOf(t)}"><div class="badges"><span class="badge">${ico(t.type)}${TYPES[t.type].n}</span><span class="badge">${PRI[t.pri]} priority</span>${t.tags.map(x=>`<span class="badge">#${esc(x)}</span>`).join('')}</div><h3>${esc(t.title)}</h3></div>
  <div class="mb"><div><b>${isAny(t)?'Anytime':esc(sched(t))}</b></div>${t.desc?`<div class="muted">${esc(t.desc)}</div>`:''}</div>
  <div class="acts"><button class="btn primary" type="button" id="m-done">${t.done?'Mark as not done':'Complete'}</button><button class="btn" type="button" id="m-edit">Edit</button><button class="btn danger push" type="button" id="m-del">Delete</button></div>`,()=>{
    $('#m-done').onclick=()=>{t.done=!t.done;closeModal();refresh();toast(t.done?'Task completed':'Task reopened');};
    $('#m-edit').onclick=()=>{closeModal();openForm({id:t.id});};
    $('#m-del').onclick=()=>{const i=tasks.indexOf(t);tasks.splice(i,1);closeModal();refresh();toast('Task deleted','Undo',()=>{tasks.splice(i,0,t);refresh();});};
  });
}

/* ================= ortak parçalar ================= */
function cls(t){ return `ty-${t.type} p-${t.pri} ${t.kind==='deadline'?'dl':t.kind==='open'?'op':''} ${t.done?'done':''}`; }
function actions(t,card){
  return `<button class="ib" type="button" data-pin="${t.id}" aria-pressed="${t.pinned}" aria-label="${t.pinned?'Unpin':'Pin'} ${esc(t.title)}">${ibSvg('pin')}</button>`+
    (card?'':`<button class="ib" type="button" data-done="${t.id}" aria-pressed="${t.done}" aria-label="${t.done?'Mark open':'Mark done'}: ${esc(t.title)}"><span class="tick">${ibSvg('check')}</span></button>`);
}
function row(t,showDay){
  return `<div class="trow ${cls(t)}" style="--c:${colorOf(t)}" tabindex="0" role="button" data-open="${t.id}">${t.pri==='high'?'<i class="fold"></i>':''}${ico(iconOf(t))}
  <div class="tx"><div class="tt">${esc(t.title)}</div><div class="ts">${showDay?esc(sched(t)):esc(when(t))}</div></div>${actions(t)}</div>`;
}
function card(t){
  return `<article class="card ${cls(t)}" style="--c:${colorOf(t)}" tabindex="0" role="button" data-open="${t.id}" aria-label="${esc(t.title)}">${t.pri==='high'?'<i class="fold"></i>':''}
  <div class="ct">${ico(iconOf(t))}<span>${TYPES[t.type].n}</span>${actions(t,true)}</div>
  <h4>${esc(t.title)}</h4>
  ${t.tags.length?`<div class="tgs">${t.tags.map(x=>`<span class="tg">#${esc(x)}</span>`).join('')}</div>`:''}
  <div class="when">${esc(sched(t))}</div>
  ${t.desc?`<div class="dsc">${esc(t.desc)}</div>`:''}
  <div class="cf"><span>${PRI[t.pri]} priority</span><button class="ib" type="button" data-done="${t.id}" aria-pressed="${t.done}" aria-label="${t.done?'Mark open':'Mark done'}: ${esc(t.title)}"><span class="tick">${ibSvg('check')}</span></button></div></article>`;
}
function emptyArt(){
  return `<svg viewBox="0 0 110 60" width="110" style="max-width:100%;color:var(--ink);background:var(--paper)" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".55"><path d="M8 54l9-24h46l-9 24z"/><path d="M26 54l9-24h46l-9 24z"/><path d="M34 44h22M40 49h20"/><circle cx="92" cy="24" r="11"/><path d="M92 24v-6M92 24l5 3"/></g></svg>`;
}
function emptyBox(h,p,small,btn){ return `<div class="emptyp ${small?'sm':''}">${small?'':emptyArt()}<h3>${h}</h3><p>${p}</p>${btn||''}</div>`; }

/* ================= kalem / çalışma masası çizimi ================= */
function bannerSVG(){
  return `<svg viewBox="0 0 640 130" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
  <defs>
    <pattern id="hA" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" stroke-width="1" opacity=".22"/></pattern>
    <pattern id="hB" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="currentColor" opacity=".3"/></pattern>
  </defs>
  <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".5">
    <path d="M150 118H636" opacity=".7"/>
    <path d="M176 118l8-18h46l-8 18z" fill="url(#hB)"/><path d="M230 118l8-18h46l-8 18z"/><path d="M198 108h26M212 112h22M250 108h24" opacity=".6"/>
    <path d="M170 96l54-10" /><path d="M224 86l5-1" />
    <circle cx="352" cy="82" r="30"/><circle cx="352" cy="82" r="25" opacity=".6"/>
    <path d="M352 59v5M375 82h-5M352 105v-5M329 82h5"/><path d="M352 82V66M352 82l11 6"/>
    <path d="M334 108l-6 10M370 108l6 10"/><path d="M340 54l-4-6M364 54l4-6"/>
    <rect x="410" y="100" width="86" height="18" rx="1.5"/><path d="M420 100v18M424 100v18" opacity=".7"/>
    <rect x="416" y="82" width="72" height="18" rx="1.5" fill="url(#hA)"/><path d="M426 82v18" opacity=".7"/>
    <rect x="420" y="66" width="62" height="16" rx="1.5"/><path d="M430 66v16M434 66v16" opacity=".7"/>
    <ellipse cx="540" cy="116" rx="20" ry="3.5"/><path d="M540 112V76l30-32"/><circle cx="540" cy="76" r="2.2"/>
    <g transform="rotate(30 578 42)"><path d="M560 36h36l10 22h-56z" fill="url(#hA)"/></g>
    <path d="M598 118v-30h26v30" fill="url(#hB)"/><path d="M604 88l-6-26M611 88l1-30M619 88l8-24"/><path d="M598 94h26" opacity=".6"/>
  </g></svg>`;
}
$('#banner').innerHTML=bannerSVG();
$('#nowp-art')?.remove();

/* ================= panel: şimdi / sıradaki ================= */
function renderNow(){
  const k=TODAY*1440+NOWM, live=tasks.filter(t=>!t.done&&!isAny(t)&&t.kind!=='allday');
  const cur=live.filter(t=>t.kind==='timed'&&key(t)<=k&&k<endK(t)).sort(byKey)[0]
        ||live.filter(t=>t.kind==='open'&&key(t)<=k).sort(byKey)[0];
  const later=live.filter(t=>t.kind!=='deadline'&&key(t)>k).sort(byKey).filter(t=>t!==cur);
  const dls=live.filter(t=>t.kind==='deadline'&&key(t)>k).sort(byKey);
  let item,label;
  if(cur){item=cur;label='Now';} else if(later.length){item=later[0];label='Up next';} else if(dls.length){item=dls[0];label='Next deadline';}
  let h, bar='';
  if(!item){ h=`<div class="kick">Now</div><h2>Nothing planned</h2><div class="meta">Enjoy the quiet, or add a task.</div>`; }
  else {
    let meta;
    if(cur&&cur.kind==='timed'){
      const total=cur.e-cur.s, done=NOWM-cur.s, pct=Math.max(3,Math.min(100,done/total*100));
      bar=`<div class="bar" style="--c:${colorOf(cur)}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct}%"></i></div>`;
      meta=`<span>${when(cur)}</span><span><b>${dur(cur.e-NOWM)}</b> left</span>`;
    } else if(cur){ meta=`<span>${when(cur)}</span><span>running for <b>${dur(NOWM-cur.s)}</b></span>`; }
    else meta=`<span>${esc(sched(item))}</span><span>in <b>${dur(Math.max(1,key(item)-k))}</b></span>`;
    const after=cur?later[0]:null;
    h=`<div class="kick"><i></i>${label}</div><h2>${esc(item.title)}</h2><div class="meta">${meta}<span class="badge fillbg ty-${item.type}" style="--c:${colorOf(item)}">${ico(item.type)}${TYPES[item.type].n}</span></div>${bar}${after?`<div class="then">Then: ${esc(after.title)}, ${esc(when(after))}</div>`:''}`;
  }
  $('#nowp').innerHTML=`<div class="banner" aria-hidden="true">${bannerSVG()}</div>`+h;
}
function renderDash(){
  const h=NOWDATE.getHours();
  $('#greet').textContent=`${h<5?'Good night':h<12?'Good morning':h<18?'Good afternoon':'Good evening'}, ${S.profile.name}`;
  $('#dateline').textContent=NOWDATE.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  renderNow();
  let html='';
  if(S.span==='today'){
    const l=tasks.filter(t=>!isAny(t)&&onDay(t,TODAY)).sort(byKey);
    html=l.length?l.map(t=>row(t)).join(''):emptyBox('Nothing today','Your day is clear.',true);
  } else {
    for(let d=0;d<7;d++){ const l=tasks.filter(t=>!isAny(t)&&onDay(t,d)).sort(byKey); if(l.length) html+=`<div class="dh">${d===TODAY?'Today, ':''}${dayLbl(d)}</div>`+l.map(t=>row(t,false)).join(''); }
    html=html||emptyBox('Nothing this week','Add a task to get started.',true);
  }
  $('#listpanel').innerHTML=html;
  const pins=tasks.filter(t=>t.pinned&&!t.done).sort(byKey), hi=tasks.filter(t=>t.pri==='high'&&!t.done).sort(byKey), any=tasks.filter(t=>isAny(t)&&!t.done).sort((a,b)=>priRank[a.pri]-priRank[b.pri]);
  $('#c-pin').textContent=pins.length; $('#c-hi').textContent=hi.length; $('#c-any').textContent=any.length;
  $('#pinpanel').innerHTML=pins.length?pins.map(t=>row(t,true)).join(''):emptyBox('Nothing pinned','Pin a task to keep it here.',true);
  $('#hipanel').innerHTML=hi.length?hi.map(t=>row(t,true)).join(''):emptyBox('All clear','No urgent tasks.',true);
  $('#anypanel').innerHTML=any.length?any.map(t=>row(t)).join(''):emptyBox('Nothing floating','Anytime tasks show up here.',true);
}

/* ================= takvim ================= */
function setTitle(a,b){
  if(S.view==='month'){ $('#ttl').textContent=MONTHS[S.vm]; $('#yr').textContent=S.vy; return; }
  if(a.getMonth()===b.getMonth()){ $('#ttl').textContent=MONTHS[a.getMonth()]; $('#yr').textContent=a.getFullYear(); }
  else { $('#ttl').textContent=MONTHS[a.getMonth()].slice(0,3)+' – '+MONTHS[b.getMonth()].slice(0,3); $('#yr').textContent=b.getFullYear(); }
}
function hoursFor(days){
  const filled=new Set();
  days.forEach(d=>{
    tasks.filter(t=>t.kind==='timed'&&t.d===d).forEach(t=>{ for(let h=START;h<END;h++) if(t.s<h*60+60&&t.e>h*60) filled.add(h); });
    tasks.filter(t=>isLine(t)&&t.d===d).forEach(t=>filled.add(Math.floor(t.s/60)));
    if(d===TODAY&&NOWM>=START*60&&NOWM<END*60) filled.add(Math.floor(NOWM/60));
  });
  return Array.from({length:END-START},(_,i)=>(!S.compact||filled.has(START+i))?FULL:SLIM);
}
function yOf(m){ let y=0; for(let h=START;h<END;h++){ const H=HS[h-START]; if(m>=h*60+60){y+=H;continue;} if(m>h*60) y+=(m-h*60)/60*H; break; } return y; }
function minOfY(y){ let acc=0; for(let h=START;h<END;h++){ const H=HS[h-START]; if(y<acc+H||h===END-1){ const f=Math.max(0,Math.min(1,(y-acc)/H)); return H===SLIM?h*60:h*60+Math.round(f*60/15)*15; } acc+=H; } return END*60; }
const clampM=m=>Math.max(START*60,Math.min(END*60,m));
const totalH=()=>HS.reduce((a,b)=>a+b,0);
function layout(list){
  list.sort((a,b)=>a.s-b.s||b.e-a.e);
  let cluster=[],end=0,ends=[];
  const flush=()=>{const n=Math.max(...cluster.map(x=>x.lane))+1;cluster.forEach(x=>x.n=n);cluster=[];};
  list.forEach(ev=>{ if(cluster.length&&ev.s>=end){flush();ends=[];} let l=ends.findIndex(e=>e<=ev.s); if(l<0)l=ends.length; ends[l]=ev.e; ev.lane=l; cluster.push(ev); end=Math.max(end,ev.e); });
  if(cluster.length) flush();
}
function evHTML(t,top,ht,lane,n,pv){
  const wide=100/(n||1);
  return `<div class="ev fillbg ty-${t.type} p-${t.pri}${t.done?' done':''}${ht>=64?' tall':''}" ${pv?'':'tabindex="0" role="button"'} ${pv?'':`data-open="${t.id}"`} aria-label="${esc(t.title)}, ${fmt(t.s)} to ${fmt(t.e)}" style="--c:${colorOf(t)};top:${top}px;height:${ht}px;left:calc(${(lane||0)*wide}% + 2px);width:calc(${wide}% - 4px)"><div class="t">${ht>=34?ico(t.type):''}<span>${esc(t.title)}</span></div>${ht>=34?`<div class="tm">${fmt(t.s)}–${fmt(t.e)}</div>`:''}${ht>=70&&t.desc&&(n||1)===1?`<div class="ds">${esc(t.desc)}</div>`:''}</div>`;
}
function lineHTML(t,top,pv){
  return `<div class="ln ${t.kind}" style="--c:${colorOf(t)};top:${top}px"><span class="cap"></span><span class="lb" ${pv?'':'tabindex="0" role="button"'} ${pv?'':`data-open="${t.id}"`} aria-label="${esc(t.title)}, ${t.kind==='deadline'?'due':'starts'} ${fmt(t.s)}">${ico(t.kind==='deadline'?'flag':'start')}<span>${esc(t.title)} ${fmt(t.s)}</span></span></div>`;
}
function chipHTML(t,d){
  if(isLine(t)) return `<button class="mc line ${t.kind}" style="--c:${colorOf(t)}" data-open="${t.id}" type="button">${ico(t.kind==='deadline'?'flag':'start')}<span>${fmt(t.s)} ${esc(t.title)}</span></button>`;
  const multi=t.kind==='allday'&&t.d2!=null&&t.d2>t.d; let c='';
  if(multi){ if(d>t.d&&dow(d)!==0) c+=' cl'; if(d<t.d2&&dow(d)!==6) c+=' cr'; }
  const showText=!multi||d===t.d||dow(d)===0;
  const label=t.kind==='allday'?esc(t.title):`${fmt(t.s)} ${esc(t.title)}`;
  return `<button class="mc fillbg ty-${t.type} p-${t.pri}${c}${t.done?' done':''}" style="--c:${colorOf(t)}" data-open="${t.id}" type="button">${showText?`${ico(t.type)}<span>${label}</span>`:'<span>&nbsp;</span>'}</button>`;
}
function calWeek(){
  const n=S.mode===7?7:1, first=S.mode===1?S.selDay:S.startD;
  const vis=Array.from({length:n},(_,i)=>first+i);
  sheet.style.setProperty('--n',n);
  const arr=hoursFor(vis), nF=arr.filter(x=>x===FULL).length, nS=arr.length-nF;
  const avail=calbody.clientHeight-lastHdr-6;
  FULL=nF?Math.max(48,Math.floor((avail-nS*SLIM)/nF)):56;
  HS=hoursFor(vis);
  setTitle(dateOf(first),dateOf(first+n-1));
  let head;
  if(S.mode===1){
    const ws=Math.floor(first/7)*7; head=`<div class="days" style="grid-template-columns:repeat(7,1fr)">`;
    for(let i=0;i<7;i++){const d=ws+i; head+=`<button class="chipday${d===TODAY?' today':''}" type="button" data-pick="${d}" aria-pressed="${d===S.selDay}">${DOW[i]}<span class="dn">${dateOf(d).getDate()}</span></button>`;}
    head+='</div>';
  } else {
    head='<div class="days"><div></div>'+vis.map(d=>`<div class="dayh${d===TODAY?' today':''}">${DOW[dow(d)]}<span class="dn">${dateOf(d).getDate()}</span></div>`).join('')+'</div>';
  }
  let all='';
  if(tasks.some(t=>t.kind==='allday'&&vis.some(d=>onDay(t,d)))){
    all='<div class="allday"><div>all day</div>'+vis.map(d=>'<div>'+tasks.filter(t=>t.kind==='allday'&&onDay(t,d)).map(t=>chipHTML(t,d)).join('')+'</div>').join('')+'</div>';
  }
  const H=totalH();
  let ax=`<div class="axis" style="height:${H}px">`;
  for(let hr=START;hr<END;hr++) ax+=`<span class="${HS[hr-START]===SLIM?'sm':''}" style="top:${yOf(hr*60)}px">${two(hr)}</span>`;
  ax+='</div>';
  let cols='';
  vis.forEach(d=>{
    const day=tasks.filter(t=>t.kind==='timed'&&t.d===d&&t.e>START*60&&t.s<END*60).map(t=>({...t}));
    layout(day);
    const before=tasks.filter(t=>(t.kind==='timed'&&t.d===d&&t.e<=START*60)||(isLine(t)&&t.d===d&&t.s<START*60)).length;
    const after=tasks.filter(t=>(t.kind==='timed'&&t.d===d&&t.s>=END*60)||(isLine(t)&&t.d===d&&t.s>END*60)).length;
    let c=`<div class="col${d===TODAY?' today':''}" data-d="${d}" style="height:${H}px">`;
    for(let h=START;h<END;h++) c+=`<div class="hr" style="top:${yOf(h*60)}px"></div>`;
    if(before) c+=`<span class="hid" style="top:3px" title="Earlier than ${two(START)}:00">↑ ${before}</span>`;
    if(after) c+=`<span class="hid" style="bottom:3px" title="Later than ${two(END)}:00">↓ ${after}</span>`;
    day.forEach(t=>{ const top=yOf(clampM(t.s)), ht=Math.max(22,yOf(clampM(t.e))-top-1); c+=evHTML(t,top,ht,t.lane,t.n); });
    tasks.filter(t=>isLine(t)&&t.d===d&&t.s>=START*60&&t.s<=END*60).forEach(t=>{c+=lineHTML(t,yOf(t.s));});
    if(d===TODAY&&NOWM>=START*60&&NOWM<=END*60) c+=`<div class="now" style="top:${yOf(NOWM)}px"></div>`;
    cols+=c+'</div>';
  });
  calbody.innerHTML=head+all+`<div class="bodyw">${ax}${cols}</div>`;
  const bw=calbody.querySelector('.bodyw'); if(bw) lastHdr=bw.offsetTop;
}
function calMonth(){
  setTitle();
  const m1=new Date(S.vy,S.vm,1), lead=(m1.getDay()+6)%7, dim=new Date(S.vy,S.vm+1,0).getDate(), rows=Math.ceil((lead+dim)/7), s0=offOf(m1)-lead;
  let h='<div class="mhead">'+DOW.map(d=>`<div>${d}</div>`).join('')+'</div><div class="mgrid">';
  for(let i=0;i<rows*7;i++){
    const d=s0+i, dt=dateOf(d), out=dt.getMonth()!==S.vm, is=dt.toDateString()===MID.toDateString();
    const items=tasks.filter(t=>!isAny(t)&&onDay(t,d)).sort((a,b)=>(a.kind==='allday'?-1:0)-(b.kind==='allday'?-1:0)||byKey(a,b));
    h+=`<div class="cell${is?' today':''}${out?' out':''}" data-d="${d}"><span class="dn">${dt.getDate()}</span>${items.slice(0,3).map(t=>chipHTML(t,d)).join('')}${items.length>3?`<button class="more" type="button" data-more="${d}">+${items.length-3} more</button>`:''}</div>`;
  }
  calbody.innerHTML=h+'</div>';
}
function calRender(){
  $('#compactw').hidden=S.view!=='week';
  if(S.view==='week') calWeek(); else calMonth();
}
function setMode(){
  const w=stage.clientWidth; if(!w) return;
  const m=w>=760?7:1;
  if(m!==S.mode){
    if(m===7){ S.startD=Math.floor(S.selDay/7)*7; }
    else { S.selDay=S.startD+TODAY; }
    S.mode=m;
  }
  calRender();
}
function calStep(dir){
  if(S.view==='month'){ const d=new Date(S.vy,S.vm+dir,1); S.vy=d.getFullYear(); S.vm=d.getMonth(); }
  else if(S.mode===7) S.startD+=7*dir; else S.selDay+=dir;
  calRender();
}
function calToday(){ S.vy=MID.getFullYear(); S.vm=MID.getMonth(); S.startD=0; S.selDay=TODAY; calRender(); }

/* sürükle: boş saat aralığı -> yeni görev formu */
let drag=null;
const minAt=(col,y)=>minOfY(y-col.getBoundingClientRect().top);
function clearSel(){ calbody.querySelectorAll('.selbox').forEach(n=>n.remove()); }
function paintSel(){
  const s=Math.min(drag.a,drag.b), en=Math.max(drag.a,drag.b,s+15);
  clearSel();
  const el=document.createElement('div'); el.className='selbox';
  el.style.top=yOf(s)+'px'; el.style.height=Math.max(8,yOf(en)-yOf(s))+'px'; el.textContent=`${fmt(s)}–${fmt(en)}`;
  drag.col.appendChild(el);
}
calbody.addEventListener('pointerdown',e=>{
  if(e.button!==0) return;
  if(S.view==='week'){
    const col=e.target.closest('.col'); if(!col||e.target.closest('[data-open]')) return;
    const m=minAt(col,e.clientY); drag={col,d:+col.dataset.d,a:m,b:m,moved:false};
  } else {
    const cell=e.target.closest('.cell'); if(!cell||e.target.closest('[data-open],.more')) return;
    openForm({kind:'allday',d:+cell.dataset.d},'calendar');
  }
});
calbody.addEventListener('pointermove',e=>{
  if(!drag) return;
  const m=minAt(drag.col,e.clientY); if(m!==drag.b){ drag.b=m; drag.moved=true; paintSel(); }
});
window.addEventListener('pointerup',()=>{
  if(!drag) return;
  const dr=drag; drag=null; clearSel();
  let s=Math.min(dr.a,dr.b), en=Math.max(dr.a,dr.b);
  if(!dr.moved||en-s<30) en=s+60;
  if(en>END*60){ en=END*60; s=Math.min(s,en-60); }
  openForm({kind:'timed',d:dr.d,s,e:en},'calendar');
});

/* ================= görevler sayfası ================= */
function drawFilters(){
  $('#ftype').innerHTML=Object.keys(TYPES).map(k=>`<button class="chip" type="button" data-ft="${k}" aria-pressed="${S.f.types.has(k)}"><i class="sw8 ty-${k} fillbg" style="--c:var(${TYPES[k].c})"></i>${TYPES[k].n}</button>`).join('');
  $('#fpri').innerHTML=Object.keys(PRI).map(k=>`<button class="chip" type="button" data-fp="${k}" aria-pressed="${S.f.pri.has(k)}">${PRI[k]}</button>`).join('');
  $('#ftag').innerHTML=allTags().map(x=>`<button class="chip" type="button" data-tg="${esc(x)}" aria-pressed="${S.f.tags.has(x)}">#${esc(x)}</button>`).join('');
}
function filtered(){
  const f=S.f, q=f.q.trim().toLowerCase();
  const l=tasks.filter(t=>(!q||(t.title+' '+t.desc+' '+t.tags.join(' ')).toLowerCase().includes(q))&&(!f.types.size||f.types.has(t.type))&&(!f.pri.size||f.pri.has(t.pri))&&(f.status==='all'||(f.status==='done')===t.done)&&(!f.tags.size||t.tags.some(x=>f.tags.has(x))));
  l.sort(f.sort==='title'?(a,b)=>a.title.localeCompare(b.title):f.sort==='pri'?(a,b)=>priRank[a.pri]-priRank[b.pri]||byKey(a,b):byKey);
  return l;
}
function renderTasks(){
  drawFilters();
  const l=filtered(), active=S.f.q||S.f.types.size||S.f.pri.size||S.f.tags.size||S.f.status!=='all';
  $('#clear').hidden=!active;
  $('#count').textContent=`${l.length} ${l.length===1?'task':'tasks'}`;
  if(!S.loaded){ $('#cards').innerHTML=`<div class="skelg" aria-busy="true" aria-label="Loading tasks">${Array.from({length:6},(_,i)=>`<div><i style="width:40%"></i><i style="width:${70+i*4}%;height:14px"></i><i style="width:55%"></i></div>`).join('')}</div>`; return; }
  $('#cards').innerHTML=l.length?`<div class="cards">${l.map(card).join('')}</div>`:
    (active?emptyBox('No matches','Try a different search or clear the filters.',false,'<button class="btn" type="button" data-clear>Clear filters</button>')
      :emptyBox('No tasks yet','Add your first task to see it here.',false,'<button class="btn primary" type="button" data-new>New task</button>'));
}
function clearFilters(){ S.f={q:'',types:new Set(),pri:new Set(),tags:new Set(),status:'all',sort:S.f.sort}; $('#q').value=''; $('[name=status][value=all]').checked=true; renderTasks(); }

/* ================= yeni / düzenle formu ================= */
let F=null, editing=null, dialStep='hour';
function isoToOff(v){ const [y,m,d]=v.split('-').map(Number); return offOf(new Date(y,m-1,d)); }
function openForm(pre,from){
  pre=pre||{};
  editing=pre.id?tasks.find(t=>t.id===pre.id)||null:null;
  if(from) S.back=from; else if(S.page!=='new') S.back=S.page;
  if(editing){
    F={title:editing.title,type:editing.type,color:editing.color,kind:editing.kind,d:editing.d,d2:editing.d2,s:editing.s,
       dur:editing.kind==='timed'?editing.e-editing.s:60,pri:editing.pri,tags:[...editing.tags],desc:editing.desc||'',repeat:false};
  } else {
    F={title:'',type:'course',color:null,kind:pre.kind||'timed',d:pre.kind==='anytime'?null:(pre.d??TODAY),d2:pre.d2??null,
       s:pre.s??(9*60+30),dur:pre.e?pre.e-pre.s:60,pri:'med',tags:[],desc:'',repeat:false};
    if(F.kind==='timed'&&pre.s==null) F.s=9*60+30;
  }
  $('#fhead').textContent=editing?'Edit task':'New task';
  $('#fsave').textContent=editing?'Save changes':'Create task';
  $('#ft').value=F.title; $('#fdesc').value=F.desc; $('#ft').classList.remove('bad'); $('#fte').hidden=true;
  $('#frep').checked=false;
  show('new');
  paintForm();
  $('#ft').focus({preventScroll:true});
}
function drawColors(){
  const box=$('#fcolors');
  box.innerHTML=`<button type="button" class="cdot def" style="--c:var(${TYPES[F.type].c})" aria-label="Default for ${TYPES[F.type].n}" title="Default" aria-pressed="${F.color===null}" data-c=""></button>`+
    PALETTE.map(c=>`<button type="button" class="cdot" style="--c:${c}" aria-label="${c}" aria-pressed="${F.color===c}" data-c="${c}"></button>`).join('')+
    `<input class="colorin" type="color" id="cin" value="${F.color||'#8FA9C2'}" aria-label="Custom color">`;
  box.querySelectorAll('.cdot').forEach(b=>b.onclick=()=>{F.color=b.dataset.c||null;paintForm();});
  $('#cin').oninput=e=>{F.color=e.target.value.toUpperCase();paintForm();};
}
function drawTags(){
  $('#ftags').innerHTML=F.tags.map(x=>`<button class="tg tgx" type="button" data-rmtag="${esc(x)}" aria-label="Remove ${esc(x)}">#${esc(x)} ×</button>`).join('')||'<span class="hint">No tags yet</span>';
  $('#ftagall').innerHTML=allTags().filter(x=>!F.tags.includes(x)).map(x=>`<button class="chip" type="button" data-addtag="${esc(x)}">#${esc(x)}</button>`).join('');
}
function addTag(v){
  v=v.trim().toLowerCase().replace(/^#/,'').slice(0,16);
  if(!v||F.tags.includes(v)) return;
  if(F.tags.length>=6){ toast('Up to 6 tags per task'); return; }
  F.tags.push(v); $('#ftagin').value=''; paintForm();
}
function paintForm(){
  const timed=F.kind==='timed', ln=F.kind==='open'||F.kind==='deadline', ad=F.kind==='allday', any=F.kind==='anytime';
  $('#fdw').hidden=any; $('#fuw').hidden=!ad; $('#fstw').hidden=!(timed||ln); $('#lenwrap').hidden=!timed; $('#frepw').hidden=any||!!editing;
  $('#startlbl').textContent=F.kind==='deadline'?'Due at':'Starts';
  $('#startv').textContent=fmt(F.s);
  $('#fd').value=isoOf(F.d); $('#fd2').value=isoOf(F.d2);
  $$('input[name=fk]').forEach(i=>i.checked=i.value===F.kind);
  $$('input[name=fp]').forEach(i=>i.checked=i.value===F.pri);
  $$('input[name=ftp]').forEach(i=>i.checked=i.value===F.type);
  drawColors(); drawTags();
  $$('#chips .chip').forEach(c=>c.setAttribute('aria-pressed',String(+c.dataset.m===F.dur)));
  $('#endl').innerHTML=timed?(F.s+F.dur>1439?'<span class="err">Ends after midnight. Pick an earlier start or shorter length.</span>':`Ends at <b>${fmt(F.s+F.dur)}</b>`):'';
  if(document.activeElement!==$('#tkey')) $('#tkey').value=fmt(F.s);
  $('#th').textContent=two(Math.floor(F.s/60)); $('#tm').textContent=two(F.s%60);
  $('#th').setAttribute('aria-pressed',String(dialStep==='hour')); $('#tm').setAttribute('aria-pressed',String(dialStep==='min'));
  preview();
}
function preview(){
  const pv=$('#pv');
  const t={id:0,title:F.title.trim()||'Untitled',type:F.type,pri:F.pri,color:F.color,kind:F.kind,d:F.d,s:F.s,e:F.s+F.dur,tags:F.tags,desc:F.desc,done:false,pinned:false};
  if(F.kind==='anytime'){ pv.innerHTML=`<div class="pvcard">${card(t).replace(/data-open="0"/g,'')}</div>`; }
  else if(F.kind==='timed'){ pv.innerHTML=`<div class="pvwrap2">`+evHTML({...t,e:Math.min(F.s+F.dur,1439)},24,Math.max(26,F.dur/60*FULL-1),0,1,true)+'</div>'; }
  else if(F.kind==='allday'){ pv.innerHTML=`<div class="pvwrap2">`+chipHTML({...t,d2:F.d2!=null&&F.d2>F.d?F.d2:null},F.d).replace(/data-open="0"/,'')+'</div>'; }
  else { pv.innerHTML=lineHTML(t,F.kind==='deadline'?120:60,true); }
}
function saveForm(){
  const title=$('#ft').value.trim();
  if(!title){ $('#fte').hidden=false; $('#ft').classList.add('bad'); $('#ft').focus(); return; }
  if(F.kind==='timed'&&F.s+F.dur>1439){ paintForm(); toast('Pick an earlier start or shorter length'); return; }
  const base={title,type:F.type,color:F.color,kind:F.kind,pri:F.pri,desc:$('#fdesc').value.trim(),tags:[...F.tags]};
  if(F.kind==='timed'){ base.d=F.d; base.s=F.s; base.e=F.s+F.dur; }
  else if(F.kind==='allday'){ base.d=F.d; base.d2=F.d2!=null&&F.d2>F.d?F.d2:null; }
  else if(F.kind==='anytime'){ base.d=null; }
  else { base.d=F.d; base.s=F.s; }
  if(editing){ Object.assign(editing,mk({...editing,...base,id:editing.id})); toast('Changes saved'); }
  else {
    tasks.push(mk(base));
    if($('#frep').checked&&F.kind!=='anytime'){ for(let k=1;k<=3;k++) tasks.push(mk({...base,d:base.d+7*k,d2:base.d2!=null?base.d2+7*k:null})); toast('Task created, repeats weekly'); }
    else toast('Task created');
  }
  show(S.back==='new'?'dashboard':S.back);
}
/* saat kadranı: F.s dakika olarak tutulur */
function drawClock(){
  const svg=$('#clocksvg'); let g='';
  const hh=Math.floor(F.s/60), mm=F.s%60;
  for(let i=0;i<60;i++){const a=i/60*2*Math.PI,r1=i%5===0?102:106,r2=110;g+=`<line x1="${(r1*Math.sin(a)).toFixed(1)}" y1="${(-r1*Math.cos(a)).toFixed(1)}" x2="${(r2*Math.sin(a)).toFixed(1)}" y2="${(-r2*Math.cos(a)).toFixed(1)}" stroke="var(--ink)" stroke-width="${i%5===0?1.6:1}" opacity=".55"/>`;}
  const put=(txt,R,ang,on,inner,attr)=>{const x=R*Math.sin(ang),y=-R*Math.cos(ang);return `<g ${attr}><circle class="hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14"/><text class="${inner?'inner':''}" x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle" style="${on?'font-weight:600;fill:var(--accent-ink)':''}">${txt}</text></g>`;};
  const hand=`stroke="var(--ink)" stroke-width="1.6"`, knob=`fill="var(--accent)"`;
  if(dialStep==='hour'){
    const inner=hh===0||hh>12, hv=hh>12?hh-12:hh, ang=(hv%12)/12*2*Math.PI, R=inner?56:84, hx=R*Math.sin(ang), hy=-R*Math.cos(ang);
    g+=`<line x1="0" y1="0" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" ${hand}/><circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="15" ${knob}/>`;
    for(let i=1;i<=12;i++) g+=put(i,84,i/12*2*Math.PI,!inner&&hh===i,false,`data-h="${i}"`);
    for(let i=1;i<=12;i++){const v=i===12?0:i+12; g+=put(two(v),56,i/12*2*Math.PI,inner&&hh===v,true,`data-h="${v}"`);}
  } else {
    const ang=mm/60*2*Math.PI, hx=84*Math.sin(ang), hy=-84*Math.cos(ang);
    g+=`<line x1="0" y1="0" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" ${hand}/><circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="15" ${knob}/>`;
    for(let i=0;i<12;i++) g+=put(two(i*5),84,i*5/60*2*Math.PI,mm===i*5,false,`data-m="${i*5}"`);
  }
  g+=`<circle r="3.5" fill="var(--ink)"/>`; svg.innerHTML=g;
  svg.querySelectorAll('[data-h]').forEach(n=>n.addEventListener('click',()=>{F.s=(+n.dataset.h)*60+mm;dialStep='min';paintForm();drawClock();}));
  svg.querySelectorAll('[data-m]').forEach(n=>n.addEventListener('click',()=>{F.s=hh*60+(+n.dataset.m);paintForm();drawClock();}));
}
const dp=$('#dialpop'), sb=$('#startbtn');
function openDial(){ dp.hidden=false; sb.setAttribute('aria-expanded','true'); dialStep='hour'; drawClock(); }
function closeDial(){ dp.hidden=true; sb.setAttribute('aria-expanded','false'); }

/* ================= ayarlar ================= */
function drawProfile(){
  const p=S.profile, ini=(p.name.trim()[0]||'?').toUpperCase();
  $('#meBtn').innerHTML=`<span class="av" style="--c:${p.color}">${esc(ini)}</span><span class="txt"><b>${esc(p.name)}</b><small>${esc(p.headline||'No headline')}</small></span>`;
}
let draft={};
function fillDraft(){
  const ini=(draft.name.trim()[0]||'?').toUpperCase();
  $('#pav').style.setProperty('--c',draft.color); $('#pav').textContent=ini;
  $('#pcolors').innerHTML=PALETTE.map(c=>`<button class="cdot" type="button" style="--c:${c}" data-pc="${c}" aria-pressed="${c===draft.color}" aria-label="Color ${c}"></button>`).join('');
  $('#pcount').textContent=`${draft.headline.length}/60`;
}
function drawSettings(){
  draft={...S.profile};
  $('#pname').value=draft.name; $('#phead').value=draft.headline; fillDraft();
  $('#catrows').innerHTML=Object.keys(TYPES).map(k=>`<div class="catrow"><i class="sw8 ty-${k} fillbg" style="--c:${CATS[k]}"></i><span class="n">${TYPES[k].n}</span><input class="colorin" type="color" data-cat="${k}" value="${CATS[k]}" aria-label="${TYPES[k].n} color"></div>`).join('');
  $$('[name=set-theme]').forEach(r=>r.checked=r.value===S.theme);
  $('#cmp').checked=S.compact;
}
function setTheme(t){
  S.theme=t;
  let eff=t; if(t==='system') eff=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
  if(eff==='dark') document.documentElement.dataset.theme='dark'; else delete document.documentElement.dataset.theme;
  $$('[name=set-theme]').forEach(r=>r.checked=r.value===t);
}

/* ================= giriş / kayıt ================= */
function authSVG(){
  return `<svg viewBox="0 0 520 660" preserveAspectRatio="xMidYMax meet" style="overflow:visible" aria-hidden="true">
  <defs>
    <pattern id="aA" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="1" opacity=".25"/></pattern>
    <pattern id="aB" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".8" fill="currentColor" opacity=".35"/></pattern>
    <pattern id="aC" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6V0h6" stroke="currentColor" fill="none" opacity=".25"/></pattern>
  </defs>
  <g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".62">
    <path d="M52 66h250v212H52z" style="fill:var(--paper)"/><path d="M52 66h250v38H52z" fill="url(#aA)"/>
    <path d="M100 56v20M150 56v20M200 56v20M250 56v20"/><path d="M52 104h250"/>
    <g opacity=".5"><path d="M52 138h250M52 172h250M52 206h250M52 240h250M110 104v174M169 104v174M228 104v174"/></g>
    <rect x="53" y="139" width="56" height="32" style="fill:var(--c-course)" opacity=".4"/><rect x="53" y="139" width="56" height="32" fill="url(#aA)"/>
    <rect x="170" y="173" width="57" height="32" style="fill:var(--c-exam)" opacity=".4"/><rect x="170" y="173" width="57" height="32" fill="url(#aB)"/>
    <rect x="229" y="207" width="72" height="32" style="fill:var(--c-homework)" opacity=".4"/><path d="M231 238h68" stroke-width="2"/>
    <rect x="111" y="207" width="57" height="32" style="fill:var(--c-custom)" opacity=".4"/><rect x="111" y="207" width="57" height="32" fill="url(#aC)"/>
    <circle cx="140" cy="155" r="11" stroke-width="1.6"/>
    <circle cx="410" cy="132" r="62"/><circle cx="410" cy="132" r="53" opacity=".55"/><circle cx="410" cy="132" r="58" fill="url(#aB)" stroke="none" opacity=".6"/>
    <path d="M410 84v8M458 132h-8M410 180v-8M362 132h8"/><path d="M410 132V104M410 132l22 13" stroke-width="2"/><circle cx="410" cy="132" r="3"/>
    <path d="M372 236l62-6 6 64-62 6z" fill="url(#aA)" opacity=".8"/><path d="M372 236l62-6 6 64-62 6z" style="fill:var(--paper)" opacity=".5"/><path d="M386 258l36-3M388 272l30-3M390 286l22-2" opacity=".7"/><circle cx="404" cy="236" r="3"/>
    <path d="M-600 520h1720" stroke-width="1.6"/><path d="M-600 560h1720" opacity=".5"/><rect x="-600" y="520" width="1720" height="400" fill="url(#aB)" stroke="none" opacity=".6"/>
    <path d="M150 520l12-34h86l-12 34z" style="fill:var(--paper)"/><path d="M236 520l12-34h86l-12 34z" style="fill:var(--paper)"/><path d="M236 520l12-34"/>
    <path d="M178 502h50M172 511h50M262 502h50M256 511h50" opacity=".6"/><path d="M130 508l86-22"/><path d="M216 486l6-2"/>
    <rect x="360" y="486" width="110" height="34" rx="2" style="fill:var(--paper)"/><path d="M376 486v34M382 486v34" opacity=".7"/>
    <rect x="368" y="452" width="94" height="34" rx="2" fill="url(#aA)"/><path d="M382 452v34" opacity=".7"/>
    <rect x="374" y="424" width="80" height="28" rx="2" style="fill:var(--paper)"/><path d="M388 424v28M394 424v28" opacity=".7"/>
    <ellipse cx="76" cy="514" rx="30" ry="6" style="fill:var(--paper)"/><path d="M76 508V420l52-62"/><circle cx="76" cy="420" r="3"/><circle cx="128" cy="358" r="3"/>
    <g transform="rotate(34 150 336)"><path d="M118 322h64l14 36h-92z" fill="url(#aA)"/><path d="M118 322h64l14 36h-92z"/></g>
    <path d="M300 520v-48h38v48" fill="url(#aB)"/><path d="M300 480h38" opacity=".6"/><path d="M309 472l-8-38M318 472l1-42M328 472l10-34"/>
  </g></svg>`;
}
let authMode='login';
function renderAuth(mode){
  authMode=mode; const reg=mode==='register';
  $('#art').innerHTML=authSVG();
  $('#atitle').textContent=reg?'Create your account':'Welcome back';
  $('#alead').textContent=reg?'Plan your courses, exams and deadlines in one calendar.':'Sign in to see your week.';
  $('#aform').innerHTML=(reg?`<div class="field"><label for="a-name">Display name</label><input class="input" id="a-name" maxlength="24" autocomplete="nickname"><span class="err" id="a-name-e" hidden></span></div>`:'')+
  `<div class="field"><label for="a-mail">Email</label><input class="input" id="a-mail" type="email" autocomplete="email" inputmode="email"><span class="err" id="a-mail-e" hidden></span></div>
   <div class="field"><div class="cl"><label for="a-pw">Password</label>${reg?'':'<button class="link" type="button" id="forgot" style="font-size:13px">Forgot password?</button>'}</div>
     <div class="pwrap"><input class="input" id="a-pw" type="password" autocomplete="${reg?'new-password':'current-password'}"><button type="button" id="showpw" aria-pressed="false">Show</button></div>
     ${reg?'<span class="hint" id="a-pw-h">At least 8 characters.</span>':''}<span class="err" id="a-pw-e" hidden></span></div>
   <button class="btn primary" type="submit" style="min-height:44px">${reg?'Create account':'Sign in'}</button>`;
  $('#aalt').innerHTML=reg?'Already have an account? <button class="link" type="button" id="swap">Sign in</button>':'New here? <button class="link" type="button" id="swap">Create an account</button>';
}
function fieldErr(id,msg){ const e=$('#'+id+'-e'), i=$('#'+id); e.hidden=!msg; e.textContent=msg||''; i.classList.toggle('bad',!!msg); }
function submitAuth(e){
  e.preventDefault(); const reg=authMode==='register'; let bad=null;
  const chk=(id,msg)=>{fieldErr(id,msg); if(msg&&!bad) bad=id;};
  if(reg){ chk('a-name',$('#a-name').value.trim().length<2?'Enter at least 2 characters.':''); }
  chk('a-mail',/^\S+@\S+\.\S+$/.test($('#a-mail').value.trim())?'':'Enter a valid email, like name@school.edu.');
  const pw=$('#a-pw').value; chk('a-pw',pw.length<8?(reg?'Use at least 8 characters.':'Enter your password.'):'');
  if(bad){ $('#'+bad).focus(); return; }
  if(reg){ S.profile.name=$('#a-name').value.trim(); drawProfile(); }
  setScreen('app');
}

/* ================= yönlendirme ================= */
const PAGES=['dashboard','calendar','tasks','new','settings'];
function show(p){
  if(p==='new'&&!F) openForm({});
  S.page=p;
  PAGES.forEach(x=>$('#pg-'+x).hidden=x!==p);
  $$('.nav [data-go]').forEach(b=>{ if(b.dataset.go===p) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  $('#menu').hidden=true; $('#meBtn').setAttribute('aria-expanded','false');
  if(p==='tasks'&&!S.loaded){ renderTasks(); setTimeout(()=>{S.loaded=true; if(S.page==='tasks') renderTasks();},550); }
  if(p==='settings') drawSettings();
  if(p==='calendar') setMode();
  refresh();
  window.scrollTo(0,0);
}
function refresh(){
  drawProfile();
  if(S.page==='dashboard') renderDash();
  if(S.page==='tasks'&&S.loaded) renderTasks();
  if(S.page==='calendar') calRender();
}
function setScreen(s){
  $('#app').hidden=s!=='app'; $('#authpg').hidden=s==='app';
  if(s!=='app'){ renderAuth(s); window.scrollTo(0,0); } else { S.page='dashboard'; show('dashboard'); }
}

/* ================= olaylar ================= */
document.addEventListener('click',e=>{
  const t=e.target.closest.bind(e.target);
  const go=t('[data-go]');
  if(go){ if(go.dataset.go==='new'){ openForm({}, S.page); return; } show(go.dataset.go); return; }
  if(t('#meBtn')){ const m=$('#menu'); m.hidden=!m.hidden; $('#meBtn').setAttribute('aria-expanded',String(!m.hidden)); return; }
  if(!t('.meWrap')) $('#menu').hidden=true;
  if(t('#signout')){ setScreen('login'); return; }
  const pin=t('[data-pin]'); if(pin){ e.stopPropagation(); const x=tasks.find(a=>a.id==pin.dataset.pin); x.pinned=!x.pinned; refresh(); return; }
  const dn=t('[data-done]'); if(dn){ e.stopPropagation(); const x=tasks.find(a=>a.id==dn.dataset.done); x.done=!x.done; refresh(); return; }
  const pk=t('[data-pick]'); if(pk){ S.selDay=+pk.dataset.pick; calRender(); return; }
  const mo=t('[data-more]'); if(mo){ const d=+mo.dataset.more; S.view='week'; $$('input[name=view]').forEach(r=>r.checked=r.value==='week'); S.startD=Math.floor(d/7)*7; S.selDay=d; calRender(); return; }
  const op=t('[data-open]'); if(op){ openTask(+op.dataset.open); return; }
  const ft=t('[data-ft]'); if(ft){ const k=ft.dataset.ft; S.f.types.has(k)?S.f.types.delete(k):S.f.types.add(k); renderTasks(); return; }
  const fp=t('[data-fp]'); if(fp){ const k=fp.dataset.fp; S.f.pri.has(k)?S.f.pri.delete(k):S.f.pri.add(k); renderTasks(); return; }
  const tg=t('[data-tg]'); if(tg){ const k=tg.dataset.tg; S.f.tags.has(k)?S.f.tags.delete(k):S.f.tags.add(k); renderTasks(); return; }
  if(t('#clear')||t('[data-clear]')){ clearFilters(); return; }
  if(t('[data-new]')||t('#addbtn')){ openForm({}, S.page); return; }
  const pc=t('[data-pc]'); if(pc){ draft.color=pc.dataset.pc; fillDraft(); return; }
  if(t('#swap')){ renderAuth(authMode==='login'?'register':'login'); return; }
  if(t('#forgot')){ toast('We would email a reset link'); return; }
  if(t('#showpw')){ const b=t('#showpw'),i=$('#a-pw'); const s=i.type==='password'; i.type=s?'text':'password'; b.textContent=s?'Hide':'Show'; b.setAttribute('aria-pressed',String(s)); return; }
  if(t('#pdiscard')){ drawSettings(); fieldErr('pname',''); return; }
  if(t('#pwbtn')){ toast('Password form opens here'); return; }
  const rm=t('[data-rmtag]'); if(rm){ F.tags=F.tags.filter(x=>x!==rm.dataset.rmtag); paintForm(); return; }
  const ad=t('[data-addtag]'); if(ad){ addTag(ad.dataset.addtag); return; }
  if(t('#delacc')){
    openModal(`<div class="band" style="--c:var(--danger)"><h3>Delete account?</h3></div><div class="mb"><div class="muted">All tasks will be removed. Type <b>DELETE</b> to confirm.</div><input class="input" id="delin" autocomplete="off" aria-label="Type DELETE"></div><div class="acts"><button class="btn" type="button" id="dcancel">Cancel</button><button class="btn danger push" type="button" id="dgo" aria-disabled="true">Delete account</button></div>`,()=>{
      const inp=$('#delin'),go=$('#dgo'); inp.focus();
      inp.oninput=()=>go.setAttribute('aria-disabled',String(inp.value!=='DELETE'));
      $('#dcancel').onclick=closeModal; go.onclick=()=>{ if(inp.value==='DELETE'){ closeModal(); tasks.length=0; setScreen('register'); } };
    });
    return;
  }
  if(t('#fsave')) { saveForm(); return; }
  if(t('#fcancel')) { show(S.back==='new'?'dashboard':S.back); return; }
  if(t('#startbtn')){ dp.hidden?openDial():closeDial(); return; }
  if(t('#dialok')){ closeDial(); sb.focus(); return; }
  if(t('#th')){ dialStep='hour'; paintForm(); drawClock(); return; }
  if(t('#tm')){ dialStep='min'; paintForm(); drawClock(); return; }
  const cm=t('#chips .chip'); if(cm){ F.dur=+cm.dataset.m; paintForm(); return; }
  if(!dp.hidden && !dp.contains(e.target)) closeDial();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ if(document.querySelector('.scrim')) closeModal(); else if(!dp.hidden) closeDial(); }
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-open]')){ e.preventDefault(); openTask(+e.target.dataset.open); }
  if(e.key==='Enter'&&e.target.id==='ftagin'){ e.preventDefault(); addTag(e.target.value); }
});
document.addEventListener('input',e=>{
  const i=e.target;
  if(i.id==='q'){ S.f.q=i.value; renderTasks(); }
  if(i.id==='ft'){ F.title=i.value; $('#fte').hidden=!!i.value.trim(); preview(); }
  if(i.id==='fdesc'){ F.desc=i.value; preview(); }
  if(i.id==='tkey'){ const m=/^(\d{1,2}):?(\d{2})$/.exec(i.value.trim()); if(m&&+m[1]<24&&+m[2]<60){ F.s=+m[1]*60+ +m[2]; paintForm(); drawClock(); } }
  if(i.id==='pname'){ draft.name=i.value; fillDraft(); if(i.value.trim().length>=2) fieldErr('pname',''); }
  if(i.id==='phead'){ draft.headline=i.value; fillDraft(); }
  if(i.dataset&&i.dataset.cat){ CATS[i.dataset.cat]=i.value; document.documentElement.style.setProperty('--c-'+i.dataset.cat,i.value); drawSettings(); refresh(); }
  if(i.id==='cin'){ F.color=i.value.toUpperCase(); paintForm(); }
  if(i.id==='delin'){}
});
document.addEventListener('change',e=>{
  const i=e.target;
  if(i.name==='span'){ S.span=i.value; renderDash(); }
  if(i.name==='status'){ S.f.status=i.value; renderTasks(); }
  if(i.id==='sort'){ S.f.sort=i.value; renderTasks(); }
  if(i.name==='set-theme') setTheme(i.value);
  if(i.id==='cmp'){ S.compact=i.checked; if(S.page==='calendar') calRender(); }
  if(i.id==='compact'){ S.compact=i.checked; calRender(); }
  if(i.name==='view'){ S.view=i.value; if(S.view==='month'){ const d=dateOf(S.mode===1?S.selDay:S.startD+3); S.vy=d.getFullYear(); S.vm=d.getMonth(); } calRender(); }
  if(i.name==='fk'){ F.kind=i.value; if(F.kind!=='anytime'&&F.d==null) F.d=TODAY; paintForm(); }
  if(i.name==='fp'){ F.pri=i.value; paintForm(); }
  if(i.name==='ftp'){ F.type=i.value; paintForm(); }
  if(i.id==='fd'&&i.value){ F.d=isoToOff(i.value); paintForm(); }
  if(i.id==='fd2'){ F.d2=i.value?isoToOff(i.value):null; paintForm(); }
  if(i.name==='scr') setScreen(i.value);
});
document.addEventListener('submit',e=>{
  if(e.target.id==='aform') submitAuth(e);
  if(e.target.id==='pform'){ e.preventDefault(); const v=draft.name.trim(); if(v.length<2){ fieldErr('pname','Enter at least 2 characters.'); $('#pname').focus(); return; } fieldErr('pname',''); S.profile={...draft,name:v,headline:draft.headline.trim()}; drawProfile(); toast('Profile saved'); }
});
document.addEventListener('pointerdown',e=>{ if(!dp.hidden&&!dp.contains(e.target)&&!sb.contains(e.target)) closeDial(); });
$('#prev').onclick=()=>calStep(-1);
$('#next').onclick=()=>calStep(1);
$('#todaybtn').onclick=calToday;
new ResizeObserver(()=>{ if(S.page==='calendar') setMode(); }).observe(stage);

/* ilk açılış */
setTheme('light');
drawProfile();
setScreen(window.__START||'app');
