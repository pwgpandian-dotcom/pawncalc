# PawnCalc — Railway Deploy Script
# Run from: C:\Users\dines\Desktop\pawncalc\backend
# Usage: .\deploy.ps1

Write-Host "`n=== PawnCalc Railway Deployment ===" -ForegroundColor Cyan

# 1. Init project (skip if already linked)
Write-Host "`n[1] Initializing Railway project..." -ForegroundColor Yellow
railway init

# 2. Set all production environment variables
Write-Host "`n[2] Setting environment variables..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set MONGO_URI="mongodb+srv://pandian:algammal123@cluster0.a9oulfp.mongodb.net/pawncalc?retryWrites=true&w=majority&appName=Cluster0"
railway variables set JWT_SECRET="5c58d737839a22b4bbae1761d05d9b4e19848bbfc0420ecdcba31fd2cc330b8c3890f3473af47c332d1a4b788ccd90903ddc4bfb0010ae7e13bb9a3283e0e601"
railway variables set JWT_EXPIRES_IN=7d
railway variables set ALLOWED_ORIGINS="https://pawncalc.vercel.app"

# 3. Deploy
Write-Host "`n[3] Deploying to Railway..." -ForegroundColor Yellow
railway up --detach

# 4. Get URL
Write-Host "`n[4] Getting deployment URL..." -ForegroundColor Yellow
railway domain

Write-Host "`n=== Deployment complete! ===" -ForegroundColor Green
Write-Host "Test your backend:" -ForegroundColor White
$url = railway domain 2>&1
Write-Host "  curl https://$url/health" -ForegroundColor Cyan
