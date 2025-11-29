"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Paper, Divider, Grid, Card } from "@mui/material";
import { BusinessCenter, Star, StarBorder, Close, Schedule, MonetizationOn, CheckCircle } from "@mui/icons-material";
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
    const [previewService, setPreviewService] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("services");

    // Fetch categories for filter
    const { data: categoriesData } = useFetchData(["categories", "service"], "/categories?type=service&status=active&limit=100");

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
    const { data: servicesData, isLoading, refetch: refetchServices } = useFetchData(["services", queryParams], endpoint);

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
        setPreviewService(service);
        setIsPreviewOpen(true);
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
        // Refetch services to update the table
        refetchServices();
    };

    // Category options for filter
    const categoryOptions = useMemo(() => {
        const options = [{ value: "all", label: "همه دسته‌ها" }];
        
        if (categoriesData?.data) {
            // Handle both response structures: { categories: [...] } or [...]
            const categoriesArray = Array.isArray(categoriesData.data) 
                ? categoriesData.data 
                : (categoriesData.data.categories || []);
            
            categoriesArray.forEach((category) => {
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
            options: categoryOptions,
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

                {/* Service Preview Modal */}
                <Dialog 
                    open={isPreviewOpen} 
                    onClose={() => setIsPreviewOpen(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", m: 0, p: 2 }}>
                        <Box component="span" sx={{ fontSize: "1.25rem", fontWeight: 500 }}>جزئیات خدمت</Box>
                        <Button
                            onClick={() => setIsPreviewOpen(false)}
                            size="small"
                            startIcon={<Close />}
                        >
                            بستن
                        </Button>
                    </DialogTitle>
                    <DialogContent dividers>
                        {previewService && (
                            <Paper sx={{ p: 3 }}>
                                {/* Header Section */}
                                <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "flex-start" }}>
                                    {(previewService.icon || previewService.featuredImage) && (
                                        <Avatar 
                                            src={previewService.icon || previewService.featuredImage} 
                                            sx={{ width: 80, height: 80, bgcolor: "primary.main" }}
                                        >
                                            <BusinessCenter sx={{ fontSize: 40 }} />
                                        </Avatar>
                                    )}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h4" gutterBottom fontWeight="bold">
                                            {getPersianValue(previewService.name, "بدون نام")}
                                        </Typography>
                                        {previewService.shortDescription && (
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                                {getPersianValue(previewService.shortDescription, "")}
                                            </Typography>
                                        )}
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                            {previewService.categories?.map((category, index) => (
                                                <Chip 
                                                    key={index} 
                                                    label={getPersianValue(category?.name || category, category?.name || category || "بدون دسته‌بندی")} 
                                                    size="small" 
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ))}
                                            {previewService.isPopular && (
                                                <Chip 
                                                    icon={<Star />} 
                                                    label="محبوب" 
                                                    size="small" 
                                                    color="secondary"
                                                />
                                            )}
                                        </Stack>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                {/* Description */}
                                {previewService.description && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            توضیحات کامل
                                        </Typography>
                                        <Box 
                                            sx={{ 
                                                mt: 2,
                                                "& img": { maxWidth: "100%" },
                                                "& p": { mb: 2 }
                                            }}
                                            dangerouslySetInnerHTML={{ 
                                                __html: getPersianValue(previewService.description, "") 
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Pricing Section */}
                                {previewService.pricing && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <MonetizationOn /> قیمت‌گذاری
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            {previewService.pricing.isCustom ? (
                                                <Grid size={{ xs: 12 }}>
                                                    <Chip label="قیمت سفارشی" color="info" />
                                                </Grid>
                                            ) : previewService.pricing.startingPrice ? (
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography variant="body1">
                                                        قیمت شروع: <strong>{formatPrice(previewService.pricing.startingPrice, previewService.pricing.currency || "IRR")}</strong>
                                                    </Typography>
                                                </Grid>
                                            ) : null}
                                        </Grid>
                                    </Box>
                                )}

                                {/* Duration Section */}
                                {previewService.duration && (previewService.duration.min || previewService.duration.max) && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Schedule /> مدت زمان انجام
                                        </Typography>
                                        <Typography variant="body1" sx={{ mt: 1 }}>
                                            {previewService.duration.min && previewService.duration.max 
                                                ? `${previewService.duration.min} تا ${previewService.duration.max} روز`
                                                : previewService.duration.min 
                                                    ? `حداقل ${previewService.duration.min} روز`
                                                    : previewService.duration.max 
                                                        ? `حداکثر ${previewService.duration.max} روز`
                                                        : ""}
                                        </Typography>
                                        {previewService.duration.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {getPersianValue(previewService.duration.description, "")}
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                {/* Process Steps */}
                                {previewService.processSteps && previewService.processSteps.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            مراحل انجام کار
                                        </Typography>
                                        <Stack spacing={2} sx={{ mt: 2 }}>
                                            {previewService.processSteps.map((step, index) => (
                                                <Card key={index} variant="outlined" sx={{ p: 2 }}>
                                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                                        <Box sx={{ 
                                                            width: 40, 
                                                            height: 40, 
                                                            borderRadius: "50%", 
                                                            bgcolor: "primary.main", 
                                                            color: "white",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: "bold"
                                                        }}>
                                                            {index + 1}
                                                        </Box>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {getPersianValue(step.title, "")}
                                                            </Typography>
                                                            {step.description && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                    {getPersianValue(step.description, "")}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </Card>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Features */}
                                {previewService.features && previewService.features.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            ویژگی‌ها
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            {previewService.features.map((feature, index) => (
                                                <Grid size={{ xs: 12, md: 6 }} key={index}>
                                                    <Card variant="outlined" sx={{ p: 2, height: "100%" }}>
                                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                                            <CheckCircle color="primary" sx={{ mt: 0.5 }} />
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight="bold">
                                                                    {getPersianValue(feature.title, "")}
                                                                </Typography>
                                                                {feature.description && (
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                        {getPersianValue(feature.description, "")}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Stack>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}

                                {/* Technologies */}
                                {previewService.technologies && previewService.technologies.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            تکنولوژی‌ها
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                                            {previewService.technologies.map((tech, index) => (
                                                <Chip 
                                                    key={index}
                                                    label={tech.name || getPersianValue(tech.description, "")}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Deliverables */}
                                {previewService.deliverables && previewService.deliverables.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            خروجی‌ها
                                        </Typography>
                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                            {previewService.deliverables.map((deliverable, index) => (
                                                <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                                                    <CheckCircle color="success" sx={{ mt: 0.5, fontSize: 20 }} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {getPersianValue(deliverable.title, "")}
                                                        </Typography>
                                                        {deliverable.description && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {getPersianValue(deliverable.description, "")}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Gallery */}
                                {previewService.gallery && previewService.gallery.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            گالری تصاویر
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            {previewService.gallery.map((image, index) => (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                                    <Box
                                                        component="img"
                                                        src={image.url}
                                                        alt={getPersianValue(image.alt, "")}
                                                        sx={{
                                                            width: "100%",
                                                            height: 200,
                                                            objectFit: "cover",
                                                            borderRadius: 2,
                                                            border: "1px solid",
                                                            borderColor: "divider"
                                                        }}
                                                    />
                                                    {image.caption && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                                            {getPersianValue(image.caption, "")}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}

                                <Divider sx={{ my: 3 }} />

                                {/* Footer Info */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        تاریخ ایجاد: {formatDate(previewService.createdAt)}
                                    </Typography>
                                    {previewService.status && (
                                        <Chip 
                                            label={previewService.status === "active" ? "فعال" : "غیرفعال"} 
                                            size="small"
                                            color={previewService.status === "active" ? "success" : "default"}
                                        />
                                    )}
                                </Box>
                            </Paper>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsPreviewOpen(false)}>بستن</Button>
                        {canEdit && previewService && (
                            <Button 
                                variant="contained" 
                                onClick={() => {
                                    setIsPreviewOpen(false);
                                    handleEdit(previewService);
                                }}
                            >
                                ویرایش خدمت
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
