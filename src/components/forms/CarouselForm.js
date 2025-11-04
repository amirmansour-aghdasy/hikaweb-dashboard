"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, FormControl, InputLabel, Select, MenuItem, Stack, Divider, Accordion, AccordionSummary, AccordionDetails, Slider } from "@mui/material";
import { Save, Cancel, ViewCarousel, Image, Link as LinkIcon, ExpandMore, Palette, Schedule } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MediaUploader from "../media/MediaUploader";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

const POSITION_OPTIONS = [
    { value: "home", label: "صفحه اصلی" },
    { value: "services", label: "صفحه خدمات" },
    { value: "portfolio", label: "صفحه نمونه کارها" },
    { value: "about", label: "درباره ما" },
];

const TEXT_POSITION_OPTIONS = [
    { value: "left", label: "چپ" },
    { value: "center", label: "وسط" },
    { value: "right", label: "راست" },
];

const BUTTON_STYLE_OPTIONS = [
    { value: "primary", label: "اصلی" },
    { value: "secondary", label: "ثانویه" },
    { value: "outline", label: "خطی" },
    { value: "ghost", label: "شفاف" },
];

export default function CarouselForm({ carousel, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createCarousel = useCreateData("/carousel");
    const updateCarousel = useUpdateData("/carousel");

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
            subtitle: { fa: "", en: "" },
            description: { fa: "", en: "" },
            image: "",
            mobileImage: "",
            link: {
                url: "",
                text: { fa: "", en: "" },
                target: "_self",
            },
            button: {
                text: { fa: "", en: "" },
                url: "",
                style: "primary",
                target: "_self",
            },
            position: "home",
            orderIndex: 0,
            isVisible: true,
            displaySettings: {
                showOverlay: true,
                overlayOpacity: 0.5,
                textPosition: "left",
                textColor: "#ffffff",
            },
            schedule: {
                startDate: "",
                endDate: "",
                isScheduled: false,
            },
            status: "active",
        },
    });

    useEffect(() => {
        if (carousel) {
            reset({
                title: carousel.title || { fa: "", en: "" },
                subtitle: carousel.subtitle || { fa: "", en: "" },
                description: carousel.description || { fa: "", en: "" },
                image: carousel.image || "",
                mobileImage: carousel.mobileImage || "",
                link: carousel.link || {
                    url: "",
                    text: { fa: "", en: "" },
                    target: "_self",
                },
                button: carousel.button || {
                    text: { fa: "", en: "" },
                    url: "",
                    style: "primary",
                    target: "_self",
                },
                position: carousel.position || "home",
                orderIndex: carousel.orderIndex || 0,
                isVisible: carousel.isVisible !== false,
                displaySettings: carousel.displaySettings || {
                    showOverlay: true,
                    overlayOpacity: 0.5,
                    textPosition: "left",
                    textColor: "#ffffff",
                },
                schedule: carousel.schedule || {
                    startDate: "",
                    endDate: "",
                    isScheduled: false,
                },
                status: carousel.status || "active",
            });
        }
    }, [carousel, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            if (carousel) {
                await updateCarousel.mutateAsync({
                    id: carousel._id,
                    data,
                });
            } else {
                await createCarousel.mutateAsync(data);
            }

            toast.success(carousel ? "اسلاید با موفقیت ویرایش شد" : "اسلاید با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            console.error("Error saving carousel:", error);
            toast.error("خطا در ذخیره اسلاید");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (images) => {
        if (images.length > 0) {
            setValue("image", images[0].url);
        }
    };

    const handleMobileImageUpload = (images) => {
        if (images.length > 0) {
            setValue("mobileImage", images[0].url);
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
                                <ViewCarousel /> اطلاعات اسلاید
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="title"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => value.fa?.trim() || "عنوان فارسی الزامی است",
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="عنوان" required error={errors.title} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller name="subtitle" control={control} render={({ field }) => <MultiLangTextField {...field} label="زیرعنوان" />} />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller name="description" control={control} render={({ field }) => <MultiLangTextField {...field} label="توضیحات" multiline rows={3} />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Link Section */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <LinkIcon /> لینک و دکمه
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="link.url"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="لینک URL" placeholder="https://example.com" fullWidth />}
                                    />

                                    <Controller name="link.text" control={control} render={({ field }) => <MultiLangTextField {...field} label="متن لینک" />} />

                                    <Controller
                                        name="link.target"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>نحوه باز شدن لینک</InputLabel>
                                                <Select {...field} label="نحوه باز شدن لینک">
                                                    <MenuItem value="_self">همان تب</MenuItem>
                                                    <MenuItem value="_blank">تب جدید</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Divider />

                                    <Controller name="button.text" control={control} render={({ field }) => <MultiLangTextField {...field} label="متن دکمه" />} />

                                    <Controller name="button.url" control={control} render={({ field }) => <TextField {...field} label="لینک دکمه" placeholder="https://example.com" fullWidth />} />

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 6 }}>
                                            <Controller
                                                name="button.style"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl fullWidth>
                                                        <InputLabel>استایل دکمه</InputLabel>
                                                        <Select {...field} label="استایل دکمه">
                                                            {BUTTON_STYLE_OPTIONS.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 6 }}>
                                            <Controller
                                                name="button.target"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl fullWidth>
                                                        <InputLabel>نحوه باز شدن</InputLabel>
                                                        <Select {...field} label="نحوه باز شدن">
                                                            <MenuItem value="_self">همان تب</MenuItem>
                                                            <MenuItem value="_blank">تب جدید</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        {/* Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="position"
                                    control={control}
                                    rules={{ required: "موقعیت الزامی است" }}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.position}>
                                            <InputLabel>موقعیت</InputLabel>
                                            <Select {...field} label="موقعیت">
                                                {POSITION_OPTIONS.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />

                                <Controller name="orderIndex" control={control} render={({ field }) => <TextField {...field} label="ترتیب نمایش" type="number" size="small" fullWidth />} />

                                <Controller name="isVisible" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="قابل مشاهده" />} />

                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>وضعیت</InputLabel>
                                            <Select {...field} label="وضعیت">
                                                <MenuItem value="active">فعال</MenuItem>
                                                <MenuItem value="inactive">غیرفعال</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Images */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر اصلی
                            </Typography>
                            <Controller
                                name="image"
                                control={control}
                                rules={{ required: "تصویر اصلی الزامی است" }}
                                render={({ field }) => (
                                    <MediaUploader value={field.value ? [{ url: field.value, type: "image/*" }] : []} onChange={handleImageUpload} single acceptedTypes={["image/*"]} maxSizeInMB={5} />
                                )}
                            />
                        </Box>

                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تصویر موبایل (اختیاری)
                            </Typography>
                            <Controller
                                name="mobileImage"
                                control={control}
                                render={({ field }) => (
                                    <MediaUploader value={field.value ? [{ url: field.value, type: "image/*" }] : []} onChange={handleMobileImageUpload} single acceptedTypes={["image/*"]} maxSizeInMB={3} />
                                )}
                            />
                        </Box>

                        {/* Display Settings */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Palette /> تنظیمات نمایش
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="displaySettings.showOverlay"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="نمایش لایه تیره" />}
                                    />

                                    <Controller
                                        name="displaySettings.overlayOpacity"
                                        control={control}
                                        render={({ field }) => (
                                            <Box>
                                                <Typography gutterBottom>شفافیت لایه: {Math.round(field.value * 100)}%</Typography>
                                                <Slider {...field} min={0} max={1} step={0.1} valueLabelDisplay="auto" valueLabelFormat={(value) => `${Math.round(value * 100)}%`} />
                                            </Box>
                                        )}
                                    />

                                    <Controller
                                        name="displaySettings.textPosition"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>موقعیت متن</InputLabel>
                                                <Select {...field} label="موقعیت متن">
                                                    {TEXT_POSITION_OPTIONS.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        name="displaySettings.textColor"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="رنگ متن" type="color" fullWidth />}
                                    />
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
                    {loading ? "در حال ذخیره..." : carousel ? "ویرایش اسلاید" : "ایجاد اسلاید"}
                </Button>
            </Box>
        </Box>
    );
}

