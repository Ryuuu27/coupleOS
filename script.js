const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const plus=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const ago=n=>new Date(Date.now()-n*864e5).toISOString();
const S={
 home:{n:'Home',sub:'This week at a glance'},
 cal:{n:'Calendar',sub:'Add dates and events, remove them when done',items:[['Dinner at Marco’s',plus(1)],['Rent due',plus(2)],['Farmers market',plus(3)],['Call with parents',plus(4)]]},
 bud:{n:'Budget',sub:'Shared expenses · tap one for details',ex:[['Groceries',2450,'A',ago(6)],['Electric bill',3180,'B',ago(3)],['Movie night',850,'A',ago(1)]]},
 gro:{n:'Groceries',sub:'One list, two phones',items:[['Eggs',0],['Coffee beans',1],['Basil',0]]},
 trv:{n:'Bucket list',sub:'Trips and dates to plan',items:[['Weekend in Bohol',0],['Sunset picnic',0],['Cooking class',1]]},
 dat:{n:'Date night',sub:'Add ideas, we pick one',deck:['Sunset picnic','Cook a new recipe together','Movie marathon','Walk and street food'],i:0},
 chr:{n:'Chores deck',sub:'Draw a card, we pick whose turn it is',deck:['Wash the dishes','Take out trash','Water the plants','Fix leaky tap','Clean the fridge'],i:0,who:'A'},
 dia:{n:'Diary',sub:'Write about your days together · tap one to read',entries:[['Our first entry','Write about today: what made you smile?',ago(0)]]},
 alb:{n:'Album',sub:'Albums of your pictures, e.g. This day or Yesterday',names:['Our photos']},
 gol:{n:'Goals',sub:'Drag to update progress',g:[['Save for our trip',60],['Cook at home 3×/week',40],['Weekly walk together',75]]}
};
let N={A:'Partner A',B:'Partner B'};let ready=false;let cur='home';let openEx=-1,openDx=-1,lastCur='home',bm='',gm=null,dq='',favOnly=false,curAlb=null;
const dock=document.getElementById('dock'),pane=document.getElementById('pane');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtD=s=>new Date(s+'T00:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
const fmtT=s=>new Date(s).toLocaleString(undefined,{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
const peso=n=>'₱'+(+n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const ym=d=>{const x=new Date(d);return x.getFullYear()+'-'+pad(x.getMonth()+1)};
const occ=(x,k)=>x[1]==k||(x[1]<=k&&((x[2]==1&&x[1].slice(8)==k.slice(8))||(x[2]==2&&x[1].slice(5)==k.slice(5))));
const ECAT=['Anniversary','Birthday','Date','Trip','Appointment','Important','Celebration'];
const nx=x=>{const d=new Date(x[1]+'T00:00:00'),t=new Date();t.setHours(0,0,0,0);if(x[2])while(d<t)x[2]==2?d.setFullYear(d.getFullYear()+1):d.setMonth(d.getMonth()+1);return d};
const cd=d=>{const t=new Date();t.setHours(0,0,0,0);const n=Math.round((d-t)/864e5);return n==0?'Today':n==1?'Tomorrow':n>0?'in '+n+' days':-n+' days ago'};
const CAT=['Food','Bills','Dates','Transport','Other'];
const fmtTm=t=>new Date('2000-01-01T'+t).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
const fmtS=s=>new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
const delb=(i,t)=>`<button class="x" data-del="${i}" aria-label="Delete ${esc(t)}">×</button>`;
function list(k,del){return S[k].items.map((x,i)=>[x,i]).reverse().map(([x,i])=>`<div class="row ${x[1]?'done':''}"><input type="checkbox" id="${k}${i}" data-k="${k}" data-i="${i}" ${x[1]?'checked':''}><label for="${k}${i}">${esc(x[0])}${x[2]>1?' ×'+x[2]:''}</label>${del?delb(i,x[0]):''}</div>`).join('')||'<p class="empty">Nothing here yet.</p>'}
function addf(ph){return `<div class="add"><input type="text" id="new" placeholder="${ph}" aria-label="${ph}"><button id="addb">Add</button></div>`}
function grof(){return '<div class="add"><input type="text" id="new" placeholder="Add an item" aria-label="Add an item"><input type="number" id="qty" min="1" placeholder="Qty" aria-label="Quantity" style="width:70px;flex:none"><button id="addb">Add</button></div>'}
function calTop(m){
 const now=new Date(),g0=gm||(gm=new Date(now.getFullYear(),now.getMonth(),1)),dim=new Date(g0.getFullYear(),g0.getMonth()+1,0).getDate(),tk=iso(now);
 const days=m.since?Math.floor((new Date().setHours(0,0,0,0)-new Date(m.since+'T00:00:00'))/864e5):-1;
 const cell=d=>{const k=g0.getFullYear()+'-'+pad(g0.getMonth()+1)+'-'+pad(d),ev=m.items.filter(x=>occ(x,k)).sort((p,q)=>(p[3]||'').localeCompare(q[3]||''));
  return `<span class="${ev.length?'ev':''} ${k==tk?'td':''}" title="${esc(ev.map(x=>(x[3]?fmtTm(x[3])+' ':'')+x[0]).join(', '))}"><b>${d}</b>${ev.slice(0,2).map(x=>`<em>${esc(x[0])}</em>`).join('')}${ev.length>2?`<em>+${ev.length-2}</em>`:''}</span>`};
  return `<div class="card" style="margin:10px 0"><small style="margin:0">Days together</small><b>${days>=0?days.toLocaleString():'Set your date below'}</b><div class="add" style="margin-top:8px"><input type="date" id="since" value="${m.since||''}" aria-label="Date you got together"></div></div>
 <div class="cg"><div class="cgh"><button class="x" data-gm="-1" aria-label="Previous month">‹</button><b>${g0.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b><button class="x" data-gm="1" aria-label="Next month">›</button></div><div class="cgd">${['S','M','T','W','T','F','S'].map(d=>`<i>${d}</i>`).join('')}${'<span></span>'.repeat(g0.getDay())}${Array.from({length:dim},(_,k)=>cell(k+1)).join('')}</div></div>`}
function diaList(){
 const m=S.dia,q=dq.trim().toLowerCase();
 const rows=m.entries.map((x,i)=>[x,i]).filter(([x])=>!q||(x[0]+' '+x[1]).toLowerCase().includes(q)).sort((p,r)=>r[0][2].localeCompare(p[0][2]));
 return rows.map(([x,i])=>{const o=openDx==i;return `<button class="rowb" data-dx="${i}" aria-expanded="${o}"><label>${esc(x[0])}</label><span class="when2">${esc((x[4]?N[x[4]]+' · ':'')+(x[3]?x[3]+' · ':'')+fmtS(x[2]))}</span><span class="chev" aria-hidden="true"></span></button>`+(o?`<div class="det"><div class="entry">${esc(x[1])}</div><div><span>Written ${esc(fmtT(x[2]))}</span></div><button class="btn alt" style="justify-self:start;padding:8px 16px;font-size:14px" data-dd="${i}">Delete entry</button></div>`:'')}).join('')||'<p class="empty">'+(q?'No entries match your search.':'No entries yet. Write the first one above.')+'</p>'}
function notifLine(){if(!('Notification' in window))return '';const p=Notification.permission;
 if(p=='denied')return '<small>Notifications are blocked in your browser settings. Allow them for this site to get reminders.</small>';
 if(p=='granted'&&!VAPID_KEY)return '<small>Reminders pop up while the app is open. For reminders when it is closed, use the phone calendar buttons below.</small>';
 if(p=='granted'&&st.g('cos_push')=='1')return '<small>Notifications are on for this device, even when the app is closed.</small>';
 return '<div class="mini" style="margin:6px 0"><button data-a="notif">Turn on reminders while the app is open</button></div>'}
function albNames(){const set=new Set((S.alb&&S.alb.names)||[]);photos.forEach(p=>set.add(p.a||'Our photos'));set.add('Our photos');return [...set]}
function albUI(){
 if(curAlb==null)return `<div class="add"><input type="text" id="new" placeholder="New album, e.g. Yesterday's pictures" maxlength="40" aria-label="New album name"><button id="addb">Create</button></div><div class="gal" id="gal"></div>`;
 return `<div class="add"><button class="x" data-ab="1" aria-label="Back to albums" style="font-size:15px">‹ Albums</button><b style="flex:1">${esc(curAlb)}</b><input type="file" id="pick" class="sr" accept="image/*" multiple><label class="upl" for="pick">Add photos</label></div><label class="when2" style="display:flex;align-items:center;gap:6px;margin:8px 0"><input type="checkbox" id="favo" ${favOnly?'checked':''}> Favorites only</label><p id="albmsg" class="empty" role="status" style="padding:0"></p><div class="gal" id="gal"></div>`}
function homeUI(){
 const hr=new Date().getHours(),gr=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening',t0=new Date();t0.setHours(0,0,0,0);
 const up=S.cal.items.map(x=>[x,nx(x)]).filter(([x,d])=>d>=t0&&(d-t0)/864e5<=7).sort((a,b)=>a[1]-b[1]),
  gro=S.gro.items.filter(x=>!x[1]).length,G=S.gol.g[0],dn=S.dat.deck[S.dat.i],ch=S.chr.deck[S.chr.i],
  T=G&&G[2]?Math.min(100,Math.round((G[3]||0)/G[2]*100)):G?G[1]:0;
 const row=(a,b)=>`<div class="row"><span class="when">${a}</span><label style="cursor:default">${b}</label></div>`;
 return `<h3>${gr}, ${esc(N.A)} & ${esc(N.B)}.</h3><small>This week at a glance</small>`+
  (up.map(([x,d])=>row(esc(cd(d)),esc(x[0])+(x[3]?' at '+fmtTm(x[3]):'')+(x[4]?` <span class="when2">${esc(x[4])}</span>`:''))).join('')||row('This week','No events coming up'))+
  row('Groceries',gro+' item'+(gro==1?'':'s')+' remaining')+row('Next chore',ch?esc(ch)+' · '+esc(N[S.chr.who]):'None')+(G?row('Goal',esc(G[0])+' · '+T+'%'):'')+(dn?row('Date night idea',esc(dn)):'')}
function render(){
 dock.innerHTML=Object.keys(S).map(k=>`<button role="tab" aria-selected="${k==cur}" data-t="${k}">${S[k].n}</button>`).join('');
 const m=S[cur];let h=`<h3>${m.n}</h3><small>${m.sub}</small>`;
 if(cur=='home'){h=homeUI()}else if(cur=='bud'){
  if(!bm)bm=ym(new Date());
  const E=m.ex.map((e,i)=>[e,i]).filter(([e])=>ym(e[3]||new Date())==bm).reverse().sort((p,q)=>String(q[0][3]||'').localeCompare(String(p[0][3]||'')));
  const sum=f=>E.filter(f).reduce((q,[e])=>q+e[1],0),a=sum(([e])=>e[2]=='A'),b=sum(([e])=>e[2]=='B'),tot=a+b,t=tot||1,lim=m.lim||0,pct=lim?Math.min(100,tot/lim*100):0;
  h+=`<div class="add wrapit"><input type="month" id="bm" value="${bm}" aria-label="Month"><input type="number" id="lim" min="0" step="any" value="${lim||''}" placeholder="Monthly limit ₱" aria-label="Monthly spending limit"></div>`+
  (lim?`<div class="bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i class="${tot>lim?'over':''}" style="width:${pct}%"></i></div><small>${peso(tot)} of ${peso(lim)} · ${tot>lim?peso(tot-lim)+' over the limit':peso(lim-tot)+' left'}</small>`:'<small>Set a monthly limit to see your progress.</small>')+
  `<div class="chips">${CAT.map(c=>`<span>${c} ${peso(sum(([e])=>(e[4]||'Other')==c))}</span>`).join('')}</div>`+
  (E.map(([e,i])=>{const o=openEx==i;return `<button class="rowb" data-ex="${i}" aria-expanded="${o}"><span class="dot ${e[2]=='A'?'t':'c'}"></span><label>${esc(e[0])}</label><b>${peso(e[1])}</b><span class="chev" aria-hidden="true"></span></button>`+
   (o?`<div class="det"><div><span>Expense</span> · ${esc(e[0])}</div><div><span>Amount</span> · ${peso(e[1])}</div><div><span>Category</span> · ${esc(e[4]||'Other')}</div><div><span>Paid by</span> · ${esc(N[e[2]])}</div><div><span>Date added</span> · ${e[3]?fmtT(e[3]):'Not recorded'}</div></div>`:'')}).join('')||'<p class="empty">No expenses this month.</p>')+
  `<div class="split"><div class="t" style="width:${a/t*100}%"></div><div class="c" style="width:${b/t*100}%"></div></div>
  <div class="add wrapit"><input type="text" id="new" placeholder="Expense name" aria-label="Expense name"><input type="number" id="amt" min="0" step="any" placeholder="₱" style="width:80px" aria-label="Amount"><select id="cat" aria-label="Category">${CAT.map(c=>`<option>${c}</option>`).join('')}</select><select id="pb" aria-label="Paid by"><option value="A">${esc(N.A)}</option><option value="B">${esc(N.B)}</option></select><button id="addb">Add</button></div>`;
 }else if(cur=='cal'){
  const rows=m.items.map((x,i)=>[x,i,nx(x)]).reverse();
  h+=calTop(m)+notifLine()+'<div class="mini" style="margin:6px 0"><button data-a="icsall">Add all events to phone calendar</button><button data-a="gsync">Sync Google Calendar</button><button data-a="sub">Auto-update link</button></div>';
  h+=(rows.map(([x,i,d])=>`<div class="row"><span class="when">${esc(fmtD(iso(d)))}</span><label style="cursor:default">${esc(x[0])} <span class="when2">${x[4]?esc(x[4])+' · ':''}${x[3]?fmtTm(x[3]):'All day'} · ${cd(d)}${x[2]==1?' · monthly':x[2]==2?' · yearly':''}</span></label><button class="x" data-ics="${i}" style="font-size:13px;white-space:nowrap" aria-label="Add ${esc(x[0])} to phone calendar">Add to phone</button>${delb(i,x[0])}</div>`).join('')||'<p class="empty">No events yet. Add one below.</p>')+
  `<div class="add wrapit"><input type="date" id="dt" value="${plus(0)}" aria-label="Date"><input type="text" id="new" placeholder="Event name" aria-label="Event name"><label class="when2" style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="tms"> Set a time</label><input type="time" id="tm" disabled aria-label="Time" style="font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink)"><select id="ecat" aria-label="Category">${ECAT.map(c=>`<option>${c}</option>`).join('')}</select><select id="rep" aria-label="Repeat"><option value="0">No repeat</option><option value="1">Monthly</option><option value="2">Yearly</option></select><button id="addb">Add</button></div>`;
 }else if(cur=='chr'){
  h+=`<div class="card"><small style="margin:0">Up next · ${esc(N[m.who])}</small><b>${esc(m.deck[m.i])}</b></div><div class="mini" style="flex-wrap:wrap"><button data-a="done">Done</button><button data-a="next">Draw random</button><button data-a="swap">Swap partner</button></div>`+addf('Add a chore')+`<small style="margin:10px 0 0">${m.deck.length} chores in the deck · Done so far: ${esc(N.A)} ${(m.tally||{}).A||0}, ${esc(N.B)} ${(m.tally||{}).B||0}</small>`;
 }else if(cur=='dat'){
  h+=`<div class="card"><small style="margin:0">Tonight's idea</small><b>${esc(m.deck[m.i]||'Add an idea below')}</b></div><div class="mini"><button data-a="pick">Pick one</button><button data-a="dmark">Mark as done</button></div>`+addf('Add a date idea')+`<div style="margin-top:10px">${m.deck.map((t,i)=>[t,i]).reverse().map(([t,i])=>{const dn=(m.done||[]).includes(t);return `<div class="row ${dn?'done':''}"><input type="checkbox" id="dn${i}" data-dn="${i}" ${dn?'checked':''}><label for="dn${i}">${esc(t)}</label></div>`}).join('')}</div>`;
 }else if(cur=='dia'){
  h+=`<input type="search" id="dq" placeholder="Search entries" aria-label="Search entries" value="${esc(dq)}" style="width:100%;margin:8px 0;font:inherit;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink)"><div class="add" style="flex-direction:column"><input type="text" id="new" placeholder="Title (optional)" maxlength="80" aria-label="Title"><textarea id="dtxt" rows="4" placeholder="Dear diary…" aria-label="Diary entry"></textarea><div class="add wrapit"><select id="dwho" aria-label="Written by"><option value="A">${esc(N.A)}</option><option value="B">${esc(N.B)}</option></select><select id="dmood" aria-label="Mood">${['Happy','Calm','Excited','Grateful','Tired','Sad'].map(c=>`<option>${c}</option>`).join('')}</select></div><button id="addb" style="padding:12px">Save entry</button></div><div id="dl" style="margin-top:10px">${diaList()}</div>`;
 }else if(cur=='alb'){
  h+=me?albUI():`<p class="empty">Log in or create an account to keep your photos. They are saved to your shared cloud album.</p>`;
 }else if(cur=='gol'){
  h+=(m.g.map((g,i)=>[g,i]).reverse().map(([g,i])=>{const T=g[2]||0,sv=g[3]||0,pc=T?Math.min(100,Math.round(sv/T*100)):g[1];
   return `<div style="margin:12px 0"><div class="row" style="border:0;padding:0"><label>${esc(g[0])}</label><b>${pc}%</b><button class="x" data-gd="${i}" aria-label="Delete goal ${esc(g[0])}">×</button></div>`+
   (T?`<div class="bar"><i style="width:${pc}%"></i></div><div class="add"><span class="when2" style="align-self:center;white-space:nowrap">${peso(sv)} of ${peso(T)}</span><input type="number" min="0" step="any" value="${sv}" data-gs="${i}" aria-label="Saved so far for ${esc(g[0])}"></div>`:`<input type="range" min="0" max="100" value="${g[1]}" data-g="${i}" aria-label="${esc(g[0])}">`)+'</div>'}).join('')||'<p class="empty">No goals yet. Add one below.</p>')+
  `<div class="add wrapit"><input type="text" id="new" placeholder="Add a goal" aria-label="Add a goal"><input type="number" id="tgt" min="0" step="any" placeholder="Target ₱ (optional)" style="width:150px" aria-label="Target amount"><button id="addb">Add</button></div>`;
 }else{h+=list(cur,cur=='gro')+(cur=='gro'?grof():addf('Add an idea'))+(cur=='gro'?'<div class="mini top" style="margin-top:10px"><button data-a="clr">Clear checked items</button></div>':'')}
 const keep=pane.scrollTop,same=lastCur==cur;lastCur=cur;
 pane.innerHTML=h;pane.scrollTop=same?keep:0;if(ready)save();
 if(cur=='alb'&&me)drawGal();
}
function draw(){const m=S.chr;let n=m.i;if(m.deck.length>1)while(n==m.i)n=Math.floor(Math.random()*m.deck.length);m.i=n;m.who=Math.random()<.5?'A':'B'}
function add(){
 if(cur=='dia'){const tx=document.getElementById('dtxt').value.trim();if(!tx){document.getElementById('dtxt').focus();return}
  S.dia.entries.push([document.getElementById('new').value.trim()||'Untitled',tx,new Date().toISOString(),document.getElementById('dmood').value,document.getElementById('dwho').value]);openDx=-1;render();return}
 const m=S[cur],nw=document.getElementById('new');if(!nw)return;const v=nw.value.trim();if(!v)return;
 if(cur=='bud'){const a=+document.getElementById('amt').value;if(!a)return;bm=ym(new Date());m.ex.push([v,a,document.getElementById('pb').value,new Date().toISOString(),document.getElementById('cat').value])}
 else if(cur=='cal'){const d=document.getElementById('dt').value;if(!d){document.getElementById('dt').focus();return}m.items.push([v,d,+document.getElementById('rep').value,(document.getElementById('tms').checked&&document.getElementById('tm').value)||'',document.getElementById('ecat').value])}
 else if(cur=='alb'){m.names=m.names||[];if(!albNames().includes(v))m.names.push(v);curAlb=v}
 else if(cur=='chr'||cur=='dat'){m.deck.push(v)}
 else if(cur=='gol'){m.g.push([v,0,+document.getElementById('tgt').value||0,0])}
 else m.items.push([v,0,cur=='gro'?(+document.getElementById('qty').value||0):0]);
 render()}
dock.onclick=e=>{const t=e.target.closest('[data-t]');if(t){cur=t.dataset.t;openEx=-1;openDx=-1;render()}};
pane.onclick=e=>{
 const m=S[cur],t=e.target;
 const ic=t.closest('[data-ics]');if(ic){dlIcs([m.items[+ic.dataset.ics]],'couple-os-event');return}
 const gmb=t.closest('[data-gm]');if(gmb){gm=new Date(gm.getFullYear(),gm.getMonth()+(+gmb.dataset.gm),1);render();return}
 const al=t.closest('[data-al]');if(al){curAlb=al.dataset.al;favOnly=false;render();return}
 if(t.closest('[data-ab]')){curAlb=null;render();return}
 if(t.closest('[data-da]')){m.names=(m.names||[]).filter(n=>n!=curAlb);curAlb=null;render();return}
 const ph=t.closest('[data-ph]');if(ph){openPv(+ph.dataset.ph);return}
 const dd=t.closest('[data-dd]');if(dd){if(confirm('Delete this diary entry?')){m.entries.splice(+dd.dataset.dd,1);openDx=-1;render()}return}
 const dx=t.closest('[data-dx]');if(dx){const i=+dx.dataset.dx;openDx=openDx==i?-1:i;render();return}
 const gd=t.closest('[data-gd]');if(gd){m.g.splice(+gd.dataset.gd,1);render();return}
 const del=t.closest('[data-del]');if(del){m.items.splice(+del.dataset.del,1);render();return}
 const ex=t.closest('[data-ex]');if(ex){const i=+ex.dataset.ex;openEx=openEx==i?-1:i;render();return}
 if(t.id=='addb'){add();return}
 const a=t.dataset.a;
 if(a){if(a=='swap')m.who=m.who=='A'?'B':'A';else if(a=='notif'){enablePush();return}else if(a=='gsync'){gSync(true);return}else if(a=='icsall'){dlIcs(m.items,'couple-os-events');return}else if(a=='sub'){if(!me){note('Log in first.');return}const u=location.origin+'/cal-'+me+'.ics';(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>note('Link copied. Subscribe to it in your phone calendar.'),()=>prompt('Copy this link and subscribe to it in your phone calendar:',u));return}else if(a=='clr')m.items=m.items.filter(x=>!x[1]);else if(a=='pick'||a=='dmark'){m.done=m.done||[];if(a=='dmark'&&m.deck[m.i]&&!m.done.includes(m.deck[m.i]))m.done.push(m.deck[m.i]);const pool=m.deck.map((t,i)=>i).filter(i=>i!=m.i&&!m.done.includes(m.deck[i]));if(pool.length)m.i=pool[Math.floor(Math.random()*pool.length)]}else{if(a=='done'){m.tally=m.tally||{A:0,B:0};m.tally[m.who]++}draw()}render()}
};
pane.onkeydown=e=>{if(e.key=='Enter'&&e.target.matches('#new,#amt,#dt')){e.preventDefault();add()}};
pane.onchange=e=>{if(e.target.id=='bm'){bm=e.target.value||bm;openEx=-1;render();return}if(e.target.dataset.dn!==undefined){const D=S.dat,t=D.deck[+e.target.dataset.dn];D.done=D.done||[];const j=D.done.indexOf(t);j<0?D.done.push(t):D.done.splice(j,1);render();return}if(e.target.id=='tms'){document.getElementById('tm').disabled=!e.target.checked;return}if(e.target.id=='since'){S.cal.since=e.target.value;render();return}if(e.target.dataset.gs!==undefined){S.gol.g[+e.target.dataset.gs][3]=Math.max(0,+e.target.value||0);render();return}if(e.target.id=='favo'){favOnly=e.target.checked;drawGal();return}if(e.target.id=='lim'){S.bud.lim=Math.max(0,+e.target.value||0);render();return}
 if(e.target.id=='pick'){const fs=[...e.target.files];e.target.value='';addPhotos(fs);return}
 const d=e.target.dataset;if(d.k){S[d.k].items[d.i][1]=e.target.checked?1:0;e.target.closest('.row').classList.toggle('done',e.target.checked);save()}};
pane.oninput=e=>{if(e.target.id=='dq'){dq=e.target.value;document.getElementById('dl').innerHTML=diaList();return}if(e.target.dataset.g!==undefined){S.gol.g[e.target.dataset.g][1]=+e.target.value;e.target.previousElementSibling.querySelector('b').textContent=e.target.value+'%';save()}};
render();

/* ---- Firebase: data shared between the two of you ---- */
const $=id=>document.getElementById(id),dlg=$('dlg'),er=$('err');
let me=null,mode='in',mem={};
const st={g(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}},s(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}};
const cloud=!!window.FB&&location.protocol!='file:';
const DEF=JSON.stringify(S),MODS=Object.keys(S);
let synced=false,unsubC=null,unsubP=null,timer=null,last={},photos=[],pvi=-1;
let gLast,gTok=null,gExp=0,gTimer=null,gClient=null;
const REDIR=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||!!navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
const GOOGLE_CLIENT_ID='918904043726-hho2k3cr47b7uoj728te7la4d86b2k2v.apps.googleusercontent.com';/* paste your Google OAuth client ID here (see setup steps) */
const note=t=>{const n=$('sync');if(n)n.textContent=t};
const fbErr=x=>({
 'auth/email-already-in-use':'That email already has an account. Try logging in.',
 'auth/invalid-credential':'Email or password is incorrect.',
 'auth/wrong-password':'Email or password is incorrect.',
 'auth/user-not-found':'Email or password is incorrect.',
 'auth/invalid-email':'Enter a valid email address.',
 'auth/weak-password':'Password must be at least 6 characters.',
 'auth/network-request-failed':'No internet connection. Try again when you are online.',
 'auth/too-many-requests':'Too many attempts. Wait a little and try again.',
 'auth/configuration-not-found':'Firebase Authentication is not set up yet. In the Firebase console open Build > Authentication, click Get started, then enable Email/Password.',
 'auth/operation-not-allowed':'Email/Password sign-in is not turned on in the Firebase console yet.',
 'permission-denied':'The Firestore rules are blocking this. Check the rules in the Firebase console.'
}[x&&x.code]||'Something went wrong ('+((x&&(x.code||x.message))||'unknown')+').');

function resetS(){const f=JSON.parse(DEF);Object.keys(f).forEach(k=>S[k]=f[k])}
function loadGuest(){let d;try{d=JSON.parse(st.g('cos_d2_guest'))}catch(e){}d=d||{};const f=JSON.parse(DEF);Object.keys(f).forEach(k=>S[k]=d[k]||f[k])}
function setHi(){$('hit').textContent='Welcome, '+N.A+' & '+N.B+'.'}
function typing(){const a=document.activeElement;return !!(a&&pane.contains(a)&&a.matches('input[type=text],input[type=number],input[type=date],textarea'))}

/* demo mode (not logged in) saves on this device; logged in saves to Firestore */
function save(){
 if(!me){st.s('cos_d2_guest',JSON.stringify(S));return}
 if(!synced)return;
 st.s('cos_seen',JSON.stringify(S.cal.items));
 if(GOOGLE_CLIENT_ID&&st.g('cos_g')=='1'){const c=JSON.stringify(S.cal.items);if(c!==gLast){gLast=c;clearTimeout(gTimer);gTimer=setTimeout(()=>gSync(false),1500)}}
 clearTimeout(timer);timer=setTimeout(push,400)}
function push(){
 const patch={};
 MODS.forEach(k=>{const v=JSON.stringify(S[k]);if(v!==last[k])patch['m_'+k]=v});
 const f=Object.keys(patch);if(!f.length||!me)return;
 f.forEach(x=>last[x.slice(2)]=patch[x]);
 FB.patchCouple(me,patch).catch(x=>{f.forEach(y=>delete last[y.slice(2)]);note(fbErr(x))})}

function onCouple(r){
 if(r.err){note(fbErr(r.err));return}
 if(!r.exists){if(r.fromCache)return;synced=true;push();note('Synced. You both see the same dashboard.');return}
 const d=r.data;let changed=false;const prevCal=!synced?st.g('cos_seen'):JSON.stringify(S.cal.items);
 if(d.na&&d.nb&&(N.A!=d.na||N.B!=d.nb)){N.A=d.na;N.B=d.nb;changed=true}
 MODS.forEach(k=>{const v=d['m_'+k];if(typeof v=='string'&&v!==last[k]){try{S[k]=JSON.parse(v);last[k]=v;changed=true}catch(e){}}});
 const first=!synced;synced=true;
 {let msg='';try{msg=prevCal?calDiff(JSON.parse(prevCal),S.cal.items):''}catch(e){}if(msg){toast('Calendar updated. '+msg);if('Notification' in window&&Notification.permission=='granted'){try{new Notification('Couple OS',{body:msg,icon:'android-chrome-192x192.png'})}catch(e){}}}}
 st.s('cos_seen',JSON.stringify(S.cal.items));
 note(r.fromCache?'Offline. Changes will sync when you reconnect.':'Synced. You both see the same dashboard.');
 setHi();
 if(first){push();render()}else if(changed&&!typing())render()}

function enter(u){
 me=u.uid;synced=false;last={};resetS();st.s('cos_in','1');
 document.body.classList.add('in');$('authb').textContent='Log out';$('nameb').hidden=false;setHi();note('Connecting…');
 unsubC&&unsubC();unsubP&&unsubP();
 unsubC=FB.watchCouple(me,onCouple);
 unsubP=FB.watchPhotos(me,(list,err)=>{if(err){note(fbErr(err));return}photos=list;drawGal()});
 render()}
function leave(){
 unsubC&&unsubC();unsubP&&unsubP();unsubC=unsubP=null;clearTimeout(timer);
 me=null;synced=false;photos=[];last={};st.s('cos_in','');
 loadGuest();N.A='Partner A';N.B='Partner B';
 document.body.classList.remove('in');$('authb').textContent='Log in';$('nameb').hidden=true;render()}

/* ---- album: a small thumbnail plus a full picture, both saved in Firestore ---- */
function shrink(file,max,q){return new Promise((res,rej)=>{
 const img=new Image(),u=URL.createObjectURL(file);
 img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',q))};
 img.onerror=()=>{URL.revokeObjectURL(u);rej()};img.src=u})}
function drawGal(){
 const g=$('gal');if(!g||cur!='alb')return;
 const of=p=>p.a||'Our photos';
 if(curAlb==null){
  g.innerHTML=albNames().reverse().map(n=>{const L=photos.filter(p=>of(p)==n);return `<button class="ph al" data-al="${esc(n)}" aria-label="Open album ${esc(n)}">${L[0]?`<img src="${L[0].th}" alt="">`:''}<span class="cap" style="opacity:1">${esc(n)} · ${L.length}</span></button>`}).join('');return}
 const L=photos.map((p,i)=>[p,i]).filter(([p])=>of(p)==curAlb&&(!favOnly||p.f));
 g.innerHTML=L.map(([p,i])=>`<button class="ph" data-ph="${i}" aria-label="Open photo${p.c?': '+esc(p.c):''}"><img src="${p.th}" alt="${esc(p.c||'Our photo')}" loading="lazy">${p.f?'<span class="fv">Favorite</span>':''}${p.c?`<span class="cap">${esc(p.c)}</span>`:''}</button>`).join('')||`<p class="empty" style="grid-column:1/-1">${favOnly?'No favorites yet.':'No photos in this album yet.'}</p>`+(curAlb!='Our photos'&&!photos.some(p=>of(p)==curAlb)?'<button class="btn alt" data-da="1" style="grid-column:1/-1;justify-self:start">Delete this empty album</button>':'')}
async function addPhotos(files){
 if(!me)return;
 const msg=()=>$('albmsg');let ok=0,bad=0;
 for(const f of files){
  try{
   let full=await shrink(f,1100,.72);if(full.length>900000)full=await shrink(f,800,.6);
   if(full.length>950000)throw 0;
   const th=await shrink(f,320,.7),id=Date.now()+'-'+Math.random().toString(36).slice(2,7);
   FB.putPhoto(me,id,{t:new Date().toISOString(),c:'',a:curAlb||'Our photos',th},full).catch(x=>{if(msg())msg().textContent='Could not save a photo: '+fbErr(x)});
   ok++}catch(e){bad++}
  if(msg())msg().textContent='Adding… '+(ok+bad)+' of '+files.length}
 if(msg()&&bad)msg().textContent=bad+' photo(s) could not be added. Try JPG, PNG or WebP.';
 else if(msg())msg().textContent=''}
const pv=$('pv');
async function openPv(i){
 const p=photos[i];if(!p)return;pvi=i;const im=$('pvi');
 im.src=p.th;im.alt=p.c||'Our photo';$('pvl').href=p.th;$('pva').innerHTML=albNames().map(n=>`<option ${n==(p.a||'Our photos')?'selected':''}>${esc(n)}</option>`).join('');$('pvf').textContent=p.f?'Remove favorite':'Favorite';$('pvd').textContent='Added '+fmtT(p.t);$('pvt').value=p.c||'';pv.showModal();
 try{const d=await FB.getFull(me,p.id);if(d&&pvi==i&&pv.open){im.src=d;$('pvl').href=d}}catch(e){}}
function savePv(){const p=photos[pvi];if(!p)return;const c=$('pvt').value.trim();const a=$('pva').value;if(a!=(p.a||'Our photos')){p.a=a;FB.patchPhoto(me,p.id,{a}).catch(x=>note(fbErr(x)))}p.c=c;FB.setCaption(me,p.id,c).catch(x=>note(fbErr(x)));pv.close();drawGal()}
$('pvs').onclick=savePv;
$('pvt').onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();savePv()}};
$('pvf').onclick=()=>{const p=photos[pvi];if(!p)return;p.f=!p.f;FB.patchPhoto(me,p.id,{f:p.f}).catch(x=>note(fbErr(x)));pv.close();drawGal()};
$('pvc').onclick=()=>pv.close();
$('pvx').onclick=()=>{const p=photos[pvi];if(!p||!confirm('Delete this photo?'))return;FB.delPhoto(me,p.id).catch(x=>note(fbErr(x)));pv.close()};

/* ---- account dialog ---- */
function setMode(m){mode=m;dlg.dataset.m=m;er.textContent='';$('dh').textContent={up:'Create your account',in:'Welcome back',nm:'Edit your names'}[m];
 dlg.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m==m));
 $('pw').autocomplete=m=='up'?'new-password':'current-password';
 if(m=='nm'){$('n1').value=N.A;$('n2').value=N.B}}
function openD(m){setMode(m);dlg.showModal()}
$('authb').onclick=()=>me?FB.signOut():openD('in');
$('signb').onclick=()=>openD('up');
$('nameb').onclick=()=>openD('nm');
$('cls').onclick=()=>dlg.close();
dlg.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
$('af').onsubmit=async e=>{e.preventDefault();
 const a=$('n1').value.trim(),b=$('n2').value.trim(),go=$('af').querySelector('.btn');
 if(mode!='in'&&(!a||!b))return er.textContent='Please enter both partners’ names.';
 if(mode=='nm'){N.A=a;N.B=b;setHi();render();FB.patchCouple(me,{na:a,nb:b}).catch(x=>note(fbErr(x)));dlg.close();return}
 if(!cloud)return er.textContent=location.protocol=='file:'?'Logging in needs a web address. Open this through Laragon (http://localhost/couple-os/) or Firebase Hosting instead of double-clicking the file.':'Cloud sync is not available.';
 const em=$('em2').value.trim().toLowerCase(),pw=$('pw').value;
 if(!/^\S+@\S+\.\S+$/.test(em))return er.textContent='Enter a valid email address.';
 if(pw.length<6)return er.textContent='Password must be at least 6 characters.';
 go.disabled=true;er.textContent='';
 try{
  if(mode=='up'){const c=await FB.signUp(em,pw);await FB.patchCouple(c.user.uid,{na:a,nb:b})}
  else await FB.signIn(em,pw);
 }catch(x){go.disabled=false;return er.textContent=fbErr(x)}
 go.disabled=false;dlg.close();$('af').reset();window.scrollTo(0,0)};

ready=true;loadGuest();
if(cloud&&st.g('cos_in')=='1'){document.body.classList.add('in');$('authb').textContent='Log out';$('nameb').hidden=false}
render();
if(cloud){try{FB.init();FB.onAuth(u=>u?enter(u):leave())}catch(e){note('Could not start the cloud connection.')}}

/* ---- reminders: fire once when an event's time arrives (page or installed app must be open) ---- */
function toast(msg){const b=document.getElementById('toast');b.textContent=msg;b.hidden=false;clearTimeout(b._t);b._t=setTimeout(()=>b.hidden=true,20000)}
function checkAlerts(){
 if(!S.cal||!S.cal.items)return;
 const now=new Date(),tk=iso(now),mins=now.getHours()*60+now.getMinutes();let done={};
 try{done=JSON.parse(st.g('cos_notified')||'{}')}catch(e){}
 S.cal.items.forEach(x=>{
  if(!occ(x,tk))return;
  const [H,M]=(x[3]||'08:00').split(':').map(Number),at=H*60+M,id=tk+'|'+x[0]+'|'+x[1]+'|'+(x[3]||'');
  if(done[id]||mins<at||(x[3]&&mins-at>180))return;
  done[id]=1;const msg=x[0]+(x[3]?' at '+fmtTm(x[3]):' today');
  toast('Reminder: '+msg);
  if('Notification' in window&&Notification.permission=='granted'&&st.g('cos_push')!='1'){try{new Notification('Couple OS reminder',{body:msg,icon:'android-chrome-192x192.png'})}catch(e){}}
 });
 Object.keys(done).forEach(k=>{if(!k.startsWith(tk))delete done[k]});
 st.s('cos_notified',JSON.stringify(done))}
document.getElementById('toast').onclick=e=>{e.currentTarget.hidden=true};
setTimeout(checkAlerts,1500);setInterval(checkAlerts,20000);

function preAlerts(){
 if(!S.cal||!S.cal.items)return;
 const now=new Date(),tk=iso(now),t0=new Date(now.getFullYear(),now.getMonth(),now.getDate());let done={};
 if(now.getHours()<8)return;
 try{done=JSON.parse(st.g('cos_pre')||'{}')}catch(e){}
 S.cal.items.forEach(x=>{const n=Math.round((nx(x)-t0)/864e5),big=['Anniversary','Birthday','Trip'].includes(x[4]);
  if(!(n==1||(n==3&&big)))return;const id=tk+'|'+n+'|'+x[0];if(done[id])return;done[id]=1;
  const msg=(n==1?'Tomorrow: ':'3 days left: ')+x[0];toast(msg);
  if('Notification' in window&&Notification.permission=='granted'&&st.g('cos_push')!='1'){try{new Notification('Couple OS reminder',{body:msg,icon:'android-chrome-192x192.png'})}catch(e){}}});
 Object.keys(done).forEach(k=>{if(!k.startsWith(tk))delete done[k]});st.s('cos_pre',JSON.stringify(done))}
setTimeout(preAlerts,2000);setInterval(preAlerts,20000);

/* ---- push notifications that arrive even when the app is closed ---- */
// Paste your Web Push key here: Firebase console > Project settings > Cloud Messaging > Web Push certificates > Generate key pair
const VAPID_KEY='';
async function enablePush(){
 if(!('Notification' in window))return;
 const p=await Notification.requestPermission();
 if(p=='granted'){
  if(!me)note('Log in first, then turn on notifications.');
  else if(!cloud||!VAPID_KEY)note('Reminders are on while the app is open.');
  else{try{await FB.enablePush(me,VAPID_KEY,'sw.js');st.s('cos_push','1');note('Notifications are on for this device.')}catch(e){note('Could not turn on notifications: '+(e.message||e.code))}}}
 render()}

/* ---- add events to the phone's own calendar (.ics file); the phone then does the reminding ---- */
function icsFor(list){
 const z=n=>String(n).padStart(2,'0'),e2=t=>String(t).replace(/[\\;,]/g,'\\$&').replace(/\n/g,'\\n'),stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
 const al=(t,txt)=>'BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:'+txt+'\r\nTRIGGER:'+t+'\r\nEND:VALARM\r\n';
 const ev=list.map(x=>{
  const d=x[1].replace(/-/g,''),big=['Anniversary','Birthday','Trip'].includes(x[4]);
  let o='BEGIN:VEVENT\r\nUID:'+(x[1]+x[0]).replace(/[^a-z0-9]/gi,'')+'@couple-os\r\nDTSTAMP:'+stamp+'\r\nSUMMARY:'+e2(x[0])+'\r\n';
  if(x[3]){const [h,m]=x[3].split(':');o+='DTSTART:'+d+'T'+h+m+'00\r\nDURATION:PT1H\r\n'}else o+='DTSTART;VALUE=DATE:'+d+'\r\n';
  if(x[2])o+='RRULE:FREQ='+(x[2]==2?'YEARLY':'MONTHLY')+'\r\n';
  o+=al(x[3]?'PT0S':'PT8H',e2(x[0]))+al(x[3]?'-P1D':'-PT16H','Tomorrow: '+e2(x[0]));
  if(big)o+=al(x[3]?'-P3D':'-P2DT16H','3 days left: '+e2(x[0]));
  return o+'END:VEVENT\r\n'}).join('');
 return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Couple OS//EN\r\nCALSCALE:GREGORIAN\r\n'+ev+'END:VCALENDAR\r\n'}
function dlIcs(list,name){
 if(!list.length)return;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([icsFor(list)],{type:'text/calendar'}));a.download=name+'.ics';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}

/* ---- sync events straight into the person's Google Calendar (add, change and delete) ---- */
function gLoad(){return new Promise((res,rej)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return res();const t=document.createElement('script');t.src='https://accounts.google.com/gsi/client';t.onload=res;t.onerror=()=>rej(new Error('Could not load Google sign-in. Are you offline?'));document.head.appendChild(t)})}
async function gToken(interactive){
 if(gTok&&Date.now()<gExp-60000)return gTok;
 if(REDIR){
  if(!interactive)throw new Error('Tap "Sync Google Calendar" to reconnect.');
  location.href='https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:GOOGLE_CLIENT_ID,redirect_uri:location.origin,response_type:'token',scope:'https://www.googleapis.com/auth/calendar.events',include_granted_scopes:'true',state:'cosg'});
  return new Promise(()=>{})}
 if(!(window.google&&google.accounts&&google.accounts.oauth2))await gLoad();
 return new Promise((res,rej)=>{
  gClient=gClient||google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CLIENT_ID,scope:'https://www.googleapis.com/auth/calendar.events',callback:()=>{}});
  gClient.callback=r=>{if(r.error)return rej(new Error(r.error));if(!google.accounts.oauth2.hasGrantedAllScopes(r,'https://www.googleapis.com/auth/calendar.events'))return rej(new Error('Calendar permission was not granted. On the Google screen, tick the calendar permission box.'));gTok=r.access_token;gExp=Date.now()+r.expires_in*1000;res(gTok)};
  gClient.error_callback=e=>rej(new Error(e&&e.type=='popup_failed_to_open'?'The sign-in window was blocked. Allow pop-ups for this site in Safari settings, then tap Sync again.':'Sign-in was closed or not finished. Tap "Sync Google Calendar" to try again.'));
  gClient.requestAccessToken({prompt:interactive?'consent':''})})}
async function gApi(path,opt){
 const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/'+path,Object.assign({headers:{Authorization:'Bearer '+gTok,'Content-Type':'application/json'}},opt));
 if(r.status==204)return {};
 const j=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error((j.error&&j.error.message)||('Error '+r.status));e.status=r.status;throw e}
 return j}
const gid=x=>{const t=x[0]+'|'+x[1];let a=5381,b=0;for(const c of t){a=((a*33)^c.charCodeAt(0))>>>0;b=((b*31)+c.charCodeAt(0))>>>0}return 'cos'+a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0')};
function gBody(x){
 const big=['Anniversary','Birthday','Trip'].includes(x[4]),tz=Intl.DateTimeFormat().resolvedOptions().timeZone,p2=n=>String(n).padStart(2,'0');
 const b={id:gid(x),summary:x[0],description:x[4]||'',status:'confirmed',extendedProperties:{private:{cos:'1'}}};
 let ov;
 if(x[3]){const [h,m]=x[3].split(':').map(Number);b.start={dateTime:x[1]+'T'+x[3]+':00',timeZone:tz};b.end={dateTime:x[1]+'T'+(h<23?p2(h+1)+':'+p2(m):'23:59')+':00',timeZone:tz};ov=[0,1440].concat(big?[4320]:[])}
 else{const d=new Date(x[1]+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);b.start={date:x[1]};b.end={date:d.toISOString().slice(0,10)};ov=[960].concat(big?[3840]:[])}
 if(x[2])b.recurrence=['RRULE:FREQ='+(x[2]==2?'YEARLY':'MONTHLY')];
 b.reminders={useDefault:false,overrides:ov.map(minutes=>({method:'popup',minutes}))};
 return b}
async function gSync(interactive){
 if(!me||!synced){if(interactive)note('Log in and wait for your calendar to load, then try again.');return}
 if(!GOOGLE_CLIENT_ID){note('Google sync is not set up yet. Add the client ID in script.js.');return}
 try{
  await gToken(interactive);
  const want=new Map(S.cal.items.map(x=>[gid(x),x]));let have=[],pt;
  do{const j=await gApi('events?privateExtendedProperty=cos%3D1&maxResults=250&showDeleted=false'+(pt?'&pageToken='+pt:''));have=have.concat(j.items||[]);pt=j.nextPageToken}while(pt);
  const hv=new Set(have.map(e=>e.id));
  for(const e of have)if(!want.has(e.id))await gApi('events/'+e.id,{method:'DELETE'});
  for(const [id,x] of want){const b=JSON.stringify(gBody(x));
   if(hv.has(id))await gApi('events/'+id,{method:'PUT',body:b});
   else{try{await gApi('events',{method:'POST',body:b})}catch(e){if(e.status==409)await gApi('events/'+id,{method:'PUT',body:b});else throw e}}}
  st.s('cos_g','1');gLast=JSON.stringify(S.cal.items);note('Google Calendar is up to date.');toast('Google Calendar is connected and up to date.');
 }catch(e){const m=e.status==403?'Google blocked this. Make sure the Google Calendar API is enabled in Google Cloud, then try again. ('+(e.message||'')+')':(e.message||String(e));note('Google Calendar sync failed: '+m);if(interactive)toast('Google Calendar: '+m)}}

/* ---- what changed in the calendar since you last looked ---- */
function calDiff(a,b){
 const m=l=>new Map(l.map(x=>[x[0],JSON.stringify(x)])),A=m(a),B=m(b),add=[],del=[],chg=[];
 B.forEach((v,k)=>{if(!A.has(k))add.push(k);else if(A.get(k)!==v)chg.push(k)});
 A.forEach((v,k)=>{if(!B.has(k))del.push(k)});
 const p=(w,l)=>l.length?w+' '+l.slice(0,3).join(', ')+(l.length>3?' +'+(l.length-3):''):'';
 return [p('Added',add),p('Changed',chg),p('Removed',del)].filter(Boolean).join(' · ')}
/* reconnect Google Calendar on the first tap after opening the site (browsers only allow the sign-in check after a tap) */
if(GOOGLE_CLIENT_ID&&st.g('cos_g')=='1')document.addEventListener('pointerdown',()=>{gLast=undefined;gSync(false)},{once:true});

/* load Google sign-in early so the sign-in window opens straight from your tap (iPhone Safari needs this) */
if(GOOGLE_CLIENT_ID)gLoad().catch(()=>{});

/* coming back from Google's full-page sign-in (iPhone / Home Screen app): pick up the token from the address */
(function(){
 const h=new URLSearchParams(location.hash.slice(1));
 if(h.get('state')!='cosg')return;
 history.replaceState(null,'',location.pathname+location.search);
 if(h.get('access_token')&&(h.get('scope')||'').includes('calendar.events')){
  gTok=h.get('access_token');gExp=Date.now()+(+h.get('expires_in')||3600)*1000;st.s('cos_g','1');gLast=undefined}
 else setTimeout(()=>toast(h.get('access_token')?'Calendar permission was not granted. Tick the calendar box on the Google screen.':'Google sign-in did not finish ('+(h.get('error')||'cancelled')+').'),800)})();

/* save the app on the device so it opens with no internet */
if('serviceWorker' in navigator&&location.protocol!='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
