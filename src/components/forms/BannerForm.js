"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Stack, Divider, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { Save, Cancel, BrandingWatermark, Image, Link as LinkIcon, ExpandMore, Schedule } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MediaPicker from "../media/MediaPicker";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function BannerForm({ banner, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createBanner = useCreateData("/banners");
    const updateBanner = useUpdateData("/banners");

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            title: { fa: "", en: "" },
            description: { fa: "", en: "" },
            image: "",
            mobileImage: "",
            link: {
                url: "",
                target: "_self",
                text: { fa: "", en: "" },
            },
            position: "home-page-banners",
            orderIndex: 0,
            isActive: true,
            schedule: {
                startDate: "",
                endDate: "",
                isScheduled: false,
            },
            settings: {
                altText: { fa: "", en: "" },
                showOnMobile: true,
                showOnDesktop: true,
            },
            status: "active",
        },
    });

    useEffect(() => {
        if (banner) {
            reset({
                title: banner.title || { fa: "", en: "" },
                description: banner.description || { fa: "", en: "" },
                image: banner.image || "",
                mobileImage: banner.mobileImage || "",
                link: banner.link || {
                    url: "",
                    target: "_self",
                    text: { fa: "", en: "" },
                },
                position: banner.position || "home-page-banners",
                orderIndex: banner.orderIndex || 0,
                isActive: banner.isActive !== false,
                schedule: banner.schedule || {
                    startDate: "",
                    endDate: "",
                    isScheduled: false,
                },
                settings: banner.settings || {
                    altText: { fa: "", en: "" },
                    showOnMobile: true,
                    showOnDesktop: true,
                },
                status: banner.status || "active",
            });
        }
    }, [banner, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            // Clean up empty values
            const cleanedData = { ...data };

            // Clean up empty title/description
            if (cleanedData.title) {
                if (!cleanedData.title.fa && !cleanedData.title.en) {
                    cleanedData.title = undefined;
                }
            }
            if (cleanedData.description) {
                if (!cleanedData.description.fa && !cleanedData.description.en) {
                    cleanedData.description = undefined;
                }
            }

            // Clean up empty mobileImage
            if (!cleanedData.mobileImage || cleanedData.mobileImage === '') {
                cleanedData.mobileImage = undefined;
            }

            // Clean up empty schedule dates
            if (cleanedData.schedule) {
                if (!cleanedData.schedule.isScheduled) {
                    cleanedData.schedule.startDate = undefined;
                    cleanedData.schedule.endDate = undefined;
                } else {
                    // Remove schedule if dates are empty
                    if (!cleanedData.schedule.startDate && !cleanedData.schedule.endDate) {
                        cleanedData.schedule.isScheduled = false;
                        cleanedData.schedule.startDate = undefined;
                        cleanedData.schedule.endDate = undefined;
                    }
                }
            }

            // Clean up empty settings
            if (cleanedData.settings) {
                if (cleanedData.settings.altText) {
                    if (!cleanedData.settings.altText.fa && !cleanedData.settings.altText.en) {
                        cleanedData.settings.altText = undefined;
                    }
                }
                // Remove settings if all empty
                if (!cleanedData.settings.altText && cleanedData.settings.showOnMobile === true && cleanedData.settings.showOnDesktop === true) {
                    cleanedData.settings = undefined;
                }
            }

            // Clean up empty link.text
            if (cleanedData.link?.text) {
                if (!cleanedData.link.text.fa && !cleanedData.link.text.en) {
                    cleanedData.link.text = undefined;
                }
            }

            // Ensure link.url is not empty
            if (!cleanedData.link?.url || cleanedData.link.url.trim() === '') {
                toast.error("لینک بنر الزامی است");
                setLoading(false);
                return;
            }

            if (banner) {
                await updateBanner.mutateAsync({
                    id: banner._id,
                    data: cleanedData,
                });
            } else {
                await createBanner.mutateAsync(cleanedData);
            }

            toast.success(banner ? "بنر با موفقیت ویرایش شد" : "بنر با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            console.error("Error saving banner:", error);
            const errorMessage = error.response?.data?.message || error.message || "خطا در ذخیره بنر";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const watchedImage = watch("image");
    const watchedMobileImage = watch("mobileImage");
    const watchedSchedule = watch("schedule.isScheduled");

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid size={{ xs: 12 }}>
                    <Stack spacing={3}>
                        <Divider>
                            <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <BrandingWatermark /> اطلاعات اصلی
                            </Typography>
                        </Divider>

                        {/* Title */}
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <MultiLangTextField {...field} label="عنوان بنر" placeholder="عنوان بنر (اختیاری)" />
                            )}
                        />

                        {/* Description */}
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <MultiLangTextField {...field} label="توضیحات" multiline rows={3} placeholder="توضیحات بنر (اختیاری)" />
                            )}
                        />

                        {/* Desktop Image */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر دسکتاپ *
                            </Typography>
                            <Controller
                                name="image"
                                control={control}
                                rules={{ required: "تصویر دسکتاپ الزامی است" }}
                                render={({ field }) => (
                                    <MediaPicker
                                        value={field.value || null}
                                        onChange={(selected) => {
                                            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                            field.onChange(imageUrl);
                                        }}
                                        label="انتخاب تصویر دسکتاپ"
                                        accept="image/*"
                                        multiple={false}
                                        showPreview={true}
                                        showEdit={true}
                                        optimizeForWeb={true}
                                    />
                                )}
                            />
                            {errors.image && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                                    {errors.image.message}
                                </Typography>
                            )}
                        </Box>

                        {/* Mobile Image */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر موبایل (اختیاری)
                            </Typography>
                            <Controller
                                name="mobileImage"
                                control={control}
                                render={({ field }) => (
                                    <MediaPicker
                                        value={field.value || null}
                                        onChange={(selected) => {
                                            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                            field.onChange(imageUrl || "");
                                        }}
                                        label="انتخاب تصویر موبایل"
                                        accept="image/*"
                                        multiple={false}
                                        showPreview={true}
                                        showEdit={true}
                                        optimizeForWeb={true}
                                    />
                                )}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                اگر تصویر موبایل انتخاب نشود، تصویر دسکتاپ استفاده می‌شود
                            </Typography>
                        </Box>

                        {/* Link */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LinkIcon /> لینک بنر *
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Controller
                                        name="link.url"
                                        control={control}
                                        rules={{ 
                                            required: "لینک بنر الزامی است",
                                            pattern: {
                                                value: /^(https?:\/\/|\.|\/)/,
                                                message: "لینک معتبر نیست"
                                            }
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="آدرس لینک"
                                                placeholder="https://example.com یا /service/logo-design"
                                                error={!!errors.link?.url}
                                                helperText={errors.link?.url?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="link.target"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                select
                                                fullWidth
                                                SelectProps={{ native: true }}
                                                label="نحوه باز شدن"
                                            >
                                                <option value="_self">همان صفحه</option>
                                                <option value="_blank">صفحه جدید</option>
                                            </TextField>
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Order Index */}
                        <Controller
                            name="orderIndex"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="number"
                                    label="ترتیب نمایش"
                                    helperText="عدد کمتر = نمایش زودتر"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                            )}
                        />

                        {/* Active Status */}
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Switch {...field} checked={field.value} />}
                                    label="بنر فعال است"
                                />
                            )}
                        />
                    </Stack>
                </Grid>

                {/* Advanced Settings */}
                <Grid size={{ xs: 12 }}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Schedule /> تنظیمات پیشرفته
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={3}>
                                {/* Schedule */}
                                <Box>
                                    <Controller
                                        name="schedule.isScheduled"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Switch {...field} checked={field.value} />}
                                                label="فعال‌سازی زمان‌بندی نمایش"
                                            />
                                        )}
                                    />
                                    {watchedSchedule && (
                                        <Grid container spacing={2} sx={{ mt: 2 }}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Controller
                                                    name="schedule.startDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            fullWidth
                                                            type="datetime-local"
                                                            label="تاریخ شروع"
                                                            InputLabelProps={{ shrink: true }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Controller
                                                    name="schedule.endDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            fullWidth
                                                            type="datetime-local"
                                                            label="تاریخ پایان"
                                                            InputLabelProps={{ shrink: true }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                        </Grid>
                                    )}
                                </Box>

                                {/* Display Settings */}
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        تنظیمات نمایش
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Controller
                                            name="settings.showOnMobile"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch {...field} checked={field.value} />}
                                                    label="نمایش در موبایل"
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="settings.showOnDesktop"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch {...field} checked={field.value} />}
                                                    label="نمایش در دسکتاپ"
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="settings.altText"
                                            control={control}
                                            render={({ field }) => (
                                                <MultiLangTextField {...field} label="متن جایگزین تصویر (Alt Text)" />
                                            )}
                                        />
                                    </Stack>
                                </Box>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={onCancel} disabled={loading}>
                    <Cancel sx={{ ml: 1 }} />
                    انصراف
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                    <Save sx={{ ml: 1 }} />
                    {loading ? "در حال ذخیره..." : banner ? "ویرایش بنر" : "ایجاد بنر"}
                </Button>
            </Box>
        </Box>
    );
}

