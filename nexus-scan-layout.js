/* Nexus Scan 2.0: input validation and deterministic supported-layout detection.
 * The identified layout does NOT imply correct OCR fields. Unsupported layouts
 * always retain manual editing; no guessed character stats or equipment.
 */
const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp']);
const MAX_BYTES=12*1024*1024;
export function validateScreenshot({type,size,name}={}){
 if(!IMAGE_TYPES.has(String(type||'').toLowerCase()))
  return {valid:false,reason:'Formato não suportado. Use PNG, JPG ou WEBP.'};
 if(!Number.isFinite(size)||size<=0||size>MAX_BYTES)
  return {valid:false,reason:'Imagem vazia ou acima de 12 MB. Escolha um arquivo menor.'};
 return {valid:true,reason:'',type:String(type),size,filename:String(name||'print')};
}
export function classifyScreenshot({width,height}={}){
 const w=Number(width),h=Number(height);
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<=0||h<=0)
  return {kind:'unknown',compatible:false,reason:'Resolução inválida',review:true};
 const ratio=w/h;
 if(w>=700&&h>=900&&ratio>=0.82&&ratio<=0.95)
  return {kind:'illustrated',compatible:true,reason:'Cartão ilustrado com seis posições esperadas',review:true};
 if(w>=700&&h>=600&&ratio>=1.02&&ratio<=1.18)
  return {kind:'battle',compatible:true,reason:'Registro de batalha com seis posições esperadas',review:true};
 if(w<700||h<600)
  return {kind:'small',compatible:false,reason:'Imagem pequena ou recortada: reconhecimento por coordenadas desativado',review:true};
 if(ratio<0.8)
  return {kind:'portrait',compatible:false,reason:'Print vertical não padronizado: reconhecimento por coordenadas desativado',review:true};
 if(ratio>1.6)
  return {kind:'landscape',compatible:false,reason:'Print horizontal não padronizado: reconhecimento por coordenadas desativado',review:true};
 return {kind:'other',compatible:false,reason:'Layout não reconhecido com segurança: informe os campos manualmente',review:true};
}
export function importField(value,method='ocr',source='imagem'){
 const present=value!==null&&value!==undefined&&String(value).trim()!=='';
 return {value:present?value:null,method,source,
  validation:present?'requires-review':'unrecognized',
  confidence:'não calibrada'};
}
