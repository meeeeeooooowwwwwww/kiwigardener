import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// Dependency-free PNG generator for the matching flat-green kiwi favicon family.
const crc=(b)=>{let c=-1;for(const n of b){c^=n;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^-1)>>>0;};
const chunk=(name,data)=>{const t=Buffer.from(name);const size=Buffer.alloc(4);size.writeUInt32BE(data.length);const sum=Buffer.alloc(4);sum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([size,t,data,sum]);};
const segment=(x,y,x1,y1,x2,y2)=>{const dx=x2-x1,dy=y2-y1,t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-x1-t*dx,y-y1-t*dy);};
const polygon=(x,y,p)=>{let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}return inside;};
function pixel(x,y){
 const body=((x-55)/43)**2+((y-61)/34)**2<1;
 const head=((x-96)/15)**2+((y-62)/17)**2<1;
 const beak=polygon(x,y,[[104,58],[127,68],[106,66]]);
 const legs=[[49,90,45,108],[45,108,36,112],[45,108,52,113],[77,86,75,104],[75,104,67,110],[75,104,83,109]].some(a=>segment(x,y,...a)<3.5);
 return body||head||beak||legs;
}
function png(size){
 const pad=Buffer.alloc(size*(size*4+1));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const row=y*(size*4+1);pad[row]=0;const i=row+1+x*4;
  const u=(x+.5)/size*128,v=(y+.5)/size*128;
  const on=pixel(u,v);pad[i]=45;pad[i+1]=113;pad[i+2]=68;pad[i+3]=on?255:0;
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",header),chunk("IDAT",deflateSync(pad)),chunk("IEND",Buffer.alloc(0))]);
}
export async function writeIconSet(dir){
 await Promise.all([[32,"favicon-32.png"],[180,"apple-touch-icon.png"],[192,"icon-192.png"],[512,"icon-512.png"]].map(([size,name])=>writeFile(join(dir,name),png(size))));
}
