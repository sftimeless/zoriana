// Zoriana, the guide. On a first visit she asks who is exploring (general audience, educator or mission planner), sets the
// app up for them and offers a one-minute tour; after that she explains, in plain words and larger type, whatever on the
// map is clicked. The little astronaut is an original drawing made in code for this app.
// Written with AI coding assistance (Anthropic Claude Code) under human direction.

export const AVATAR=`<svg class="guide-face" viewBox="0 0 96 96" aria-hidden="true"><g><rect width="96" height="96" fill="#0c1428"/><g fill="#fff"><circle cx="16" cy="20" r=".9" opacity=".8"/><circle cx="30" cy="10" r=".7" opacity=".6"/><circle cx="82" cy="34" r=".8" opacity=".7"/><circle cx="10" cy="44" r=".6" opacity=".5"/><circle cx="64" cy="8" r=".6" opacity=".6"/></g><circle cx="76" cy="18" r="7.5" fill="#2f7fe0"/><path d="M70.6 15.6c2.6-1.9 5.8-1.5 8 .2M72 21.6c2.6 1.1 5.8.7 8-1" fill="none" stroke="#e8f1ff" stroke-width="1.5" stroke-linecap="round" opacity=".9"/><ellipse cx="48" cy="97" rx="64" ry="21" fill="#9a9aa2"/><ellipse cx="22" cy="86" rx="7" ry="2" fill="#7a7a82"/><ellipse cx="78" cy="89" rx="9" ry="2.4" fill="#7a7a82"/><rect x="28" y="46" width="40" height="30" rx="8" fill="#c9c9d1"/><path d="M27 86c0-17 7-27 21-27s21 10 21 27z" fill="#f4f4f8"/><path d="M29 70c-4 3-6 8-6 14M67 70c4 3 6 8 6 14" fill="none" stroke="#f4f4f8" stroke-width="7" stroke-linecap="round"/><rect x="39" y="65" width="18" height="11" rx="2.5" fill="#dcdce4"/><circle cx="44" cy="70.5" r="1.9" fill="#ff453a"/><circle cx="52" cy="70.5" r="1.9" fill="#0a84ff"/><circle cx="48" cy="37" r="19" fill="#f4f4f8"/><rect x="32.5" y="27" width="31" height="21" rx="10.5" fill="#d79a26"/><path d="M33.2 40.5h29.6c-1.3 4.4-5.4 7.5-10.3 7.5h-9c-4.900 0-9-3.100-10.300-7.500z" fill="#a8700f"/><path d="M37 34.5c2.6-3.6 7.6-5 12.6-4.2" fill="none" stroke="#fff3cf" stroke-width="2" stroke-linecap="round" opacity=".9"/><circle cx="56" cy="40" r="2.6" fill="#2f7fe0" opacity=".9"/></g><circle cx="48" cy="48" r="46" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1"/></svg>`;

export const AUDIENCES=[
 ['general','Explore the Moon','Discover fascinating places and their stories.','fullmoon','All set to explore the Moon.'],
 ['educator','Learn & Discover','Understand sunlight, shadows, and lunar science.','book','All set to learn and discover. Poles and grid are on.'],
 ['planner','Plan a Mission','Compare landing sites, dates, and conditions.','scope','All set to plan a mission. The numbers are showing.'],
];

// Latin words in lunar place names.
const TERMS={Mare:'sea',Oceanus:'ocean',Lacus:'lake',Sinus:'bay',Palus:'marsh',Mons:'mountain',Montes:'mountain range',Vallis:'valley',Rima:'narrow channel',Rimae:'channels',Rupes:'cliff',Dorsum:'ridge',Dorsa:'ridges',Catena:'chain of craters',Promontorium:'cape',Planitia:'plain'};
const WET=new Set(['Mare','Oceanus','Lacus','Sinus','Palus']);
const IAU=' Names on the Moon are approved by the International Astronomical Union, not chosen by the astronauts who went there.';
export function explainName(name,kind,diameterKm){
 const word=name.split(' ')[0],size=diameterKm>=10?Math.round(diameterKm):diameterKm;
 if(TERMS[word])return `${name}: “${word}” is Latin for ${TERMS[word]}.${WET.has(word)?' Early astronomers took the dark plains for water. They are really old lava plains, and there is no water in them.':''}${IAU}`;
 return `${name}: a ${String(kind||'feature').toLowerCase()} about ${size} km across. Craters are mostly named for scientists and explorers.${IAU}`;
}
export const EXPLAIN={
 shadow:'This blue patch is ground that never gets direct sunlight. It is called permanent shadow, and it is one of the coldest places known. Water ice may survive there, which is why new missions aim for the poles. The patches come from NASA’s maps.',
 sun:'The gold line points from this place toward the Sun. The number is how high the Sun sits above the horizon there, in degrees. It shows a direction, not a distance: the Sun is about 150 million km away.',
 earth:'The blue line points from this place toward Earth. The number is how high Earth sits above the horizon there, in degrees. It shows a direction, not a distance: Earth is about 384,000 km away.',
};

function tourFor(audience,api){
 const moon={text:'This is the Moon, built from NASA photographs. Drag to turn it. Scroll or pinch to zoom in.'};
 const names={text:'The names are Latin. “Mare” means sea: early astronomers took the dark plains for seas. The International Astronomical Union approves the names; the astronauts did not choose them. Click any name and I will tell you what it means.'};
 const lines={text:'Two lines leave the place. Gold points to the Sun and blue points to Earth. They show direction, not distance. The number is how high the Sun or Earth sits above the horizon there.'};
 const shadow={run:api.showSouthPole,text:'Now the south pole. The blue patches are ground that never gets sunlight. It is so cold there that water ice may survive, which is why new missions aim for the poles. Click a patch any time to ask me again.'};
 const time={target:'.timeline',text:'This bar is time. Drag it, or press play, to watch sunlight and shadow move across a month.'};
 const replay=extra=>({text:`Want the whole story? Watch Apollo 11 fly to the Moon and back, step by step.${extra}`,action:['Watch the replay',api.openReplay]});
 if(audience==='planner')return [
  moon,
  {run:()=>api.select('im4'),target:'.planner',text:'Open a site from the list, or right-click anywhere on the Moon to drop a pin. I have opened IM-4, a planned landing near the south pole.'},
  {target:'.metrics',text:'The card gives the Sun’s and Earth’s elevation, how far each clears the real terrain, and what is in the way. The lines on the map show their directions.'},
  {target:'#compare',text:'Compare puts sites and landing dates side by side. Shift-click two markers to compare them in two clicks.'},
  {target:'#rail-rank',text:'Rank orders every listed site for your date and stay. Ranking and comparison both export to CSV.'},
  {target:'.timeline',text:'Set the landing date and hour here, then drag the bar through the stay.'},
  {text:'One caution. This is geometry only: sunlight is not usable power, and Earth in view is not a working radio link. “How this is calculated” on any site card shows the method.'},
 ];
 const pick={run:()=>api.select('apollo11'),target:'.planner',text:'Pick a place from the list, or click a marker on the Moon. I have opened Apollo 11, where people first landed.'};
 if(audience==='educator')return [moon,names,pick,lines,shadow,time,
  {run:api.showGrid,target:'#grid',text:'For a class, Poles and grid is on. The red pole is north, the blue one south, and the yellow ring is the equator.'},
  {run:api.showLearn,text:'Under Learn there are short answers to the questions students ask. Each has a button that shows the answer on the Moon.'},
  replay(' Choose “Stop at each step” there to talk each stage through.')];
 return [moon,names,pick,lines,shadow,time,replay('')];
}

export function createGuide(api){
 const get=key=>{try{return localStorage.getItem(key);}catch{return null;}},put=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 let audience=get('zoriana-audience'),welcomed=get('zoriana-welcomed')==='1',steps=null,index=0,marked=null,opener=null;
 const welcome=document.createElement('section');welcome.className='guide-welcome';welcome.hidden=true;
 welcome.setAttribute('role','dialog');welcome.setAttribute('aria-modal','true');welcome.setAttribute('aria-labelledby','guide-title');
 welcome.innerHTML=`<div class="guide-card mat"><header class="guide-hello">${AVATAR}<div><h2 id="guide-title">Welcome to the Moon.</h2><p>I’m Zoriana, your lunar guide.</p></div></header><h3>How would you like to explore?</h3><div class="guide-choices">${AUDIENCES.map(([id,title,note,icon])=>`<button class="guide-choice" data-audience="${id}"><span class="guide-icon"><svg class="ic"><use href="#i-${icon}"/></svg></span><span class="guide-choice-text"><strong>${title}</strong><small>${note}</small></span><svg class="ic chev"><use href="#i-chevron"/></svg></button>`).join('')}</div><button class="guide-free" data-free>Explore freely <span aria-hidden="true">→</span></button><p class="guide-note">You can change your experience anytime.</p></div>`;
 const bubble=document.createElement('section');bubble.className='guide-bubble mat';bubble.hidden=true;bubble.setAttribute('aria-live','polite');
 bubble.innerHTML=`${AVATAR}<div class="guide-body"><p class="guide-text"></p><div class="guide-row"><span class="guide-count"></span><button data-back>Back</button><button data-act hidden></button><button class="primary" data-next>Next</button></div></div><button class="guide-close" data-close aria-label="Close the guide">×</button>`;
 document.body.append(welcome,bubble);
 const $=s=>bubble.querySelector(s);
 const mark=selector=>{marked?.classList.remove('guide-target');marked=selector?document.querySelector(selector):null;if(marked&&marked.offsetParent)marked.classList.add('guide-target');};
 const close=()=>{bubble.hidden=true;steps=null;mark(null);};
 let act=null;
 function show(text,{count='',back=false,next=null,action=null}={}){
  $('.guide-text').textContent=text;$('.guide-count').textContent=count;$('[data-back]').hidden=!back;
  $('[data-next]').hidden=!next;if(next)$('[data-next]').textContent=next;
  act=action?.[1]??null;$('[data-act]').hidden=!action;if(action)$('[data-act]').textContent=action[0];
  bubble.hidden=false;
 }
 function step(i){
  index=i;const s=steps[i];s.run?.();mark(s.target??null);
  show(s.text,{count:`${i+1} of ${steps.length}`,back:i>0,next:i<steps.length-1?'Next':'Done',action:s.action});
 }
 function startTour(){steps=tourFor(audience??'general',api);step(0);}
 // Leaving the welcome is remembered, so a returning visitor is not asked again; the list's guide row reopens it.
 function leave(){welcome.hidden=true;welcomed=true;put('zoriana-welcomed','1');opener?.focus?.();opener=null;}
 function choose(id){
  audience=id;put('zoriana-audience',id);leave();api.setup(id);steps=null;mark(null);
  show(`${AUDIENCES.find(a=>a[0]===id)[4]} Want a one-minute tour? You can find me again at the top of the list.`,{next:'Not now',action:['Start the tour',startTour]});
 }
 welcome.onclick=e=>{const id=e.target.closest('[data-audience]')?.dataset.audience;if(id)choose(id);else if(e.target.closest('[data-free]')||e.target===welcome)leave();};
 // Keyboard: Escape leaves, and Tab stays inside the panel while it is open.
 welcome.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();leave();return;}
  if(e.key!=='Tab')return;
  const stops=[...welcome.querySelectorAll('button')],first=stops[0],last=stops.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
 bubble.onclick=e=>{
  if(e.target.closest('[data-close]'))return close();
  if(e.target.closest('[data-act]')){const run=act;if(run===startTour)return startTour();close();return run?.();}
  if(e.target.closest('[data-back]')&&steps)return step(index-1);
  if(e.target.closest('[data-next]')){if(steps&&index<steps.length-1)step(index+1);else close();}
 };
 return {
  audience:()=>audience,
  firstVisit:()=>!audience&&!welcomed,
  welcome(){close();opener=document.activeElement;welcome.hidden=false;welcome.querySelector('[data-audience]').focus({preventScroll:true});},
  // A plain answer about something on the map. It does not interrupt a tour that is under way.
  say(text){if(!steps){mark(null);show(text,{next:'OK'});}},
  startTour,close,
  touring:()=>Boolean(steps),
 };
}
