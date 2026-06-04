# Run this after prisma installs to get all remaining packages
# Usage: .\install-remaining.ps1

$mirror = "https://registry.npmmirror.com"
$opts   = "--maxsockets 2 --registry $mirror"

$packages = @(
  "bcryptjs",
  "jose",
  "resend",
  "stripe",
  "@aws-sdk/client-s3 @aws-sdk/s3-request-presigner",
  "sharp",
  "uuid",
  "vitest @vitest/coverage-v8",
  "@playwright/test",
  "@types/bcryptjs @types/uuid"
)

foreach ($pkg in $packages) {
  Write-Host "`n>>> Installing: $pkg" -ForegroundColor Cyan
  Invoke-Expression "npm install $pkg $opts"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $pkg — retrying once..." -ForegroundColor Yellow
    Start-Sleep 3
    Invoke-Expression "npm install $pkg $opts"
  }
}

Write-Host "`n>>> Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "`nAll done! Run: npm run dev" -ForegroundColor Green
