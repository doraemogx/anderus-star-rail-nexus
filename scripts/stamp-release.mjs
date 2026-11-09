#!/usr/bin/env node
/**
 * Deployment-only version stamp. The checkout remains unmodified in GitHub:
 * GitHub Pages receives a sw.js whose cache key is derived from GITHUB_SHA.
 * This guarantees a changed SW script whenever the published commit changes.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function generate(sha,swSource,stamp=new Date().toISOString(),catalogue=null){
 assert.match(String(sha),/^[a-f0-9]{40}$/i,'Expected full Git commit SHA');
 const key='anderus-shell-'+sha.toLowerCase();
 const pattern=/const CACHE='anderus-shell-(?:dev|[a-f0-9]{40})';/;
 assert.match(swSource,pattern,'Missing deployment cache key template');
 const sw=swSource.replace(pattern,`const CACHE='${key}';`);
 const manifest={
  sha:sha.toLowerCase(),
  publishedAt:stamp,
  cacheKey:key,
  catalogueCheckedAt:catalogue?.checkedAt||null,
  catalogueSource:catalogue?.source||null,
  releaseMode:'github-pages'
 };
 return {sw,manifest};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sha=process.argv[2];
 const swFile=resolve(ROOT,'sw.js');
 const source=readFileSync(swFile,'utf8');
 let catalogue=null;
 try{catalogue=JSON.parse(readFileSync(resolve(ROOT,'data/live-game.json'),'utf8'));}
 catch(_){console.warn('Stamp: catalogue metadata not available.');}
 const {sw,manifest}=generate(sha,source,new Date().toISOString(),catalogue);
 writeFileSync(swFile,sw,'utf8');
 writeFileSync(resolve(ROOT,'build-meta.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
 console.log('Release built:',manifest.sha,'cache:',manifest.cacheKey);
}
