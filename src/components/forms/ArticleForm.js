"use client";
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Switch, FormControlLabel, Button, Typography, Paper, Divider, Chip, Autocomplete } from "@mui/material";
import { Save, Cancel, Preview } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-mdx-editor/style.css";
import { useApi } from "../../hooks/useApi";

export default function ArticleForm({ article, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const { useFetchData, useCreateData, useUpdateData } = useApi();

    // Fetch categories for dropdown
    const { data: categoriesData } = useFetchData("categories", "/api/v1/categories");

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm({
        defaultValues: {
            title: { fa: "", en: "" },
            slug: { fa: "", en: "" },
            excerpt: { fa: "", en: "" },
            content: { fa: "", en: "" },
            featuredImage: "",
            category: "",
            tags: [],
            status: "draft",
            featured: false,
            allowComments: true,
            seoTitle: { fa: "", en: "" },
            seoDescription: { fa: "", en: "" },
            seoKeywords: { fa: "", en: "" },
        },
    });

    // Create and update mutations
    const createArticle = useCreateData("/api/v1/articles", {
        updateStore: true,
        storeKey: "articles",
        successMessage: "مقاله با موفقیت ایجاد شد",
    });

    const updateArticle = useUpdateData("/api/v1/articles", {
        updateStore: true,
        storeKey: "articles",
        successMessage: "مقاله با موفقیت به‌روزرسانی شد",
    });

    useEffect(() => {
        if (article) {
            reset(article);
        }
    }, [article, reset]);

    // Generate slug from title
    const generateSlug = (title, lang) => {
        const slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        setValue(`slug.${lang}`, slug);
    };

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            if (article) {
                await updateArticle.mutateAsync({ id: article._id, data });
            } else {
                await createArticle.mutateAsync(data);
            }

            if (onSave) onSave();
        } catch (error) {
            console.error("Error saving article:", error);
        } finally {
            setLoading(false);
        }
    };

    const quillModules = {
        toolbar: [
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ size: [] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
            ["link", "image", "video"],
            ["clean"],
        ],
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">{article ? "ویرایش مقاله" : "مقاله جدید"}</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button variant="outlined" startIcon={<Preview />} disabled={loading}>
                            پیش‌نمایش
                        </Button>
                        <Button variant="contained" type="submit" startIcon={<Save />} loading={loading} disabled={loading}>
                            {loading ? "در حال ذخیره..." : "ذخیره"}
                        </Button>
                        <Button variant="outlined" startIcon={<Cancel />} onClick={onCancel} disabled={loading}>
                            انصراف
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* Main Content */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3 }}>
                            {/* Persian Content */}
                            <Typography variant="h6" gutterBottom>
                                محتوای فارسی
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="title.fa"
                                        control={control}
                                        rules={{ required: "عنوان فارسی الزامی است" }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="عنوان فارسی"
                                                error={!!errors.title?.fa}
                                                helperText={errors.title?.fa?.message}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    generateSlug(e.target.value, "fa");
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="slug.fa"
                                        control={control}
                                        rules={{ required: "نامک فارسی الزامی است" }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="نامک فارسی (URL)"
                                                error={!!errors.slug?.fa}
                                                helperText={errors.slug?.fa?.message}
                                                InputProps={{
                                                    startAdornment: (
                                                        <Typography variant="body2" color="textSecondary">
                                                            hikaweb.ir/articles/
                                                        </Typography>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="excerpt.fa"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth multiline rows={3} label="خلاصه فارسی" helperText="خلاصه‌ای کوتاه از مقاله برای نمایش در لیست مقالات" />}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="content.fa"
                                        control={control}
                                        rules={{ required: "محتوای فارسی الزامی است" }}
                                        render={({ field }) => (
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    محتوای فارسی *
                                                </Typography>
                                                <MDEditor value={field.value} onChange={field.onChange} preview="edit" height={300} data-color-mode="light" />
                                                {errors.content?.fa && <FormHelperText error>{errors.content.fa.message}</FormHelperText>}
                                            </Box>
                                        )}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* English Content */}
                            <Typography variant="h6" gutterBottom>
                                محتوای انگلیسی
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="title.en"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="English Title"
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    generateSlug(e.target.value, "en");
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="slug.en"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="English Slug (URL)"
                                                InputProps={{
                                                    startAdornment: (
                                                        <Typography variant="body2" color="textSecondary">
                                                            hikaweb.ir/en/articles/
                                                        </Typography>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller name="excerpt.en" control={control} render={({ field }) => <TextField {...field} fullWidth multiline rows={3} label="English Excerpt" />} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="content.en"
                                        control={control}
                                        render={({ field }) => (
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    English Content
                                                </Typography>
                                                <MDEditor value={field.value} onChange={field.onChange} preview="edit" height={300} data-color-mode="light" />
                                            </Box>
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {/* Publish Settings */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    تنظیمات انتشار
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>وضعیت</InputLabel>
                                                <Select {...field} label="وضعیت">
                                                    <MenuItem value="draft">پیش‌نویس</MenuItem>
                                                    <MenuItem value="published">منتشر شده</MenuItem>
                                                    <MenuItem value="archived">بایگانی</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        name="featured"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="مقاله ویژه" />}
                                    />

                                    <Controller
                                        name="allowComments"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="اجازه نظردهی" />}
                                    />
                                </Box>
                            </Paper>

                            {/* Category & Tags */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    دسته‌بندی و برچسب‌ها
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Controller
                                        name="category"
                                        control={control}
                                        rules={{ required: "انتخاب دسته‌بندی الزامی است" }}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.category}>
                                                <InputLabel>دسته‌بندی</InputLabel>
                                                <Select {...field} label="دسته‌بندی">
                                                    {categoriesData?.data?.map((category) => (
                                                        <MenuItem key={category._id} value={category._id}>
                                                            {category.name.fa}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        name="tags"
                                        control={control}
                                        render={({ field }) => (
                                            <Autocomplete
                                                {...field}
                                                multiple
                                                freeSolo
                                                options={[]}
                                                renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)}
                                                renderInput={(params) => <TextField {...params} label="برچسب‌ها" helperText="برچسب‌ها را تایپ کرده و Enter بزنید" />}
                                                onChange={(_, value) => field.onChange(value)}
                                            />
                                        )}
                                    />
                                </Box>
                            </Paper>

                            {/* Featured Image */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    تصویر شاخص
                                </Typography>

                                <Controller
                                    name="featuredImage"
                                    control={control}
                                    render={({ field }) => (
                                        <Box>
                                            <TextField {...field} fullWidth label="URL تصویر" placeholder="https://example.com/image.jpg" />
                                            {field.value && (
                                                <Box sx={{ mt: 2 }}>
                                                    <img
                                                        src={field.value}
                                                        alt="تصویر شاخص"
                                                        style={{
                                                            width: "100%",
                                                            height: 200,
                                                            objectFit: "cover",
                                                            borderRadius: 8,
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                            <Button variant="outlined" sx={{ mt: 2 }} fullWidth>
                                                انتخاب تصویر
                                            </Button>
                                        </Box>
                                    )}
                                />
                            </Paper>

                            {/* SEO Settings */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    تنظیمات SEO
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Controller
                                        name="seoTitle.fa"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth label="عنوان SEO فارسی" helperText={`${field.value?.length || 0}/60 کاراکتر`} />}
                                    />

                                    <Controller
                                        name="seoDescription.fa"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth multiline rows={3} label="توضیحات SEO فارسی" helperText={`${field.value?.length || 0}/160 کاراکتر`} />}
                                    />

                                    <Controller
                                        name="seoKeywords.fa"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth label="کلمات کلیدی فارسی" helperText="کلمات را با کاما جدا کنید" />}
                                    />
                                </Box>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
}
