"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Divider, Accordion, AccordionSummary, AccordionDetails, Alert, Stack } from "@mui/material";
import { Save, Cancel, ExpandMore, Publish, Star, Visibility, Language, Image, Tag, Category, Person, Article } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function ArticleForm({ article, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createArticle = useCreateData("/articles", {
        queryKey: "articles"
    });
    const updateArticle = useUpdateData("/articles", {
        queryKey: "articles"
    });

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            title: { fa: "", en: "" },
            slug: { fa: "", en: "" },
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
        },
    });

    // Watch title changes to auto-generate slug
    const watchedTitle = watch("title");

    useEffect(() => {
        if (article) {
            // Handle categories - they might be populated objects or just ObjectIds
            const categoriesValue = Array.isArray(article.categories)
                ? article.categories.map(cat => 
                    typeof cat === 'object' && cat._id ? cat._id : cat
                  )
                : [];
            
            // Normalize multi-lang fields to ensure they're always objects
            const normalizeMultiLang = (value) => {
                if (!value) return { fa: "", en: "" };
                if (typeof value === 'string') return { fa: value, en: "" };
                if (typeof value === 'object') {
                    return {
                        fa: value.fa || "",
                        en: value.en || ""
                    };
                }
                return { fa: "", en: "" };
            };
            
            reset({
                title: normalizeMultiLang(article.title),
                slug: normalizeMultiLang(article.slug),
                excerpt: normalizeMultiLang(article.excerpt),
                content: normalizeMultiLang(article.content),
                featuredImage: article.featuredImage || "",
                categories: categoriesValue,
                tags: article.tags || { fa: [], en: [] },
                isPublished: article.isPublished || false,
                isFeatured: article.isFeatured || false,
                allowComments: article.allowComments !== false,
                metaTitle: normalizeMultiLang(article.seo?.metaTitle),
                metaDescription: normalizeMultiLang(article.seo?.metaDescription),
                metaKeywords: article.seo?.metaKeywords || { fa: [], en: [] },
            }, { keepDefaultValues: false });
        } else {
            // Reset to default when no article
            reset({
                title: { fa: "", en: "" },
                slug: { fa: "", en: "" },
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
            }, { keepDefaultValues: false });
        }
    }, [article, reset]);

    // Auto-generate slug from title
    useEffect(() => {
        if (watchedTitle?.fa && !article) {
            const slug = {
                fa: generateSlugFa(watchedTitle.fa),
                en: watchedTitle.en ? generateSlugEn(watchedTitle.en) : "",
            };
            setValue("slug", slug);
        }
    }, [watchedTitle, setValue, article]);

    // Generate slug for Persian (only replace spaces with dash, keep Persian characters)
    const generateSlugFa = (title) => {
        if (!title) return "";
        return title
            .trim()
            .replace(/[\s\u200C\u200D]+/g, "-") // Replace spaces and zero-width characters with dash
            .replace(/-+/g, "-") // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
    };

    // Generate slug for English (only a-z, 0-9, -)
    const generateSlugEn = (title) => {
        if (!title) return "";
        return title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "") // Only keep a-z, 0-9, spaces, and dashes
            .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with dash
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
    };

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            console.log("Form data before processing:", data);
            
            // Convert categories to strings (ObjectIds)
            const categories = Array.isArray(data.categories)
                ? data.categories.map(cat => {
                    // If it's an object with _id, use _id; otherwise use the value directly
                    if (typeof cat === 'object' && cat !== null) {
                        return cat._id || cat.id || String(cat);
                    }
                    return String(cat);
                })
                : [];

            // Build SEO object - only include fields that have non-empty values
            const seo = {};
            if (data.metaTitle) {
                const metaTitle = {};
                if (data.metaTitle.fa?.trim()) metaTitle.fa = data.metaTitle.fa.trim();
                if (data.metaTitle.en?.trim()) metaTitle.en = data.metaTitle.en.trim();
                if (Object.keys(metaTitle).length > 0) seo.metaTitle = metaTitle;
            }
            if (data.metaDescription) {
                const metaDescription = {};
                if (data.metaDescription.fa?.trim()) metaDescription.fa = data.metaDescription.fa.trim();
                if (data.metaDescription.en?.trim()) metaDescription.en = data.metaDescription.en.trim();
                if (Object.keys(metaDescription).length > 0) seo.metaDescription = metaDescription;
            }
            if (data.metaKeywords) {
                const metaKeywords = {};
                if (Array.isArray(data.metaKeywords.fa) && data.metaKeywords.fa.length > 0) {
                    metaKeywords.fa = data.metaKeywords.fa;
                }
                if (Array.isArray(data.metaKeywords.en) && data.metaKeywords.en.length > 0) {
                    metaKeywords.en = data.metaKeywords.en;
                }
                if (Object.keys(metaKeywords).length > 0) seo.metaKeywords = metaKeywords;
            }

            // Ensure slug.en is not empty - use slug.fa if empty
            const slug = data.slug || { fa: "", en: "" };
            if (!slug.en || slug.en.trim() === "") {
                slug.en = slug.fa || generateSlug(data.title?.fa || "");
            }
            
            // Ensure content.en is not empty - backend requires it
            const content = data.content || { fa: "", en: "" };
            if (!content.en || content.en.trim() === "") {
                // If English content is empty, use a placeholder or copy from Persian
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
                slug: slug,
                excerpt: excerpt,
                content: content,
                featuredImage: data.featuredImage || "",
                categories,
                tags: data.tags || { fa: [], en: [] },
                isPublished: data.isPublished || false,
                isFeatured: data.isFeatured || false,
                allowComments: data.allowComments !== false,
            };

            // Only add seo if it has at least one field
            if (Object.keys(seo).length > 0) {
                articleData.seo = seo;
            }

            console.log("Article data to send:", articleData);

            if (article) {
                await updateArticle.mutateAsync({
                    id: article._id,
                    data: articleData,
                });
            } else {
                await createArticle.mutateAsync(articleData);
            }

            toast.success(article ? "مقاله با موفقیت ویرایش شد" : "مقاله با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            console.error("Error saving article:", error);
            console.error("Error response:", error?.response?.data);
            
            // Handle validation errors from backend
            if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const validationErrors = error.response.data.errors;
                const firstError = validationErrors[0];
                const errorMessage = firstError?.message || error?.response?.data?.message || "خطا در ذخیره مقاله";
                toast.error(errorMessage);
            } else {
                const errorMessage = error?.response?.data?.message || error?.message || "خطا در ذخیره مقاله";
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
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

    const onError = (errors) => {
        console.error("Form validation errors:", errors);
        // Show first error with better message handling
        const firstError = Object.keys(errors)[0];
        if (firstError) {
            let errorMessage = "لطفاً تمام فیلدهای الزامی را پر کنید";
            
            // Handle nested validation errors
            const errorObj = errors[firstError];
            if (errorObj) {
                // Check if it's a validation error object
                if (errorObj.message) {
                    errorMessage = errorObj.message;
                } else if (errorObj.type) {
                    // Handle validation type errors
                    const typeMessages = {
                        faRequired: `فیلد ${firstError === 'title' ? 'عنوان' : firstError === 'content' ? 'محتوا' : firstError} فارسی الزامی است`,
                        enRequired: `فیلد ${firstError === 'title' ? 'عنوان' : firstError} انگلیسی الزامی است`,
                    };
                    errorMessage = typeMessages[errorObj.type] || errorObj.message || `فیلد ${firstError} الزامی است`;
                } else if (typeof errorObj === 'string') {
                    errorMessage = errorObj;
                }
            }
            
            toast.error(errorMessage);
        } else {
            toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
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
                                        required
                                        error={errors.title}
                                        placeholder={{
                                            fa: "عنوان مقاله به فارسی...",
                                            en: "Article title in English...",
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Slug Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                نامک (URL Slug)
                            </Typography>
                            <Controller
                                name="slug"
                                control={control}
                                render={({ field }) => (
                                    <MultiLangTextField
                                        {...field}
                                        label="نامک"
                                        placeholder={{
                                            fa: "article-slug-in-persian",
                                            en: "article-slug-in-english",
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
                                        required 
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
                                    />
                                )}
                            />
                        </Box>

                        {/* Categories */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Category /> دسته‌بندی
                            </Typography>
                            <Controller name="categories" control={control} render={({ field }) => <CategorySelector {...field} type="article" label="انتخاب دسته‌بندی" />} />
                        </Box>

                        {/* Tags */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Tag /> برچسب‌ها
                            </Typography>
                            <Controller name="tags.fa" control={control} render={({ field }) => <TagInput {...field} label="برچسب‌های فارسی" placeholder="برچسب فارسی اضافه کنید..." />} />
                            <Box sx={{ mt: 2 }}>
                                <Controller name="tags.en" control={control} render={({ field }) => <TagInput {...field} label="برچسب‌های انگلیسی" placeholder="Add English tags..." />} />
                            </Box>
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
                                        render={({ field }) => <TagInput {...field} label="کلمات کلیدی فارسی" placeholder="کلمه کلیدی اضافه کنید..." />}
                                    />

                                    <Controller name="metaKeywords.en" control={control} render={({ field }) => <TagInput {...field} label="English Keywords" placeholder="Add keyword..." />} />
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
                    disabled={loading || updateArticle.isPending || createArticle.isPending} 
                    startIcon={<Cancel />}
                >
                    انصراف
                </Button>

                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={loading || updateArticle.isPending || createArticle.isPending} 
                    startIcon={<Save />}
                >
                    {loading || updateArticle.isPending || createArticle.isPending 
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
