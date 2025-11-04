"use client";
import {
    Box,
    TextField,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Stack,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
} from "@mui/material";
import { Save, Cancel, ExpandMore, Add, Delete, Work, Business, Schedule, Star, TrendingUp, Image, Build } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import MediaUploader from "../media/MediaUploader";
import GalleryManager from "../media/GalleryManager";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

const PROJECT_BUDGETS = [
    { value: "under-1m", label: "زیر 1 میلیون" },
    { value: "1m-5m", label: "1 تا 5 میلیون" },
    { value: "5m-10m", label: "5 تا 10 میلیون" },
    { value: "10m-50m", label: "10 تا 50 میلیون" },
    { value: "over-50m", label: "بالای 50 میلیون" },
];

const COMPANY_SIZES = [
    { value: "startup", label: "استارتاپ" },
    { value: "small", label: "کوچک" },
    { value: "medium", label: "متوسط" },
    { value: "large", label: "بزرگ" },
    { value: "enterprise", label: "سازمانی" },
];

export default function PortfolioForm({ project, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData, useFetchData } = useApi();

    const createProject = useCreateData("/portfolio");
    const updateProject = useUpdateData("/portfolio");

    // Fetch services for selection
    const { data: servicesData } = useFetchData("services-list", "/services?status=active");

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
            description: { fa: "", en: "" },
            shortDescription: { fa: "", en: "" },
            client: {
                name: "",
                logo: "",
                website: "",
                industry: { fa: "", en: "" },
                size: "medium",
            },
            project: {
                duration: "",
                budget: "",
                completedAt: "",
                projectType: { fa: "", en: "" },
            },
            services: [],
            categories: [],
            toolsUsed: [],
            featuredImage: "",
            gallery: [],
            results: [],
            testimonial: {
                content: { fa: "", en: "" },
                clientName: "",
                clientPosition: "",
                clientAvatar: "",
                rating: 5,
            },
            challenges: [],
            orderIndex: 0,
            isFeatured: false,
            seo: {
                metaTitle: { fa: "", en: "" },
                metaDescription: { fa: "", en: "" },
                metaKeywords: { fa: [], en: [] },
            },
        },
    });

    // Field Arrays
    const {
        fields: toolsFields,
        append: appendTool,
        remove: removeTool,
    } = useFieldArray({
        control,
        name: "toolsUsed",
    });

    const {
        fields: resultsFields,
        append: appendResult,
        remove: removeResult,
    } = useFieldArray({
        control,
        name: "results",
    });

    const {
        fields: challengesFields,
        append: appendChallenge,
        remove: removeChallenge,
    } = useFieldArray({
        control,
        name: "challenges",
    });

    const watchedTitle = watch("title");

    useEffect(() => {
        if (project) {
            // Handle services and categories - they might be populated objects or just ObjectIds
            const servicesValue = Array.isArray(project.services)
                ? project.services.map(service => 
                    typeof service === 'object' && service._id ? service._id : service
                  )
                : [];
            
            const categoriesValue = Array.isArray(project.categories)
                ? project.categories.map(cat => 
                    typeof cat === 'object' && cat._id ? cat._id : cat
                  )
                : [];
            
            reset({
                title: project.title || { fa: "", en: "" },
                slug: project.slug || { fa: "", en: "" },
                description: project.description || { fa: "", en: "" },
                shortDescription: project.shortDescription || { fa: "", en: "" },
                client: project.client || {
                    name: "",
                    logo: "",
                    website: "",
                    industry: { fa: "", en: "" },
                    size: "medium",
                },
                project: project.project || {
                    duration: "",
                    budget: "",
                    completedAt: "",
                    projectType: { fa: "", en: "" },
                },
                services: servicesValue,
                categories: categoriesValue,
                toolsUsed: project.toolsUsed || [],
                featuredImage: project.featuredImage || "",
                gallery: project.gallery || [],
                results: project.results || [],
                testimonial: project.testimonial || {
                    content: { fa: "", en: "" },
                    clientName: "",
                    clientPosition: "",
                    clientAvatar: "",
                    rating: 5,
                },
                challenges: project.challenges || [],
                orderIndex: project.orderIndex || 0,
                isFeatured: project.isFeatured || false,
                seo: project.seo || {
                    metaTitle: { fa: "", en: "" },
                    metaDescription: { fa: "", en: "" },
                    metaKeywords: { fa: [], en: [] },
                },
            });
        } else {
            // Reset to default when no project
            reset({
                title: { fa: "", en: "" },
                slug: { fa: "", en: "" },
                description: { fa: "", en: "" },
                shortDescription: { fa: "", en: "" },
                client: {
                    name: "",
                    logo: "",
                    website: "",
                    industry: { fa: "", en: "" },
                    size: "medium",
                },
                project: {
                    duration: "",
                    budget: "",
                    completedAt: "",
                    projectType: { fa: "", en: "" },
                },
                services: [],
                categories: [],
                toolsUsed: [],
                featuredImage: "",
                gallery: [],
                results: [],
                testimonial: {
                    content: { fa: "", en: "" },
                    clientName: "",
                    clientPosition: "",
                    clientAvatar: "",
                    rating: 5,
                },
                challenges: [],
                orderIndex: 0,
                isFeatured: false,
                seo: {
                    metaTitle: { fa: "", en: "" },
                    metaDescription: { fa: "", en: "" },
                    metaKeywords: { fa: [], en: [] },
                },
            });
        }
    }, [project, reset]);

    // Auto-generate slug from title
    useEffect(() => {
        if (watchedTitle?.fa && !project) {
            const slug = {
                fa: generateSlug(watchedTitle.fa),
                en: watchedTitle.en ? generateSlug(watchedTitle.en) : "",
            };
            setValue("slug", slug);
        }
    }, [watchedTitle, setValue, project]);

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
            if (project) {
                await updateProject.mutateAsync({
                    id: project._id,
                    data,
                });
            } else {
                await createProject.mutateAsync(data);
            }

            toast.success(project ? "پروژه با موفقیت ویرایش شد" : "پروژه با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error("خطا در ذخیره پروژه");
        } finally {
            setLoading(false);
        }
    };

    const handleFeaturedImageUpload = (images) => {
        if (images.length > 0) {
            setValue("featuredImage", images[0].url);
        }
    };

    const handleClientLogoUpload = (images) => {
        if (images.length > 0) {
            setValue("client.logo", images[0].url);
        }
    };

    const handleTestimonialAvatarUpload = (images) => {
        if (images.length > 0) {
            setValue("testimonial.clientAvatar", images[0].url);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Work /> اطلاعات پروژه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="title"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => value.fa?.trim() || "عنوان فارسی الزامی است",
                                                enRequired: (value) => value.en?.trim() || "عنوان انگلیسی الزامی است",
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="عنوان پروژه" required error={errors.title} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller name="slug" control={control} render={({ field }) => <MultiLangTextField {...field} label="نامک (URL Slug)" />} />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller name="shortDescription" control={control} render={({ field }) => <MultiLangTextField {...field} label="توضیحات کوتاه" multiline rows={2} />} />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller name="description" control={control} render={({ field }) => <MultiLangEditor {...field} label="توضیحات کامل پروژه" height={300} />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Client Information */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Business /> اطلاعات مشتری
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="client.name"
                                            control={control}
                                            rules={{ required: "نام مشتری الزامی است" }}
                                            render={({ field }) => (
                                                <TextField {...field} label="نام مشتری" required error={!!errors.client?.name} helperText={errors.client?.name?.message} fullWidth />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="client.website"
                                            control={control}
                                            render={({ field }) => <TextField {...field} label="وب‌سایت مشتری" placeholder="https://example.com" fullWidth />}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller name="client.industry" control={control} render={({ field }) => <MultiLangTextField {...field} label="صنعت" size="small" />} />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="client.size"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth>
                                                    <InputLabel>اندازه شرکت</InputLabel>
                                                    <Select {...field} label="اندازه شرکت">
                                                        {COMPANY_SIZES.map((size) => (
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
                                        <Typography variant="subtitle2" gutterBottom>
                                            لوگوی مشتری
                                        </Typography>
                                        <Controller
                                            name="client.logo"
                                            control={control}
                                            render={({ field }) => (
                                                <MediaUploader
                                                    value={field.value ? [{ url: field.value, type: "image/*" }] : []}
                                                    onChange={handleClientLogoUpload}
                                                    single
                                                    acceptedTypes={["image/*"]}
                                                    maxSizeInMB={1}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Project Details */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Schedule /> جزئیات پروژه
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller name="project.duration" control={control} render={({ field }) => <TextField {...field} label="مدت زمان (روز)" type="number" fullWidth />} />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="project.budget"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth>
                                                    <InputLabel>بودجه پروژه</InputLabel>
                                                    <Select {...field} label="بودجه پروژه">
                                                        {PROJECT_BUDGETS.map((budget) => (
                                                            <MenuItem key={budget.value} value={budget.value}>
                                                                {budget.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="project.completedAt"
                                            control={control}
                                            render={({ field }) => <TextField {...field} label="تاریخ تکمیل" type="date" InputLabelProps={{ shrink: true }} fullWidth />}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller name="project.projectType" control={control} render={({ field }) => <MultiLangTextField {...field} label="نوع پروژه" size="small" />} />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Tools Used */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Build /> ابزارها و تکنولوژی‌ها
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    {toolsFields.map((field, index) => (
                                        <Card key={field.id} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                                    <Typography variant="subtitle1">ابزار {index + 1}</Typography>
                                                    <IconButton onClick={() => removeTool(index)} size="small">
                                                        <Delete />
                                                    </IconButton>
                                                </Box>

                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <Controller
                                                            name={`toolsUsed.${index}.name`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="نام ابزار" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <Controller
                                                            name={`toolsUsed.${index}.icon`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="آیکون" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                        <Controller
                                                            name={`toolsUsed.${index}.category`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="دسته‌بندی" size="small" fullWidth />}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button
                                        startIcon={<Add />}
                                        onClick={() =>
                                            appendTool({
                                                name: "",
                                                icon: "",
                                                category: "",
                                            })
                                        }
                                        variant="outlined"
                                    >
                                        افزودن ابزار
                                    </Button>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* Results */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <TrendingUp /> نتایج و دستاوردها
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    {resultsFields.map((field, index) => (
                                        <Card key={field.id} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                                    <Typography variant="subtitle1">نتیجه {index + 1}</Typography>
                                                    <IconButton onClick={() => removeResult(index)} size="small">
                                                        <Delete />
                                                    </IconButton>
                                                </Box>

                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <Controller
                                                            name={`results.${index}.metric`}
                                                            control={control}
                                                            render={({ field }) => <MultiLangTextField {...field} label="شاخص" size="small" />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <Controller
                                                            name={`results.${index}.value`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="مقدار" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <Controller
                                                            name={`results.${index}.improvement`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="بهبود" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <Controller
                                                            name={`results.${index}.icon`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="آیکون" size="small" fullWidth />}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button
                                        startIcon={<Add />}
                                        onClick={() =>
                                            appendResult({
                                                metric: { fa: "", en: "" },
                                                value: "",
                                                improvement: "",
                                                icon: "",
                                            })
                                        }
                                        variant="outlined"
                                    >
                                        افزودن نتیجه
                                    </Button>
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
                                <Controller name="isFeatured" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="پروژه ویژه" />} />

                                <Controller name="orderIndex" control={control} render={({ field }) => <TextField {...field} label="ترتیب نمایش" type="number" size="small" fullWidth />} />
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
                                گالری پروژه
                            </Typography>
                            <Controller name="gallery" control={control} render={({ field }) => <GalleryManager {...field} showAltText showCaptions />} />
                        </Box>

                        {/* Services */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                خدمات ارائه شده
                            </Typography>
                            <Controller
                                name="services"
                                control={control}
                                render={({ field }) => (
                                    <CategorySelector
                                        {...field}
                                        label="انتخاب خدمات"
                                        multiple
                                        options={servicesData?.data || []}
                                        getOptionLabel={(option) => option.name?.fa || option.name}
                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                    />
                                )}
                            />
                        </Box>

                        {/* Categories */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                دسته‌بندی
                            </Typography>
                            <Controller name="categories" control={control} render={({ field }) => <CategorySelector {...field} type="portfolio" label="انتخاب دسته‌بندی" />} />
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
                    {loading ? "در حال ذخیره..." : project ? "ویرایش پروژه" : "ایجاد پروژه"}
                </Button>
            </Box>
        </Box>
    );
}
