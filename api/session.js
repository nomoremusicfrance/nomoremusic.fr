const auth = require('../lib/auth');
const store = require('../lib/store');
module.exports = function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ admin: auth.isAdmin(req), storage: store.mode(), configured: auth.configured() });
};
