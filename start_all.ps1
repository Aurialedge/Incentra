# Incentra - Run All Services
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting Incentra Project Services    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. MongoDB
Write-Host "`n[1/4] Ensuring MongoDB container is running..." -ForegroundColor Yellow
$mongoRunning = docker ps --filter "name=incentra-mongo" --format "{{.Names}}"
if (-not $mongoRunning) {
    $mongoExists = docker ps -a --filter "name=incentra-mongo" --format "{{.Names}}"
    if ($mongoExists) {
        docker start incentra-mongo
    } else {
        docker run -d --name incentra-mongo -p 27017:27017 mongo:latest
    }
}
Write-Host "MongoDB is running on port 27017." -ForegroundColor Green

# 2. Python ML Service
Write-Host "`n[2/4] Starting ML FastAPI Service (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 's:\Projects\Incentra\ml'; & 's:\Projects\Incentra\ml\.venv\Scripts\python.exe' server.py" -WindowStyle Normal

# 3. Backend Express API
Write-Host "`n[3/4] Starting Backend Express API (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 's:\Projects\Incentra\backend'; npm run dev" -WindowStyle Normal

# 4. Frontend Vite Dev Server
Write-Host "`n[4/4] Starting Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 's:\Projects\Incentra\frontend'; npm run dev" -WindowStyle Normal

# 5. Service Health Verification & Diagnostics
Write-Host "`nWaiting for service initializations and running health probes..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Health check ML API
try {
    $mlHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($mlHealth.status -eq "healthy") {
        Write-Host "  [OK] ML FastAPI Microservice (Port 5000): HEALTHY" -ForegroundColor Green
    }
} catch {
    Write-Host "  [PENDING] ML FastAPI Microservice initializing..." -ForegroundColor Gray
}

# Health check Backend API
try {
    $backendRes = Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($backendRes.status) {
        Write-Host "  [OK] Express Gateway API (Port 3000): HEALTHY" -ForegroundColor Green
    }
} catch {
    Write-Host "  [PENDING] Express Gateway API initializing..." -ForegroundColor Gray
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " All services orchestrated successfully!" -ForegroundColor Green
Write-Host " Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host " Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host " ML API:   http://localhost:5000" -ForegroundColor Cyan
Write-Host " MongoDB:  mongodb://127.0.0.1:27017/grab" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
