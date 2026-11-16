// Named lunar features, from the IAU/USGS "Planetary Nomenclature of the Moon" (public domain).
// scripts/prepare-features.py writes public/assets/features.json as rows of
// [name, latitude, east longitude, diameter in km, kind], largest first.
//
// A feature is known here only by its center and diameter, so "inside" and "near the rim" treat
// each one as a circle. That is a fair description for craters and a rough one for anything else.
const RAD=Math.PI/180,RADIUS_KM=1737.4,KM_PER_DEGREE=RADIUS_KM*RAD;

// Great-circle distance between two places, in km.
export function distanceKm(lat1,lon1,lat2,lon2){
 const a=Math.sin((lat2-lat1)*RAD/2)**2+Math.cos(lat1*RAD)*Math.cos(lat2*RAD)*Math.sin((lon2-lon1)*RAD/2)**2;
 return 2*RADIUS_KM*Math.asin(Math.min(1,Math.sqrt(a)));
}

// Lower case without accents, so "lacus" finds "Lacus Mortis" and "godel" finds "Gödel".
const fold=text=>text.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

// Features whose name starts with the query, then those that contain it; larger features first
// within each group (the list is already sorted by size). Needs at least two characters.
export function searchFeatures(features,query,limit=6){
 const q=fold(query.trim());if(q.length<2||!features)return [];
 const starts=[],contains=[];
 for(const feature of features){
  const name=fold(feature[0]);
  if(name.startsWith(q))starts.push(feature);else if(name.includes(q))contains.push(feature);
 }
 return [...starts,...contains].slice(0,limit);
}

const isCrater=kind=>kind==='Crater'||kind==='Satellite crater';
// Only kinds that are roughly round areas are used to name a place. Rilles, ridges, valleys and
// crater chains are long and thin, so a circle around their center says little about a point.
const AREAS=new Set(['Crater','Satellite crater','Mare','Oceanus','Lacus','Sinus','Palus','Planitia','Mons','Promontorium','Statio']);
// The named feature that best describes a point: the smallest one whose circle reaches it.
// Returns its name, kind and a short phrase such as "inside Shackleton" or "near the rim of
// Malapert A", or null when no named feature covers the point.
export function placeName(features,lat,lon){
 let best=null;
 for(const feature of features||[]){
  const radius=feature[3]/2;if(!(radius>0)||!AREAS.has(feature[4]))continue;
  // Craters are round, so the rim counts. Seas and mountains are irregular: only points well
  // inside their circle are named, which is better than naming the wrong sea.
  const reach=radius*(isCrater(feature[4])?1.15:.6);
  if(Math.abs(feature[1]-lat)*KM_PER_DEGREE>reach)continue;         // cheap rejection by latitude
  const distance=distanceKm(lat,lon,feature[1],feature[2]);
  if(distance<=reach&&(!best||feature[3]<best.feature[3]))best={feature,distance};
 }
 if(!best)return null;
 const [name,,,diameter,kind]=best.feature,ratio=best.distance/(diameter/2);
 const text=isCrater(kind)?(ratio>=.8?`near the rim of ${name}`:`inside ${name}`):(kind==='Mons'||kind==='Promontorium'?`on ${name}`:`in ${name}`);
 return {name,kind,diameterKm:diameter,distanceKm:best.distance,text};
}
