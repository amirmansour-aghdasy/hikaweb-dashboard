"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Article, Publish, UnpublishedSharp, Star, StarBorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ArticleForm from "@/components/forms/ArticleForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber } from "@/lib/utils";

export default function ArticlesPage({ params = {} }) {
    const [editingArticle, setEditingArticle] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("articles");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            params.append("isPublished", statusFilter === "published");
        }
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, categoryFilter, page, limit]);

    const endpoint = `/articles?${queryParams}`;

    // Fetch articles
    const { data: articlesData, isLoading } = useFetchData(["articles", queryParams], endpoint);

    // Update article
    const updateArticle = useUpdateData("/articles", {
        successMessage: "مقاله با موفقیت به‌روزرسانی شد",
        queryKey: "articles",
    });

    // Delete article
    const deleteArticle = useDeleteData("/articles", {
        successMessage: "مقاله با موفقیت حذف شد",
        queryKey: "articles",
    });

    const columns = [
        {
            field: "featuredImage",
            headerName: "تصویر",
            width: 80,
            render: (row) => (
                <Avatar src={row.featuredImage} variant="rounded" sx={{ width: 40, height: 40 }}>
                    <Article />
                </Avatar>
            ),
        },
        {
            field: "title",
            headerName: "عنوان",
            flex: 2,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold">
                    {getPersianValue(row.title, "-")}
                </Typography>
            ),
        },
        {
            field: "author",
            headerName: "نویسنده",
            width: 150,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={row.author?.avatar} sx={{ width: 24, height: 24 }}>
                        {row.author?.name?.charAt(0) || "?"}
                    </Avatar>
                    <Typography variant="caption">{row.author?.name || "-"}</Typography>
                </Box>
            ),
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
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 140,
            render: (row) => (
                <Stack spacing={0.5}>
                    <Chip
                        label={row.isPublished ? "منتشر شده" : "پیش‌نویس"}
                        size="small"
                        color={row.isPublished ? "success" : "warning"}
                        variant={row.isPublished ? "filled" : "outlined"}
                    />
                    {row.isFeatured && (
                        <Chip
                            label="ویژه"
                            size="small"
                            color="secondary"
                            icon={<Star sx={{ fontSize: "12px !important" }} />}
                        />
                    )}
                </Stack>
            ),
        },
        {
            field: "metrics",
            headerName: "آمار",
            width: 120,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        👀 {formatNumber(row.views || 0)}
                    </Typography>
                    <Typography variant="caption" display="block">
                        💬 {formatNumber(row.commentsCount || 0)}
                    </Typography>
                    <Typography variant="caption" display="block">
                        👍 {formatNumber(row.likes || 0)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            type: "date",
        },
    ];

    const handleEdit = (article) => {
        if (!canEdit) return;
        setEditingArticle(article);
        setIsModalOpen(true);
    };

    const handleDelete = (article) => {
        if (!canDelete) return;
        setArticleToDelete(article);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (articleToDelete) {
            deleteArticle.mutate(articleToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setArticleToDelete(null);
                },
            });
        }
    };

    const handleView = (article) => {
        if (!canView) return;
        const slug = article.slug?.fa || article.slug;
        if (slug) {
            window.open(`/articles/${slug}`, "_blank");
        }
    };

    const handleTogglePublish = (article) => {
        updateArticle.mutate({
            id: article._id,
            data: { isPublished: !article.isPublished },
        });
    };

    const handleToggleFeatured = (article) => {
        updateArticle.mutate({
            id: article._id,
            data: { isFeatured: !article.isFeatured },
        });
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingArticle(null);
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

    const handleSaveArticle = () => {
        setIsModalOpen(false);
        setEditingArticle(null);
    };

    // Filters for the data table
    const filters = [
        {
            key: "status",
            label: "وضعیت انتشار",
            value: statusFilter,
            onChange: (value) => {
                setStatusFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه" },
                { value: "published", label: "منتشر شده" },
                { value: "draft", label: "پیش‌نویس" },
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
            label: "تغییر انتشار",
            icon: (article) => (article.isPublished ? <UnpublishedSharp /> : <Publish />),
            onClick: handleTogglePublish,
            color: (article) => (article.isPublished ? "warning" : "success"),
            permission: canEdit,
        },
        {
            label: "ویژه",
            icon: (article) => (article.isFeatured ? <Star /> : <StarBorder />),
            onClick: handleToggleFeatured,
            color: (article) => (article.isFeatured ? "secondary" : "default"),
            permission: canEdit,
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت مقالات
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Article />} onClick={handleAdd} size="large">
                            مقاله جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست مقالات"
                    data={articlesData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={articlesData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onView={canView ? handleView : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در مقالات (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "مقاله‌ای یافت نشد",
                        description: "هنوز مقاله‌ای ایجاد نشده است. اولین مقاله خود را بنویسید!",
                        action: canCreate
                            ? {
                                  label: "نوشتن مقاله جدید",
                                  onClick: handleAdd,
                              }
                            : undefined,
                    }}
                />

                {/* Article Form Modal */}
                <Modal
                    open={isModalOpen}
                    onClose={handleSaveArticle}
                    title={editingArticle ? "ویرایش مقاله" : "نوشتن مقاله جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <ArticleForm article={editingArticle} onSave={handleSaveArticle} onCancel={handleSaveArticle} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف مقاله <strong>{getPersianValue(articleToDelete?.title, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteArticle.isPending}
                        >
                            {deleteArticle.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
