/* Nexus 2.0 — read-only bridge to the existing encrypted cloud.
 * Uses the SAME paired device credentials, never exposes them or writes
 * remotely, never modifies the legacy account record.
 */
import {bearer,validatePair,decryptAccount} from '../nexus-sync-core.js';
const N2=window.N2;
const PAIR_KEY='anderus_nexus_sync_pair_v1';
const API='https://nexia-ai-nexus.andrediascrm.workers.dev/api/sync/v1';
N2.hasCloudPair=()=>{
 try{return !!validatePair(JSON.parse(localStorage.getItem(PAIR_KEY)||'null'));}catch{return false;}
};
N2.cloudPull=async()=>{
 let pair;
 try{pair=validatePair(JSON.parse(localStorage.getItem(PAIR_KEY)||'null'));}
 catch{N2.note('Este navegador não possui uma conta antiga vinculada. Abra o Nexus anterior para conectar um aparelho.','error');return;}
 if(!confirm('Importar a cópia criptografada da nuvem para o Nexus 2.0? Nenhum dado será enviado de volta, e a conta original não será alterada.'))return;
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  let response;
  try{
   response=await fetch(API+'/'+pair.id,{
    method:'GET',headers:{Authorization:'Bearer '+await bearer(pair)},
    cache:'no-store',mode:'cors',signal:controller.signal
   });
  }finally{clearTimeout(timeout);}
  if(!response.ok)throw Error(response.status===404?'Nenhum backup remoto encontrado.':'Serviço de sincronização indisponível ('+response.status+').');
  const body=await response.json();
  const cloud=await decryptAccount(body.payload,pair);
  if(!cloud?.characters||typeof cloud.characters!=='object')throw Error('O backup remoto não possui o formato esperado');
  // Save a standalone exported rollback snapshot before adopting the cloud view.
  const previous=N2.snapshot();
  N2.download('anderus-nexus2-antes-importacao-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(previous,null,2));
  N2.data.importedLegacy=cloud;
  N2.data.cloudCheckedAt=Date.now();
  if(!N2.save())throw Error('Sem espaço de armazenamento no navegador');
  renderAll();
  navigate('account');
  N2.note('Cópia da nuvem carregada somente para leitura. A versão anterior não foi alterada.');
 }catch(e){
  N2.note('Importação da nuvem não concluída: '+e.message,'error');
 }
};
