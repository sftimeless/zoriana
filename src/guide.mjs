// Zoriana, the guide. On a first visit she asks who is exploring (general audience, educator or mission planner), sets the
// app up for them and offers a one-minute tour; after that she explains, in plain words and larger type, whatever on the
// map is clicked. The little astronaut is an original drawing made in code for this app.
// Written with AI coding assistance (Anthropic Claude Code) under human direction.

export const AVATAR=`<svg class="guide-face" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#1f2a44"/><path d="M9 46c1-9 7-13 15-13s14 4 15 13z" fill="#f2f2f7"/><rect x="19" y="35" width="10" height="6" rx="2" fill="#ff9f0a"/><circle cx="24" cy="20" r="13.5" fill="#f2f2f7"/><rect x="12.5" y="13" width="23" height="15" rx="7.5" fill="#0b1b3a"/><path d="M16 19c2-3.4 6-4.6 10-4" fill="none" stroke="#ffd60a" stroke-width="1.8" stroke-linecap="round"/><circle cx="30.5" cy="22.5" r="1.3" fill="#6db4ff"/><path d="M36.5 9.5v-5" stroke="#f2f2f7" stroke-width="1.6" stroke-linecap="round"/><circle cx="36.5" cy="4" r="1.6" fill="#ff453a"/></svg>`;

export const AUDIENCES=[
 ['general','Just curious','Plain words, big pictures, and the Apollo 11 story'],
 ['educator','Teaching or learning','Poles and grid on, short lessons, a replay you can pause'],
 ['planner','Planning a mission','All the numbers, terrain, comparison, ranking and export'],
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
 const read=()=>{try{return localStorage.getItem('zoriana-audience');}catch{return null;}};
 let audience=read(),steps=null,index=0,marked=null;
 const welcome=document.createElement('section');welcome.className='guide-welcome';welcome.hidden=true;welcome.setAttribute('aria-label','Welcome');
 welcome.innerHTML=`<div class="guide-card mat">${AVATAR}<h2>Hi, I’m Zoriana, your guide.</h2><p>Who is exploring the Moon today? I will set things up for you.</p><div class="guide-choices">${AUDIENCES.map(([id,title,note])=>`<button data-audience="${id}"><strong>${title}</strong><small>${note}</small></button>`).join('')}</div><button class="guide-skip" data-skip>Skip for now</button></div>`;
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
 function choose(id){
  audience=id;try{localStorage.setItem('zoriana-audience',id);}catch{}
  welcome.hidden=true;api.setup(id);steps=null;mark(null);
  const title=AUDIENCES.find(a=>a[0]===id)[1].toLowerCase();
  show(`All set for “${title}”. Want a one-minute tour? You can find me again at the top of the list.`,{next:'Not now',action:['Start the tour',startTour]});
 }
 welcome.onclick=e=>{const id=e.target.closest('[data-audience]')?.dataset.audience;if(id)choose(id);else if(e.target.closest('[data-skip]')||e.target===welcome)welcome.hidden=true;};
 bubble.onclick=e=>{
  if(e.target.closest('[data-close]'))return close();
  if(e.target.closest('[data-act]')){const run=act;if(run===startTour)return startTour();close();return run?.();}
  if(e.target.closest('[data-back]')&&steps)return step(index-1);
  if(e.target.closest('[data-next]')){if(steps&&index<steps.length-1)step(index+1);else close();}
 };
 return {
  audience:()=>audience,
  welcome(){close();welcome.hidden=false;welcome.querySelector('[data-audience]').focus();},
  // A plain answer about something on the map. It does not interrupt a tour that is under way.
  say(text){if(!steps){mark(null);show(text,{next:'OK'});}},
  startTour,close,
  touring:()=>Boolean(steps),
 };
}
