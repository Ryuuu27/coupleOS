const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const plus=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const ago=n=>new Date(Date.now()-n*864e5).toISOString();
const S={
 cal:{n:'Calendar',sub:'Add dates and events, remove them when done',items:[['Dinner at Marco’s',plus(1)],['Rent due',plus(2)],['Farmers market',plus(3)],['Call with parents',plus(4)]]},
 bud:{n:'Budget',sub:'Shared expenses · tap one for details',ex:[['Groceries',2450,'A',ago(6)],['Electric bill',3180,'B',ago(3)],['Movie night',850,'A',ago(1)]]},
 gro:{n:'Groceries',sub:'One list, two phones',items:[['Eggs',0],['Coffee beans',1],['Basil',0]]},
 trv:{n:'Bucket list',sub:'Trips and dates to plan',items:[['Weekend in Bohol',0],['Sunset picnic',0],['Cooking class',1]]},
 chr:{n:'Chores deck',sub:'Draw a card, we pick whose turn it is',deck:['Wash the dishes','Take out trash','Water the plants','Fix leaky tap','Clean the fridge'],i:0,who:'A'},
 dia:{n:'Diary',sub:'Write about your days together · tap one to read',entries:[['Our first entry','Write about today: what made you smile?',ago(0)]]},
 alb:{n:'Album',sub:'Our pictures together'},
 gol:{n:'Goals',sub:'Drag to update progress',g:[['Save for our trip',60],['Cook at home 3×/week',40],['Weekly walk together',75]]}
};
let N={A:'Partner A',B:'Partner B'};let ready=false;let cur='cal';let openEx=-1,openDx=-1,lastCur='cal';
const dock=document.getElementById('dock'),pane=document.getElementById('pane');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtD=s=>new Date(s+'T00:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
const fmtT=s=>new Date(s).toLocaleString(undefined,{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
const peso=n=>'₱'+(+n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtS=s=>new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
const delb=(i,t)=>`<button class="x" data-del="${i}" aria-label="Delete ${esc(t)}">×</button>`;
function list(k,del){return S[k].items.map((x,i)=>`<div class="row ${x[1]?'done':''}"><input type="checkbox" id="${k}${i}" data-k="${k}" data-i="${i}" ${x[1]?'checked':''}><label for="${k}${i}">${esc(x[0])}</label>${del?delb(i,x[0]):''}</div>`).join('')||'<p class="empty">Nothing here yet.</p>'}
function addf(ph){return `<div class="add"><input type="text" id="new" placeholder="${ph}" aria-label="${ph}"><button id="addb">Add</button></div>`}
function render(){
 dock.innerHTML=Object.keys(S).map(k=>`<button role="tab" aria-selected="${k==cur}" data-t="${k}">${S[k].n}</button>`).join('');
 const m=S[cur];let h=`<h3>${m.n}</h3><small>${m.sub}</small>`;
 if(cur=='bud'){
  const a=m.ex.filter(e=>e[2]=='A').reduce((s,e)=>s+e[1],0),b=m.ex.filter(e=>e[2]=='B').reduce((s,e)=>s+e[1],0),t=a+b||1;
  h+=m.ex.map((e,i)=>{const o=openEx==i;return `<button class="rowb" data-ex="${i}" aria-expanded="${o}"><span class="dot ${e[2]=='A'?'t':'c'}"></span><label>${esc(e[0])}</label><b>${peso(e[1])}</b><span class="chev" aria-hidden="true"></span></button>`+
   (o?`<div class="det"><div><span>Expense</span> · ${esc(e[0])}</div><div><span>Amount</span> · ${peso(e[1])}</div><div><span>Paid by</span> · ${esc(N[e[2]])}</div><div><span>Date added</span> · ${e[3]?fmtT(e[3]):'Not recorded'}</div></div>`:'')}).join('')+
  `<div class="split"><div class="t" style="width:${a/t*100}%"></div><div class="c" style="width:${b/t*100}%"></div></div>
  <small>Total this month · ${peso(a+b)}</small>
  <div class="add wrapit"><input type="text" id="new" placeholder="Expense name" aria-label="Expense name"><input type="number" id="amt" min="0" step="any" placeholder="₱" style="width:80px" aria-label="Amount"><select id="pb" aria-label="Paid by"><option value="A">${esc(N.A)}</option><option value="B">${esc(N.B)}</option></select><button id="addb">Add</button></div>`;
 }else if(cur=='cal'){
  const rows=m.items.map((x,i)=>[x,i]).sort((p,q)=>p[0][1].localeCompare(q[0][1]));
  h+=(rows.map(([x,i])=>`<div class="row"><span class="when">${esc(fmtD(x[1]))}</span><label style="cursor:default">${esc(x[0])}</label>${delb(i,x[0])}</div>`).join('')||'<p class="empty">No events yet. Add one below.</p>')+
  `<div class="add wrapit"><input type="date" id="dt" value="${plus(0)}" aria-label="Date"><input type="text" id="new" placeholder="Event name" aria-label="Event name"><button id="addb">Add</button></div>`;
 }else if(cur=='chr'){
  h+=`<div class="card"><small style="margin:0">Up next · ${esc(N[m.who])}</small><b>${esc(m.deck[m.i])}</b></div><div class="mini" style="flex-wrap:wrap"><button data-a="done">Done</button><button data-a="next">Draw random</button><button data-a="swap">Swap partner</button></div>`+addf('Add a chore')+`<small style="margin:10px 0 0">${m.deck.length} chores in the deck</small>`;
 }else if(cur=='dia'){
  const rows=m.entries.map((x,i)=>[x,i]).sort((p,q)=>q[0][2].localeCompare(p[0][2]));
  h+=`<div class="add" style="flex-direction:column"><input type="text" id="new" placeholder="Title (optional)" maxlength="80" aria-label="Title"><textarea id="dtxt" rows="4" placeholder="Dear diary…" aria-label="Diary entry"></textarea><button id="addb" style="padding:12px">Save entry</button></div><div style="margin-top:10px">`+
  (rows.map(([x,i])=>{const o=openDx==i;return `<button class="rowb" data-dx="${i}" aria-expanded="${o}"><label>${esc(x[0])}</label><span class="when2">${esc(fmtS(x[2]))}</span><span class="chev" aria-hidden="true"></span></button>`+
   (o?`<div class="det"><div class="entry">${esc(x[1])}</div><div><span>Written ${esc(fmtT(x[2]))}</span></div><button class="btn alt" style="justify-self:start;padding:8px 16px;font-size:14px" data-dd="${i}">Delete entry</button></div>`:'')}).join('')||'<p class="empty">No entries yet. Write the first one above.</p>')+'</div>';
 }else if(cur=='alb'){
  h+=me?`<div class="add"><input type="file" id="pick" class="sr" accept="image/*" multiple><label class="upl" for="pick">Add photos</label></div><p id="albmsg" class="empty" role="status" style="padding:8px 0 0"></p><div class="gal" id="gal"></div>`:`<p class="empty">Log in or create an account to keep your photos. They are saved to your shared cloud album.</p>`;
 }else if(cur=='gol'){
  h+=(m.g.map((g,i)=>`<div style="margin:12px 0"><div class="row" style="border:0;padding:0"><label>${esc(g[0])}</label><b>${g[1]}%</b><button class="x" data-gd="${i}" aria-label="Delete goal ${esc(g[0])}">×</button></div><input type="range" min="0" max="100" value="${g[1]}" data-g="${i}" aria-label="${esc(g[0])}"></div>`).join('')||'<p class="empty">No goals yet. Add one below.</p>')+addf('Add a goal');
 }else{h+=list(cur,cur=='gro')+addf(cur=='gro'?'Add an item':'Add an idea')}
 const keep=pane.scrollTop,same=lastCur==cur;lastCur=cur;
 pane.innerHTML=h;pane.scrollTop=same?keep:0;if(ready)save();
 if(cur=='alb'&&me)drawGal();
}
function draw(){const m=S.chr;let n=m.i;if(m.deck.length>1)while(n==m.i)n=Math.floor(Math.random()*m.deck.length);m.i=n;m.who=Math.random()<.5?'A':'B'}
function add(){
 if(cur=='dia'){const tx=document.getElementById('dtxt').value.trim();if(!tx){document.getElementById('dtxt').focus();return}
  S.dia.entries.push([document.getElementById('new').value.trim()||'Untitled',tx,new Date().toISOString()]);openDx=-1;render();return}
 const m=S[cur],nw=document.getElementById('new');if(!nw)return;const v=nw.value.trim();if(!v)return;
 if(cur=='bud'){const a=+document.getElementById('amt').value;if(!a)return;m.ex.push([v,a,document.getElementById('pb').value,new Date().toISOString()])}
 else if(cur=='cal'){const d=document.getElementById('dt').value;if(!d){document.getElementById('dt').focus();return}m.items.push([v,d])}
 else if(cur=='chr'){m.deck.push(v)}
 else if(cur=='gol'){m.g.push([v,0])}
 else m.items.push([v,0]);
 render()}
dock.onclick=e=>{const t=e.target.closest('[data-t]');if(t){cur=t.dataset.t;openEx=-1;openDx=-1;render()}};
pane.onclick=e=>{
 const m=S[cur],t=e.target;
 const ph=t.closest('[data-ph]');if(ph){openPv(+ph.dataset.ph);return}
 const dd=t.closest('[data-dd]');if(dd){if(confirm('Delete this diary entry?')){m.entries.splice(+dd.dataset.dd,1);openDx=-1;render()}return}
 const dx=t.closest('[data-dx]');if(dx){const i=+dx.dataset.dx;openDx=openDx==i?-1:i;render();return}
 const gd=t.closest('[data-gd]');if(gd){m.g.splice(+gd.dataset.gd,1);render();return}
 const del=t.closest('[data-del]');if(del){m.items.splice(+del.dataset.del,1);render();return}
 const ex=t.closest('[data-ex]');if(ex){const i=+ex.dataset.ex;openEx=openEx==i?-1:i;render();return}
 if(t.id=='addb'){add();return}
 const a=t.dataset.a;
 if(a){if(a=='swap')m.who=m.who=='A'?'B':'A';else draw();render()}
};
pane.onkeydown=e=>{if(e.key=='Enter'&&e.target.matches('#new,#amt,#dt')){e.preventDefault();add()}};
pane.onchange=e=>{if(e.target.id=='pick'){const fs=[...e.target.files];e.target.value='';addPhotos(fs);return}
 const d=e.target.dataset;if(d.k){S[d.k].items[d.i][1]=e.target.checked?1:0;e.target.closest('.row').classList.toggle('done',e.target.checked);save()}};
pane.oninput=e=>{if(e.target.dataset.g!==undefined){S.gol.g[e.target.dataset.g][1]=+e.target.value;e.target.previousElementSibling.querySelector('b').textContent=e.target.value+'%';save()}};
render();

/* ---- Firebase: data shared between the two of you ---- */
const $=id=>document.getElementById(id),dlg=$('dlg'),er=$('err');
let me=null,mode='in',mem={};
const st={g(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}},s(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}};
const cloud=!!window.FB&&location.protocol!='file:';
const DEF=JSON.stringify(S),MODS=Object.keys(S).filter(k=>k!='alb');
let synced=false,unsubC=null,unsubP=null,timer=null,last={},photos=[],pvi=-1;
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
 const d=r.data;let changed=false;
 if(d.na&&d.nb&&(N.A!=d.na||N.B!=d.nb)){N.A=d.na;N.B=d.nb;changed=true}
 MODS.forEach(k=>{const v=d['m_'+k];if(typeof v=='string'&&v!==last[k]){try{S[k]=JSON.parse(v);last[k]=v;changed=true}catch(e){}}});
 const first=!synced;synced=true;
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
 g.innerHTML=photos.map((p,i)=>`<button class="ph" data-ph="${i}" aria-label="Open photo${p.c?': '+esc(p.c):''}"><img src="${p.th}" alt="${esc(p.c||'Our photo')}" loading="lazy"></button>`).join('')||'<p class="empty" style="grid-column:1/-1">No photos yet. Add your first one.</p>'}
async function addPhotos(files){
 if(!me)return;
 const msg=()=>$('albmsg');let ok=0,bad=0;
 for(const f of files){
  try{
   let full=await shrink(f,1100,.72);if(full.length>900000)full=await shrink(f,800,.6);
   if(full.length>950000)throw 0;
   const th=await shrink(f,320,.7),id=Date.now()+'-'+Math.random().toString(36).slice(2,7);
   FB.putPhoto(me,id,{t:new Date().toISOString(),c:'',th},full).catch(x=>{if(msg())msg().textContent='Could not save a photo: '+fbErr(x)});
   ok++}catch(e){bad++}
  if(msg())msg().textContent='Adding… '+(ok+bad)+' of '+files.length}
 if(msg()&&bad)msg().textContent=bad+' photo(s) could not be added. Try JPG, PNG or WebP.';
 else if(msg())msg().textContent=''}
const pv=$('pv');
async function openPv(i){
 const p=photos[i];if(!p)return;pvi=i;const im=$('pvi');
 im.src=p.th;im.alt=p.c||'Our photo';$('pvd').textContent='Added '+fmtT(p.t);$('pvt').value=p.c||'';pv.showModal();
 try{const d=await FB.getFull(me,p.id);if(d&&pvi==i&&pv.open)im.src=d}catch(e){}}
function savePv(){const p=photos[pvi];if(!p)return;const c=$('pvt').value.trim();p.c=c;FB.setCaption(me,p.id,c).catch(x=>note(fbErr(x)));pv.close();drawGal()}
$('pvs').onclick=savePv;
$('pvt').onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();savePv()}};
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
