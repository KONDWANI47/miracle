@echo off
echo ========================================
echo    MIRACLE ECD - GitHub Deployment
echo ========================================
echo.

echo 🔍 Checking Git status...
git status

echo.
echo 📝 Adding all files to Git...
git add .

echo.
echo 💬 Enter commit message (or press Enter for default):
set /p commit_message=
if "%commit_message%"=="" set commit_message="Update MIRACLE ECD website with Firebase integration"

echo.
echo 📤 Committing changes...
git commit -m %commit_message%

echo.
echo 🚀 Pushing to GitHub...
git push origin main

echo.
echo ✅ Deployment complete!
echo.
echo 🌐 Your website will be available at:
echo    https://kondwani47.github.io/miracle/
echo.
echo 📋 Next steps:
echo    1. Go to GitHub repository settings
echo    2. Enable GitHub Pages
echo    3. Set source to 'Deploy from branch'
echo    4. Select 'main' branch
echo    5. Save settings
echo.
echo 🔥 Firebase Setup:
echo    1. Follow FIREBASE-SETUP-GUIDE.md
echo    2. Update firebase-config.js
echo    3. Test at firebase-test.html
echo.
pause 