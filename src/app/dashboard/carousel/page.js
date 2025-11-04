"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Card, CardContent, Grid } from "@mui/material";
import { ViewCarousel, Edit, Delete, Add, Image, Visibility, Star, StarBorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import CarouselForm from "@/components/forms/CarouselForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

const POSITION_CONFIG = {
    hero: { label: "قهرمان", color: "primary" },
    featured: { label: "ویژه", color: "secondary" },
    sidebar: { label: "کناری", color: "info" },
    banner: { label: "بنر", color: "warning" },
};

export default function CarouselPage() {
    const [editingCarousel, setEditingCarousel] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [positionFilter, setPositionFilter] = useState("all");

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
        if (positionFilter !== "all") {
            params.append("position", positionFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, positionFilter]);

    const endpoint = `/carousel${queryParams ? `?${queryParams}` : ""}`;

    // Fetch carousel items
    const { data: carouselData, isLoading } = useFetchData(["carousel", queryParams], endpoint);

    // Update carousel
    const updateCarousel = useUpdateData("/carousel", {
        successMessage: "اسلاید با موفقیت به‌روزرسانی شد",
    });

    // Delete carousel
    const deleteCarousel = useDeleteData("/carousel", {
        successMessage: "اسلاید با موفقیت حذف شد",
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
                        {row.title?.fa}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.title?.en}
                    </Typography>
                    {row.subtitle?.fa && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {row.subtitle.fa}
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
            field: "link",
            headerName: "لینک",
            width: 150,
            render: (row) => (
                <Box>
                    {row.link?.url ? (
                        <Typography variant="caption" color="primary" sx={{ textDecoration: "underline", cursor: "pointer" }}>
                            {row.link.url.substring(0, 30)}...
                        </Typography>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            بدون لینک
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "order",
            headerName: "ترتیب",
            width: 80,
            render: (row) => <Typography variant="caption">{row.order || 0}</Typography>,
        },
        {
            field: "metrics",
            headerName: "آمار",
            width: 120,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        👀 {row.views || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                        🖱️ {row.clicks || 0}
                    </Typography>
                </Box>
            ),
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

    const handleEdit = (carousel) => {
        setEditingCarousel(carousel);
        setIsModalOpen(true);
    };

    const handleDelete = (carousel) => {
        if (window.confirm("آیا از حذف این اسلاید اطمینان دارید؟")) {
            deleteCarousel.mutate(carousel._id);
        }
    };

    const handleToggleActive = (carousel) => {
        updateCarousel.mutate({
            id: carousel._id,
            data: { status: carousel.status === "active" ? "inactive" : "active" },
        });
    };

    const handleAdd = () => {
        setEditingCarousel(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveCarousel = () => {
        setIsModalOpen(false);
        setEditingCarousel(null);
    };

    const customActions = [
        {
            label: "مشاهده",
            icon: <Visibility />,
            onClick: (carousel) => {
                if (carousel.link?.url) {
                    window.open(carousel.link.url, carousel.link.target || "_blank");
                }
            },
            show: (carousel) => !!carousel.link?.url,
        },
        {
            label: "تغییر وضعیت",
            icon: <Star />,
            onClick: handleToggleActive,
            color: (carousel) => (carousel.status === "active" ? "success" : "default"),
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
        {
            key: "position",
            label: "موقعیت",
            value: positionFilter,
            onChange: setPositionFilter,
            options: [
                { value: "all", label: "همه موقعیت‌ها" },
                ...Object.entries(POSITION_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                })),
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            مدیریت اسلایدرها
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            مدیریت اسلایدرها و بنرهای صفحه اصلی
                        </Typography>
                    </Box>

                    <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                        اسلاید جدید
                    </Button>
                </Box>

                <DataTable
                    title="لیست اسلایدرها"
                    data={carouselData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={carouselData?.pagination}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در اسلایدرها (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={customActions}
                    filters={filters}
                    emptyStateProps={{
                        title: "اسلایدی یافت نشد",
                        description: "هنوز اسلایدی ایجاد نشده است. اولین اسلاید خود را اضافه کنید!",
                        action: {
                            label: "افزودن اسلاید جدید",
                            onClick: handleAdd,
                        },
                    }}
                />

                {/* Carousel Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCarousel ? "ویرایش اسلاید" : "افزودن اسلاید جدید"} maxWidth="lg" fullWidth>
                    <CarouselForm carousel={editingCarousel} onSave={handleSaveCarousel} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}

