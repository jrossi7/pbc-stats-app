export default function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/callback`;

  if (!process.env.PC_CLIENT_ID) {
    return res.status(500).json({ error: 'PC_CLIENT_ID não configurado no Vercel' });
  }

  const url =
    'https://api.planningcenteronline.com/oauth/authorize' +
    `?client_id=${process.env.PC_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&response_type=code' +
    '&scope=services';

  res.status(200).json({ url, redirectUri });
}
