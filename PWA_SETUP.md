# راهنمای تنظیم PWA برای Dashboard

## ✅ کارهای انجام شده

1. **نصب پکیج**: `@ducanh2912/next-pwa` نصب شده است
2. **Manifest**: فایل `public/manifest.json` ایجاد شده است
3. **تنظیمات Next.js**: `next.config.mjs` برای PWA پیکربندی شده است
4. **Metadata**: تنظیمات PWA به `layout.js` اضافه شده است
5. **کامپوننت نصب**: کامپوننت `PWAInstallPrompt` برای نمایش prompt نصب ایجاد شده است

## 📋 کارهای باقی‌مانده

### 1. ایجاد آیکون‌ها

برای تکمیل PWA، باید آیکون‌های زیر را در پوشه `public/icons/` قرار دهید:

- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

**ابزارهای پیشنهادی برای ایجاد آیکون‌ها:**
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://favicon.io/

### 2. تست PWA

بعد از ایجاد آیکون‌ها و build کردن پروژه:

1. **Build پروژه:**
   ```bash
   npm run build
   ```

2. **اجرای production:**
   ```bash
   npm start
   ```

3. **تست با Lighthouse:**
   - در Chrome DevTools، به تب "Lighthouse" بروید
   - "Progressive Web App" را انتخاب کنید
   - "Analyze page load" را اجرا کنید
   - باید امتیاز بالای 90 دریافت کنید

4. **تست نصب:**
   - در Chrome/Edge: آیکون نصب در address bar نمایش داده می‌شود
   - در Android: prompt نصب به صورت خودکار نمایش داده می‌شود
   - در iOS: دستورالعمل‌های نصب در کامپوننت `PWAInstallPrompt` نمایش داده می‌شود

## 🔧 تنظیمات

### Service Worker

Service Worker به صورت خودکار توسط `next-pwa` ایجاد می‌شود و در production mode فعال است. در development mode غیرفعال است.

### Cache Strategy

استراتژی‌های cache تنظیم شده‌اند:
- **Fonts**: CacheFirst (1 year)
- **Images**: StaleWhileRevalidate (1 day)
- **API calls**: NetworkFirst (1 day, timeout 10s)
- **Documents**: NetworkFirst (1 day)

### Offline Support

PWA به صورت خودکار صفحات را cache می‌کند و در حالت offline نیز کار می‌کند.

## 📱 ویژگی‌های PWA

- ✅ نصب روی دستگاه (Installable)
- ✅ کار در حالت Offline
- ✅ سریع‌تر با Caching
- ✅ نمایش به صورت Standalone App
- ✅ Shortcuts برای دسترسی سریع
- ✅ پشتیبانی از iOS و Android

## 🐛 عیب‌یابی

### Service Worker ثبت نمی‌شود
- مطمئن شوید که در production mode هستید (PWA در development غیرفعال است)
- بررسی کنید که HTTPS فعال است (یا localhost)

### آیکون‌ها نمایش داده نمی‌شوند
- بررسی کنید که تمام آیکون‌ها در `public/icons/` موجود هستند
- بررسی کنید که مسیرها در `manifest.json` درست هستند

### Prompt نصب نمایش داده نمی‌شود
- در Chrome/Edge: باید حداقل یک بار با سایت تعامل داشته باشید
- در iOS: prompt به صورت دستی نمایش داده می‌شود (از طریق Share menu)

## 📚 منابع

- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)
- [next-pwa Documentation](https://github.com/DuCanhGH/next-pwa)

