const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hmac(secret, msg) {
  return crypto.createHmac('sha256', secret).update(msg).digest('hex');
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((p) => {
    const idx = p.indexOf('=');
    if (idx > -1) out[p.slice(0, idx).trim()] = decodeURIComponent(p.slice(idx + 1).trim());
  });
  return out;
}

module.exports = async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const expectedPw = process.env.PAY_PASSWORD;
  const secret = process.env.SESSION_SECRET || expectedPw;
  if (!secret) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }
  const expected = hmac(secret, 'authenticated');
  if (cookies.pay_auth !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const dataPath = path.join(process.cwd(), 'data', 'pay-data.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);
  } catch (e) {
    res.status(500).json({ error: 'Could not read pay data: ' + e.message });
  }
};
