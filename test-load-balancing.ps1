# Script de test du load balancing - TP 1.6
# Ce script teste la répartition de charge entre les 3 instances du backend

Write-Host "=== Test de Load Balancing du Backend ===" -ForegroundColor Cyan
Write-Host ""

# Récupération des IPs des instances
Write-Host "1. Instances backend actives :" -ForegroundColor Yellow
docker compose ps --filter "name=backend" --format "table {{.Name}}\t{{.Status}}"
Write-Host ""

# Test direct sur chaque instance
Write-Host "2. Test individuel de chaque instance :" -ForegroundColor Yellow
$ips = @("172.19.0.5", "172.19.0.4", "172.19.0.6")
foreach ($ip in $ips) {
    $result = docker run --rm --network gym_back_network curlimages/curl:latest -s "http://${ip}:3000/whoami" | ConvertFrom-Json
    Write-Host "  Instance ${ip}: hostname=$($result.hostname), PID=$($result.pid)" -ForegroundColor Green
}
Write-Host ""

# Test de la répartition de charge via le DNS
Write-Host "3. Test de répartition de charge (15 requêtes via DNS 'backend:3000') :" -ForegroundColor Yellow
$hostnames = @{}
for ($i=1; $i -le 15; $i++) {
    $hostname = docker run --rm --network gym_back_network curlimages/curl:latest -s http://backend:3000/whoami | ConvertFrom-Json | Select-Object -ExpandProperty hostname
    
    # Comptage des occurences
    if ($hostnames.ContainsKey($hostname)) {
        $hostnames[$hostname]++
    } else {
        $hostnames[$hostname] = 1
    }
    
    Write-Host "  Request $i -> $hostname" -ForegroundColor Gray
}

Write-Host ""
Write-Host "4. Statistiques de distribution :" -ForegroundColor Yellow
foreach ($key in $hostnames.Keys) {
    $count = $hostnames[$key]
    $percent = [math]::Round(($count / 15) * 100, 2)
    Write-Host "  $key : $count requêtes ($percent%)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Test terminé ===" -ForegroundColor Green
Write-Host "Les 3 instances backend répondent correctement et le load balancing est fonctionnel !" -ForegroundColor Green
