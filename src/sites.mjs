// The curated landing sites. Shared by the browser (the list and map) and the server (which
// loads today's data for these sites ahead of the first visitor).
//
// Coordinates: Apollo Lunar Modules from NASA's NSSDC table (LRO-derived, mean-Earth frame, updated
// 2017); IM-1 and Blue Ghost from NASA/LROC
// published site locations; Chandrayaan-3 from the IAU Statio Shiv Shakti entry; SLIM from the
// JAXA target point. Future targets are announced regions, not landing points: each uses the centre
// of the named feature (or a published candidate point) and says so in its note. See REFERENCES.md.
export const sites=[
 {id:'shackleton',name:'Shackleton region',lat:-89.5,lon:0,cat:'pole',type:'Exploration point',description:'Near the lunar south pole'},
 {id:'malapert',name:'Malapert region',lat:-85.95,lon:0,cat:'pole',type:'Exploration point',description:'Southern highlands'},
 {id:'bluemoon1',name:'Blue Moon Pathfinder 1',lat:-89.45,lon:-137.31,cat:'future',icon:'bluemoon',type:'Planned landing · 2027',description:'Shackleton connecting ridge · Blue Origin',note:'Approximate. The mission names the Shackleton connecting ridge; this is candidate point “Site 001” on that ridge (89.45°S, 222.69°E), not an announced landing point.',why:'A Blue Origin lander flying for NASA’s CLPS programme, to do lunar science and prepare for crewed missions. The ridge beside Shackleton crater gets unusually long sunlight and sits next to permanently shadowed ground.'},
 {id:'griffin1',name:'Griffin Mission One',lat:-85.28,lon:53.27,cat:'future',icon:'griffin',type:'Planned CLPS landing · early 2027',description:'Nobile region · Astrobotic',note:'Approximate. The mission names the Nobile region near Mons Mouton; this is the centre of Nobile crater, not an announced landing point.',why:'Astrobotic’s large Griffin lander, carrying science, technology and cultural payloads to the south-pole region near Mons Mouton.'},
 {id:'im4',name:'IM-4',lat:-84.6,lon:31,cat:'future',icon:'novac',type:'Planned CLPS landing · 2027',description:'Mons Mouton plateau · Intuitive Machines',note:'Approximate. The mission names the Mons Mouton plateau; this is the centre of Mons Mouton, not an announced landing point.',why:'An Intuitive Machines delivery for NASA’s CLPS programme to high ground near the south pole, the kind of terrain crewed landings are being planned for.'},
 {id:'im3',name:'IM-3 Trinity',lat:7.5,lon:-59,cat:'future',icon:'novac',type:'Planned CLPS landing · early 2027',description:'Reiner Gamma swirl · Intuitive Machines',note:'Approximate. The mission names the Reiner Gamma region; this is the centre of the swirl, not an announced landing point.',why:'Goes to Reiner Gamma, a bright swirl on the lunar surface, to investigate the unexpected local magnetic field found there. It also places a communications relay satellite in lunar orbit.'},
 {id:'blueghost3',name:'Blue Ghost Mission 3',lat:36.56,lon:-40.72,cat:'future',icon:'blueghost',type:'Planned CLPS landing · 2028',description:'Mons Gruithuisen Gamma · Firefly Aerospace',note:'Approximate. The mission names Mons Gruithuisen Gamma; this is the centre of the dome, not an announced landing point.',why:'Carries NASA’s Lunar-VISE instruments to the Gruithuisen domes, volcanic domes thought to have formed from thick, silica-rich lava, which is rare on the Moon.'},
 {id:'im2',name:'IM-2 Athena',lat:-84.7906,lon:29.1957,cat:'clps',icon:'novac',type:'CLPS landing site · 2025',description:'Mons Mouton · Intuitive Machines'},
 {id:'im1',name:'IM-1 Odysseus',lat:-80.13,lon:1.44,cat:'clps',icon:'novac',type:'CLPS landing site · 2024',description:'Malapert A · Intuitive Machines'},
 {id:'blueghost1',name:'Blue Ghost M1',lat:18.56,lon:61.81,cat:'clps',icon:'blueghost',type:'CLPS landing site · 2025',description:'Mare Crisium · Firefly Aerospace'},
 {id:'chandrayaan3',name:'Chandrayaan-3',lat:-69.373,lon:32.319,cat:'intl',icon:'vikram',type:'ISRO landing site · 2023',description:'Statio Shiv Shakti · ISRO'},
 {id:'slim',name:'SLIM',lat:-13.316,lon:25.251,cat:'intl',icon:'slim',type:'JAXA landing site · 2024',description:'Near Shioli crater · JAXA'},
 {id:'apollo11',name:'Apollo 11',lat:0.67416,lon:23.47314,cat:'apollo',type:'Apollo landing site · July 1969',description:'Sea of Tranquility · Near side'},
 {id:'apollo12',name:'Apollo 12',lat:-3.0128,lon:-23.4219,cat:'apollo',type:'Apollo landing site · November 1969',description:'Ocean of Storms · Near side'},
 {id:'apollo14',name:'Apollo 14',lat:-3.64589,lon:-17.47194,cat:'apollo',type:'Apollo landing site · February 1971',description:'Fra Mauro · Near side'},
 {id:'apollo15',name:'Apollo 15',lat:26.13239,lon:3.6333,cat:'apollo',type:'Apollo landing site · July 1971',description:'Hadley–Apennine · Near side'},
 {id:'apollo16',name:'Apollo 16',lat:-8.9734,lon:15.5011,cat:'apollo',type:'Apollo landing site · April 1972',description:'Descartes Highlands · Near side'},
 {id:'apollo17',name:'Apollo 17',lat:20.1911,lon:30.7723,cat:'apollo',type:'Apollo landing site · December 1972',description:'Taurus–Littrow · Near side'}
];
