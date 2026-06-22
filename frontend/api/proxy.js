// Vercel serverless function — proxies /api/* to Render without forwarding Origin
module.exports = async function handler(req, res) {
  const path = (req.query.path || '').replace(/^\//, '');
  const search = req.url.includes('?')
    ? '?' + req.url.split('?')[1].replace(/path=[^&]*&?/, '').replace(/&$/, '')
    : '';

  const target = `https://pawncalc.onrender.com/api/${path}${search}`;

  const headers = { 'content-type': 'application/json' };
  if (req.headers['authorization']) {
    headers['authorization'] = req.headers['authorization'];
  }

  let body = undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = await new Promise(resolve => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data || undefined));
    });
  }

  try {
    const upstream = await fetch(target, { method: req.method, headers, body });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ message: 'Proxy error: ' + err.message });
  }
};
