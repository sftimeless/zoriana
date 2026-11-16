// The vehicles of an Apollo flight, drawn from simple shapes: the Saturn V's three stages, the command
// and service module, the lunar module and the parachutes. They are original drawings made in code from
// the published overall dimensions (heights and diameters in metres); small details are simplified and
// no agency markings or logos are reproduced. The one flag is the United States flag planted at the landing site. Each part is built in metres with its base at y = 0 and
// its nose toward +y, then the caller scales the lot to kilometres.
import * as THREE from 'three';

const mat=(color,metalness=.1,roughness=.75,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const WHITE=mat(0xf1f0ec),BLACK=mat(0x18181a,.1,.6),SILVER=mat(0xc5c9cf,.3,.45),DARK=mat(0x3b3d42,.3,.5),GOLD=mat(0xd0a040,.35,.45),GREY=mat(0x8d9097,.25,.55),SHIELD=mat(0x5a4636,.2,.8),FABRIC=mat(0xf4f1ea,0,.9,{side:THREE.DoubleSide}),ORANGE=mat(0xe8742c,0,.9,{side:THREE.DoubleSide});
const mesh=(geometry,material,y=0)=>{const m=new THREE.Mesh(geometry,material);m.position.y=y;return m;};
// A texture made from a drawing on a canvas, kept as plain pixels in memory. A browser may throw away what was drawn
// on a canvas when it resets its graphics (phones do this to tabs left in the background); pixels held here survive
// that, so the picture can be handed to the graphics card again.
export function keptTexture(canvas){
 const w=canvas.width,h=canvas.height,drawn=canvas.getContext('2d').getImageData(0,0,w,h).data,pixels=new Uint8Array(drawn.length);
 for(let y=0;y<h;y++)pixels.set(drawn.subarray(y*w*4,(y+1)*w*4),(h-1-y)*w*4);       // canvas rows run top to bottom, texture rows bottom to top
 const texture=new THREE.DataTexture(pixels,w,h,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=8;texture.needsUpdate=true;
 return texture;
}
// A tube or cone frustum standing on y = 0.
const tube=(bottom,top,height,material,segments=32)=>{const g=new THREE.CylinderGeometry(top,bottom,height,segments,1);g.translate(0,height/2,0);return new THREE.Mesh(g,material);};
// A white tube with black roll-pattern panels, the way the stages were painted so cameras could follow their roll.
function painted(radius,height,bands){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#f1f0ec';c.fillRect(0,0,256,256);c.fillStyle='#18181a';
 for(const [from,to,quarters] of bands)for(let q=0;q<4;q++)if(quarters==='all'||(quarters==='alt'&&q%2===0))c.fillRect(q*64,256*(1-to),quarters==='all'?256:64,256*(to-from));
 return tube(radius,radius,height,new THREE.MeshStandardMaterial({map:keptTexture(canvas),metalness:.1,roughness:.7}),48);
}
const bell=(throat,exit,length,y)=>{const b=tube(exit,throat,length,DARK,20);b.position.y=y-length;return b;};
// A glowing exhaust plume pointing toward -y from y = 0. Hidden until a burn.
export function plume(radius,length,color=0xffc46b){
 const g=new THREE.ConeGeometry(radius,length,20,1,true);g.translate(0,-length/2,0);g.rotateX(Math.PI);g.translate(0,-length,0);
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 m.visible=false;m.userData.plume=true;return m;
}

// Clusters of small attitude-control thrusters ("quads"): a housing with four nozzles, one pointing toward the nose (+y),
// one toward the tail, and one each way round the hull. Each nozzle gets a small flame, hidden until it fires.
// Returns the flames grouped by the way the exhaust goes: up[i], down[i], left[i], right[i] for quad i.
function quads(parent,places,size=1){
 const jets={up:[],down:[],left:[],right:[]},Y=new THREE.Vector3(0,-1,0);
 for(const [x,y,z] of places){
  const quad=new THREE.Group(),out=new THREE.Vector3(x,0,z).normalize(),round=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),out);
  quad.position.set(x,y,z);
  const housing=new THREE.Mesh(new THREE.BoxGeometry(.42*size,.42*size,.42*size),DARK);housing.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),out);quad.add(housing);
  for(const [key,dir] of [['up',new THREE.Vector3(0,1,0)],['down',new THREE.Vector3(0,-1,0)],['left',round],['right',round.clone().negate()]]){
   const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.11*size,.05*size,.26*size,10),SILVER);nozzle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);nozzle.position.copy(dir).multiplyScalar(.3*size);quad.add(nozzle);
   const jet=plume(.16*size,1.5*size,0xffe6c0);jet.quaternion.setFromUnitVectors(Y,dir);jet.position.copy(dir).multiplyScalar(.42*size);quad.add(jet);jets[key].push(jet);
  }
  parent.add(quad);
 }
 return jets;
}
// A small dark patch lying on a cone or drum, for windows and hatches: at angle a round the axis, radius r, height y, leaning back by lean.
function patch(parent,a,r,y,w,h,lean,material=BLACK,thick=.04){
 const pivot=new THREE.Group(),p=new THREE.Mesh(new THREE.BoxGeometry(thick,h,w),material);pivot.rotation.y=a;p.position.set(r,y,0);p.rotation.z=lean;pivot.add(p);parent.add(pivot);return p;
}
// Heights of the stack's parts, bottom to top, in metres. The whole vehicle stood 110.6 m.
export const SIZE={sIC:42.1,sII:24.9,interstage:5.6,sIVB:12.2,adapter:8.5,service:7.5,command:3.2,tower:9.9};

export function firstStage(){
 const g=new THREE.Group();
 g.add(painted(5.05,SIZE.sIC,[[0,.3,'alt'],[.55,.68,'all'],[.93,1,'alt']]));
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,fairing=tube(1.9,.5,7.5,WHITE,16);fairing.position.set(Math.cos(a)*4.6,0,Math.sin(a)*4.6);g.add(fairing);
  const fin=mesh(new THREE.BoxGeometry(3.4,5.2,.25),BLACK,2.6);fin.position.set(Math.cos(a)*6.6,2.6,Math.sin(a)*6.6);fin.rotation.y=-a;g.add(fin);
  const engine=bell(.9,1.85,3.9,.3);engine.position.x=Math.cos(a)*3.4;engine.position.z=Math.sin(a)*3.4;g.add(engine);}
 g.add(bell(.9,1.85,3.9,.3));
 const flame=plume(4.6,70);g.add(flame);g.userData.plume=flame;
 return g;
}
export function secondStage(){
 const g=new THREE.Group();
 g.add(painted(5.05,SIZE.sII,[[0,.08,'all'],[.84,.9,'all']]));
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,engine=bell(.45,1.05,2.6,.2);engine.position.x=Math.cos(a)*2.9;engine.position.z=Math.sin(a)*2.9;g.add(engine);}
 g.add(bell(.45,1.05,2.6,.2));
 const cone=tube(5.05,3.3,SIZE.interstage,WHITE,48);cone.position.y=SIZE.sII;g.add(cone);
 const flame=plume(3.6,34,0xbfd9ff);g.add(flame);g.userData.plume=flame;
 return g;
}
// The third stage with its instrument ring and the four adapter panels that enclosed the lunar module.
export function thirdStage(){
 const g=new THREE.Group();
 g.add(painted(3.3,SIZE.sIVB-.9,[[.86,1,'alt']]));
 const ring=tube(3.3,3.3,.9,BLACK,48);ring.position.y=SIZE.sIVB-.9;g.add(ring);
 g.add(bell(.45,1.05,2.6,.2));
 const panels=[];
 for(let i=0;i<4;i++){
  const geometry=new THREE.CylinderGeometry(1.95,3.3,SIZE.adapter,12,1,true,i*Math.PI/2,Math.PI/2);geometry.translate(0,SIZE.adapter/2,0);
  const panel=new THREE.Mesh(geometry,mat(0xf1f0ec,.1,.75,{side:THREE.DoubleSide}));panel.position.y=SIZE.sIVB;panel.userData.angle=i*Math.PI/2+Math.PI/4;g.add(panel);panels.push(panel);
 }
 // Two auxiliary propulsion pods near the base: small engines that settle the propellant and steer the stage while it coasts.
 const aps=[];
 for(const x of [-3.45,3.45]){const pod=mesh(new THREE.BoxGeometry(.7,1.9,1.1),WHITE,1.6);pod.position.x=x;g.add(pod);const jet=plume(.22,2.6,0xffe6c0);jet.position.set(x*1.04,.6,0);g.add(jet);aps.push(jet);}
 const flame=plume(1.6,26,0xbfd9ff);g.add(flame);
 g.userData={plume:flame,panels,aps};
 return g;
}
// Command and service module. Base (engine bell exit) at y = 0; the docking probe is at the top.
export const CSM_LENGTH=2.9+SIZE.service+SIZE.command;
export function commandShip(){
 const g=new THREE.Group(),service=new THREE.Group(),command=commandModule(),top=2.9+SIZE.service;
 service.add(bell(.5,1.25,2.9,2.9),mesh(new THREE.CylinderGeometry(1.2,1.6,.5,24),DARK,2.75));
 const body=tube(1.95,1.95,SIZE.service,SILVER,40);body.position.y=2.9;service.add(body);
 for(const y of [2.95,top-.3]){const band=tube(1.97,1.97,.28,WHITE,40);band.position.y=y;service.add(band);}
 // Radiators: two large panels low on the hull for the cabin's cooling, eight narrow ones high up for the fuel cells.
 for(let i=0;i<4;i++){const a=i*Math.PI/2;patch(service,a,1.96,5.0,1.5,2.9,0,WHITE,.05);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;patch(service,a,1.96,top-1.9,.5,1.5,0,WHITE,.05);}
 // Four clusters of attitude thrusters round the hull.
 const jets=quads(service,[0,1,2,3].map(i=>{const a=i*Math.PI/2+Math.PI/4;return [Math.cos(a)*2.16,top-2.3,Math.sin(a)*2.16];}));
 // The high-gain antenna: four small dishes on a boom at the base, swung out to the side.
 const boom=tube(.05,.05,2.3,SILVER,6);boom.position.set(1.7,3.1,0);boom.rotation.z=-2.2;service.add(boom);
 for(const [dy,dz] of [[-.42,-.42],[-.42,.42],[.42,-.42],[.42,.42]]){const dish=mesh(new THREE.SphereGeometry(.5,12,6,0,Math.PI*2,0,Math.PI/3.2),WHITE);dish.position.set(3.75,1.65+dy,dz);dish.rotation.z=-Math.PI/2;dish.scale.set(.8,.8,.8);service.add(dish);}
 const flame=plume(1.1,14,0xcfe2ff);flame.position.y=0;service.add(flame);
 command.position.y=top;
 g.add(service,command);g.userData={service,command,plume:flame,jets,cabinJets:command.userData.jets};
 return g;
}
// The crew cabin: a blunt cone with its heat shield at the base (y = 0) and the docking tunnel at the top.
export function commandModule(){
 const g=new THREE.Group(),lean=Math.atan(1.4/(SIZE.command-.4)),r=y=>1.95-1.4*y/(SIZE.command-.4)+.012;
 g.add(tube(1.95,.55,SIZE.command-.4,mat(0xd4d8dd,.35,.38),40));
 const cap=tube(.55,.4,.4,DARK,20);cap.position.y=SIZE.command-.4;g.add(cap);
 const probe=tube(.16,.05,.5,SILVER,10);probe.position.y=SIZE.command;g.add(probe);
 // Windows and the hatch: two forward-looking rendezvous windows, two side windows, and the hatch between them with its own window.
 for(const a of [-.42,.42])patch(g,a,r(2.05),2.05,.2,.34,lean);
 for(const a of [-1.15,1.15])patch(g,a,r(1.45),1.45,.36,.36,lean);
 patch(g,0,r(1.3),1.3,.78,.86,lean,mat(0xaeb3b9,.3,.45),.03);patch(g,0,r(1.5)+.02,1.5,.22,.22,lean);
 const shield=mesh(new THREE.SphereGeometry(4.6,32,8,0,Math.PI*2,Math.PI-.44,.44),SHIELD);shield.position.y=4.16;g.add(shield);
 // The cabin's own small thrusters, used once the service module is gone.
 const jets=[];for(const a of [.8,2.35,3.95,5.5]){const jet=plume(.1,.9,0xffe6c0);jet.position.set(Math.cos(a)*1.72,.45,Math.sin(a)*1.72);jet.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),new THREE.Vector3(-Math.sin(a),0,Math.cos(a)));g.add(jet);jets.push(jet);}
 const glow=mesh(new THREE.SphereGeometry(4.7,32,8,0,Math.PI*2,Math.PI-.5,.5),new THREE.MeshBasicMaterial({color:0xff9a4a,transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.y=4.2;g.add(glow);
 // Three bags on the nose that inflate after splashdown to keep the cabin upright.
 const bags=new THREE.Group();for(let i=0;i<3;i++){const a=i*2*Math.PI/3,bag=mesh(new THREE.SphereGeometry(.42,14,10),WHITE);bag.position.set(Math.cos(a)*.5,SIZE.command-.05,Math.sin(a)*.5);bags.add(bag);}
 bags.visible=false;g.add(bags);
 g.userData={glow,jets,bags};
 return g;
}
// The escape tower and the cover over the cabin, thrown off once the second stage was burning.
export function escapeTower(){
 const g=new THREE.Group();
 g.add(tube(1.98,.6,SIZE.command,WHITE,40));
 for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,leg=tube(.06,.06,3.2,DARK,6);leg.position.set(Math.cos(a)*.45,SIZE.command-.2,Math.sin(a)*.45);g.add(leg);}
 const motor=tube(.33,.33,4.7,WHITE,16);motor.position.y=SIZE.command+3;g.add(motor);
 const tip=tube(.33,.05,.8,DARK,12);tip.position.y=SIZE.command+7.7;g.add(tip);
 return g;
}
// The lunar module. Footpads on y = 0; the docking hatch is on top of the ascent stage.
export const LM_HEIGHT=7,LM_DESCENT_TOP=3.25;
export function lunarModule(){
 const g=new THREE.Group(),descent=new THREE.Group(),ascent=new THREE.Group(),legs=[],T=LM_DESCENT_TOP,FOIL=mat(0xb9882f,.4,.5),PANEL=mat(0x4a4c50,.3,.6);
 // Descent stage: an eight-sided box wrapped in gold and dark foil, the engine bell beneath, four legs with footpads.
 const base=tube(2.1,2.1,1.7,GOLD,8);base.position.y=1.55;base.rotation.y=Math.PI/8;descent.add(base);
 for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;patch(descent,a,1.96,2.4,1.5,1.5,0,i%2?PANEL:FOIL,.06);}
 descent.add(mesh(new THREE.CylinderGeometry(2.05,2.05,.08,8).rotateY(Math.PI/8),PANEL,T+.02),bell(.35,.85,1.3,1.55));
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2,leg=new THREE.Group();
  const strut=tube(.09,.09,3.9,GOLD,8);strut.position.set(2.0,3.05,0);strut.rotation.z=-2.42;leg.add(strut);
  for(const z of [-.75,.75]){const brace=tube(.05,.05,2.75,SILVER,6);brace.position.set(1.85,1.62,z);brace.rotation.z=-1.25;brace.rotation.y=z>0?-.3:.3;leg.add(brace);}
  const pad=tube(.48,.4,.16,GOLD,16);pad.position.set(4.5,0,0);leg.add(pad);
  if(i===0){
   // The ladder down the front leg, and the porch outside the hatch.
   for(const z of [-.24,.24]){const rail=tube(.03,.03,2.9,SILVER,6);rail.position.set(2.15,2.95,z);rail.rotation.z=-2.42;leg.add(rail);}
   for(let k=0;k<8;k++){const rung=mesh(new THREE.BoxGeometry(.05,.05,.5),SILVER);rung.position.set(2.3+k*.235,2.78-k*.27,0);leg.add(rung);}
   leg.add(box3(.9,.06,.9,SILVER,2.15,T-.1,0));
  }else{const probe=tube(.015,.015,1.7,SILVER,4);probe.position.set(4.5,-1.7,0);leg.add(probe);leg.userData.probe=probe;}   // a thin rod under each of the other pads that feels for the ground
  leg.rotation.y=a;descent.add(leg);legs.push(leg);
 }
 const flameDown=plume(.9,9,0xdfe9ff);flameDown.position.y=.25;descent.add(flameDown);
 // Ascent stage: the crew cabin as a short drum, its flat face with two triangular windows and the hatch, equipment bays
 // and propellant tanks to the sides and back, four thruster clusters on outriggers, antennas on top.
 const cabin=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,1.9,20),GREY);cabin.rotation.z=Math.PI/2;cabin.position.set(.55,T+1.25,0);ascent.add(cabin);
 ascent.add(box3(.5,1.5,1.9,DARK,1.55,T+1.2,0),box3(.06,.62,.62,SILVER,1.83,T+.55,0),box3(.05,.3,.3,BLACK,1.86,T+.55,0));
 for(const z of [-.52,.52]){const pane=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.05,3),BLACK);pane.rotation.z=Math.PI/2;pane.rotation.x=z>0?.5:-.5;pane.position.set(1.83,T+1.55,z);ascent.add(pane);}
 ascent.add(box3(1.6,1.9,2.9,SILVER,-.5,T+1.05,0),box3(.8,1.5,1.9,BLACK,-1.6,T+1.1,0));
 for(const z of [-1.75,1.75]){ascent.add(box3(1.5,1.3,.9,GREY,-.3,T+.95,z));const tank=mesh(new THREE.SphereGeometry(.62,14,10),FOIL);tank.position.set(.75,T+.75,z*.92);ascent.add(tank);}
 const tunnel=tube(.42,.42,.55,DARK,16);tunnel.position.set(0,T+2.05,0);ascent.add(tunnel);
 const jets=quads(ascent,[[1.55,T+1.75,1.75],[-1.55,T+1.75,1.75],[-1.55,T+1.75,-1.75],[1.55,T+1.75,-1.75]],.8);
 for(const [x,z] of [[1.3,1.5],[-1.3,1.5],[-1.3,-1.5],[1.3,-1.5]]){const arm=tube(.04,.04,.75,SILVER,6);arm.position.set(x,T+1.5,z);arm.rotation.x=z>0?.5:-.5;ascent.add(arm);}
 const radar=mesh(new THREE.SphereGeometry(.34,12,6,0,Math.PI*2,0,Math.PI/3),WHITE);radar.position.set(1.15,T+2.55,0);radar.rotation.z=-Math.PI/2;ascent.add(radar,box3(.2,.5,.2,SILVER,1.0,T+2.3,0));
 const dish=mesh(new THREE.SphereGeometry(.42,12,6,0,Math.PI*2,0,Math.PI/3),WHITE);dish.position.set(-.2,T+3,1.5);dish.rotation.x=Math.PI;ascent.add(dish);
 const mast=tube(.03,.03,.9,SILVER,6);mast.position.set(-.2,T+2,1.5);ascent.add(mast);
 for(const z of [-.9,.9]){const whip=tube(.012,.012,1.1,SILVER,4);whip.position.set(-1.1,T+2,z);ascent.add(whip);}
 ascent.add(bell(.2,.4,.45,T+.1));
 const flameUp=plume(.5,5,0xdfe9ff);flameUp.position.y=T-.3;ascent.add(flameUp);
 g.add(descent,ascent);g.userData={descent,ascent,legs,plumeDown:flameDown,plumeUp:flameUp,jets};
 return g;
}
// Two figures in white suits, for the walk on the surface. Feet on y = 0.
export function astronauts(){
 const g=new THREE.Group();
 for(const [x,z] of [[7.5,2.5],[9.5,-3]]){
  const body=mesh(new THREE.CapsuleGeometry(.28,.95,4,10),WHITE,.95);body.position.x=x;body.position.z=z;g.add(body);
  const pack=mesh(new THREE.BoxGeometry(.3,.6,.45),WHITE,1.25);pack.position.set(x-.3,1.25,z);g.add(pack);
  const visor=mesh(new THREE.SphereGeometry(.2,12,8),GOLD,1.62);visor.position.set(x+.1,1.62,z);g.add(visor);
 }
 return g;
}
// The United States flag planted during the moonwalk: a thin pole, a rod along the top to hold the cloth out where no
// wind blows, and the flag of 1969 with fifty stars. Foot of the pole at y = 0.
export function flag(){
 const g=new THREE.Group(),w=190,h=100,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');
 for(let i=0;i<13;i++){c.fillStyle=i%2?'#f4f4f0':'#b22234';c.fillRect(0,Math.round(i*h/13),w,Math.ceil(h/13));}
 c.fillStyle='#3c3b6e';c.fillRect(0,0,76,Math.round(7*h/13));c.fillStyle='#f4f4f0';
 for(let row=0;row<9;row++)for(let k=0;k<(row%2?5:6);k++){c.beginPath();c.arc(6.3+(row%2?6.3:0)+k*12.6,5.4+row*5.4,1.5,0,7);c.fill();}
 const cloth=new THREE.PlaneGeometry(1.52,.8,12,1),at=cloth.attributes.position;for(let i=0;i<at.count;i++)at.setZ(i,.035*Math.sin(at.getX(i)*6.5));cloth.computeVertexNormals();
 const banner=new THREE.Mesh(cloth,new THREE.MeshStandardMaterial({map:keptTexture(canvas),side:THREE.DoubleSide,roughness:.9,metalness:0}));banner.position.set(.78,1.74,0);
 const rod=tube(.012,.012,1.56,SILVER,6);rod.rotation.z=-Math.PI/2;rod.position.set(0,2.15,0);
 g.add(tube(.016,.016,2.17,SILVER,8),rod,banner);
 return g;
}
// Three main parachutes above the cabin. Attach point at y = 0, canopies above.
export function parachutes(){
 const g=new THREE.Group();
 for(let i=0;i<3;i++){
  const a=i*2*Math.PI/3,canopy=mesh(new THREE.SphereGeometry(12.5,20,8,0,Math.PI*2,0,Math.PI/2.3),i%2?FABRIC:ORANGE);
  canopy.position.set(Math.cos(a)*13,34,Math.sin(a)*13);canopy.rotation.set(Math.sin(a)*.32,0,-Math.cos(a)*.32);g.add(canopy);
  const line=tube(.05,.05,37,GREY,4);line.position.set(0,0,0);line.rotation.set(Math.sin(a)*.36,0,-Math.cos(a)*.36);g.add(line);
 }
 return g;
}
// Many straight bars drawn as one object: each is [x1, y1, z1, x2, y2, z2, thickness].
function bars(list,material){
 const out=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,list.length),m=new THREE.Matrix4(),q=new THREE.Quaternion(),a=new THREE.Vector3(),b=new THREE.Vector3(),size=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 list.forEach(([x1,y1,z1,x2,y2,z2,w],i)=>{a.set(x1,y1,z1);b.set(x2,y2,z2);const d=b.clone().sub(a),length=d.length();q.setFromUnitVectors(up,d.normalize());size.set(w,length,w);m.compose(a.add(b).multiplyScalar(.5),q,size);out.setMatrixAt(i,m);});
 out.instanceMatrix.needsUpdate=true;out.frustumCulled=false;return out;
}
const box3=(w,h,d,material,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);b.position.set(x,y,z);return b;};
const box=(w,h,d,material,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);b.position.set(x,y,z);return b;};
// Launch Complex 39A as it stood for a Saturn V, in simple shapes: the raised concrete hardstand with its flame trench
// and ramp, the mobile launcher's platform, the red launch umbilical tower with its nine swing arms and crane, storage
// spheres and floodlight masts, and the Vehicle Assembly Building in the distance. An original drawing made from the
// published layout and overall sizes, not a copy of any picture; details are simplified.
// Metres, with x east, y up, z south. The ground is y = 0, the rocket stands at the origin on the deck at y = DECK.
export const DECK=26;
export function launchComplex(){
 const g=new THREE.Group(),CONCRETE=mat(0xbcb7a8,0,.95),SLOPE=mat(0x9a9783,0,1),PLATFORM=mat(0x8d9196,.15,.75),RED=mat(0xb8392a,.1,.7),DARKRED=mat(0x8f2c22,.1,.7),SOOT=mat(0x2a2a2c,0,.95),PALE=mat(0xe8e7e1,0,.8),TRACK=mat(0xb9aa86,0,1);
 // The hardstand: a mound 12 m high with a flat top, longer north to south; the flame trench runs through it under the rocket.
 const mound=new THREE.Mesh(new THREE.CylinderGeometry(96,236,12,4,1).rotateY(Math.PI/4),SLOPE);mound.position.y=6;mound.scale.z=1.25;g.add(mound);
 g.add(box(136,.6,170,CONCRETE,0,12.3,0),box(18,.25,172,SOOT,0,12.62,0));
 for(const side of [-1,1]){const mouth=box(18,5,30,SOOT,0,9.4,side*100);mouth.rotation.x=side*.05;g.add(mouth);}
 const ramp=box(38,.8,424,TRACK,0,6,84+210);ramp.rotation.x=Math.atan(12/420);g.add(ramp);
 // The mobile launcher: a steel platform on pedestals, with the opening for the engines' exhaust.
 for(const x of [-17,17])for(const z of [-30,-9,12])g.add(box(3.2,6.8,3.2,PLATFORM,x,16,z));
 g.add(box(41,7.3,49,PLATFORM,0,DECK-3.65,-9),box(14,.12,14,SOOT,0,DECK+.03,0));
 for(const [x,z] of [[-6.2,-6.2],[6.2,-6.2],[6.2,6.2],[-6.2,6.2]])g.add(box(2.2,1.6,2.2,PLATFORM,x,DECK+.8,z));   // hold-down arms
 // The umbilical tower: an open steel frame 116 m tall on the north end of the platform, with a lift core inside.
 const lattice=[],cz=-24,h=6,levels=19,rise=116/levels,top=DECK+116;
 for(const x of [-h,h])for(const z of [cz-h,cz+h])lattice.push([x,DECK,z,x,top,z,.9]);
 for(let i=0;i<=levels;i++){
  const y=DECK+i*rise;
  lattice.push([-h,y,cz-h,h,y,cz-h,.45],[h,y,cz-h,h,y,cz+h,.45],[h,y,cz+h,-h,y,cz+h,.45],[-h,y,cz+h,-h,y,cz-h,.45]);
  if(i<levels){const y2=y+rise,f=i%2?1:-1;lattice.push([-h*f,y,cz-h,h*f,y2,cz-h,.3],[-h*f,y,cz+h,h*f,y2,cz+h,.3],[-h,y,cz-h*f,-h,y2,cz+h*f,.3],[h,y,cz-h*f,h,y2,cz+h*f,.3]);}
 }
 // The hammerhead crane and lightning mast on top. The boom lies east to west, clear of the rocket's path.
 lattice.push([-16,top+5,cz,30,top+5,cz,2.2],[-16,top+8.5,cz,2,top+8.5,cz,.5],[2,top+8.5,cz,30,top+5.6,cz,.4],[0,top,cz,0,top+9,cz,3],[0,top+9,cz,0,top+24,cz,.35]);
 g.add(bars(lattice,RED),box(5.5,116,5.5,DARKRED,0,DECK+58,cz),box(7,4,5,DARKRED,-13,top+3,cz));
 // Nine swing arms from the tower to the rocket, each hinged at the tower so it can swing clear at liftoff.
 const arms=[];
 for(const [y,r,last] of [[18,5.05],[38,5.05],[47,5.05],[60,5.05],[67.5,4.4],[75,3.3],[84,3.3],[96,1.95],[102.5,1.95,true]]){
  const pivot=new THREE.Group(),reach=18-r-.7;pivot.position.set(0,DECK+y,-18);
  pivot.add(box(2.6,2.1,reach,DARKRED,0,0,reach/2));
  if(last)pivot.add(box(4.2,3.4,4.6,PALE,0,.4,reach-2.3));else pivot.add(box(3.2,2.6,1.2,PLATFORM,0,0,reach-.6));
  g.add(pivot);arms.push(pivot);
 }
 // Around the pad: liquid oxygen and hydrogen spheres, floodlight masts, a water tank.
 for(const x of [-390,390]){const ball=new THREE.Mesh(new THREE.SphereGeometry(11,20,12),PALE);ball.position.set(x,13,-310);g.add(ball,box(3,4,3,PLATFORM,x,2,-310));}
 const masts=[];for(const [x,z] of [[-170,-150],[170,-150],[-170,170],[170,170]]){masts.push([x,0,z,x,46,z,.9]);g.add(box(9,3.5,1.2,PALE,x,47.5,z));}
 masts.push([150,0,-330,150,38,-330,1.4]);g.add(bars(masts,PLATFORM),box(9,7,9,PALE,150,41,-330));
 // The Vehicle Assembly Building, 5.5 km to the west-south-west: 160 m tall, with its four tall doors.
 const vab=new THREE.Group();vab.position.set(-5300,0,1400);vab.add(box(158,160,218,PALE,0,80,0),box(110,64,134,PALE,0,32,176));
 for(const z of [-72,-24,24,72])vab.add(box(1,138,26,mat(0x6f7378,0,.9),79.3,69,z));
 g.add(vab);
 g.userData.arms=arms;
 return g;
}
