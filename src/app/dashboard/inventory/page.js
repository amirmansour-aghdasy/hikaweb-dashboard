"use client";
import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import {
    Box,
    Typography,
    Chip,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Paper,
    Divider,
    Grid,
    Card,
    CardContent,
    TextField,
    IconButton,
    Tooltip,
    Alert,
} from "@mui/material";
import {
    Inventory,
    Warning,
    CheckCircle,
    Edit,
    Save,
    Cancel,
    Add,
    Delete,
    Refresh,
    TrendingDown,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

// Lazy load components
const BulkStockUpdate = lazy(() => import("@/components/inventory/BulkStockUpdate"));

export default function InventoryPage() {
    const [editingProduct, setEditingProduct] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [stockStatusFilter, setStockStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData } = useApi();
    const { canEdit } = usePageActions("products");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (stockStatusFilter !== "all") {
            params.append("stockStatus", stockStatusFilter);
        }
        // Only show physical products for inventory management
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        } else {
            params.append("type", "physical");
        }
        return params.toString();
    }, [debouncedSearchTerm, stockStatusFilter, typeFilter, page, limit]);

    const endpoint = `/products?${queryParams}`;

    // Fetch products
    const { data: productsData, isLoading, refetch } = useFetchData(["products", "inventory", queryParams], endpoint);

    // Update product inventory
    const updateInventory = useUpdateData("/products", {
        successMessage: "موجودی با موفقیت به‌روزرسانی شد",
        queryKey: ["products", "inventory"],
    });

    // Get stock status color
    const getStockStatusColor = (status) => {
        const colors = {
            in_stock: "success",
            low_stock: "warning",
            out_of_stock: "error",
            on_backorder: "info",
        };
        return colors[status] || "default";
    };

    // Get stock status label
    const getStockStatusLabel = (status) => {
        const labels = {
            in_stock: "موجود",
            low_stock: "کم‌موجود",
            out_of_stock: "تمام شده",
            on_backorder: "پیش‌سفارش",
        };
        return labels[status] || status;
    };

    const columns = [
        {
            field: "name",
            headerName: "محصول",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.name?.fa || row.name || "-"}
                    </Typography>
                    {row.sku && (
                        <Typography variant="caption" color="text.secondary">
                            SKU: {row.sku}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "inventory",
            headerName: "موجودی",
            width: 150,
            render: (row) => {
                if (!row.inventory?.trackInventory) {
                    return <Chip label="غیرفعال" size="small" color="default" variant="outlined" />;
                }
                const quantity = row.inventory?.quantity || 0;
                const stockStatus = row.inventory?.stockStatus || "out_of_stock";
                return (
                    <Stack spacing={0.5}>
                        <Chip
                            label={getStockStatusLabel(stockStatus)}
                            size="small"
                            color={getStockStatusColor(stockStatus)}
                        />
                        <Typography variant="body2" fontWeight="medium">
                            {formatNumber(quantity)} عدد
                        </Typography>
                    </Stack>
                );
            },
        },
        {
            field: "lowStockThreshold",
            headerName: "آستانه کمبود",
            width: 130,
            render: (row) => (
                <Typography variant="body2">
                    {row.inventory?.trackInventory ? formatNumber(row.inventory?.lowStockThreshold || 0) : "-"}
                </Typography>
            ),
        },
        {
            field: "allowBackorder",
            headerName: "پیش‌سفارش",
            width: 100,
            render: (row) => (
                <Chip
                    label={row.inventory?.allowBackorder ? "فعال" : "غیرفعال"}
                    size="small"
                    color={row.inventory?.allowBackorder ? "success" : "default"}
                    variant="outlined"
                />
            ),
        },
        {
            field: "trackInventory",
            headerName: "ردیابی موجودی",
            width: 130,
            render: (row) => (
                <Chip
                    label={row.inventory?.trackInventory ? "فعال" : "غیرفعال"}
                    size="small"
                    color={row.inventory?.trackInventory ? "info" : "default"}
                    variant="outlined"
                />
            ),
        },
        {
            field: "actions",
            headerName: "عملیات",
            width: 100,
            align: "center",
            render: (row) => (
                <Tooltip title="ویرایش موجودی">
                    <IconButton
                        size="small"
                        onClick={() => {
                            setEditingProduct(row);
                            setIsEditModalOpen(true);
                        }}
                        disabled={!canEdit}
                    >
                        <Edit />
                    </IconButton>
                </Tooltip>
            ),
        },
    ];

    const filters = [
        {
            label: "وضعیت موجودی",
            value: stockStatusFilter,
            onChange: setStockStatusFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "in_stock", label: "موجود" },
                { value: "low_stock", label: "کم‌موجود" },
                { value: "out_of_stock", label: "تمام شده" },
                { value: "on_backorder", label: "پیش‌سفارش" },
            ],
        },
    ];

    const handleEdit = async (productId, inventoryData) => {
        if (!productId) {
            toast.error("محصول معتبر نیست");
            return;
        }
        // Validate inventory data
        if (inventoryData.trackInventory) {
            const quantity = parseInt(inventoryData.quantity);
            const threshold = parseInt(inventoryData.lowStockThreshold);
            if (isNaN(quantity) || quantity < 0) {
                toast.error("تعداد موجودی باید عدد مثبت باشد");
                return;
            }
            if (isNaN(threshold) || threshold < 0) {
                toast.error("آستانه کمبود باید عدد مثبت باشد");
                return;
            }
        }
        try {
            await updateInventory.mutateAsync({
                id: productId,
                data: {
                    inventory: inventoryData,
                },
            });
            setIsEditModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            // Error is handled by mutation and api interceptor
            if (!error.response) {
                toast.error("خطا در به‌روزرسانی موجودی");
            }
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        setPage(1);
    };

    const products = productsData?.data || [];
    const pagination = productsData?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

    // Calculate statistics
    const stats = useMemo(() => {
        const total = products.length;
        const inStock = products.filter(
            (p) => p.inventory?.trackInventory && p.inventory?.stockStatus === "in_stock"
        ).length;
        const lowStock = products.filter(
            (p) => p.inventory?.trackInventory && p.inventory?.stockStatus === "low_stock"
        ).length;
        const outOfStock = products.filter(
            (p) => p.inventory?.trackInventory && p.inventory?.stockStatus === "out_of_stock"
        ).length;
        const totalQuantity = products.reduce(
            (sum, p) => sum + (p.inventory?.quantity || 0),
            0
        );

        return { total, inStock, lowStock, outOfStock, totalQuantity };
    }, [products]);

    return (
        <Layout>
            <Box>
                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {formatNumber(stats.total)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            کل محصولات
                                        </Typography>
                                    </Box>
                                    <Inventory color="primary" sx={{ fontSize: 40 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="success.main">
                                            {formatNumber(stats.inStock)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            موجود
                                        </Typography>
                                    </Box>
                                    <CheckCircle color="success" sx={{ fontSize: 40 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                                            {formatNumber(stats.lowStock)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            کم‌موجود
                                        </Typography>
                                    </Box>
                                    <Warning color="warning" sx={{ fontSize: 40 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="error.main">
                                            {formatNumber(stats.outOfStock)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            تمام شده
                                        </Typography>
                                    </Box>
                                    <TrendingDown color="error" sx={{ fontSize: 40 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Alerts */}
                {stats.lowStock > 0 && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        {stats.lowStock} محصول کم‌موجود است. لطفاً موجودی آن‌ها را بررسی کنید.
                    </Alert>
                )}
                {stats.outOfStock > 0 && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {stats.outOfStock} محصول تمام شده است. لطفاً موجودی آن‌ها را تکمیل کنید.
                    </Alert>
                )}

                {/* Action Buttons */}
                <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
                    {canEdit && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setIsBulkUpdateOpen(true)}
                        >
                            به‌روزرسانی دسته‌ای
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => refetch()}
                    >
                        به‌روزرسانی
                    </Button>
                </Box>

                {/* Inventory Table */}
                <DataTable
                    title="مدیریت موجودی"
                    data={products}
                    columns={columns}
                    loading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    searchPlaceholder="جستجو در محصولات..."
                    enableSelection={canEdit}
                    filters={filters}
                    canView={false}
                    canEdit={canEdit}
                    canDelete={false}
                    canCreate={false}
                    emptyStateProps={{
                        title: "محصولی یافت نشد",
                        description: "هنوز محصولی برای مدیریت موجودی وجود ندارد.",
                    }}
                />

                {/* Edit Inventory Modal */}
                <Modal
                    open={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingProduct(null);
                    }}
                    title="ویرایش موجودی"
                    maxWidth="sm"
                    fullWidth
                >
                    {editingProduct && (
                        <InventoryEditForm
                            product={editingProduct}
                            onSave={handleEdit}
                            onCancel={() => {
                                setIsEditModalOpen(false);
                                setEditingProduct(null);
                            }}
                        />
                    )}
                </Modal>

                {/* Bulk Update Modal */}
                <Suspense fallback={<CircularProgress />}>
                    <BulkStockUpdate
                        open={isBulkUpdateOpen}
                        onClose={() => setIsBulkUpdateOpen(false)}
                        products={products}
                        onUpdate={refetch}
                    />
                </Suspense>
            </Box>
        </Layout>
    );
}

// Inventory Edit Form Component
function InventoryEditForm({ product, onSave, onCancel }) {
    const [quantity, setQuantity] = useState(product?.inventory?.quantity || 0);
    const [lowStockThreshold, setLowStockThreshold] = useState(
        product?.inventory?.lowStockThreshold || 0
    );
    const [trackInventory, setTrackInventory] = useState(
        product?.inventory?.trackInventory !== false
    );
    const [allowBackorder, setAllowBackorder] = useState(
        product?.inventory?.allowBackorder || false
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update state when product changes
    useEffect(() => {
        if (product) {
            setQuantity(product.inventory?.quantity || 0);
            setLowStockThreshold(product.inventory?.lowStockThreshold || 0);
            setTrackInventory(product.inventory?.trackInventory !== false);
            setAllowBackorder(product.inventory?.allowBackorder || false);
        }
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!product?._id) {
            toast.error("محصول معتبر نیست");
            return;
        }
        // Validate inputs
        if (trackInventory) {
            const qty = parseInt(quantity);
            const threshold = parseInt(lowStockThreshold);
            if (isNaN(qty) || qty < 0) {
                toast.error("تعداد موجودی باید عدد مثبت باشد");
                return;
            }
            if (isNaN(threshold) || threshold < 0) {
                toast.error("آستانه کمبود باید عدد مثبت باشد");
                return;
            }
        }
        setIsSubmitting(true);
        try {
            await onSave(product._id, {
                quantity: trackInventory ? parseInt(quantity) : 0,
                lowStockThreshold: trackInventory ? parseInt(lowStockThreshold) : 0,
                trackInventory,
                allowBackorder,
            });
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
                <TextField
                    label="تعداد موجودی"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    fullWidth
                    required
                    disabled={!trackInventory}
                    helperText="تعداد موجودی فعلی محصول"
                />

                <TextField
                    label="آستانه کمبود موجودی"
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    fullWidth
                    required
                    disabled={!trackInventory}
                    helperText="هنگامی که موجودی به این عدد برسد، هشدار نمایش داده می‌شود"
                />

                <Stack direction="row" spacing={2} alignItems="center">
                    <input
                        type="checkbox"
                        checked={trackInventory}
                        onChange={(e) => setTrackInventory(e.target.checked)}
                        id="trackInventory"
                    />
                    <label htmlFor="trackInventory">
                        <Typography variant="body2">ردیابی موجودی</Typography>
                    </label>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <input
                        type="checkbox"
                        checked={allowBackorder}
                        onChange={(e) => setAllowBackorder(e.target.checked)}
                        id="allowBackorder"
                        disabled={!trackInventory}
                    />
                    <label htmlFor="allowBackorder">
                        <Typography variant="body2">اجازه پیش‌سفارش</Typography>
                    </label>
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button onClick={onCancel} disabled={isSubmitting}>
                        انصراف
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
                    >
                        {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}

