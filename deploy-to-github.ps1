# MIRACLE ECD - GitHub Deployment Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MIRACLE ECD - GitHub Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🔍 Checking Git status..." -ForegroundColor Green
git status

Write-Host ""
Write-Host "📝 Adding all files to Git..." -ForegroundColor Green
git add .

Write-Host ""
$commitMessage = Read-Host "💬 Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update MIRACLE ECD website with Firebase integration"
}

Write-Host ""
Write-Host "📤 Committing changes..." -ForegroundColor Green
git commit -m $commitMessage

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your website will be available at:" -ForegroundColor Yellow
Write-Host "   https://kondwani47.github.io/miracle/" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Go to GitHub repository settings" -ForegroundColor White
Write-Host "   2. Enable GitHub Pages" -ForegroundColor White
Write-Host "   3. Set source to 'Deploy from branch'" -ForegroundColor White
Write-Host "   4. Select 'main' branch" -ForegroundColor White
Write-Host "   5. Save settings" -ForegroundColor White
Write-Host ""
Write-Host "🔥 Firebase Setup:" -ForegroundColor Yellow
Write-Host "   1. Follow FIREBASE-SETUP-GUIDE.md" -ForegroundColor White
Write-Host "   2. Update firebase-config.js" -ForegroundColor White
Write-Host "   3. Test at firebase-test.html" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue" 