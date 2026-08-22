$ErrorActionPreference = 'Stop'

# Ensure FB API key and SITE_BASE are set in the environment before running
if (-not $env:FB_API_KEY) { Write-Error "Set NEXT_PUBLIC_FIREBASE_API_KEY into env as FB_API_KEY before running"; exit 1 }
if (-not $env:SITE_BASE) { Write-Error "Set SITE_BASE (e.g. https://briefgroup.net) before running"; exit 1 }

$fbKey = $env:FB_API_KEY
$siteBase = $env:SITE_BASE.TrimEnd('/')  # remove trailing slash if present

# Safe temporary test credentials
$timestamp = (Get-Date -UFormat %s)
$testEmail = "test+ci${timestamp}@example.com"
$testPassword = "Test1234!"

Write-Host "Signing up test user: $testEmail (password: $testPassword) — will not print tokens."

# Attempt sign-up
try {
  $signupBody = @{ email = $testEmail; password = $testPassword; returnSecureToken = $true } | ConvertTo-Json
  $signupUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$fbKey"
  $signup = Invoke-RestMethod -Uri $signupUrl -Method Post -ContentType 'application/json' -Body $signupBody -ErrorAction Stop
  $idToken = $signup.idToken
  $localId = $signup.localId
  Write-Host "Created new user localId: $localId"
} catch {
  # If email exists or signUp fails, try signInWithPassword to get idToken
  $err = $_.Exception.Response -as [System.Net.HttpWebResponse]
  if ($err) {
    # Read the response body for message (but don't paste secrets)
    try { $errBody = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $errBody = $null }
  } else { $errBody = $_.Exception.Message }
  Write-Host "Sign-up failed or account exists; attempting password sign-in..."
  try {
    $signinBody = @{ email = $testEmail; password = $testPassword; returnSecureToken = $true } | ConvertTo-Json
    $signinUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$fbKey"
    $signin = Invoke-RestMethod -Uri $signinUrl -Method Post -ContentType 'application/json' -Body $signinBody -ErrorAction Stop
    $idToken = $signin.idToken
    $localId = $signin.localId
    Write-Host "Signed in existing user localId: $localId"
  } catch {
    Write-Error "Failed to sign up or sign in the test user. Error: $($_.Exception.Message)"
    exit 1
  }
}

if (-not $idToken) { Write-Error "No idToken obtained; aborting"; exit 1 }

# Call /api/chat on the deployed site
try {
  $chatPayload = @{
    messages = @(@{ role = 'user'; content = 'What is the current energy trend for my site?' })
    context = @{ energySummary = @{ totalKwh = 123.4; anomalyCount = 1; trend = 'rising' } }
  } | ConvertTo-Json -Depth 6

  $chatUrl = "$siteBase/api/chat"
  $headers = @{ Authorization = "Bearer $idToken"; 'Content-Type' = 'application/json' }
  Write-Host "Calling $chatUrl ..."
  $chatResp = Invoke-RestMethod -Uri $chatUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $chatPayload -ErrorAction Stop

  if ($chatResp.reply) {
    $trunc = $chatResp.reply.ToString().Substring(0, [Math]::Min(300, $chatResp.reply.ToString().Length))
    Write-Host "Assistant reply (truncated):`n$trunc"
  } elseif ($chatResp.error) {
    Write-Host "Assistant returned error: $($chatResp.error)"
  } else {
    Write-Host "Unexpected /api/chat response:`n$($chatResp | ConvertTo-Json -Depth 3)"
  }
} catch {
  Write-Host "Call to /api/chat failed: $($_.Exception.Message)"
  # Continue to tracking attempts even if chat fails
}

# Post two lightweight tracking events to /api/track
try {
  $trackUrl = "$siteBase/api/track"
  $evt1 = @{ event = 'hero_exposed'; variant = 'A'; ts = [int](Get-Date -UFormat %s) } | ConvertTo-Json
  $evt2 = @{ event = 'cta_click'; variant = 'A'; ts = [int](Get-Date -UFormat %s) } | ConvertTo-Json

  $r1 = Invoke-RestMethod -Uri $trackUrl -Method Post -ContentType 'application/json' -Body $evt1 -ErrorAction Stop
  Write-Host "/api/track hero_exposed posted (response truncated): $($r1 | ConvertTo-Json -Depth 1)"
  $r2 = Invoke-RestMethod -Uri $trackUrl -Method Post -ContentType 'application/json' -Body $evt2 -ErrorAction Stop
  Write-Host "/api/track cta_click posted (response truncated): $($r2 | ConvertTo-Json -Depth 1)"
} catch {
  Write-Host "Posting to /api/track failed: $($_.Exception.Message)"
}

Write-Host "Done. Share non-sensitive output (localId and assistant reply snippet) if you want me to interpret results."