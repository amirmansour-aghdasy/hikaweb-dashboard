"use client";
import { useState, useMemo, Suspense, lazy } from "react";
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
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
} from "@mui/material";
import {
    ShoppingCart,
    Visibility,
    Edit,
    Print,
    Email,
    Cancel,
    CheckCircle,
    LocalShipping,
    Payment,
    Person,
    CalendarToday,
    AttachMoney,
    MoreVert,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, formatPrice, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Lazy load components
const OrderDetailsModal = lazy(() => import("@/components/orders/OrderDetailsModal"));
const OrderStatusChanger = lazy(() => import("@/components/orders/OrderStatusChanger"));

export default function OrdersPage() {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedOrderForMenu, setSelectedOrderForMenu] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [dateFromFilter, setDateFromFilter] = useState("");
    const [dateToFilter, setDateToFilter] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete } = usePageActions("orders");
    const queryClient = useQueryClient();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("orderNumber", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            params.append("status", statusFilter);
        }
        if (paymentStatusFilter !== "all") {
            params.append("paymentStatus", paymentStatusFilter);
        }
        if (dateFromFilter) {
            params.append("dateFrom", dateFromFilter);
        }
        if (dateToFilter) {
            params.append("dateTo", dateToFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, paymentStatusFilter, dateFromFilter, dateToFilter, page, limit]);

    const endpoint = `/orders?${queryParams}`;

    // Fetch orders
    const { data: ordersData, isLoading, refetch } = useFetchData(["orders", queryParams], endpoint);

    // Update order status - custom mutation for /orders/:id/status endpoint
    const updateOrderStatus = useMutation({
        mutationFn: async ({ orderId, status, note }) => {
            const requestBody = {
                status,
                ...(note && note.trim() ? { note: note.trim() } : {})
            };
            const response = await api.put(`/orders/${orderId}/status`, requestBody);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                predicate: (query) => {
                    const queryKeyArray = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey];
                    return queryKeyArray[0] === "orders";
                }
            });
            toast.success("وضعیت سفارش با موفقیت به‌روزرسانی شد");
        },
        onError: (error) => {
            // Error is handled by api interceptor
            if (!error.response) {
                toast.error("خطا در به‌روزرسانی وضعیت");
            }
        }
    });

    // Cancel order - custom mutation for /orders/:id/cancel endpoint (POST)
    const cancelOrder = useMutation({
        mutationFn: async ({ orderId, reason }) => {
            const response = await api.post(`/orders/${orderId}/cancel`, {
                reason: reason || "لغو توسط مدیر"
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ 
                predicate: (query) => {
                    const queryKeyArray = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey];
                    return queryKeyArray[0] === "orders";
                }
            });
            toast.success("سفارش با موفقیت لغو شد");
        },
        onError: (error) => {
            // Error is handled by api interceptor
            if (!error.response) {
                toast.error("خطا در لغو سفارش");
            }
        }
    });

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            pending: "warning",
            processing: "info",
            shipped: "primary",
            delivered: "success",
            cancelled: "error",
            refunded: "default",
        };
        return colors[status] || "default";
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            pending: "در انتظار پرداخت",
            processing: "در حال پردازش",
            shipped: "ارسال شده",
            delivered: "تحویل داده شده",
            cancelled: "لغو شده",
            refunded: "بازگشت وجه",
        };
        return labels[status] || status;
    };

    // Get payment status color
    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: "warning",
            completed: "success",
            failed: "error",
            refunded: "default",
        };
        return colors[status] || "default";
    };

    // Get payment status label
    const getPaymentStatusLabel = (status) => {
        const labels = {
            pending: "در انتظار",
            completed: "پرداخت شده",
            failed: "ناموفق",
            refunded: "بازگشت وجه",
        };
        return labels[status] || status;
    };

    const columns = [
        {
            field: "orderNumber",
            headerName: "شماره سفارش",
            width: 150,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold" color="primary">
                    {row.orderNumber}
                </Typography>
            ),
        },
        {
            field: "user",
            headerName: "مشتری",
            flex: 1.5,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="medium">
                        {row.user?.name || "نامشخص"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.contactInfo?.email || row.user?.email || ""}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "items",
            headerName: "محصولات",
            width: 120,
            render: (row) => (
                <Typography variant="body2">
                    {row.items?.length || 0} محصول
                </Typography>
            ),
        },
        {
            field: "totals",
            headerName: "مبلغ",
            width: 150,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatPrice(row.totals?.total || 0)}
                </Typography>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 140,
            render: (row) => (
                <Chip
                    label={getStatusLabel(row.status)}
                    color={getStatusColor(row.status)}
                    size="small"
                />
            ),
        },
        {
            field: "payment",
            headerName: "پرداخت",
            width: 120,
            render: (row) => (
                <Chip
                    label={getPaymentStatusLabel(row.payment?.status)}
                    color={getPaymentStatusColor(row.payment?.status)}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: "createdAt",
            headerName: "تاریخ",
            width: 150,
            render: (row) => (
                <Typography variant="body2" color="text.secondary">
                    {formatDate(row.createdAt)}
                </Typography>
            ),
        },
        {
            field: "actions",
            headerName: "عملیات",
            width: 100,
            align: "center",
            render: (row) => (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation(); // جلوگیری از propagate شدن event به TableRow
                        setAnchorEl(e.currentTarget);
                        setSelectedOrderForMenu(row);
                    }}
                >
                    <MoreVert />
                </IconButton>
            ),
        },
    ];

    const filters = [
        {
            label: "وضعیت",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "pending", label: "در انتظار پرداخت" },
                { value: "processing", label: "در حال پردازش" },
                { value: "shipped", label: "ارسال شده" },
                { value: "delivered", label: "تحویل داده شده" },
                { value: "cancelled", label: "لغو شده" },
                { value: "refunded", label: "بازگشت وجه" },
            ],
        },
        {
            label: "وضعیت پرداخت",
            value: paymentStatusFilter,
            onChange: setPaymentStatusFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "pending", label: "در انتظار" },
                { value: "completed", label: "پرداخت شده" },
                { value: "failed", label: "ناموفق" },
                { value: "refunded", label: "بازگشت وجه" },
            ],
        },
    ];

    const handleView = (order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleStatusChange = (order) => {
        setSelectedOrder(order);
        setIsStatusModalOpen(true);
        setAnchorEl(null);
    };

    const handleCancel = async (order) => {
        if (!order?._id) {
            toast.error("سفارش معتبر نیست");
            return;
        }
        try {
            await cancelOrder.mutateAsync({
                orderId: order._id,
                reason: "لغو توسط مدیر"
            });
            setAnchorEl(null);
        } catch (error) {
            // Error is handled by mutation and api interceptor
            if (!error.response) {
                toast.error("خطا در لغو سفارش");
            }
        }
    };

    const handlePrint = (order) => {
        // TODO: Implement print functionality
        window.print();
        setAnchorEl(null);
    };

    const handleEmail = (order) => {
        // TODO: Implement email functionality
        toast.info("ارسال ایمیل به زودی فعال می‌شود");
        setAnchorEl(null);
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

    const handleStatusUpdate = async (orderId, newStatus, note) => {
        if (!orderId || !newStatus) {
            toast.error("اطلاعات ناقص است");
            return;
        }
        try {
            await updateOrderStatus.mutateAsync({
                orderId,
                status: newStatus,
                note: note || ""
            });
            setIsStatusModalOpen(false);
            setSelectedOrder(null);
        } catch (error) {
            // Error is handled by mutation and api interceptor
            if (!error.response) {
                toast.error("خطا در به‌روزرسانی وضعیت");
            }
        }
    };

    const orders = ordersData?.data || [];
    const pagination = ordersData?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

    // Calculate statistics
    const stats = useMemo(() => {
        const total = pagination.total || 0;
        const pending = orders.filter((o) => o.status === "pending").length;
        const processing = orders.filter((o) => o.status === "processing").length;
        const delivered = orders.filter((o) => o.status === "delivered").length;
        const totalRevenue = orders
            .filter((o) => o.payment?.status === "completed")
            .reduce((sum, o) => sum + (o.totals?.total || 0), 0);

        return { total, pending, processing, delivered, totalRevenue };
    }, [orders, pagination]);

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
                                            کل سفارشات
                                        </Typography>
                                    </Box>
                                    <ShoppingCart color="primary" sx={{ fontSize: 40 }} />
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
                                            {formatNumber(stats.pending)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            در انتظار پرداخت
                                        </Typography>
                                    </Box>
                                    <Payment color="warning" sx={{ fontSize: 40 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="info.main">
                                            {formatNumber(stats.processing)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            در حال پردازش
                                        </Typography>
                                    </Box>
                                    <LocalShipping color="info" sx={{ fontSize: 40 }} />
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
                                            {formatPrice(stats.totalRevenue)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            درآمد کل
                                        </Typography>
                                    </Box>
                                    <AttachMoney color="success" sx={{ fontSize: 40 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Orders Table */}
                <DataTable
                    title="مدیریت سفارشات"
                    data={orders}
                    columns={columns}
                    loading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onView={canView ? handleView : undefined}
                    searchPlaceholder="جستجو بر اساس شماره سفارش..."
                    enableSelection={false}
                    enableActions={false}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={false}
                    emptyStateProps={{
                        title: "سفارشی یافت نشد",
                        description: "هنوز سفارشی ثبت نشده است.",
                    }}
                />

                {/* Actions Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                >
                    {canView && (
                        <MenuItem
                            onClick={() => {
                                handleView(selectedOrderForMenu);
                                setAnchorEl(null);
                            }}
                        >
                            <Visibility sx={{ mr: 1 }} />
                            مشاهده جزئیات
                        </MenuItem>
                    )}
                    {canEdit && (
                        <MenuItem
                            onClick={() => handleStatusChange(selectedOrderForMenu)}
                        >
                            <Edit sx={{ mr: 1 }} />
                            تغییر وضعیت
                        </MenuItem>
                    )}
                    <MenuItem onClick={() => handlePrint(selectedOrderForMenu)}>
                        <Print sx={{ mr: 1 }} />
                        چاپ فاکتور
                    </MenuItem>
                    <MenuItem onClick={() => handleEmail(selectedOrderForMenu)}>
                        <Email sx={{ mr: 1 }} />
                        ارسال ایمیل
                    </MenuItem>
                    {canEdit && selectedOrderForMenu?.status !== "cancelled" && (
                        <MenuItem
                            onClick={() => handleCancel(selectedOrderForMenu)}
                            sx={{ color: "error.main" }}
                        >
                            <Cancel sx={{ mr: 1 }} />
                            لغو سفارش
                        </MenuItem>
                    )}
                </Menu>

                {/* Order Details Modal */}
                <Suspense fallback={<CircularProgress />}>
                    <OrderDetailsModal
                        open={isDetailsModalOpen}
                        onClose={() => {
                            setIsDetailsModalOpen(false);
                            setSelectedOrder(null);
                        }}
                        order={selectedOrder}
                    />
                </Suspense>

                {/* Status Change Modal */}
                <Suspense fallback={<CircularProgress />}>
                    <OrderStatusChanger
                        open={isStatusModalOpen}
                        onClose={() => {
                            setIsStatusModalOpen(false);
                            setSelectedOrder(null);
                        }}
                        order={selectedOrder}
                        onUpdate={handleStatusUpdate}
                    />
                </Suspense>
            </Box>
        </Layout>
    );
}

