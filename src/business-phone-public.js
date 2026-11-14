// Retired public bulk endpoint. No contact reads, even for cached clients.
export function publicBusinessPhones(){
 return new Response(JSON.stringify({error:"contact_verification_required"}),{status:410,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}});
}
