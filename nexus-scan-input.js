/* Nexus Scan 2.0 / input adapters: drop, file picker, paste. */
(function(){
'use strict';
if(window.NexusScanInput)return;
const supported=new Set(['image/png','image/jpeg','image/webp']);
function root(){
 const field=document.querySelector('#v06-file');
 if(!field)return null;
 const parent=field.closest('.v06-import');
 return parent&&parent.isConnected?parent:null;
}
function status(message){
 const output=document.querySelector('#v06-import-status');
 if(output)output.textContent=message;
}
function handle(file,method){
 if(!file||!supported.has(file.type)){
  status('Imagem não aceita. Utilize PNG, JPG ou WEBP.');return false;
 }
 if(!file.size||file.size>12*1024*1024){
  status('Arquivo inválido ou maior que 12 MB. Escolha uma imagem menor.');return false;
 }
 if(!root()||typeof window.v06ReadPrint!=='function')return false;
 status('Imagem recebida por '+method+'. Preparando a revisão…');
 Promise.resolve(window.v06ReadPrint(file)).catch(error=>{
  status('A imagem não pôde ser processada. O cadastro manual continua disponível.');
  console.warn('Nexus Scan input',error);
 });
 return true;
}
function mount(){
 if(mount.done)return;mount.done=true;
 document.addEventListener('dragover',event=>{
  const target=event.target.closest?.('.v06-import-drop');
  if(!target||!root())return;
  event.preventDefault();
  if(event.dataTransfer)event.dataTransfer.dropEffect='copy';
  target.classList.add('nexus-scan-dragging');
 });
 document.addEventListener('dragleave',event=>{
  event.target.closest?.('.v06-import-drop')?.classList.remove('nexus-scan-dragging');
 });
 document.addEventListener('drop',event=>{
  const target=event.target.closest?.('.v06-import-drop');
  if(!target||!root())return;
  event.preventDefault();target.classList.remove('nexus-scan-dragging');
  handle([...event.dataTransfer?.files||[]].find(f=>supported.has(f.type))||event.dataTransfer?.files?.[0],'arrastar e soltar');
 });
 document.addEventListener('paste',event=>{
  if(!root())return;
  if(event.target.closest?.('input,textarea,[contenteditable="true"]'))return;
  const items=[...(event.clipboardData?.items||[])];
  const candidate=items.find(item=>item.kind==='file'&&supported.has(item.type));
  if(!candidate)return;
  const file=candidate.getAsFile();
  if(!file)return;
  event.preventDefault();
  handle(file,'colagem');
 });
}
window.NexusScanInput={handle,mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();