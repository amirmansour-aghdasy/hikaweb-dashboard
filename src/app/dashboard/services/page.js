"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Rating } from "@mui/material";
import { BusinessCenter, Edit, Delete, Visibility, Star, StarBorder, TrendingUp, AttachMoney } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ServiceForm from "@/components/forms/ServiceForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatPrice } from "@/lib/utils";

export default function ServicesPage() {
    const [editingService, setEditingService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
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
    }, [debouncedSearchTerm, statusFilter, categoryFilter]);

    const endpoint = `/services${queryParams ? `?${queryParams}` : ""}`;

    // Fetch services
    const { data: servicesData, isLoading } = useFetchData(["services", queryParams], endpoint);

    // Update service
    const updateService = useUpdateData("/services", {
        successMessage: "خدمت با موفقیت به‌روزرسانی شد",
    });

    // Delete service
    const deleteService = useDeleteData("/services", {
        successMessage: "خدمت با موفقیت حذف شد",
    });

    const columns = [
        {
            field: "icon",
            headerName: "آیکون",
            width: 80,
            render: (row) => (
                <Avatar src={row.icon || row.featuredImage} sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
                    <BusinessCenter />
                </Avatar>
            ),
        },
        {
            field: "name",
            headerName: "نام خدمت",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.name?.fa}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.name?.en}
                    </Typography>
                    {row.shortDescription?.fa && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {row.shortDescription.fa.substring(0, 60)}...
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "categories",
            headerName: "دسته‌بندی",
            width: 150,
            render: (row) => (
                <Stack direction="column" spacing={0.5}>
                    {row.categories?.slice(0, 2).map((category, index) => (
                        <Chip key={index} label={category.name?.fa || category.name} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                    ))}
                </Stack>
            ),
        },
        {
            field: "pricing",
            headerName: "قیمت",
            width: 120,
            render: (row) => (
                <Box>
                    {row.pricing?.isCustom ? (
                        <Chip label="سفارشی" size="small" color="info" />
                    ) : row.pricing?.startingPrice ? (
                        <Typography variant="body2">{formatPrice(row.pricing.startingPrice, row.pricing.currency)}</Typography>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            قیمت ندارد
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "popularity",
            headerName: "محبوبیت",
            width: 120,
            render: (row) => (
                <Box>
                    {row.isPopular && <Chip label="محبوب" size="small" color="secondary" icon={<Star sx={{ fontSize: "12px !important" }} />} />}
                    <Typography variant="caption" display="block">
                        Order: {row.orderIndex || 0}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "duration",
            headerName: "مدت زمان",
            width: 100,
            render: (row) => <Typography variant="caption">{row.duration?.min && row.duration?.max ? `${row.duration.min}-${row.duration.max} روز` : row.duration?.description?.fa || "-"}</Typography>,
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 100,
            type: "status",
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 120,
            render: (row) => <Typography variant="caption">{formatDate(row.createdAt)}</Typography>,
        },
    ];

    const handleEdit = (service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleDelete = (service) => {
        if (window.confirm("آیا از حذف این خدمت اطمینان دارید؟")) {
            deleteService.mutate(service._id);
        }
    };

    const handleTogglePopular = (service) => {
        updateService.mutate({
            id: service._id,
            data: { isPopular: !service.isPopular },
        });
    };

    const handleAdd = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveService = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    const customActions = [
        {
            label: "مشاهده",
            icon: <Visibility />,
            onClick: (service) => {
                window.open(`/services/${service.slug?.fa || service.slug}`, "_blank");
            },
        },
        {
            label: "محبوب",
            icon: (service) => (service.isPopular ? <Star /> : <StarBorder />),
            onClick: handleTogglePopular,
            color: (service) => (service.isPopular ? "secondary" : "default"),
        },
        {
            label: "حذف",
            icon: <Delete />,
            onClick: handleDelete,
            color: "error",
        },
    ];

    const filters = [
        {
            key: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت خدمات
                    </Typography>
                    <Button variant="contained" startIcon={<BusinessCenter />} onClick={handleAdd} size="large">
                        خدمت جدید
                    </Button>
                </Box>

                <DataTable
                    title="لیست خدمات"
                    data={servicesData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={servicesData?.pagination}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در خدمات (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={customActions}
                    filters={filters}
                />

                {/* Service Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "ویرایش خدمت" : "ایجاد خدمت جدید"} maxWidth="lg" fullWidth>
                    <ServiceForm service={editingService} onSave={handleSaveService} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}
