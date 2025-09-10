"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, FormControl, InputLabel, Select, MenuItem, Stack, Chip, Avatar } from "@mui/material";
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
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData, useFetchData } = useApi();

    const createCategory = useCreateData("/api/v1/categories");
    const updateCategory = useUpdateData("/api/v1/categories");

    // Fetch parent categories
    const { data: categoriesData } = useFetchData("parent-categories", "/api/v1/categories?status=active");

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

    // Auto-generate slug from name
    useEffect(() => {
        if (watchedName?.fa && !category) {
            const slug = {
                fa: generateSlug(watchedName.fa),
                en: watchedName.en ? generateSlug(watchedName.en) : "",
            };
            setValue("slug", slug);
        }
    }, [watchedName, setValue, category]);

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
            console.error("Error saving category:", error);
            toast.error("خطا در ذخیره دسته‌بندی");
        } finally {
            setLoading(false);
        }
    };

    // Filter parent categories based on type and exclude self
    const parentCategories = categoriesData?.data?.filter((cat) => cat.type === watchedType && cat._id !== category?._id) || [];

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid item xs={12} md={8}>
                    <Stack spacing={3}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Category /> اطلاعات پایه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
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

                                <Grid item xs={12}>
                                    <Controller name="slug" control={control} render={({ field }) => <MultiLangTextField {...field} label="نامک (URL Slug)" />} />
                                </Grid>

                                <Grid item xs={12}>
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
                                <Grid item xs={12}>
                                    <Controller name="metaTitle" control={control} render={({ field }) => <MultiLangTextField {...field} label="عنوان Meta" maxLength={60} />} />
                                </Grid>

                                <Grid item xs={12}>
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
                <Grid item xs={12} md={4}>
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
                                                    border: watchedColor === color ? "2px solid #000" : "none",
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
