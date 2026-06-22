# ⚖️ PawnCalc — Quick Start

## Prerequisites
- Node.js 18+
- MongoDB running locally (or update MONGO_URI in backend/.env)

## 1. Start MongoDB
Make sure MongoDB is running on localhost:27017
Or update `backend/.env` with your MongoDB Atlas URI.

## 2. Seed Admin Account (first time only)
```
cd backend
node src/seed.js
```
Login: admin@pawncalc.com / admin123

## 3. Start Backend
```
cd backend
npm run dev
```
Runs on http://localhost:5000

## 4. Start Frontend
```
cd frontend
npm run dev
```
Runs on http://localhost:5173

## Features
- Dashboard with charts
- New Loan Entry (with advance interest deduction)
- Active / Closed / Overdue Loan tracking
- Customer Management
- Interest Calculator (Payout + Settlement)
- Payment History Tracking
- Reports with PDF + Excel export
- Print Receipts
- Dark / Light mode
- JWT Authentication
