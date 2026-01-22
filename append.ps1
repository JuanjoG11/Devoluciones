$newProducts = Get-Content new_products_raw.txt -Raw
$seedData = Get-Content js/seed_data.js -Raw

# Escape the raw content for template literal and add array wrap
$escaped = "    ``$newProducts``,"
$updated = $seedData -replace '\];', "$escaped`n];"

$updated | Set-Content js/seed_data.js -NoNewline
Write-Host "Updated js/seed_data.js"
