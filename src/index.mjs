import {verify} from 'node:crypto';
const fields=['v','kid','id','sub','org','aud','action','digest','epoch','iat','exp'];
export function permitBytes(p) {
  if (!p || Object.keys(p).length!==fields.length || fields.some(k=>!Object.hasOwn(p,k))) throw Error('shape');
  if (p.v!==1 || !['kid','id','sub','org','aud','action'].every(k=>typeof p[k]==='string' && p[k].length>0 && p[k].length<=128) || typeof p.digest!=='string' || !/^[a-f0-9]{64}$/.test(p.digest) || !['epoch','iat','exp'].every(k=>Number.isSafeInteger(p[k])) || p.epoch<0) throw Error('fields');
  return Buffer.from('IMPERIAL:permit:v1\n'+JSON.stringify(fields.map(k=>p[k])));
}
export function consumePermit(env,keys,expected,state,used,now) {
  try {
    const {payload:p,signature:s}=env; const bytes=permitBytes(p);
    if (!Number.isSafeInteger(now) || p.iat>now || p.exp<=now || p.exp-p.iat>120 || p.exp<=p.iat) return false;
    if (!['sub','org','aud','action','digest'].every(k=>typeof expected[k]==='string' && expected[k]===p[k])) return false;
    if (state.org!==p.org || state.epoch!==p.epoch || state.veto!==false || !Number.isSafeInteger(state.observedAt) || state.observedAt>now || now-state.observedAt>30) return false;
    const key=keys.get(p.kid);
    if (!key || key.asymmetricKeyType!=='ed25519' || typeof s!=='string' || !/^[a-f0-9]{128}$/.test(s) || !verify(null,bytes,key,Buffer.from(s,'hex'))) return false;
    const token=JSON.stringify([p.org,p.id]);
    if (used.has(token)) return false;
    used.add(token); return true;
  } catch { return false; }
}
