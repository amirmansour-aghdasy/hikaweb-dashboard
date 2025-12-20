# نقشه راه Refactor جامع - Dashboard Forms

## مشکلات فعلی شناسایی شده

### 1. CategorySelector پیچیده و دارای تبدیل‌های تکراری
- تبدیل object به ID در `handleChange`
- تبدیل ID به object در `useEffect` برای نمایش
- منطق تبدیل در چند جا تکرار شده
- استفاده از `normalizedValue` که باعث confusion می‌شود

### 2. ArticleForm دارای منطق تکراری
- تبدیل categories در `onSubmit` (در حالی که CategorySelector قبلاً تبدیل کرده)
- منطق slug generation پیچیده در `useEffect`
- تبدیل SEO data در `onSubmit` که می‌تواند reusable باشد
- فرم خیلی بزرگ (815 خط)

### 3. عدم وجود utility functions مشترک
- تبدیل داده‌ها در هر فرم تکرار شده
- منطق slug generation در چند فرم تکرار شده
- تبدیل SEO data در چند فرم تکرار شده

### 4. استفاده نادرست از react-hook-form
- استفاده از `setValue` در `onChange` wrapper که ممکن است race condition ایجاد کند
- `mode: "onChange"` ممکن است باعث performance issues شود
- عدم استفاده صحیح از `field.onChange` در Controller

## راه‌حل‌های پیشنهادی

### Phase 1: ایجاد Utility Functions مشترک

#### 1.1 ایجاد `lib/utils/formTransformers.js`
```javascript
// تبدیل categories از object به ID
export const normalizeCategories = (categories) => {
  return Array.isArray(categories)
    ? categories.map(cat => {
        if (typeof cat === 'object' && cat !== null) {
          return cat._id || cat.id || String(cat);
        }
        return String(cat);
      }).filter(Boolean)
    : [];
};

// تبدیل SEO data
export const normalizeSEO = (seoData) => {
  const seo = {};
  if (seoData?.metaTitle) {
    const metaTitle = {};
    if (seoData.metaTitle.fa?.trim()) metaTitle.fa = seoData.metaTitle.fa.trim();
    if (seoData.metaTitle.en?.trim()) metaTitle.en = seoData.metaTitle.en.trim();
    if (Object.keys(metaTitle).length > 0) seo.metaTitle = metaTitle;
  }
  // ... بقیه
  return seo;
};
```

#### 1.2 ایجاد `hooks/useSlugGeneration.js`
```javascript
// Hook برای slug generation از title
export const useSlugGeneration = (titleField, slugField, setValue) => {
  // منطق slug generation
};
```

### Phase 2: ساده‌سازی CategorySelector

#### 2.1 اصلاح CategorySelector
- حذف `normalizedValue` state
- استفاده مستقیم از `value` prop که از form می‌آید (array of IDs)
- تبدیل فقط برای نمایش در Autocomplete (local state)
- `onChange` فقط ID array برمی‌گرداند

### Phase 3: ساده‌سازی ArticleForm

#### 3.1 استفاده از utility functions
- استفاده از `normalizeCategories` در `onSubmit`
- استفاده از `normalizeSEO` در `onSubmit`
- استفاده از `useSlugGeneration` hook

#### 3.2 اصلاح Controller برای categories
- استفاده مستقیم از `field.onChange` بدون wrapper
- حذف `setValue` از `onChange`

### Phase 4: بررسی سایر فرم‌ها

#### 4.1 ServiceForm
- بررسی منطق تبدیل categories
- بررسی منطق تبدیل SEO
- بررسی منطق slug generation

#### 4.2 PortfolioForm
- بررسی منطق تبدیل categories
- بررسی منطق تبدیل SEO
- بررسی منطق slug generation

## اولویت‌بندی

1. **اولویت بالا**: ساده‌سازی CategorySelector و اصلاح ArticleForm
2. **اولویت متوسط**: ایجاد utility functions مشترک
3. **اولویت پایین**: بررسی و refactor سایر فرم‌ها

## معیارهای موفقیت

- کاهش خطوط کد در فرم‌ها
- حذف منطق تکراری
- بهبود performance (کاهش re-renders)
- بهبود maintainability
- کاهش bugs

