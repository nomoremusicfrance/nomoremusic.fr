/* Pont entre le site / le dashboard et l'API Vercel (/api/*).
   Il expose la même interface que celle utilisée jusqu'ici : window.claude.use('db' | 'assets'). */
(function () {
  if (window.claude && window.claude.use) return;
  var IS_ADMIN = /^\/admin/.test(location.pathname);
  var CHUNK = 3.5 * 1024 * 1024;

  function Err(code, status, detail) { var e = new Error(code); e.code = code; e.status = status; e.detail = detail || ''; return e; }
  function unauth() {
    try { window.dispatchEvent(new Event('nomore-unauth')); } catch (e) {}
  }
  function json(url, opt) {
    opt = opt || {}; opt.credentials = 'same-origin'; opt.cache = 'no-store';
    return fetch(url, opt).then(function (r) {
      return r.text().then(function (t) {
        var body = null; try { body = t ? JSON.parse(t) : null; } catch (e) {}
        if (r.status === 401) { unauth(); throw Err('unauthenticated', 401); }
        if (!r.ok) throw Err((body && body.error) || 'http_' + r.status, r.status, body && body.message);
        return body;
      });
    }, function () { throw Err('network', 0, 'Impossible de joindre le site (connexion Internet ?).'); });
  }

  /* ---- lecture ---- */
  var snap = null, snapAt = 0, dirty = false;
  function data() {
    if (snap && !dirty && Date.now() - snapAt < 1500) return snap;
    var fresh = IS_ADMIN || dirty;
    dirty = false; snapAt = Date.now();
    snap = json('/api/data' + (fresh ? '?fresh=' + Date.now() : ''));
    snap.catch(function () { snap = null; });
    return snap;
  }

  /* ---- écriture (file d'attente : un seul envoi à la fois, regroupé) ---- */
  var queue = [], busy = false;
  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    var batch = queue.splice(0);
    json('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops: batch.map(function (b) { return b.op; }) }) })
      .then(function () { dirty = true; batch.forEach(function (b) { b.res(); }); },
            function (e) { batch.forEach(function (b) { b.rej(e); }); })
      .then(function () { busy = false; pump(); });
  }
  function enqueue(op) { return new Promise(function (res, rej) { queue.push({ op: op, res: res, rej: rej }); pump(); }); }

  function newId() { return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  var DB = {
    collection: function (col) {
      return {
        get: function () {
          return data().then(function (d) {
            var rows = (d.collections && d.collections[col]) || [];
            return { docs: rows.map(function (r) {
              return { id: r.id, data: function () { return JSON.parse(JSON.stringify(r.data)); } };
            }) };
          });
        },
        doc: function (id) {
          id = id || newId();
          return {
            id: id,
            set: function (body) { return enqueue({ op: 'set', col: col, id: id, data: body }); },
            delete: function () { return enqueue({ op: 'delete', col: col, id: id }); }
          };
        }
      };
    }
  };

  /* ---- fichiers ---- */
  var EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
              mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac' };
  function typeOf(file) {
    var t = (file.type || '').toLowerCase();
    if (t) return t;
    var m = /\.([a-z0-9]+)$/i.exec(file.name || ''); return m ? (EXT[m[1].toLowerCase()] || '') : '';
  }
  function rid() { return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).slice(0, 24); }

  var ASSETS = {
    upload: function (file) {
      if (file.size > 40 * 1024 * 1024) return Promise.reject(Err('too_large'));
      var type = typeOf(file), id = rid(), n = Math.max(1, Math.ceil(file.size / CHUNK)), url = null, p = Promise.resolve();
      var i;
      function send(k) {
        return function () {
          var part = file.slice(k * CHUNK, Math.min(file.size, (k + 1) * CHUNK));
          return json('/api/upload?id=' + id + '&i=' + k + '&n=' + n + '&total=' + file.size + '&type=' + encodeURIComponent(type),
            { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: part })
            .then(function (r) { if (r && r.url) url = r.url; });
        };
      }
      for (i = 0; i < n; i++) p = p.then(send(i));
      return p.then(function () {
        if (!url) throw Err('upload_failed');
        return { id: url, url: url };
      });
    }
  };

  window.claude = {
    use: function (name) { return Promise.resolve(name === 'db' ? DB : name === 'assets' ? ASSETS : null); }
  };
})();
