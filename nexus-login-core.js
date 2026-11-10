/* Login phase 2: all credentials are derived and vaults encrypted on-device.
 * Cloudflare receives no plaintext password, pairing secret or recovery key.
 */
import {validatePair} from "./nexus-sync-core.js";
export const USERNAME="Anderus";
export const ITERATIONS=480000;
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=buffer=>{
 const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
 let out="";for(let i=0;i<bytes.length;i+=16384)
  out+=String.fromCharCode(...bytes.slice(i,i+16384));
 return btoa(out).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
const unb64=value=>{
 if(typeof value!=="string"||!/^[A-Za-z0-9_-]+$/.test(value))throw Error("Código inválido.");
 const s=value.replace(/-/g,"+").replace(/_/g,"/");
 return Uint8Array.from(atob(s+"=".repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
};
const sha256=async value=>new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(value)));
const aes=async raw=>crypto.subtle.importKey("raw",raw,"AES-GCM",false,["encrypt","decrypt"]);
const salt=()=>b64(crypto.getRandomValues(new Uint8Array(16)));
export function checkPassword(pass){
 if(typeof pass!=="string"||pass.length<12||pass.length>128)
  throw Error("Crie uma senha com pelo menos 12 caracteres (até 128).");
 return pass;
}
async function material(password,serverSalt){
 if(typeof password!=="string"||!password.length)throw Error("Informe sua senha.");
 const s=unb64(serverSalt);
 if(s.length!==16)throw Error("Formato de proteção da conta inválido.");
 const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:s,
  iterations:ITERATIONS,hash:"SHA-256"},key,512));
 return {proof:b64(bits.slice(0,32)),key:await aes(bits.slice(32,64))};
}
const recoverMaterial=async code=>{
 const cleaned=String(code||"").trim().replace(/\s/g,"");
 const raw=unb64(cleaned);
 if(raw.length!==32)throw Error("Código de recuperação inválido.");
 return {proof:b64(await sha256("anderus-login-recovery-proof-v1:"+cleaned)),
  key:await aes(await sha256("anderus-login-recovery-encryption-v1:"+cleaned))};
};
async function seal(pair,key,mode){
 const p=validatePair(pair),iv=crypto.getRandomValues(new Uint8Array(12));
 const data=encoder.encode(JSON.stringify(p));
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,
  additionalData:encoder.encode("anderus-login-vault-"+mode+"-v1")},key,data);
 return {v:1,iv:b64(iv),data:b64(cipher)};
}
async function reveal(vault,key,mode){
 if(vault?.v!==1)throw Error("Formato do login não reconhecido.");
 const iv=unb64(vault.iv),data=unb64(vault.data);
 if(iv.length!==12)throw Error("Chave protegida inválida.");
 try{
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv,
   additionalData:encoder.encode("anderus-login-vault-"+mode+"-v1")},key,data);
  return validatePair(JSON.parse(decoder.decode(plain)));
 }catch(_){throw Error("Não foi possível desbloquear a conta. Confira a senha ou código de recuperação.");}
}
export async function registerPayload(pair,password){
 const p=validatePair(pair),pass=checkPassword(password),s=salt(),recovery=b64(crypto.getRandomValues(new Uint8Array(32)));
 const pwd=await material(pass,s),rec=await recoverMaterial(recovery);
 return {payload:{username:USERNAME,roomId:p.id,salt:s,verifier:pwd.proof,
  recoveryVerifier:rec.proof,passwordVault:await seal(p,pwd.key,"password"),
  recoveryVault:await seal(p,rec.key,"recovery")},recovery};
}
export async function loginProof(password,status){
 if(!status?.configured||status.username!==USERNAME||status.iterations!==ITERATIONS)
  throw Error("A versão do login está desatualizada.");
 return material(password,status.salt);
}
export async function unlockPassword(password,status,vault){
 const derived=await loginProof(password,status);
 return reveal(vault,derived.key,"password");
}
export async function recoveryProof(code){
 return recoverMaterial(code);
}
export async function unlockRecovery(code,vault){
 const derived=await recoverMaterial(code);
 return reveal(vault,derived.key,"recovery");
}
