import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {permitBytes} from '../src/index.mjs';
import {permitDigest,decisionBytes,consumeApprovedPermit} from '../src/decision-bound.mjs';
import {ReplayStore} from '../src/replay-store.mjs';
const a=generateKeyPairSync('ed25519'),d=generateKeyPairSync('ed25519');
const signed=(payload,bytes,key)=>({payload,signature:sign(null,bytes(payload),key.privateKey).toString('hex')});
const expected={sub:'agent',org:'demo',aud:'worker',action:'read',digest:'a'.repeat(64)};
const payload={v:1,kid:'a',id:'one',...expected,epoch:2,iat:100,exp:180};
const permit=signed(payload,permitBytes,a);
const decision=signed({v:1,permitDigest:permitDigest(payload),policyEpoch:5,vetoEpoch:2,iat:100,exp:130},decisionBytes,d);
const state={org:'demo',policyEpoch:5,epoch:2,veto:false,observedAt:100};
const trust={decisionKey:d.publicKey,permitKeys:new Map([['a',a.publicKey]])};
const consume=(p=permit,q=decision,s=state,used=new Set(),now=120)=>consumeApprovedPermit(p,q,trust,expected,s,used,now);
test('both signed authorities and one-time use',()=>{const used=new Set();assert.equal(consume(permit,decision,state,used),true);assert.equal(consume(permit,decision,state,used),false);});
test('missing decision denied',()=>assert.equal(consume(permit,null),false));
test('signed substitute permit denied',()=>assert.equal(consume(signed({...payload,id:'two'},permitBytes,a)),false));
test('policy change and veto deny',()=>{assert.equal(consume(permit,decision,{...state,policyEpoch:6}),false);assert.equal(consume(permit,decision,{...state,veto:true}),false);});
test('decision expiry and signature tampering denied',()=>{assert.equal(consume(permit,decision,state,new Set(),130),false);assert.equal(consume(permit,{...decision,signature:'0'.repeat(128)}),false);});
test('durable outbox binds the exact verified permit digest',()=>{
  const dir=mkdtempSync(join(tmpdir(),'approval-evidence-'));const store=new ReplayStore(join(dir,'replay.db'));
  try{assert.equal(consume(permit,decision,state,store),true);assert.equal(store.pendingEvents()[0].permitDigest,permitDigest(payload));}finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
