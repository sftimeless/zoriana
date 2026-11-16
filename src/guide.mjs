// Zoriana, the guide. On a first visit she asks how the visitor would like to explore and sets the app up to match. Each
// choice is a different guided experience on the same map and the same calculations: a tour that teaches how to read the
// map (Explore the Moon), two investigations where a prediction is tested by the app's own numbers (Learn & Discover), and
// a quiet seven-step walkthrough of the analysis tools with the astronaut out of the way (Plan a Mission). She also
// explains, in plain words and larger type, whatever on the map is clicked. The little astronaut is an original drawing made in code for this app.
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
// What a name means or whom it honors comes from the IAU's own note on each name (the sixth field of a feature), so every
// name gets its own answer. A lettered satellite crater ("Copernicus A") takes the name of the main crater beside it.
const TAIL=' Lunar names are approved by the International Astronomical Union; astronauts did not choose them.';
const plain=text=>text.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
// "Max Karl Ernst; German physicist; Nobel laureate (1858-1947)." for the crater Planck reads "Max Karl Ernst Planck, German physicist, …".
function person(note,base){
 const m=String(note).match(/^([^;]+);\s*(.+?)\.?$/);if(!m||!/\d/.test(note))return null;
 let who=m[1].trim();
 if(who.includes(',')){const [last,first]=who.split(',').map(x=>x.trim());who=`${first} ${last}`;}
 else if(base&&!plain(who).includes(plain(base)))who=`${who} ${base}`;
 return `${who}, ${m[2].replace(/;\s*/g,', ')}`;
}
function origin(note,base){
 if(!note)return '';
 const quoted=String(note).trim().match(/^["“](.*?)\.?["”]\.?$/);if(quoted)return ` The name means “${quoted[1]}.”`;
 const who=person(note,base);if(who)return ` It is named for ${who}.`;
 return /^Named/.test(note)?` ${note.replace(/\.?$/,'.')}`:` Where the name comes from: ${note.replace(/\.?$/,'.')}`;
}
export function explainName(feature,all=[]){
 const [name,,,diameterKm,kind,note]=feature,word=name.split(' ')[0],rest=name.split(' ').slice(1).join(' '),size=diameterKm>=10?Math.round(diameterKm):diameterKm;
 if(kind==='Astronaut-named feature')return `${name}: one of the few names the Apollo astronauts did choose, for a landmark near their landing site. The International Astronomical Union approved it later.`;
 if(kind==='Satellite crater'){
  const parent=all.find(f=>f[0]===name.replace(/ [A-Z]+$/,''));
  return `${name} is a smaller crater, about ${size} km across, beside ${parent?parent[0]:'a larger one'}, and takes its name.${parent?origin(parent[5],parent[0]).replace(' It is named',` ${parent[0]} is named`):''}${TAIL}`;
 }
 if(WET.has(word))return `${name}.${origin(note,rest)} “${word}” is Latin for ${TERMS[word]}: early astronomers took these dark lava plains for water.${TAIL}`;
 if(TERMS[word])return `${name}: “${word}” is Latin for ${TERMS[word]}.${origin(note,rest)}${TAIL}`;
 return `${name} is a ${String(kind||'feature').toLowerCase()} about ${size} km across.${origin(note,name)}${TAIL}`;
}
export const EXPLAIN={
 shadow:'This blue patch is ground that never gets direct sunlight: permanent shadow, from NASA’s maps. Blue does not mean water. These are among the coldest places known, and scientists think some may hold ice, which is one reason missions aim for the poles. The map shows the shadow, not what is in it.',
 sun:'The gold line points from this place toward the Sun. The number is how high the Sun sits above the horizon there, in degrees. It shows a direction, not a distance: the Sun is about 150 million km away.',
 earth:'The blue line points from this place toward Earth. The number is how high Earth sits above the horizon there, in degrees. It shows a direction, not a distance: Earth is about 384,000 km away.',
};

const hours=x=>String(Math.round(x*10)/10);

// Finders for things on the map, used by steps that point at them.
const markers=(...names)=>()=>[...document.querySelectorAll('.place-label')].filter(el=>!names.length||names.includes(el.querySelector('.name')?.textContent));
const nameLabels=(test=()=>true)=>()=>[...document.querySelectorAll('.feature-label:not(.grid-label)')].filter(el=>!el.hidden&&test(el.textContent));

// Explore the Moon: a mental model of the map. What the picture is, what its colors and marks mean, what the names are,
// what the two lines say, what the blue patches are, what the time bar does; then the visitor is on their own.
function exploreTour(api){return [
 {run:()=>{api.home();api.spin(true);},leave:()=>api.spin(false),text:'This is the Moon, built from NASA photographs and lit as the Sun lights it right now. Watch it spin once around. Then drag to turn it yourself; scroll or pinch to zoom.'},
 {run:api.home,target:nameLabels(t=>/^(Mare|Oceanus)/.test(t)),text:'How to read it. Gray is the ground. The darker plains, whose names are flashing, are old lava, not shadow. The side turned away from the Sun is dark: that is night.'},
 {target:markers(),text:'The round markers, flashing now, are places where a spacecraft landed or plans to land. Click one to open it.'},
 {run:()=>api.flyTo(8.35,30.83),target:nameLabels(t=>t==='Mare Tranquillitatis'),text:'The names are Latin. This plain is Mare Tranquillitatis, the Sea of Tranquility. “Mare” means sea: early astronomers took the dark plains for water. Click any name to learn what it means.'},
 {run:()=>api.select('apollo11'),target:['#site-card',markers('Apollo 11')],text:'Here is the landing site of Apollo 11, where people first walked on the Moon. The card on the left says, in one sentence, whether this place is in sunlight and whether it can see Earth at the time on the bar below.'},
 {run:()=>api.select('apollo11'),target:'.sky-chip',text:'Two lines leave the place, and their labels are flashing. Gold points toward the Sun, blue toward Earth. They show direction, not distance. The number is how high the Sun or Earth sits above the horizon there: 90° is straight overhead, 0° is on the horizon.'},
 {run:api.showSouthPole,target:'#psr',text:'Now the south pole. The blue patches are ground that never gets direct sunlight. Blue does not mean water: it marks permanent shadow, from NASA’s maps. Scientists think some of these cold places may hold ice. The flashing button on the right turns the patches on and off.'},
 {run:()=>{api.home();api.playTime(true);},leave:()=>api.playTime(false),target:'.timeline',text:'This bar is time. Look how it works: as it plays, night sweeps across the Moon. One day here lasts 29.5 Earth days. Drag the bar to pick any moment in the next month.'},
 {target:'.rail-apps',text:'Getting around. The buttons on the left: Search finds any place by name or coordinates. Compare and Rank line places up side by side. Learn has short answers to common questions. Watch has fly-bys and the Apollo 11 replay.'},
 {target:'.map-tools',text:'The buttons on the right change the map: its style, sunlight, permanent shadow, poles and grid, and map layers. Below them: drop a pin anywhere, see the whole Moon, and the compass, which puts north back at the top.'},
 {text:'Your turn. Open any marker, then click a name, a line’s label or a blue patch to learn what it is. The guide is always under Guide in the sidebar.',target:'#rail-guide',actions:[['Watch Apollo 11',api.openReplay]]},
];}

// Learn & Discover: a question, a prediction, a test with the app's own calculation, one input changed, an explanation.
// Every number quoted is read back from the comparison the app has just computed; none is written here.
function investigation(api,kind){
 const sun=kind==='sun',ids=sun?['shackleton','bluemoon1']:['apollo11','shackleton'],[a,b]=api.names(ids),key=sun?'sun':'earth',what=sun?'in sunlight':'able to see Earth';
 const differ=(x,y,total)=>Math.abs(x-y)>=total*.1;
 const line=r=>`${r.rows[0].name} was ${what} for ${hours(r.rows[0][key])} of ${r.total} hours. ${r.rows[1].name}: ${hours(r.rows[1][key])} of ${r.total}.`;
 const failed='The answer did not come back. Check the connection, then choose Start over.';
 return [
  {run:()=>{api.beginCompare();api.moveDate(0);sun?api.showSouthPole():api.flyTo(-42,18,3.3);},target:markers(a,b),
   text:sun?`Let’s try an experiment. ${a} and ${b} are both near the Moon’s south pole, only about ${Math.round(api.distanceKm(ids[0],ids[1]))} km apart. Over a ${api.stayWords()} stay starting ${api.dateLabel(0)}, do you think they get about the same amount of sunlight? Both are flashing on the map.`
          :`Let’s try an experiment. ${a} is near the middle of the side of the Moon that faces Earth. ${b} is at the south pole. Over a ${api.stayWords()} stay starting ${api.dateLabel(0)}, could one of them see Earth while the other cannot? Both are flashing on the map.`,
   choices:sun?['About the same','Very different']:['Yes, it could','No, both see Earth']},
  {busy:'Working it out with real NASA terrain and the real positions of the Sun and Earth…',
   leave:()=>api.playTime(false),target:['#comparison','.sky-chip'],
   work:async m=>{api.moveDate(0);m.first=await api.compare(ids,0);if(!m.first)return failed;api.select('shackleton');api.playTime(true);
    const r=m.first,d=differ(r.rows[0][key],r.rows[1][key],r.total);
    const right=sun?(m.choice0===1)===d:(m.choice0===0)===d;
    return `Here is the answer for the stay starting ${r.when}. ${line(r)} ${d?`That is ${hours(Math.abs(r.rows[0][key]-r.rows[1][key]))} hours apart.`:'So for this stay they come out about the same.'} ${right?'You guessed right.':'Not what you guessed, and that is how experiments teach.'} Now watch ${api.names(['shackleton'])[0]} as the clock runs: a solid ${sun?'gold':'blue'} line means ${sun?'sunlit':'Earth is in view'}, a dashed one means hidden.`;}},
  {target:'.timeline',text:`Now let’s change one thing: the date, on the bar below. Suppose they land 14 days later, about half a lunar day on. Do you think the answer stays the same?`,choices:['It stays the same','It changes']},
  {busy:'Working both places out again, 14 days later…',
   leave:()=>api.playTime(false),target:['#comparison','.sky-chip','.timeline'],
   work:async m=>{api.moveDate(14);m.second=await api.compare(ids,0);if(!m.second||!m.first)return failed;api.select('shackleton');api.playTime(true);
    const r=m.second,f=m.first,changed=differ(r.rows[0][key],f.rows[0][key],r.total)||differ(r.rows[1][key],f.rows[1][key],r.total);
    return `Starting ${r.when}: ${line(r)} Last time it was ${hours(f.rows[0][key])} and ${hours(f.rows[1][key])} hours. ${changed?'So the answer changed with the date.':'So for these two dates the answer stayed about the same.'} ${(m.choice2===1)===changed?'You guessed right.':'Not what you guessed.'} ${api.phone()?'':'All four results are in the comparison panel.'} The Moon is now lit as it will be on that date, and the clock is running again.`;}},
  {target:'.sky-chip',text:sun?'Why? At the poles the Sun never climbs more than about 1.5° above the horizon, and it circles the whole sky once every 29.5 days. A ridge or crater rim a few kilometers away can hide it for days. So the ground around a place, and the date, decide how much sunlight it gets. How close two places are matters much less.'
           :'Why? The Moon always keeps the same face toward Earth, so from the middle of the near side Earth never sets. At the poles Earth sits right on the horizon. The Moon rocks slightly as it orbits, so there Earth dips behind the hills and comes back over the course of a month.'},
  {text:`One caution. This is geometry: it tells us when ${sun?'sunlight reaches the ground, not how much power a lander would get':'Earth is above the hills, not whether a radio link would work'}. It also says nothing about whether a place is safe to land on. Want more? Show the numbers on any place’s card, or read how it is worked out.`,
   actions:[['Show the numbers',api.showNumbers],['How it is worked out',api.openMethod]]},
 ];
}

// Plan a Mission: the analysis tools in the order a planner uses them. No astronaut, no lessons.
function planWalk(api){return [
 {run:()=>{if(!api.selected())api.select('im4');},target:'.planner',text:'1 · Site. Pick a site from the list, search coordinates, or right-click the Moon to drop a pin. (IM-4 opens if nothing was selected.)'},
 {target:['.timeline','#duration'],text:'2 · Date and stay. Set the landing date and hour in the bar below, in UTC. Set the surface stay, 24 h to 7 d, on the site’s card.'},
 {run:api.showNumbers,target:['#lunar','.stay-row.sun'],text:'3 · Sunlight. The card totals sunlit hours for the stay and lists each interruption. The 30-day chart scores every landing day; the gold band on the time bar shows the same windows.'},
 {target:['.metrics','.stay-row.earth'],text:'4 · Earth in view. Counted the same way, in blue. “Above terrain” is the margin to the real skyline, and the ± on each rise and set time is how far it moves if the skyline is 0.1° higher or lower.'},
 {target:['#compare','#rail-compare','#rail-rank'],text:'5 · Alternatives. Compare adds this site and date to the comparison. Add another site, or use Delay on a card to shift the date. Shift-clicking a marker adds it directly. Rank orders every listed site.'},
 {target:'#details',text:'6 · Assumptions and limits. Geometry only: sunlight is not usable power, Earth in view is not a link budget, and nothing here assesses landing hazards. Terrain grids run from 40 m at the south pole to 474 m elsewhere.',actions:[['Open the method',api.openMethod]]},
 {target:['#share','#rail-compare'],text:'7 · Results. Export CSV from the comparison or the ranking, or copy a link that reopens this exact view: site, date, stay and comparison.'},
];}

export function createGuide(api){
 const get=key=>{try{return localStorage.getItem(key);}catch{return null;}},put=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 let audience=get('zoriana-audience'),welcomed=get('zoriana-welcomed')==='1',flow=null,index=0,memo={},marked=[],opener=null,shown=null,buttons=[];
 const welcome=document.createElement('section');welcome.className='guide-welcome';welcome.hidden=true;
 welcome.setAttribute('role','dialog');welcome.setAttribute('aria-modal','true');welcome.setAttribute('aria-labelledby','guide-title');
 welcome.innerHTML=`<div class="guide-card mat"><button class="guide-close guide-card-close" data-free aria-label="Close and explore freely">×</button><header class="guide-hello">${AVATAR}<div><h2 id="guide-title">Welcome to the Moon.</h2><p>I’m Zoriana, your lunar guide.</p></div></header><h3>How would you like to explore?</h3><div class="guide-choices">${AUDIENCES.map(([id,title,note,icon])=>`<button class="guide-choice" data-audience="${id}"><span class="guide-icon"><svg class="ic"><use href="#i-${icon}"/></svg></span><span class="guide-choice-text"><strong>${title}</strong><small>${note}</small></span><svg class="ic chev"><use href="#i-chevron"/></svg></button>`).join('')}</div><button class="guide-free" data-free>Explore freely <span aria-hidden="true">→</span></button><p class="guide-note">You can change your experience anytime.</p></div>`;
 const bubble=document.createElement('section');bubble.className='guide-bubble mat';bubble.hidden=true;bubble.setAttribute('aria-live','polite');bubble.setAttribute('aria-label','Guide');
 bubble.innerHTML=`${AVATAR}<div class="guide-body"><p class="guide-text"></p><div class="guide-row"><span class="guide-count"></span><span class="guide-dyn"></span></div></div><button class="guide-close" data-close aria-label="Close the guide">×</button>`;
 document.body.append(welcome,bubble);
 const $=s=>bubble.querySelector(s);
// What a step points at: a selector, a function that finds elements (map labels and markers come and go as the view
 // moves), or a list of either. Everything found pulses; the first one inside the side panel is scrolled into view.
 let markTimers=[];
 function mark(target,again=false){
  if(!again){markTimers.forEach(clearTimeout);markTimers=[];}
  for(const el of marked??[])el.classList.remove('guide-target');
  marked=[target].flat().filter(Boolean).flatMap(t=>typeof t==='function'?t():[...document.querySelectorAll(t)]).filter(el=>el&&el.offsetParent&&!el.hidden);
  for(const el of marked)el.classList.add('guide-target');
  if(!again){
   const panel=document.querySelector('#planner'),inPanel=marked.find(el=>el.closest('#planner')&&el.offsetHeight<panel.clientHeight*.7);inPanel?.scrollIntoView({block:'center',behavior:'smooth'});
   // The map is still moving when a step starts: look again once labels and markers have settled.
   if(target)markTimers=[700,1700,3000].map(ms=>setTimeout(()=>mark(target,true),ms));
  }
 }
 // One way to draw the bubble: text, a count, and a row of buttons ([label, action, primary?]).
 function show(text,row=[],count=''){
  $('.guide-text').textContent=text;$('.guide-count').textContent=count;buttons=row;
  $('.guide-dyn').innerHTML=row.map(([label,,primary],i)=>`<button data-i="${i}"${primary?' class="primary"':''}>${label}</button>`).join('');
  bubble.classList.toggle('plain',audience==='planner');bubble.classList.toggle('menu',!count&&row.length>=3);bubble.hidden=false;shown={text,row,count};
 }
 function end(){flow?.[index]?.leave?.();if(flow?.learn){api.restoreDate();api.endCompare();}flow=null;mark(null);}
 const close=()=>{end();bubble.hidden=true;};
 async function go(i){
  flow[index]?.leave?.();
  const current=flow,s=flow[i],count=`${i+1} of ${flow.length}`;index=i;s.run?.(memo);mark(s.target??null);
  const nav=()=>[...(i>0?[['‹ Back',()=>go(i-1)]]:[]),...(i===0?[['Change experience',openWelcome]]:[]),...(flow.learn&&i>0?[['Start over',()=>start(flow.make,true)]]:[]),...(s.actions??[]).map(([label,run])=>[label,()=>{close();run();}]),[i<flow.length-1?'Next ›':'Done',()=>i<flow.length-1?go(i+1):close(),true]];
  if(s.work){
   show(s.busy,[],count);const text=await s.work(memo);
   if(flow!==current||index!==i)return;mark(s.target??null);show(text,nav(),count);return;
  }
  const text=typeof s.text==='function'?s.text(memo):s.text;
  if(s.choices)show(text,[...(i>0?[['‹ Back',()=>go(i-1)]]:[]),...s.choices.map((label,k)=>[label,()=>{memo[`choice${i}`]=k;go(i+1);},true])],count);
  else show(text,nav(),count);
 }
 function start(make,learn=false){end();memo={};flow=make();flow.make=make;flow.learn=learn;index=0;go(0);}
 const startExplore=()=>start(()=>exploreTour(api)),startSun=()=>start(()=>investigation(api,'sun'),true),startEarth=()=>start(()=>investigation(api,'earth'),true),startPlan=()=>start(()=>planWalk(api));
 const invite={
  general:()=>show('All set to explore the Moon. Want a short tour of the map and how to get around?',[['Not now',close],['Start the tour',startExplore,true]]),
  educator:()=>show('All set to learn and discover. Two experiments are ready: make a guess, then test it with real NASA data.',[['Sunlight at the pole',startSun,true],['Can everyone see Earth?',startEarth,true],['Not now',close]]),
  planner:()=>show('Planning tools are ready, and the numbers are showing. Want a seven-step walkthrough of the tools? It is optional, and it is always under Guide.',[['No thanks',close],['Show me',startPlan,true]]),
 };
 // Leaving the welcome is remembered, so a returning visitor is not asked again; Guide in the sidebar reopens it.
 function leave(){welcome.hidden=true;welcomed=true;put('zoriana-welcomed','1');opener?.focus?.();opener=null;}
 function choose(id){
  end();audience=id;put('zoriana-audience',id);leave();api.setup(id);
  // A planner asked for tools, not a tour: one plain panel, without the astronaut, offers the walkthrough once.
  invite[id]();
 }
 function openWelcome(){close();opener=document.activeElement;welcome.hidden=false;welcome.querySelector('[data-audience]').focus({preventScroll:true});}
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
  const i=e.target.closest('[data-i]')?.dataset.i;if(i!==undefined)buttons[Number(i)]?.[1]?.();
 };
 bubble.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 return {
  audience:()=>audience,
  firstVisit:()=>!audience&&!welcomed,
  welcome:openWelcome,
  // The sidebar's Guide button: what this experience offers, and a way to change it.
  open(){
   if(!audience)return openWelcome();
   end();
   const change=['Change experience',openWelcome];
   // One click: the tour or the walkthrough starts at once. Its first step carries "Change experience".
   if(audience==='planner')return startPlan();
   if(audience==='educator')return show('Two experiments. In each, make a guess, then test it with real NASA data. They work on any date.',[['Sunlight at the pole',startSun,true],['Can everyone see Earth?',startEarth,true],change]);
   startExplore();
  },
  // A plain answer about something on the map. During a tour it appears in place and the tour can be resumed.
  say(text){
   if(flow){const back=shown.resume??shown;show(text,[['Back to the tour',()=>show(back.text,back.row,back.count),true]],back.count);shown.resume=back;}
   else{mark(null);show(text,[['OK',close,true]]);}
  },
  close,
  touring:()=>Boolean(flow),
 };
}
