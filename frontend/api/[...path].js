// Vercel serverless proxy — forwards /api/* to Render backend
// Origin header is NOT forwarded, so Render never sees a CORS origin.
export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path || '');
  const target = `https://pawncalc.onrender.com/api/${path}`;

  const headers = {
    'content-type': 'application/json',
  };
  if (req.headers['authorization']) {
    headers['authorization'] = req.headers['authorization'];
  }

  try {
    const body = ['GET', 'HEAD'].includes(req.method)
      ? undefined
      : JSON.stringify(req.body);

    const upstream = await fetch(target, {
      method:  req.method,
      headers,
      body,
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ message: 'Proxy error', detail: err.message });
  }
}
