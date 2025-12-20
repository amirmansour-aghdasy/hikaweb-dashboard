"use client";
import { 
    Box, Button, Grid, Switch, FormControlLabel, Typography, 
    Accordion, AccordionSummary, AccordionDetails, Alert, Stack
} from "@mui/material";
import { 
    Save, Cancel, ExpandMore, Publish, Star, VideoLibrary, 
    Tag, Category, Visibility
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import { useApi } from "../../hooks/useApi";
import { useJoiValidation } from "../../hooks/useJoiValidation";
import { useFormErrorHandler } from "../../hooks/useFormErrorHandler";
import { videoValidation, videoUpdateValidation } from "../../lib/validations";
import toast from "react-hot-toast";

export default function VideoForm({ video, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData, useFetchData } = useApi();

    const createVideo = useCreateData("/videos", {
        queryKey: "videos"
    });
    const updateVideo = useUpdateData("/videos", {
        queryKey: "videos"
    });

    // Fetch media for video selection
    const { data: videoMediaData } = useFetchData("video-media", "/media?fileType=video&limit=100");

    // Use joi resolver for validation
    const resolver = useJoiValidation(video ? videoUpdateValidation : videoValidation);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        resolver,
        mode: "onChange", // Enable real-time validation
        defaultValues: {
            title: { fa: "", en: "" },
            slug: { fa: "", en: "" },
            description: { fa: "", en: "" },
            shortDescription: { fa: "", en: "" },
            videoUrl: "",
            videoMediaId: null, // Store Media ID for fetching metadata
            thumbnailUrl: "",
            duration: 0, // Auto-calculated
            fileSize: 0, // Auto-calculated
            quality: "auto", // Auto-calculated
            format: "mp4", // Auto-calculated
            categories: [],
            tags: { fa: [], en: [] },
            isPublished: false,
            isFeatured: false,
            metadata: {
                width: 0, // Auto-calculated
                height: 0, // Auto-calculated
                fps: 0, // Auto-calculated
                codec: "", // Auto-calculated
                bitrate: 0 // Auto-calculated
            },
            seo: {
                metaTitle: { fa: "", en: "" },
                metaDescription: { fa: "", en: "" },
                metaKeywords: { fa: [], en: [] },
                ogImage: ""
            }
        },
    });

    // Initialize form error handler after useForm
    const handleFormError = useFormErrorHandler(setValue, getValues);

    // Watch videoMediaId to fetch metadata when video is selected
    const watchedVideoMediaId = watch("videoMediaId");

    useEffect(() => {
        if (video) {
            const normalizeMultiLang = (value) => {
                if (!value) return { fa: "", en: "" };
                if (typeof value === 'string') return { fa: value, en: "" };
                if (typeof value === 'object') {
                    return {
                        fa: value.fa || "",
                        en: value.en || ""
                    };
                }
                return { fa: "", en: "" };
            };

            const categoriesValue = Array.isArray(video.categories)
                ? video.categories.map(cat => 
                    typeof cat === 'object' && cat._id ? cat._id : cat
                  )
                : [];

            const relatedServicesValue = Array.isArray(video.relatedServices)
                ? video.relatedServices.map(s => typeof s === 'object' && s._id ? s._id : s)
                : [];

            const relatedPortfoliosValue = Array.isArray(video.relatedPortfolios)
                ? video.relatedPortfolios.map(p => typeof p === 'object' && p._id ? p._id : p)
                : [];

            const relatedArticlesValue = Array.isArray(video.relatedArticles)
                ? video.relatedArticles.map(a => typeof a === 'object' && a._id ? a._id : a)
                : [];

            reset({
                title: normalizeMultiLang(video.title),
                slug: normalizeMultiLang(video.slug),
                description: normalizeMultiLang(video.description),
                shortDescription: normalizeMultiLang(video.shortDescription),
                videoUrl: video.videoUrl || "",
                thumbnailUrl: video.thumbnailUrl || "",
                duration: video.duration || 0,
                fileSize: video.fileSize || 0,
                quality: video.quality || "auto",
                format: video.format || "mp4",
                hlsUrl: video.hlsUrl || "",
                dashUrl: video.dashUrl || "",
                categories: categoriesValue,
                tags: video.tags || { fa: [], en: [] },
                videoMediaId: video.videoMediaId || null,
                isPublished: video.isPublished || false,
                isFeatured: video.isFeatured || false,
                metadata: video.metadata || {
                    width: 0,
                    height: 0,
                    fps: 0,
                    codec: "",
                    bitrate: 0
                },
                seo: video.seo || {
                    metaTitle: { fa: "", en: "" },
                    metaDescription: { fa: "", en: "" },
                    metaKeywords: { fa: [], en: [] },
                    ogImage: ""
                },
                duration: video.duration || 0,
                fileSize: video.fileSize || 0,
                quality: video.quality || "auto",
                format: video.format || "mp4",
                metadata: video.metadata || {
                    width: 0,
                    height: 0,
                    fps: 0,
                    codec: "",
                    bitrate: 0
                }
            }, { keepDefaultValues: false });
        }
    }, [video, reset]);

    // Watch title for slug generation - watch both fa and en separately for real-time reactivity
    const watchedTitleFa = useWatch({
        control,
        name: "title.fa"
    });
    
    const watchedTitleEn = useWatch({
        control,
        name: "title.en"
    });

    const generateSlugFa = (title) => {
        if (!title) return "";
        return title
            .trim()
            .replace(/[،,\.]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const generateSlugEn = (title) => {
        if (!title) return "";
        return title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    // Auto-generate slug when title changes (only in create mode)
    // Use useWatch for real-time reactivity - it will trigger on every change
    useEffect(() => {
        if (video) return; // Don't auto-generate in edit mode
        
        const titleFa = watchedTitleFa || "";
        const titleEn = watchedTitleEn || "";
        
        if (titleFa && titleFa.trim()) {
            const newSlugFa = generateSlugFa(titleFa);
            const newSlugEn = titleEn && titleEn.trim() ? generateSlugEn(titleEn) : "";
            
            // Get current slug value
            const currentSlug = getValues("slug") || { fa: "", en: "" };
            const currentSlugFa = currentSlug.fa || "";
            const currentSlugEn = currentSlug.en || "";
            
            // Auto-generate if slug is empty or if it matches the auto-generated version
            // This allows manual editing: if user manually changes slug, it won't be overwritten
            const shouldUpdateFa = !currentSlugFa || currentSlugFa === generateSlugFa(titleFa);
            const shouldUpdateEn = !currentSlugEn || (titleEn && titleEn.trim() && currentSlugEn === generateSlugEn(titleEn));
            
            if (shouldUpdateFa || shouldUpdateEn) {
                setValue("slug", {
                    fa: shouldUpdateFa ? newSlugFa : currentSlugFa,
                    en: shouldUpdateEn ? newSlugEn : currentSlugEn,
                }, { 
                    shouldValidate: false, 
                    shouldDirty: false,
                    shouldTouch: false 
                });
            }
        }
    }, [watchedTitleFa, watchedTitleEn, video, setValue, getValues]);

    // Fetch video metadata when videoMediaId changes
    const { data: videoMediaMetadata } = useFetchData(
        watchedVideoMediaId ? [`media-${watchedVideoMediaId}`] : ['media-null'],
        watchedVideoMediaId ? `/media/${watchedVideoMediaId}` : null,
        {
            enabled: !!watchedVideoMediaId // Only fetch when videoMediaId is available
        }
    );

    useEffect(() => {
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

    const onSubmit = async (data, event) => {
        // Prevent default form submission
        if (event) {
            event.preventDefault();
        }
        
        setLoading(true);

        try {
            // Clean up empty values
            const cleanedData = { ...data };

            // Remove videoMediaId (only used for fetching metadata)
            delete cleanedData.videoMediaId;
            
            // Auto-generate infoBox from video data (title and description)
            cleanedData.infoBox = {
                title: cleanedData.title || { fa: "", en: "" },
                content: cleanedData.description || { fa: "", en: "" }
            };
            
            // Ensure auto-calculated fields are included (they're already set by useEffect)
            // duration, fileSize, format, quality, metadata are already in cleanedData

            // Remove empty metadata fields
            if (cleanedData.metadata) {
                Object.keys(cleanedData.metadata).forEach(key => {
                    if (!cleanedData.metadata[key]) {
                        delete cleanedData.metadata[key];
                    }
                });
                if (Object.keys(cleanedData.metadata).length === 0) {
                    delete cleanedData.metadata;
                }
            }

            let result;
            if (video?._id) {
                result = await updateVideo.mutateAsync({
                    id: video._id,
                    data: cleanedData
                });
                toast.success("ویدئو با موفقیت به‌روزرسانی شد");
            } else {
                result = await createVideo.mutateAsync(cleanedData);
                toast.success("ویدئو با موفقیت ایجاد شد");
            }

            if (onSave) {
                onSave(result);
            }
        } catch (error) {
            // Handle validation errors from backend - set them in form state
            const hasValidationErrors = handleFormError(error);
            if (!hasValidationErrors) {
                // Show only non-validation errors
                const errorMessage = error.response?.data?.message || error.message || "خطا در ذخیره ویدئو";
                toast.error(errorMessage);
            } else {
                // Show general message for validation errors
                toast.error("لطفاً خطاهای اعتبارسنجی را برطرف کنید");
            }
        } finally {
            setLoading(false);
        }
    };

    const onError = (validationErrors) => {
        // Errors are already shown in UI via error props under inputs
        // Just scroll to the first error field for better UX
        const firstErrorKey = Object.keys(validationErrors)[0];
        if (firstErrorKey) {
            const fieldName = firstErrorKey.split('.')[0];
            const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || 
                                document.querySelector(`[name="${fieldName}"]`) ||
                                document.querySelector(`[id="${firstErrorKey}"]`) ||
                                document.querySelector(`[id="${fieldName}"]`);
            if (errorElement) {
                setTimeout(() => {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorElement.focus();
                }, 100);
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} sx={{ p: 3 }}>
            <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid size={12}>
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <VideoLibrary />
                                <Typography variant="h6">اطلاعات پایه</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="title"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => value?.fa?.trim() || "عنوان فارسی الزامی است",
                                                enRequired: (value) => value?.en?.trim() || "عنوان انگلیسی الزامی است",
                                            },
                                        }}
                                        render={({ field, fieldState }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="عنوان"
                                                error={fieldState.error}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="slug"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => {
                                                    if (!value || !value.fa || !value.fa.trim()) {
                                                        return "آدرس یکتای فارسی الزامی است";
                                                    }
                                                    return true;
                                                },
                                                enRequired: (value) => {
                                                    if (!value || !value.en || !value.en.trim()) {
                                                        return "آدرس یکتای انگلیسی الزامی است";
                                                    }
                                                    return true;
                                                },
                                            },
                                        }}
                                        render={({ field, fieldState }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="آدرس یکتا"
                                                error={fieldState.error}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Controller
                                        name="shortDescription"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="توضیحات کوتاه"
                                                multiline
                                                rows={3}
                                                error={fieldState.error}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <MultiLangEditor
                                                {...field}
                                                label="توضیحات کامل"
                                                error={fieldState.error}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                {/* Video Files */}
                <Grid size={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <VideoLibrary />
                                <Typography variant="h6">فایل‌های ویدئو</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid size={12}>
                                    <Controller
                                        name="videoMediaId"
                                        control={control}
                                        rules={{ required: "فایل ویدئو الزامی است" }}
                                        render={({ field }) => {
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
                                                    label="فایل ویدئو"
                                                    accept="video/*"
                                                    showPreview={true}
                                                    error={!!errors.videoMediaId}
                                                    helperText={errors.videoMediaId?.message || "ویدئو را از کتابخانه رسانه انتخاب کنید"}
                                                />
                                            );
                                        }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Controller
                                        name="thumbnailUrl"
                                        control={control}
                                        rules={{ required: "تصویر کاور الزامی است" }}
                                        render={({ field }) => (
                                            <MediaPicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                label="تصویر کاور"
                                                accept="image/*"
                                                showPreview={true}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                {/* Categories & Tags */}
                <Grid size={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Category />
                                <Typography variant="h6">دسته‌بندی و تگ‌ها</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid size={12}>
                                    <CategorySelector
                                        name="categories"
                                        control={control}
                                        type="video"
                                        multiple
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TagInput
                                        name="tags"
                                        control={control}
                                        label="تگ‌ها"
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                {/* Related Content - Auto-populated based on categories and tags */}
                <Grid size={12}>
                    <Alert severity="info">
                        محتواهای مرتبط (خدمات، نمونه کارها، مقالات و ویدئوهای مرتبط) به صورت خودکار بر اساس دسته‌بندی و تگ‌ها محاسبه می‌شوند.
                    </Alert>
                </Grid>


                {/* SEO */}
                <Grid size={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Visibility />
                                <Typography variant="h6">بهینه‌سازی موتور جستجو (SEO)</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid size={12}>
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
                                </Grid>
                                <Grid size={12}>
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
                                </Grid>
                                <Grid size={12}>
                                    <TagInput
                                        name="seo.metaKeywords"
                                        control={control}
                                        label="کلمات کلیدی متا"
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Controller
                                        name="seo.ogImage"
                                        control={control}
                                        render={({ field }) => (
                                            <MediaPicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                label="تصویر Open Graph"
                                                accept="image/*"
                                                showPreview={true}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                {/* Publishing */}
                <Grid size={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Publish />
                                <Typography variant="h6">انتشار</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="isPublished"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Switch {...field} checked={field.value} />}
                                                label="منتشر شده"
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="isFeatured"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Switch {...field} checked={field.value} />}
                                                label="ویژه"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                {/* Actions */}
                <Grid size={12}>
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

