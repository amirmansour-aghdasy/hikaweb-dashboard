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
import { Controller, useFieldArray } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import GalleryManager from "../media/GalleryManager";
import PriceInput from "./PriceInput";
import { useApi } from "../../hooks/useApi";
import { useFormSetup } from "../../hooks/useFormSetup";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { serviceValidation, serviceUpdateValidation } from "../../lib/validations";
import { normalizeCategories, normalizeSEO, normalizeItems } from "../../lib/utils/formTransformers";
import { normalizeMultiLang, normalizeCategoriesForForm, normalizeSEOForForm, normalizeItemsForForm } from "../../lib/utils/formNormalizers";

export default function ServiceForm({ service, onSave, onCancel }) {
    const { useFetchData } = useApi();

    // Fetch portfolio items for slides
    const { data: portfolioData } = useFetchData("portfolio-list", "/portfolio?status=active&limit=100");

    const defaultValues = {
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
            subServices: [],
            pricing: {
                startingPrice: "",
                currency: "IRR",
                isCustom: false,
                packages: [],
            },
            mainContent: {
                firstSection: {
                    content: {
                        title: { fa: "", en: "" },
                        description: { fa: "", en: "" },
                        actionBtnText: { fa: "", en: "" },
                    },
                    slides: [],
                },
                secondSection: {
                    content: {
                        title: { fa: "", en: "" },
                        description: { fa: "", en: "" },
                        actionBtnText: { fa: "", en: "" },
                    },
                    slides: [],
                },
            },
            finalDesc: {
                content: {
                    title: { fa: "", en: "" },
                    text: { fa: "", en: "" },
                },
                image: "",
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
        };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors, isDirty },
    } = useFormSetup({
        validationSchema: service ? serviceUpdateValidation : serviceValidation,
        defaultValues,
        existingItem: service,
        normalizeItem: (item) => ({
            name: normalizeMultiLang(item.name),
            slug: normalizeMultiLang(item.slug),
            description: normalizeMultiLang(item.description),
            shortDescription: normalizeMultiLang(item.shortDescription),
            icon: item.icon || "",
            featuredImage: item.featuredImage || "",
            gallery: item.gallery || [],
            categories: normalizeCategoriesForForm(item.categories),
            processSteps: item.processSteps || [],
            features: item.features || [],
            subServices: item.subServices || [],
            pricing: item.pricing || defaultValues.pricing,
            mainContent: item.mainContent || defaultValues.mainContent,
            finalDesc: item.finalDesc || defaultValues.finalDesc,
            technologies: item.technologies || [],
            deliverables: item.deliverables || [],
            duration: item.duration || defaultValues.duration,
            orderIndex: item.orderIndex || 0,
            isPopular: item.isPopular || false,
            seo: normalizeSEOForForm(item.seo),
        }),
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

    const {
        fields: subServicesFields,
        append: appendSubService,
        remove: removeSubService,
    } = useFieldArray({
        control,
        name: "subServices",
    });

    // Slug is now auto-generated in backend - no need for frontend generation

    // Transform data before submission
    const transformServiceData = (data) => {
        const serviceData = { ...data };
        
        // Convert categories to array of strings (ObjectIds)
        serviceData.categories = normalizeCategories(data.categories);

        // Convert mainContent slides to ObjectIds
        if (serviceData.mainContent) {
            if (serviceData.mainContent.firstSection?.slides && Array.isArray(serviceData.mainContent.firstSection.slides)) {
                serviceData.mainContent.firstSection.slides = normalizeItems(serviceData.mainContent.firstSection.slides);
            }
            if (serviceData.mainContent.secondSection?.slides && Array.isArray(serviceData.mainContent.secondSection.slides)) {
                serviceData.mainContent.secondSection.slides = normalizeItems(serviceData.mainContent.secondSection.slides);
            }
        }

        // Ensure pricing.packages.features is array of strings
        if (serviceData.pricing?.packages && Array.isArray(serviceData.pricing.packages)) {
            serviceData.pricing.packages = serviceData.pricing.packages.map(pkg => {
                if (pkg.features && Array.isArray(pkg.features)) {
                    pkg.features = pkg.features.map(f => typeof f === 'string' ? f : String(f)).filter(Boolean);
                }
                return pkg;
            });
        }
        
        // Limit shortDescription to 300 characters
        if (serviceData.shortDescription) {
            if (serviceData.shortDescription.fa && serviceData.shortDescription.fa.length > 300) {
                serviceData.shortDescription.fa = serviceData.shortDescription.fa.substring(0, 300);
            }
            if (serviceData.shortDescription.en && serviceData.shortDescription.en.length > 300) {
                serviceData.shortDescription.en = serviceData.shortDescription.en.substring(0, 300);
            }
        }
        
        // Slug is now auto-generated in backend - no need to process it here
        
        // Normalize SEO
        const seo = normalizeSEO({
            metaTitle: data.seo?.metaTitle,
            metaDescription: data.seo?.metaDescription,
            metaKeywords: data.seo?.metaKeywords,
        });
        
        if (Object.keys(seo).length > 0) {
            serviceData.seo = seo;
        }

        return serviceData;
    };

    const { submit, loading } = useFormSubmission({
        endpoint: "/services",
        queryKey: "services",
        existingItem: service,
        createMessage: "خدمت با موفقیت ایجاد شد",
        updateMessage: "خدمت با موفقیت ویرایش شد",
        onSuccess: onSave,
        transformData: transformServiceData,
        setValue,
        getValues,
    });

    const onSubmit = async (data) => {
        await submit(data);
    };

    const onError = (errors) => {
        // Don't log to console - errors are already shown in UI via error props
        
        // Field name mapping to Persian
        const fieldLabels = {
            'name': 'نام خدمت',
            'slug': 'نامک',
            'description': 'توضیحات کامل',
            'shortDescription': 'توضیح کوتاه',
            'categories': 'دسته‌بندی',
        };
        
        // Show first error with better message handling
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
            let errorMessage = "لطفاً تمام فیلدهای الزامی را پر کنید";
            
            // Handle nested validation errors
            const errorObj = errors[firstErrorKey];
            
            if (errorObj) {
                // Check if it's a validation error object from react-hook-form
                if (errorObj.message && typeof errorObj.message === 'string') {
                    // If message is a string, use it directly
                    errorMessage = errorObj.message;
                } else if (errorObj.type) {
                    // Handle validation type errors (faRequired, enRequired, etc.)
                    const fieldLabel = fieldLabels[firstErrorKey] || firstErrorKey;
                    const typeMessages = {
                        faRequired: `${fieldLabel} (فارسی) الزامی است`,
                        enRequired: `${fieldLabel} (انگلیسی) الزامی است`,
                        required: `${fieldLabel} الزامی است`,
                    };
                    errorMessage = typeMessages[errorObj.type] || errorObj.message || `${fieldLabel} الزامی است`;
                } else if (typeof errorObj === 'string') {
                    // If errorObj itself is a string, use it
                    errorMessage = errorObj;
                } else if (errorObj.fa || errorObj.en) {
                    // If errorObj is the field value itself (wrong validation return), show generic message
                    const fieldLabel = fieldLabels[firstErrorKey] || firstErrorKey;
                    errorMessage = `لطفاً ${fieldLabel} را به درستی وارد کنید`;
                }
            }
            
            toast.error(errorMessage);
        } else {
            toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
        }
    };

    const handleIconSelect = (selected) => {
        // MediaPicker returns object with url or string URL
        const imageUrl = typeof selected === 'object' && selected !== null 
            ? (selected.url || selected._id || selected) 
            : selected;
        setValue("icon", imageUrl || "", { shouldDirty: true });
    };

    const handleFeaturedImageSelect = (selected) => {
        // MediaPicker returns object with url or string URL
        const imageUrl = typeof selected === 'object' && selected !== null 
            ? (selected.url || selected._id || selected) 
            : selected;
        setValue("featuredImage", imageUrl || "", { shouldDirty: true });
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit, onError)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <BusinessCenter /> اطلاعات پایه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => {
                                                    if (!value || typeof value !== 'object') return "نام فارسی الزامی است";
                                                    const trimmed = value.fa?.trim();
                                                    return trimmed ? true : "نام فارسی الزامی است";
                                                },
                                                enRequired: (value) => {
                                                    if (!value || typeof value !== 'object') return "نام انگلیسی الزامی است";
                                                    const trimmed = value.en?.trim();
                                                    return trimmed ? true : "نام انگلیسی الزامی است";
                                                },
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="نام خدمت" required error={errors.name} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller 
                                        name="slug" 
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => {
                                                    if (!value || typeof value !== 'object') return "نامک فارسی الزامی است";
                                                    const trimmed = value.fa?.trim();
                                                    return trimmed ? true : "نامک فارسی الزامی است";
                                                },
                                                enRequired: (value) => {
                                                    if (!value || typeof value !== 'object') return "نامک انگلیسی الزامی است";
                                                    const trimmed = value.en?.trim();
                                                    return trimmed ? true : "نامک انگلیسی الزامی است";
                                                },
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="نامک (URL Slug)" required error={errors.slug} />} 
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller 
                                        name="shortDescription" 
                                        control={control} 
                                        render={({ field }) => <MultiLangTextField {...field} label="توضیحات کوتاه" multiline rows={2} />} 
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller 
                                        name="description" 
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => {
                                                    if (!value || typeof value !== 'object') return "توضیحات فارسی الزامی است";
                                                    // Remove HTML tags for validation
                                                    const textContent = value.fa?.replace(/<[^>]*>/g, '').trim();
                                                    if (!textContent || textContent.length < 50) {
                                                        return "توضیحات فارسی باید حداقل ۵۰ کاراکتر باشد";
                                                    }
                                                    return true;
                                                },
                                                enRequired: (value) => {
                                                    if (!value || typeof value !== 'object') return "توضیحات انگلیسی الزامی است";
                                                    // Remove HTML tags for validation
                                                    const textContent = value.en?.replace(/<[^>]*>/g, '').trim();
                                                    if (!textContent || textContent.length < 50) {
                                                        return "توضیحات انگلیسی باید حداقل ۵۰ کاراکتر باشد";
                                                    }
                                                    return true;
                                                },
                                            },
                                        }}
                                        render={({ field }) => <MultiLangEditor {...field} label="توضیحات کامل" height={300} required error={errors.description} />} 
                                    />
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
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`processSteps.${index}.title`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="عنوان مرحله" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`processSteps.${index}.icon`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="آیکون" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12 }}>
                                                        <Controller
                                                            name={`processSteps.${index}.description`}
                                                            control={control}
                                                            render={({ field }) => <MultiLangTextField {...field} label="توضیحات" multiline rows={2} size="small" />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 6 }}>
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
                                                title: "",
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
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`features.${index}.title`}
                                                            control={control}
                                                            render={({ field }) => <MultiLangTextField {...field} label="عنوان ویژگی" size="small" />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Controller
                                                            name={`features.${index}.icon`}
                                                            control={control}
                                                            render={({ field }) => <TextField {...field} label="آیکون" size="small" fullWidth />}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12 }}>
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
                <Grid size={{ xs: 12, lg: 4 }}>
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
                                    <MediaPicker
                                        value={field.value || null}
                                        onChange={handleIconSelect}
                                        label="انتخاب آیکون"
                                        accept="image/*"
                                        multiple={false}
                                        showPreview={true}
                                        showEdit={true}
                                    />
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
                                    <MediaPicker
                                        value={field.value || null}
                                        onChange={handleFeaturedImageSelect}
                                        label="انتخاب تصویر شاخص"
                                        accept="image/*"
                                        multiple={false}
                                        showPreview={true}
                                        showEdit={true}
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
                            <Controller 
                                name="categories" 
                                control={control}
                                rules={{
                                    validate: (value) => {
                                        if (!value || !Array.isArray(value) || value.length === 0) {
                                            return "حداقل یک دسته‌بندی الزامی است";
                                        }
                                        return true;
                                    },
                                }}
                                render={({ field }) => <CategorySelector {...field} type="service" label="انتخاب دسته‌بندی" error={errors.categories} />} 
                            />
                        </Box>

                        {/* Duration */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Schedule /> مدت زمان انجام
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Controller name="duration.min" control={control} render={({ field }) => <TextField {...field} label="حداقل (روز)" type="number" size="small" fullWidth />} />
                                </Grid>

                                <Grid size={{ xs: 6 }}>
                                    <Controller name="duration.max" control={control} render={({ field }) => <TextField {...field} label="حداکثر (روز)" type="number" size="small" fullWidth />} />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
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

            {/* Pricing Packages */}
            <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">پکیج‌های قیمتی</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={2}>
                        {packagesFields.map((field, index) => (
                            <Card key={field.id} variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                        <Typography variant="subtitle1">پکیج {index + 1}</Typography>
                                        <IconButton onClick={() => removePackage(index)} size="small">
                                            <Delete />
                                        </IconButton>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name={`pricing.packages.${index}.name`}
                                                control={control}
                                                render={({ field }) => <MultiLangTextField {...field} label="نام پکیج" size="small" required />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name={`pricing.packages.${index}.value`}
                                                control={control}
                                                render={({ field }) => <TextField {...field} label="قیمت (مثال: 15.000.000 تومان)" size="small" fullWidth />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name={`pricing.packages.${index}.subTitle`}
                                                control={control}
                                                render={({ field }) => <MultiLangTextField {...field} label="زیرعنوان (مثال: مناسب فروشگاه‌های حرفه‌ای)" size="small" />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name={`pricing.packages.${index}.duration`}
                                                control={control}
                                                render={({ field }) => <TextField {...field} label="مدت زمان" size="small" fullWidth />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name={`pricing.packages.${index}.desc`}
                                                control={control}
                                                render={({ field }) => <MultiLangTextField {...field} label="توضیحات کوتاه" multiline rows={2} size="small" />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name={`pricing.packages.${index}.actionBtnText`}
                                                control={control}
                                                render={({ field }) => <MultiLangTextField {...field} label="متن دکمه CTA" size="small" />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="subtitle2" gutterBottom>امکانات پکیج</Typography>
                                            <Controller
                                                name={`pricing.packages.${index}.features`}
                                                control={control}
                                                render={({ field }) => (
                                                    <TagInput
                                                        {...field}
                                                        label="امکانات (هر مورد را جداگانه وارد کنید)"
                                                        placeholder="مثال: طراحی ریسپانسیو"
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name={`pricing.packages.${index}.isPopular`}
                                                control={control}
                                                render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="پکیج محبوب" />}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}

                        <Button
                            startIcon={<Add />}
                            onClick={() =>
                                appendPackage({
                                    name: { fa: "", en: "" },
                                    value: "",
                                    subTitle: { fa: "", en: "" },
                                    features: [],
                                    desc: { fa: "", en: "" },
                                    actionBtnText: { fa: "", en: "" },
                                    duration: "",
                                    isPopular: false,
                                })
                            }
                            variant="outlined"
                        >
                            افزودن پکیج
                        </Button>
                    </Stack>
                </AccordionDetails>
            </Accordion>

            {/* Sub Services */}
            <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">خدمات جزئی (زیرمجموعه)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={2}>
                        {subServicesFields.map((field, index) => (
                            <Card key={field.id} variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                        <Typography variant="subtitle1">خدمت جزئی {index + 1}</Typography>
                                        <IconButton onClick={() => removeSubService(index)} size="small">
                                            <Delete />
                                        </IconButton>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name={`subServices.${index}.icon`}
                                                control={control}
                                                render={({ field }) => (
                                                    <MediaPicker
                                                        value={field.value || null}
                                                        onChange={(selected) => {
                                                            const imageUrl = typeof selected === 'object' && selected !== null 
                                                                ? (selected.url || selected._id || selected) 
                                                                : selected;
                                                            field.onChange(imageUrl || "");
                                                        }}
                                                        label="آیکون"
                                                        accept="image/*"
                                                        multiple={false}
                                                        showPreview={true}
                                                        showEdit={true}
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name={`subServices.${index}.title`}
                                                control={control}
                                                render={({ field }) => <MultiLangTextField {...field} label="عنوان" size="small" required />}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}

                        <Button
                            startIcon={<Add />}
                            onClick={() =>
                                appendSubService({
                                    icon: "",
                                    title: { fa: "", en: "" },
                                })
                            }
                            variant="outlined"
                        >
                            افزودن خدمت جزئی
                        </Button>
                    </Stack>
                </AccordionDetails>
            </Accordion>

            {/* Main Content Sections */}
            <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">محتوای اصلی (بخش‌های توضیحات و نمونه کارها)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={4}>
                        {/* First Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom>بخش اول</Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="mainContent.firstSection.content.title"
                                        control={control}
                                        render={({ field }) => <MultiLangTextField {...field} label="عنوان" size="small" required />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="mainContent.firstSection.content.actionBtnText"
                                        control={control}
                                        render={({ field }) => <MultiLangTextField {...field} label="متن دکمه CTA" size="small" required />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="mainContent.firstSection.content.description"
                                        control={control}
                                        render={({ field }) => <MultiLangTextField {...field} label="توضیحات" multiline rows={3} size="small" required />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" gutterBottom>نمونه کارها (اسلایدر)</Typography>
                                    <Controller
                                        name="mainContent.firstSection.slides"
                                        control={control}
                                        render={({ field }) => (
                                            <CategorySelector
                                                {...field}
                                                label="انتخاب نمونه کارها"
                                                multiple
                                                options={portfolioData?.data || []}
                                                getOptionLabel={(option) => option.title?.fa || option.title || ""}
                                                isOptionEqualToValue={(option, value) => {
                                                    const optionId = typeof option === 'object' && option !== null ? (option._id || option.id) : option;
                                                    const valueId = typeof value === 'object' && value !== null ? (value._id || value.id) : value;
                                                    return optionId === valueId;
                                                }}
                                                onChange={(_, newValue) => {
                                                    // Convert to array of ObjectIds
                                                    const ids = Array.isArray(newValue) 
                                                        ? newValue.map(item => typeof item === 'object' && item !== null ? (item._id || item.id) : item)
                                                        : [];
                                                    field.onChange(ids);
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        {/* Second Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom>بخش دوم</Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="mainContent.secondSection.content.title"
                                        control={control}
                                        render={({ field }) => <MultiLangTextField {...field} label="عنوان" size="small" required />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="mainContent.secondSection.content.actionBtnText"
                                        control={control}
                                        render={({ field }) => <MultiLangTextField {...field} label="متن دکمه CTA" size="small" required />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="mainContent.secondSection.content.description"
                                        control={control}
                                        render={({ field }) => <MultiLangTextField {...field} label="توضیحات" multiline rows={3} size="small" required />}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" gutterBottom>نمونه کارها (اسلایدر)</Typography>
                                    <Controller
                                        name="mainContent.secondSection.slides"
                                        control={control}
                                        render={({ field }) => (
                                            <CategorySelector
                                                {...field}
                                                label="انتخاب نمونه کارها"
                                                multiple
                                                options={portfolioData?.data || []}
                                                getOptionLabel={(option) => option.title?.fa || option.title || ""}
                                                isOptionEqualToValue={(option, value) => {
                                                    const optionId = typeof option === 'object' && option !== null ? (option._id || option.id) : option;
                                                    const valueId = typeof value === 'object' && value !== null ? (value._id || value.id) : value;
                                                    return optionId === valueId;
                                                }}
                                                onChange={(_, newValue) => {
                                                    // Convert to array of ObjectIds
                                                    const ids = Array.isArray(newValue) 
                                                        ? newValue.map(item => typeof item === 'object' && item !== null ? (item._id || item.id) : item)
                                                        : [];
                                                    field.onChange(ids);
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </AccordionDetails>
            </Accordion>

            {/* Final Description */}
            <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">بخش نهایی (ویژگی‌ها و دلایل انتخاب)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={2}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="finalDesc.content.title"
                                    control={control}
                                    render={({ field }) => <MultiLangTextField {...field} label="عنوان" size="small" required />}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="finalDesc.image"
                                    control={control}
                                    render={({ field }) => (
                                        <MediaPicker
                                            value={field.value || null}
                                            onChange={(selected) => {
                                                const imageUrl = typeof selected === 'object' && selected !== null 
                                                    ? (selected.url || selected._id || selected) 
                                                    : selected;
                                                field.onChange(imageUrl || "");
                                            }}
                                            label="تصویر"
                                            accept="image/*"
                                            multiple={false}
                                            showPreview={true}
                                            showEdit={true}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="finalDesc.content.text"
                                    control={control}
                                    render={({ field }) => <MultiLangTextField {...field} label="متن توضیحات" multiline rows={4} size="small" required />}
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                </AccordionDetails>
            </Accordion>

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
