param(
  [string]$Owner = $env:GHCR_OWNER,
  [string]$Tag = $env:TAG
)

if (-not $Owner) { throw "GHCR_OWNER is required" }
if (-not $Tag) { throw "TAG is required" }

Write-Host "Using owner=$Owner tag=$Tag"

Write-Host "Stopping existing stack (no volume removal)..."
docker compose -f docker-compose.yml down

Write-Host "Pulling images..."
docker pull "ghcr.io/$Owner/project-backend:$Tag"
docker pull "ghcr.io/$Owner/project-frontend:$Tag"

Write-Host "Starting stack..."
docker compose -f docker-compose.yml up -d

Write-Host "Deploy completed"
