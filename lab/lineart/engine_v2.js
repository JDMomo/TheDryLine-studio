/* Day-2 line-art engine: deterministic, stroke-only, no dependencies. */
(()=>{'use strict';
const TAU=Math.PI*2;
function rng(seed){let a=2166136261;for(const c of String(seed)){a^=c.charCodeAt(0);a=Math.imul(a,16777619)}return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const materials={
 cloth:{len:6,width:.72,bend:.42,contour:1.55}, metal:{len:7,width:.72,bend:.10,contour:1.7},
 stone:{len:4.2,width:.9,bend:.18,contour:1.8}, salt:{len:3.7,width:.72,bend:.12,contour:1.45},
 glass:{len:8,width:.55,bend:.28,contour:1.3}, glow:{len:7,width:.62,bend:.3,contour:1.25},
 wood:{len:7.5,width:.75,bend:.2,contour:1.55}, skin:{len:5.2,width:.68,bend:.5,contour:1.45}
};
const palettes={
 wanderer:['#171a1c','#343943','#667080','#b58a52','#e1c184'],
 rust:['#171a1c','#493a32','#76513c','#a97046','#d0a06b'],
 reef:['#171a1c','#3f3b50','#655f78','#9b91ad','#d1c8dd'],
 salt:['#171a1c','#3c4853','#718493','#adbfca','#e6edf0'],
 hall:['#171a1c','#34453b','#68643f','#a88d4e','#dbc176'],
 final:['#171a1c','#313653','#5d6690','#9aa4ce','#e2e5f2']
};
const E=(x,y,rx,ry,m='metal',rot=0)=>({kind:'ellipse',x,y,rx,ry,m,rot});
const P=(pts,m='metal')=>({kind:'poly',pts,m});
const specs={
 wanderer:{size:[48,56],parts:[E(0,-24,9,8,'cloth'),E(0,-7,14,19,'cloth'),E(-6,15,4,7,'cloth'),E(6,15,4,7,'cloth'),P([[8,-12],[19,-4],[12,0]],'cloth')]},
 strider:{size:[40,32],parts:[E(0,-2,17,9,'stone'),E(-15,8,7,3,'metal',-.3),E(15,8,7,3,'metal',.3),E(-9,10,6,3,'metal',.5),E(9,10,6,3,'metal',-.5)]},
 boiler:{size:[32,40],parts:[E(0,4,12,16,'salt'),E(0,-10,8,5,'metal'),E(0,2,6,7,'glass')]},
 rivet:{size:[48,40],parts:[E(3,0,11,7,'metal'),P([[-3,0],[-23,-11],[-15,4]],'metal'),P([[-2,3],[-21,13],[-11,5]],'metal'),E(16,-1,6,6,'glass')]},
 gearling:{size:[64,40],parts:[E(-18,10,8,8),E(18,10,8,8),E(0,1,27,8),E(0,-17,7,15),E(20,-2,5,5,'glass')]},
 scrapper:{size:[48,48],parts:[E(0,-2,14,18),E(-9,17,6,6),E(9,17,6,6),E(14,-1,10,17),E(0,-23,7,7,'glass')]},
 lamp_wisp:{size:[32,32],parts:[E(0,0,11,13,'metal'),E(0,1,6,9,'glow')]},
 brine_toad:{size:[48,40],parts:[E(0,5,17,12,'skin'),E(9,-5,8,8,'salt'),E(-11,-2,6,6,'salt')]},
 hanging_lamp:{size:[32,48],parts:[E(0,3,11,15),E(0,3,7,10,'glass'),E(0,-15,5,5)]},
 sapper:{size:[48,40],parts:[E(0,3,16,13),E(-10,16,6,4),E(10,16,6,4),E(0,-11,6,5),P([[2,-15],[9,-22],[7,-12]],'glow')]},
 harvester:{size:[56,56],parts:[E(0,-3,17,15),E(-9,-5,5,11,'glass'),E(7,-5,5,11,'glass'),E(-18,17,5,13),E(0,18,5,14),E(18,17,5,13)]},
 mirage:{size:[48,56],parts:[E(0,-20,9,8,'cloth'),P([[-8,-13],[11,-13],[17,19],[4,12],[-3,22],[-15,14]],'cloth'),P([[-8,4],[-24,14],[-10,12]],'cloth')]},
 tollkeeper:{size:[176,128],parts:[E(0,-12,58,37,'metal'),E(-40,23,18,16),E(40,23,18,16),E(50,-5,23,25,'wood'),E(0,23,28,10,'glow')]},
 lamp_heron:{size:[200,260],parts:[E(0,-35,32,24),E(-2,-95,10,48),E(-3,-147,18,18,'glass'),E(-21,35,8,62),E(22,35,8,62),P([[-24,-38],[-72,-8],[-28,-1]],'metal')]},
 switchman_idol:{size:[176,176],parts:[E(0,-5,48,55,'stone'),E(0,-42,21,17,'glass'),E(-35,50,15,22,'stone'),E(35,50,15,22,'stone')]},
 gatewhale:{size:[240,150],parts:[E(0,-5,92,46,'metal'),E(67,-4,31,28,'glass'),P([[-80,4],[-116,20],[-82,28]],'metal')]},
 long_clock:{size:[240,240],parts:[E(0,-15,76,76,'metal'),E(0,-15,58,58,'glass'),E(0,62,35,18,'metal'),P([[0,-15],[5,38],[-5,38]],'metal')]}
};
function inside(part,x,y){if(part.kind==='ellipse'){let c=Math.cos(-part.rot||0),s=Math.sin(-part.rot||0),dx=x-part.x,dy=y-part.y,X=dx*c-dy*s,Y=dx*s+dy*c;return X*X/(part.rx*part.rx)+Y*Y/(part.ry*part.ry)<=1}let q=false,a=part.pts;for(let i=0,j=a.length-1;i<a.length;j=i++){let A=a[i],B=a[j];if((A[1]>y)!=(B[1]>y)&&x<(B[0]-A[0])*(y-A[1])/(B[1]-A[1])+A[0])q=!q}return q}
function tangent(part,x,y){if(part.kind==='ellipse'){let dx=(x-part.x)/(part.rx*part.rx),dy=(y-part.y)/(part.ry*part.ry);return Math.atan2(dy,dx)+Math.PI/2+part.rot}return 0}
function draw(ctx,id,cx,cy,scale=1,palette='rust',seed=1,pose=0,fx={}){let sp=specs[id],r=rng(seed+'|'+id),pal=palettes[palette]||palettes.rust;ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);for(let pi=0;pi<sp.parts.length;pi++){let p=sp.parts[pi],mat=materials[p.m]||materials.metal,N=Math.max(70,Math.floor(450*scale/Math.max(1,scale))),box=sp.size;for(let i=0;i<N;i++){let xx=(r()-.5)*box[0],yy=(r()-.5)*box[1];if(!inside(p,xx,yy))continue;let light=(xx/box[0])*.4+(yy/box[1])*.6,shade=Math.max(0,Math.min(.999,.55+light)),idx=Math.min(4,Math.floor(shade*5));if(r()>.34+shade*.56)continue;let a=tangent(p,xx,yy)+(r()-.5)*mat.bend,L=mat.len*(.7+r()*.6),w=mat.width*(.72+shade*.72);ctx.strokeStyle=pal[idx];ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(xx-Math.cos(a)*L*.5,yy-Math.sin(a)*L*.5);ctx.quadraticCurveTo(xx+Math.cos(a+1.57)*mat.bend,yy+Math.sin(a+1.57)*mat.bend,xx+Math.cos(a)*L*.5,yy+Math.sin(a)*L*.5);ctx.stroke()}ctx.strokeStyle=pal[0];ctx.lineWidth=mat.contour;ctx.lineJoin='round';if(p.kind==='ellipse'){ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx,p.ry,p.rot||0,0,TAU);ctx.stroke()}else{ctx.beginPath();p.pts.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.stroke()}}
if(fx.hit){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.55;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(-sp.size[0]/2,-sp.size[1]/2,sp.size[0],sp.size[1])}
if(fx.defeat){ctx.globalAlpha=Math.max(0,1-fx.defeat);ctx.rotate(fx.defeat*.12)}
ctx.restore()}
function bake(id,palette,seed,frames=6){let sp=specs[id],c=document.createElement('canvas');c.width=sp.size[0]*frames;c.height=sp.size[1];let q=c.getContext('2d'),t=performance.now();for(let f=0;f<frames;f++)draw(q,id,sp.size[0]*(f+.5),sp.size[1]*.5,1,palette,seed,f);return{canvas:c,ms:performance.now()-t,bytes:c.width*c.height*4}}
window.LineArtV2={specs,palettes,materials,draw,bake};
})();