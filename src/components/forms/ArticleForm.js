"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Divider, Accordion, AccordionSummary, AccordionDetails, Alert, Stack, IconButton, Paper, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Save, Cancel, ExpandMore, Publish, Star, Visibility, Language, Image, Tag, Category, Person, Article, PlayCircle, Add, Delete, DragIndicator, ShoppingCart } from "@mui/icons-material";
import { Controller, useWatch, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import { useFormSetup } from "../../hooks/useFormSetup";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { articleValidation, articleUpdateValidation } from "../../lib/validations";
import { normalizeCategories, normalizeSEO, normalizeTags } from "../../lib/utils/formTransformers";
import { normalizeMultiLang, normalizeCategoriesForForm, normalizeSEOForForm, normalizeTagsForForm } from "../../lib/utils/formNormalizers";
import { useApi } from "../../hooks/useApi";

export default function ArticleForm({ article, onSave, onCancel }) {
    const { useFetchData } = useApi();
    
    // Fetch products for relatedProduct selection (only digital article products)
    // Using bracket notation to avoid security validation issues with dots in query params
    const { data: productsData } = useFetchData(["products", "article-related"], "/products?type=digital&digitalProduct[contentType]=article&status=active&isPublished=true&limit=100");
    const products = productsData?.data || [];

    const defaultValues = {
        title: { fa: "", en: "" },
        excerpt: { fa: "", en: "" },
        content: { fa: "", en: "" },
        featuredImage: "",
        introVideo: {
            url: "",
            thumbnailUrl: "",
            duration: 0,
            fileSize: 0,
            format: "mp4"
        },
        categories: [],
        tags: { fa: [], en: [] },
        isPublished: false,
        isFeatured: false,
        isPremium: false,
        relatedProduct: null,
        allowComments: true,
        metaTitle: { fa: "", en: "" },
        metaDescription: { fa: "", en: "" },
        metaKeywords: { fa: [], en: [] },
        downloadBox: {
            title: { fa: "", en: "" },
            description: { fa: "", en: "" },
            fileUrl: "",
            fileName: "",
            fileSize: 0,
            fileType: "",
            isActive: false
        },
        digitalContent: {
            videos: []
        },
    };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        trigger,
        formState: { errors, isDirty },
    } = useFormSetup({
        validationSchema: article ? articleUpdateValidation : articleValidation,
        defaultValues,
        existingItem: article,
        normalizeItem: (item) => ({
            title: normalizeMultiLang(item.title),
            excerpt: normalizeMultiLang(item.excerpt),
            content: normalizeMultiLang(item.content),
            featuredImage: item.featuredImage || "",
            introVideo: item.introVideo || defaultValues.introVideo,
            categories: normalizeCategoriesForForm(item.categories),
            tags: normalizeTagsForForm(item.tags),
            isPublished: item.isPublished || false,
            isFeatured: item.isFeatured || false,
            isPremium: item.isPremium || false,
            relatedProduct: item.relatedProduct?._id || item.relatedProduct || null,
            allowComments: item.allowComments !== false,
            metaTitle: normalizeMultiLang(item.seo?.metaTitle),
            metaDescription: normalizeMultiLang(item.seo?.metaDescription),
            metaKeywords: item.seo?.metaKeywords || { fa: [], en: [] },
            downloadBox: item.downloadBox || defaultValues.downloadBox,
            digitalContent: {
                videos: (item.digitalContent?.videos || []).map(video => {
                    // Remove MongoDB-specific fields (_id, __v, etc.) and keep only allowed fields
                    const cleanVideo = {};
                    if (video.url) cleanVideo.url = video.url;
                    if (video.title) cleanVideo.title = video.title;
                    if (video.thumbnailUrl) cleanVideo.thumbnailUrl = video.thumbnailUrl;
                    if (video.duration !== undefined) cleanVideo.duration = video.duration;
                    if (video.fileSize !== undefined) cleanVideo.fileSize = video.fileSize;
                    if (video.format) cleanVideo.format = video.format;
                    if (video.order !== undefined) cleanVideo.order = video.order;
                    return cleanVideo;
                })
            },
        }),
        mode: "onChange",
    });

    // Field Array for videos
    const {
        fields: videosFields,
        append: appendVideo,
        remove: removeVideo,
    } = useFieldArray({
        control,
        name: "digitalContent.videos",
    });

    // Transform data before submission
    const transformArticleData = (data) => {
        // Normalize form data using utility functions
        const categories = normalizeCategories(data.categories);
        const seo = normalizeSEO({
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            metaKeywords: data.metaKeywords,
        });
        const tags = normalizeTags(data.tags);

        // Ensure content.en is not empty - backend requires it
        const content = data.content || { fa: "", en: "" };
        if (!content.en || content.en.trim() === "") {
            content.en = content.fa || "<p>English content is required</p>";
        }
        
        // Trim excerpt to max 500 characters as per backend validation
        const excerpt = data.excerpt || { fa: "", en: "" };
        if (excerpt.fa && excerpt.fa.length > 500) {
            excerpt.fa = excerpt.fa.substring(0, 500);
        }
        if (excerpt.en && excerpt.en.length > 500) {
            excerpt.en = excerpt.en.substring(0, 500);
        }

        const articleData = {
            title: data.title || { fa: "", en: "" },
            excerpt: excerpt,
            content: content,
            featuredImage: data.featuredImage || "",
            categories,
            tags,
            isPublished: data.isPublished || false,
            isFeatured: data.isFeatured || false,
            isPremium: data.isPremium || false,
            allowComments: data.allowComments !== false,
        };

        // Handle relatedProduct: convert empty string to null, only include if has valid value
        if (data.relatedProduct) {
            const relatedProductValue = typeof data.relatedProduct === 'string' ? data.relatedProduct.trim() : data.relatedProduct;
            if (relatedProductValue && relatedProductValue !== "") {
                // Validate it's a valid MongoDB ObjectId format
                const objectIdPattern = /^[0-9a-fA-F]{24}$/;
                if (objectIdPattern.test(relatedProductValue)) {
                    articleData.relatedProduct = relatedProductValue;
                }
            }
        }
        // If relatedProduct is empty/null/undefined, don't include it
        // Backend will auto-create product if isPremium is true and relatedProduct is not provided

        // Handle introVideo: only include if it has a valid URL
        // Backend validation requires url to be a valid URI or empty string
        // CRITICAL: If introVideo exists but has no URL or empty URL, don't include it at all
        // This prevents sending empty objects {} that would fail Joi validation
        if (data.introVideo && 
            data.introVideo.url && 
            typeof data.introVideo.url === 'string' && 
            data.introVideo.url.trim() !== "") {
            // Only include fields that are allowed by backend validation
            const introVideoData = {
                url: data.introVideo.url.trim()
            };
            
            // Add optional fields only if they have valid values
            if (data.introVideo.thumbnailUrl && typeof data.introVideo.thumbnailUrl === 'string' && data.introVideo.thumbnailUrl.trim() !== "") {
                introVideoData.thumbnailUrl = data.introVideo.thumbnailUrl.trim();
            }
            
            if (data.introVideo.duration !== undefined && data.introVideo.duration !== null && !isNaN(data.introVideo.duration) && Number(data.introVideo.duration) >= 0) {
                introVideoData.duration = Number(data.introVideo.duration);
            }
            
            if (data.introVideo.fileSize !== undefined && data.introVideo.fileSize !== null && !isNaN(data.introVideo.fileSize) && Number(data.introVideo.fileSize) >= 0) {
                introVideoData.fileSize = Number(data.introVideo.fileSize);
            }
            
            // Format must be one of: 'mp4', 'webm', 'm3u8'
            if (data.introVideo.format && typeof data.introVideo.format === 'string' && ['mp4', 'webm', 'm3u8'].includes(data.introVideo.format)) {
                introVideoData.format = data.introVideo.format;
            }
            
            articleData.introVideo = introVideoData;
        }
        // CRITICAL: Explicitly ensure introVideo is NOT in articleData if it doesn't have a valid URL
        // This is a defensive check to prevent any empty object from being sent
        if (articleData.introVideo && (!articleData.introVideo.url || articleData.introVideo.url.trim() === "")) {
            delete articleData.introVideo;
        }

        // Only add seo if it has at least one field
        if (Object.keys(seo).length > 0) {
            articleData.seo = seo;
        }

        // Add downloadBox if it has active content
        if (data.downloadBox && data.downloadBox.isActive) {
            articleData.downloadBox = {
                title: data.downloadBox.title || { fa: "", en: "" },
                description: data.downloadBox.description || { fa: "", en: "" },
                fileUrl: data.downloadBox.fileUrl || "",
                fileName: data.downloadBox.fileName || "",
                fileSize: data.downloadBox.fileSize || 0,
                fileType: data.downloadBox.fileType || "",
                isActive: true
            };
        }

        // Add digitalContent.videos if there are any videos
        if (data.digitalContent?.videos && Array.isArray(data.digitalContent.videos) && data.digitalContent.videos.length > 0) {
            // Filter out videos without valid URLs and normalize the data
            // Also remove any MongoDB-specific fields like _id, __v, etc.
            const validVideos = data.digitalContent.videos
                .filter(video => video && video.url && typeof video.url === 'string' && video.url.trim() !== '')
                .map((video, index) => {
                    // Create a clean video object with only allowed fields
                    const videoData = {
                        url: video.url.trim(),
                        order: video.order !== undefined ? Number(video.order) : index
                    };
                    
                    // Add optional fields only if they have valid values
                    if (video.title && (video.title.fa || video.title.en)) {
                        videoData.title = {
                            fa: video.title.fa || "",
                            en: video.title.en || ""
                        };
                    }
                    
                    if (video.thumbnailUrl && typeof video.thumbnailUrl === 'string' && video.thumbnailUrl.trim() !== "") {
                        videoData.thumbnailUrl = video.thumbnailUrl.trim();
                    }
                    
                    if (video.duration !== undefined && video.duration !== null && !isNaN(video.duration) && Number(video.duration) >= 0) {
                        videoData.duration = Number(video.duration);
                    }
                    
                    if (video.fileSize !== undefined && video.fileSize !== null && !isNaN(video.fileSize) && Number(video.fileSize) >= 0) {
                        videoData.fileSize = Number(video.fileSize);
                    }
                    
                    if (video.format && typeof video.format === 'string' && ['mp4', 'webm', 'm3u8'].includes(video.format)) {
                        videoData.format = video.format;
                    }
                    
                    // Explicitly exclude MongoDB fields (_id, __v, etc.)
                    // These fields are already excluded by only including allowed fields above
                    
                    return videoData;
                });
            
            if (validVideos.length > 0) {
                articleData.digitalContent = {
                    videos: validVideos
                };
            }
        }

        return articleData;
    };

    const { submit, loading } = useFormSubmission({
        endpoint: "/articles",
        queryKey: "articles",
        existingItem: article,
        createMessage: "مقاله با موفقیت ایجاد شد",
        updateMessage: "مقاله با موفقیت ویرایش شد",
        onSuccess: onSave,
        transformData: transformArticleData,
        setValue,
        getValues,
    });

    const onSubmit = async (data) => {
        try {
            const result = await submit(data);
            // If submit returns false, it means there was an error
            if (result === false) {
                // Error already displayed by useFormSubmission
                return;
            }
        } catch (error) {
            // Handle unexpected errors
            if (error?.message) {
                toast.error(error.message);
            } else {
                toast.error("خطا در ذخیره مقاله");
            }
        }
    };

    // Handle image selection
    const handleImageSelect = (selected) => {
        if (selected) {
            // If selected is an object with url, use url; otherwise use the value directly
            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
            setValue("featuredImage", imageUrl);
        } else {
            setValue("featuredImage", "");
        }
    };

    // Helper function to find first error in nested objects/arrays
    const findFirstError = (errors, path = '') => {
        for (const key in errors) {
            if (!errors.hasOwnProperty(key)) continue;
            
            const currentPath = path ? `${path}.${key}` : key;
            const error = errors[key];
            
            if (error && typeof error === 'object') {
                // Check if it's a validation error object
                if (error.message && typeof error.message === 'string') {
                    return { path: currentPath, message: error.message, error };
                }
                // Check if it's an array of errors
                if (Array.isArray(error)) {
                    for (let i = 0; i < error.length; i++) {
                        if (error[i] && typeof error[i] === 'object') {
                            const nestedError = findFirstError(error[i], `${currentPath}[${i}]`);
                            if (nestedError) return nestedError;
                        }
                    }
                }
                // Recursively search nested objects
                const nestedError = findFirstError(error, currentPath);
                if (nestedError) return nestedError;
            } else if (error && typeof error === 'string') {
                return { path: currentPath, message: error, error };
            }
        }
        return null;
    };

    const onError = (validationErrors) => {
        // Handle validation errors
        if (Object.keys(validationErrors).length > 0) {
            // Find first error (including nested errors in arrays)
            const firstError = findFirstError(validationErrors);
            
            // Extract error message safely
            let errorMessage = "لطفاً خطاهای اعتبارسنجی را برطرف کنید";
            let errorPath = '';
            
            if (firstError) {
                errorMessage = firstError.message || errorMessage;
                errorPath = firstError.path || '';
            } else {
                // Fallback: use first top-level error
                const firstErrorKey = Object.keys(validationErrors)[0];
                const firstErrorValue = validationErrors[firstErrorKey];
                
                if (firstErrorValue) {
                    if (firstErrorValue.message && typeof firstErrorValue.message === 'string') {
                        errorMessage = firstErrorValue.message;
                    } else if (firstErrorValue.type) {
                        const fieldLabels = {
                            'title': 'عنوان',
                            'content': 'محتوای',
                            'excerpt': 'خلاصه',
                            'featuredImage': 'تصویر شاخص',
                            'categories': 'دسته‌بندی',
                            'tags': 'برچسب‌ها',
                            'digitalContent': 'محتوای دیجیتال',
                        };
                        const fieldLabel = fieldLabels[firstErrorKey] || firstErrorKey;
                        const typeMessages = {
                            faRequired: `${fieldLabel} (فارسی) الزامی است`,
                            enRequired: `${fieldLabel} (انگلیسی) الزامی است`,
                            required: `${fieldLabel} الزامی است`,
                        };
                        errorMessage = typeMessages[firstErrorValue.type] || firstErrorValue.message || `${fieldLabel} الزامی است`;
                    } else if (typeof firstErrorValue === 'string') {
                        errorMessage = firstErrorValue;
                    }
                    errorPath = firstErrorKey;
                }
            }
            
            toast.error(errorMessage);
            
            // Scroll to the first error field for better UX
            if (errorPath) {
                const fieldName = errorPath.split('.')[0]; // Get base field name
                const errorElement = document.querySelector(`[name="${errorPath}"]`) || 
                                    document.querySelector(`[name="${fieldName}"]`) ||
                                    document.querySelector(`[id="${errorPath}"]`) ||
                                    document.querySelector(`[id="${fieldName}"]`);
                if (errorElement) {
                    setTimeout(() => {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        errorElement.focus();
                    }, 100);
                }
            }
        } else {
            toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit, onError)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Title Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Language /> عنوان مقاله
                            </Typography>
                            <Controller
                                name="title"
                                control={control}
                                rules={{
                                    validate: {
                                        faRequired: (value) => {
                                            if (!value || typeof value !== 'object') return "عنوان فارسی الزامی است";
                                            const trimmed = value.fa?.trim();
                                            return trimmed ? true : "عنوان فارسی الزامی است";
                                        },
                                        enRequired: (value) => {
                                            if (!value || typeof value !== 'object') return "عنوان انگلیسی الزامی است";
                                            const trimmed = value.en?.trim();
                                            return trimmed ? true : "عنوان انگلیسی الزامی است";
                                        },
                                    },
                                }}
                                render={({ field }) => (
                                    <MultiLangTextField
                                        {...field}
                                        label="عنوان"
                                        error={errors.title}
                                        placeholder={{
                                            fa: "عنوان مقاله به فارسی...",
                                            en: "Article title in English...",
                                        }}
                                    />
                                )}
                            />
                        </Box>


                        {/* Excerpt Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                خلاصه مقاله
                            </Typography>
                            <Controller
                                name="excerpt"
                                control={control}
                                render={({ field }) => (
                                    <MultiLangTextField
                                        {...field}
                                        label="خلاصه"
                                        multiline
                                        rows={3}
                                        error={errors.excerpt}
                                        placeholder={{
                                            fa: "خلاصه‌ای از محتوای مقاله...",
                                            en: "Brief summary of the article...",
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Content Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Article /> محتوای مقاله
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                برای درج تصویر در محتوا، از دکمه "تصویر" در نوار ابزار ویرایشگر استفاده کنید.
                            </Alert>
                            <Controller
                                name="content"
                                control={control}
                                rules={{
                                    validate: {
                                        faRequired: (value) => {
                                            if (!value || typeof value !== 'object') return "محتوای فارسی الزامی است";
                                            // Remove HTML tags for validation
                                            const textContent = value.fa?.replace(/<[^>]*>/g, '').trim() || "";
                                            return textContent ? true : "محتوای فارسی الزامی است";
                                        },
                                    },
                                }}
                                render={({ field }) => (
                                    <MultiLangEditor 
                                        value={field.value || { fa: "", en: "" }} 
                                        onChange={(newValue) => {
                                            field.onChange(newValue);
                                        }}
                                        label="محتوا" 
                                        error={errors.content} 
                                        height={400} 
                                    />
                                )}
                            />
                        </Box>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{xs:12, lg:4}}>
                    <Stack spacing={3}>
                        {/* Publication Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Publish /> تنظیمات انتشار
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="isPublished"
                                    control={control}
                                    render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="انتشار فوری" />}
                                />

                                <Controller name="isFeatured" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="مقاله ویژه" />} />

                                <Controller
                                    name="isPremium"
                                    control={control}
                                    render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="مقاله پولی" />}
                                />

                                <Controller
                                    name="allowComments"
                                    control={control}
                                    render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="امکان نظردهی" />}
                                />
                            </Stack>
                        </Box>

                        {/* Related Product - Only show when isPremium is true */}
                        {watch("isPremium") && (
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <ShoppingCart /> محصول مرتبط
                                </Typography>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    برای مقالات پولی، می‌توانید یک محصول دیجیتال از نوع مقاله را انتخاب کنید. اگر محصولی انتخاب نشود، سیستم به صورت خودکار یک محصول جدید ایجاد می‌کند.
                                </Alert>
                                <Controller
                                    name="relatedProduct"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>انتخاب محصول (اختیاری)</InputLabel>
                                            <Select
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                                label="انتخاب محصول (اختیاری)"
                                                displayEmpty
                                            >
                                                <MenuItem value="">
                                                    <em>بدون محصول (ایجاد خودکار)</em>
                                                </MenuItem>
                                                {products.map((product) => (
                                                    <MenuItem key={product._id} value={product._id}>
                                                        {product.name?.fa || product.name?.en || product.name || `محصول ${product._id}`}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Box>
                        )}

                        {/* Featured Image */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر شاخص
                            </Typography>
                            <Controller
                                name="featuredImage"
                                control={control}
                                render={({ field }) => (
                                    <MediaPicker
                                        value={field.value || null}
                                        onChange={(selected) => {
                                            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                            field.onChange(imageUrl);
                                            handleImageSelect(selected);
                                        }}
                                        label="انتخاب تصویر شاخص"
                                        accept="image/*"
                                        multiple={false}
                                        showPreview={true}
                                        showEdit={true}
                                        optimizeForWeb={true}
                                    />
                                )}
                            />
                        </Box>

                        {/* Intro Video */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PlayCircle /> ویدئو معرفی (اختیاری)
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                ویدئو معرفی در بالای سایدبار صفحه جزئیات مقاله نمایش داده می‌شود.
                            </Alert>
                            <Stack spacing={2}>
                                <Controller
                                    name="introVideo.url"
                                    control={control}
                                    render={({ field }) => (
                                        <MediaPicker
                                            value={field.value || null}
                                            onChange={(selected) => {
                                                const videoUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                                const thumbnailUrl = typeof selected === 'object' ? (selected.thumbnailUrl || selected.url || "") : "";
                                                const duration = typeof selected === 'object' ? (selected.duration || 0) : 0;
                                                const fileSize = typeof selected === 'object' ? (selected.size || selected.fileSize || 0) : 0;
                                                const format = typeof selected === 'object' ? (selected.format || "mp4") : "mp4";
                                                
                                                field.onChange(videoUrl);
                                                setValue("introVideo.thumbnailUrl", thumbnailUrl);
                                                setValue("introVideo.duration", duration);
                                                setValue("introVideo.fileSize", fileSize);
                                                setValue("introVideo.format", format);
                                            }}
                                            label="انتخاب ویدئو معرفی"
                                            accept="video/*"
                                            multiple={false}
                                            showPreview={true}
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Video List */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PlayCircle /> لیست ویدئوها
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                ویدئوها در ابتدای صفحه جزئیات مقاله به صورت لیست آکاردئونی نمایش داده می‌شوند.
                            </Alert>
                            <Stack spacing={2}>
                                {videosFields.map((field, index) => (
                                    <Paper key={field.id} elevation={2} sx={{ p: 2 }}>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <DragIndicator sx={{ color: "text.secondary", cursor: "grab" }} />
                                                <Typography variant="subtitle2" sx={{ flex: 1 }}>
                                                    ویدئو {index + 1}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeVideo(index)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Box>
                                            
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12 }}>
                                                    <Controller
                                                        name={`digitalContent.videos.${index}.title`}
                                                        control={control}
                                                        render={({ field: titleField }) => (
                                                            <MultiLangTextField
                                                                {...titleField}
                                                                label="عنوان ویدئو"
                                                                error={errors.digitalContent?.videos?.[index]?.title}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Controller
                                                        name={`digitalContent.videos.${index}.url`}
                                                        control={control}
                                                        render={({ field: urlField }) => (
                                                            <MediaPicker
                                                                value={urlField.value || null}
                                                                onChange={(selected) => {
                                                                    const videoUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                                                    const thumbnailUrl = typeof selected === 'object' ? (selected.thumbnailUrl || selected.url || "") : "";
                                                                    const duration = typeof selected === 'object' ? (selected.duration || 0) : 0;
                                                                    const fileSize = typeof selected === 'object' ? (selected.size || selected.fileSize || 0) : 0;
                                                                    const format = typeof selected === 'object' ? (selected.format || "mp4") : "mp4";
                                                                    
                                                                    urlField.onChange(videoUrl);
                                                                    setValue(`digitalContent.videos.${index}.thumbnailUrl`, thumbnailUrl);
                                                                    setValue(`digitalContent.videos.${index}.duration`, duration);
                                                                    setValue(`digitalContent.videos.${index}.fileSize`, fileSize);
                                                                    setValue(`digitalContent.videos.${index}.format`, format);
                                                                    setValue(`digitalContent.videos.${index}.order`, index);
                                                                }}
                                                                label="انتخاب ویدئو"
                                                                accept="video/*"
                                                                multiple={false}
                                                                showPreview={true}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </Paper>
                                ))}
                                
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={() => {
                                        appendVideo({
                                            title: { fa: "", en: "" },
                                            url: "", // Empty string, not undefined
                                            thumbnailUrl: "",
                                            duration: 0,
                                            fileSize: 0,
                                            format: "mp4",
                                            order: videosFields.length
                                        });
                                    }}
                                    sx={{ mt: 1 }}
                                >
                                    افزودن ویدئو
                                </Button>
                            </Stack>
                        </Box>

                        {/* Categories */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Category /> دسته‌بندی
                            </Typography>
                            <Controller 
                                name="categories" 
                                control={control} 
                                render={({ field, fieldState }) => (
                                    <CategorySelector 
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        type="article" 
                                        label="انتخاب دسته‌بندی" 
                                        error={fieldState.error}
                                    />
                                )} 
                            />
                        </Box>

                        {/* Tags */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Tag /> برچسب‌ها
                            </Typography>
                            <Controller 
                                name="tags.fa" 
                                control={control} 
                                render={({ field }) => (
                                    <TagInput 
                                        {...field} 
                                        label="برچسب‌های فارسی" 
                                        placeholder="برچسب فارسی اضافه کنید..." 
                                        error={errors.tags?.fa}
                                    />
                                )} 
                            />
                            <Box sx={{ mt: 2 }}>
                                <Controller 
                                    name="tags.en" 
                                    control={control} 
                                    render={({ field }) => (
                                        <TagInput 
                                            {...field} 
                                            label="برچسب‌های انگلیسی" 
                                            placeholder="Add English tags..." 
                                            error={errors.tags?.en}
                                        />
                                    )} 
                                />
                            </Box>
                        </Box>

                        {/* Download Box */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Visibility /> باکس دانلود
                            </Typography>
                            <Stack spacing={2}>
                                <Controller
                                    name="downloadBox.isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel 
                                            control={<Switch {...field} checked={field.value} />} 
                                            label="فعال‌سازی باکس دانلود" 
                                        />
                                    )}
                                />
                                {watch("downloadBox.isActive") && (
                                    <>
                                        <Controller
                                            name="downloadBox.title"
                                            control={control}
                                            render={({ field }) => (
                                                <MultiLangTextField
                                                    {...field}
                                                    label="عنوان باکس دانلود"
                                                    error={errors.downloadBox?.title}
                                                    placeholder={{
                                                        fa: "عنوان باکس دانلود...",
                                                        en: "Download box title...",
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="downloadBox.description"
                                            control={control}
                                            render={({ field }) => (
                                                <MultiLangTextField
                                                    {...field}
                                                    label="توضیحات"
                                                    multiline
                                                    rows={2}
                                                    error={errors.downloadBox?.description}
                                                    placeholder={{
                                                        fa: "توضیحات فایل قابل دانلود...",
                                                        en: "Description of downloadable file...",
                                                    }}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="downloadBox.fileUrl"
                                            control={control}
                                            render={({ field }) => (
                                                <MediaPicker
                                                    value={field.value || null}
                                                    onChange={(selected) => {
                                                        const fileUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                                        const fileName = typeof selected === 'object' ? (selected.originalName || selected.fileName || "") : "";
                                                        const fileSize = typeof selected === 'object' ? (selected.size || 0) : 0;
                                                        const fileType = typeof selected === 'object' ? (selected.fileType || selected.mimeType || "") : "";
                                                        
                                                        field.onChange(fileUrl);
                                                        setValue("downloadBox.fileName", fileName);
                                                        setValue("downloadBox.fileSize", fileSize);
                                                        setValue("downloadBox.fileType", fileType);
                                                    }}
                                                    label="فایل قابل دانلود"
                                                    accept={["image/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/x-rar-compressed", "video/*", "audio/*"]}
                                                    showPreview={true}
                                                />
                                            )}
                                        />
                                    </>
                                )}
                            </Stack>
                        </Box>

                        {/* SEO Settings */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">تنظیمات سئو</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="metaTitle"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="عنوان Meta"
                                                error={errors.metaTitle}
                                                placeholder={{
                                                    fa: "عنوان سئو فارسی...",
                                                    en: "SEO title in English...",
                                                }}
                                                maxLength={60}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="metaDescription"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="توضیحات Meta"
                                                multiline
                                                rows={3}
                                                error={errors.metaDescription}
                                                placeholder={{
                                                    fa: "توضیحات سئو فارسی...",
                                                    en: "SEO description in English...",
                                                }}
                                                maxLength={160}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="metaKeywords.fa"
                                        control={control}
                                        render={({ field }) => (
                                            <TagInput 
                                                {...field} 
                                                label="کلمات کلیدی فارسی" 
                                                placeholder="کلمه کلیدی اضافه کنید..." 
                                                error={errors.metaKeywords?.fa}
                                            />
                                        )}
                                    />

                                    <Controller 
                                        name="metaKeywords.en" 
                                        control={control} 
                                        render={({ field }) => (
                                            <TagInput 
                                                {...field} 
                                                label="English Keywords" 
                                                placeholder="Add keyword..." 
                                                error={errors.metaKeywords?.en}
                                            />
                                        )} 
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button 
                    type="button"
                    variant="outlined" 
                    onClick={onCancel} 
                    disabled={loading} 
                    startIcon={<Cancel />}
                >
                    انصراف
                </Button>

                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={loading} 
                    startIcon={<Save />}
                >
                    {loading 
                        ? "در حال ذخیره..." 
                        : article 
                            ? "ویرایش مقاله" 
                            : "ایجاد مقاله"}
                </Button>
            </Box>

            {/* Dirty Form Warning */}
            {isDirty && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    تغییراتی در فرم ایجاد شده است. فراموش نکنید که آن‌ها را ذخیره کنید.
                </Alert>
            )}
        </Box>
    );
}
