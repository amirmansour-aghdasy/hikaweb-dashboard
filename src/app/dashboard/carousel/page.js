"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { ViewCarousel, Edit, Delete, Add, Image, Star, StarBorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import CarouselForm from "@/components/forms/CarouselForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue } from "@/lib/utils";

const POSITION_CONFIG = {
    hero: { label: "قهرمان", color: "primary" },
    featured: { label: "ویژه", color: "secondary" },
    sidebar: { label: "کناری", color: "info" },
    banner: { label: "بنر", color: "warning" },
};

export default function CarouselPage() {
    const [editingCarousel, setEditingCarousel] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [carouselToDelete, setCarouselToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [positionFilter, setPositionFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("carousel");

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
        if (positionFilter !== "all") {
            params.append("position", positionFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, positionFilter, page, limit]);

    const endpoint = `/carousel?${queryParams}`;

    // Fetch carousel items
    const { data: carouselData, isLoading } = useFetchData(["carousel", queryParams], endpoint);

    // Update carousel
    const updateCarousel = useUpdateData("/carousel", {
        successMessage: "اسلاید با موفقیت به‌روزرسانی شد",
        queryKey: "carousel",
    });

    // Delete carousel
    const deleteCarousel = useDeleteData("/carousel", {
        successMessage: "اسلاید با موفقیت حذف شد",
        queryKey: "carousel",
    });

    const columns = [
        {
            field: "image",
            headerName: "تصویر",
            width: 120,
            render: (row) => (
                <Avatar src={row.image} variant="rounded" sx={{ width: 80, height: 50 }}>
                    <Image />
                </Avatar>
            ),
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
                    {row.subtitle && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {getPersianValue(row.subtitle, "")}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "position",
            headerName: "موقعیت",
            width: 120,
            render: (row) => {
                const config = POSITION_CONFIG[row.position] || POSITION_CONFIG.hero;
                return <Chip label={config.label} size="small" color={config.color} variant="outlined" />;
            },
        },
        {
            field: "order",
            headerName: "ترتیب",
            width: 80,
            render: (row) => <Typography variant="caption">{row.order || row.orderIndex || 0}</Typography>,
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

    const handleEdit = (carousel) => {
        if (!canEdit) return;
        setEditingCarousel(carousel);
        setIsModalOpen(true);
    };

    const handleDelete = (carousel) => {
        if (!canDelete) return;
        setCarouselToDelete(carousel);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (carouselToDelete) {
            deleteCarousel.mutate(carouselToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setCarouselToDelete(null);
                },
            });
        }
    };

    const handleToggleFeatured = (carousel) => {
        updateCarousel.mutate({
            id: carousel._id,
            data: { isFeatured: !carousel.isFeatured },
        });
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingCarousel(null);
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

    const handleSaveCarousel = () => {
        setIsModalOpen(false);
        setEditingCarousel(null);
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
            key: "position",
            label: "موقعیت",
            value: positionFilter,
            onChange: (value) => {
                setPositionFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه موقعیت‌ها" },
                ...Object.entries(POSITION_CONFIG).map(([key, config]) => ({
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
            icon: (carousel) => (carousel.isFeatured ? <Star /> : <StarBorder />),
            onClick: handleToggleFeatured,
            color: (carousel) => (carousel.isFeatured ? "secondary" : "default"),
            permission: canEdit,
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت اسلایدر
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                            اسلاید جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست اسلایدها"
                    data={carouselData?.data?.carousels || carouselData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={carouselData?.pagination || {}}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در اسلایدها (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "اسلایدی یافت نشد",
                        description: "هنوز اسلایدی ایجاد نشده است. اولین اسلاید خود را ایجاد کنید!",
                        action: canCreate
                            ? {
                                  label: "ایجاد اسلاید جدید",
                                  onClick: handleAdd,
                              }
                            : undefined,
                    }}
                />

                <Modal
                    open={isModalOpen}
                    onClose={handleSaveCarousel}
                    title={editingCarousel ? "ویرایش اسلاید" : "ایجاد اسلاید جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <CarouselForm carousel={editingCarousel} onSave={handleSaveCarousel} onCancel={handleSaveCarousel} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف اسلاید <strong>{getPersianValue(carouselToDelete?.title, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteCarousel.isPending}
                        >
                            {deleteCarousel.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
