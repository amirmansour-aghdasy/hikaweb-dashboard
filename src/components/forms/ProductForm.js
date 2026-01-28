"use client";
import {
    Box,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Typography,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    IconButton,
    Card,
    CardContent,
    Grid,
    FormHelperText,
} from "@mui/material";
import { Save, Cancel, ExpandMore, Add, Delete, ShoppingCart, AttachMoney, Inventory, Category, Image, Language, Star, TrendingUp } from "@mui/icons-material";
import { Controller, useFieldArray } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import GalleryManager from "../media/GalleryManager";
import { useApi } from "../../hooks/useApi";
import { useFormSetup } from "../../hooks/useFormSetup";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { productValidation, productUpdateValidation } from "../../lib/validations";
import { normalizeCategories, normalizeSEO, normalizeTags } from "../../lib/utils/formTransformers";
import { normalizeMultiLang, normalizeCategoriesForForm, normalizeSEOForForm, normalizeTagsForForm } from "../../lib/utils/formNormalizers";
import toast from "react-hot-toast";

export default function ProductForm({ product, onSave, onCancel }) {
    const { useFetchData } = useApi();
    
    // Fetch related content options
    const { data: productsData } = useFetchData(["products", "related"], "/products?status=active&isPublished=true&limit=100");
    const { data: articlesData } = useFetchData(["articles", "related"], "/articles?status=active&isPublished=true&limit=100");
    const { data: servicesData } = useFetchData(["services", "related"], "/services?status=active&isPublished=true&limit=100");
    const { data: videosData } = useFetchData(["videos", "related"], "/videos?status=active&isPublished=true&limit=100");
    
    const products = productsData?.data || [];
    const articles = articlesData?.data || [];
    const services = servicesData?.data || [];
    const videos = videosData?.data || [];

    const defaultValues = {
        name: { fa: "", en: "" },
        slug: { fa: "", en: "" },
        sku: "",
        type: "physical",
        digitalProduct: {
            contentType: "file",
            downloadUrl: "",
            downloadLimit: null,
            downloadExpiry: null,
            fileSize: null,
            fileType: "",
        },
        physicalProduct: {
            weight: null,
            dimensions: {
                length: null,
                width: null,
                height: null,
            },
            shippingClass: "standard",
            requiresShipping: true,
        },
        shortDescription: { fa: "", en: "" },
        description: { fa: "", en: "" },
        fullDescription: { fa: "", en: "" },
        featuredImage: "",
        gallery: [],
        videoUrl: "",
        pricing: {
            basePrice: 0,
            compareAtPrice: null,
            currency: "IRR",
            isOnSale: false,
            salePrice: null,
            saleStartDate: null,
            saleEndDate: null,
        },
        inventory: {
            trackInventory: true,
            quantity: 0,
            lowStockThreshold: 10,
            allowBackorder: false,
        },
        categories: [],
        tags: { fa: [], en: [] },
        specifications: [],
        suitableFor: { fa: [], en: [] },
        seo: {
            metaTitle: { fa: "", en: "" },
            metaDescription: { fa: "", en: "" },
            metaKeywords: { fa: [], en: [] },
        },
        loyaltyPoints: {
            earnOnPurchase: 0,
            requiredForDiscount: null,
        },
        isPublished: false,
        isFeatured: false,
        orderIndex: 0,
    };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors, isDirty },
    } = useFormSetup({
        validationSchema: product ? productUpdateValidation : productValidation,
        defaultValues,
        existingItem: product,
        normalizeItem: (item) => {
            // CRITICAL: Ensure all fields have defined values (not undefined) to prevent uncontrolled to controlled warnings
            const normalized = {
                name: normalizeMultiLang(item.name),
                slug: normalizeMultiLang(item.slug),
                sku: item.sku ?? "",
                type: item.type ?? "physical",
                digitalProduct: item.digitalProduct ? {
                    contentType: item.digitalProduct.contentType ?? defaultValues.digitalProduct.contentType,
                    downloadUrl: item.digitalProduct.downloadUrl ?? defaultValues.digitalProduct.downloadUrl,
                    downloadLimit: item.digitalProduct.downloadLimit ?? defaultValues.digitalProduct.downloadLimit,
                    downloadExpiry: item.digitalProduct.downloadExpiry ?? defaultValues.digitalProduct.downloadExpiry,
                    fileSize: item.digitalProduct.fileSize ?? defaultValues.digitalProduct.fileSize,
                    fileType: item.digitalProduct.fileType ?? defaultValues.digitalProduct.fileType,
                } : defaultValues.digitalProduct,
                physicalProduct: item.physicalProduct ? {
                    weight: item.physicalProduct.weight ?? defaultValues.physicalProduct.weight,
                    dimensions: item.physicalProduct.dimensions ? {
                        length: item.physicalProduct.dimensions.length ?? defaultValues.physicalProduct.dimensions.length,
                        width: item.physicalProduct.dimensions.width ?? defaultValues.physicalProduct.dimensions.width,
                        height: item.physicalProduct.dimensions.height ?? defaultValues.physicalProduct.dimensions.height,
                    } : defaultValues.physicalProduct.dimensions,
                    shippingClass: item.physicalProduct.shippingClass ?? defaultValues.physicalProduct.shippingClass,
                    requiresShipping: item.physicalProduct.requiresShipping ?? defaultValues.physicalProduct.requiresShipping,
                } : defaultValues.physicalProduct,
                shortDescription: normalizeMultiLang(item.shortDescription),
                description: normalizeMultiLang(item.description),
                fullDescription: normalizeMultiLang(item.fullDescription),
                featuredImage: item.featuredImage ?? "",
                gallery: Array.isArray(item.gallery) ? item.gallery : [],
                videoUrl: item.videoUrl ?? "",
                pricing: item.pricing ? {
                    basePrice: item.pricing.basePrice ?? defaultValues.pricing.basePrice,
                    compareAtPrice: item.pricing.compareAtPrice ?? defaultValues.pricing.compareAtPrice,
                    currency: item.pricing.currency ?? defaultValues.pricing.currency,
                    isOnSale: item.pricing.isOnSale ?? defaultValues.pricing.isOnSale,
                    salePrice: item.pricing.salePrice ?? defaultValues.pricing.salePrice,
                    saleStartDate: item.pricing.saleStartDate ?? defaultValues.pricing.saleStartDate,
                    saleEndDate: item.pricing.saleEndDate ?? defaultValues.pricing.saleEndDate,
                } : defaultValues.pricing,
                inventory: item.inventory ? {
                    trackInventory: item.inventory.trackInventory ?? defaultValues.inventory.trackInventory,
                    quantity: item.inventory.quantity ?? defaultValues.inventory.quantity,
                    lowStockThreshold: item.inventory.lowStockThreshold ?? defaultValues.inventory.lowStockThreshold,
                    allowBackorder: item.inventory.allowBackorder ?? defaultValues.inventory.allowBackorder,
                } : defaultValues.inventory,
                categories: normalizeCategoriesForForm(item.categories),
                tags: normalizeTagsForForm(item.tags),
                specifications: Array.isArray(item.specifications) ? item.specifications : [],
                suitableFor: item.suitableFor ? {
                    fa: Array.isArray(item.suitableFor.fa) ? item.suitableFor.fa : [],
                    en: Array.isArray(item.suitableFor.en) ? item.suitableFor.en : [],
                } : { fa: [], en: [] },
                relatedProducts: normalizeCategoriesForForm(item.relatedProducts),
                relatedArticles: normalizeCategoriesForForm(item.relatedArticles),
                relatedServices: normalizeCategoriesForForm(item.relatedServices),
                relatedVideos: normalizeCategoriesForForm(item.relatedVideos),
                vendor: item.vendor ? {
                    name: item.vendor.name ?? "",
                    contact: item.vendor.contact ?? "",
                } : { name: "", contact: "" },
                seo: normalizeSEOForForm(item.seo),
                loyaltyPoints: item.loyaltyPoints ? {
                    earnOnPurchase: item.loyaltyPoints.earnOnPurchase ?? defaultValues.loyaltyPoints.earnOnPurchase,
                    requiredForDiscount: item.loyaltyPoints.requiredForDiscount ?? defaultValues.loyaltyPoints.requiredForDiscount,
                } : defaultValues.loyaltyPoints,
                isPublished: item.isPublished ?? false,
                isFeatured: item.isFeatured ?? false,
                orderIndex: item.orderIndex ?? 0,
            };
            
            return normalized;
        },
    });

    // Watch product type to show/hide relevant fields
    const productType = watch("type");

    // Field Arrays
    const {
        fields: specificationsFields,
        append: appendSpecification,
        remove: removeSpecification,
    } = useFieldArray({
        control,
        name: "specifications",
    });

    // Transform data before submission
    // Helper function to check if a value is a Joi schema object
    const isJoiSchemaObject = (value) => {
        if (!value || typeof value !== 'object') return false;
        // Check for Joi schema object indicators (most reliable indicators)
        return (
            '$_root' in value ||
            '$_temp' in value ||
            '_ids' in value ||
            '_preferences' in value ||
            '_rules' in value ||
            '_flags' in value ||
            '$' in value ||
            (value.type && typeof value.type === 'string' && value.type === 'array' && ('$_root' in value || '_root' in value))
        );
    };

    const transformProductData = (data) => {
        // CRITICAL: Clean data from Joi schema objects before processing
        const cleanedData = { ...data };
        
        // Remove Joi schema objects from all fields
        Object.keys(cleanedData).forEach(key => {
            const value = cleanedData[key];
            if (isJoiSchemaObject(value)) {
                // CRITICAL: Delete Joi schema objects immediately
                delete cleanedData[key];
            } else if (Array.isArray(value)) {
                // Check if array contains Joi schema objects
                if (value.some(item => isJoiSchemaObject(item))) {
                    cleanedData[key] = value.filter(item => !isJoiSchemaObject(item));
                }
            } else if (typeof value === 'object' && value !== null) {
                // Recursively check nested objects
                Object.keys(value).forEach(nestedKey => {
                    if (isJoiSchemaObject(value[nestedKey])) {
                        delete value[nestedKey];
                    }
                });
            }
        });
        
        // CRITICAL: Double-check categories - if it's still a Joi schema object, remove it completely
        if (cleanedData.categories && isJoiSchemaObject(cleanedData.categories)) {
            delete cleanedData.categories;
        }
        
        // Validate and sanitize base price
        const basePrice = parseFloat(cleanedData.pricing?.basePrice || 0);
        if (isNaN(basePrice) || basePrice < 0) {
            throw new Error("قیمت پایه باید عدد مثبت باشد");
        }

        const productData = {
            name: cleanedData.name || { fa: "", en: "" },
            description: cleanedData.description || { fa: "", en: "" },
            featuredImage: cleanedData.featuredImage || "",
            pricing: {
                basePrice: basePrice,
                currency: cleanedData.pricing?.currency || "IRR",
                isOnSale: cleanedData.pricing?.isOnSale || false,
            },
            type: cleanedData.type || "physical",
            isPublished: cleanedData.isPublished || false,
            isFeatured: cleanedData.isFeatured || false,
            orderIndex: parseInt(cleanedData.orderIndex || 0) || 0,
        };

        // Add optional fields if they have values
        if (cleanedData.slug && (cleanedData.slug.fa || cleanedData.slug.en)) {
            productData.slug = cleanedData.slug;
        }

        if (cleanedData.sku && cleanedData.sku.trim()) {
            productData.sku = cleanedData.sku.trim().toUpperCase();
        }

        if (cleanedData.shortDescription && (cleanedData.shortDescription.fa || cleanedData.shortDescription.en)) {
            productData.shortDescription = cleanedData.shortDescription;
        }

        if (cleanedData.fullDescription && (cleanedData.fullDescription.fa || cleanedData.fullDescription.en)) {
            productData.fullDescription = cleanedData.fullDescription;
        }

        if (cleanedData.videoUrl && cleanedData.videoUrl.trim()) {
            productData.videoUrl = cleanedData.videoUrl.trim();
        }

        // Type-specific fields
        if (cleanedData.type === "digital" && cleanedData.digitalProduct && !isJoiSchemaObject(cleanedData.digitalProduct)) {
            // Validate download limit if provided
            let downloadLimit = null;
            if (cleanedData.digitalProduct.downloadLimit !== null && cleanedData.digitalProduct.downloadLimit !== undefined && cleanedData.digitalProduct.downloadLimit !== "") {
                downloadLimit = parseInt(cleanedData.digitalProduct.downloadLimit);
                if (isNaN(downloadLimit) || downloadLimit < 0) {
                    throw new Error("محدودیت دانلود باید عدد مثبت باشد");
                }
            }
            
            // Validate download expiry if provided
            let downloadExpiry = null;
            if (cleanedData.digitalProduct.downloadExpiry !== null && cleanedData.digitalProduct.downloadExpiry !== undefined && cleanedData.digitalProduct.downloadExpiry !== "") {
                downloadExpiry = parseInt(cleanedData.digitalProduct.downloadExpiry);
                if (isNaN(downloadExpiry) || downloadExpiry < 0) {
                    throw new Error("انقضای دانلود باید عدد مثبت باشد");
                }
            }
            
            // Validate file size if provided
            let fileSize = null;
            if (cleanedData.digitalProduct.fileSize !== null && cleanedData.digitalProduct.fileSize !== undefined && cleanedData.digitalProduct.fileSize !== "") {
                fileSize = parseFloat(cleanedData.digitalProduct.fileSize);
                if (isNaN(fileSize) || fileSize < 0) {
                    throw new Error("حجم فایل باید عدد مثبت باشد");
                }
            }
            
            productData.digitalProduct = {
                contentType: cleanedData.digitalProduct.contentType || "file",
                downloadUrl: (cleanedData.digitalProduct.downloadUrl || "").trim(),
                downloadLimit: downloadLimit,
                downloadExpiry: downloadExpiry,
                fileSize: fileSize,
                fileType: (cleanedData.digitalProduct.fileType || "").trim(),
            };
        }

        if (cleanedData.type === "physical" && cleanedData.physicalProduct && !isJoiSchemaObject(cleanedData.physicalProduct)) {
            productData.physicalProduct = {
                weight: cleanedData.physicalProduct.weight || null,
                dimensions: cleanedData.physicalProduct.dimensions || {
                    length: null,
                    width: null,
                    height: null,
                },
                shippingClass: cleanedData.physicalProduct.shippingClass || "standard",
                requiresShipping: cleanedData.physicalProduct.requiresShipping !== false,
            };
        }

        // Pricing details
        if (cleanedData.pricing && !isJoiSchemaObject(cleanedData.pricing)) {
            if (cleanedData.pricing.compareAtPrice) {
                const comparePrice = parseFloat(cleanedData.pricing.compareAtPrice);
                if (!isNaN(comparePrice) && comparePrice >= 0) {
                    productData.pricing.compareAtPrice = comparePrice;
                }
            }
            if (cleanedData.pricing.isOnSale) {
                const salePrice = parseFloat(cleanedData.pricing.salePrice || 0);
                if (isNaN(salePrice) || salePrice < 0) {
                    throw new Error("قیمت تخفیف باید عدد مثبت باشد");
                }
                if (salePrice >= basePrice) {
                    throw new Error("قیمت تخفیف باید کمتر از قیمت پایه باشد");
                }
                productData.pricing.salePrice = salePrice;
                if (cleanedData.pricing.saleStartDate) {
                    const startDate = new Date(cleanedData.pricing.saleStartDate);
                    if (isNaN(startDate.getTime())) {
                        throw new Error("تاریخ شروع تخفیف نامعتبر است");
                    }
                    productData.pricing.saleStartDate = startDate;
                }
                if (cleanedData.pricing.saleEndDate) {
                    const endDate = new Date(cleanedData.pricing.saleEndDate);
                    if (isNaN(endDate.getTime())) {
                        throw new Error("تاریخ پایان تخفیف نامعتبر است");
                    }
                    if (cleanedData.pricing.saleStartDate && endDate < new Date(cleanedData.pricing.saleStartDate)) {
                        throw new Error("تاریخ پایان تخفیف باید بعد از تاریخ شروع باشد");
                    }
                    productData.pricing.saleEndDate = endDate;
                }
            }
        }

        // Inventory (only for physical products)
        if (cleanedData.type === "physical" && cleanedData.inventory && !isJoiSchemaObject(cleanedData.inventory)) {
            const quantity = parseInt(cleanedData.inventory.quantity || 0);
            const threshold = parseInt(cleanedData.inventory.lowStockThreshold || 10);
            
            if (isNaN(quantity) || quantity < 0) {
                throw new Error("تعداد موجودی باید عدد مثبت باشد");
            }
            if (isNaN(threshold) || threshold < 0) {
                throw new Error("آستانه کمبود باید عدد مثبت باشد");
            }
            
            productData.inventory = {
                trackInventory: cleanedData.inventory.trackInventory !== false,
                quantity: quantity,
                lowStockThreshold: threshold,
                allowBackorder: cleanedData.inventory.allowBackorder || false,
            };
        }

        // Categories - CRITICAL: Only process if not a Joi schema object
        // Double-check to ensure it's not a Joi schema object (defensive programming)
        if (cleanedData.categories) {
            // Final check: if it's still a Joi schema object after cleaning, skip it
            if (isJoiSchemaObject(cleanedData.categories)) {
                // Don't include categories if it's a Joi schema object
                // This should not happen if cleaning worked, but be defensive
            } else if (Array.isArray(cleanedData.categories) || typeof cleanedData.categories === 'object') {
                const normalizedCategories = normalizeCategories(cleanedData.categories);
                if (normalizedCategories && Array.isArray(normalizedCategories) && normalizedCategories.length > 0) {
                    productData.categories = normalizedCategories;
                }
            }
        }

        // Tags - CRITICAL: Only process if not a Joi schema object
        if (cleanedData.tags && !isJoiSchemaObject(cleanedData.tags)) {
            const tags = normalizeTags(cleanedData.tags);
            if (tags && (tags.fa?.length > 0 || tags.en?.length > 0)) {
                productData.tags = tags;
            }
        }

        // Gallery
        if (cleanedData.gallery && Array.isArray(cleanedData.gallery) && cleanedData.gallery.length > 0) {
            // Filter out Joi schema objects from gallery
            productData.gallery = cleanedData.gallery.filter(item => !isJoiSchemaObject(item));
        }

        // Specifications
        if (cleanedData.specifications && Array.isArray(cleanedData.specifications) && cleanedData.specifications.length > 0) {
            productData.specifications = cleanedData.specifications
                .filter(spec => !isJoiSchemaObject(spec))
                .filter(
                    (spec) => spec.name && (spec.name.fa || spec.name.en) && spec.value && (spec.value.fa || spec.value.en)
                );
        }

        // Suitable For
        if (cleanedData.suitableFor && !isJoiSchemaObject(cleanedData.suitableFor) && (cleanedData.suitableFor.fa?.length > 0 || cleanedData.suitableFor.en?.length > 0)) {
            productData.suitableFor = cleanedData.suitableFor;
        }

        // SEO - CRITICAL: Only process if not a Joi schema object
        if (cleanedData.seo && !isJoiSchemaObject(cleanedData.seo)) {
            const seo = normalizeSEO({
                metaTitle: cleanedData.seo?.metaTitle,
                metaDescription: cleanedData.seo?.metaDescription,
                metaKeywords: cleanedData.seo?.metaKeywords,
            });
            if (Object.keys(seo).length > 0) {
                productData.seo = seo;
            }
        }

        // Loyalty Points - CRITICAL: Only process if not a Joi schema object
        if (cleanedData.loyaltyPoints && !isJoiSchemaObject(cleanedData.loyaltyPoints)) {
            const earnPoints = parseInt(cleanedData.loyaltyPoints.earnOnPurchase || 0);
            const requiredPoints = cleanedData.loyaltyPoints.requiredForDiscount
                ? parseInt(cleanedData.loyaltyPoints.requiredForDiscount)
                : null;
            
            if (isNaN(earnPoints) || earnPoints < 0) {
                throw new Error("امتیاز کسب شده باید عدد مثبت باشد");
            }
            if (requiredPoints !== null && (isNaN(requiredPoints) || requiredPoints < 0)) {
                throw new Error("امتیاز مورد نیاز باید عدد مثبت باشد");
            }
            
            productData.loyaltyPoints = {
                earnOnPurchase: earnPoints,
                requiredForDiscount: requiredPoints,
            };
        }

        // CRITICAL: Final cleanup - remove any Joi schema objects that might have slipped through
        // This is a defensive check to ensure no Joi schema objects are sent to the backend
        Object.keys(productData).forEach(key => {
            const value = productData[key];
            if (isJoiSchemaObject(value)) {
                delete productData[key];
            } else if (Array.isArray(value)) {
                // Check if array contains Joi schema objects
                if (value.some(item => isJoiSchemaObject(item))) {
                    productData[key] = value.filter(item => !isJoiSchemaObject(item));
                }
            } else if (typeof value === 'object' && value !== null) {
                // Recursively check nested objects
                Object.keys(value).forEach(nestedKey => {
                    if (isJoiSchemaObject(value[nestedKey])) {
                        delete value[nestedKey];
                    }
                });
            }
        });
        
        return productData;
    };

    const { submit, loading } = useFormSubmission({
        endpoint: "/products",
        queryKey: "products",
        existingItem: product,
        createMessage: "محصول با موفقیت ایجاد شد",
        updateMessage: "محصول با موفقیت ویرایش شد",
        onSuccess: onSave,
        transformData: transformProductData,
        setValue,
        getValues,
    });

    const onSubmit = async (data) => {
        try {
            const result = await submit(data);
            // If submit returns false, it means there was an error
            // The error is already handled by useFormSubmission hook
            if (result === false) {
                // Error already displayed by useFormSubmission
                return;
            }
        } catch (error) {
            // Handle validation errors from transformProductData
            if (error?.message) {
                toast.error(error.message);
            } else if (error?.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                // Error is handled by useFormSubmission hook
                toast.error("خطا در ذخیره محصول");
            }
        }
    };

    const onError = (errors) => {
        // Debug: Log all errors to console
        console.log("Validation errors:", errors);
        console.log("Errors object keys:", Object.keys(errors));
        
        // Handle validation errors
        if (Object.keys(errors).length > 0) {
            // Find the first error with a message
            let firstErrorKey = null;
            let firstErrorMessage = null;
            
            // Helper function to extract error message from nested structure
            const extractErrorMessage = (error, path = '') => {
                if (!error) return null;
                
                // If it's a string, return it
                if (typeof error === 'string') {
                    return error;
                }
                
                // If it has a message property
                if (error.message && typeof error.message === 'string') {
                    return error.message;
                }
                
                // If it has a type property (validation rule error)
                if (error.type) {
                    const fieldLabels = {
                        'name': 'نام محصول',
                        'description': 'توضیحات',
                        'pricing': 'قیمت',
                        'pricing.basePrice': 'قیمت پایه',
                        'featuredImage': 'تصویر شاخص',
                        'type': 'نوع محصول',
                        'inventory': 'موجودی',
                        'categories': 'دسته‌بندی',
                    };
                    const fieldLabel = fieldLabels[path] || path;
                    const typeMessages = {
                        faRequired: `${fieldLabel} (فارسی) الزامی است`,
                        enRequired: `${fieldLabel} (انگلیسی) الزامی است`,
                        required: `${fieldLabel} الزامی است`,
                    };
                    return typeMessages[error.type] || error.message || `${fieldLabel} الزامی است`;
                }
                
                // Check nested structure (for multi-lang fields)
                if (error.fa) {
                    const faMsg = extractErrorMessage(error.fa, `${path}.fa`);
                    if (faMsg) return faMsg;
                }
                if (error.en) {
                    const enMsg = extractErrorMessage(error.en, `${path}.en`);
                    if (enMsg) return enMsg;
                }
                
                // Check for nested object errors (like pricing.basePrice)
                if (typeof error === 'object') {
                    for (const key in error) {
                        if (error.hasOwnProperty(key) && key !== 'fa' && key !== 'en') {
                            const nestedMsg = extractErrorMessage(error[key], path ? `${path}.${key}` : key);
                            if (nestedMsg) return nestedMsg;
                        }
                    }
                }
                
                return null;
            };
            
            // Iterate through all errors to find the first one with a message
            for (const key in errors) {
                if (errors.hasOwnProperty(key)) {
                    const errorMsg = extractErrorMessage(errors[key], key);
                    if (errorMsg) {
                        firstErrorKey = key;
                        firstErrorMessage = errorMsg;
                        break;
                    }
                }
            }
            
            // If we found an error message, use it; otherwise use generic message
            const errorMessage = firstErrorMessage || "لطفاً خطاهای اعتبارسنجی را برطرف کنید";
            
            toast.error(errorMessage);
            
            // Scroll to first error field
            if (firstErrorKey) {
                // Try to find the field element
                // For nested fields like "name.fa", try both "name" and the full path
                const fieldSelectors = [
                    `[name="${firstErrorKey}"]`,
                    `[name="${firstErrorKey.split('.')[0]}"]`,
                ];
                
                let errorElement = null;
                for (const selector of fieldSelectors) {
                    errorElement = document.querySelector(selector);
                    if (errorElement) break;
                }
                
                if (errorElement) {
                    setTimeout(() => {
                        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
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
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ShoppingCart /> اطلاعات پایه
                            </Typography>
                            <Stack spacing={2}>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Box>
                                            <MultiLangTextField
                                                {...field}
                                                value={field.value || { fa: "", en: "" }}
                                                label="نام محصول"
                                                error={errors.name}
                                                required
                                                helperText={{
                                                    fa: errors.name ? "" : "نام محصول به فارسی (حداقل ۳ کاراکتر، حداکثر ۲۰۰ کاراکتر)",
                                                    en: errors.name ? "" : "Product name in English (minimum 3 characters, maximum 200 characters)",
                                                }}
                                                placeholder={{
                                                    fa: "نام محصول به فارسی...",
                                                    en: "Product name in English...",
                                                }}
                                            />
                                            {errors.name && (
                                                <FormHelperText error sx={{ mt: 0.5, ml: 1.75 }}>
                                                    {errors.name.message || "نام محصول الزامی است"}
                                                </FormHelperText>
                                            )}
                                        </Box>
                                    )}
                                />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="sku"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    label="SKU"
                                                    fullWidth
                                                    error={!!errors.sku}
                                                    helperText={errors.sku?.message}
                                                    placeholder="PROD-001"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth error={!!errors.type} required>
                                                    <InputLabel>نوع محصول</InputLabel>
                                                    <Select {...field} label="نوع محصول">
                                                        <MenuItem value="physical">فیزیکی</MenuItem>
                                                        <MenuItem value="digital">دیجیتال</MenuItem>
                                                    </Select>
                                                    {errors.type ? (
                                                        <FormHelperText error>
                                                            {errors.type.message || "نوع محصول الزامی است"}
                                                        </FormHelperText>
                                                    ) : (
                                                        <FormHelperText>نوع محصول را انتخاب کنید (فیزیکی یا دیجیتال)</FormHelperText>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Box>

                        {/* Digital Product Fields */}
                        {productType === "digital" && (
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">تنظیمات محصول دیجیتال</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Stack spacing={2}>
                                        <Controller
                                            name="digitalProduct.contentType"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth>
                                                    <InputLabel>نوع محتوا</InputLabel>
                                                    <Select {...field} label="نوع محتوا">
                                                        <MenuItem value="article">مقاله</MenuItem>
                                                        <MenuItem value="file">فایل</MenuItem>
                                                        <MenuItem value="course">دوره</MenuItem>
                                                        <MenuItem value="ebook">کتاب الکترونیکی</MenuItem>
                                                        <MenuItem value="software">نرم‌افزار</MenuItem>
                                                        <MenuItem value="other">سایر</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />

                                        <Controller
                                            name="digitalProduct.downloadUrl"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    label="لینک دانلود"
                                                    fullWidth
                                                    placeholder="https://..."
                                                />
                                            )}
                                        />

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="digitalProduct.downloadLimit"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="محدودیت دانلود"
                                                            type="number"
                                                            fullWidth
                                                            helperText="خالی = نامحدود"
                                                            value={field.value || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? null : parseInt(val));
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="digitalProduct.downloadExpiry"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="انقضای دانلود (روز)"
                                                            type="number"
                                                            fullWidth
                                                            helperText="خالی = بدون انقضا"
                                                            value={field.value || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? null : parseInt(val));
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {/* Physical Product Fields */}
                        {productType === "physical" && (
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">تنظیمات محصول فیزیکی</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Stack spacing={2}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="physicalProduct.weight"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="وزن (گرم)"
                                                            type="number"
                                                            fullWidth
                                                            value={field.value || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? null : parseFloat(val));
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="physicalProduct.shippingClass"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <FormControl fullWidth>
                                                            <InputLabel>کلاس ارسال</InputLabel>
                                                            <Select {...field} label="کلاس ارسال">
                                                                <MenuItem value="standard">استاندارد</MenuItem>
                                                                <MenuItem value="express">پس‌تاز</MenuItem>
                                                                <MenuItem value="fragile">شکننده</MenuItem>
                                                                <MenuItem value="heavy">سنگین</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    )}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Typography variant="subtitle2">ابعاد (سانتی‌متر)</Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 4 }}>
                                                <Controller
                                                    name="physicalProduct.dimensions.length"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="طول"
                                                            type="number"
                                                            fullWidth
                                                            value={field.value || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? null : parseFloat(val));
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Controller
                                                    name="physicalProduct.dimensions.width"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="عرض"
                                                            type="number"
                                                            fullWidth
                                                            value={field.value || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? null : parseFloat(val));
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Controller
                                                    name="physicalProduct.dimensions.height"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="ارتفاع"
                                                            type="number"
                                                            fullWidth
                                                            value={field.value || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? null : parseFloat(val));
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Controller
                                            name="physicalProduct.requiresShipping"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch {...field} checked={field.value} />}
                                                    label="نیاز به ارسال دارد"
                                                />
                                            )}
                                        />
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {/* Descriptions */}
                        <Box>
                            <Typography variant="h6" gutterBottom>توضیحات</Typography>
                            <Stack spacing={2}>
                                <Controller
                                    name="shortDescription"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiLangTextField
                                            {...field}
                                            value={field.value || { fa: "", en: "" }}
                                            label="توضیحات کوتاه"
                                            multiline
                                            rows={3}
                                            maxLength={500}
                                            placeholder={{
                                                fa: "توضیحات کوتاه محصول...",
                                                en: "Short product description...",
                                            }}
                                        />
                                    )}
                                />

                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <Box>
                                            <MultiLangEditor
                                                value={field.value || { fa: "", en: "" }}
                                                onChange={field.onChange}
                                                label="توضیحات کامل"
                                                error={errors.description}
                                                helperText={errors.description ? "" : "توضیحات کامل محصول را به فارسی و انگلیسی وارد کنید (حداقل ۲۰ کاراکتر برای هر زبان - الزامی)"}
                                                required
                                                height={300}
                                            />
                                            {errors.description && (
                                                <FormHelperText error sx={{ mt: 0.5, ml: 1.75 }}>
                                                    {errors.description.message || "توضیحات کامل الزامی است"}
                                                </FormHelperText>
                                            )}
                                        </Box>
                                    )}
                                />

                                <Controller
                                    name="fullDescription"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiLangEditor
                                            value={field.value || { fa: "", en: "" }}
                                            onChange={field.onChange}
                                            label="توضیحات تکمیلی"
                                            height={250}
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Media */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> رسانه
                            </Typography>
                            <Stack spacing={2}>
                                <Controller
                                    name="featuredImage"
                                    control={control}
                                    render={({ field }) => (
                                        <Box>
                                            <MediaPicker
                                                value={field.value || null}
                                                onChange={(selected) => {
                                                    const imageUrl =
                                                        typeof selected === "object" && selected !== null
                                                            ? selected.url || selected._id || selected
                                                            : selected;
                                                    field.onChange(imageUrl || "");
                                                }}
                                                label="تصویر شاخص"
                                                accept="image/*"
                                                multiple={false}
                                                showPreview={true}
                                                showEdit={true}
                                                error={errors.featuredImage}
                                            />
                                            {errors.featuredImage ? (
                                                <FormHelperText error sx={{ mt: 0.5, ml: 1.75 }}>
                                                    {errors.featuredImage.message || "تصویر شاخص الزامی است"}
                                                </FormHelperText>
                                            ) : (
                                                <FormHelperText sx={{ mt: 0.5, ml: 1.75 }}>
                                                    تصویر شاخص محصول را انتخاب کنید (الزامی)
                                                </FormHelperText>
                                            )}
                                        </Box>
                                    )}
                                />

                                <Controller
                                    name="gallery"
                                    control={control}
                                    render={({ field }) => (
                                        <GalleryManager
                                            value={field.value || []}
                                            onChange={field.onChange}
                                            label="گالری تصاویر"
                                            showAltText={true}
                                            showCaptions={true}
                                        />
                                    )}
                                />

                                <Controller
                                    name="videoUrl"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            value={field.value ?? ""}
                                            label="لینک ویدئو"
                                            fullWidth
                                            placeholder="https://youtube.com/..."
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Pricing */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <AttachMoney /> قیمت‌گذاری
                            </Typography>
                            <Stack spacing={2}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="pricing.basePrice"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="قیمت پایه"
                                                    type="number"
                                                    fullWidth
                                                    required
                                                    error={!!errors.pricing?.basePrice}
                                                    helperText={errors.pricing?.basePrice?.message || "قیمت پایه محصول را وارد کنید (الزامی، باید عدد مثبت باشد)"}
                                                    value={field.value || ""}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="pricing.currency"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth>
                                                    <InputLabel>واحد پول</InputLabel>
                                                    <Select {...field} label="واحد پول">
                                                        <MenuItem value="IRR">ریال</MenuItem>
                                                        <MenuItem value="USD">دلار</MenuItem>
                                                        <MenuItem value="EUR">یورو</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Controller
                                    name="pricing.isOnSale"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch {...field} checked={field.value} />}
                                            label="در حال تخفیف"
                                        />
                                    )}
                                />

                                {watch("pricing.isOnSale") && (
                                    <>
                                        <Controller
                                            name="pricing.salePrice"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="قیمت تخفیف"
                                                    type="number"
                                                    fullWidth
                                                    value={field.value || ""}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                                                />
                                            )}
                                        />

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="pricing.saleStartDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="شروع تخفیف"
                                                            type="datetime-local"
                                                            fullWidth
                                                            InputLabelProps={{ shrink: true }}
                                                            value={
                                                                field.value
                                                                    ? new Date(field.value).toISOString().slice(0, 16)
                                                                    : ""
                                                            }
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val ? new Date(val) : null);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Controller
                                                    name="pricing.saleEndDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            {...field}
                                                            label="پایان تخفیف"
                                                            type="datetime-local"
                                                            fullWidth
                                                            InputLabelProps={{ shrink: true }}
                                                            value={
                                                                field.value
                                                                    ? new Date(field.value).toISOString().slice(0, 16)
                                                                    : ""
                                                            }
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val ? new Date(val) : null);
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}
                            </Stack>
                        </Box>

                        {/* Inventory (Physical Products Only) */}
                        {productType === "physical" && (
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Inventory /> موجودی
                                </Typography>
                                <Stack spacing={2}>
                                    <Controller
                                        name="inventory.trackInventory"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Switch {...field} checked={field.value} />}
                                                label="ردیابی موجودی"
                                            />
                                        )}
                                    />

                                    {watch("inventory.trackInventory") && (
                                        <>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Controller
                                                        name="inventory.quantity"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TextField
                                                                {...field}
                                                                label="تعداد موجود"
                                                                type="number"
                                                                fullWidth
                                                                value={field.value || ""}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Controller
                                                        name="inventory.lowStockThreshold"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TextField
                                                                {...field}
                                                                label="آستانه کمبود"
                                                                type="number"
                                                                fullWidth
                                                                value={field.value || ""}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                            </Grid>

                                            <Controller
                                                name="inventory.allowBackorder"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={<Switch {...field} checked={field.value} />}
                                                        label="اجازه پیش‌سفارش"
                                                    />
                                                )}
                                            />
                                        </>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {/* Specifications */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">مشخصات فنی</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    {specificationsFields.map((field, index) => (
                                        <Card key={field.id} variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                                    <Typography variant="subtitle2">مشخصه {index + 1}</Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => removeSpecification(index)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                                <Stack spacing={2}>
                                                    <Controller
                                                        name={`specifications.${index}.name`}
                                                        control={control}
                                                        render={({ field: specField }) => (
                                                            <MultiLangTextField
                                                                {...specField}
                                                                label="نام مشخصه"
                                                                placeholder={{
                                                                    fa: "نام مشخصه...",
                                                                    en: "Specification name...",
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                    <Controller
                                                        name={`specifications.${index}.value`}
                                                        control={control}
                                                        render={({ field: specField }) => (
                                                            <MultiLangTextField
                                                                {...specField}
                                                                label="مقدار"
                                                                placeholder={{
                                                                    fa: "مقدار...",
                                                                    en: "Value...",
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                    <Controller
                                                        name={`specifications.${index}.group`}
                                                        control={control}
                                                        render={({ field: specField }) => (
                                                            <MultiLangTextField
                                                                {...specField}
                                                                label="گروه (اختیاری)"
                                                                placeholder={{
                                                                    fa: "گروه...",
                                                                    en: "Group...",
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <Button
                                        startIcon={<Add />}
                                        onClick={() =>
                                            appendSpecification({
                                                name: { fa: "", en: "" },
                                                value: { fa: "", en: "" },
                                                group: { fa: "", en: "" },
                                            })
                                        }
                                        variant="outlined"
                                    >
                                        افزودن مشخصه
                                    </Button>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* Suitable For */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">مناسب برای</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="suitableFor.fa"
                                        control={control}
                                        render={({ field }) => (
                                            <TagInput
                                                {...field}
                                                label="مناسب برای (فارسی)"
                                                placeholder="مورد جدید اضافه کنید..."
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="suitableFor.en"
                                        control={control}
                                        render={({ field }) => (
                                            <TagInput
                                                {...field}
                                                label="Suitable For (English)"
                                                placeholder="Add new item..."
                                            />
                                        )}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        {/* Publication Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Star /> تنظیمات انتشار
                            </Typography>
                            <Stack spacing={2}>
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
                                <Controller
                                    name="isFeatured"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch {...field} checked={field.value} />}
                                            label="محصول ویژه"
                                        />
                                    )}
                                />
                                <Controller
                                    name="orderIndex"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="ترتیب نمایش"
                                            type="number"
                                            fullWidth
                                            value={field.value || 0}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Categories & Tags */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Category /> دسته‌بندی و برچسب‌ها
                            </Typography>
                            <Stack spacing={2}>
                                <Controller
                                    name="categories"
                                    control={control}
                                    render={({ field }) => (
                                        <CategorySelector
                                            {...field}
                                            label="دسته‌بندی‌ها"
                                            type="product"
                                            multiple
                                            error={errors.categories}
                                        />
                                    )}
                                />
                                <Controller
                                    name="tags.fa"
                                    control={control}
                                    render={({ field }) => (
                                        <TagInput
                                            {...field}
                                            label="برچسب‌ها (فارسی)"
                                            placeholder="برچسب جدید اضافه کنید..."
                                        />
                                    )}
                                />
                                <Controller
                                    name="tags.en"
                                    control={control}
                                    render={({ field }) => (
                                        <TagInput
                                            {...field}
                                            label="Tags (English)"
                                            placeholder="Add new tag..."
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Loyalty Points */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <TrendingUp /> امتیاز وفاداری (Hika Club)
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="loyaltyPoints.earnOnPurchase"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="امتیاز کسب شده با خرید"
                                                type="number"
                                                fullWidth
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="loyaltyPoints.requiredForDiscount"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="امتیاز مورد نیاز برای تخفیف"
                                                type="number"
                                                fullWidth
                                                helperText="خالی = بدون نیاز به امتیاز"
                                                value={field.value || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val === "" ? null : parseInt(val));
                                                }}
                                            />
                                        )}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* SEO */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Language /> تنظیمات SEO
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="seo.metaTitle"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="عنوان متا"
                                                placeholder={{
                                                    fa: "عنوان SEO فارسی...",
                                                    en: "SEO title in English...",
                                                }}
                                                maxLength={60}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="seo.metaDescription"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="توضیحات متا"
                                                multiline
                                                rows={3}
                                                maxLength={160}
                                                placeholder={{
                                                    fa: "توضیحات SEO فارسی...",
                                                    en: "SEO description in English...",
                                                }}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="seo.metaKeywords.fa"
                                        control={control}
                                        render={({ field }) => (
                                            <TagInput
                                                {...field}
                                                label="کلمات کلیدی فارسی"
                                                placeholder="کلمه کلیدی اضافه کنید..."
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="seo.metaKeywords.en"
                                        control={control}
                                        render={({ field }) => (
                                            <TagInput
                                                {...field}
                                                label="English Keywords"
                                                placeholder="Add keyword..."
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
                                                    const imageUrl =
                                                        typeof selected === "object" && selected !== null
                                                            ? selected.url || selected._id || selected
                                                            : selected;
                                                    field.onChange(imageUrl || "");
                                                }}
                                                label="تصویر Open Graph"
                                                accept="image/*"
                                                multiple={false}
                                                showPreview={true}
                                            />
                                        )}
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* Related Content */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Category />
                                    <Typography variant="h6">محتواهای مرتبط</Typography>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={3}>
                                    <Alert severity="info">
                                        محتواهای مرتبط به صورت خودکار بر اساس دسته‌بندی و تگ‌ها محاسبه می‌شوند. در صورت نیاز می‌توانید به صورت دستی نیز انتخاب کنید.
                                    </Alert>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Controller
                                                name="relatedProducts"
                                                control={control}
                                                render={({ field }) => (
                                                    <CategorySelector
                                                        {...field}
                                                        label="محصولات مرتبط"
                                                        multiple
                                                        options={products}
                                                        getOptionLabel={(option) => {
                                                            if (typeof option === 'string') return option;
                                                            return option?.name?.fa || option?.name?.en || option?.name || option?.title || "";
                                                        }}
                                                        isOptionEqualToValue={(option, value) => {
                                                            const optionId = typeof option === 'object' && option !== null ? (option._id || option.id) : option;
                                                            const valueId = typeof value === 'object' && value !== null ? (value._id || value.id) : value;
                                                            return optionId === valueId;
                                                        }}
                                                        onChange={(_, newValue) => {
                                                            const ids = Array.isArray(newValue) 
                                                                ? newValue.map(item => typeof item === 'object' && item !== null ? (item._id || item.id) : item)
                                                                : [];
                                                            field.onChange(ids);
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Controller
                                                name="relatedArticles"
                                                control={control}
                                                render={({ field }) => (
                                                    <CategorySelector
                                                        {...field}
                                                        label="مقالات مرتبط"
                                                        multiple
                                                        options={articles}
                                                        getOptionLabel={(option) => {
                                                            if (typeof option === 'string') return option;
                                                            return option?.title?.fa || option?.title?.en || option?.title || "";
                                                        }}
                                                        isOptionEqualToValue={(option, value) => {
                                                            const optionId = typeof option === 'object' && option !== null ? (option._id || option.id) : option;
                                                            const valueId = typeof value === 'object' && value !== null ? (value._id || value.id) : value;
                                                            return optionId === valueId;
                                                        }}
                                                        onChange={(_, newValue) => {
                                                            const ids = Array.isArray(newValue) 
                                                                ? newValue.map(item => typeof item === 'object' && item !== null ? (item._id || item.id) : item)
                                                                : [];
                                                            field.onChange(ids);
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Controller
                                                name="relatedServices"
                                                control={control}
                                                render={({ field }) => (
                                                    <CategorySelector
                                                        {...field}
                                                        label="خدمات مرتبط"
                                                        multiple
                                                        options={services}
                                                        getOptionLabel={(option) => {
                                                            if (typeof option === 'string') return option;
                                                            return option?.title?.fa || option?.title?.en || option?.title || "";
                                                        }}
                                                        isOptionEqualToValue={(option, value) => {
                                                            const optionId = typeof option === 'object' && option !== null ? (option._id || option.id) : option;
                                                            const valueId = typeof value === 'object' && value !== null ? (value._id || value.id) : value;
                                                            return optionId === valueId;
                                                        }}
                                                        onChange={(_, newValue) => {
                                                            const ids = Array.isArray(newValue) 
                                                                ? newValue.map(item => typeof item === 'object' && item !== null ? (item._id || item.id) : item)
                                                                : [];
                                                            field.onChange(ids);
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Controller
                                                name="relatedVideos"
                                                control={control}
                                                render={({ field }) => (
                                                    <CategorySelector
                                                        {...field}
                                                        label="ویدئوهای مرتبط"
                                                        multiple
                                                        options={videos}
                                                        getOptionLabel={(option) => {
                                                            if (typeof option === 'string') return option;
                                                            return option?.title?.fa || option?.title?.en || option?.title || "";
                                                        }}
                                                        isOptionEqualToValue={(option, value) => {
                                                            const optionId = typeof option === 'object' && option !== null ? (option._id || option.id) : option;
                                                            const valueId = typeof value === 'object' && value !== null ? (value._id || value.id) : value;
                                                            return optionId === valueId;
                                                        }}
                                                        onChange={(_, newValue) => {
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
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* Vendor Information */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <ShoppingCart />
                                    <Typography variant="h6">اطلاعات فروشنده</Typography>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="vendor.name"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    label="نام فروشنده"
                                                    fullWidth
                                                    helperText="نام فروشنده یا برند محصول"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="vendor.contact"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    label="اطلاعات تماس"
                                                    fullWidth
                                                    helperText="ایمیل یا شماره تماس فروشنده"
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
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
                    {loading ? "در حال ذخیره..." : product ? "ویرایش محصول" : "ایجاد محصول"}
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

