// The vehicles of an Apollo flight, drawn from simple shapes: the Saturn V's three stages, the command
// and service module, the lunar module and the parachutes. They are original drawings made in code from
// the published overall dimensions (heights and diameters in metres); small details are simplified and
// no markings, logos or flags are reproduced. Each part is built in metres with its base at y = 0 and
// its nose toward +y, then the caller scales the lot to kilometres.
import * as THREE from 'three';

const mat=(color,metalness=.1,roughness=.75,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const WHITE=mat(0xf1f0ec),BLACK=mat(0x18181a,.1,.6),SILVER=mat(0xc5c9cf,.3,.45),DARK=mat(0x3b3d42,.3,.5),GOLD=mat(0xd0a040,.35,.45),GREY=mat(0x8d9097,.25,.55),SHIELD=mat(0x5a4636,.2,.8),FABRIC=mat(0xf4f1ea,0,.9,{side:THREE.DoubleSide}),ORANGE=mat(0xe8742c,0,.9,{side:THREE.DoubleSide});
const mesh=(geometry,material,y=0)=>{const m=new THREE.Mesh(geometry,material);m.position.y=y;return m;};
// A tube or cone frustum standing on y = 0.
const tube=(bottom,top,height,material,segments=32)=>{const g=new THREE.CylinderGeometry(top,bottom,height,segments,1);g.translate(0,height/2,0);return new THREE.Mesh(g,material);};
// A white tube with black roll-pattern panels, the way the stages were painted so cameras could follow their roll.
function painted(radius,height,bands){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#f1f0ec';c.fillRect(0,0,256,256);c.fillStyle='#18181a';
 for(const [from,to,quarters] of bands)for(let q=0;q<4;q++)if(quarters==='all'||(quarters==='alt'&&q%2===0))c.fillRect(q*64,256*(1-to),quarters==='all'?256:64,256*(to-from));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 return tube(radius,radius,height,new THREE.MeshStandardMaterial({map:texture,metalness:.1,roughness:.7}),48);
}
const bell=(throat,exit,length,y)=>{const b=tube(exit,throat,length,DARK,20);b.position.y=y-length;return b;};
// A glowing exhaust plume pointing toward -y from y = 0. Hidden until a burn.
export function plume(radius,length,color=0xffc46b){
 const g=new THREE.ConeGeometry(radius,length,20,1,true);g.translate(0,-length/2,0);g.rotateX(Math.PI);g.translate(0,-length,0);
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 m.visible=false;m.userData.plume=true;return m;
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
 const flame=plume(1.6,26,0xbfd9ff);g.add(flame);
 g.userData={plume:flame,panels};
 return g;
}
// Command and service module. Base (engine bell exit) at y = 0; the docking probe is at the top.
export const CSM_LENGTH=2.9+SIZE.service+SIZE.command;
export function commandShip(){
 const g=new THREE.Group(),service=new THREE.Group(),command=commandModule();
 service.add(bell(.45,1.25,2.9,2.9));
 const body=tube(1.95,1.95,SIZE.service,SILVER,40);body.position.y=2.9;service.add(body);
 for(let i=0;i<4;i++){const a=i*Math.PI/2,radiator=mesh(new THREE.BoxGeometry(1.5,3.2,.06),WHITE);radiator.position.set(Math.cos(a)*1.96,5.2,Math.sin(a)*1.96);radiator.rotation.y=Math.PI/2-a;service.add(radiator);
  const quad=mesh(new THREE.BoxGeometry(.5,.5,.35),DARK);quad.position.set(Math.cos(a+Math.PI/4)*2.1,8.6,Math.sin(a+Math.PI/4)*2.1);service.add(quad);}
 const dish=mesh(new THREE.SphereGeometry(.7,12,6,0,Math.PI*2,0,Math.PI/3),WHITE);dish.position.set(2.2,2.6,0);dish.rotation.z=-Math.PI/2;service.add(dish);
 const flame=plume(1.1,14,0xcfe2ff);flame.position.y=0;service.add(flame);
 command.position.y=2.9+SIZE.service;
 g.add(service,command);g.userData={service,command,plume:flame};
 return g;
}
// The crew cabin: a blunt cone with its heat shield at the base (y = 0) and the docking tunnel at the top.
export function commandModule(){
 const g=new THREE.Group();
 g.add(tube(1.95,.55,SIZE.command-.4,SILVER,40));
 const cap=tube(.55,.4,.4,DARK,20);cap.position.y=SIZE.command-.4;g.add(cap);
 const shield=mesh(new THREE.SphereGeometry(4.6,32,8,0,Math.PI*2,Math.PI-.44,.44),SHIELD);shield.position.y=4.16;g.add(shield);
 const glow=mesh(new THREE.SphereGeometry(4.7,32,8,0,Math.PI*2,Math.PI-.5,.5),new THREE.MeshBasicMaterial({color:0xff9a4a,transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.y=4.2;g.add(glow);
 g.userData.glow=glow;
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
 const g=new THREE.Group(),descent=new THREE.Group(),ascent=new THREE.Group(),legs=[];
 const base=tube(2.1,2.1,1.7,GOLD,8);base.position.y=1.55;base.rotation.y=Math.PI/8;descent.add(base);
 descent.add(bell(.35,.85,1.3,1.55));
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2,leg=new THREE.Group();
  const strut=tube(.09,.09,3.9,GOLD,8);strut.position.set(2.0,3.05,0);strut.rotation.z=-2.42;leg.add(strut);
  const brace=tube(.05,.05,2.6,SILVER,6);brace.position.set(1.9,1.6,0);brace.rotation.z=-1.25;leg.add(brace);
  const pad=tube(.48,.4,.16,GOLD,16);pad.position.set(4.5,0,0);leg.add(pad);
  if(i===0){const ladder=mesh(new THREE.BoxGeometry(.5,2.6,.06),SILVER);ladder.position.set(3.2,1.75,0);ladder.rotation.z=-.62;leg.add(ladder);}
  leg.rotation.y=a;descent.add(leg);legs.push(leg);
 }
 const flameDown=plume(.9,9,0xdfe9ff);flameDown.position.y=.25;descent.add(flameDown);
 // Ascent stage: a short drum for the cabin, with the equipment bays and tanks as boxes around it.
 const cabin=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,1.9,20),GREY);cabin.rotation.z=Math.PI/2;cabin.position.set(.55,LM_DESCENT_TOP+1.25,0);ascent.add(cabin);
 const face=mesh(new THREE.BoxGeometry(.5,1.5,1.9),DARK);face.position.set(1.55,LM_DESCENT_TOP+1.2,0);ascent.add(face);
 const mid=mesh(new THREE.BoxGeometry(1.6,1.9,2.9),SILVER);mid.position.set(-.5,LM_DESCENT_TOP+1.05,0);ascent.add(mid);
 for(const z of [-1.75,1.75]){const tank=mesh(new THREE.BoxGeometry(1.5,1.3,.9),GREY);tank.position.set(-.3,LM_DESCENT_TOP+.95,z);ascent.add(tank);}
 const aft=mesh(new THREE.BoxGeometry(.8,1.5,1.9),BLACK);aft.position.set(-1.6,LM_DESCENT_TOP+1.1,0);ascent.add(aft);
 const tunnel=tube(.42,.42,.55,DARK,16);tunnel.position.set(0,LM_DESCENT_TOP+2.05,0);ascent.add(tunnel);
 const dish=mesh(new THREE.SphereGeometry(.42,12,6,0,Math.PI*2,0,Math.PI/3),WHITE);dish.position.set(-.2,LM_DESCENT_TOP+3,1.5);dish.rotation.x=Math.PI;ascent.add(dish);
 const mast=tube(.03,.03,.9,SILVER,6);mast.position.set(-.2,LM_DESCENT_TOP+2,1.5);ascent.add(mast);
 ascent.add(bell(.2,.4,.45,LM_DESCENT_TOP+.1));
 const flameUp=plume(.5,5,0xdfe9ff);flameUp.position.y=LM_DESCENT_TOP-.3;ascent.add(flameUp);
 g.add(descent,ascent);g.userData={descent,ascent,legs,plumeDown:flameDown,plumeUp:flameUp};
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
// A launch pad and tower, plain steel, for scale beside the rocket. Ground level at y = 0.
export function launchPad(){
 const g=new THREE.Group();
 const slab=tube(70,74,3,mat(0x8a8a86,0,.95),8);slab.position.y=-3;g.add(slab);
 const tower=new THREE.Group();
 for(const [x,z] of [[-5,-5],[5,-5],[5,5],[-5,5]]){const post=tube(.5,.5,116,DARK,6);post.position.set(x,0,z);tower.add(post);}
 for(let y=6;y<116;y+=11){const deck=mesh(new THREE.BoxGeometry(11,.6,11),GREY,y);tower.add(deck);}
 for(const y of [34,62,88,100]){const arm=mesh(new THREE.BoxGeometry(13,1.6,2.4),GREY,y);arm.position.x=10;tower.add(arm);}
 tower.position.x=-24;g.add(tower);
 return g;
}
