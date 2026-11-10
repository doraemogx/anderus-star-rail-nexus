/* Pure sync and encryption logic shared by the web UI and automated tests. */
export const ACCOUNT_KEY="anderus_nexus_v03";
export const SYNC_FIELDS=[
 "characters","v06RelicDetails","v06CustomCharacters","v06AccountNotes",
 "v06Goal","v06SavedTeams","v06MaterialInventory","v06TracePlans",
 "v06AscensionPlans","v06WarpPlan","v06BuildHistory",
 "favorites","v06Favorites","v06FavoriteCharacters","goals"
];
const isObject=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
export const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function clean(value,depth=0){
 if(depth>35)return undefined;
 if(typeof value==="string"){
  if(/^data:(?:image|video|audio)\//.test(value))return undefined;
  return value.length>250_000?undefined:value;
 }
 if(Array.isArray(value))return value.map(x=>clean(x,depth+1)??null);
 if(isObject(value)){
  const result={};
  for(const [k,v] of Object.entries(value)){
   if(k==="__proto__"||k==="constructor"||k==="prototype")continue;
   const mapped=clean(v,depth+1);
   if(mapped!==undefined)result[k]=mapped;
  }
  return result;
 }
 return value;
}
export function syncable(account){
 const out={};
 for(const field of SYNC_FIELDS){
  if(!Object.prototype.hasOwnProperty.call(account||{},field))continue;
  const value=clean(account[field]);
  if(value!==undefined)out[field]=value;
 }
 if(!isObject(out.characters))out.characters={};
 return out;
}
function mergeValue(base,local,cloud,path,conflicts,prefer){
 if(equal(local,cloud))return local;
 if(equal(local,base))return cloud;
 if(equal(cloud,base))return local;
 if(isObject(local)&&isObject(cloud)){
  const output={},keys=new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(cloud)]);
  for(const key of keys){
   if(["__proto__","constructor","prototype"].includes(key))continue;
   const merged=mergeValue(base?.[key],local[key],cloud[key],path?path+"."+key:key,conflicts,prefer);
   if(merged!==undefined)output[key]=merged;
  }
  return output;
 }
 conflicts.push(path||"registro");
 return prefer==="local"?local:cloud;
}
export function mergeAccount(base={},local={},cloud={},prefer="cloud"){
 const conflicts=[];
 const merged=mergeValue(base||{},syncable(local),syncable(cloud),"",conflicts,prefer);
 return {merged,conflicts};
}
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=buffer=>{
 const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
 let str="";for(let i=0;i<bytes.length;i+=16384)str+=String.fromCharCode(...bytes.slice(i,i+16384));
 return btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
const deb64=s=>{
 const clean=String(s).replace(/-/g,"+").replace(/_/g,"/");
 const bin=atob(clean+"=".repeat((4-clean.length%4)%4));
 return Uint8Array.from(bin,ch=>ch.charCodeAt(0));
};
export function makePair(){
 const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,"0")).join("");
 const secret=b64(crypto.getRandomValues(new Uint8Array(32)));
 return {id,secret};
}
export function validatePair(value){
 const data=typeof value==="string"?value.split("."):[value?.id,value?.secret];
 if(data.length!==2||!(/^[a-f0-9]{32}$/.test(data[0]))||!(/^[A-Za-z0-9_-]{43}$/.test(data[1])))throw Error("Código de conexão inválido.");
 if(deb64(data[1]).length!==32)throw Error("Chave de conexão inválida.");
 return {id:data[0],secret:data[1]};
}
export async function bearer(pair){
 const p=validatePair(pair);
 const bytes=encoder.encode("anderus-sync-client-auth-v1:"+p.secret);
 return b64(await crypto.subtle.digest("SHA-256",bytes));
}
async function aesKey(pair){
 const p=validatePair(pair);
 return crypto.subtle.importKey("raw",deb64(p.secret),{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
async function compress(bytes){
 if(typeof CompressionStream!=="function")return {bytes,zip:"none"};
 return {bytes:new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer()),zip:"gzip"};
}
async function decompress(bytes,zip){
 if(zip==="none")return bytes;
 if(zip!=="gzip"||typeof DecompressionStream!=="function")throw Error("O navegador não consegue descompactar os dados.");
 return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}
export async function encryptAccount(account,pair){
 const p=validatePair(pair);
 const serialized=encoder.encode(JSON.stringify(syncable(account)));
 const packed=await compress(serialized);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:encoder.encode("anderus-sync-v1:"+p.id)},
   await aesKey(p),packed.bytes);
 return {v:1,zip:packed.zip,iv:b64(iv),data:b64(encrypted)};
}
export async function decryptAccount(envelope,pair){
 const p=validatePair(pair);
 if(envelope?.v!==1||!["gzip","none"].includes(envelope.zip))throw Error("Formato do backup na nuvem não reconhecido.");
 const iv=deb64(envelope.iv),cipher=deb64(envelope.data);
 if(iv.length!==12||cipher.length<16)throw Error("Arquivo criptografado danificado.");
 let plain;
 try{
  plain=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:encoder.encode("anderus-sync-v1:"+p.id)},await aesKey(p),cipher));
 }catch(_){throw Error("A chave não corresponde à conta ou os dados estão danificados.")}
 const inflated=await decompress(plain,envelope.zip);
 if(inflated.length>12_000_000)throw Error("A conta remota excedeu o tamanho seguro.");
 const parsed=JSON.parse(decoder.decode(inflated));
 if(!isObject(parsed)||!isObject(parsed.characters))throw Error("Dados remotos incompletos.");
 return syncable(parsed);
}
export function pairingLink(pair,origin){
 const p=validatePair(pair);
 return String(origin).replace(/#.*$/,"").replace(/\/$/,"/")+"#nexus-sync="+encodeURIComponent(p.id+"."+p.secret);
}
