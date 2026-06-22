// Vercel serverless proxy — strips Origin header, forwards to Render
export default async function handler(req, res) {
  const path = Array.isArray(req.query.path)
    ? req.query.path.join('/')
    : (req.query.path || '');

  const url = `https://pawncalc.onrender.com/api/${path}`;

  const headers = { 'content-type': 'application/json' };
  if (req.headers['authorization']) {
    headers['authorization'] = req.headers['authorization'];
  }

  // Vercel doesn't auto-parse body — read raw stream
  let body = undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    if (req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else {
      body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data || undefined));
      });
    }
  }

  try {
    const upstream = await fetch(url, { method: req.method, headers, body });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ message: 'Proxy error: ' + err.message });
  }
}
