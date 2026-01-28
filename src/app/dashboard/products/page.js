"use client";
import { useState, useMemo, Suspense, lazy } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Paper, Divider, Grid } from "@mui/material";
import { ShoppingCart, Publish, UnpublishedSharp, Star, StarBorder, Close, Inventory, AttachMoney } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

// Lazy load ProductForm for better performance
const ProductForm = lazy(() => import("@/components/forms/ProductForm"));

export default function ProductsPage({ params = {} }) {
    const [editingProduct, setEditingProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [previewProduct, setPreviewProduct] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("products");

    // Fetch categories for filter
    const { data: categoriesData } = useFetchData(["categories", "product"], "/categories?type=product&status=active&limit=100");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            // Convert status filter to isPublished boolean
            const isPublished = statusFilter === "published";
            params.append("isPublished", isPublished.toString());
        } else {
            // Show all products (published and unpublished) for admin view
            // Don't filter by isPublished if "all" is selected
        }
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        }
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, typeFilter, categoryFilter, page, limit]);

    const endpoint = `/products?${queryParams}`;

    // Fetch products with refetch capability
    const { data: productsData, isLoading, refetch } = useFetchData(["products", queryParams], endpoint);

    // Update product
    const updateProduct = useUpdateData("/products", {
        successMessage: "محصول با موفقیت به‌روزرسانی شد",
        queryKey: "products",
    });

    // Delete product
    const deleteProduct = useDeleteData("/products", {
        successMessage: "محصول با موفقیت حذف شد",
        queryKey: "products",
    });

    const columns = [
        {
            field: "featuredImage",
            headerName: "تصویر",
            width: 80,
            render: (row) => (
                <Avatar src={row.featuredImage} variant="rounded" sx={{ width: 40, height: 40, mx: "auto" }}>
                    <ShoppingCart />
                </Avatar>
            ),
            align: "center"
        },
        {
            field: "name",
            headerName: "نام محصول",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {getPersianValue(row.name, "-")}
                    </Typography>
                    {row.sku && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            SKU: {row.sku}
                        </Typography>
                    )}
                </Box>
            ),
            align: "left"
        },
        {
            field: "type",
            headerName: "نوع",
            width: 100,
            render: (row) => (
                <Chip
                    label={row.type === "digital" ? "دیجیتال" : "فیزیکی"}
                    size="small"
                    color={row.type === "digital" ? "info" : "primary"}
                    variant="outlined"
                />
            ),
            align: "center"
        },
        {
            field: "pricing",
            headerName: "قیمت",
            width: 140,
            render: (row) => {
                const currentPrice = row.pricing?.salePrice || row.pricing?.basePrice || 0;
                const currency = row.pricing?.currency || "IRR";
                return (
                    <Box>
                        <Typography variant="body2" fontWeight="bold">
                            {formatPrice(currentPrice, currency)}
                        </Typography>
                        {row.pricing?.isOnSale && row.pricing?.basePrice && (
                            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                                {formatPrice(row.pricing.basePrice, currency)}
                            </Typography>
                        )}
                    </Box>
                );
            },
            align: "center"
        },
        {
            field: "inventory",
            headerName: "موجودی",
            width: 120,
            render: (row) => {
                if (row.type === "digital") {
                    return <Chip label="نامحدود" size="small" color="success" />;
                }
                const quantity = row.inventory?.quantity || 0;
                const stockStatus = row.inventory?.stockStatus || "in_stock";
                const statusColors = {
                    in_stock: "success",
                    low_stock: "warning",
                    out_of_stock: "error",
                    on_backorder: "info"
                };
                const statusLabels = {
                    in_stock: "موجود",
                    low_stock: "کم‌موجود",
                    out_of_stock: "تمام شده",
                    on_backorder: "پیش‌سفارش"
                };
                return (
                    <Box>
                        <Chip
                            label={statusLabels[stockStatus] || "نامشخص"}
                            size="small"
                            color={statusColors[stockStatus] || "default"}
                        />
                        {row.inventory?.trackInventory && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {formatNumber(quantity)} عدد
                            </Typography>
                        )}
                    </Box>
                );
            },
            align: "center"
        },
        {
            field: "categories",
            headerName: "دسته‌بندی",
            width: 180,
            render: (row) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {row.categories?.slice(0, 2).map((category, index) => (
                        <Chip
                            key={index}
                            label={getPersianValue(category?.name || category, "-")}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                        />
                    ))}
                    {row.categories?.length > 2 && (
                        <Chip
                            label={`+${row.categories.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                        />
                    )}
                </Stack>
            ),
            align: "center"
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 140,
            render: (row) => (
                <Stack spacing={0.5}>
                    <Chip
                        label={row.isPublished ? "منتشر شده" : "پیش‌نویس"}
                        size="small"
                        color={row.isPublished ? "success" : "warning"}
                        variant={row.isPublished ? "filled" : "outlined"}
                    />
                    {row.isFeatured && (
                        <Chip
                            label="ویژه"
                            size="small"
                            color="secondary"
                            icon={<Star sx={{ fontSize: "12px !important" }} />}
                        />
                    )}
                </Stack>
            ),
            align: "center"
        },
        {
            field: "metrics",
            headerName: "آمار",
            width: 120,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        👀 {formatNumber(row.views || 0)}
                    </Typography>
                    <Typography variant="caption" display="block">
                        ❤️ {formatNumber(row.likes || 0)}
                    </Typography>
                    <Typography variant="caption" display="block">
                        ⭐ {row.ratings?.average?.toFixed(1) || "0.0"} ({formatNumber(row.ratings?.count || 0)})
                    </Typography>
                </Box>
            ),
            align: "center"
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            type: "date",
            align: "center"
        },
    ];

    const handleEdit = (product) => {
        if (!canEdit) return;
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (product) => {
        if (!canDelete) return;
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (productToDelete) {
            deleteProduct.mutate(productToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setProductToDelete(null);
                },
            });
        }
    };

    const handleView = (product) => {
        if (!canView) return;
        setPreviewProduct(product);
        setIsPreviewOpen(true);
    };

    // Helper function to check if a value is a Joi schema object
    const isJoiSchemaObject = (value) => {
        if (!value || typeof value !== 'object') return false;
        // Check for Joi schema object indicators (most reliable indicators)
        // CRITICAL: Use 'in' operator for direct property checks (most reliable)
        return (
            '$_root' in value ||
            '$_temp' in value ||
            '$_terms' in value ||
            '$_super' in value ||
            '_ids' in value ||
            '_preferences' in value ||
            '_rules' in value ||
            '_flags' in value ||
            (value.type && typeof value.type === 'string' && value.type === 'array' && ('$_root' in value || '_root' in value))
        );
    };

    // Helper function to check if a value is a valid array (not a Joi schema object)
    const isValidArray = (value) => {
        if (!value) return false;
        if (!Array.isArray(value)) return false;
        // Double check: if it's an array but has Joi schema properties, it's not valid
        return !isJoiSchemaObject(value);
    };

    // Helper function to extract ObjectIds from categories (handle both populated and unpopulated)
    const extractCategoryIds = (categories) => {
        if (!categories) return [];
        if (!isValidArray(categories)) return [];
        return categories.map(cat => {
            // If category is populated (has _id), use _id, otherwise use the value itself
            return typeof cat === 'object' && cat !== null && cat._id ? cat._id : cat;
        }).filter(Boolean);
    };

    // Helper function to extract ObjectIds from related content arrays
    const extractRelatedIds = (relatedArray) => {
        if (!relatedArray) return [];
        if (!isValidArray(relatedArray)) return [];
        return relatedArray.map(item => {
            return typeof item === 'object' && item !== null && item._id ? item._id : item;
        }).filter(Boolean);
    };

    // Helper function to clean updateData from any Joi schema objects
    const cleanUpdateData = (updateData) => {
        const cleaned = { ...updateData };
        
        // CRITICAL: Remove categories if it's a Joi schema object (most common issue)
        if (cleaned.categories && isJoiSchemaObject(cleaned.categories)) {
            delete cleaned.categories;
        }
        
        // Remove any fields that are Joi schema objects
        Object.keys(cleaned).forEach(key => {
            const value = cleaned[key];
            if (isJoiSchemaObject(value)) {
                delete cleaned[key];
            } else if (Array.isArray(value)) {
                // Check if array contains Joi schema objects
                if (value.some(item => isJoiSchemaObject(item))) {
                    delete cleaned[key];
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
        
        return cleaned;
    };

    // Helper function to prepare product data for update (only required fields)
    const prepareProductUpdateData = (product, updates = {}) => {
        // CRITICAL: Clean updates first to remove any Joi schema objects
        const cleanedUpdates = cleanUpdateData(updates);
        
        // Start with a clean object - only include fields that exist and are not null/undefined
        const updateData = {
            // Type is needed for validation to work correctly
            type: product.type,
            // Required fields (only if they exist)
            ...(product.description && { description: product.description }),
            ...(product.pricing && { pricing: product.pricing }),
            ...(product.status && { status: product.status }),
            // Optional but important fields (only if they exist)
            ...(product.shortDescription && { shortDescription: product.shortDescription }),
            ...(product.fullDescription && { fullDescription: product.fullDescription }),
            ...(product.featuredImage && { featuredImage: product.featuredImage }),
            ...(isValidArray(product.gallery) && { gallery: product.gallery }),
            // CRITICAL: Only include categories if it's a valid array (NOT a Joi schema object)
            // Skip categories entirely if it's a Joi schema object
            // Use direct property checks (most reliable for Joi objects)
            ...(product.categories && 
                (() => {
                    const catValue = product.categories;
                    
                    // Check if it's a Joi schema object using multiple methods
                    // Method 1: Check for Joi-specific property names using Object.keys
                    const keys = Object.keys(catValue);
                    const hasJoiKeys = keys.some(key => 
                        key === '$_root' || 
                        key === '$_temp' || 
                        key === '$_terms' || 
                        key === '$_super' ||
                        key === '_ids' ||
                        key === '_preferences' ||
                        key === '_rules' ||
                        key === '_flags'
                    );
                    
                    // Method 2: Check using 'in' operator (fallback)
                    const hasJoiIn = (
                        '$_root' in catValue ||
                        '$_temp' in catValue ||
                        '$_terms' in catValue ||
                        '$_super' in catValue ||
                        '_ids' in catValue ||
                        '_preferences' in catValue ||
                        '_rules' in catValue ||
                        '_flags' in catValue
                    );
                    
                    // Method 3: Check if it has type: 'array' with Joi properties
                    const hasJoiType = catValue.type === 'array' && (hasJoiKeys || hasJoiIn);
                    
                    // Only include if it's NOT a Joi object AND is a valid array with items
                    return !hasJoiKeys && !hasJoiIn && !hasJoiType && Array.isArray(catValue) && catValue.length > 0;
                })() && {
                categories: extractCategoryIds(product.categories)
            }),
            ...(product.tags && typeof product.tags === 'object' && !isJoiSchemaObject(product.tags) && { tags: product.tags }),
            ...(product.inventory && typeof product.inventory === 'object' && !isJoiSchemaObject(product.inventory) && { inventory: product.inventory }),
            ...(product.seo && typeof product.seo === 'object' && !isJoiSchemaObject(product.seo) && { seo: product.seo }),
            ...(product.loyaltyPoints && typeof product.loyaltyPoints === 'object' && !isJoiSchemaObject(product.loyaltyPoints) && { loyaltyPoints: product.loyaltyPoints }),
            // Extract ObjectIds from related content arrays
            ...(product.relatedProducts && isValidArray(product.relatedProducts) && {
                relatedProducts: extractRelatedIds(product.relatedProducts)
            }),
            ...(product.relatedArticles && isValidArray(product.relatedArticles) && {
                relatedArticles: extractRelatedIds(product.relatedArticles)
            }),
            ...(product.relatedServices && isValidArray(product.relatedServices) && {
                relatedServices: extractRelatedIds(product.relatedServices)
            }),
            ...(product.relatedVideos && isValidArray(product.relatedVideos) && {
                relatedVideos: extractRelatedIds(product.relatedVideos)
            }),
            ...(product.vendor && typeof product.vendor === 'object' && !isJoiSchemaObject(product.vendor) && { vendor: product.vendor }),
            ...(product.orderIndex !== undefined && { orderIndex: product.orderIndex }),
            // Status fields
            isPublished: product.isPublished ?? false,
            isFeatured: product.isFeatured ?? false,
            // Apply cleaned updates (this will override any existing values)
            ...cleanedUpdates,
        };
        
        // CRITICAL: Only include digitalProduct or physicalProduct if they match the type
        // This is essential for validation to work correctly
        if (product.type === 'digital') {
            // For digital products, only include digitalProduct if it exists and is a valid object
            if (product.digitalProduct && typeof product.digitalProduct === 'object' && !isJoiSchemaObject(product.digitalProduct)) {
                updateData.digitalProduct = product.digitalProduct;
            }
            // Explicitly ensure physicalProduct is NOT in the updateData
            delete updateData.physicalProduct;
        } else if (product.type === 'physical') {
            // For physical products, only include physicalProduct if it exists and is a valid object
            if (product.physicalProduct && typeof product.physicalProduct === 'object' && !isJoiSchemaObject(product.physicalProduct)) {
                updateData.physicalProduct = product.physicalProduct;
            }
            // Explicitly ensure digitalProduct is NOT in the updateData
            delete updateData.digitalProduct;
        } else {
            // If type is missing or invalid, exclude both to be safe
            delete updateData.digitalProduct;
            delete updateData.physicalProduct;
        }
        
        // CRITICAL: Final cleanup - remove any Joi schema objects
        const finalCleaned = cleanUpdateData(updateData);
        
        // CRITICAL: ALWAYS remove categories if it's not a valid array of strings
        // This is the ABSOLUTE last check before returning
        if (finalCleaned.categories) {
            const catValue = finalCleaned.categories;
            
            // Check if it's a Joi schema object using multiple methods
            // Method 1: Check for Joi-specific property names using Object.keys
            const keys = Object.keys(catValue);
            const hasJoiKeys = keys.some(key => 
                key === '$_root' || 
                key === '$_temp' || 
                key === '$_terms' || 
                key === '$_super' ||
                key === '_ids' ||
                key === '_preferences' ||
                key === '_rules' ||
                key === '_flags'
            );
            
            // Method 2: Check using 'in' operator (fallback)
            const hasJoiIn = (
                '$_root' in catValue ||
                '$_temp' in catValue ||
                '$_terms' in catValue ||
                '$_super' in catValue ||
                '_ids' in catValue ||
                '_preferences' in catValue ||
                '_rules' in catValue ||
                '_flags' in catValue
            );
            
            // Method 3: Check if it has type: 'array' with Joi properties
            const hasJoiType = catValue.type === 'array' && (hasJoiKeys || hasJoiIn);
            
            // Remove if it's a Joi object OR not a valid array OR not an array of strings
            if (hasJoiKeys || hasJoiIn || hasJoiType || !Array.isArray(catValue)) {
                delete finalCleaned.categories;
            } else if (Array.isArray(catValue) && !catValue.every(item => typeof item === 'string')) {
                delete finalCleaned.categories;
            }
        }
        
        return finalCleaned;
    };

    const handleTogglePublish = async (product) => {
        if (!product?._id) {
            toast.error("محصول معتبر نیست");
            return;
        }
        try {
            // CRITICAL: Clean product object before passing to prepareProductUpdateData
            // Remove any Joi schema objects from product itself
            const cleanedProduct = { ...product };
            
            // CRITICAL: Remove categories if it's a Joi schema object OR not a valid array
            // Use direct property checks (most reliable for Joi objects)
            if (cleanedProduct.categories) {
                const catValue = cleanedProduct.categories;
                const hasJoiProperties = (
                    '$_root' in catValue ||
                    '$_temp' in catValue ||
                    '$_terms' in catValue ||
                    '$_super' in catValue ||
                    '_ids' in catValue ||
                    '_preferences' in catValue ||
                    '_rules' in catValue ||
                    '_flags' in catValue ||
                    (catValue.type === 'array' && ('$_root' in catValue || '_root' in catValue))
                );
                
                if (hasJoiProperties || !Array.isArray(catValue)) {
                    // If categories is a Joi schema object or not a valid array, remove it entirely
                    // We'll let the backend use existing categories from the database
                    delete cleanedProduct.categories;
                }
            }
            
            const updateData = prepareProductUpdateData(cleanedProduct, {
                isPublished: !cleanedProduct.isPublished,
            });
            
            await updateProduct.mutateAsync({
                id: product._id,
                data: updateData,
            });
        } catch (error) {
            // Error is handled by mutation and api interceptor
            if (!error.response) {
                toast.error("خطا در تغییر وضعیت انتشار");
            }
        }
    };

    const handleToggleFeatured = async (product) => {
        if (!product?._id) {
            toast.error("محصول معتبر نیست");
            return;
        }
        try {
            // CRITICAL: Clean product object before passing to prepareProductUpdateData
            // Remove any Joi schema objects from product itself
            const cleanedProduct = { ...product };
            
            // CRITICAL: Remove categories if it's a Joi schema object OR not a valid array
            // Use direct property checks (most reliable for Joi objects)
            if (cleanedProduct.categories) {
                const catValue = cleanedProduct.categories;
                const hasJoiProperties = (
                    '$_root' in catValue ||
                    '$_temp' in catValue ||
                    '$_terms' in catValue ||
                    '$_super' in catValue ||
                    '_ids' in catValue ||
                    '_preferences' in catValue ||
                    '_rules' in catValue ||
                    '_flags' in catValue ||
                    (catValue.type === 'array' && ('$_root' in catValue || '_root' in catValue))
                );
                
                if (hasJoiProperties || !Array.isArray(catValue)) {
                    // If categories is a Joi schema object or not a valid array, remove it entirely
                    // We'll let the backend use existing categories from the database
                    delete cleanedProduct.categories;
                }
            }
            
            const updateData = prepareProductUpdateData(cleanedProduct, {
                isFeatured: !cleanedProduct.isFeatured,
            });
            
            await updateProduct.mutateAsync({
                id: product._id,
                data: updateData,
            });
        } catch (error) {
            // Error is handled by mutation and api interceptor
            if (!error.response) {
                toast.error("خطا در تغییر وضعیت ویژه");
            }
        }
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        setPage(1); // Reset to first page on search
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1); // Reset to first page when changing limit
    };

    const handleSaveProduct = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        // Refetch products after save
        refetch();
    };

    // Prepare category options for filter
    const categoryOptions = useMemo(() => {
        const options = [{ value: "all", label: "همه دسته‌ها" }];
        
        if (categoriesData?.data && Array.isArray(categoriesData.data)) {
            categoriesData.data.forEach((category) => {
                const categoryName = getPersianValue(category?.name || category, "بدون نام");
                options.push({
                    value: category._id || category.id || category,
                    label: categoryName,
                });
            });
        }
        
        return options;
    }, [categoriesData]);

    // Filters for the data table
    const filters = [
        {
            key: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: (value) => {
                setStatusFilter(value);
                setPage(1);
            },
            options: [
                { value: "all", label: "همه" },
                { value: "published", label: "منتشر شده" },
                { value: "draft", label: "پیش‌نویس" },
            ],
        },
        {
            key: "type",
            label: "نوع محصول",
            value: typeFilter,
            onChange: (value) => {
                setTypeFilter(value);
                setPage(1);
            },
            options: [
                { value: "all", label: "همه" },
                { value: "digital", label: "دیجیتال" },
                { value: "physical", label: "فیزیکی" },
            ],
        },
        {
            key: "category",
            label: "دسته‌بندی",
            value: categoryFilter,
            onChange: (value) => {
                setCategoryFilter(value);
                setPage(1);
            },
            options: categoryOptions,
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "تغییر انتشار",
            icon: (product) => (product.isPublished ? <UnpublishedSharp /> : <Publish />),
            onClick: handleTogglePublish,
            color: (product) => (product.isPublished ? "warning" : "success"),
            permission: canEdit,
        },
        {
            label: "ویژه",
            icon: (product) => (product.isFeatured ? <Star /> : <StarBorder />),
            onClick: handleToggleFeatured,
            color: (product) => (product.isFeatured ? "secondary" : "default"),
            permission: canEdit,
        },
    ];

    const products = Array.isArray(productsData?.data) ? productsData.data : [];
    const pagination = productsData?.pagination || {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 1
    };

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت محصولات
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<ShoppingCart />} onClick={handleAdd} size="large">
                            محصول جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست محصولات"
                    data={products}
                    columns={columns}
                    loading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onView={canView ? handleView : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در محصولات (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "محصولی یافت نشد",
                        description: "هنوز محصولی ایجاد نشده است. برای شروع، محصول جدیدی ایجاد کنید.",
                        actionLabel: "محصول جدید",
                        onAction: canCreate ? handleAdd : undefined,
                    }}
                />

                {/* Edit/Create Modal */}
                <Modal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingProduct(null);
                    }}
                    title={editingProduct ? "ویرایش محصول" : "محصول جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <Suspense fallback={<CircularProgress />}>
                        <ProductForm
                            product={editingProduct}
                            onSave={handleSaveProduct}
                            onCancel={() => {
                                setIsModalOpen(false);
                                setEditingProduct(null);
                            }}
                        />
                    </Suspense>
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>تایید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف محصول "{productToDelete && getPersianValue(productToDelete.name, "")}" اطمینان دارید؟
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            این عمل قابل بازگشت نیست.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleConfirmDelete} color="error" variant="contained">
                            حذف
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Preview Dialog */}
                <Dialog
                    open={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="h6">
                                {previewProduct && getPersianValue(previewProduct.name, "پیش‌نمایش محصول")}
                            </Typography>
                            <Button
                                onClick={() => setIsPreviewOpen(false)}
                                sx={{ minWidth: "auto", p: 1 }}
                            >
                                <Close />
                            </Button>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {previewProduct && (
                            <Box>
                                <Paper sx={{ p: 2, mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        اطلاعات محصول
                                    </Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                SKU:
                                            </Typography>
                                            <Typography variant="body1">{previewProduct.sku || "-"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                نوع:
                                            </Typography>
                                            <Typography variant="body1">
                                                {previewProduct.type === "digital" ? "دیجیتال" : "فیزیکی"}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                قیمت:
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatPrice(
                                                    previewProduct.pricing?.salePrice || previewProduct.pricing?.basePrice || 0,
                                                    previewProduct.pricing?.currency || "IRR"
                                                )}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                موجودی:
                                            </Typography>
                                            <Typography variant="body1">
                                                {previewProduct.type === "digital"
                                                    ? "نامحدود"
                                                    : `${formatNumber(previewProduct.inventory?.quantity || 0)} عدد`}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                                {previewProduct.shortDescription && (
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            توضیحات کوتاه
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2">
                                            {getPersianValue(previewProduct.shortDescription, "-")}
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        </Layout>
    );
}

