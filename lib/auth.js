const crypto = require('crypto');

const COOKIE = 'nm_admin';
const TTL = 60 * 60 * 24 * 30; /* 30 jours */

/* Secret qui signe la connexion. Jamais de valeur par défaut en production : sans ADMIN_SECRET ni ADMIN_PASSWORD, l'admin reste fermé. */
function secret() {
  const e = process.env;
  const s = e.ADMIN_SECRET || e.ADMIN_PASSWORD || ((!e.VERCEL && e.NOMORE_LOCAL_STORE) ? 'nomore-dev-secret' : '');
  return String(s || '').trim();
}
function configured() { return !!secret(); }
function sign(v) {
  const s = secret();
  if (!s) throw new Error('admin_not_configured');
  return crypto.createHmac('sha256', s).update(v).digest('hex');
}
function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function sha(t) { return crypto.createHash('sha256').update(t).digest('hex'); }

function checkPassword(pw) {
  pw = String(pw || '').trim();
  if (!pw) return false;
  const ref = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!ref) return false;                       /* sans ADMIN_PASSWORD, personne ne peut se connecter */
  return safeEq(sha(pw), sha(ref));
}

function makeCookie(req) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const val = exp + '.' + sign(String(exp));
  const secure = (req.headers['x-forwarded-proto'] || '').indexOf('https') === 0 ? '; Secure' : '';
  return COOKIE + '=' + val + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + TTL + secure;
}
function clearCookie() { return COOKIE + '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'; }

function isAdmin(req) {
  if (!configured()) return false;
  const raw = req.headers.cookie || '';
  const m = raw.split(/;\s*/).map(function (c) { return c.split('='); }).filter(function (p) { return p[0] === COOKIE; })[0];
  if (!m) return false;
  const parts = (m[1] || '').split('.');
  if (parts.length !== 2) return false;
  if (parseInt(parts[0], 10) < Math.floor(Date.now() / 1000)) return false;
  return safeEq(parts[1], sign(parts[0]));
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

module.exports = { checkPassword, makeCookie, clearCookie, isAdmin, sleep, configured };
