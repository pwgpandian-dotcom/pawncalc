require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const connect      = require('./db/connect');

const app = express();

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// HTTP logger (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// CORS — allowlist from env; always allow Vercel deploys + localhost
const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / mobile apps
    if (
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost') ||
      extraOrigins.includes(origin)
    ) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));

// Global rate limiter — 200 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
}));

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later.' }
});

app.use(express.json({ limit: '1mb' }));

app.use('/api/auth',      authLimiter, require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/loans',     require('./routes/loans'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/staff',     require('./routes/staff'));

app.get('/health', (_, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));
app.get('/',       (_, res) => res.json({ status: 'PawnCalc API running', version: '2.0.0' }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('[ERROR]', err.stack || err.message);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connect().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
});
