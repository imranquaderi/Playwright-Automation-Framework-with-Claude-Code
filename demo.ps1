# Demo_1611: run the QKart login happy-path tests in a visible Chromium window,
# one at a time, then open the HTML report.
# Usage (from the project root):  .\demo.ps1
param(
    [int]$ReportPort = 9330
)

Set-Location $PSScriptRoot

Write-Host "Running Demo_1611 login tests (Chromium, headed, 1 worker)..." -ForegroundColor Cyan
npx playwright test tests/Demo_1611 --project=chromium --headed --workers=1 '--reporter=list,html'

if ($LASTEXITCODE -eq 0) {
    Write-Host "All tests passed. Opening the HTML report..." -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Opening the HTML report for details..." -ForegroundColor Yellow
}

# Opens the report in the browser; press Ctrl+C in this window to stop the report server.
npx playwright show-report --port $ReportPort
