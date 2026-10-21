#!/usr/bin/env pwsh
# Batería de pruebas de seguridad de alto nivel contra la API local (modo dev).
# Uso: pwsh qa/evidencias/security-probe.ps1  (backend en :8080)
# Guarda la salida completa en qa/evidencias/seguridad-probe.txt

$ErrorActionPreference = 'Continue'
$API = 'http://localhost:8080'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Line([string]$t) { Write-Output ""; Write-Output "=== $t ===" }

function Try-Req {
  param([string]$Method, [string]$Path, [hashtable]$Headers, [string]$Body, [string]$ContentType)
  try {
    $p = @{ Uri = "$API$Path"; Method = $Method; UseBasicParsing = $true; TimeoutSec = 8 }
    if ($Headers) { $p.Headers = $Headers }
    if ($Body) { $p.Body = $Body; $p.ContentType = $ContentType }
    $r = Invoke-WebRequest @p
    return @{ Status = [int]$r.StatusCode; Body = $r.Content; Headers = $r.Headers }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $code = [int]$resp.StatusCode.value__
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $reader.ReadToEnd()
      return @{ Status = $code; Body = $body; Headers = $resp.Headers }
    }
    return @{ Status = -1; Body = "$($_.Exception.Message)"; Headers = @{} }
  }
}

# Token legítimo
Line "0. Token legítimo (login)"
$login = Try-Req -Method POST -Path '/api/v1/auth/login' -Body '{"email":"admin@energia.local","password":"admin123"}' -ContentType 'application/json'
Write-Output "login -> $($login.Status)"
$token = ($login.Body | ConvertFrom-Json).access_token
$auth = @{ Authorization = "Bearer $token" }

# 1. Cabeceras de seguridad
Line "1. Cabeceras de seguridad en respuestas"
$h = Try-Req -Method GET -Path '/health'
foreach ($name in 'Content-Security-Policy','X-Content-Type-Options','X-Frame-Options','Strict-Transport-Security','Referrer-Policy','Permissions-Policy') {
  $val = $h.Headers[$name]
  if ($val) { Write-Output "PRESENTE  ${name}: $val" } else { Write-Output "AUSENTE   $name" }
}

# 2. Forja de JWT con secreto por defecto
Line "2. Forja de JWT con el secreto por defecto (dev-secret-change-me)"
$forged = node "$dir/forge-jwt.mjs" 'dev-secret-change-me' 'energyai-api' 'attacker@evil.local'
$f = Try-Req -Method GET -Path '/api/v1/auth/me' -Headers @{ Authorization = "Bearer $forged" }
Write-Output "GET /auth/me con token forjado -> $($f.Status)"
Write-Output "cuerpo: $($f.Body)"

# 3. alg=none
Line "3. JWT con alg=none"
$now = [int][double]::Parse((Get-Date -UFormat %s))
function B64([string]$s){ [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s)).TrimEnd('=').Replace('+','-').Replace('/','_') }
$hdr = B64 '{"alg":"none","typ":"JWT"}'
$pl  = B64 '{"name":"x","sub":"a@b.c","iss":"energyai-api","exp":9999999999}'
$none = "$hdr.$pl."
$n = Try-Req -Method GET -Path '/api/v1/auth/me' -Headers @{ Authorization = "Bearer $none" }
Write-Output "GET /auth/me con alg=none -> $($n.Status) (esperado 401)"

# 4. Token sin firma / malformado
Line "4. Tokens malformados"
foreach ($bad in @('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sinFirma', 'abc.def.ghi', 'null')) {
  $b = Try-Req -Method GET -Path '/api/v1/auth/me' -Headers @{ Authorization = "Bearer $bad" }
  Write-Output "token='$bad' -> $($b.Status) (esperado 401)"
}

# 5. Rate limiting en login
Line "5. Rate limiting / fuerza bruta en /auth/login (20 intentos)"
$codes = @()
for ($i=1; $i -le 20; $i++) {
  $r = Try-Req -Method POST -Path '/api/v1/auth/login' -Body '{"email":"admin@energia.local","password":"mal"}' -ContentType 'application/json'
  $codes += $r.Status
}
$uniq = $codes | Group-Object | ForEach-Object { "$($_.Name)x$($_.Count)" }
Write-Output "statuses: $($uniq -join ', ')  (si no hay 429, no hay rate limiting)"

# 6. CORS
Line "6. CORS"
$c1 = Try-Req -Method OPTIONS -Path '/api/v1/auth/login' -Headers @{ Origin = 'http://evil.example' }
Write-Output "preflight Origin evil -> $($c1.Status), ACAO='$($c1.Headers['Access-Control-Allow-Origin'])'"
$c2 = Try-Req -Method OPTIONS -Path '/api/v1/auth/login' -Headers @{ Origin = 'http://localhost:5173' }
Write-Output "preflight Origin permitido -> $($c2.Status), ACAO='$($c2.Headers['Access-Control-Allow-Origin'])', ACAC='$($c2.Headers['Access-Control-Allow-Credentials'])'"

# 7. Enumeración de usuarios / timing
Line "7. Mensaje de error de login (enumeración)"
$e1 = Try-Req -Method POST -Path '/api/v1/auth/login' -Body '{"email":"noexiste@x.com","password":"x"}' -ContentType 'application/json'
$e2 = Try-Req -Method POST -Path '/api/v1/auth/login' -Body '{"email":"admin@energia.local","password":"x"}' -ContentType 'application/json'
Write-Output "email inexistente -> $($e1.Status): $($e1.Body)"
Write-Output "email válido, pass mal -> $($e2.Status): $($e2.Body)"

# 8. Inyección en filtros (SQLi / NoSQLi / path traversal)
Line "8. Payloads de inyección en filtros y paths"
$inj = @(
  "' OR '1'='1",
  "'; DROP TABLE meters;--",
  "M-109' UNION SELECT * FROM users--",
  '{"$ne":null}',
  '../../../../etc/passwd',
  '%2e%2e%2f%2e%2e%2fetc%2fpasswd'
)
foreach ($p in $inj) {
  $body = @{ filter = @{ meter_id = $p } } | ConvertTo-Json -Compress
  $r = Try-Req -Method POST -Path '/api/v1/meter/getAll' -Headers $auth -Body $body -ContentType 'application/json'
  $cnt = try { ($r.Body | ConvertFrom-Json).count } catch { 'n/a' }
  Write-Output "meter_id='$p' -> $($r.Status), count=$cnt"
}
foreach ($p in @('../../etc/passwd', 'M-109%00', '<script>', 'M-109 OR 1=1')) {
  $r = Try-Req -Method GET -Path "/api/v1/meter/getById/$p" -Headers $auth
  Write-Output "getById '$p' -> $($r.Status)"
}

# 9. Métodos no permitidos / verbos
Line "9. Métodos HTTP no soportados"
foreach ($m in @('DELETE','PUT','PATCH','TRACE')) {
  $r = Try-Req -Method $m -Path '/api/v1/meter/getAll' -Headers $auth
  Write-Output "$m /meter/getAll -> $($r.Status)"
}

# 10. Body grande / límite
Line "10. Límite de tamaño de body (1 MB)"
$big = '{"filter":{"meter_id":"' + ('A' * 2000000) + '"}}'
$r = Try-Req -Method POST -Path '/api/v1/meter/getAll' -Headers $auth -Body $big -ContentType 'application/json'
Write-Output "body ~2MB -> $($r.Status) (esperado 400/413)"

# 11. JSON con campos desconocidos (typos)
Line "11. Validación estricta de JSON"
$r = Try-Req -Method POST -Path '/api/v1/meter/getAll' -Headers $auth -Body '{"filtro":{"meter_id":"M-109"}}' -ContentType 'application/json'
Write-Output "campo desconocido 'filtro' -> $($r.Status): $($r.Body)"

# 12. Acceso sin token a todas las rutas protegidas
Line "12. Rutas protegidas sin token"
foreach ($p in @('/api/v1/meter/getParams','/api/v1/meter/getAll','/api/v1/meter/getById/M-109','/api/v1/anomaly/getAll','/api/v1/dashboard/getSummary')) {
  $r = Try-Req -Method GET -Path $p
  Write-Output "GET $p sin token -> $($r.Status)"
}

Write-Output ""
Write-Output "=== FIN ==="
