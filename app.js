/* ================= DATA ================= */
const COLORS = ['#f9c5d1','#fbe7a1','#bfe8d2','#bcd9f5','#d6c9f2','#fbd0b0','#f2efe8'];
const TAGS = ['Ideas','To-do','Shopping','Feelings','Work','Goals'];
const STYLES = [['ruled','Ruled'],['plain','Plain'],['dots','Dots'],['grid','Grid']];
const FONTS = [['hand','Handwritten'],['serif','Serif'],['clean','Clean'],['type','Typewriter']];
const KEY = 'notes-app-v1';
const DEF = {settings:{sound:true}, notes:[], lock:{on:false, salt:'', hash:''}};
let S = load();
function load(){
  try{ const r = JSON.parse(localStorage.getItem(KEY));
    if (r) return {...JSON.parse(JSON.stringify(DEF)), ...r, settings:{...DEF.settings, ...(r.settings||{})}, lock:{...DEF.lock, ...(r.lock||{})}}; }catch(e){}
  return JSON.parse(JSON.stringify(DEF));
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){ toast('Could not save on this device'); } }
const ui = {screen: S.lock.on ? 'lock' : 'splash', filter:'all', id:null, unfold:false, draft:null, pin:{mode:'unlock', buf:'', first:'', then:''}, hiddenAt:0};

/* ================= HELPERS ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = id => S.notes.find(n => n.id === id);
const rot = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997; return ((h % 5) - 2) * 0.9; };
const shortDate = ts => new Date(ts).toLocaleDateString(undefined, {day:'numeric', month:'short'});
const fmt = ts => new Date(ts).toLocaleDateString(undefined, {day:'numeric', month:'short', year:'numeric'});
const fmtT = ts => new Date(ts).toLocaleString(undefined, {day:'numeric', month:'short', hour:'numeric', minute:'2-digit'});
const localVal = ts => { const d = new Date(ts - new Date(ts).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
const nType = n => n.type || 'text', nStyle = n => n.style || 'ruled', nFont = n => n.font || 'hand';
let ac;
function beep(f=520, d=.14, v=.03){ if (!S.settings.sound) return;
  try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime+d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+d); }catch(e){} }
function buzz(ms=14){ if (S.settings.sound && navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} }
let toastT;
function toast(m){ const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1900); }
function modal(title, msg, btns){
  const m = $('#modal');
  m.innerHTML = `<div class="box glass"><h3>${title}</h3><p>${msg}</p><div class="acts2">${btns.map((b, i) => `<button class="btn ${b.ghost ? 'ghost' : ''}" data-m="${i}">${b.label}</button>`).join('')}</div></div>`;
  m.style.display = 'flex';
  m.onclick = e => { const b = e.target.closest('[data-m]'); if (!b && e.target !== m) return; m.style.display = 'none'; if (b){ const fn = btns[+b.dataset.m].fn; if (fn) fn(); } };
}
const confirmBox = (t, msg, ok, cb) => modal(t, msg, [{label:'Cancel', ghost:true}, {label:ok, fn:cb}]);
const sv = (p, s=22, f='none') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${f}" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const HEART = 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z';
const ic = {
  back: sv('<path d="M15 5l-7 7 7 7"/>'), plus: sv('<path d="M12 5v14M5 12h14"/>', 20), arrow: sv('<path d="M5 12h14M13 6l6 6-6 6"/>', 18),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>', 20),
  heart: sv(`<path d="${HEART}"/>`, 24), heartS: (s=14) => sv(`<path d="${HEART}"/>`, s, 'currentColor'),
  pinS: (s=14) => sv('<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v6"/>', s, 'currentColor'),
  pin: sv('<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v6"/>', 24),
  bell: (s=18) => sv('<path d="M6 16v-5a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/>', s),
  share: sv('<circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>'),
  trash: sv('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>'),
  shuffle: sv('<path d="M4 7h3.5c3 0 4 2 5 5s2 5 5 5H20M4 17h3.5c1.4 0 2.4-.5 3.2-1.4M13 8.4C13.8 7.5 14.8 7 16.5 7H20M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5"/>', 18),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 20), tick: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 14), x: sv('<path d="M6 6l12 12M18 6L6 18"/>', 16),
  pen: sv('<path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16z"/>'), sound: sv('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7"/>'),
  lock: sv('<rect x="5" y="11" width="14" height="9" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/>'), lockL: sv('<rect x="5" y="11" width="14" height="9" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/>', 34),
  del: sv('<path d="M9 6h10a2 2 0 012 2v8a2 2 0 01-2 2H9l-6-6z"/><path d="M12 10l4 4M16 10l-4 4"/>', 24),
  chev: sv('<path d="M9 5l7 7-7 7"/>', 18)
};
const STK = {
  heart: s => sv(`<path d="${HEART}"/>`, s, 'currentColor'),
  star: s => sv('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>', s, 'currentColor'),
  moon: s => sv('<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>', s, 'currentColor'),
  flower: s => sv('<circle cx="12" cy="6" r="3"/><circle cx="18" cy="10.5" r="3"/><circle cx="15.7" cy="17.5" r="3"/><circle cx="8.3" cy="17.5" r="3"/><circle cx="6" cy="10.5" r="3"/><circle cx="12" cy="12" r="2.2" fill="#fff" stroke="none"/>', s, 'currentColor'),
  sun: s => sv('<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>', s),
  smile: s => sv('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c1 1.6 2.2 2.3 3.5 2.3s2.5-.7 3.5-2.3"/><circle cx="9.3" cy="10" r=".9" fill="currentColor"/><circle cx="14.7" cy="10" r=".9" fill="currentColor"/>', s)
};
const stk = (k, s=22) => k && STK[k] ? STK[k](s) : '';

/* ================= LAYOUT ================= */
function bar({back, title, gear}){
  const l = back ? `<button class="ib" data-act="go" data-v="${back}" aria-label="Back">${ic.back}</button>` : '';
  const r = gear ? `<button class="ib" data-act="go" data-v="settings" aria-label="Settings">${ic.gear}</button>` : '';
  return `<div class="bar"><div>${l}</div><div class="bt">${title || ''}</div><div class="r">${r}</div></div>`;
}
const listItems = n => (n.items || []);
function paperHTML(n){
  const pending = n.remind && !n.reminded;
  const body = nType(n) === 'list'
    ? `<ul class="pl">${listItems(n).slice(0, 6).map(it => `<li class="${it.d ? 'done' : ''}"><i>${it.d ? ic.tick : ''}</i><span>${esc(it.t)}</span></li>`).join('')}${listItems(n).length > 6 ? `<li><span style="opacity:.6">+${listItems(n).length - 6} more</span></li>` : ''}</ul>`
    : `<p class="pt">${esc(n.text)}</p>`;
  const done = nType(n) === 'list' ? `${listItems(n).filter(i => i.d).length}/${listItems(n).length}` : shortDate(n.ts);
  return `<button class="paper ps-${nStyle(n)} f-${nFont(n)}" style="--c:${n.color};--r:${rot(n.id)}deg" data-act="open" data-v="${n.id}"><i class="tape"></i>
    ${n.pin ? `<span class="pn">${ic.pinS(14)}</span>` : ''}${n.fav ? `<span class="fv">${ic.heartS(13)}</span>` : ''}
    ${body}${n.tag ? `<span class="tagp">${esc(n.tag)}</span>` : ''}${pending ? `<div class="rm">${ic.bell(12)}${fmtT(n.remind)}</div>` : ''}
    <div class="pf"><span>${done}</span>${stk(n.sticker, 20)}</div></button>`;
}
const sortNotes = () => [...S.notes].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.ts - a.ts);

/* ================= SCREENS ================= */
const SC = {
splash(){
  return {plain:true, head:'', foot:`<button class="btn" data-act="start">Tap to start ${ic.arrow}</button>`, body:`
  <div class="splash" data-act="start"><div class="spacer"></div>
    <svg viewBox="0 0 260 230" aria-hidden="true">
      <g class="fl2"><g transform="rotate(-15 92 118)"><rect x="42" y="46" width="112" height="136" rx="3" fill="rgba(0,0,0,.45)" transform="translate(3 5)"/><rect x="42" y="46" width="112" height="136" rx="3" fill="#bcd9f5"/><rect x="42" y="46" width="112" height="46" rx="3" fill="#fff" opacity=".18"/></g></g>
      <g class="fl3"><g transform="rotate(13 168 112)"><rect x="112" y="40" width="112" height="136" rx="3" fill="rgba(0,0,0,.45)" transform="translate(3 5)"/><rect x="112" y="40" width="112" height="136" rx="3" fill="#fbe7a1"/><rect x="112" y="40" width="112" height="46" rx="3" fill="#fff" opacity=".2"/></g></g>
      <g class="fl"><g transform="rotate(-3 130 122)"><rect x="76" y="56" width="112" height="142" rx="3" fill="rgba(0,0,0,.5)" transform="translate(3 6)"/><rect x="76" y="56" width="112" height="142" rx="3" fill="#f9c5d1"/><rect x="76" y="56" width="112" height="50" rx="3" fill="#fff" opacity=".22"/>
        <g stroke="#2d2a32" stroke-opacity=".09"><path d="M84 96h96M84 118h96M84 140h96M84 162h96M84 184h96"/></g>
        <g fill="none" stroke="#2d2a32" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M88 92q5-6 10 0t10 0t10 0t10 0t10 0"/><path d="M88 114q5-6 10 0t10 0t10 0t10 0"/><path d="M88 136q5-6 10 0t10 0"/></g>
        <path transform="translate(140 142) scale(2.3)" d="${HEART}" fill="#2d2a32" opacity=".78"/>
        <rect x="104" y="47" width="52" height="18" fill="rgba(255,255,255,.5)" transform="rotate(-3 130 56)"/></g></g>
    </svg>
    <h1 class="metal">NOTES</h1>
    <div class="spacer"></div><div class="spacer"></div></div>`};
},
wall(){
  const f = ui.filter, all = sortNotes();
  const tagsUsed = TAGS.filter(t => S.notes.some(n => n.tag === t));
  const remCount = S.notes.filter(n => n.remind && !n.reminded).length;
  const items = all.filter(n => f === 'all' ? true : f === 'fav' ? n.fav : f === 'rem' ? (n.remind && !n.reminded) : n.tag === f.slice(4));
  const chip = (k, l) => `<button class="chip ${f === k ? 'on' : ''}" data-act="filter" data-v="${k}">${l}</button>`;
  let content;
  if (!all.length) content = `<div class="empty center"><svg class="mini" viewBox="0 0 96 80" aria-hidden="true"><g transform="rotate(-12 34 44)"><rect x="12" y="14" width="42" height="52" rx="2" fill="#bcd9f5"/></g><g transform="rotate(11 62 40)"><rect x="40" y="10" width="42" height="52" rx="2" fill="#fbe7a1"/></g><g transform="rotate(-2 48 46)"><rect x="27" y="20" width="42" height="54" rx="2" fill="#f9c5d1"/><path d="M36 38q3-3 6 0t6 0t6 0M36 48q3-3 6 0t6 0" fill="none" stroke="#2d2a32" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/></g></svg><h2>No notes yet</h2><p>Write a note or a checklist on a colourful paper. It stays on this device.</p></div>`;
  else if (!items.length) content = `<div class="empty center"><p>Nothing here yet.</p></div>`;
  else content = `<div class="wall">${items.map(paperHTML).join('')}</div>`;
  return {head: bar({gear:true}), foot: `<button class="btn" data-act="write">${ic.plus} Write a note</button>`, body:`
  <h1 class="serif ttl">My Notes</h1>
  <p class="sub">${all.length ? `${all.length} note${all.length === 1 ? '' : 's'}${remCount ? ` · ${remCount} reminder${remCount === 1 ? '' : 's'}` : ''}` : 'Little papers, big thoughts.'}</p>
  ${all.length ? `<div class="tools"><div class="chips">${chip('all','All')}${chip('fav','Favourites')}${remCount ? chip('rem','Reminders') : ''}${tagsUsed.map(t => chip('tag:' + t, esc(t))).join('')}</div>
  <button class="vt" data-act="draw" aria-label="Open a random note">${ic.shuffle}</button></div>` : ''}
  ${content}`};
},
write(){
  const d = ui.draft, isList = d.type === 'list';
  const items = d.items.map((it, i) => `<div class="ci ${it.d ? 'done' : ''}"><button class="cb ${it.d ? 'on' : ''}" data-act="tickD" data-v="${i}" aria-label="Done">${it.d ? ic.tick : ''}</button><input class="cit" data-i="${i}" maxlength="80" placeholder="Item" value="${esc(it.t)}" autocomplete="off"><button class="cx" data-act="delItem" data-v="${i}" aria-label="Remove item">${ic.x}</button></div>`).join('');
  return {head: bar({back: d.id ? 'note' : 'wall', title: d.id ? 'Edit note' : 'New note'}), foot:`<button class="btn" data-act="saveNote">${d.id ? 'Save changes' : 'Save note'} ${ic.check}</button>`, body:`
  <div class="seg glass"><button class="${isList ? '' : 'on'}" data-act="setType" data-v="text">Note</button><button class="${isList ? 'on' : ''}" data-act="setType" data-v="list">Checklist</button></div>
  <div class="sheet ps-${d.style} f-${d.font}" id="pp" style="--c:${d.color}"><i class="tape"></i><span class="stkd" id="stkd">${stk(d.sticker, 30)}</span>
    ${isList ? `<div class="clist" id="clist">${items}<button class="addi" data-act="addItem">${ic.plus} Add item</button></div>`
             : `<textarea id="txt" maxlength="220" placeholder="Write your note…" aria-label="Your note">${esc(d.text)}</textarea>`}
    <div class="sig">${shortDate(d.ts || Date.now())}</div></div>
  <div class="cnt"><span>Only on this device</span><span id="cc">${isList ? d.items.length + '/20 items' : d.text.length + '/220'}</span></div>
  <div class="lbl">Paper</div>
  <div class="swcs">${COLORS.map(c => `<button class="swc" style="--c:${c}" data-act="pick" data-k="color" data-v="${c}" aria-label="Paper colour"></button>`).join('')}</div>
  <div class="lbl">Style</div>
  <div class="opts">${STYLES.map(([k, l]) => `<button class="chip stl" data-act="pick" data-k="style" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="lbl">Font</div>
  <div class="opts">${FONTS.map(([k, l]) => `<button class="chip fnt f-${k}" style="font-family:var(--fam)" data-act="pick" data-k="font" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="lbl">Sticker</div>
  <div class="stks"><button class="stk" data-act="pick" data-k="sticker" data-v="" aria-label="No sticker">${sv('<path d="M6 6l12 12M18 6L6 18"/>', 18)}</button>${Object.keys(STK).map(k => `<button class="stk" data-act="pick" data-k="sticker" data-v="${k}" aria-label="${k}">${stk(k, 22)}</button>`).join('')}</div>
  <div class="lbl">Category</div>
  <div class="opts"><button class="chip" data-act="pick" data-k="tag" data-v="">None</button>${TAGS.map(t => `<button class="chip" data-act="pick" data-k="tag" data-v="${t}">${t}</button>`).join('')}</div>
  <div class="lbl">Reminder</div>
  <div class="remrow glass">${ic.bell(20)}<input id="rem" type="datetime-local" value="${d.remind ? localVal(d.remind) : ''}" min="${localVal(Date.now())}" aria-label="Reminder time"><button class="cx" style="color:var(--ink)" data-act="clearRem" aria-label="Clear reminder">${ic.x}</button></div>
  <p class="note2">Reminders appear when the app is open on your phone.</p>
  <div style="height:8px"></div>`, after: syncWrite};
},
note(){
  const n = byId(ui.id);
  if (!n){ ui.screen = 'wall'; return SC.wall(); }
  const unf = ui.unfold; ui.unfold = false;
  const isList = nType(n) === 'list', its = listItems(n), done = its.filter(i => i.d).length;
  const pending = n.remind && !n.reminded;
  return {head: bar({back:'wall'}), foot:'', body:`
  <div style="height:14px"></div>
  <div class="sheet read ps-${nStyle(n)} f-${nFont(n)} ${unf ? 'unfold' : ''}" style="--c:${n.color}"><i class="tape"></i><span class="stkd">${stk(n.sticker, 34)}</span>
    ${isList ? `<div class="clist">${its.map((it, i) => `<button class="ci ${it.d ? 'done' : ''}" data-act="tick" data-v="${i}"><span class="cb ${it.d ? 'on' : ''}">${it.d ? ic.tick : ''}</span><span class="t">${esc(it.t)}</span></button>`).join('')}</div>`
      : `<p class="txt">${esc(n.text)}</p>`}
    <div class="sig">${shortDate(n.ts)}</div></div>
  ${isList ? `<p class="prog2">${done} of ${its.length} done</p>` : ''}
  <p class="meta">${[n.tag ? esc(n.tag) : '', 'Written ' + fmt(n.ts), pending ? '⏰ ' + fmtT(n.remind) : ''].filter(Boolean).join(' · ')}</p>
  <div class="spacer"></div>
  <div class="acts">
    <button class="act ${n.fav ? 'on' : ''}" data-act="fav"><span class="c">${ic.heart}</span>Favourite</button>
    <button class="act ${n.pin ? 'on' : ''}" data-act="togglePin"><span class="c">${ic.pin}</span>${n.pin ? 'Pinned' : 'Pin'}</button>
    <button class="act" data-act="edit"><span class="c">${ic.pen}</span>Edit</button>
    <button class="act" data-act="share"><span class="c">${ic.share}</span>Share</button>
    <button class="act" data-act="askDel"><span class="c">${ic.trash}</span>Delete</button>
  </div>`};
},
lock(){
  const p = ui.pin, titles = {unlock:'Enter your PIN', new1:'Create a PIN', new2:'Confirm your PIN', verify:'Enter current PIN'};
  const subs = {unlock:'Your notes are locked.', new1:'Choose 4 digits.', new2:'Enter the same 4 digits again.', verify:'Enter your PIN to continue.'};
  const key = v => `<button class="key" data-act="key" data-v="${v}">${v}</button>`;
  return {plain:true, head:'', foot:'', body:`
  <div class="lockw"><div class="spacer"></div><div class="li">${ic.lockL}</div>
    <h1 class="serif ttl" style="margin-top:16px">${titles[p.mode]}</h1><p class="sub">${subs[p.mode]}</p>
    <div class="dots" id="dots">${[0,1,2,3].map(i => `<i class="${i < p.buf.length ? 'on' : ''}"></i>`).join('')}</div>
    <div class="pad">${[1,2,3,4,5,6,7,8,9].map(key).join('')}<span class="key none"></span>${key(0)}<button class="key ghost" data-act="key" data-v="del" aria-label="Delete digit">${ic.del}</button></div>
    ${p.mode === 'unlock' ? `<button class="lk" data-act="forgot">Forgot PIN?</button>` : `<button class="lk" data-act="cancelPin">Cancel</button>`}
    <div class="spacer"></div></div>`};
},
settings(){
  const row = (i, t, s2, a, v, right) => `<button class="row glass" data-act="${a}" ${v !== undefined ? `data-v="${v}"` : ''}><span class="ri">${i}</span><span class="rt"><b>${t}</b>${s2 ? `<small>${s2}</small>` : ''}</span>${right === undefined ? `<span class="ch">${ic.chev}</span>` : right}</button>`;
  const on = S.lock.on;
  return {head: bar({back:'wall', title:'Settings'}), foot:'', body:`
  <div class="list">
    ${row(ic.lock, 'App Lock', on ? 'On · asks for your PIN when you open the app' : 'Ask for a PIN when you open the app', 'toggleLock', '', `<span class="sw ${on ? 'on' : ''}"></span>`)}
    ${on ? row(ic.lock, 'Change PIN', '', 'changePin') : ''}
    ${on ? row(ic.lock, 'Lock Now', '', 'lockNow') : ''}
    ${row(ic.sound, 'Sound &amp; Vibration', S.settings.sound ? 'On' : 'Off', 'sound', '', `<span class="sw ${S.settings.sound ? 'on' : ''}"></span>`)}
    ${S.notes.length ? row(ic.trash, 'Delete All Notes', `${S.notes.length} note${S.notes.length === 1 ? '' : 's'} on this device`, 'askClear') : ''}
  </div>
  <div class="spacer"></div>
  <p class="meta" style="margin-bottom:6px">Your notes stay on this device only.<br>The lock keeps casual eyes out. It does not encrypt your notes.</p>`};
}
};

/* ================= RENDER ================= */
function render(anim=true){
  const r = SC[ui.screen]();
  $('#head').innerHTML = r.head || '';
  const b = $('#body'); b.innerHTML = r.body || '';
  const f = $('#foot'); f.innerHTML = r.foot || ''; f.style.display = r.foot ? 'block' : 'none';
  $('#bg').classList.toggle('plain', !!r.plain);
  if (r.after) r.after();
  if (anim){ b.classList.remove('enter'); void b.offsetWidth; b.classList.add('enter'); b.scrollTop = 0; }
}
function go(s){ ui.screen = s; render(); }
/* keep the write screen's picked options highlighted without re-rendering (keeps the keyboard open) */
function syncWrite(){
  const d = ui.draft, p = $('#pp'); if (!p) return;
  p.className = `sheet ps-${d.style} f-${d.font}`; p.style.setProperty('--c', d.color);
  $('#stkd').innerHTML = stk(d.sticker, 30);
  document.querySelectorAll('[data-k]').forEach(el => el.classList.toggle('on', String(d[el.dataset.k] || '') === el.dataset.v));
}

/* ================= PIN LOCK ================= */
async function hashPin(pin, salt){
  try{ const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin)); return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch(e){ let h = 5381; for (const c of salt + ':' + pin) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'x' + h; }
}
function setPin(mode, then){ ui.pin = {mode, buf:'', first:'', then: then || ''}; ui.screen = 'lock'; render(false); }
async function pinDone(){
  const p = ui.pin, pin = p.buf;
  if (p.mode === 'unlock' || p.mode === 'verify'){
    const ok = (await hashPin(pin, S.lock.salt)) === S.lock.hash;
    if (!ok){ buzz(60); const d = $('#dots'); if (d){ d.classList.add('bad'); } setTimeout(() => { ui.pin.buf = ''; render(false); }, 420); return; }
    if (p.mode === 'unlock'){ ui.screen = 'wall'; render(); checkReminders(); return; }
    if (p.then === 'off'){ S.lock = {on:false, salt:'', hash:''}; save(); toast('App lock off'); go('settings'); return; }
    if (p.then === 'change'){ setPin('new1'); return; }
  } else if (p.mode === 'new1'){ ui.pin = {mode:'new2', buf:'', first:pin, then:''}; render(false); }
  else if (p.mode === 'new2'){
    if (pin !== p.first){ toast("PINs didn't match. Try again."); buzz(60); setPin('new1'); return; }
    const salt = Math.random().toString(36).slice(2); S.lock = {on:true, salt, hash: await hashPin(pin, salt)}; save(); toast('App lock on'); go('settings');
  }
}

/* ================= REMINDERS ================= */
let dueQueue = [];
function checkReminders(){
  if (ui.screen === 'lock' || $('#modal').style.display === 'flex') return;
  const now = Date.now();
  S.notes.filter(n => n.remind && !n.reminded && n.remind <= now).forEach(n => { n.reminded = true; dueQueue.push(n.id); });
  if (dueQueue.length) save();
  showDue();
}
function showDue(){
  if ($('#modal').style.display === 'flex') return;
  const id = dueQueue.shift(); if (!id) return;
  const n = byId(id); if (!n) return showDue();
  const preview = nType(n) === 'list' ? listItems(n).map(i => i.t).join(', ') : n.text;
  const msg = esc(preview.length > 110 ? preview.slice(0, 107) + '…' : preview);
  buzz([80, 60, 80]); beep(700, .25, .05);
  try{ if ('Notification' in window && Notification.permission === 'granted') new Notification('Reminder', {body: preview.slice(0, 120)}); }catch(e){}
  modal('Reminder ⏰', msg, [{label:'Dismiss', ghost:true, fn: () => { render(false); showDue(); }}, {label:'Open', fn: () => { ui.id = n.id; go('note'); setTimeout(showDue, 50); }}]);
}
setInterval(checkReminders, 15000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ ui.hiddenAt = Date.now(); return; }
  if (S.lock.on && ui.screen !== 'lock' && Date.now() - ui.hiddenAt > 15000){ setPin('unlock'); return; }
  checkReminders();
});

/* ================= ACTIONS ================= */
function openNote(id, unfold){ if (!byId(id)) return; ui.id = id; ui.unfold = !!unfold; buzz(unfold ? 20 : 8); if (unfold) beep(600, .2); go('note'); }
function newDraft(){ return {id:null, type:'text', text:'', items:[{t:'', d:false}], color:COLORS[Math.floor(Math.random() * COLORS.length)], sticker:'heart', style:'ruled', font:'hand', tag:'', remind:null}; }
const act = {
  start(){ go('wall'); },
  go(t){ go(t.dataset.v); },
  filter(t){ ui.filter = t.dataset.v; render(false); },
  write(){ ui.draft = newDraft(); go('write'); },
  setType(t){ ui.draft.type = t.dataset.v; render(false); },
  pick(t){ ui.draft[t.dataset.k] = t.dataset.v; syncWrite(); buzz(8); },
  clearRem(){ ui.draft.remind = null; $('#rem').value = ''; },
  addItem(){ if (ui.draft.items.length >= 20) return toast('20 items is the limit'); ui.draft.items.push({t:'', d:false}); render(false); const i = document.querySelectorAll('.cit'); if (i.length) i[i.length - 1].focus(); },
  delItem(t){ const d = ui.draft; d.items.splice(+t.dataset.v, 1); if (!d.items.length) d.items.push({t:'', d:false}); render(false); },
  tickD(t){ const it = ui.draft.items[+t.dataset.v]; it.d = !it.d; render(false); },
  edit(){
    const n = byId(ui.id); if (!n) return;
    ui.draft = {id:n.id, type:nType(n), text:n.text || '', items: listItems(n).length ? listItems(n).map(i => ({...i})) : [{t:'', d:false}], color:n.color, sticker:n.sticker || '', style:nStyle(n), font:nFont(n), tag:n.tag || '', remind: (n.remind && !n.reminded) ? n.remind : null, ts:n.ts};
    go('write');
  },
  saveNote(){
    const d = ui.draft, isList = d.type === 'list';
    const text = d.text.trim(), items = d.items.map(i => ({t:i.t.trim(), d:i.d})).filter(i => i.t);
    if (isList ? !items.length : !text){ toast(isList ? 'Add at least one item' : 'Write something first'); return; }
    const fields = {type:d.type, text: isList ? '' : text, items: isList ? items : [], color:d.color, sticker:d.sticker, style:d.style, font:d.font, tag:d.tag, remind:d.remind || null};
    if (fields.remind && 'Notification' in window && Notification.permission === 'default'){ try{ Notification.requestPermission(); }catch(e){} }
    if (d.id){
      const n = byId(d.id); if (!n) return go('wall');
      if (fields.remind !== (n.remind || null)) n.reminded = false;
      Object.assign(n, fields); save(); toast('Note updated'); ui.id = n.id; go('note');
    } else {
      S.notes.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts:Date.now(), fav:false, pin:false, reminded:false, ...fields});
      save(); buzz(20); beep(520); toast(fields.remind ? 'Saved · reminder set' : 'Note saved'); ui.filter = 'all'; go('wall');
    }
  },
  open(t){ openNote(t.dataset.v, false); },
  draw(){
    if (!S.notes.length) return;
    const pool = S.notes.filter(n => n.id !== ui.id); const list = pool.length ? pool : S.notes;
    openNote(list[Math.floor(Math.random() * list.length)].id, true);
  },
  tick(t){ const n = byId(ui.id); if (!n) return; const it = listItems(n)[+t.dataset.v]; if (!it) return; it.d = !it.d; save(); buzz(10); render(false); },
  fav(){ const n = byId(ui.id); if (!n) return; n.fav = !n.fav; save(); buzz(); render(false); },
  togglePin(){ const n = byId(ui.id); if (!n) return; n.pin = !n.pin; save(); buzz(); toast(n.pin ? 'Pinned to the top' : 'Unpinned'); render(false); },
  async share(){
    const n = byId(ui.id); if (!n) return;
    const text = nType(n) === 'list' ? listItems(n).map(i => `${i.d ? '☑' : '☐'} ${i.t}`).join('\n') : `“${n.text}”`;
    try{ if (navigator.share) await navigator.share({title:'Note', text}); else { await navigator.clipboard.writeText(text); toast('Copied'); } }catch(e){}
  },
  askDel(){ confirmBox('Delete this note?', "This can't be undone.", 'Delete', () => { S.notes = S.notes.filter(n => n.id !== ui.id); save(); toast('Note deleted'); go('wall'); }); },
  askClear(){ confirmBox('Delete all notes?', "Every note will be removed from this device. This can't be undone.", 'Delete All', () => { S.notes = []; save(); toast('All notes deleted'); go('wall'); }); },
  sound(){ S.settings.sound = !S.settings.sound; save(); render(false); if (S.settings.sound){ buzz(); beep(); } },
  toggleLock(){ if (S.lock.on) setPin('verify', 'off'); else setPin('new1'); },
  changePin(){ setPin('verify', 'change'); },
  lockNow(){ setPin('unlock'); },
  cancelPin(){ go('settings'); },
  forgot(){ confirmBox('Forgot your PIN?', 'The only way back in is to erase all notes and turn the lock off. Your notes will be deleted.', 'Erase & reset', () => { S.notes = []; S.lock = {on:false, salt:'', hash:''}; save(); go('splash'); }); },
  key(t){
    const p = ui.pin, v = t.dataset.v; buzz(6);
    if (v === 'del') p.buf = p.buf.slice(0, -1); else if (p.buf.length < 4) p.buf += v;
    document.querySelectorAll('#dots i').forEach((el, i) => el.classList.toggle('on', i < p.buf.length));
    if (p.buf.length === 4) setTimeout(pinDone, 140);
  }
};
document.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && act[t.dataset.act]) act[t.dataset.act](t); });
document.addEventListener('input', e => {
  const t = e.target, d = ui.draft;
  if (t.id === 'txt'){ d.text = t.value; $('#cc').textContent = t.value.length + '/220'; }
  else if (t.classList.contains('cit')) d.items[+t.dataset.i].t = t.value;
  else if (t.id === 'rem'){ const v = t.value ? new Date(t.value).getTime() : null; d.remind = v && !isNaN(v) ? v : null; }
});
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t.classList && t.classList.contains('cit')){
    if (e.key === 'Enter'){ e.preventDefault(); act.addItem(); }
    else if (e.key === 'Backspace' && !t.value && ui.draft.items.length > 1){ e.preventDefault(); ui.draft.items.splice(+t.dataset.i, 1); render(false); const i = document.querySelectorAll('.cit'); if (i.length) i[Math.max(0, +t.dataset.i - 1)].focus(); }
  } else if (ui.screen === 'lock' && /^[0-9]$/.test(e.key)) act.key({dataset:{v:e.key}});
  else if (ui.screen === 'lock' && e.key === 'Backspace') act.key({dataset:{v:'del'}});
});

render();

/* ================= OFFLINE (service worker) ================= */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

