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
    Tooltip,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    LocalOffer,
    Edit,
    Delete,
    Add,
    Visibility,
    CheckCircle,
    Cancel,
    MoreVert,
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
const CouponForm = lazy(() => import("@/components/coupons/CouponForm"));

export default function CouponsPage() {
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCouponForMenu, setSelectedCouponForMenu] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useCreateData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("coupons");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("code", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            params.append("isActive", statusFilter === "active" ? "true" : "false");
        }
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, typeFilter, page, limit]);

    const endpoint = `/coupons?${queryParams}`;

    // Fetch coupons
    const { data: couponsData, isLoading, refetch } = useFetchData(["coupons", queryParams], endpoint);

    // Create coupon
    const createCoupon = useCreateData("/coupons", {
        successMessage: "کد تخفیف با موفقیت ایجاد شد",
        queryKey: "coupons",
    });

    // Update coupon
    const updateCoupon = useUpdateData("/coupons", {
        successMessage: "کد تخفیف با موفقیت به‌روزرسانی شد",
        queryKey: "coupons",
    });

    // Delete coupon
    const deleteCoupon = useDeleteData("/coupons", {
        successMessage: "کد تخفیف با موفقیت حذف شد",
        queryKey: "coupons",
    });

    const columns = [
        {
            field: "code",
            headerName: "کد تخفیف",
            width: 150,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold" color="primary">
                    {row.code}
                </Typography>
            ),
        },
        {
            field: "type",
            headerName: "نوع",
            width: 120,
            render: (row) => (
                <Chip
                    label={row.type === "percentage" ? "درصدی" : "مبلغ ثابت"}
                    color={row.type === "percentage" ? "primary" : "secondary"}
                    size="small"
                />
            ),
        },
        {
            field: "value",
            headerName: "مقدار",
            width: 120,
            render: (row) => (
                <Typography variant="body2">
                    {row.type === "percentage" ? `${row.value}%` : formatNumber(row.value)}
                </Typography>
            ),
        },
        {
            field: "validUntil",
            headerName: "تاریخ انقضا",
            width: 150,
            render: (row) => (
                <Typography variant="body2" color={new Date(row.validUntil) < new Date() ? "error.main" : "text.primary"}>
                    {formatDate(row.validUntil)}
                </Typography>
            ),
        },
        {
            field: "usage",
            headerName: "استفاده",
            width: 120,
            render: (row) => (
                <Typography variant="body2">
                    {formatNumber(row.usage?.count || 0)} / {row.limits?.maxUsage ? formatNumber(row.limits.maxUsage) : "∞"}
                </Typography>
            ),
        },
        {
            field: "isActive",
            headerName: "وضعیت",
            width: 100,
            render: (row) => (
                <Chip
                    label={row.isActive ? "فعال" : "غیرفعال"}
                    color={row.isActive ? "success" : "default"}
                    size="small"
                />
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
                        setAnchorEl(e.currentTarget);
                        setSelectedCouponForMenu(row);
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
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
            ],
        },
        {
            label: "نوع",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "percentage", label: "درصدی" },
                { value: "fixed", label: "مبلغ ثابت" },
            ],
        },
    ];

    const handleAdd = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
        setAnchorEl(null);
    };

    const handleDelete = (coupon) => {
        setCouponToDelete(coupon);
        setIsDeleteDialogOpen(true);
        setAnchorEl(null);
    };

    const confirmDelete = async () => {
        if (!couponToDelete?._id) {
            toast.error("کد تخفیف معتبر نیست");
            return;
        }
        try {
            await deleteCoupon.mutateAsync(couponToDelete._id);
            setIsDeleteDialogOpen(false);
            setCouponToDelete(null);
        } catch (error) {
            // Error is handled by mutation and api interceptor
            if (!error.response) {
                toast.error("خطا در حذف کد تخفیف");
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

    const handleSave = async (couponData) => {
        try {
            if (editingCoupon) {
                await updateCoupon.mutateAsync({
                    id: editingCoupon._id,
                    data: couponData,
                });
            } else {
                await createCoupon.mutateAsync(couponData);
            }
            setIsModalOpen(false);
            setEditingCoupon(null);
        } catch (error) {
            // Error is handled by mutation and api interceptor
            // Only show additional error if needed
            if (!error.response) {
                toast.error("خطا در ذخیره کد تخفیف");
            }
        }
    };

    const coupons = couponsData?.data || [];
    const pagination = couponsData?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

    return (
        <Layout>
            <Box>
                <DataTable
                    title="مدیریت کدهای تخفیف"
                    data={coupons}
                    columns={columns}
                    loading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو بر اساس کد تخفیف..."
                    enableSelection={false}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "کد تخفیفی یافت نشد",
                        description: "هنوز کد تخفیفی ایجاد نشده است.",
                    }}
                />

                {/* Actions Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                >
                    {canEdit && (
                        <MenuItem onClick={() => handleEdit(selectedCouponForMenu)}>
                            <Edit sx={{ mr: 1 }} />
                            ویرایش
                        </MenuItem>
                    )}
                    {canDelete && (
                        <MenuItem
                            onClick={() => handleDelete(selectedCouponForMenu)}
                            sx={{ color: "error.main" }}
                        >
                            <Delete sx={{ mr: 1 }} />
                            حذف
                        </MenuItem>
                    )}
                </Menu>

                {/* Coupon Form Modal */}
                <Suspense fallback={<CircularProgress />}>
                    <CouponForm
                        open={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingCoupon(null);
                        }}
                        coupon={editingCoupon}
                        onSave={handleSave}
                    />
                </Suspense>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>حذف کد تخفیف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف کد تخفیف {couponToDelete?.code} مطمئن هستید؟
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>انصراف</Button>
                        <Button onClick={confirmDelete} color="error" variant="contained">
                            حذف
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}

