/* Chiffrement des messages du formulaire (AES-256-GCM).
   Le stockage Blob du site est public : un message (nom, e-mail, texte) ne doit jamais y être écrit en clair.
   La clé est dérivée du secret de l'admin (MESSAGES_KEY, sinon ADMIN_SECRET, sinon ADMIN_PASSWORD) : sans lui, le fichier est illisible. */
const crypto = require('crypto');

let _key = null, _keyFor = null;
function secret() {
  const e = process.env;
  const s = e.MESSAGES_KEY || e.ADMIN_SECRET || e.ADMIN_PASSWORD || ((!e.VERCEL && e.NOMORE_LOCAL_STORE) ? 'nomore-dev-secret' : '');
  return String(s || '').trim();
}
function key() {
  const s = secret();
  if (!s) return null;
  if (_key && _keyFor === s) return _key;
  _key = crypto.scryptSync(s, 'nomore-messages-v1', 32); _keyFor = s;
  return _key;
}

/* objet → Buffer chiffré (JSON). Lève une erreur si aucun secret n'est défini : on n'écrit jamais en clair. */
function seal(obj) {
  const k = key();
  if (!k) throw new Error('ADMIN_SECRET (ou ADMIN_PASSWORD) manquant : les messages ne peuvent pas être chiffrés');
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.from(JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') }));
}

/* Buffer → objet. Les anciens messages (en clair, sans « v ») restent lisibles. Illisible → { unreadable: true }. */
function open(buf) {
  let j;
  try { j = JSON.parse(Buffer.from(buf).toString('utf8')); } catch (e) { return { unreadable: true }; }
  if (!j || j.v !== 1) return j;
  const k = key();
  if (!k) return { unreadable: true };
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(j.iv, 'base64'));
    d.setAuthTag(Buffer.from(j.tag, 'base64'));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(j.data, 'base64')), d.final()]).toString('utf8'));
  } catch (e) { return { unreadable: true }; }
}

module.exports = { seal, open };
