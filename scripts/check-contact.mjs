import test from "node:test";
import assert from "node:assert/strict";
import {contactAPI,ready} from "../src/worker.js";
const site="https://kiwigardeners.com";
const good={name:"Test Gardener",email:"gardener@example.org",suburb:"Linwood",service:"Garden tidy-ups",message:"Please tidy my garden and remove green waste.",consent:true,token:"valid-example-token"};
const envBase={CONTACT_FORM_ENABLED:"true",EMAIL:{send:async()=>({messageId:"test-id"})},TURNSTILE_SECRET:"dummy-private-key",TURNSTILE_SITE_KEY:"dummy-public-key",CONTACT_LIMIT:{limit:async()=>({success:true})}};
const request=(data=good,opts={})=>new Request(site+"/api/contact",{method:"POST",headers:{"origin":site,"content-type":"application/json",...opts.headers},body:typeof data==="string"?data:JSON.stringify(data)});
const run=async (req,env=envBase,verified=true)=>{
  const original=globalThis.fetch;
  let sent=[];
  globalThis.fetch=async()=>new Response(JSON.stringify({success:verified,hostname:"kiwigardeners.com"}),{status:200,headers:{"content-type":"application/json"}});
  const scoped={...env,EMAIL:{send:async(msg)=>{sent.push(msg);return {messageId:"id"};}}};
  try{const response=await contactAPI(req,scoped);return {status:response.status,body:await response.json(),sent};}finally{globalThis.fetch=original;}
};
test("config disabled unless Cloudflare email, Turnstile and owner activation are present",async()=>{
  assert.equal(ready({...envBase,CONTACT_FORM_ENABLED:"false"}),false);
  assert.equal(ready({...envBase,TURNSTILE_SECRET:undefined}),false);
  assert.equal(ready(envBase),true);
  const out=await run(new Request(site+"/api/contact/config"),{...envBase,CONTACT_FORM_ENABLED:"false"});
  assert.equal(out.status,200);assert.deepEqual(out.body,{enabled:false});assert.equal(out.sent.length,0);
});
test("config returns a public site key only when all settings are ready",async()=>{
  const out=await run(new Request(site+"/api/contact/config"));assert.equal(out.status,200);assert.equal(out.body.siteKey,"dummy-public-key");
});
test("fails closed on missing email configuration",async()=>{
  const out=await run(request(),{...envBase,CONTACT_FORM_ENABLED:"false"});
  assert.equal(out.status,503);assert.equal(out.sent.length,0);
});
test("rejects cross-origin requests and missing origin",async()=>{
  for(const origin of ["https://evil.example",""]){const out=await run(request(good,{headers:{"origin":origin}}));assert.equal(out.status,403);assert.equal(out.sent.length,0);}
});
test("rejects invalid JSON and bad form values",async()=>{
  for(const item of ["{", {...good,email:"invalid"}, {...good,name:""}, {...good,suburb:""}, {...good,message:"hi"}, {...good,service:"spam\r\nBcc: attacker@example.com"}, {...good,consent:false}, {...good,token:""}]){
    const out=await run(request(item));assert.equal(out.status,400);assert.equal(out.sent.length,0);
  }
});
test("does not send on failed Turnstile token",async()=>{const out=await run(request(),envBase,false);assert.equal(out.status,403);assert.equal(out.sent.length,0);});
test("honeypot returns neutral response but never sends",async()=>{const out=await run(request({...good,company:"bot"}));assert.equal(out.status,200);assert.deepEqual(out.body,{ok:true});assert.equal(out.sent.length,0);});
test("rate limiting prevents email before Turnstile verification",async()=>{const out=await run(request(),{...envBase,CONTACT_LIMIT:{limit:async()=>({success:false})}});assert.equal(out.status,429);assert.equal(out.sent.length,0);});
test("valid request only sends to owner's fixed address and fixed sender",async()=>{
  const out=await run(request({...good,message:"Clean garden\nThanks"}));
  assert.equal(out.status,200);assert.equal(out.body.ok,true);assert.equal(out.sent.length,1);
  assert.equal(out.sent[0].to,"dallas@kiwigardeners.com");assert.equal(out.sent[0].from,"dallas@kiwigardeners.com");
  assert.equal(out.sent[0].replyTo,"gardener@example.org");assert.ok(out.sent[0].text.includes("Linwood"));
});
test("Cloudflare email send failure returns 502, never false success",async()=>{
  const previous=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({success:true,hostname:"kiwigardeners.com"}),{headers:{"content-type":"application/json"}});
  try{
    const response=await contactAPI(request(),{...envBase,EMAIL:{send:async()=>{throw new Error("smtp rejected");}}});
    assert.equal(response.status,502);assert.equal((await response.json()).ok,undefined);
  }finally{globalThis.fetch=previous;}
});
test("only POST requests and JSON accepted",async()=>{
  assert.equal((await run(new Request(site+"/api/contact"))).status,405);
  assert.equal((await run(request(good,{headers:{"content-type":"text/plain"}}))).status,415);
});
