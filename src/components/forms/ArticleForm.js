"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Divider, Accordion, AccordionSummary, AccordionDetails, Alert, Stack } from "@mui/material";
import { Save, Cancel, ExpandMore, Publish, Star, Visibility, Language, Image, Tag, Category, Person, Article } from "@mui/icons-material";
import { Controller, useWatch } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import { useFormSetup } from "../../hooks/useFormSetup";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { articleValidation, articleUpdateValidation } from "../../lib/validations";
import { normalizeCategories, normalizeSEO, normalizeTags } from "../../lib/utils/formTransformers";
import { normalizeMultiLang, normalizeCategoriesForForm, normalizeSEOForForm, normalizeTagsForForm } from "../../lib/utils/formNormalizers";

export default function ArticleForm({ article, onSave, onCancel }) {
    const defaultValues = {
        title: { fa: "", en: "" },
        excerpt: { fa: "", en: "" },
        content: { fa: "", en: "" },
        featuredImage: "",
        categories: [],
        tags: { fa: [], en: [] },
        isPublished: false,
        isFeatured: false,
        allowComments: true,
        metaTitle: { fa: "", en: "" },
        metaDescription: { fa: "", en: "" },
        metaKeywords: { fa: [], en: [] },
        downloadBox: {
            title: { fa: "", en: "" },
            description: { fa: "", en: "" },
            fileUrl: "",
            fileName: "",
            fileSize: 0,
            fileType: "",
            isActive: false
        },
    };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        trigger,
        formState: { errors, isDirty },
    } = useFormSetup({
        validationSchema: article ? articleUpdateValidation : articleValidation,
        defaultValues,
        existingItem: article,
        normalizeItem: (item) => ({
            title: normalizeMultiLang(item.title),
            excerpt: normalizeMultiLang(item.excerpt),
            content: normalizeMultiLang(item.content),
            featuredImage: item.featuredImage || "",
            categories: normalizeCategoriesForForm(item.categories),
            tags: normalizeTagsForForm(item.tags),
            isPublished: item.isPublished || false,
            isFeatured: item.isFeatured || false,
            allowComments: item.allowComments !== false,
            metaTitle: normalizeMultiLang(item.seo?.metaTitle),
            metaDescription: normalizeMultiLang(item.seo?.metaDescription),
            metaKeywords: item.seo?.metaKeywords || { fa: [], en: [] },
            downloadBox: item.downloadBox || defaultValues.downloadBox,
        }),
        mode: "onChange",
    });

    // Transform data before submission
    const transformArticleData = (data) => {
        // Normalize form data using utility functions
        const categories = normalizeCategories(data.categories);
        const seo = normalizeSEO({
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            metaKeywords: data.metaKeywords,
        });
        const tags = normalizeTags(data.tags);

        // Ensure content.en is not empty - backend requires it
        const content = data.content || { fa: "", en: "" };
        if (!content.en || content.en.trim() === "") {
            content.en = content.fa || "<p>English content is required</p>";
        }
        
        // Trim excerpt to max 500 characters as per backend validation
        const excerpt = data.excerpt || { fa: "", en: "" };
        if (excerpt.fa && excerpt.fa.length > 500) {
            excerpt.fa = excerpt.fa.substring(0, 500);
        }
        if (excerpt.en && excerpt.en.length > 500) {
            excerpt.en = excerpt.en.substring(0, 500);
        }

        const articleData = {
            title: data.title || { fa: "", en: "" },
            excerpt: excerpt,
            content: content,
            featuredImage: data.featuredImage || "",
            categories,
            tags,
            isPublished: data.isPublished || false,
            isFeatured: data.isFeatured || false,
            allowComments: data.allowComments !== false,
        };

        // Only add seo if it has at least one field
        if (Object.keys(seo).length > 0) {
            articleData.seo = seo;
        }

        // Add downloadBox if it has active content
        if (data.downloadBox && data.downloadBox.isActive) {
            articleData.downloadBox = {
                title: data.downloadBox.title || { fa: "", en: "" },
                description: data.downloadBox.description || { fa: "", en: "" },
                fileUrl: data.downloadBox.fileUrl || "",
                fileName: data.downloadBox.fileName || "",
                fileSize: data.downloadBox.fileSize || 0,
                fileType: data.downloadBox.fileType || "",
                isActive: true
            };
        }

        return articleData;
    };

    const { submit, loading } = useFormSubmission({
        endpoint: "/articles",
        queryKey: "articles",
        existingItem: article,
        createMessage: "مقاله با موفقیت ایجاد شد",
        updateMessage: "مقاله با موفقیت ویرایش شد",
        onSuccess: onSave,
        transformData: transformArticleData,
        setValue,
        getValues,
    });

    const onSubmit = async (data) => {
        await submit(data);
    };

    // Handle image selection
    const handleImageSelect = (selected) => {
        if (selected) {
            // If selected is an object with url, use url; otherwise use the value directly
            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
            setValue("featuredImage", imageUrl);
        } else {
            setValue("featuredImage", "");
        }
    };

    const onError = (validationErrors) => {
        // Errors are already shown in UI via error props under inputs
        // Just scroll to the first error field for better UX
        const firstErrorKey = Object.keys(validationErrors)[0];
        if (firstErrorKey) {
            // Try to find the error field element
            const fieldName = firstErrorKey.split('.')[0]; // Get base field name
            const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || 
                                document.querySelector(`[name="${fieldName}"]`) ||
                                document.querySelector(`[id="${firstErrorKey}"]`) ||
                                document.querySelector(`[id="${fieldName}"]`);
            if (errorElement) {
                setTimeout(() => {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorElement.focus();
                }, 100);
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit, onError)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Title Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Language /> عنوان مقاله
                            </Typography>
                            <Controller
                                name="title"
                                control={control}
                                rules={{
                                    validate: {
                                        faRequired: (value) => {
                                            if (!value || typeof value !== 'object') return "عنوان فارسی الزامی است";
                                            const trimmed = value.fa?.trim();
                                            return trimmed ? true : "عنوان فارسی الزامی است";
                                        },
                                        enRequired: (value) => {
                                            if (!value || typeof value !== 'object') return "عنوان انگلیسی الزامی است";
                                            const trimmed = value.en?.trim();
                                            return trimmed ? true : "عنوان انگلیسی الزامی است";
                                        },
                                    },
                                }}
                                render={({ field }) => (
                                    <MultiLangTextField
                                        {...field}
                                        label="عنوان"
                                        error={errors.title}
                                        placeholder={{
                                            fa: "عنوان مقاله به فارسی...",
                                            en: "Article title in English...",
                                        }}
                                    />
                                )}
                            />
                        </Box>


                        {/* Excerpt Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                خلاصه مقاله
                            </Typography>
                            <Controller
                                name="excerpt"
                                control={control}
                                render={({ field }) => (
                                    <MultiLangTextField
                                        {...field}
                                        label="خلاصه"
                                        multiline
                                        rows={3}
                                        error={errors.excerpt}
                                        placeholder={{
                                            fa: "خلاصه‌ای از محتوای مقاله...",
                                            en: "Brief summary of the article...",
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Content Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Article /> محتوای مقاله
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                برای درج تصویر در محتوا، از دکمه "تصویر" در نوار ابزار ویرایشگر استفاده کنید.
                            </Alert>
                            <Controller
                                name="content"
                                control={control}
                                rules={{
                                    validate: {
                                        faRequired: (value) => {
                                            if (!value || typeof value !== 'object') return "محتوای فارسی الزامی است";
                                            // Remove HTML tags for validation
                                            const textContent = value.fa?.replace(/<[^>]*>/g, '').trim() || "";
                                            return textContent ? true : "محتوای فارسی الزامی است";
                                        },
                                    },
                                }}
                                render={({ field }) => (
                                    <MultiLangEditor 
                                        value={field.value || { fa: "", en: "" }} 
                                        onChange={(newValue) => {
                                            field.onChange(newValue);
                                        }}
                                        label="محتوا" 
                                        error={errors.content} 
                                        height={400} 
                                    />
                                )}
                            />
                        </Box>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{xs:12, lg:4}}>
                    <Stack spacing={3}>
                        {/* Publication Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Publish /> تنظیمات انتشار
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="isPublished"
                                    control={control}
                                    render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="انتشار فوری" />}
                                />

                                <Controller name="isFeatured" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="مقاله ویژه" />} />

                                <Controller
                                    name="allowComments"
                                    control={control}
                                    render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="امکان نظردهی" />}
                                />
                            </Stack>
                        </Box>

                        {/* Featured Image */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر شاخص
                            </Typography>
                            <Controller
                                name="featuredImage"
                                control={control}
                                render={({ field }) => (
                                    <MediaPicker
                                        value={field.value || null}
                                        onChange={(selected) => {
                                            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                            field.onChange(imageUrl);
                                            handleImageSelect(selected);
                                        }}
                                        label="انتخاب تصویر شاخص"
                                        accept="image/*"
                                        multiple={false}
                                        showPreview={true}
                                        showEdit={true}
                                        optimizeForWeb={true}
                                    />
                                )}
                            />
                        </Box>

                        {/* Categories */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Category /> دسته‌بندی
                            </Typography>
                            <Controller 
                                name="categories" 
                                control={control} 
                                render={({ field, fieldState }) => (
                                    <CategorySelector 
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        type="article" 
                                        label="انتخاب دسته‌بندی" 
                                        error={fieldState.error}
                                    />
                                )} 
                            />
                        </Box>

                        {/* Tags */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Tag /> برچسب‌ها
                            </Typography>
                            <Controller 
                                name="tags.fa" 
                                control={control} 
                                render={({ field }) => (
                                    <TagInput 
                                        {...field} 
                                        label="برچسب‌های فارسی" 
                                        placeholder="برچسب فارسی اضافه کنید..." 
                                        error={errors.tags?.fa}
                                    />
                                )} 
                            />
                            <Box sx={{ mt: 2 }}>
                                <Controller 
                                    name="tags.en" 
                                    control={control} 
                                    render={({ field }) => (
                                        <TagInput 
                                            {...field} 
                                            label="برچسب‌های انگلیسی" 
                                            placeholder="Add English tags..." 
                                            error={errors.tags?.en}
                                        />
                                    )} 
                                />
                            </Box>
                        </Box>

                        {/* Download Box */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Visibility /> باکس دانلود
                            </Typography>
                            <Stack spacing={2}>
                                <Controller
                                    name="downloadBox.isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel 
                                            control={<Switch {...field} checked={field.value} />} 
                                            label="فعال‌سازی باکس دانلود" 
                                        />
                                    )}
                                />
                                {watch("downloadBox.isActive") && (
                                    <>
                                        <Controller
                                            name="downloadBox.title"
                                            control={control}
                                            render={({ field }) => (
                                                <MultiLangTextField
                                                    {...field}
                                                    label="عنوان باکس دانلود"
                                                    error={errors.downloadBox?.title}
                                                    placeholder={{
                                                        fa: "عنوان باکس دانلود...",
                                                        en: "Download box title...",
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="downloadBox.description"
                                            control={control}
                                            render={({ field }) => (
                                                <MultiLangTextField
                                                    {...field}
                                                    label="توضیحات"
                                                    multiline
                                                    rows={2}
                                                    error={errors.downloadBox?.description}
                                                    placeholder={{
                                                        fa: "توضیحات فایل قابل دانلود...",
                                                        en: "Description of downloadable file...",
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="downloadBox.fileUrl"
                                            control={control}
                                            render={({ field }) => (
                                                <MediaPicker
                                                    value={field.value || null}
                                                    onChange={(selected) => {
                                                        const fileUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                                        const fileName = typeof selected === 'object' ? (selected.originalName || selected.fileName || "") : "";
                                                        const fileSize = typeof selected === 'object' ? (selected.size || 0) : 0;
                                                        const fileType = typeof selected === 'object' ? (selected.fileType || selected.mimeType || "") : "";
                                                        
                                                        field.onChange(fileUrl);
                                                        setValue("downloadBox.fileName", fileName);
                                                        setValue("downloadBox.fileSize", fileSize);
                                                        setValue("downloadBox.fileType", fileType);
                                                    }}
                                                    label="فایل قابل دانلود"
                                                    accept={["image/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/x-rar-compressed", "video/*", "audio/*"]}
                                                    showPreview={true}
                                                />
                                            )}
                                        />
                                    </>
                                )}
                            </Stack>
                        </Box>

                        {/* SEO Settings */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">تنظیمات سئو</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="metaTitle"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="عنوان Meta"
                                                error={errors.metaTitle}
                                                placeholder={{
                                                    fa: "عنوان سئو فارسی...",
                                                    en: "SEO title in English...",
                                                }}
                                                maxLength={60}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="metaDescription"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="توضیحات Meta"
                                                multiline
                                                rows={3}
                                                error={errors.metaDescription}
                                                placeholder={{
                                                    fa: "توضیحات سئو فارسی...",
                                                    en: "SEO description in English...",
                                                }}
                                                maxLength={160}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="metaKeywords.fa"
                                        control={control}
                                        render={({ field }) => (
                                            <TagInput 
                                                {...field} 
                                                label="کلمات کلیدی فارسی" 
                                                placeholder="کلمه کلیدی اضافه کنید..." 
                                                error={errors.metaKeywords?.fa}
                                            />
                                        )}
                                    />

                                    <Controller 
                                        name="metaKeywords.en" 
                                        control={control} 
                                        render={({ field }) => (
                                            <TagInput 
                                                {...field} 
                                                label="English Keywords" 
                                                placeholder="Add keyword..." 
                                                error={errors.metaKeywords?.en}
                                            />
                                        )} 
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button 
                    type="button"
                    variant="outlined" 
                    onClick={onCancel} 
                    disabled={loading} 
                    startIcon={<Cancel />}
                >
                    انصراف
                </Button>

                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={loading} 
                    startIcon={<Save />}
                >
                    {loading 
                        ? "در حال ذخیره..." 
                        : article 
                            ? "ویرایش مقاله" 
                            : "ایجاد مقاله"}
                </Button>
            </Box>

            {/* Dirty Form Warning */}
            {isDirty && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    تغییراتی در فرم ایجاد شده است. فراموش نکنید که آن‌ها را ذخیره کنید.
                </Alert>
            )}
        </Box>
    );
}
