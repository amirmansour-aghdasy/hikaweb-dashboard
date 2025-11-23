"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { BusinessCenter, Star, StarBorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ServiceForm from "@/components/forms/ServiceForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatPrice, formatNumber } from "@/lib/utils";

export default function ServicesPage() {
    const [editingService, setEditingService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("services");

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
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, categoryFilter, page, limit]);

    const endpoint = `/services?${queryParams}`;

    // Fetch services
    const { data: servicesData, isLoading } = useFetchData(["services", queryParams], endpoint);

    // Update service
    const updateService = useUpdateData("/services", {
        successMessage: "خدمت با موفقیت به‌روزرسانی شد",
        queryKey: "services",
    });

    // Delete service
    const deleteService = useDeleteData("/services", {
        successMessage: "خدمت با موفقیت حذف شد",
        queryKey: "services",
    });

    const columns = [
        {
            field: "icon",
            headerName: "آیکون",
            width: 80,
            render: (row) => (
                <Avatar src={row.icon || row.featuredImage} sx={{ width: 40, height: 40, bgcolor: "primary.main", mx: "auto" }}>
                    <BusinessCenter />
                </Avatar>
            ),
            align: "center"
        },
        {
            field: "name",
            headerName: "نام خدمت",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {getPersianValue(row.name, "-")}
                    </Typography>
                    {row.shortDescription && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {getPersianValue(row.shortDescription, "").substring(0, 60)}
                            {getPersianValue(row.shortDescription, "").length > 60 ? "..." : ""}
                        </Typography>
                    )}
                </Box>
            ),
            align: "left"
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
            align: "left"
        },
        {
            field: "pricing",
            headerName: "قیمت",
            width: 140,
            render: (row) => (
                <Box>
                    {row.pricing?.isCustom ? (
                        <Chip label="سفارشی" size="small" color="info" />
                    ) : row.pricing?.startingPrice ? (
                        <Typography variant="body2">
                            {formatPrice(row.pricing.startingPrice, row.pricing.currency)}
                        </Typography>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            قیمت ندارد
                        </Typography>
                    )}
                </Box>
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

    const handleEdit = (service) => {
        if (!canEdit) return;
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleDelete = (service) => {
        if (!canDelete) return;
        setServiceToDelete(service);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (serviceToDelete) {
            deleteService.mutate(serviceToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setServiceToDelete(null);
                },
            });
        }
    };

    const handleView = (service) => {
        if (!canView) return;
        const slug = service.slug?.fa || service.slug;
        if (slug) {
            window.open(`/services/${slug}`, "_blank");
        }
    };

    const handleTogglePopular = (service) => {
        updateService.mutate({
            id: service._id,
            data: { isPopular: !service.isPopular },
        });
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingService(null);
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

    const handleSaveService = () => {
        setIsModalOpen(false);
        setEditingService(null);
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
            key: "category",
            label: "دسته‌بندی",
            value: categoryFilter,
            onChange: (value) => {
                setCategoryFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه دسته‌ها" },
                // This would be populated from categories API
            ],
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "محبوب",
            icon: (service) => (service.isPopular ? <Star /> : <StarBorder />),
            onClick: handleTogglePopular,
            color: (service) => (service.isPopular ? "secondary" : "default"),
            permission: canEdit,
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت خدمات
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<BusinessCenter />} onClick={handleAdd} size="large">
                            خدمت جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست خدمات"
                    data={servicesData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={servicesData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onView={canView ? handleView : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در خدمات (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "خدمتی یافت نشد",
                        description: "هنوز خدمتی ایجاد نشده است. اولین خدمت خود را ایجاد کنید!",
                        action: canCreate
                            ? {
                                  label: "ایجاد خدمت جدید",
                                  onClick: handleAdd,
                              }
                            : undefined,
                    }}
                />

                {/* Service Form Modal */}
                <Modal
                    open={isModalOpen}
                    onClose={handleSaveService}
                    title={editingService ? "ویرایش خدمت" : "ایجاد خدمت جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <ServiceForm service={editingService} onSave={handleSaveService} onCancel={handleSaveService} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف خدمت <strong>{getPersianValue(serviceToDelete?.name, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteService.isPending}
                        >
                            {deleteService.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
