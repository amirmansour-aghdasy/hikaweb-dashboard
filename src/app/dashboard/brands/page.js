"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Card, CardContent, Grid, IconButton, Link, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Business, Edit, Delete, Add, Language, Star, StarBorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import BrandForm from "@/components/forms/BrandForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber } from "@/lib/utils";

const INDUSTRY_CONFIG = {
    technology: { label: "فناوری", color: "primary", icon: "💻" },
    healthcare: { label: "بهداشت و درمان", color: "success", icon: "🏥" },
    finance: { label: "مالی", color: "warning", icon: "💰" },
    education: { label: "آموزش", color: "info", icon: "🎓" },
    retail: { label: "خرده‌فروشی", color: "secondary", icon: "🛒" },
    manufacturing: { label: "تولیدی", color: "default", icon: "🏭" },
    services: { label: "خدمات", color: "primary", icon: "🔧" },
    other: { label: "سایر", color: "default", icon: "🏢" },
};

const COMPANY_SIZES = {
    startup: { label: "استارتاپ", color: "info" },
    small: { label: "کوچک", color: "success" },
    medium: { label: "متوسط", color: "warning" },
    large: { label: "بزرگ", color: "error" },
    enterprise: { label: "سازمانی", color: "secondary" },
};

export default function BrandsPage() {
    const [editingBrand, setEditingBrand] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [industryFilter, setIndustryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("brands");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            params.append("status", statusFilter);
        }
        if (industryFilter !== "all") {
            params.append("industry", industryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, industryFilter, page, limit]);

    const endpoint = `/brands?${queryParams}`;

    // Fetch brands
    const { data: brandsData, isLoading } = useFetchData(["brands", queryParams], endpoint);

    // Update brand
    const updateBrand = useUpdateData("/brands", {
        successMessage: "برند با موفقیت به‌روزرسانی شد",
        queryKey: "brands",
    });

    // Delete brand
    const deleteBrand = useDeleteData("/brands", {
        successMessage: "برند با موفقیت حذف شد",
        queryKey: "brands",
    });

    const columns = [
        {
            field: "logo",
            headerName: "لوگو",
            width: 80,
            render: (row) => (
                <Avatar src={row.logo} variant="rounded" sx={{ width: 40, height: 40 }}>
                    <Business />
                </Avatar>
            ),
        },
        {
            field: "name",
            headerName: "نام برند",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.name}
                    </Typography>
                    {row.website && (
                        <Typography variant="caption" color="text.secondary">
                            <Link href={row.website} target="_blank" rel="noopener" sx={{ textDecoration: "none" }}>
                                {row.website.replace(/^https?:\/\//, "")}
                            </Link>
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "industry",
            headerName: "صنعت",
            width: 150,
            render: (row) => {
                const industry = getPersianValue(row.industry, row.industry || "other");
                const config = INDUSTRY_CONFIG[industry] || INDUSTRY_CONFIG.other;
                return (
                    <Chip
                        label={config.label}
                        size="small"
                        color={config.color}
                        icon={<span style={{ fontSize: "12px" }}>{config.icon}</span>}
                    />
                );
            },
        },
        {
            field: "projectCount",
            headerName: "تعداد پروژه",
            width: 120,
            render: (row) => (
                <Typography variant="body2">{formatNumber(row.projectCount || row.projectsCount || 0)}</Typography>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 120,
            type: "status",
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            type: "date",
        },
    ];

    const handleEdit = (brand) => {
        if (!canEdit) return;
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const handleDelete = (brand) => {
        if (!canDelete) return;
        setBrandToDelete(brand);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (brandToDelete) {
            deleteBrand.mutate(brandToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setBrandToDelete(null);
                },
            });
        }
    };

    const handleView = (brand) => {
        if (!canView) return;
        if (brand.website) {
            window.open(brand.website, "_blank");
        }
    };

    const handleToggleFeatured = (brand) => {
        updateBrand.mutate({
            id: brand._id,
            data: { isFeatured: !brand.isFeatured },
        });
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingBrand(null);
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

    const handleSaveBrand = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    // Filters for the data table
    const filters = [
        {
            key: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: (value) => {
                setStatusFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه" },
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
            ],
        },
        {
            key: "industry",
            label: "صنعت",
            value: industryFilter,
            onChange: (value) => {
                setIndustryFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه صنایع" },
                ...Object.entries(INDUSTRY_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                })),
            ],
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "ویژه",
            icon: (brand) => (brand.isFeatured ? <Star /> : <StarBorder />),
            onClick: handleToggleFeatured,
            color: (brand) => (brand.isFeatured ? "secondary" : "default"),
            permission: canEdit,
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت برندها
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                            برند جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست برندها"
                    data={brandsData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={brandsData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onView={canView ? handleView : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در برندها (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "برندی یافت نشد",
                        description: "هنوز برندی ایجاد نشده است. اولین برند خود را ایجاد کنید!",
                        action: canCreate
                            ? {
                                  label: "ایجاد برند جدید",
                                  onClick: handleAdd,
                              }
                            : undefined,
                    }}
                />

                <Modal
                    open={isModalOpen}
                    onClose={handleSaveBrand}
                    title={editingBrand ? "ویرایش برند" : "ایجاد برند جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <BrandForm brand={editingBrand} onSave={handleSaveBrand} onCancel={handleSaveBrand} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف برند <strong>{brandToDelete?.name}</strong> اطمینان دارید؟
                            <br />
                            <br />
                            <Typography variant="caption" color="error">
                                توجه: این عملیات قابل بازگشت نیست.
                            </Typography>
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>انصراف</Button>
                        <Button
                            onClick={handleConfirmDelete}
                            color="error"
                            variant="contained"
                            disabled={deleteBrand.isPending}
                        >
                            {deleteBrand.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
