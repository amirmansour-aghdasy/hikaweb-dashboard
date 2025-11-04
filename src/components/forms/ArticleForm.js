"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Divider, Accordion, AccordionSummary, AccordionDetails, Alert, Stack } from "@mui/material";
import { Save, Cancel, ExpandMore, Publish, Star, Visibility, Language, Image, Tag, Category, Person, Article } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaUploader from "../media/MediaUploader";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function ArticleForm({ article, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createArticle = useCreateData("/articles");
    const updateArticle = useUpdateData("/articles");

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
            
            reset({
                title: article.title || { fa: "", en: "" },
                slug: article.slug || { fa: "", en: "" },
                excerpt: article.excerpt || { fa: "", en: "" },
                content: article.content || { fa: "", en: "" },
                featuredImage: article.featuredImage || "",
                categories: categoriesValue,
                tags: article.tags || { fa: [], en: [] },
                isPublished: article.isPublished || false,
                isFeatured: article.isFeatured || false,
                allowComments: article.allowComments !== false,
                metaTitle: article.seo?.metaTitle || { fa: "", en: "" },
                metaDescription: article.seo?.metaDescription || { fa: "", en: "" },
                metaKeywords: article.seo?.metaKeywords || { fa: [], en: [] },
            });
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
            });
        }
    }, [article, reset]);

    // Auto-generate slug from title
    useEffect(() => {
        if (watchedTitle?.fa && !article) {
            const slug = {
                fa: generateSlug(watchedTitle.fa),
                en: watchedTitle.en ? generateSlug(watchedTitle.en) : "",
            };
            setValue("slug", slug);
        }
    }, [watchedTitle, setValue, article]);

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            const articleData = {
                ...data,
                seo: {
                    metaTitle: data.metaTitle,
                    metaDescription: data.metaDescription,
                    metaKeywords: data.metaKeywords,
                },
            };

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
            toast.error("خطا در ذخیره مقاله");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (images) => {
        if (images.length > 0) {
            setValue("featuredImage", images[0].url);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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
                                        faRequired: (value) => value.fa?.trim() || "عنوان فارسی الزامی است",
                                        enRequired: (value) => value.en?.trim() || "عنوان انگلیسی الزامی است",
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
                                        faRequired: (value) => value.fa?.trim() || "محتوای فارسی الزامی است",
                                    },
                                }}
                                render={({ field }) => <MultiLangEditor {...field} label="محتوا" required error={errors.content} height={400} />}
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
                                    <MediaUploader value={field.value ? [{ url: field.value, type: "image/*" }] : []} onChange={handleImageUpload} single acceptedTypes={["image/*"]} maxSizeInMB={2} />
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
                <Button variant="outlined" onClick={onCancel} disabled={loading} startIcon={<Cancel />}>
                    انصراف
                </Button>

                <Button type="submit" variant="contained" disabled={loading} startIcon={<Save />}>
                    {loading ? "در حال ذخیره..." : article ? "ویرایش مقاله" : "ایجاد مقاله"}
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
