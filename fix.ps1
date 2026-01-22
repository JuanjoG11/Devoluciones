$seedData = Get-Content js/seed_data.js -Raw

# Correct the nested backticks and spaces
$updated = $seedData -replace '    `    `M1104', '    `M1104'

$updated | Set-Content js/seed_data.js -NoNewline
Write-Host "Fixed js/seed_data.js formatting"
