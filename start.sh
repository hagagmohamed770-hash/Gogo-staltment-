#!/bin/bash

echo "🚀 بدء تشغيل نظام إدارة الخزائن والتسويات..."
echo ""

# التحقق من وجود Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3 موجود"
    echo "🌐 بدء تشغيل الخادم المحلي..."
    echo "📱 افتح المتصفح على: http://localhost:8000"
    echo ""
    echo "⏹️  للوقف: اضغط Ctrl+C"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python موجود"
    echo "🌐 بدء تشغيل الخادم المحلي..."
    echo "📱 افتح المتصفح على: http://localhost:8000"
    echo ""
    echo "⏹️  للوقف: اضغط Ctrl+C"
    echo ""
    python -m http.server 8000
else
    echo "❌ Python غير موجود"
    echo "💡 يمكنك فتح ملف index.html مباشرة في المتصفح"
    echo "📁 الموقع: $(pwd)/index.html"
fi