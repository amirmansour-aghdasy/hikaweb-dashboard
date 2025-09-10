"use client";
import {
    Box,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Switch,
    FormControlLabel,
    Button,
    Typography,
    Paper,
    Divider,
    Chip,
    Autocomplete,
    InputAdornment,
} from "@mui/material";
import { Save, Cancel, Add, Delete } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import dynamic from "next/dynamic";
import { useApi } from "../../hooks/useApi";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function ServiceForm({ service, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const { useFetchData, useCreateData, useUpdateData } = useApi();

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm({
        defaultValues: {
            name: { fa: "", en: "" },
            slug: { fa: "", en: "" },
            shortDescription: { fa: "", en: "" },
            fullDescription: { fa: "", en: "" },
            features: { fa: [], en: [] },
            pricing: {
                type: "custom", // fixed, hourly, custom
                basePrice: 0,
                currency: "IRR",
                description: { fa: "", en: "" },
            },
            processSteps: [],
            deliverables: { fa: [], en: [] },
            duration: "",
            category: "",
            tags: [],
            gallery: [],
            icon: "",
            status: "active",
            featured: false,
            popular: false,
            seoTitle: { fa: "", en: "" },
            seoDescription: { fa: "", en: "" },
            seoKeywords: { fa: "", en: "" },
        },
    });

    // Field array for process steps
    const {
        fields: processFields,
        append: appendProcess,
        remove: removeProcess,
    } = useFieldArray({
        control,
        name: "processSteps",
    });

    // Mutations
    const createService = useCreateData("/api/v1/services", {
        updateStore: true,
        storeKey: "services",
        successMessage: "خدمت با موفقیت ایجاد شد",
    });

    const updateService = useUpdateData("/api/v1/services", {
        updateStore: true,
        storeKey: "services",
        successMessage: "خدمت با موفقیت به‌روزرسانی شد",
    });

    useEffect(() => {
        if (service) {
            reset(service);
        }
    }, [service, reset]);

    const generateSlug = (name, lang) => {
        const slug = name
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        setValue(`slug.${lang}`, slug);
    };

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            if (service) {
                await updateService.mutateAsync({ id: service._id, data });
            } else {
                await createService.mutateAsync(data);
            }

            if (onSave) onSave();
        } catch (error) {
            console.error("Error saving service:", error);
        } finally {
            setLoading(false);
        }
    };

    const addProcessStep = () => {
        appendProcess({
            title: { fa: "", en: "" },
            description: { fa: "", en: "" },
            order: processFields.length + 1,
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">{service ? "ویرایش خدمت" : "خدمت جدید"}</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button variant="contained" type="submit" startIcon={<Save />} disabled={loading}>
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
                            {/* Basic Information */}
                            <Typography variant="h6" gutterBottom>
                                اطلاعات پایه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="name.fa"
                                        control={control}
                                        rules={{ required: "نام فارسی الزامی است" }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="نام خدمت (فارسی)"
                                                error={!!errors.name?.fa}
                                                helperText={errors.name?.fa?.message}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    generateSlug(e.target.value, "fa");
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="name.en"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="Service Name (English)"
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    generateSlug(e.target.value, "en");
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="slug.fa"
                                        control={control}
                                        rules={{ required: "نامک فارسی الزامی است" }}
                                        render={({ field }) => <TextField {...field} fullWidth label="نامک فارسی (URL)" error={!!errors.slug?.fa} helperText={errors.slug?.fa?.message} />}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller name="slug.en" control={control} render={({ field }) => <TextField {...field} fullWidth label="English Slug (URL)" />} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="shortDescription.fa"
                                        control={control}
                                        rules={{ required: "توضیح کوتاه فارسی الزامی است" }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                multiline
                                                rows={3}
                                                label="توضیح کوتاه (فارسی)"
                                                error={!!errors.shortDescription?.fa}
                                                helperText={errors.shortDescription?.fa?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="shortDescription.en"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth multiline rows={3} label="Short Description (English)" />}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Full Description */}
                            <Typography variant="h6" gutterBottom>
                                توضیحات کامل
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="fullDescription.fa"
                                        control={control}
                                        render={({ field }) => (
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    توضیحات کامل فارسی
                                                </Typography>
                                                <ReactQuill {...field} style={{ height: 300, marginBottom: 50 }} placeholder="توضیحات کامل خدمت را وارد کنید..." />
                                            </Box>
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller
                                        name="fullDescription.en"
                                        control={control}
                                        render={({ field }) => (
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    Full Description (English)
                                                </Typography>
                                                <MDEditor value={field.value} onChange={field.onChange} preview="edit" height={300} data-color-mode="light" />
                                            </Box>
                                        )}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Process Steps */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6">مراحل انجام کار</Typography>
                                <Button variant="outlined" startIcon={<Add />} onClick={addProcessStep} size="small">
                                    افزودن مرحله
                                </Button>
                            </Box>

                            {processFields.map((field, index) => (
                                <Paper key={field.id} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                        <Typography variant="subtitle2">مرحله {index + 1}</Typography>
                                        <Button size="small" color="error" onClick={() => removeProcess(index)}>
                                            <Delete />
                                        </Button>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Controller
                                                name={`processSteps.${index}.title.fa`}
                                                control={control}
                                                render={({ field }) => <TextField {...field} fullWidth label="عنوان مرحله (فارسی)" size="small" />}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Controller
                                                name={`processSteps.${index}.title.en`}
                                                control={control}
                                                render={({ field }) => <TextField {...field} fullWidth label="Step Title (English)" size="small" />}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Controller
                                                name={`processSteps.${index}.description.fa`}
                                                control={control}
                                                render={({ field }) => <TextField {...field} fullWidth multiline rows={2} label="توضیحات مرحله (فارسی)" size="small" />}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Paper>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {/* Status & Settings */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    تنظیمات
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>وضعیت</InputLabel>
                                                <Select {...field} label="وضعیت">
                                                    <MenuItem value="active">فعال</MenuItem>
                                                    <MenuItem value="inactive">غیرفعال</MenuItem>
                                                    <MenuItem value="archived">بایگانی</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        name="featured"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="خدمت ویژه" />}
                                    />

                                    <Controller
                                        name="popular"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="خدمت محبوب" />}
                                    />
                                </Box>
                            </Paper>

                            {/* Pricing */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    قیمت‌گذاری
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Controller
                                        name="pricing.type"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>نوع قیمت‌گذاری</InputLabel>
                                                <Select {...field} label="نوع قیمت‌گذاری">
                                                    <MenuItem value="fixed">قیمت ثابت</MenuItem>
                                                    <MenuItem value="hourly">ساعتی</MenuItem>
                                                    <MenuItem value="custom">سفارشی</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    {watch("pricing.type") !== "custom" && (
                                        <Controller
                                            name="pricing.basePrice"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    type="number"
                                                    label="قیمت پایه"
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">تومان</InputAdornment>,
                                                    }}
                                                />
                                            )}
                                        />
                                    )}

                                    <Controller name="pricing.description.fa" control={control} render={({ field }) => <TextField {...field} fullWidth multiline rows={3} label="توضیحات قیمت" />} />
                                </Box>
                            </Paper>

                            {/* Duration */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    مدت زمان انجام
                                </Typography>

                                <Controller
                                    name="duration"
                                    control={control}
                                    render={({ field }) => <TextField {...field} fullWidth label="مدت زمان" placeholder="مثلاً: ۱-۲ هفته" helperText="مدت زمان تقریبی انجام کار" />}
                                />
                            </Paper>

                            {/* Tags */}
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    برچسب‌ها
                                </Typography>

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
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
}
