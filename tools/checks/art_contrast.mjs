// Rendered gameplay readability: sample the player's actual dark outline and a 6-10 px backdrop ring after a full game draw.
export default async ({page})=>{
 const r=await page.evaluate(async()=>{
  const ids=['hub','r1','r2','r3','r4','final'],out={},bad=[];
  const cv=document.querySelector('#game'),ctx=cv.getContext('2d');
  const lin=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)},lum=p=>.2126*lin(p[0])+.7152*lin(p[1])+.0722*lin(p[2]),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  const med=a=>{const b=a.slice().sort((x,y)=>x-y);return b[(b.length/2)|0]}, rgbmed=ps=>[med(ps.map(p=>p[0])),med(ps.map(p=>p[1])),med(ps.map(p=>p[2]))];
  for(const id of ids){
   G.debug.newRun(71); if(id==='hub')G.debug.gotoRoom('junction');else G.debug.gotoRoom(id==='final'?'main:final':'main:'+id); G.debug.step(3);
   const p=G.players[0],cam=G.cam,v=G.view,sx=v.scale,sy=v.sy||v.scale,x=(p.x-cam.x)*sx,y=(p.y-cam.y)*sy,w=p.w*sx,h=p.h*sy;
   await new Promise(requestAnimationFrame);
   const im=ctx.getImageData(0,0,cv.width,cv.height),pix=(x,y)=>{x=Math.max(0,Math.min(cv.width-1,x|0));y=Math.max(0,Math.min(cv.height-1,y|0));const k=(y*cv.width+x)*4;return[im.data[k],im.data[k+1],im.data[k+2],im.data[k+3]]};
   const body=[],ring=[];for(let yy=Math.floor(y-h-5*sx);yy<=Math.ceil(y+5*sx);yy+=Math.max(1,Math.round(sy)))for(let xx=Math.floor(x-w/2-5*sx);xx<=Math.ceil(x+w/2+5*sx);xx+=Math.max(1,Math.round(sx))){const q=pix(xx,yy),inside=xx>=x-w/2&&xx<=x+w/2&&yy>=y-h&&yy<=y;if(inside&&q[3]>200)body.push(q);else{const dx=Math.max(x-w/2-xx,0,xx-(x+w/2)),dy=Math.max(y-h-yy,0,yy-y),d=Math.hypot(dx/sx,dy/sy);if(d>=6&&d<=10&&q[3]>200)ring.push(q)}}
   if(!body.length||!ring.length){bad.push(id+' sampling empty');continue}
   body.sort((a,b)=>lum(a)-lum(b));const outline=rgbmed(body.slice(0,Math.max(6,Math.ceil(body.length*.18)))),back=rgbmed(ring),rr=ratio(outline,back);out[id]=+rr.toFixed(2);if(rr<3)bad.push(id+' '+rr.toFixed(2)+':1');
  }
  return{bad,out,errors:G.errors.slice()};
 });
 if(r.bad.length)throw new Error('rendered outline/backdrop contrast below 3:1: '+r.bad.join(', '));if(r.errors.length)throw new Error('G.errors: '+r.errors.join(' | '));return 'rendered outline/backdrop ratios '+JSON.stringify(r.out);
};