"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Rating, LinearProgress } from "@mui/material";
import { Work, Edit, Delete, Visibility, Star, StarBorder, Business, Schedule, AttachMoney, TrendingUp } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import PortfolioForm from "@/components/forms/PortfolioForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

export default function PortfolioPage() {
    const [editingProject, setEditingProject] = useState(null);
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

    const endpoint = `/portfolio${queryParams ? `?${queryParams}` : ""}`;

    // Fetch portfolio
    const { data: portfolioData, isLoading } = useFetchData(["portfolio", queryParams], endpoint);

    // Update portfolio
    const updateProject = useUpdateData("/portfolio", {
        successMessage: "پروژه با موفقیت به‌روزرسانی شد",
    });

    // Delete portfolio
    const deleteProject = useDeleteData("/portfolio", {
        successMessage: "پروژه با موفقیت حذف شد",
    });

    const columns = [
        {
            field: "featuredImage",
            headerName: "تصویر",
            width: 80,
            render: (row) => (
                <Avatar src={row.featuredImage} variant="rounded" sx={{ width: 40, height: 40 }}>
                    <Work />
                </Avatar>
            ),
        },
        {
            field: "title",
            headerName: "عنوان پروژه",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.title?.fa}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.title?.en}
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
            field: "client",
            headerName: "مشتری",
            width: 150,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={row.client?.logo} sx={{ width: 24, height: 24 }}>
                        <Business />
                    </Avatar>
                    <Box>
                        <Typography variant="caption" fontWeight="bold">
                            {row.client?.name}
                        </Typography>
                        {row.client?.industry?.fa && (
                            <Typography variant="caption" display="block" color="text.secondary">
                                {row.client.industry.fa}
                            </Typography>
                        )}
                    </Box>
                </Box>
            ),
        },
        {
            field: "services",
            headerName: "خدمات",
            width: 150,
            render: (row) => (
                <Stack direction="column" spacing={0.5}>
                    {row.services?.slice(0, 2).map((service, index) => (
                        <Chip key={index} label={service.name?.fa || service.name} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                    ))}
                    {row.services?.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                            +{row.services.length - 2} بیشتر
                        </Typography>
                    )}
                </Stack>
            ),
        },
        {
            field: "project",
            headerName: "جزئیات پروژه",
            width: 150,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        <Schedule sx={{ fontSize: 12, mr: 0.5 }} />
                        {row.project?.duration} روز
                    </Typography>
                    <Typography variant="caption" display="block">
                        <AttachMoney sx={{ fontSize: 12, mr: 0.5 }} />
                        {row.project?.budget || "نامشخص"}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                        {formatDate(row.project?.completedAt)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "performance",
            headerName: "عملکرد",
            width: 120,
            render: (row) => (
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                        <Typography variant="caption">👀</Typography>
                        <Typography variant="caption">{row.views || 0}</Typography>
                    </Box>
                    {row.testimonial?.rating && <Rating value={row.testimonial.rating} size="small" readOnly />}
                    {row.isFeatured && <Chip label="ویژه" size="small" color="secondary" icon={<Star sx={{ fontSize: "12px !important" }} />} />}
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

    const handleEdit = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleDelete = (project) => {
        if (window.confirm("آیا از حذف این پروژه اطمینان دارید؟")) {
            deleteProject.mutate(project._id);
        }
    };

    const handleToggleFeatured = (project) => {
        updateProject.mutate({
            id: project._id,
            data: { isFeatured: !project.isFeatured },
        });
    };

    const handleAdd = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveProject = () => {
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const customActions = [
        {
            label: "مشاهده",
            icon: <Visibility />,
            onClick: (project) => {
                window.open(`/portfolio/${project.slug?.fa || project.slug}`, "_blank");
            },
        },
        {
            label: "ویژه",
            icon: (project) => (project.isFeatured ? <Star /> : <StarBorder />),
            onClick: handleToggleFeatured,
            color: (project) => (project.isFeatured ? "secondary" : "default"),
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
                    مدیریت نمونه کارها
                </Typography>
                <Button variant="contained" startIcon={<Work />} onClick={handleAdd} size="large">
                    پروژه جدید
                </Button>
            </Box>

            <DataTable
                title="لیست نمونه کارها"
                data={portfolioData?.data || []}
                columns={columns}
                loading={isLoading}
                pagination={portfolioData?.pagination}
                onSearch={handleSearch}
                onEdit={handleEdit}
                onAdd={handleAdd}
                searchPlaceholder="جستجو در پروژه‌ها (حداقل 3 کاراکتر)..."
                enableSelection={true}
                customActions={customActions}
                filters={filters}
            />

            {/* Portfolio Form Modal */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProject ? "ویرایش پروژه" : "ایجاد پروژه جدید"} maxWidth="lg" fullWidth>
                <PortfolioForm project={editingProject} onSave={handleSaveProject} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </Box>
    </Layout>
    );
}
