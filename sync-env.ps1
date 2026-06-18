# Load config from sync-env-config.ps1 (gitignored — keeps secrets out of repo)
if (Test-Path "$PSScriptRoot\sync-env-config.ps1") {
    . "$PSScriptRoot\sync-env-config.ps1"
} else {
    Write-Error "Missing sync-env-config.ps1. Create it with: `$API_KEY = 'xxx'; `$SERVICE_ID = 'xxx'"
    exit 1
}

$ENV_FILE = "backend/.env"

$headers = @{
    Authorization = "Bearer $API_KEY"
    Accept = "application/json"
    "Content-Type" = "application/json"
}

# 1. Parse .env file
if (-not (Test-Path $ENV_FILE)) {
    Write-Error "Could not find $ENV_FILE"
    exit
}

$envMap = @{}
Get-Content $ENV_FILE | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $key = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        $envMap[$key] = $value
    }
}

# Production specific overrides (take precedence over .env)
$envMap["NODE_ENV"] = "production"
$envMap["BACKEND_URL"] = "https://socialflow-saas.onrender.com"
$envMap["FRONTEND_URL"] = "https://socialflow-saas.vercel.app"

$envVars = $envMap.GetEnumerator() | ForEach-Object { @{ key = $_.Key; value = $_.Value } }

# 2. Push to Render
Write-Host "Syncing $($envVars.Count) environment variables to Render..."
$body = $envVars | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" -Method Put -Headers $headers -Body $body
    Write-Host "✅ Successfully synced all environment variables!"
    Write-Host "🚀 Render is now redeploying with the new configuration."
} catch {
    Write-Error "Failed to sync: $_"
}
