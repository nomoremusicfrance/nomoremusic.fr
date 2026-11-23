const crypto = require('crypto');
const store = require('../lib/store');

/* Formulaire de contact (public) : le message est d'abord ENREGISTRÉ (jamais perdu, visible dans /admin → Messages),
   puis envoyé par e-mail à hi@nomoremusic.fr (Resend si RESEND_API_KEY est défini, sinon FormSubmit). */
const TO = process.env.CONTACT_TO || 'hi@nomoremusic.fr';
const clip = function (v, n) { return String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, n); };

function withTimeout(ms) {
  const c = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = setTimeout(function () { if (c) c.abort(); }, ms);
  return { signal: c ? c.signal : undefined, done: function () { clearTimeout(t); } };
}

async function viaResend(m) {
  const to = withTimeout(8000);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Nomore <onboarding@resend.dev>', to: [TO], reply_to: m.email,
        subject: 'Nomore - nouvelle demande · ' + m.type,
        text: ['Nom : ' + m.name, 'Email : ' + m.email, 'Projet : ' + m.type, 'Date : ' + (m.when || '—'), 'Lieu : ' + (m.where || '—'), '', m.message || '—'].join('\n')
      }),
      signal: to.signal
    });
    return r.ok;
  } catch (e) { console.error('resend failed', e && e.message); return false; }
  finally { to.done(); }
}

async function viaFormsubmit(m) {
  const to = withTimeout(8000);
  try {
    const r = await fetch('https://formsubmit.co/ajax/' + TO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Origin': 'https://nomoremusic.fr', 'Referer': 'https://nomoremusic.fr/contact' },
      body: JSON.stringify({
        _subject: 'Nomore - nouvelle demande · ' + m.type, _replyto: m.email, _template: 'table', _captcha: 'false',
        Nom: m.name, Email: m.email, Projet: m.type, Date: m.when || '—', Lieu: m.where || '—', Message: m.message || '—'
      }),
      signal: to.signal
    });
    const j = await r.json().catch(function () { return {}; });
    if (!(r.ok && String(j.success) === 'true')) console.warn('formsubmit refused', r.status, j && j.message);
    return r.ok && String(j.success) === 'true';
  } catch (e) { console.error('formsubmit failed', e && e.message); return false; }
  finally { to.done(); }
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  if (clip(b._honey, 50)) return res.status(200).json({ ok: true });               /* champ piège : on fait semblant */
  const m = {
    name: clip(b.name, 120), email: clip(b.email, 160), type: clip(b.type, 300) || 'Autre demande',
    when: clip(b.when, 40), where: clip(b.where, 200), message: clip(b.message, 5000), lang: clip(b.lang, 5)
  };
  if (!m.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.email)) return res.status(400).json({ ok: false, error: 'invalid' });

  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const path = 'messages/' + stamp + '-' + crypto.randomBytes(8).toString('hex') + '.json';
  let saved = false, notified = false;
  try {
    await store.putFile(path, Buffer.from(JSON.stringify(Object.assign({ at: now.toISOString() }, m))), 'application/json');
    saved = true;
  } catch (e) { console.error('save failed', e && e.message); }

  notified = process.env.RESEND_API_KEY ? await viaResend(m) : await viaFormsubmit(m);
  if (saved && !notified) {
    /* trace dans le fichier : l'admin affiche « e-mail non envoyé » */
    try { await store.putFile(path, Buffer.from(JSON.stringify(Object.assign({ at: now.toISOString(), notified: false }, m))), 'application/json'); } catch (e) {}
  }
  if (!saved && !notified) return res.status(502).json({ ok: false, error: 'failed' });
  return res.status(200).json({ ok: true, saved: saved, notified: notified });
};
