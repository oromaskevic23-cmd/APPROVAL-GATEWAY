import {createHash,verify} from 'node:crypto';
import {permitBytes,consumePermit} from './index.mjs';
export function permitDigest(p){return createHash('sha256').update(permitBytes(p)).digest('hex');}
export function decisionBytes(p){
  if(!p||Object.keys(p).length!==6||!['v','permitDigest','policyEpoch','vetoEpoch','iat','exp'].every(k=>Object.hasOwn(p,k))||p.v!==1||typeof p.permitDigest!=='string'||!/^[a-f0-9]{64}$/.test(p.permitDigest)||![p.policyEpoch,p.vetoEpoch,p.iat,p.exp].every(Number.isSafeInteger)||p.policyEpoch<0||p.vetoEpoch<0||p.exp<=p.iat||p.exp-p.iat>30)throw Error('decision');
  return Buffer.from('IMPERIAL:approved-decision:v1\n'+JSON.stringify([p.v,p.permitDigest,p.policyEpoch,p.vetoEpoch,p.iat,p.exp]));
}
// The decision signer is a separately pinned trusted authority, not the agent.
export function consumeApprovedPermit(permit,decision,trust,expected,state,used,now){
  try{
    const {payload:p,signature:s}=decision, bytes=decisionBytes(p);
    if(!Number.isSafeInteger(now)||now<p.iat||now>=p.exp||!Number.isSafeInteger(state.policyEpoch)||p.policyEpoch!==state.policyEpoch||p.vetoEpoch!==state.epoch||p.permitDigest!==permitDigest(permit.payload))return false;
    if(trust.decisionKey.asymmetricKeyType!=='ed25519'||typeof s!=='string'||!/^[a-f0-9]{128}$/.test(s)||!verify(null,bytes,trust.decisionKey,Buffer.from(s,'hex')))return false;
    return consumePermit(permit,trust.permitKeys,expected,state,used,now);
  }catch{return false;}
}
