"use client";
import {
    Box,
    TextField,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Typography,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Stack,
    Card,
    CardContent,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { Save, Cancel, ExpandMore, Add, Delete, DragIndicator, BusinessCenter, MonetizationOn, Schedule, Star, Layers } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaUploader from "../media/MediaUploader";
import GalleryManager from "../media/GalleryManager";
import PriceInput from "./PriceInput";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function ServiceForm({ service, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createService = useCreateData("/api/v1/services");
    const updateService = useUpdateData("/api/v1/services");

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
            shortDescription: { fa: "", en: "" },
            icon: "",
            featuredImage: "",
            gallery: [],
            categories: [],
            processSteps: [],
            features: [],
            pricing: {
                startingPrice: "",
                currency: "IRR",
                isCustom: false,
                packages: [],
            },
            technologies: [],
            deliverables: [],
            duration: {
                min: "",
                max: "",
                description: { fa: "", en: "" },
            },
            orderIndex: 0,
            isPopular: false,
            seo: {
                metaTitle: { fa: "", en: "" },
                metaDescription: { fa: "", en: "" },
                metaKeywords: { fa: [], en: [] },
            },
        },
    });

    // Field Arrays
    const {
        fields: processStepsFields,
        append: appendProcessStep,
        remove: removeProcessStep,
    } = useFieldArray({
        control,
        name: "processSteps",
    });

    const {
        fields: featuresFields,
        append: appendFeature,
        remove: removeFeature,
    } = useFieldArray({
        control,
        name: "features",
    });

    const {
        fields: packagesFields,
        append: appendPackage,
        remove: removePackage,
    } = useFieldArray({
        control,
        name: "pricing.packages",
    });

    const {
        fields: technologiesFields,
        append: appendTechnology,
        remove: removeTechnology,
    } = useFieldArray({
        control,
        name: "technologies",
    });

    const {
        fields: deliverablesFields,
        append: appendDeliverable,
        remove: removeDeliverable,
    } = useFieldArray({
        control,
        name: "deliverables",
    });

    const watchedName = watch("name");

    useEffect(() => {
        if (service) {
            reset({
                name: service.name || { fa: "", en: "" },
                slug: service.slug || { fa: "", en: "" },
                description: service.description || { fa: "", en: "" },
                shortDescription: service.shortDescription || { fa: "", en: "" },
                icon: service.icon || "",
                featuredImage: service.featuredImage || "",
                gallery: service.gallery || [],
                categories: service.categories || [],
                processSteps: service.processSteps || [],
                features: service.features || [],
                pricing: service.pricing || {
                    startingPrice: "",
                    currency: "IRR",
                    isCustom: false,
                    packages: [],
                },
                technologies: service.technologies || [],
                deliverables: service.deliverables || [],
                duration: service.duration || {
                    min: "",
                    max: "",
                    description: { fa: "", en: "" },
                },
                orderIndex: service.orderIndex || 0,
                isPopular: service.isPopular || false,
                seo: service.seo || {
                    metaTitle: { fa: "", en: "" },
                    metaDescription: { fa: "", en: "" },
                    metaKeywords: { fa: [], en: [] },
                },
            });
        }
    }, [service, reset]);

    // Auto-generate slug from name
    useEffect(() => {
        if (watchedName?.fa && !service) {
            const slug = {
                fa: generateSlug(watchedName.fa),
                en: watchedName.en ? generateSlug(watchedName.en) : "",
            };
            setValue("slug", slug);
        }
    }, [watchedName, setValue, service]);

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
            if (service) {
                await updateService.mutateAsync({
                    id: service._id,
                    data,
                });
            } else {
                await createService.mutateAsync(data);
            }

            toast.success(service ? "خدمت با موفقیت ویرایش شد" : "خدمت با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            console.error("Error saving service:", error);
            toast.error("خطا در ذخیره خدمت");
        } finally {
            setLoading(false);
        }
    };

    const handleIconUpload = (images) => {
        if (images.length > 0) {
            setValue("icon", images[0].url);
        }
    };

    const handleFeaturedImageUpload = (images) => {
        if (images.length > 0) {
            setValue("featuredImage", images[0].url);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid item size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <BusinessCenter /> اطلاعات پایه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item size={{ xs: 12 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => value.fa?.trim() || "نام فارسی الزامی است",
                                                enRequired: (value) => value.en?.trim() || "نام انگلیسی الزامی است",
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="نام خدمت" required error={errors.name} />}
                                    />
                                </Grid>

                                <Grid item size={{ xs: 12 }}>
                                    <Controller name="slug" control={control} render={({ field }) => <MultiLangTextField {...field} label="نامک (URL Slug)" />} />
                                </Grid>

                                <Grid item size={{ xs: 12 }}>
                                    <Controller name="shortDescription" control={control} render={({ field }) => <MultiLangTextField {...field} label="توضیحات کوتاه" multiline rows={2} />} />
                                </Grid>

                                <Grid item size={{ xs: 12 }}>
                                    <Controller name="description" control={control} render={({ field }) => <MultiLangEditor {...field} label="توضیحات کامل" height={300} />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Process Steps */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">مراحل انجام کار</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    {processStepsFields.map((field, index) => (
                                        <Card key={field.id} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: "flex", justifyContent: "between", mb: 2 }}>
                                                    <Typography variant="subtitle1">مرحله {index + 1}</Typography>
                                                    <IconButton onClick={() => removeProcessStep(index)} size="small">
                                                        <Delete />
                                                    </IconButton>
                                                </Box>

                                                <Grid container spacing={2}>
                                                    <Grid item size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`processSteps.${index}.title`}
                                                            control={control}
                                                            render={({ field }) => <MultiLangTextField {...field} label="عنوان مرحله" size="small" />}
                                                        />
                                                    </Grid>

                                                    <Grid item size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`processSteps.${index}.icon`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="آیکون" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid item size={{ xs: 12 }}>
                                                        <Controller
                                                            name={`processSteps.${index}.description`}
                                                            control={control}
                                                            render={({ field }) => <MultiLangTextField {...field} label="توضیحات" multiline rows={2} size="small" />}
                                                        />
                                                    </Grid>

                                                    <Grid item size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`processSteps.${index}.order`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="ترتیب" type="number" size="small" fullWidth />}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button
                                        startIcon={<Add />}
                                        onClick={() =>
                                            appendProcessStep({
                                                title: { fa: "", en: "" },
                                                description: { fa: "", en: "" },
                                                icon: "",
                                                order: processStepsFields.length + 1,
                                            })
                                        }
                                        variant="outlined"
                                    >
                                        افزودن مرحله
                                    </Button>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* Features */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">ویژگی‌ها</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    {featuresFields.map((field, index) => (
                                        <Card key={field.id} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                                    <Typography variant="subtitle1">ویژگی {index + 1}</Typography>
                                                    <IconButton onClick={() => removeFeature(index)} size="small">
                                                        <Delete />
                                                    </IconButton>
                                                </Box>

                                                <Grid container spacing={2}>
                                                    <Grid item size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`features.${index}.title`}
                                                            control={control}
                                                            render={({ field }) => <MultiLangTextField {...field} label="عنوان ویژگی" size="small" />}
                                                        />
                                                    </Grid>

                                                    <Grid item size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`features.${index}.icon`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="آیکون" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid item size={{ xs: 12 }}>
                                                        <Controller
                                                            name={`features.${index}.description`}
                                                            control={control}
                                                            render={({ field }) => <MultiLangTextField {...field} label="توضیحات" multiline rows={2} size="small" />}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button
                                        startIcon={<Add />}
                                        onClick={() =>
                                            appendFeature({
                                                title: { fa: "", en: "" },
                                                description: { fa: "", en: "" },
                                                icon: "",
                                            })
                                        }
                                        variant="outlined"
                                    >
                                        افزودن ویژگی
                                    </Button>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid item size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        {/* Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات
                            </Typography>

                            <Stack spacing={2}>
                                <Controller name="isPopular" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="خدمت محبوب" />} />

                                <Controller name="orderIndex" control={control} render={({ field }) => <TextField {...field} label="ترتیب نمایش" type="number" size="small" fullWidth />} />
                            </Stack>
                        </Box>

                        {/* Images */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                آیکون خدمت
                            </Typography>
                            <Controller
                                name="icon"
                                control={control}
                                render={({ field }) => (
                                    <MediaUploader value={field.value ? [{ url: field.value, type: "image/*" }] : []} onChange={handleIconUpload} single acceptedTypes={["image/*"]} maxSizeInMB={1} />
                                )}
                            />
                        </Box>

                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تصویر شاخص
                            </Typography>
                            <Controller
                                name="featuredImage"
                                control={control}
                                render={({ field }) => (
                                    <MediaUploader
                                        value={field.value ? [{ url: field.value, type: "image/*" }] : []}
                                        onChange={handleFeaturedImageUpload}
                                        single
                                        acceptedTypes={["image/*"]}
                                        maxSizeInMB={2}
                                    />
                                )}
                            />
                        </Box>

                        {/* Gallery */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                گالری تصاویر
                            </Typography>
                            <Controller name="gallery" control={control} render={({ field }) => <GalleryManager {...field} showAltText showCaptions />} />
                        </Box>

                        {/* Categories */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                دسته‌بندی
                            </Typography>
                            <Controller name="categories" control={control} render={({ field }) => <CategorySelector {...field} type="service" label="انتخاب دسته‌بندی" />} />
                        </Box>

                        {/* Duration */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Schedule /> مدت زمان انجام
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item size={{ xs: 6 }}>
                                    <Controller name="duration.min" control={control} render={({ field }) => <TextField {...field} label="حداقل (روز)" type="number" size="small" fullWidth />} />
                                </Grid>

                                <Grid item size={{ xs: 6 }}>
                                    <Controller name="duration.max" control={control} render={({ field }) => <TextField {...field} label="حداکثر (روز)" type="number" size="small" fullWidth />} />
                                </Grid>

                                <Grid item size={{ xs: 12 }}>
                                    <Controller name="duration.description" control={control} render={({ field }) => <MultiLangTextField {...field} label="توضیحات مدت زمان" size="small" />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Pricing */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <MonetizationOn /> قیمت‌گذاری
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="pricing.isCustom"
                                    control={control}
                                    render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="قیمت سفارشی" />}
                                />

                                {!watch("pricing.isCustom") && (
                                    <>
                                        <Controller
                                            name="pricing.startingPrice"
                                            control={control}
                                            render={({ field }) => <TextField {...field} label="قیمت شروع" type="number" size="small" fullWidth />}
                                        />

                                        <Controller
                                            name="pricing.currency"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>واحد پول</InputLabel>
                                                    <Select {...field} label="واحد پول">
                                                        <MenuItem value="IRR">ریال</MenuItem>
                                                        <MenuItem value="USD">دلار</MenuItem>
                                                        <MenuItem value="EUR">یورو</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </>
                                )}
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
                    {loading ? "در حال ذخیره..." : service ? "ویرایش خدمت" : "ایجاد خدمت"}
                </Button>
            </Box>
        </Box>
    );
}
