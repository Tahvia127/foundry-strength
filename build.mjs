/* Foundry — static build. Schedule and pricing come from data/. No dependencies. */
import { readFileSync, writeFileSync } from 'node:fs';
const site = JSON.parse(readFileSync('data/site.json','utf8'));
const cls  = JSON.parse(readFileSync('data/classes.json','utf8'));
const sch  = JSON.parse(readFileSync('data/schedule.json','utf8'));
const mem  = JSON.parse(readFileSync('data/memberships.json','utf8'));

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const telRaw = site.phone.replace(/[^\d+]/g,'');
const byId = Object.fromEntries(cls.types.map(t=>[t.id,t]));

/* fail loudly rather than render a session with no class */
const orphan = sch.week.flatMap(d=>d.sessions.filter(s=>!byId[s.c]).map(s=>`${d.day} ${s.t} -> ${s.c}`));
if (orphan.length) { console.error('  ! schedule references unknown class:', orphan.join(', ')); process.exit(1) }

const CLASSES = cls.types.map((t,i)=>`
      <article class="cls rv" style="--i:${i}">
        <img src="assets/img/${esc(t.image)}.webp" alt="${esc(t.name)}" loading="lazy" width="900" height="1050">
        <div class="cap">
          <p class="meta">${esc(t.level)} &middot; ${t.mins} min</p>
          <h3>${esc(t.name)}</h3>
          <p>${esc(t.blurb)}</p>
        </div>
      </article>`).join('');

const spotClass = n => n===0 ? 'full' : n<=3 ? 'low' : 'open';
const spotText  = n => n===0 ? 'Full' : n===1 ? '1 spot left' : `${n} spots`;

const WEEK = sch.week.map(d=>`
        <div class="day">
          <h4>${esc(d.day)}</h4>
          <ul>
            ${d.sessions.map(s=>{
              const t=byId[s.c];
              return `<li class="sess" data-c="${esc(s.c)}">
              <span class="tm">${esc(s.t)}</span>
              <span class="nm">${esc(t.name)}</span>
              <span class="co">${esc(s.coach)} &middot; ${t.mins} min</span>
              <span class="sp ${spotClass(s.spots)}">${spotText(s.spots)}</span>
            </li>`}).join('\n            ')}
          </ul>
          <p class="none" hidden>Nothing on</p>
        </div>`).join('');

const FILTERS = [{id:'',name:'All classes'},...cls.types].map((t,i)=>
  `<button class="fbtn" type="button" data-f="${esc(t.id||'')}" aria-pressed="${i===0}">${esc(t.name)}</button>`).join('');

const TIERS = mem.tiers.map(t=>`
      <article class="tier rv${t.featured?' f':''}" data-monthly="${t.monthly}"${t.oneOff?' data-oneoff="1"':''}>
        ${t.featured?'<span class="flag">Most members</span>':''}
        <h3>${esc(t.name)}</h3>
        <p class="pr">$<span class="amt">${t.monthly}</span></p>
        <p class="unit">${esc(t.unit||'per month')}</p>
        <p class="save"></p>
        <p class="nt">${esc(t.note)}</p>
        <ul>${t.includes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
        <a class="btn ${t.featured?'flame':''}" href="#visit">${t.oneOff?'Book a class':'Join'}</a>
      </article>`).join('');

const HOURS = site.hours.map(h=>`<p class="hrs"><span>${esc(h.days)}</span><span>${esc(h.time)}</span></p>`).join('');

const d = site.demo||{};
const DEMOBAR = d.show?`<div class="demo-bar" role="note"><p>${esc(d.text)}</p><span class="sep">&middot;</span>
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>`:'';
const DEMOFOOT = d.show?`<div class="demo-foot">${esc(d.text)}
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>`:'';

const JSONLD = JSON.stringify({'@context':'https://schema.org','@type':'ExerciseGym',
  name:`${site.name} ${site.tagline}`, description:site.intro, telephone:site.phone, email:site.email,
  address:{'@type':'PostalAddress',streetAddress:site.address.line1,addressLocality:site.city}});

const totalSessions = sch.week.reduce((n,d)=>n+d.sessions.length,0);

const SCRIPT = `<script>
document.getElementById('yr').textContent=new Date().getFullYear();
var nav=document.getElementById('nav');
addEventListener('scroll',function(){nav.classList.toggle('stuck',scrollY>12)},{passive:true});
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.05});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
}else{document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')})}

/* schedule filter */
var sessions=[].slice.call(document.querySelectorAll('.sess')),
    fbtns=document.querySelectorAll('.fbtn'), count=document.getElementById('schedCount');
function paintCount(){
  var vis=sessions.filter(function(s){return !s.hidden}).length;
  count.textContent = vis + (vis===1?' class':' classes') + ' this week';
  document.querySelectorAll('.day').forEach(function(day){
    var any=[].slice.call(day.querySelectorAll('.sess')).some(function(s){return !s.hidden});
    day.querySelector('.none').hidden = any;
  });
}
fbtns.forEach(function(b){ b.addEventListener('click',function(){
  fbtns.forEach(function(o){o.setAttribute('aria-pressed',String(o===b))});
  var f=b.dataset.f;
  sessions.forEach(function(s){ s.hidden = !!f && s.dataset.c!==f });
  paintCount();
})});
paintCount();

/* monthly / annual */
var DISC=${mem.annualDiscount}, tiers=document.querySelectorAll('.tier'),
    tbtns=document.querySelectorAll('.toggle button');
function price(annual){
  tiers.forEach(function(t){
    var base=+t.dataset.monthly, one=t.dataset.oneoff==='1';
    var v = (annual && !one) ? Math.round(base*(1-DISC)) : base;
    t.querySelector('.amt').textContent=v;
    var save=t.querySelector('.save');
    save.textContent = (annual && !one) ? 'Save $'+((base-v)*12)+' a year' : '';
  });
}
tbtns.forEach(function(b){ b.addEventListener('click',function(){
  tbtns.forEach(function(o){o.setAttribute('aria-pressed',String(o===b))});
  price(b.dataset.p==='annual');
})});
price(false);
</script>`;

const vars = {
  NAME:esc(site.name), TAGLINE:esc(site.tagline), CITY:esc(site.city), CAP:site.capacity,
  INTRO:esc(site.intro), INTRO_SHORT:esc(site.intro.split('. ')[0]+'.'),
  PHONE:esc(site.phone), PHONE_RAW:telRaw, EMAIL:esc(site.email),
  ADDR1:esc(site.address.line1), ADDR2:esc(site.address.line2),
  CLASSES, WEEK, FILTERS, TIERS, HOURS, TERMS:esc(mem.terms),
  N_SESSIONS: totalSessions, N_TYPES: cls.types.length,
  DEMOBAR, DEMOFOOT, SCRIPT, JSONLD
};
const out = readFileSync('src/index.template.html','utf8')
  .replace(/\{\{(\w+)\}\}/g,(m,k)=> k in vars ? vars[k] : (console.warn('  ! unknown token',k),m));
writeFileSync('index.html', out);
console.log('  built index.html');
console.log(`  ${totalSessions} sessions across ${sch.week.length} days, ${cls.types.length} class types, ${mem.tiers.length} tiers`);
