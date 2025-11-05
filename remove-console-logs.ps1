# Remove console.log statements from client code
Write-Host "Removing console.log statements from client code..." -ForegroundColor Yellow

$files = Get-ChildItem -Path "client\app" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove console.log lines
    $content = $content -replace "console\.log\([^;]*\);\s*//\s*Debug\s*log\s*\r?\n", ""
    $content = $content -replace "\s*console\.log\([^;]*\);\r?\n", ""
    
    # Remove console.error in catch blocks that do nothing else
    # Keep this for now as they might be useful
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "✅ Console.log statements removed!" -ForegroundColor Green
