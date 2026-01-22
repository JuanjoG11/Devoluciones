$codes = Get-Content exclude_codes.txt | ForEach-Object { $_.Trim() }
$codesSet = New-Object System.Collections.Generic.HashSet[string]
foreach ($c in $codes) { [void]$codesSet.Add($c) }

$lines = Get-Content js/data/tym_products.js
$newLines = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
    $match = [regex]::Match($line, 'code:\s*["''](.*?)["'']')
    if ($match.Success) {
        $code = $match.Groups[1].Value
        if ($codesSet.Contains($code)) {
            continue
        }
    }
    [void]$newLines.Add($line)
}

$newLines | Set-Content js/data/tym_products.js
Write-Host "Done"
