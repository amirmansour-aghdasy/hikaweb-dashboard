"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, FormControl, InputLabel, Select, MenuItem, Stack, Rating, Divider } from "@mui/material";
import { Save, Cancel, Business, Person, Language, Email, Phone, Star, Image, Link as LinkIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MediaUploader from "../media/MediaUploader";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

const INDUSTRY_OPTIONS = [
    { value: "technology", label: "فناوری" },
    { value: "healthcare", label: "بهداشت و درمان" },
    { value: "finance", label: "مالی" },
    { value: "education", label: "آموزش" },
    { value: "retail", label: "خرده‌فروشی" },
    { value: "manufacturing", label: "تولیدی" },
    { value: "services", label: "خدمات" },
    { value: "food", label: "غذا و نوشیدنی" },
    { value: "travel", label: "سفر و گردشگری" },
    { value: "real_estate", label: "املاک" },
    { value: "automotive", label: "خودرو" },
    { value: "fashion", label: "مد و پوشاک" },
    { value: "sports", label: "ورزش" },
    { value: "entertainment", label: "سرگرمی" },
    { value: "other", label: "سایر" },
];

const COMPANY_SIZE_OPTIONS = [
    { value: "startup", label: "استارتاپ (1-10 نفر)" },
    { value: "small", label: "کوچک (11-50 نفر)" },
    { value: "medium", label: "متوسط (51-200 نفر)" },
    { value: "large", label: "بزرگ (201-1000 نفر)" },
    { value: "enterprise", label: "سازمانی (1000+ نفر)" },
];

export default function BrandForm({ brand, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createBrand = useCreateData("/brands");
    const updateBrand = useUpdateData("/brands");

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            name: "",
            description: "",
            logo: "",
            website: "",
            industry: "other",
            companySize: "small",
            foundedYear: "",
            contactPerson: "",
            email: "",
            phone: "",
            address: "",
            socialMedia: {
                linkedin: "",
                twitter: "",
                instagram: "",
                facebook: "",
                youtube: "",
            },
            startDate: "",
            endDate: "",
            rating: 0,
            projectsCount: 0,
            totalRevenue: "",
            notes: "",
            isFeatured: false,
            isActive: true,
            tags: [],
        },
    });

    useEffect(() => {
        if (brand) {
            reset({
                name: brand.name || "",
                description: brand.description || "",
                logo: brand.logo || "",
                website: brand.website || "",
                industry: brand.industry || "other",
                companySize: brand.companySize || "small",
                foundedYear: brand.foundedYear || "",
                contactPerson: brand.contactPerson || "",
                email: brand.email || "",
                phone: brand.phone || "",
                address: brand.address || "",
                socialMedia: brand.socialMedia || {
                    linkedin: "",
                    twitter: "",
                    instagram: "",
                    facebook: "",
                    youtube: "",
                },
                startDate: brand.startDate ? brand.startDate.split("T")[0] : "",
                endDate: brand.endDate ? brand.endDate.split("T")[0] : "",
                rating: brand.rating || 0,
                projectsCount: brand.projectsCount || 0,
                totalRevenue: brand.totalRevenue || "",
                notes: brand.notes || "",
                isFeatured: brand.isFeatured || false,
                isActive: brand.status === "active",
                tags: brand.tags || [],
            });
        }
    }, [brand, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            const brandData = {
                ...data,
                status: data.isActive ? "active" : "inactive",
            };

            if (brand) {
                await updateBrand.mutateAsync({
                    id: brand._id,
                    data: brandData,
                });
            } else {
                await createBrand.mutateAsync(brandData);
            }

            toast.success(brand ? "برند با موفقیت ویرایش شد" : "برند با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            console.error("Error saving brand:", error);
            toast.error("خطا در ذخیره برند");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (images) => {
        if (images.length > 0) {
            setValue("logo", images[0].url);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Stack spacing={3}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Business /> اطلاعات پایه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{ required: "نام برند الزامی است" }}
                                        render={({ field }) => <TextField {...field} label="نام برند" required error={!!errors.name} helperText={errors.name?.message} fullWidth />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="توضیحات" multiline rows={3} fullWidth placeholder="توضیح مختصری از برند، فعالیت‌ها و خدمات..." />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="website"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="وب‌سایت"
                                                placeholder="https://example.com"
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <Language sx={{ mr: 1, color: "text.secondary" }} />,
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="foundedYear"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="سال تأسیس" type="number" fullWidth inputProps={{ min: 1900, max: new Date().getFullYear() }} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="industry"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>صنعت</InputLabel>
                                                <Select {...field} label="صنعت">
                                                    {INDUSTRY_OPTIONS.map((industry) => (
                                                        <MenuItem key={industry.value} value={industry.value}>
                                                            {industry.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="companySize"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>اندازه شرکت</InputLabel>
                                                <Select {...field} label="اندازه شرکت">
                                                    {COMPANY_SIZE_OPTIONS.map((size) => (
                                                        <MenuItem key={size.value} value={size.value}>
                                                            {size.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="address"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="آدرس" fullWidth placeholder="آدرس دفتر مرکزی یا شعبه اصلی..." />}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Contact Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Person /> اطلاعات تماس
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="contactPerson"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="نام شخص رابط"
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        rules={{
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "فرمت ایمیل صحیح نیست",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="ایمیل"
                                                type="email"
                                                error={!!errors.email}
                                                helperText={errors.email?.message}
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="تلفن"
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />,
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Social Media */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LinkIcon /> شبکه‌های اجتماعی
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="socialMedia.linkedin"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="LinkedIn" placeholder="https://linkedin.com/company/..." fullWidth />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="socialMedia.twitter"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Twitter" placeholder="https://twitter.com/..." fullWidth />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="socialMedia.instagram"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Instagram" placeholder="https://instagram.com/..." fullWidth />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="socialMedia.facebook"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Facebook" placeholder="https://facebook.com/..." fullWidth />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="socialMedia.youtube"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="YouTube" placeholder="https://youtube.com/c/..." fullWidth />}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Notes */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                یادداشت‌ها
                            </Typography>

                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => <TextField {...field} label="یادداشت‌های اضافی" multiline rows={4} fullWidth placeholder="یادداشت‌ها، نکات مهم، تاریخچه همکاری و..." />}
                            />
                        </Box>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={3}>
                        {/* Logo */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> لوگوی برند
                            </Typography>
                            <Controller
                                name="logo"
                                control={control}
                                render={({ field }) => (
                                    <MediaUploader value={field.value ? [{ url: field.value, type: "image/*" }] : []} onChange={handleLogoUpload} single acceptedTypes={["image/*"]} maxSizeInMB={2} />
                                )}
                            />
                        </Box>

                        {/* Collaboration Period */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                دوره همکاری
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="تاریخ شروع همکاری" type="date" InputLabelProps={{ shrink: true }} fullWidth />}
                                />

                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="تاریخ پایان همکاری" type="date" InputLabelProps={{ shrink: true }} fullWidth helperText="اختیاری - فقط در صورت پایان همکاری" />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Performance Metrics */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                شاخص‌های عملکرد
                            </Typography>

                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        رضایت کلی
                                    </Typography>
                                    <Controller
                                        name="rating"
                                        control={control}
                                        render={({ field }) => <Rating {...field} value={field.value || 0} onChange={(_, newValue) => field.onChange(newValue)} precision={0.5} size="large" />}
                                    />
                                </Box>

                                <Controller
                                    name="projectsCount"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="تعداد پروژه‌های انجام شده" type="number" fullWidth inputProps={{ min: 0 }} />}
                                />

                                <Controller
                                    name="totalRevenue"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="کل درآمد (ریال)" type="number" fullWidth inputProps={{ min: 0 }} placeholder="1000000" />}
                                />
                            </Stack>
                        </Box>

                        {/* Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات
                            </Typography>

                            <Stack spacing={2}>
                                <Controller name="isActive" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="فعال" />} />

                                <Controller name="isFeatured" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="برند ویژه" />} />
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={onCancel} disabled={loading} startIcon={<Cancel />}>
                    انصراف
                </Button>

                <Button type="submit" variant="contained" disabled={loading} startIcon={<Save />}>
                    {loading ? "در حال ذخیره..." : brand ? "ویرایش برند" : "ایجاد برند"}
                </Button>
            </Box>
        </Box>
    );
}
