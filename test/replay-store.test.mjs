import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {ReplayStore} from '../src/replay-store.mjs';
function fixture(fn){const dir=mkdtempSync(join(tmpdir(),'permit-'));try{fn(join(dir,'replay.db'));}finally{rmSync(dir,{recursive:true,force:true});}}
test('persistent consumption after reopen',()=>fixture(path=>{let s=new ReplayStore(path);try{assert.equal(s.has('permit'),false);s.add('permit');}finally{s.close();}s=new ReplayStore(path);try{assert.equal(s.has('permit'),true);assert.throws(()=>s.add('permit'));}finally{s.close();}}));
test('two connections cannot both insert',()=>fixture(path=>{const a=new ReplayStore(path),b=new ReplayStore(path);try{assert.equal(a.has('same'),false);assert.equal(b.has('same'),false);a.add('same');assert.throws(()=>b.add('same'));}finally{a.close();b.close();}}));
test('parameterized token',()=>fixture(path=>{const s=new ReplayStore(path);try{s.add("'); DROP TABLE consumed;--");assert.equal(s.has("'); DROP TABLE consumed;--"),true);s.add('other');assert.equal(s.has('other'),true);}finally{s.close();}}));
test('invalid token fails',()=>fixture(path=>{const s=new ReplayStore(path);try{assert.throws(()=>s.add(''));assert.throws(()=>s.has(null));}finally{s.close();}}));
test('memory store disallowed',()=>assert.throws(()=>new ReplayStore(':memory:')));
test('file URI cannot bypass persistent path check',()=>assert.throws(()=>new ReplayStore('file::memory:?cache=shared')));
test('consumption and digest-only outbox survive reopen',()=>fixture(path=>{
  let s=new ReplayStore(path);
  try{s.add('synthetic-permit');assert.deepEqual(s.pendingEvents(),[{seq:1,kind:'PERMIT_CONSUMED',tokenDigest:createHash('sha256').update('synthetic-permit').digest('hex'),permitDigest:null}]);}finally{s.close();}
  s=new ReplayStore(path);try{assert.equal(s.has('synthetic-permit'),true);assert.equal(s.pendingEvents().length,1);assert.deepEqual(s.pendingEvents(1),[]);}finally{s.close();}
}));
test('outbox failure rolls back consumed permit',()=>fixture(path=>{
  const s=new ReplayStore(path),db=new DatabaseSync(path);
  try{
    db.exec("CREATE TRIGGER reject_outbox BEFORE INSERT ON consumption_outbox BEGIN SELECT RAISE(ABORT,'test failure'); END;");
    assert.throws(()=>s.add('permit'));assert.equal(s.has('permit'),false);assert.deepEqual(s.pendingEvents(),[]);
  }finally{db.close();s.close();}
}));
test('outbox read range is bounded',()=>fixture(path=>{const s=new ReplayStore(path);try{for(const value of [-1,Infinity,1.5])assert.throws(()=>s.pendingEvents(value));for(const value of [0,1001,1.5])assert.throws(()=>s.pendingEvents(0,value));}finally{s.close();}}));
