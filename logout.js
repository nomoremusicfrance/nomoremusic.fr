const auth = require('../lib/auth');
module.exports = function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', auth.clearCookie());
  res.status(200).json({ ok: true });
};
