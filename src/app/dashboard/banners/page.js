"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { BrandingWatermark, Edit, Delete, Add, Image } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import BannerForm from "@/components/forms/BannerForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue } from "@/lib/utils";

export default function BannersPage() {
    const [editingBanner, setEditingBanner] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isActiveFilter, setIsActiveFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("banners");

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
        if (isActiveFilter !== "all") {
            params.append("isActive", isActiveFilter);
        }
        params.append("position", "home-page-banners");
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, isActiveFilter, page, limit]);

    const endpoint = `/banners?${queryParams}`;

    // Fetch banners
    const { data: bannersData, isLoading } = useFetchData(["banners", queryParams], endpoint);

    // Update banner
    const updateBanner = useUpdateData("/banners", {
        successMessage: "بنر با موفقیت به‌روزرسانی شد",
        queryKey: "banners",
    });

    // Delete banner
    const deleteBanner = useDeleteData("/banners", {
        successMessage: "بنر با موفقیت حذف شد",
        queryKey: "banners",
    });

    const columns = [
        {
            field: "image",
            headerName: "تصویر",
            width: 120,
            render: (row) => (
                <Avatar src={row.image} variant="rounded" sx={{ width: 80, height: 50, mx: "auto" }}>
                    <Image />
                </Avatar>
            ),
            align: "center"
        },
        {
            field: "title",
            headerName: "عنوان",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {getPersianValue(row.title, "-")}
                    </Typography>
                    {row.link?.url && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {row.link.url}
                        </Typography>
                    )}
                </Box>
            ),
            align: "left"
        },
        {
            field: "orderIndex",
            headerName: "ترتیب",
            width: 80,
            render: (row) => <Typography variant="caption">{row.orderIndex || 0}</Typography>,
            align: "center"
        },
        {
            field: "isActive",
            headerName: "فعال",
            width: 100,
            render: (row) => (
                <Chip 
                    label={row.isActive ? "فعال" : "غیرفعال"} 
                    size="small" 
                    color={row.isActive ? "success" : "default"} 
                    variant="outlined" 
                />
            ),
            align: "center"
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 120,
            type: "status",
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

    const handleEdit = (banner) => {
        if (!canEdit) return;
        setEditingBanner(banner);
        setIsModalOpen(true);
    };

    const handleDelete = (banner) => {
        if (!canDelete) return;
        setBannerToDelete(banner);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (bannerToDelete) {
            deleteBanner.mutate(bannerToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setBannerToDelete(null);
                },
            });
        }
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingBanner(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };

    const handleSaveBanner = () => {
        setIsModalOpen(false);
        setEditingBanner(null);
    };

    // Filters
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
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
            ],
        },
        {
            key: "isActive",
            label: "نمایش",
            value: isActiveFilter,
            onChange: (value) => {
                setIsActiveFilter(value);
                setPage(1);
            },
            options: [
                { value: "all", label: "همه" },
                { value: "true", label: "فعال" },
                { value: "false", label: "غیرفعال" },
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت بنرها
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                            بنر جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست بنرها"
                    data={bannersData?.data?.banners || bannersData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={bannersData?.pagination || {}}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در بنرها (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "بنری یافت نشد",
                        description: "هنوز بنری ایجاد نشده است. اولین بنر خود را ایجاد کنید!",
                        action: canCreate
                            ? {
                                  label: "ایجاد بنر جدید",
                                  onClick: handleAdd,
                              }
                            : undefined,
                    }}
                />

                <Modal
                    open={isModalOpen}
                    onClose={handleSaveBanner}
                    title={editingBanner ? "ویرایش بنر" : "ایجاد بنر جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <BannerForm banner={editingBanner} onSave={handleSaveBanner} onCancel={handleSaveBanner} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف بنر <strong>{getPersianValue(bannerToDelete?.title, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteBanner.isPending}
                        >
                            {deleteBanner.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}

