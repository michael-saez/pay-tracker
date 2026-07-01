const crypto = require('crypto');

function hmac(secret, msg) {
  return crypto.createHmac('sha256', secret).update(msg).digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const password = body && body.password;
  const expectedPw = process.env.PAY_PASSWORD;
  if (!expectedPw) {
    res.status(500).json({ error: 'Server not configured — PAY_PASSWORD env var missing' });
    return;
  }
  if (!password || password !== expectedPw) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }
  const secret = process.env.SESSION_SECRET || expectedPw;
  const token = hmac(secret, 'authenticated');
  res.setHeader(
    'Set-Cookie',
    `pay_auth=${token}; Path=/; Max-Age=34560000; HttpOnly; Secure; SameSite=Lax`
  );
  res.status(200).json({ ok: true });
};
