"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, FormControl, InputLabel, Select, MenuItem, Stack, Chip, Avatar, useTheme } from "@mui/material";
import { Save, Cancel, Category, ColorLens, Reorder } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

const CATEGORY_TYPES = [
    { value: "article", label: "مقاله" },
    { value: "service", label: "خدمت" },
    { value: "portfolio", label: "نمونه کار" },
    { value: "general", label: "عمومی" },
];

const PRESET_COLORS = ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2", "#303f9f", "#c2185b", "#00796b", "#455a64", "#8bc34a", "#ff9800", "#9c27b0"];

export default function CategoryForm({ category, onSave, onCancel }) {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData, useFetchData } = useApi();

    const createCategory = useCreateData("/categories");
    const updateCategory = useUpdateData("/categories");

    // Fetch parent categories
    const { data: categoriesData } = useFetchData("parent-categories", "/categories?status=active");

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            name: { fa: "", en: "" },
            slug: { fa: "", en: "" },
            description: { fa: "", en: "" },
            type: "general",
            parent: "",
            color: "#1976d2",
            icon: "",
            order: 0,
            isActive: true,
            metaTitle: { fa: "", en: "" },
            metaDescription: { fa: "", en: "" },
        },
    });

    const watchedName = watch("name");
    const watchedType = watch("type");
    const watchedColor = watch("color");

    useEffect(() => {
        if (category) {
            reset({
                name: category.name || { fa: "", en: "" },
                slug: category.slug || { fa: "", en: "" },
                description: category.description || { fa: "", en: "" },
                type: category.type || "general",
                parent: category.parent?._id || "",
                color: category.color || "#1976d2",
                icon: category.icon || "",
                order: category.order || 0,
                isActive: category.status === "active",
                metaTitle: category.seo?.metaTitle || { fa: "", en: "" },
                metaDescription: category.seo?.metaDescription || { fa: "", en: "" },
            });
        }
    }, [category, reset]);

    // Auto-generate slug from name (only in create mode)
    useEffect(() => {
        // Only auto-generate in create mode (not edit mode)
        if (!category && watchedName?.fa) {
            const newSlugFa = generateSlug(watchedName.fa, true);
            const newSlugEn = watchedName.en ? generateSlug(watchedName.en, false) : "";
            
            // Get current slug value
            const currentSlug = watch("slug");
            const currentSlugFa = currentSlug?.fa || "";
            
            // Auto-generate if slug is empty or if it matches the auto-generated version
            // This allows manual editing: if user manually changes slug, it won't be overwritten
            if (newSlugFa && (!currentSlugFa || currentSlugFa === newSlugFa)) {
                setValue("slug", {
                    fa: newSlugFa,
                    en: newSlugEn,
                }, { shouldValidate: false, shouldDirty: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedName?.fa, watchedName?.en]);

    // Generate slug - for Persian: replace spaces, remove dots and commas, for English: clean to a-z, 0-9, -
    const generateSlug = (title, isPersian = false) => {
        if (!title) return "";
        if (isPersian) {
            // For Persian: replace spaces with dash, remove dots and commas, keep all Persian characters
            return title
                .trim()
                .replace(/[،,\.]/g, "") // Remove Persian comma (،), English comma, and dots
                .replace(/\s+/g, "-") // Replace spaces with dash
                .replace(/-+/g, "-") // Replace multiple dashes with single dash
                .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
        } else {
            // For English: only a-z, 0-9, -
            return title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "") // Only keep a-z, 0-9, spaces, and dashes
                .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with dash
                .replace(/-+/g, "-") // Replace multiple dashes with single dash
                .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            const categoryData = {
                ...data,
                status: data.isActive ? "active" : "inactive",
                seo: {
                    metaTitle: data.metaTitle,
                    metaDescription: data.metaDescription,
                },
            };

            if (category) {
                await updateCategory.mutateAsync({
                    id: category._id,
                    data: categoryData,
                });
            } else {
                await createCategory.mutateAsync(categoryData);
            }

            toast.success(category ? "دسته‌بندی با موفقیت ویرایش شد" : "دسته‌بندی با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            // Don't log to console - show user-friendly error message
            toast.error("خطا در ذخیره دسته‌بندی");
        } finally {
            setLoading(false);
        }
    };

    // Filter parent categories based on type and exclude self
    const categoriesArray = categoriesData?.data?.categories || categoriesData?.data || [];
    const parentCategories = Array.isArray(categoriesArray) 
        ? categoriesArray.filter((cat) => cat.type === watchedType && cat._id !== category?._id)
        : [];

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{xs:12, md:8}}>
                    <Stack spacing={3}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Category /> اطلاعات پایه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{xs:12}}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => value.fa?.trim() || "نام فارسی الزامی است",
                                                enRequired: (value) => value.en?.trim() || "نام انگلیسی الزامی است",
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="نام دسته‌بندی" required error={errors.name} />}
                                    />
                                </Grid>

                                <Grid size={{xs:12}}>
                                    <Controller name="slug" control={control} render={({ field }) => <MultiLangTextField {...field} label="نامک (URL Slug)" />} />
                                </Grid>

                                <Grid size={{xs:12}}>
                                    <Controller name="description" control={control} render={({ field }) => <MultiLangTextField {...field} label="توضیحات" multiline rows={3} />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* SEO */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات سئو
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{xs:12}}>
                                    <Controller name="metaTitle" control={control} render={({ field }) => <MultiLangTextField {...field} label="عنوان Meta" maxLength={60} />} />
                                </Grid>

                                <Grid size={{xs:12}}>
                                    <Controller
                                        name="metaDescription"
                                        control={control}
                                        render={({ field }) => <MultiLangTextField {...field} label="توضیحات Meta" multiline rows={2} maxLength={160} />}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{xs:12, md:4}}>
                    <Stack spacing={3}>
                        {/* Category Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات دسته‌بندی
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>نوع دسته‌بندی</InputLabel>
                                            <Select {...field} label="نوع دسته‌بندی">
                                                {CATEGORY_TYPES.map((type) => (
                                                    <MenuItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />

                                <Controller
                                    name="parent"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>دسته والد</InputLabel>
                                            <Select {...field} label="دسته والد">
                                                <MenuItem value="">دسته اصلی</MenuItem>
                                                {parentCategories.map((cat) => (
                                                    <MenuItem key={cat._id} value={cat._id}>
                                                        {cat.name?.fa || cat.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />

                                <Controller
                                    name="order"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="ترتیب نمایش"
                                            type="number"
                                            fullWidth
                                            InputProps={{
                                                startAdornment: <Reorder sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    )}
                                />

                                <Controller name="isActive" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="فعال" />} />
                            </Stack>
                        </Box>

                        {/* Visual Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ColorLens /> ظاهر
                            </Typography>

                            <Stack spacing={2}>
                                <Controller name="icon" control={control} render={({ field }) => <TextField {...field} label="آیکون (emoji یا نام)" placeholder="📝 یا category" fullWidth />} />

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        رنگ دسته‌بندی
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <Avatar sx={{ bgcolor: watchedColor, width: 32, height: 32 }}>{watchedName?.fa?.charAt(0) || "؟"}</Avatar>
                                        <Controller name="color" control={control} render={({ field }) => <TextField {...field} type="color" size="small" sx={{ width: 60 }} />} />
                                    </Box>

                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                        {PRESET_COLORS.map((color) => (
                                            <Chip
                                                key={color}
                                                onClick={() => setValue("color", color)}
                                                sx={{
                                                    bgcolor: color,
                                                    width: 24,
                                                    height: 24,
                                                    cursor: "pointer",
                                                    border: watchedColor === color ? `2px solid ${theme.palette.mode === "dark" ? "#fff" : "#000"}` : "none",
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={onCancel} disabled={loading} startIcon={<Cancel />}>
                    انصراف
                </Button>

                <Button type="submit" variant="contained" disabled={loading} startIcon={<Save />}>
                    {loading ? "در حال ذخیره..." : category ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی"}
                </Button>
            </Box>
        </Box>
    );
}
