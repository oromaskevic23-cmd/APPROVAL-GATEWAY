import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ReplayStore} from '../src/replay-store.mjs';
function fixture(fn){const dir=mkdtempSync(join(tmpdir(),'permit-'));try{fn(join(dir,'replay.db'));}finally{rmSync(dir,{recursive:true,force:true});}}
test('persistent consumption after reopen',()=>fixture(path=>{let s=new ReplayStore(path);try{assert.equal(s.has('permit'),false);s.add('permit');}finally{s.close();}s=new ReplayStore(path);try{assert.equal(s.has('permit'),true);assert.throws(()=>s.add('permit'));}finally{s.close();}}));
test('two connections cannot both insert',()=>fixture(path=>{const a=new ReplayStore(path),b=new ReplayStore(path);try{assert.equal(a.has('same'),false);assert.equal(b.has('same'),false);a.add('same');assert.throws(()=>b.add('same'));}finally{a.close();b.close();}}));
test('parameterized token',()=>fixture(path=>{const s=new ReplayStore(path);try{s.add("'); DROP TABLE consumed;--");assert.equal(s.has("'); DROP TABLE consumed;--"),true);s.add('other');assert.equal(s.has('other'),true);}finally{s.close();}}));
test('invalid token fails',()=>fixture(path=>{const s=new ReplayStore(path);try{assert.throws(()=>s.add(''));assert.throws(()=>s.has(null));}finally{s.close();}}));
test('memory store disallowed',()=>assert.throws(()=>new ReplayStore(':memory:')));
