import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ReplayStore} from '../src/replay-store.mjs';

test('two processes cannot consume the same permit', {timeout:8000}, async()=>{
  const dir=mkdtempSync(join(tmpdir(),'replay-concurrency-')),path=join(dir,'replay.db');
  const initial=new ReplayStore(path);initial.close();
  const moduleUrl=new URL('../src/replay-store.mjs',import.meta.url).href;
  const source=`import {ReplayStore} from ${JSON.stringify(moduleUrl)};
    const s=new ReplayStore(process.argv[1]);process.stdout.write('READY\\n');
    process.stdin.once('data',()=>{try{s.add('same-permit');process.stdout.write('CONSUMED\\n');}catch{process.stdout.write('REJECTED\\n');}finally{s.close();}});`;
  const children=[];
  try{
    for(let i=0;i<2;i++){
      const child=spawn(process.execPath,['--input-type=module','-e',source,path],{stdio:['pipe','pipe','pipe']});
      let output='';
      const ready=new Promise((resolve,reject)=>{
        child.stdout.on('data',chunk=>{output+=chunk.toString();if(output.includes('READY\n'))resolve();});
        child.once('error',reject);child.once('exit',code=>{if(!output.includes('READY\n'))reject(Error('worker exited: '+code));});
      });
      const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>code===0?resolve(output):reject(Error('worker failed: '+code)));});
      children.push({child,ready,done});
    }
    await Promise.all(children.map(c=>c.ready));
    for(const c of children)c.child.stdin.end('go\n');
    const results=await Promise.all(children.map(c=>c.done));
    assert.equal(results.filter(x=>x.includes('CONSUMED\n')).length,1);
    assert.equal(results.filter(x=>x.includes('REJECTED\n')).length,1);
    const check=new ReplayStore(path);try{assert.equal(check.has('same-permit'),true);assert.equal(check.pendingEvents().length,1);}finally{check.close();}
  }finally{for(const c of children)if(c.child.exitCode===null)c.child.kill();rmSync(dir,{recursive:true,force:true});}
});
