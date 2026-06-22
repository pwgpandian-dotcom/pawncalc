# PawnCalc — Production Deployment Guide

## Architecture

```
Browser
  │
  ▼
Vercel (Frontend — React/Vite)
  │  VITE_API_URL
  ▼
Railway (Backend — Node/Express)
  │  MONGO_URI
  ▼
MongoDB Atlas (Database)
```

---

## Step 1 — MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com → Create free cluster (M0)
2. Database Access → Add user with password (note credentials)
3. Network Access → Add IP `0.0.0.0/0` (allow all — Railway uses dynamic IPs)
4. Clusters → Connect → Drivers → Copy connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/pawncalc?retryWrites=true&w=majority
   ```

---

## Step 2 — Deploy Backend to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From the backend/ folder
cd backend
railway init          # create new project
railway up            # deploy

# Set environment variables in Railway dashboard or CLI:
railway variables set NODE_ENV=production
railway variables set MONGO_URI="mongodb+srv://..."
railway variables set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
railway variables set JWT_EXPIRES_IN=7d
railway variables set ALLOWED_ORIGINS="https://your-app.vercel.app"
```

After deploy, Railway gives you a URL like:
`https://pawncalc-backend-production.up.railway.app`

---

## Step 3 — Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# From the frontend/ folder
cd frontend

# Set production API URL
echo "VITE_API_URL=https://YOUR_RAILWAY_URL/api" > .env.production

# Deploy
vercel --prod
```

Or connect GitHub repo in Vercel dashboard and set:
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_URL=https://YOUR_RAILWAY_URL/api`

---

## Step 4 — First-Time Admin Setup

After backend is live, register the first admin account:

```bash
curl -X POST https://YOUR_RAILWAY_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"admin@yourshop.com","password":"StrongPass123"}'
```

The **first registration is always admin**. All subsequent registrations require an admin JWT.

---

## Environment Variables Reference

### Backend (.env / Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | Default: 5000 |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | 64-char random hex |
| `JWT_EXPIRES_IN` | No | Default: `7d` |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend URLs |

### Frontend (.env.production / Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL (no trailing slash) |

---

## Custom Domain

### Vercel (Frontend)
Dashboard → Your Project → Settings → Domains → Add domain

### Railway (Backend)
Dashboard → Your Service → Settings → Networking → Custom Domain

---

## Docker (Self-Hosted)

```bash
# Copy and fill in your env vars
cp backend/.env.example backend/.env
nano backend/.env

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend
```

---

## Security Checklist

- [ ] JWT_SECRET is 64+ random characters (not the default)
- [ ] MONGO_URI uses a dedicated database user (not root)
- [ ] ALLOWED_ORIGINS is set to your exact frontend URL (not *)
- [ ] NODE_ENV=production is set
- [ ] MongoDB Network Access restricts IPs where possible
- [ ] HTTPS enforced (automatic on Vercel + Railway)
- [ ] First admin account registered with strong password

---

## Folder Structure

```
pawncalc/
├── backend/
│   ├── src/
│   │   ├── app.js              — Express app (helmet, cors, rate-limit, morgan)
│   │   ├── db/connect.js       — MongoDB connection (Atlas in prod, in-memory in dev)
│   │   ├── middleware/
│   │   │   ├── auth.js         — JWT verification
│   │   │   └── requireRole.js  — Role-based access (admin/staff)
│   │   ├── models/
│   │   │   ├── User.js         — Admin + Staff accounts
│   │   │   ├── Customer.js     — Customer registry
│   │   │   └── Loan.js         — Loan lifecycle + payments
│   │   └── routes/
│   │       ├── auth.js         — Login, register (admin-gated), password change
│   │       ├── customers.js    — CRUD + validation
│   │       ├── loans.js        — Loan CRUD, payments, close/reopen
│   │       ├── dashboard.js    — Stats + recent loans
│   │       ├── reports.js      — Filtered reports
│   │       └── staff.js        — Staff management (admin only)
│   ├── .env.example
│   ├── Dockerfile
│   ├── railway.toml
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/index.js        — Axios instance + auth interceptor
│   │   ├── context/            — AuthContext, ThemeContext
│   │   ├── components/         — Layout, Sidebar, StatCard, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NewLoan.jsx     — Gold/Silver/item type selector
│   │   │   ├── ActiveLoans.jsx
│   │   │   ├── ClosedLoans.jsx
│   │   │   ├── OverdueLoans.jsx
│   │   │   ├── LoanDetail.jsx  — Payments, receipt print, close loan
│   │   │   ├── Customers.jsx
│   │   │   ├── Calculator.jsx
│   │   │   ├── Reports.jsx     — PDF + Excel export
│   │   │   └── Staff.jsx       — Admin-only user management
│   │   └── utils/
│   │       ├── calculations.js — Interest math
│   │       └── print.js        — Receipt + report print
│   ├── .env.example
│   ├── .env.production
│   └── vercel.json
│
├── docker-compose.yml
├── .gitignore
└── DEPLOY.md
```

---

## SaaS Expansion Plan (Future)

To scale PawnCalc into a multi-shop SaaS:

1. **Add `Shop` model** — each shop has its own subdomain, settings, and data
2. **Scope all queries by `shopId`** — add `shopId` field to Customer, Loan, User
3. **Subdomain routing** — use Express `vhost` or Nginx to route `shop1.pawncalc.com`
4. **Billing** — Stripe subscriptions per shop
5. **White-label** — per-shop logo, color, receipt header

Current schema is already preparation-friendly: all models have `createdBy` (User ref) and timestamps.
