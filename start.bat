@echo off
echo 🚀 بدء تشغيل نظام إدارة الخزائن والتسويات...
echo.

REM التحقق من وجود Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python موجود
    echo 🌐 بدء تشغيل الخادم المحلي...
    echo 📱 افتح المتصفح على: http://localhost:8000
    echo.
    echo ⏹️  للوقف: اضغط Ctrl+C
    echo.
    python -m http.server 8000
) else (
    echo ❌ Python غير موجود
    echo 💡 يمكنك فتح ملف index.html مباشرة في المتصفح
    echo 📁 الموقع: %cd%\index.html
    pause
)