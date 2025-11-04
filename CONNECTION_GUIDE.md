# راهنمای اتصال Dashboard به Backend

## تغییرات انجام شده

### 1. API Configuration (`src/lib/api.js`)
- ✅ اضافه شدن CSRF token handling
- ✅ بهبود error handling با toast notifications
- ✅ مدیریت خودکار token refresh
- ✅ اضافه شدن X-CSRF-Token header برای state-changing requests

### 2. Authentication (`src/lib/auth.js`)
- ✅ اصلاح login برای کار با response structure از backend
- ✅ بهبود error handling
- ✅ استفاده از toast برای notifications

### 3. API Hooks (`src/hooks/useApi.js`)
- ✅ تغییر از showSnackbar به toast
- ✅ بهبود cache invalidation
- ✅ اضافه شدن options برای custom handling

### 4. Constants (`src/lib/constants.js`)
- ✅ اصلاح API endpoints (حذف `/api/v1` چون در baseURL است)
- ✅ اضافه شدن CSRF_TOKEN endpoint

### 5. Environment Variables
- ✅ ایجاد `.env.local` و `.env.example`
- ✅ تنظیم `NEXT_PUBLIC_API_URL`

### 6. Middleware (`src/app/middleware.js`)
- ✅ ساده‌سازی JWT verification (backend خودش validate می‌کند)

### 7. Dashboard Page (`src/app/dashboard/page.js`)
- ✅ اصلاح stats fetching برای استفاده از pagination totals

## نحوه استفاده

### 1. تنظیم Environment Variables

```bash
# در پوشه dashboard
cp .env.example .env.local
```

سپس `.env.local` را ویرایش کنید:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### 2. اطمینان از اجرای Backend

```bash
# در پوشه back
npm run dev
```

Backend باید روی `http://localhost:5000` اجرا شود.

### 3. اجرای Dashboard

```bash
# در پوشه dashboard
npm run dev
```

Dashboard روی `http://localhost:1281` اجرا می‌شود.

## ویژگی‌های اتصال

### CSRF Protection
- CSRF token به صورت خودکار برای POST, PUT, DELETE, PATCH requests اضافه می‌شود
- Token از `/auth/csrf-token` endpoint دریافت می‌شود
- در صورت خطای CSRF، token reset شده و دوباره fetch می‌شود

### Error Handling
- همه errors به صورت خودکار با toast نمایش داده می‌شوند
- 401 errors باعث redirect به login می‌شوند
- 403 errors (CSRF) با پیام مناسب نمایش داده می‌شوند

### Authentication Flow
1. User login می‌کند
2. Token در cookie ذخیره می‌شود
3. در هر request، token به header اضافه می‌شود
4. در صورت expire شدن token، user به login redirect می‌شود

### State Management
- استفاده از React Query برای data fetching و caching
- استفاده از Zustand برای global state
- استفاده از React Hot Toast برای notifications

## API Endpoints

همه endpoints از `/api/v1` شروع می‌شوند (در baseURL تعریف شده):

- `/auth/login` - ورود
- `/auth/logout` - خروج
- `/auth/me` - اطلاعات کاربر فعلی
- `/auth/csrf-token` - دریافت CSRF token
- `/users` - مدیریت کاربران
- `/articles` - مدیریت مقالات
- `/services` - مدیریت خدمات
- `/portfolio` - مدیریت نمونه کارها
- `/comments` - مدیریت نظرات
- `/team` - مدیریت تیم
- `/faq` - مدیریت سوالات متداول
- `/tickets` - مدیریت تیکت‌ها
- `/categories` - مدیریت دسته‌بندی‌ها
- `/brands` - مدیریت برندها
- `/consultations` - مدیریت درخواست‌های مشاوره
- `/media` - مدیریت رسانه
- `/settings` - تنظیمات
- `/carousel` - مدیریت اسلایدر

## نکات مهم

1. **CSRF Token**: برای state-changing requests (POST, PUT, DELETE, PATCH) نیاز است
2. **Pagination**: همه list endpoints از query params `page` و `limit` پشتیبانی می‌کنند
3. **Search**: با query param `search` می‌توانید جستجو کنید
4. **Filtering**: هر endpoint فیلترهای خاص خود را دارد (مثلاً `status`, `category`, etc.)
5. **Response Structure**: همه responses ساختار `{ success: true, data: {...}, message: "..." }` دارند

## Troubleshooting

### مشکل: 401 Unauthorized
- بررسی کنید که token در cookie موجود است
- بررسی کنید که backend در حال اجرا است
- بررسی کنید که JWT_SECRET در backend و dashboard یکسان است

### مشکل: 403 Forbidden (CSRF)
- بررسی کنید که `/auth/csrf-token` endpoint در backend موجود است
- بررسی کنید که user authenticated است
- CSRF token به صورت خودکار reset می‌شود و دوباره fetch می‌شود

### مشکل: CORS Error
- بررسی کنید که backend CORS را برای dashboard domain تنظیم کرده است
- در development، معمولاً `http://localhost:1281` باید whitelisted باشد

### مشکل: Data not loading
- بررسی کنید که endpoint درست است
- بررسی کنید که response structure با expected structure match می‌کند
- Console را برای error messages بررسی کنید

