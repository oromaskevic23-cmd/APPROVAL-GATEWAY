import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {ensurePrivateDatabaseFile} from './secure-db.mjs';
// Compatible with consumePermit's synchronous has/add interface. A unique insert
// is the final replay gate even when separate processes race after has().
export class ReplayStore {
  #db;
  constructor(path) {
    ensurePrivateDatabaseFile(path);
    this.#db=new DatabaseSync(path);
    this.#db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS consumed (token TEXT PRIMARY KEY NOT NULL) STRICT; CREATE TABLE IF NOT EXISTS consumption_outbox (seq INTEGER PRIMARY KEY, token_digest TEXT NOT NULL, permit_digest TEXT) STRICT;');
  }
  #validate(token) {if(typeof token!=='string'||!token||token.length>2048) throw Error('token');}
  has(token) {this.#validate(token);return !!this.#db.prepare('SELECT 1 FROM consumed WHERE token=?').get(token);}
  add(token,permitDigest=null) {
    this.#validate(token);
    if(permitDigest!==null&&(typeof permitDigest!=='string'||!/^[a-f0-9]{64}$/.test(permitDigest)))throw Error('permit digest');
    const digest=createHash('sha256').update(token,'utf8').digest('hex');
    this.#db.exec('BEGIN IMMEDIATE');
    try {
      this.#db.prepare('INSERT INTO consumed(token) VALUES(?)').run(token);
      this.#db.prepare('INSERT INTO consumption_outbox(token_digest,permit_digest) VALUES(?,?)').run(digest,permitDigest);
      this.#db.exec('COMMIT');
      return this;
    } catch (error) {
      try {this.#db.exec('ROLLBACK');} catch {}
      throw error;
    }
  }
  // The host may read these durable records for delivery to its audit system.
  // This method does not claim that delivery or external anchoring occurred.
  pendingEvents(after=0,limit=100) {
    if (!Number.isSafeInteger(after)||after<0||!Number.isSafeInteger(limit)||limit<1||limit>1000) throw Error('range');
    return this.#db.prepare('SELECT seq, token_digest AS tokenDigest, permit_digest AS permitDigest FROM consumption_outbox WHERE seq>? ORDER BY seq LIMIT ?').all(after,limit)
      .map(row=>({seq:row.seq,kind:'PERMIT_CONSUMED',tokenDigest:row.tokenDigest,permitDigest:row.permitDigest}));
  }
  close(){this.#db.close();}
}
