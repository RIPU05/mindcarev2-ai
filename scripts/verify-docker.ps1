# MindCare AI v2.0 - Docker Environment & Runtime Validation Script (PowerShell)

Write-Host "=== MindCare AI Docker Validation ===" -ForegroundColor Cyan

# 1. Run python check_docker.py to verify daemon status
python scripts/check_docker.py
if ($LASTEXITCODE -eq 0) {
    exit 0
}

# 2. Validate Docker Compose Configuration
Write-Host "Validating docker-compose.yml configuration..." -ForegroundColor Gray
docker compose config --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] docker-compose.yml syntax validation failed." -ForegroundColor Red
    exit 1
}
Write-Host "[PASS] Compose configuration valid." -ForegroundColor Green

# 3. Build containers
Write-Host "Building Docker containers..." -ForegroundColor Gray
docker compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Docker image build failed." -ForegroundColor Red
    exit 1
}
Write-Host "[PASS] Docker build succeeded." -ForegroundColor Green

# 4. Start container stack
Write-Host "Starting container stack..." -ForegroundColor Gray
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Failed to start Docker compose stack." -ForegroundColor Red
    exit 1
}

# 5. Poll health
Write-Host "Waiting for backend service health..." -ForegroundColor Gray
$attempts = 0
$maxAttempts = 15
$backendHealthy = $false

while ($attempts -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempts++
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8000/health/live" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($res.status -eq "alive") {
            $backendHealthy = $true
            break
        }
    } catch {
        # Retry
    }
}

if ($backendHealthy) {
    Write-Host "[PASS] Backend container is healthy and responding on http://localhost:8000/health/live." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend container healthcheck timed out." -ForegroundColor Red
    docker compose logs backend
}

# 6. Clean up
Write-Host "Stopping container stack..." -ForegroundColor Gray
docker compose down

if ($backendHealthy) {
    Write-Host "=== Docker Verification SUCCESS ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=== Docker Verification FAILED ===" -ForegroundColor Red
    exit 1
}
