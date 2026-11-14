import {DatabaseSync} from 'node:sqlite';
// Compatible with consumePermit's synchronous has/add interface. A unique insert
// is the final replay gate even when separate processes race after has().
export class ReplayStore {
  #db;
  constructor(path) {
    if (typeof path!=='string'||!path||path===':memory:') throw Error('persistent path required');
    this.#db=new DatabaseSync(path);
    this.#db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS consumed (token TEXT PRIMARY KEY NOT NULL) STRICT;');
  }
  #validate(token) {if(typeof token!=='string'||!token||token.length>2048) throw Error('token');}
  has(token) {this.#validate(token);return !!this.#db.prepare('SELECT 1 FROM consumed WHERE token=?').get(token);}
  add(token) {this.#validate(token);this.#db.prepare('INSERT INTO consumed(token) VALUES(?)').run(token);return this;}
  close(){this.#db.close();}
}
