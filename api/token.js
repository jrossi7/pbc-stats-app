export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'Código de autorização ausente' });
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/callback`;

  try {
    const r = await fetch('https://api.planningcenteronline.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.PC_CLIENT_ID,
        client_secret: process.env.PC_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao trocar o token', details: String(err) });
  }
}
