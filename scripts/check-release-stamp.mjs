#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate} from './stamp-release.mjs';
const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const sha='a'.repeat(40),second='b'.repeat(40);
const a=generate(sha,source,'2026-11-09T20:00:00.000Z',{checkedAt:'2026-11-09'});
const b=generate(second,source,'2026-11-09T20:00:00.000Z');
assert.match(a.sw,/const CACHE='anderus-shell-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'/);
assert.notEqual(a.sw,b.sw,'Each deployment must invalidate old shell cache');
assert.equal(a.manifest.sha,sha);
assert.equal(a.manifest.cacheKey,'anderus-shell-'+sha);
assert.equal(a.manifest.catalogueCheckedAt,'2026-11-09');
assert.equal(a.manifest.publishedAt,'2026-11-09T20:00:00.000Z');
assert.ok(!/anderus-shell-dev/.test(a.sw),'Development placeholder must not be published');
assert.throws(()=>generate('invalid',source),/SHA/);
console.log('PASS immutable commit cache, manifest parity, distinct deployments and invalid SHA rejection');
