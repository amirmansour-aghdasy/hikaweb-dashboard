# Media Management System

سیستم مدیریت رسانه کامل با قابلیت‌های مشابه وردپرس

## کامپوننت‌ها

### 1. MediaLibrary
کتابخانه رسانه برای انتخاب فایل‌های موجود یا آپلود فایل جدید

```jsx
import MediaLibrary from "@/components/media/MediaLibrary";

<MediaLibrary
  open={open}
  onClose={() => setOpen(false)}
  onSelect={(selected) => {
    console.log("Selected:", selected);
  }}
  multiple={false}
  acceptedTypes={["image/*"]}
  maxFiles={1}
  title="انتخاب تصویر"
  showUpload={true}
/>
```

### 2. MediaPicker
کامپوننت ساده برای انتخاب فایل در فرم‌ها (مثل وردپرس)

```jsx
import MediaPicker from "@/components/media/MediaPicker";

// انتخاب تک فایل
<MediaPicker
  value={formData.featuredImage}
  onChange={(image) => setFormData({ ...formData, featuredImage: image })}
  label="تصویر شاخص"
  accept="image/*"
  showPreview={true}
  showEdit={true}
/>

// انتخاب چند فایل
<MediaPicker
  value={formData.gallery}
  onChange={(images) => setFormData({ ...formData, gallery: images })}
  label="گالری تصاویر"
  accept="image/*"
  multiple={true}
  maxFiles={10}
  showPreview={true}
/>
```

### 3. MediaUploader
کامپوننت آپلود فایل با پیش‌نمایش و progress bar

```jsx
import MediaUploader from "@/components/media/MediaUploader";

<MediaUploader
  value={files}
  onChange={setFiles}
  multiple={true}
  maxFiles={5}
  acceptedTypes={["image/*", "video/*"]}
  maxSizeInMB={10}
  gallery={true}
  onUploadSuccess={(uploadedFiles) => {
    console.log("Uploaded:", uploadedFiles);
  }}
/>
```

### 4. ImageEditor
ویرایشگر تصویر با قابلیت برش، چرخش، و فیلتر

```jsx
import ImageEditor from "@/components/media/ImageEditor";

<ImageEditor
  open={editorOpen}
  onClose={() => setEditorOpen(false)}
  image={selectedImage}
  onSave={(editedImage) => {
    console.log("Edited:", editedImage);
  }}
/>
```

## مثال کامل استفاده در فرم

```jsx
"use client";
import { useState } from "react";
import { Box, TextField, Button, Grid } from "@mui/material";
import MediaPicker from "@/components/media/MediaPicker";

export default function ArticleForm() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    featuredImage: null,
    gallery: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit form with media
    console.log("Form data:", formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="عنوان"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="محتوای مقاله"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
        </Grid>

        <Grid item xs={12}>
          <MediaPicker
            value={formData.featuredImage}
            onChange={(image) => setFormData({ ...formData, featuredImage: image })}
            label="تصویر شاخص"
            accept="image/*"
            showPreview={true}
            showEdit={true}
          />
        </Grid>

        <Grid item xs={12}>
          <MediaPicker
            value={formData.gallery}
            onChange={(images) => setFormData({ ...formData, gallery: images })}
            label="گالری تصاویر"
            accept="image/*"
            multiple={true}
            maxFiles={10}
            showPreview={true}
          />
        </Grid>

        <Grid item xs={12}>
          <Button type="submit" variant="contained" fullWidth>
            ذخیره
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
```

## ویژگی‌ها

✅ آپلود فایل به Arvan Object Storage  
✅ پردازش و بهینه‌سازی خودکار تصاویر  
✅ ایجاد variant‌های مختلف (thumbnail, small, medium, large)  
✅ ویرایش تصویر (برش، چرخش، فیلتر)  
✅ انتخاب فایل از کتابخانه موجود  
✅ جستجو و فیلتر فایل‌ها  
✅ صفحه‌بندی  
✅ پشتیبانی از چندین نوع فایل (تصویر، ویدیو، سند)  
✅ رابط کاربری مشابه وردپرس  

## تنظیمات Backend

برای استفاده از این سیستم، باید متغیرهای محیطی زیر را تنظیم کنید:

```env
# Arvan Object Storage
ARVAN_OBJECT_STORAGE_API_KEY=your_api_key
ARVAN_OBJECT_STORAGE_ACCESS_KEY=your_access_key
ARVAN_OBJECT_STORAGE_SECRET_KEY=your_secret_key
ARVAN_OBJECT_STORAGE_BUCKET=your_bucket_name
ARVAN_OBJECT_STORAGE_REGION=ir-thr-at1
```

## API Endpoints

- `POST /api/v1/media/upload` - آپلود فایل
- `GET /api/v1/media` - دریافت لیست فایل‌ها
- `GET /api/v1/media/:id` - دریافت اطلاعات یک فایل
- `PUT /api/v1/media/:id` - به‌روزرسانی اطلاعات فایل
- `DELETE /api/v1/media/:id` - حذف فایل
- `POST /api/v1/media/:id/edit` - ویرایش تصویر

