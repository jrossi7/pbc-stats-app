export default async function handler(req, res) {
  const { path } = req.query;

  if (!path || !path.startsWith('/services/')) {
    return res.status(400).json({ error: 'Caminho inválido' });
  }

  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    const r = await fetch('https://api.planningcenteronline.com' + path, {
      headers: { Authorization: auth },
    });

    // Rate limit do Planning Center: espera e tenta de novo uma vez
    if (r.status === 429) {
      const wait = parseInt(r.headers.get('Retry-After') || '2', 10);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      const retry = await fetch('https://api.planningcenteronline.com' + path, {
        headers: { Authorization: auth },
      });
      const retryData = await retry.json();
      return res.status(retry.status).json(retryData);
    }

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Falha na chamada à API', details: String(err) });
  }
}
