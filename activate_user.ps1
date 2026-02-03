# Activar Usuario en Supabase
$url = "https://olrfvydwyndqquxmtuho.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scmZ2eWR3eW5kcXF1eG10dWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDE3NDUsImV4cCI6MjA4MzQ3Nzc0NX0.ui2jMr8-rG-bsFgeSea6ZpYks6utVClVGcQLq9Ptxn8"
$username = "1087559558"

Write-Host "Activando usuario $username..." -ForegroundColor Cyan

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Buscar usuario
$searchUrl = "$url/rest/v1/users?username=eq.$username"
$user = Invoke-RestMethod -Uri $searchUrl -Method Get -Headers $headers

if ($user.Count -gt 0) {
    Write-Host "Usuario encontrado: $($user[0].name)" -ForegroundColor Green
    
    if ($user[0].is_active) {
        Write-Host "El usuario YA esta ACTIVO" -ForegroundColor Green
    } else {
        # Activar
        $updateUrl = "$url/rest/v1/users?id=eq.$($user[0].id)"
        $body = '{"is_active":true}'
        Invoke-RestMethod -Uri $updateUrl -Method Patch -Headers $headers -Body $body
        Write-Host "USUARIO ACTIVADO!" -ForegroundColor Green
    }
} else {
    # Crear usuario
    Write-Host "Creando usuario..." -ForegroundColor Yellow
    $createUrl = "$url/rest/v1/users"
    $body = "{`"username`":`"$username`",`"name`":`"JUAN ALEJANDRO FRANCO MARIN`",`"role`":`"auxiliar`",`"organization`":`"TYM`",`"is_active`":true,`"password`":`"123`"}"
    Invoke-RestMethod -Uri $createUrl -Method Post -Headers $headers -Body $body
    Write-Host "USUARIO CREADO Y ACTIVADO!" -ForegroundColor Green
}

Write-Host "Proceso completado" -ForegroundColor Cyan
