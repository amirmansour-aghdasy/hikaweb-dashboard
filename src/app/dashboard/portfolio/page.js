"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Work, Star, StarBorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import PortfolioForm from "@/components/forms/PortfolioForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue } from "@/lib/utils";

export default function PortfolioPage() {
    const [editingProject, setEditingProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("portfolio");

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

    const endpoint = `/portfolio?${queryParams}`;

    // Fetch portfolio
    const { data: portfolioData, isLoading } = useFetchData(["portfolio", queryParams], endpoint);

    // Update portfolio
    const updateProject = useUpdateData("/portfolio", {
        successMessage: "پروژه با موفقیت به‌روزرسانی شد",
        queryKey: "portfolio",
    });

    // Delete portfolio
    const deleteProject = useDeleteData("/portfolio", {
        successMessage: "پروژه با موفقیت حذف شد",
        queryKey: "portfolio",
    });

    const columns = [
        {
            field: "featuredImage",
            headerName: "تصویر",
            width: 80,
            render: (row) => (
                <Avatar src={row.featuredImage} variant="rounded" sx={{ width: 40, height: 40, mx: "auto" }}>
                    <Work />
                </Avatar>
            ),
            align: "center"
        },
        {
            field: "title",
            headerName: "عنوان پروژه",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {getPersianValue(row.title, "-")}
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
            field: "client",
            headerName: "مشتری",
            width: 150,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.client?.name || "-"}
                    </Typography>
                    {row.client?.industry && (
                        <Typography variant="caption" color="text.secondary">
                            {getPersianValue(row.client.industry, "-")}
                        </Typography>
                    )}
                </Box>
            ),
            align: "center"
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

    const handleEdit = (project) => {
        if (!canEdit) return;
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleDelete = (project) => {
        if (!canDelete) return;
        setProjectToDelete(project);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (projectToDelete) {
            deleteProject.mutate(projectToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setProjectToDelete(null);
                },
            });
        }
    };

    const handleView = (project) => {
        if (!canView) return;
        const slug = project.slug?.fa || project.slug;
        if (slug) {
            window.open(`/portfolio/${slug}`, "_blank");
        }
    };

    const handleToggleFeatured = (project) => {
        updateProject.mutate({
            id: project._id,
            data: { isFeatured: !project.isFeatured },
        });
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingProject(null);
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

    const handleSaveProject = () => {
        setIsModalOpen(false);
        setEditingProject(null);
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
            label: "ویژه",
            icon: (project) => (project.isFeatured ? <Star /> : <StarBorder />),
            onClick: handleToggleFeatured,
            color: (project) => (project.isFeatured ? "secondary" : "default"),
            permission: canEdit,
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت نمونه کارها
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Work />} onClick={handleAdd} size="large">
                            پروژه جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست پروژه‌ها"
                    data={portfolioData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={portfolioData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onView={canView ? handleView : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در پروژه‌ها (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "پروژه‌ای یافت نشد",
                        description: "هنوز پروژه‌ای ایجاد نشده است. اولین پروژه خود را ایجاد کنید!",
                        action: canCreate
                            ? {
                                  label: "ایجاد پروژه جدید",
                                  onClick: handleAdd,
                              }
                            : undefined,
                    }}
                />

                {/* Portfolio Form Modal */}
                <Modal
                    open={isModalOpen}
                    onClose={handleSaveProject}
                    title={editingProject ? "ویرایش پروژه" : "ایجاد پروژه جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <PortfolioForm project={editingProject} onSave={handleSaveProject} onCancel={handleSaveProject} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف پروژه <strong>{getPersianValue(projectToDelete?.title, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteProject.isPending}
                        >
                            {deleteProject.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
