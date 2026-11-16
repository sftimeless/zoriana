// The ground around Launch Complex 39A, drawn as a picture to lay over the globe near the pad, where the
// satellite picture of Earth (20 km to a pixel) shows only a blur.
//
// It is an illustration of the lie of the land, not a survey: the Atlantic shore a little under a kilometer
// east of the pad, the lagoons and marsh to the west, the crawlerway arriving from the south from the
// assembly building, the second pad to the north-west. Distances are in km, east and north of the pad.
// The same drawing is made at three sizes so it stays sharp from the pad and still fits the coast from high up.

// How far east of the pad the shore lies, n km north of it: running north-north-west, with the Cape swelling out to the south.
export const shore=n=>.85-.33*n+(n<-6?Math.min(11,.028*(-n-6)**2):0);

export function capeCanvas(size,N=1024){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=N;
 const g=canvas.getContext('2d'),k=N/size,half=size/2,X=e=>(e/size+.5)*N,Y=n=>(.5-n/size)*N,close=size<10;
 let seed=5;const rand=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
 const LAND='#58633f',LAGOON='#34617c',OCEAN='#2b5f88',SAND='#cfc29b',ROAD='#8f8f88',TRACK='#b9aa86',APRON='#a8a28e',CONCRETE='#bcb7a8';
 const trace=points=>{g.beginPath();points.forEach(([e,n],i)=>i?g.lineTo(X(e),Y(n)):g.moveTo(X(e),Y(n)));};
 const area=(points,color)=>{g.fillStyle=color;trace(points);g.closePath();g.fill();};
 // A line wide km wide, never thinner than least pixels; left out altogether when least is 0 and it would be under half a pixel.
 const line=(points,color,wide,least=0)=>{if(!least&&wide*k<.5)return;g.strokeStyle=color;g.lineWidth=Math.max(least,wide*k);g.lineJoin=g.lineCap='round';trace(points);g.stroke();};
 const blob=(e,n,r,color,squash=1,turn=0)=>{g.fillStyle=color;g.beginPath();g.ellipse(X(e),Y(n),r*k,r*k*squash,turn,0,7);g.fill();};
 const octagon=(e,n,r,color)=>area([...Array(8)].map((_,i)=>[e+r*Math.cos((i+.5)*Math.PI/4),n+r*Math.sin((i+.5)*Math.PI/4)]),color);

 g.fillStyle=LAND;g.fillRect(0,0,N,N);
 for(let i=0;i<1100;i++){const r=(.004+rand()*.02)*size;blob((rand()-.5)*size,(rand()-.5)*size,r,['rgba(108,116,72,.28)','rgba(62,78,50,.32)','rgba(126,119,86,.2)'][i%3],.4+rand()*.6,rand()*3);}
 const rows=[];for(let i=0;i<=240;i++)rows.push(half-i*size/240);
 // Lagoons: a long one far to the west, one behind the beach to the north, one to the south, and a creek between.
 area([[-23,half],[-16,half],[-15,8],[-17,-4],[-15,-half],[-22,-half],[-24,0]],LAGOON);
 const north=rows.filter(n=>n>=4.5),south=rows.filter(n=>n<=-7);
 if(north.length>1)area([...north.map(n=>[shore(n)-1.3,n]),...[...north].reverse().map(n=>[shore(n)-1.3-Math.min(5,(n-4.5)*.8),n])],LAGOON);
 if(south.length>1)area([...south.map(n=>[shore(n)-2.5,n]),...[...south].reverse().map(n=>[Math.max(-9,shore(n)-2.5-(-7-n)*1.4),n])],LAGOON);
 line([[-16,1.2],[-11,2.2],[-7,1.6],[-4,2.6],[-2.3,2.2]],LAGOON,.45,size<60?1:0);
 for(let i=0;i<260;i++){const e=(rand()-.5)*24,n=(rand()-.5)*24,r=.05+rand()**2*.4;if(Math.hypot(e,n)<.62||e>shore(n)-.22||r*k<.7)continue;blob(e,n,r,LAGOON,.35+rand()*.5,rand()*3);}
 // The Atlantic, the beach and the line of surf.
 const coast=rows.map(n=>[shore(n),n]);
 area([...coast,[half+1,-half-1],[half+1,half+1]],OCEAN);
 line(coast,SAND,.1,1.3);
 line(coast.map(([e,n])=>[e+.085,n]),'rgba(238,242,242,.6)',.035);
 // Roads, and the crawlerway the rocket was carried along: from the assembly building, then north up to each pad.
 line([[-7.2,half],[-7,3],[-6.6,-3],[-7,-half]],ROAD,.03,size<60?1:0);
 line(coast.map(([e,n])=>[e-.42,n]),ROAD,.02,size<60?.8:0);
 const crawlerway=[[-5.3,-1.4],[-1.5,-1.4],[-.42,-1.1],[0,-.62],[0,-.1]],branch=[[-2.7,-1.4],[-2,1],[-1.4,2.3]];
 for(const way of [crawlerway,branch]){line(way,TRACK,.05,size<60?1.4:0);line(way,LAND,.014);}
 if(size<60){g.fillStyle='#9d9b91';g.fillRect(X(-5.8),Y(-1.05),.95*k,.7*k);g.fillStyle=LAGOON;g.fillRect(X(-4.75),Y(-1.8),.5*k,.34*k);}
 if(size<100)octagon(-1.4,2.65,.4,APRON);
 octagon(0,0,.44,APRON);
 if(close){
  // The pad itself: perimeter road, the concrete around the hardstand, scorched ground at each end of the flame trench, holding ponds.
  g.strokeStyle=ROAD;g.lineWidth=.012*k;g.beginPath();[...Array(9)].forEach((_,i)=>{const a=(i+.5)*Math.PI/4,e=.4*Math.cos(a),n=.4*Math.sin(a);i?g.lineTo(X(e),Y(n)):g.moveTo(X(e),Y(n));});g.stroke();
  g.fillStyle=CONCRETE;g.fillRect(X(-.19),Y(.23),.38*k,.46*k);
  for(const side of [-1,1]){const burned=g.createLinearGradient(0,Y(side*.2),0,Y(side*.43));burned.addColorStop(0,'rgba(40,38,34,.75)');burned.addColorStop(1,'rgba(40,38,34,0)');g.fillStyle=burned;g.fillRect(X(-.03),Math.min(Y(side*.2),Y(side*.43)),.06*k,.23*k);}
  g.fillStyle=LAGOON;g.fillRect(X(-.3),Y(.36),.09*k,.07*k);g.fillRect(X(.21),Y(.36),.09*k,.07*k);
  for(const e of [-.39,.39])blob(e,.31,.03,CONCRETE);
  line([[0,-.1],[0,-.5]],TRACK,.04);line([[0,-.1],[0,-.5]],LAND,.012);
 }
 // Fade out toward the edge so the picture melts into the globe beneath it.
 const fade=g.createRadialGradient(N/2,N/2,N*.36,N/2,N/2,N*.5);fade.addColorStop(0,'#000');fade.addColorStop(1,'rgba(0,0,0,0)');
 g.globalCompositeOperation='destination-in';g.fillStyle=fade;g.fillRect(0,0,N,N);
 return canvas;
}
