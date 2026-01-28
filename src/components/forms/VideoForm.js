"use client";
import React from "react";
import { 
    Box, Button, Grid, Switch, FormControlLabel, Typography, 
    Stack, Alert, Divider
} from "@mui/material";
import { 
    Save, Cancel, Publish, Star, VideoLibrary, 
    Tag, Category, Visibility, Language, Image
} from "@mui/icons-material";
import { Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import { useFormSetup } from "../../hooks/useFormSetup";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { videoValidation, videoUpdateValidation } from "../../lib/validations";
import { normalizeCategories, normalizeSEO, normalizeTags } from "../../lib/utils/formTransformers";
import { normalizeMultiLang, normalizeCategoriesForForm, normalizeSEOForForm, normalizeTagsForForm } from "../../lib/utils/formNormalizers";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function VideoForm({ video, onSave, onCancel }) {
    const { useFetchData } = useApi();
    
    // Fetch media for video selection
    const { data: videoMediaData } = useFetchData("video-media", "/media?fileType=video&limit=100");

    const defaultValues = {
        title: { fa: "", en: "" },
        description: { fa: "", en: "" },
        shortDescription: { fa: "", en: "" },
        videoUrl: "",
        videoMediaId: null, // Store Media ID for fetching metadata
        thumbnailUrl: "",
        duration: 0,
        fileSize: 0,
        quality: "auto",
        format: "mp4",
        categories: [],
        tags: { fa: [], en: [] },
        isPublished: false,
        isFeatured: false,
        metadata: {
            width: 0,
            height: 0,
            fps: 0,
            codec: "",
            bitrate: 0
        },
        seo: {
            metaTitle: { fa: "", en: "" },
            metaDescription: { fa: "", en: "" },
            metaKeywords: { fa: [], en: [] },
            ogImage: ""
        }
    };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors, isDirty },
    } = useFormSetup({
        validationSchema: video ? videoUpdateValidation : videoValidation,
        defaultValues,
        existingItem: video,
        normalizeItem: (item) => ({
            title: normalizeMultiLang(item.title),
            description: normalizeMultiLang(item.description),
            shortDescription: normalizeMultiLang(item.shortDescription),
            videoUrl: item.videoUrl || "",
            thumbnailUrl: item.thumbnailUrl || "",
            duration: item.duration || 0,
            fileSize: item.fileSize || 0,
            quality: item.quality || "auto",
            format: item.format || "mp4",
            videoMediaId: item.videoMediaId || null,
            categories: normalizeCategoriesForForm(item.categories),
            tags: normalizeTagsForForm(item.tags),
            isPublished: item.isPublished || false,
            isFeatured: item.isFeatured || false,
            metadata: item.metadata || defaultValues.metadata,
            seo: normalizeSEOForForm(item.seo),
        }),
        mode: "onChange",
    });

    // Watch videoMediaId to fetch metadata when video is selected
    const watchedVideoMediaId = watch("videoMediaId");

    // Fetch video metadata when videoMediaId changes
    const { data: videoMediaMetadata } = useFetchData(
        watchedVideoMediaId ? [`media-${watchedVideoMediaId}`] : ['media-null'],
        watchedVideoMediaId ? `/media/${watchedVideoMediaId}` : null,
        {
            enabled: !!watchedVideoMediaId
        }
    );

    // Auto-populate video metadata when media is selected
    React.useEffect(() => {
        if (videoMediaMetadata?.data?.media) {
            const media = videoMediaMetadata.data.media;
            
            // Set video URL
            setValue("videoUrl", media.url);
            
            // Set duration from media
            if (media.duration) {
                setValue("duration", Math.round(media.duration));
            }
            
            // Set file size from media
            if (media.size) {
                setValue("fileSize", media.size);
            }
            
            // Set format from mimeType
            if (media.mimeType) {
                if (media.mimeType.includes('mp4')) {
                    setValue("format", "mp4");
                } else if (media.mimeType.includes('webm')) {
                    setValue("format", "webm");
                } else {
                    setValue("format", "other");
                }
            }
            
            // Set metadata from media dimensions
            if (media.dimensions) {
                setValue("metadata.width", media.dimensions.width || 0);
                setValue("metadata.height", media.dimensions.height || 0);
            }
            
            // Set quality based on dimensions
            if (media.dimensions?.height) {
                const height = media.dimensions.height;
                if (height >= 2160) setValue("quality", "2160p");
                else if (height >= 1440) setValue("quality", "1440p");
                else if (height >= 1080) setValue("quality", "1080p");
                else if (height >= 720) setValue("quality", "720p");
                else if (height >= 480) setValue("quality", "480p");
                else if (height >= 360) setValue("quality", "360p");
                else setValue("quality", "auto");
            }
        }
    }, [videoMediaMetadata, setValue]);

    // Transform data before submission
    const transformVideoData = (data) => {
        // Normalize form data using utility functions
        const categories = normalizeCategories(data.categories);
        const seo = normalizeSEO({
            metaTitle: data.seo?.metaTitle,
            metaDescription: data.seo?.metaDescription,
            metaKeywords: data.seo?.metaKeywords,
        });
        const tags = normalizeTags(data.tags);

        const videoData = {
            title: data.title || { fa: "", en: "" },
            description: data.description || { fa: "", en: "" },
            shortDescription: data.shortDescription || { fa: "", en: "" },
            videoUrl: data.videoUrl || "",
            thumbnailUrl: data.thumbnailUrl || "",
            duration: data.duration || 0,
            categories,
            tags,
            isPublished: data.isPublished || false,
            isFeatured: data.isFeatured || false,
        };

        // Only include optional fields if they have values
        if (data.fileSize && data.fileSize > 0) {
            videoData.fileSize = data.fileSize;
        }

        if (data.quality && data.quality !== "auto") {
            videoData.quality = data.quality;
        }

        if (data.format && data.format !== "mp4") {
            videoData.format = data.format;
        }

        // Only include metadata if it has meaningful values
        if (data.metadata && (data.metadata.width > 0 || data.metadata.height > 0)) {
            const metadata = {};
            if (data.metadata.width > 0) metadata.width = data.metadata.width;
            if (data.metadata.height > 0) metadata.height = data.metadata.height;
            if (data.metadata.fps > 0) metadata.fps = data.metadata.fps;
            if (data.metadata.codec) metadata.codec = data.metadata.codec;
            if (data.metadata.bitrate > 0) metadata.bitrate = data.metadata.bitrate;
            
            if (Object.keys(metadata).length > 0) {
                videoData.metadata = metadata;
            }
        }

        // Only add seo if it has at least one field
        if (Object.keys(seo).length > 0) {
            videoData.seo = seo;
        }

        // Remove videoMediaId (only used for fetching metadata)
        delete videoData.videoMediaId;

        // Auto-generate infoBox from video data (title and description)
        videoData.infoBox = {
            title: videoData.title || { fa: "", en: "" },
            content: videoData.description || { fa: "", en: "" }
        };

        return videoData;
    };

    const { submit, loading } = useFormSubmission({
        endpoint: "/videos",
        queryKey: "videos",
        existingItem: video,
        createMessage: "ویدئو با موفقیت ایجاد شد",
        updateMessage: "ویدئو با موفقیت به‌روزرسانی شد",
        onSuccess: onSave,
        transformData: transformVideoData,
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
                toast.error("خطا در ذخیره ویدئو");
            }
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
                            'description': 'توضیحات',
                            'shortDescription': 'توضیحات کوتاه',
                            'videoUrl': 'آدرس ویدئو',
                            'thumbnailUrl': 'تصویر کاور',
                            'duration': 'مدت زمان',
                            'categories': 'دسته‌بندی',
                            'tags': 'برچسب‌ها',
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
                                <Language /> عنوان ویدئو
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
                                            fa: "عنوان ویدئو به فارسی...",
                                            en: "Video title in English...",
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Short Description Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                توضیحات کوتاه
                            </Typography>
                            <Controller
                                name="shortDescription"
                                control={control}
                                render={({ field }) => (
                                    <MultiLangTextField
                                        {...field}
                                        label="توضیحات کوتاه"
                                        multiline
                                        rows={3}
                                        error={errors.shortDescription}
                                        placeholder={{
                                            fa: "خلاصه‌ای از ویدئو...",
                                            en: "Brief summary of the video...",
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Description Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <VideoLibrary /> توضیحات کامل
                            </Typography>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <MultiLangEditor 
                                        value={field.value || { fa: "", en: "" }} 
                                        onChange={(newValue) => {
                                            field.onChange(newValue);
                                        }}
                                        label="توضیحات" 
                                        error={errors.description} 
                                        height={300} 
                                    />
                                )}
                            />
                        </Box>

                        {/* Video File Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <VideoLibrary /> فایل ویدئو
                            </Typography>
                            <Controller
                                name="videoMediaId"
                                control={control}
                                rules={{ required: "فایل ویدئو الزامی است" }}
                                render={({ field, fieldState }) => {
                                    // Get media object from videoMediaData or use existing value
                                    let mediaValue = field.value;
                                    if (field.value && typeof field.value === 'string') {
                                        const selectedMedia = videoMediaData?.data?.find(m => m._id === field.value);
                                        if (selectedMedia) {
                                            mediaValue = selectedMedia;
                                        }
                                    }
                                    
                                    return (
                                        <MediaPicker
                                            value={mediaValue}
                                            onChange={(selected) => {
                                                // Handle both object and string
                                                let mediaId = null;
                                                let mediaUrl = "";
                                                
                                                if (typeof selected === 'string') {
                                                    // If it's a URL string, find the media by URL
                                                    const media = videoMediaData?.data?.find(m => m.url === selected);
                                                    if (media) {
                                                        mediaId = media._id;
                                                        mediaUrl = media.url;
                                                    } else {
                                                        mediaUrl = selected;
                                                    }
                                                } else if (selected && typeof selected === 'object') {
                                                    // If it's an object, extract _id and url
                                                    mediaId = selected._id || selected.id;
                                                    mediaUrl = selected.url || selected;
                                                }
                                                
                                                field.onChange(mediaId);
                                                if (mediaUrl) {
                                                    setValue("videoUrl", mediaUrl);
                                                }
                                            }}
                                            label="انتخاب فایل ویدئو"
                                            accept="video/*"
                                            multiple={false}
                                            showPreview={true}
                                            error={fieldState.error}
                                            helperText={fieldState.error?.message || "ویدئو را از کتابخانه رسانه انتخاب کنید"}
                                        />
                                    );
                                }}
                            />
                        </Box>

                        {/* Thumbnail Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر کاور
                            </Typography>
                            <Controller
                                name="thumbnailUrl"
                                control={control}
                                rules={{ required: "تصویر کاور الزامی است" }}
                                render={({ field, fieldState }) => (
                                    <MediaPicker
                                        value={field.value || null}
                                        onChange={(selected) => {
                                            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                            field.onChange(imageUrl);
                                        }}
                                        label="انتخاب تصویر کاور"
                                        accept="image/*"
                                        multiple={false}
                                        showPreview={true}
                                        error={fieldState.error}
                                        helperText={fieldState.error?.message || "تصویر کاور ویدئو را انتخاب کنید"}
                                    />
                                )}
                            />
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
                                        type="video" 
                                        label="انتخاب دسته‌بندی" 
                                        error={fieldState.error}
                                        multiple
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

                        {/* SEO Section */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Visibility /> بهینه‌سازی موتور جستجو (SEO)
                            </Typography>
                            <Stack spacing={2}>
                                <Controller
                                    name="seo.metaTitle"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <MultiLangTextField
                                            {...field}
                                            label="عنوان متا"
                                            error={fieldState.error}
                                        />
                                    )}
                                />
                                <Controller
                                    name="seo.metaDescription"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <MultiLangTextField
                                            {...field}
                                            label="توضیحات متا"
                                            multiline
                                            rows={3}
                                            error={fieldState.error}
                                        />
                                    )}
                                />
                                <Controller
                                    name="seo.metaKeywords"
                                    control={control}
                                    render={({ field }) => (
                                        <TagInput
                                            {...field}
                                            label="کلمات کلیدی متا"
                                        />
                                    )}
                                />
                                <Controller
                                    name="seo.ogImage"
                                    control={control}
                                    render={({ field }) => (
                                        <MediaPicker
                                            value={field.value || null}
                                            onChange={(selected) => {
                                                const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
                                                field.onChange(imageUrl);
                                            }}
                                            label="تصویر Open Graph"
                                            accept="image/*"
                                            multiple={false}
                                            showPreview={true}
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, lg: 4 }}>
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
                                    render={({ field }) => (
                                        <FormControlLabel 
                                            control={<Switch {...field} checked={field.value} />} 
                                            label="انتشار فوری" 
                                        />
                                    )}
                                />
                                <Controller 
                                    name="isFeatured" 
                                    control={control} 
                                    render={({ field }) => (
                                        <FormControlLabel 
                                            control={<Switch {...field} checked={field.value} />} 
                                            label="ویدئو ویژه" 
                                        />
                                    )} 
                                />
                            </Stack>
                        </Box>

                        {/* Related Content Info */}
                        <Box>
                            <Alert severity="info">
                                محتواهای مرتبط (خدمات، نمونه کارها، مقالات و ویدئوهای مرتبط) به صورت خودکار بر اساس دسته‌بندی و تگ‌ها محاسبه می‌شوند.
                            </Alert>
                        </Box>

                        {/* Video Metadata Info */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                اطلاعات ویدئو
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                اطلاعات ویدئو (مدت زمان، اندازه فایل، کیفیت و فرمت) به صورت خودکار از فایل ویدئو استخراج می‌شود.
                            </Alert>
                            <Stack spacing={1}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        مدت زمان:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {watch("duration") ? `${Math.floor(watch("duration") / 60)}:${String(watch("duration") % 60).padStart(2, '0')}` : "0:00"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        اندازه فایل:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {watch("fileSize") ? `${(watch("fileSize") / 1024 / 1024).toFixed(2)} MB` : "0 MB"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        کیفیت:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {watch("quality") || "auto"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        فرمت:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {watch("format") || "mp4"}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>

                {/* Actions */}
                <Grid size={12}>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button
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
                            disabled={loading || !isDirty}
                            startIcon={<Save />}
                        >
                            {loading ? "در حال ذخیره..." : "ذخیره"}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
