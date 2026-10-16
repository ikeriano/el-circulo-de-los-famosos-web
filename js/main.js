import * as THREE from 'three';
const C=window.CONFIG||{oficial:false};
const OFF=!!C.oficial;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const S=ms=>new Promise(r=>setTimeout(r,ms));
const fmt=n=>n.toLocaleString('es-ES').replace(/,/g,'.')+' €';
const fmtN=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' €';
// ---------- ajustes ----------
const AJ=Object.assign({mus:60,sfx:80,voz:100,cal:/Android/.test(navigator.userAgent)?'baja':'media'},JSON.parse(localStorage.getItem('ec_aj')||'{}'));
const guardaAJ=()=>localStorage.setItem('ec_aj',JSON.stringify(AJ));
// ---------- escala UI ----------
function escala(){const w=innerWidth,h=innerHeight,s=Math.min(w/1280,h/720);$('#ui').style.transform=`translate(${-640*s}px,${-360*s}px) scale(${s})`;if(R)R.setSize(w,h,false),cam.aspect=w/h,cam.updateProjectionMatrix();}
// ---------- audio ----------
const AC=new (window.AudioContext||window.webkitAudioContext)();
const gSfx=AC.createGain(),gMus=AC.createGain();gSfx.connect(AC.destination);gMus.connect(AC.destination);
const aplicaVol=()=>{gSfx.gain.value=AJ.sfx/100;gMus.gain.value=AJ.mus/100*0.7;};aplicaVol();
const BUF={};
const SND=['tema','menu','spin','spinend','gold','red','bed','lock','right','wrong','cat','select','tick','intro','exit','sting','final'];
async function cargaSonidos(){if(!OFF)return;await Promise.all(SND.map(async k=>{try{const r=await fetch('assets/off/snd/'+k+'.mp3');BUF[k]=await AC.decodeAudioData(await r.arrayBuffer());}catch(e){}}));}
// sintetizados (versión web, sin sonidos oficiales)
function synth(k,dest){const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(dest);let d=.3;
 const env=(a,dd)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+dd);d=dd};
 if(k=='tick'){o.type='square';o.frequency.value=1800;env(.15,.05)}
 else if(k=='right'){o.type='triangle';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.12);o.frequency.setValueAtTime(784,t+.24);o.frequency.setValueAtTime(1046,t+.36);env(.35,1.1)}
 else if(k=='wrong'){o.type='sawtooth';o.frequency.setValueAtTime(220,t);o.frequency.linearRampToValueAtTime(110,t+.8);env(.3,1)}
 else if(k=='gold'){o.type='triangle';o.frequency.setValueAtTime(880,t);o.frequency.linearRampToValueAtTime(1760,t+.5);env(.35,1.2)}
 else if(k=='red'){o.type='square';o.frequency.setValueAtTime(160,t);o.frequency.setValueAtTime(120,t+.3);env(.3,1)}
 else if(k=='lock'||k=='select'){o.type='sine';o.frequency.value=k=='lock'?440:990;env(.3,.35)}
 else if(k=='spinend'||k=='sting'||k=='exit'){o.type='sine';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(60,t+.6);env(.5,.7)}
 else if(k=='cat'||k=='spin'){o.type='sine';o.frequency.setValueAtTime(200,t);o.frequency.linearRampToValueAtTime(600,t+1.5);env(.15,1.6)}
 else {o.type='sine';o.frequency.value=440;env(.1,.3)}
 o.start(t);o.stop(t+d+.05);}
function sfx(k){if(AC.state!='running')AC.resume();if(BUF[k]){const s=AC.createBufferSource();s.buffer=BUF[k];s.connect(gSfx);s.start();return s}synth(k,gSfx);}
let musSrc=null,musK=null;
const padNotes=[[220,277,330],[196,247,294],[175,220,262],[196,247,294]];
function musica(k){if(musK===k)return;paraMusica();musK=k;if(!k)return;
 if(BUF[k]){musSrc=AC.createBufferSource();musSrc.buffer=BUF[k];musSrc.loop=true;musSrc.connect(gMus);musSrc.start();return}
 // pad sintetizado
 const g=AC.createGain();g.gain.value=.05;g.connect(gMus);const os=[];let i=0;
 const tick=()=>{const ch=padNotes[i++%4];os.forEach(o=>o.stop());os.length=0;ch.forEach(f=>{const o=AC.createOscillator();o.type='triangle';o.frequency.value=f*(k=='bed'?1:.5);o.connect(g);o.start();os.push(o)})};
 tick();const iv=setInterval(tick,k=='bed'?1200:2400);musSrc={stop(){clearInterval(iv);os.forEach(o=>o.stop());g.disconnect()}};}
function paraMusica(){if(musSrc){try{musSrc.stop()}catch(e){}musSrc=null}musK=null}
const vozA=new Audio();
function voz(k){return new Promise(res=>{if(!AJ.voz){res();return}vozA.src='voz/'+k+'.mp3';vozA.volume=AJ.voz/100;vozA.onended=res;vozA.onerror=res;vozA.play().catch(res);setTimeout(res,9000)})}
// ---------- avatares inventados ----------
function avatar(seed,{piel,pelo,fondo,tipo}){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
 g.fillStyle=fondo;g.beginPath();g.arc(64,64,64,0,7);g.fill();
 g.fillStyle='rgba(255,255,255,.15)';g.beginPath();g.arc(64,150,62,0,7);g.fill();
 g.fillStyle=piel;g.beginPath();g.ellipse(64,66,30,36,0,0,7);g.fill();
 g.fillStyle=pelo;g.beginPath();
 if(tipo=='largo'){g.ellipse(64,52,36,30,0,Math.PI,0);g.fill();g.fillRect(28,52,14,52);g.fillRect(86,52,14,52)}
 else if(tipo=='mono'){g.ellipse(64,46,30,22,0,Math.PI,0);g.fill();g.beginPath();g.arc(64,22,14,0,7);g.fill()}
 else if(tipo=='calvo'){g.ellipse(64,44,22,8,0,Math.PI,0);g.fill()}
 else {g.ellipse(64,44,32,22,0,Math.PI,0);g.fill()}
 g.fillStyle='#1b1b2a';g.beginPath();g.arc(52,66,4,0,7);g.arc(76,66,4,0,7);g.fill();
 g.strokeStyle='#7a2a2a';g.lineWidth=3;g.beginPath();g.arc(64,78,11,.2,Math.PI-.2);g.stroke();
 g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=4;g.beginPath();g.arc(64,64,61,0,7);g.stroke();
 return c;}
const FAMOSOS=[
 {n:'LOLA BRILLO',p:'Cantante',cat:'MÚSICA',a:{piel:'#f2c9a0',pelo:'#e0457b',fondo:'#5a1d6e',tipo:'largo'}},
 {n:'TONI VALVERDE',p:'Actor',cat:'CINE Y TV',a:{piel:'#e8b58c',pelo:'#2b1a10',fondo:'#1d3e7a',tipo:'corto'}},
 {n:'MAITE ROBLES',p:'Escritora',cat:'ARTE Y LETRAS',a:{piel:'#f6d4b4',pelo:'#8a5a2b',fondo:'#6e3a1d',tipo:'mono'}},
 {n:'RUBÉN ATLAS',p:'Exfutbolista',cat:'DEPORTES',a:{piel:'#c98d62',pelo:'#111',fondo:'#1d6e3a',tipo:'corto'}},
 {n:'NIEVES SOL',p:'Divulgadora',cat:'CIENCIA',a:{piel:'#f0c8a8',pelo:'#d9d9e0',fondo:'#1d6a6e',tipo:'largo'}},
 {n:'PACO MAPAS',p:'Aventurero',cat:'GEOGRAFÍA',a:{piel:'#d9a074',pelo:'#5b3b1c',fondo:'#7a5a1d',tipo:'calvo'}},
 {n:'CARMEN ARCHIVO',p:'Historiadora',cat:'HISTORIA',a:{piel:'#eebf98',pelo:'#3a2a20',fondo:'#6e1d2a',tipo:'mono'}}];
FAMOSOS.forEach((f,i)=>{f.cv=avatar(i,f.a);f.url=f.cv.toDataURL()});
// ---------- 3D ----------
const cv=$('#gl');let R,scene,cam,wheelG,wheelTex,wheelCv,hubMesh,ledTex,chairs=[],podios=[],podTex=[];
const Q={baja:{pr:.7,aa:false,fps:30},media:{pr:1,aa:true,fps:60},alta:{pr:Math.min(devicePixelRatio,2),aa:true,fps:60}};
function wheelDraw(st){const g=wheelCv.getContext('2d'),W=1024,c=W/2;g.clearRect(0,0,W,W);
 const n=7,step=Math.PI*2/n;
 // anillo exterior con puntos amarillos
 g.fillStyle='#1a2a6a';g.beginPath();g.arc(c,c,512,0,7);g.fill();
 g.fillStyle='#0a1240';g.beginPath();g.arc(c,c,470,0,7);g.fill();
 for(let k=0;k<56;k++){const a=k/56*Math.PI*2;g.fillStyle=(k%2)?'#ffd23a':'#fff07a';g.beginPath();g.arc(c+Math.sin(a)*491,c-Math.cos(a)*491,10,0,7);g.fill()}
 for(let i=0;i<n;i++){const a0=i*step-step/2-Math.PI/2,a1=a0+step;const s=st.seg[i];
  const col=s.color=='gold'?['#ffcf3a','#e07a00']:s.color=='red'?['#ff5a4a','#c01010']:s.color=='hi'?['#7fe0ff','#1d8cff']:['#3aa8ff','#0a3cc0'];
  const gr=g.createRadialGradient(c,c,140,c,c,465);gr.addColorStop(0,col[1]);gr.addColorStop(.55,col[0]);gr.addColorStop(1,col[1]);
  g.fillStyle=gr;g.beginPath();g.moveTo(c,c);g.arc(c,c,465,a0,a1);g.closePath();g.fill();
  if(s.dim){g.fillStyle='rgba(0,0,30,.45)';g.fill()}
  g.strokeStyle='#e8f4ff';g.lineWidth=8;g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.cos(a0)*465,c+Math.sin(a0)*465);g.stroke();
  // franjas interiores
  g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=3;for(const r of[230,300,380]){g.beginPath();g.arc(c,c,r,a0+.02,a1-.02);g.stroke()}
  // texto radial
  g.save();g.translate(c,c);g.rotate(i*step);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
  g.font='900 '+(s.txt.length>11?34:42)+'px Arial Narrow,Arial';g.shadowColor='rgba(0,0,0,.6)';g.shadowBlur=6;
  g.translate(0,-372);g.fillText(s.txt,0,0);if(s.sub){g.font='700 24px Arial';g.fillText(s.sub,0,40)}g.restore();}
 g.strokeStyle='#cfe6ff';g.lineWidth=10;g.beginPath();g.arc(c,c,465,0,7);g.stroke();
 wheelTex.needsUpdate=true;}
function hubCanvas(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
 const gr=g.createRadialGradient(256,256,40,256,256,256);gr.addColorStop(0,'#3a4a6a');gr.addColorStop(.7,'#0e1a3a');gr.addColorStop(.86,'#dfe7f5');gr.addColorStop(1,'#8a98b0');
 g.fillStyle=gr;g.beginPath();g.arc(256,256,255,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=10;g.beginPath();g.arc(256,256,215,0,7);g.stroke();
 // flecha blanca hacia abajo (hacia la cámara)
 g.fillStyle='#fff';g.shadowColor='#7fc4ff';g.shadowBlur=20;g.beginPath();g.moveTo(226,300);g.lineTo(286,300);g.lineTo(286,400);g.lineTo(330,400);g.lineTo(256,500);g.lineTo(182,400);g.lineTo(226,400);g.closePath();g.fill();
 return c}
function ledCanvas(){const c=document.createElement('canvas');c.width=512;c.height=64;const g=c.getContext('2d');g.fillStyle='#02030a';g.fillRect(0,0,512,64);
 const cols=['#1d6aff','#ff2a7a','#ffb21e','#21d0ff','#8a3aff','#ff4a2a','#2aff9a'];
 for(let x=0;x<512;x+=4)for(let y=0;y<64;y+=4){if(Math.random()<.55){g.fillStyle=cols[(Math.random()*cols.length)|0];g.globalAlpha=.4+Math.random()*.6;g.fillRect(x,y,3,3)}}g.globalAlpha=1;return c}
function textoTex(t,col='#fff',bg='rgba(0,20,80,.85)'){const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,96);g.fillStyle=col;g.font='900 46px Arial Narrow,Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(t,256,50);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return [tx,c]}
function sillaProc(){const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:0xf4f6fa}),b=new THREE.MeshBasicMaterial({color:0x2ab4ff});
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.55,.65,.35,16),m);base.position.y=.18;g.add(base);
 const asiento=new THREE.Mesh(new THREE.BoxGeometry(1.1,.25,1),m);asiento.position.y=.7;g.add(asiento);
 const resp=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.9,.22),m);resp.position.set(0,1.6,-.45);g.add(resp);
 const l1=new THREE.Mesh(new THREE.BoxGeometry(.18,.9,1),m);l1.position.set(-.6,1,0);g.add(l1);const l2=l1.clone();l2.position.x=.6;g.add(l2);
 const led=new THREE.Mesh(new THREE.BoxGeometry(1.24,.06,.24),b);led.position.set(0,2.56,-.45);g.add(led);
 const led2=new THREE.Mesh(new THREE.BoxGeometry(.06,1.9,.24),b);led2.position.set(-.62,1.6,-.45);g.add(led2);const led3=led2.clone();led3.position.x=.62;g.add(led3);
 g.userData.led=b;return g}
let sillaOBJ=null;
async function cargaSillaOBJ(){if(!OFF)return;try{const {OBJLoader}=await import('../vendor/OBJLoader.js');const L=new OBJLoader();
 const o=L.parse(await (await fetch('assets/off/mesh/ChairHigh.obj')).text());
 const m=new THREE.MeshLambertMaterial({color:0xf4f6fa,side:THREE.DoubleSide});const geos=[];o.traverse(c=>{if(c.isMesh)geos.push(c.geometry)});
 const g=new THREE.Group();geos.forEach(ge=>{ge.computeBoundingBox();g.add(new THREE.Mesh(ge,m))});
 g.rotation.x=-Math.PI/2;const w=new THREE.Group();w.add(g);w.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(w);const sz=bb.getSize(new THREE.Vector3());const s=2.6/sz.y;
 const cc=bb.getCenter(new THREE.Vector3());g.position.set(-cc.x,-bb.min.y,-cc.z);const out=new THREE.Group();w.scale.setScalar(s);out.add(w);out.userData.rotY=0;sillaOBJ=out;}catch(e){console.warn('OBJ',e)}}
function silla(){if(sillaOBJ){const g=sillaOBJ.clone(true);const b=new THREE.MeshBasicMaterial({color:0x2ab4ff});const led=new THREE.Mesh(new THREE.TorusGeometry(.75,.05,6,24),b);led.rotation.x=Math.PI/2;led.position.y=.05;g.add(led);g.userData.led=b;return g}return sillaProc()}
const camT={p:new THREE.Vector3(0,10,18),l:new THREE.Vector3(0,0,0)},camC={p:new THREE.Vector3(0,10,18),l:new THREE.Vector3()};
const VIS={set:[[0,9.5,17.5],[0,0,0]],top:[[0,21,0.01],[0,0,0]],front:[[0,5,13],[0,1,2]],conc:[[0,5,21],[0,0,11.5]],menu:[[10,7,14],[0,0.5,0]]};
function vista(k,p,l){if(p){camT.p.set(...p);camT.l.set(...l)}else{camT.p.set(...VIS[k][0]);camT.l.set(...VIS[k][1])}}
function vistaSilla(i){const w=new THREE.Vector3();chairs[i].getWorldPosition(w);const dir=w.clone().setY(0).normalize();const p=w.clone().addScaledVector(dir,-4.2).setY(2.4);vista(null,[p.x,p.y,p.z],[w.x,1.5,w.z])}
function init3D(){const q=Q[AJ.cal]||Q.media;
 R=new THREE.WebGLRenderer({canvas:cv,antialias:q.aa,powerPreference:'high-performance'});R.setPixelRatio(q.pr);R.setSize(innerWidth,innerHeight,false);R.outputColorSpace=THREE.SRGBColorSpace;
 scene=new THREE.Scene();scene.background=new THREE.Color(0x01020a);scene.fog=new THREE.Fog(0x01020a,30,60);
 cam=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,100);
 scene.add(new THREE.HemisphereLight(0x9ac4ff,0x0a1030,1.6));const dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(4,12,8);scene.add(dl);
 // suelo exterior oscuro con anillos azules
 const fl=new THREE.Mesh(new THREE.CircleGeometry(16,48),new THREE.MeshLambertMaterial({color:0x050a1e}));fl.rotation.x=-Math.PI/2;fl.position.y=-.6;scene.add(fl);
 const anillo=(r,w,c,y)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r,r+w,64),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.y=y;scene.add(m);return m};
 // plataforma blanca de las sillas
 const plat=new THREE.Mesh(new THREE.CylinderGeometry(9.4,9.6,.6,56,1,true),new THREE.MeshLambertMaterial({color:0x0d2a7a}));plat.position.y=-.3;scene.add(plat);
 const top=new THREE.Mesh(new THREE.RingGeometry(6.2,9.4,56),new THREE.MeshLambertMaterial({color:0xe9edf5}));top.rotation.x=-Math.PI/2;top.position.y=0.01;scene.add(top);
 anillo(9.4,.18,0x2ab4ff,.02);anillo(6.05,.15,0x8fd0ff,.03);anillo(11.6,.12,0x1d6aff,-.58);anillo(13.2,.08,0x2ab4ff,-.58);
 // rueda
 wheelG=new THREE.Group();scene.add(wheelG);
 wheelCv=document.createElement('canvas');wheelCv.width=wheelCv.height=1024;wheelTex=new THREE.CanvasTexture(wheelCv);wheelTex.colorSpace=THREE.SRGBColorSpace;wheelTex.anisotropy=4;
 const wm=new THREE.Mesh(new THREE.CircleGeometry(6.05,64),new THREE.MeshBasicMaterial({map:wheelTex}));wm.rotation.x=-Math.PI/2;wm.position.y=.04;
 // el canvas dibuja el segmento 0 arriba (−y); en el plano eso es −z. Giramos para que el segmento 0 quede en +z como el resto de cálculos
 wm.rotation.z=Math.PI;wheelG.add(wm);
 const hub=new THREE.Mesh(new THREE.CircleGeometry(1.5,48),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(hubCanvas())}));hub.material.map.colorSpace=THREE.SRGBColorSpace;hub.rotation.x=-Math.PI/2;hub.position.y=.08;scene.add(hub);hubMesh=hub;
 // sillas y famosos sobre el anillo, giran con la rueda
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const g=new THREE.Group();g.position.set(Math.sin(a)*7.7,0,Math.cos(a)*7.7);g.rotation.y=a+Math.PI;const s=silla();g.add(s);
  const tx=new THREE.CanvasTexture(FAMOSOS[i].cv);tx.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx}));sp.scale.set(1.15,1.15,1);sp.position.set(0,1.75,0);g.add(sp);
  g.userData.led=s.userData.led;wheelG.add(g);chairs.push(g)}
 // pantallas LED alrededor
 const lc=ledCanvas();ledTex=new THREE.CanvasTexture(lc);ledTex.wrapS=THREE.RepeatWrapping;ledTex.repeat.set(6,1);ledTex.colorSpace=THREE.SRGBColorSpace;
 const led=new THREE.Mesh(new THREE.CylinderGeometry(19,19,4.5,48,1,true),new THREE.MeshBasicMaterial({map:ledTex,side:THREE.BackSide}));led.position.y=4.2;scene.add(led);
 const marco=new THREE.Mesh(new THREE.CylinderGeometry(18.9,18.9,.25,48,1,true),new THREE.MeshBasicMaterial({color:0x2ab4ff,side:THREE.BackSide}));marco.position.y=6.6;scene.add(marco);const m2=marco.clone();m2.position.y=1.8;scene.add(m2);
 // círculo de concursantes (abajo, delante)
 for(let i=0;i<4;i++){const a=(i-1.5)*.32;const g=new THREE.Group();g.position.set(Math.sin(a)*12.4,-.6,Math.cos(a)*12.4);g.rotation.y=a+Math.PI;
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.7,.8,1.1,20),new THREE.MeshLambertMaterial({color:0x1a2a5a}));b.position.y=.55;g.add(b);
  const l=new THREE.Mesh(new THREE.TorusGeometry(.75,.06,6,24),new THREE.MeshBasicMaterial({color:0x2ab4ff}));l.rotation.x=Math.PI/2;l.position.y=1.12;g.add(l);
  const [t,c]=textoTex('');const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));sp.scale.set(2.2,.42,1);sp.position.y=1.9;g.add(sp);
  g.userData={ring:l.material,tex:t,cv:c,sp};g.visible=false;scene.add(g);podios.push(g)}
 vista('menu');camC.p.copy(camT.p);camC.l.copy(camT.l);
 let last=0;const per=1000/q.fps;
 const loop=t=>{requestAnimationFrame(loop);if(t-last<per-2)return;const dt=Math.min(.1,(t-last)/1000);last=t;
  camC.p.lerp(camT.p,1-Math.pow(.03,dt));camC.l.lerp(camT.l,1-Math.pow(.03,dt));cam.position.copy(camC.p);cam.lookAt(camC.l);
  ledTex.offset.x+=dt*.02;if(modoMenu)wheelG.rotation.y+=dt*.08;
  R.render(scene,cam)};requestAnimationFrame(loop);}
// ---------- estado de la rueda ----------
const ST={seg:[]};
function segs(modo,extra={}){ST.seg=FAMOSOS.map((f,i)=>({txt:modo=='cat'?f.cat:f.n,sub:modo=='cat'?'':'',color:'blue',dim:juego&&juego.cerradas.has(f.cat)&&modo=='cat'}));
 if(extra.gold!=null)ST.seg[extra.gold].color='gold';if(extra.red!=null)ST.seg[extra.red].color='red';if(extra.hi!=null&&ST.seg[extra.hi].color=='blue')ST.seg[extra.hi].color='hi';wheelDraw(ST);
 chairs.forEach((c,i)=>{const col=ST.seg[i].color;c.userData.led&&c.userData.led.color.set(col=='gold'?0xffb21e:col=='red'?0xff2a2a:0x2ab4ff)});}
function rotA(){return wheelG.rotation.y}
async function giraA(idx,vueltas=3,dur=5200){const step=Math.PI*2/7;const cur=rotA();let tgt=-idx*step;const base=cur-((cur%(Math.PI*2))+Math.PI*2)%(Math.PI*2);tgt=base+tgt;while(tgt<cur+vueltas*Math.PI*2)tgt+=Math.PI*2;
 const s=sfx('spin');const t0=performance.now();let lastSeg=-1;
 await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/dur);const e=1-Math.pow(1-k,3.2);wheelG.rotation.y=cur+(tgt-cur)*e;
  const sg=Math.round(-wheelG.rotation.y/step);if(sg!==lastSeg){lastSeg=sg;if(!BUF.spin)sfx('tick')}
  if(k<1)requestAnimationFrame(f);else res()};f()});
 if(s)try{s.stop()}catch(e){}sfx('spinend');}
// ---------- UI helpers ----------
function pant(id){$$('.pant').forEach(p=>p.classList.toggle('oculto',p.id!==id));modoMenu=id==='menu'}
let modoMenu=true;
function cartel(t,cl=''){const c=$('#cartel');c.className=cl;c.textContent=t;c.classList.toggle('oculto',!t)}
function panel(tit,ops){return new Promise(res=>{const p=$('#panel');p.classList.remove('oculto');p.querySelector('.tit').textContent=tit;const o=p.querySelector('.ops');o.innerHTML='';
 ops.forEach((op,i)=>{const b=document.createElement('button');if(op.img){const im=new Image();im.src=op.img;b.append(im)}b.append(op.t);if(op.cls)b.className=op.cls;b.disabled=!!op.dis;b.onclick=()=>{sfx('select');p.classList.add('oculto');res(op.v!==undefined?op.v:i)};o.append(b)});
 juego&&juego.auto&&setTimeout(()=>{},0)})}
function hud(){$('#bote span').textContent=fmtN(juego.bote);const c=$('#cats');c.innerHTML='';FAMOSOS.forEach(f=>{const i=document.createElement('i');i.textContent=f.cat[0];i.title=f.cat;if(juego.cerradas.has(f.cat))i.className='ok';c.append(i)});}
function aviso(t,p){$('#aviso .t').textContent=t;$('#aviso .p').innerHTML=p;$('#aviso').classList.remove('oculto')}
// ---------- preguntas ----------
const usadas=new Set();
function preguntaDe(cat){const L=window.CATEGORIAS[cat];let c=L.filter(q=>!usadas.has(q[0]));if(!c.length){L.forEach(q=>usadas.delete(q[0]));c=L}const q=c[(Math.random()*c.length)|0];usadas.add(q[0]);
 const op=q.slice(1).map((t,i)=>({t,ok:i===0})).sort(()=>Math.random()-.5);return {t:q[0],op,cat}}
function hazPregunta(q,{jug,ayuda,color,final}){return new Promise(async res=>{const box=$('#qbox');box.classList.toggle('off',OFF);box.classList.remove('oculto');
 $('#qico').className=color||'';$('#qtxt').textContent=q.t;const A=$('#qans');A.innerHTML='';musica('bed');
 const bs=q.op.map((o,i)=>{const b=document.createElement('button');b.className='ans';b.textContent=o.t;A.append(b);return b});
 let fin=false;const T=final?45:30;const bar=$('#qtime i');bar.style.transition='none';bar.style.width='100%';requestAnimationFrame(()=>{bar.style.transition=`width ${T}s linear`;bar.style.width='0%'});
 const elegir=async i=>{if(fin)return;fin=true;clearTimeout(to);bar.style.transition='none';sfx('lock');if(i>=0)bs[i].classList.add('sel');await S(1300);
  const ok=i>=0&&q.op[i].ok;const ci=q.op.findIndex(o=>o.ok);bs[ci].classList.remove('sel');bs[ci].classList.add('ok');if(i>=0&&!ok)bs[i].classList.replace('sel','mal');
  bs.forEach((b,k)=>{if(k!==ci&&k!==i)b.classList.add('dim')});musica(null);sfx(ok?'right':'wrong');await S(2200);box.classList.add('oculto');$('#consejo').classList.add('oculto');res(ok)};
 const to=setTimeout(async()=>{await voz('tiempo');elegir(-1)},T*1000);
 if(ayuda){const f=FAMOSOS[ayuda.i];const c=$('#consejo');c.querySelector('.av').style.backgroundImage=`url(${f.url})`;c.querySelector('.tx').innerHTML=`<b>${f.n}</b><br>${ayuda.txt}`;c.classList.remove('oculto')}
 if(jug.cpu){await S(2500+Math.random()*2500);let i;const ci=q.op.findIndex(o=>o.ok);
  if(ayuda&&ayuda.sug>=0&&Math.random()<.85)i=ayuda.sug;else i=Math.random()<.55?ci:[0,1,2,3].filter(k=>k!==ci)[(Math.random()*3)|0];elegir(i)}
 else bs.forEach((b,i)=>b.onclick=()=>elegir(i));
 window.__ec&&(window.__ec.elegir=elegir,window.__ec.q=q);})}
function consejoDe(i,q,cat){const f=FAMOSOS[i];const experto=f.cat===cat;const ci=q.op.findIndex(o=>o.ok);const acierta=Math.random()<(experto?.92:.5);
 const sug=acierta?ci:[0,1,2,3].filter(k=>k!==ci)[(Math.random()*3)|0];const t=q.op[sug].t;
 const frases=experto?[`¡Esta es de lo mío! Es <b>${t}</b>, seguro.`,`Sin ninguna duda: <b>${t}</b>.`]:[`No es mi tema, pero creo que es <b>${t}</b>.`,`Me suena <b>${t}</b>... pero no estoy seguro.`,`Yo diría <b>${t}</b>, aunque es una corazonada.`];
 return {i,sug,txt:frases[(Math.random()*frases.length)|0]}}
// ---------- juego ----------
let juego=null;
async function nuevaPartida(jugadores,completo){juego={jug:jugadores,bote:0,cerradas:new Set(),completo,parar:false};usadas.clear();pant('juego');hud();cartel('');$('#turno').textContent='';
 podios.forEach((p,i)=>{p.visible=i<jugadores.length;if(p.visible){const c=p.userData.cv,g=c.getContext('2d');g.clearRect(0,0,512,96);g.fillStyle='rgba(0,20,80,.85)';g.fillRect(0,0,512,96);g.fillStyle='#fff';g.font='900 46px Arial Narrow,Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(jugadores[i].n,256,50);p.userData.tex.needsUpdate=true}});
 segs('fam');musica('tema');vista('set');
 if(completo){cartel('EL CÍRCULO DE LOS FAMOSOS');await voz('bienvenida');await S(400);await voz('famosos');musica('intro');
  for(let i=0;i<7&&!juego.parar;i++){await giraA(i,0,1600);vistaSilla(i);segs('fam',{hi:i});cartel(FAMOSOS[i].n+' · '+FAMOSOS[i].cat);sfx('select');await S(2300)}
  segs('fam');vista('top');cartel('SIETE FAMOSOS · SIETE CATEGORÍAS');await voz('cerrar');await S(600)}
 else {vista('top');cartel('¡A CERRAR EL CÍRCULO!');await voz('cerrar')}
 let jugIdx=-1;
 while(!juego.parar&&juego.cerradas.size<7){
  // círculo de concursantes
  vista('conc');cartel('CÍRCULO DE CONCURSANTES');musica('tema');await voz('quien');jugIdx=await giraConcursantes();const J=juego.jug[jugIdx];$('#turno').textContent='JUEGA: '+J.n;cartel(J.n);await S(900);
  let sigue=true;
  while(sigue&&!juego.parar&&juego.cerradas.size<7){
   // categoría
   vista('top');segs('cat');cartel('¡GIRA EL CÍRCULO DE CATEGORÍAS!');await voz('categoria');
   const abiertas=FAMOSOS.map((f,i)=>i).filter(i=>!juego.cerradas.has(FAMOSOS[i].cat));const ci=abiertas[(Math.random()*abiertas.length)|0];
   await waitTap(J);sfx('cat');await giraA(ci,2,4200);const cat=FAMOSOS[ci].cat;const ultima=juego.cerradas.size===6;
   segs('cat',{gold:ci});sfx('gold');cartel('CATEGORÍA: '+cat,'oro');await S(600);if(ultima)await voz('ultima');await voz('oro');
   segs('fam',{gold:ci});cartel('EXPERTO EN ORO: '+FAMOSOS[ci].n,'oro');await S(900);
   // el concursante marca a un famoso en rojo
   await voz('rojo');let red;
   if(J.cpu){await S(1500);const op=[0,1,2,3,4,5,6].filter(i=>i!==ci);red=op[(Math.random()*op.length)|0]}
   else red=await panel(J.n+', elige al famoso que marcas en ROJO (si el círculo para en él, pierdes el turno):',FAMOSOS.map((f,i)=>({t:f.n,img:f.url,cls:i===ci?'gold':'',dis:i===ci,v:i})));
   segs('fam',{gold:ci,red});sfx('red');cartel('EN ROJO: '+FAMOSOS[red].n,'rojo');await S(1100);
   // gira el círculo
   cartel('¡QUE GIRE EL CÍRCULO!');await voz('gira');await waitTap(J);const land=(Math.random()*7)|0;await giraA(land,3,5600);
   segs('fam',{gold:ci,red,hi:land});
   if(land===red){sfx('red');cartel('¡HA CAÍDO EN ROJO!','rojo');await voz('enrojo');sigue=false;break}
   const oro=land===ci;vistaSilla(land);
   if(oro){sfx('gold');cartel('¡ORO! 6.000 € EN JUEGO','oro');await voz('enoro')}else{cartel(FAMOSOS[land].n+' TE AYUDA · 3.000 €');await voz('enazul')}
   await voz('pregunta');const q=preguntaDe(cat);const ay=consejoDe(land,q,cat);
   const ok=await hazPregunta(q,{jug:J,ayuda:ay,color:oro?'oro':''});
   if(ok){const premio=oro?6000:3000;juego.bote+=premio;J.ganado=(J.ganado||0)+premio;juego.cerradas.add(cat);hud();cartel('¡CORRECTO! +'+fmtN(premio),'oro');await voz('correcta');
    if(juego.cerradas.size===7){await finalDe(J);return}
    cartel('¡CATEGORÍA CERRADA!');await voz('cerrada');}
   else{cartel('RESPUESTA INCORRECTA','rojo');await voz('incorrecta');sigue=false}
  }
  if(!juego.parar){sfx('exit');cartel('VUELVES AL CÍRCULO DE CONCURSANTES');await voz('baja');await S(500)}
 }}
function waitTap(J){if(J.cpu||!J)return S(900);return panel('Pulsa para girar',[{t:'🎡  ¡GIRAR!',cls:'gold'}])}
async function giraConcursantes(){const n=juego.jug.length;const pick=(Math.random()*n)|0;let k=0;const tot=n*3+pick+(n==1?3:0);
 for(let s=0;s<=tot;s++){k=s%n;podios.forEach((p,i)=>p.userData.ring.color.set(i===k?0xffb21e:0x2ab4ff));sfx('tick');await S(90+s*s*2.2)}
 sfx('select');return pick}
async function finalDe(J){musica('final');vista('front');cartel('¡'+J.n+' HA CERRADO EL CÍRCULO!','oro');await voz('cerrado');$('#turno').textContent='FINAL: '+J.n;
 await voz('final');cartel('PREGUNTA FINAL · BOTE '+fmtN(juego.bote),'oro');await voz('elige');
 let op;if(J.cpu){await S(1500);op=Math.random()<.6?1:0}else op=await panel(`Bote: ${fmtN(juego.bote)}. Solo una oportunidad:`,[{t:'💰 PLANTARSE ('+fmtN(juego.bote)+')',v:0},{t:'🎡 JUGÁRSELA: doble ('+fmtN(juego.bote*2)+') o mitad ('+fmtN(Math.floor(juego.bote/2))+')',cls:'gold',v:1}]);
 let premio=juego.bote;
 if(op===0){await voz('plantas')}
 else{const cats=Object.keys(window.CATEGORIAS);const q=preguntaDe(cats[(Math.random()*cats.length)|0]);vista('top');segs('fam');
  const ok=await hazPregunta(q,{jug:J,color:'oro',final:true});premio=ok?juego.bote*2:Math.floor(juego.bote/2);if(ok){sfx('gold');await voz('doble')}else await voz('mitad')}
 musica('tema');cartel(J.n+' SE LLEVA '+fmtN(premio),'oro');sfx('sting');vista('set');await voz('despedida');
 const rec=Math.max(premio,+localStorage.getItem('ec_record')||0);localStorage.setItem('ec_record',rec);
 const r=await panel(`${J.n} gana ${fmtN(premio)} · Récord: ${fmtN(rec)}`,[{t:'Jugar otra vez',cls:'gold',v:1},{t:'Menú',v:0}]);
 if(r)nuevaPartida(juego.jug.map(j=>({...j,ganado:0})),juego.completo);else salir()}
function salir(){if(juego)juego.parar=true;juego=null;$('#qbox').classList.add('oculto');$('#panel').classList.add('oculto');$('#consejo').classList.add('oculto');$('#pausa').classList.add('oculto');cartel('');musica('menu');segs('fam');vista('menu');pant('menu')}
// ---------- menú ----------
function setupJug(){const d=$('#sjug');d.innerHTML='';const nom=localStorage.getItem('ec_nombre')||'IKER';
 for(let i=0;i<4;i++){const r=document.createElement('div');r.className='j';r.innerHTML=`<input type="checkbox" ${i<4?'checked':''}> <input type="text" maxlength="12" value="${i?['ANA','LUIS','MARTA'][i-1]:nom}"> <label><input type="checkbox" ${i?'checked':''}> CPU</label>`;d.append(r)}}
const ACC={
 jugar(){const n=(localStorage.getItem('ec_nombre')||'IKER');nuevaPartida([{n}],false)},
 programa(){setupJug();pant('setup')},
 empezar(){const js=[...$$('#sjug .j')].map(r=>{const c=r.querySelectorAll('input');return c[0].checked?{n:(c[1].value||'JUGADOR').toUpperCase(),cpu:c[2].checked}:null}).filter(Boolean);if(!js.length)return;localStorage.setItem('ec_nombre',js[0].n);if(js.every(j=>j.cpu))js[0].cpu=false;nuevaPartida(js,true)},
 opciones(){$('#omus').value=AJ.mus;$('#osfx').value=AJ.sfx;$('#ovoz').value=AJ.voz;$('#ocal').value=AJ.cal;pant('opciones')},
 volver(){pant('menu')},
 clasica(){if(window.Android&&Android.abrirClasica){const r=Android.abrirClasica();if(r!=='ok')aviso('APP CLÁSICA','Para jugar a la app clásica instala también <b>ElCirculo-AppClasica-1.0.apk</b> (está en la misma release). Después, este botón la abrirá directamente.')}
  else aviso('APP CLÁSICA','La app clásica es la app original traducida al español y solo existe para Android: descarga <b>ElCirculo-AppClasica-1.0.apk</b> de la release en GitHub.')},
 cerraraviso(){$('#aviso').classList.add('oculto')},
 pausa(){$('#pausa').classList.remove('oculto')},seguir(){$('#pausa').classList.add('oculto')},salir};
document.addEventListener('click',e=>{const b=e.target.closest('[data-acc]');if(!b)return;if(AC.state!='running')AC.resume();if(musK==null&&!juego)musica('menu');sfx('select');ACC[b.dataset.acc]&&ACC[b.dataset.acc]()});
['omus','osfx','ovoz'].forEach(id=>$('#'+id).addEventListener('input',e=>{AJ[id.slice(1)]=+e.target.value;aplicaVol();guardaAJ()}));
$('#ocal').addEventListener('change',e=>{AJ.cal=e.target.value;guardaAJ();aviso('CALIDAD','Se aplicará la próxima vez que abras el juego.')});
window.addEventListener('resize',escala);
// logo
if(OFF){$('#logoimg').src='assets/off/img/logo.png'}else{$('#logoimg').classList.add('oculto');$('#logotxt').classList.remove('oculto')}
// arranque
init3D();escala();segs('fam');pant('menu');
Promise.all([cargaSonidos(),cargaSillaOBJ()]).then(()=>{if(sillaOBJ){chairs.forEach(c=>{const old=c.children[0];c.remove(old);const s=silla();c.add(s);c.userData.led=s.userData.led});segs('fam')}});
window.__ec={vista,giraA,segs,nuevaPartida,ACC,FAMOSOS,get juego(){return juego},hazPregunta,preguntaDe,consejoDe,vistaSilla,cartel,panel};
