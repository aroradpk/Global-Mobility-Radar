import {restoreTracker,serializeTracker,trackerMaxBytes,type Tracker} from "./applicationTracker";
export const trackerVaultKey="gmr.tracker.encrypted.v1";
const ITERATIONS=310000;
const MAX_VAULT=3_000_000;
type Result<T>={ok:true;value:T}|{ok:false;error:string};
type Port=Pick<Storage,"getItem"|"setItem"|"removeItem">;
const fail=<T>(error:string):Result<T>=>({ok:false,error});
const hex=(a:Uint8Array)=>Array.from(a,b=>b.toString(16).padStart(2,"0")).join("");
const unhex=(s:string)=>Uint8Array.from(s.match(/../g)??[],x=>parseInt(x,16));
const b64=(a:Uint8Array)=>{let s="";for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s);};
const unb64=(s:string)=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
const aad=new TextEncoder().encode("gmr-tracker-v1");
async function key(passphrase:string,salt:Uint8Array){
 const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(passphrase),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt,iterations:ITERATIONS},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
const validPass=(s:string)=>typeof s==="string"&&s.length>=12&&s.length<=200;
export async function encryptTracker(t:Tracker,today:string,passphrase:string):Promise<Result<string>>{
 if(!validPass(passphrase)||!t.entries.length)return fail("Use a passphrase of 12–200 characters and a nonempty tracker.");
 try{
  const raw=new TextEncoder().encode(serializeTracker(t,today));
  if(raw.length>trackerMaxBytes)return fail("Tracker backup too large.");
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:aad},await key(passphrase,salt),raw);
  return {ok:true,value:JSON.stringify({kind:"gmr-encrypted-tracker",version:1,salt:hex(salt),iv:hex(iv),ciphertext:b64(new Uint8Array(cipher))})};
 }catch{return fail("Encryption unavailable. Use HTTPS or localhost; no checkpoint saved.");}
}
export async function decryptTracker(raw:string,today:string,passphrase:string,epoch=0):Promise<Result<Tracker>>{
 if(!validPass(passphrase)||typeof raw!=="string"||raw.length>MAX_VAULT)return fail("Invalid encrypted backup or passphrase.");
 try{
  const d=JSON.parse(raw);
  if(!d||d.kind!=="gmr-encrypted-tracker"||d.version!==1||typeof d.salt!=="string"||!(/^[0-9a-f]{32}$/.test(d.salt))||typeof d.iv!=="string"||!(/^[0-9a-f]{24}$/.test(d.iv))||typeof d.ciphertext!=="string"||d.ciphertext.length>MAX_VAULT)return fail("Unsupported encrypted tracker format.");
  const plaintext=await crypto.subtle.decrypt({name:"AES-GCM",iv:unhex(d.iv),additionalData:aad},await key(passphrase,unhex(d.salt)),unb64(d.ciphertext));
  return restoreTracker(new TextDecoder("utf-8",{fatal:true}).decode(plaintext),today,epoch);
 }catch{return fail("Could not unlock tracker. Check the passphrase and file integrity.");}
}
export function storeTrackerVault(storage:Port,raw:string):boolean{try{storage.setItem(trackerVaultKey,raw);return true;}catch{return false;}}
export function readTrackerVault(storage:Port):string|null{try{return storage.getItem(trackerVaultKey);}catch{return null;}}
export function clearTrackerVault(storage:Port):boolean{try{storage.removeItem(trackerVaultKey);return storage.getItem(trackerVaultKey)===null;}catch{return false;}}
