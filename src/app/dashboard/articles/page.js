"use client";
import { useState, useMemo, Suspense, lazy } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Paper, Divider } from "@mui/material";
import { Article, Publish, UnpublishedSharp, Star, StarBorder, Close } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber } from "@/lib/utils";

// Lazy load ArticleForm for better performance
const ArticleForm = lazy(() => import("@/components/forms/ArticleForm"));

export default function ArticlesPage({ params = {} }) {
    const [editingArticle, setEditingArticle] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState(null);
    const [previewArticle, setPreviewArticle] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("articles");

    // Fetch categories for filter
    const { data: categoriesData } = useFetchData(["categories", "article"], "/categories?type=article&status=active&limit=100");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            // Convert string to boolean for backend
            const isPublished = statusFilter === "published";
            params.append("isPublished", isPublished.toString());
        }
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, categoryFilter, page, limit]);

    const endpoint = `/articles?${queryParams}`;

    // Fetch articles with refetch capability
    const { data: articlesData, isLoading, refetch } = useFetchData(["articles", queryParams], endpoint);

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
                <Avatar src={row.featuredImage} variant="rounded" sx={{ width: 40, height: 40, mx: "auto" }}>
                    <Article />
                </Avatar>
            ),
            align: "center"
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
            align: "left"
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
            align: "center"
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
        setPreviewArticle(article);
        setIsPreviewOpen(true);
    };

    const handleTogglePublish = (article) => {
        updateArticle.mutate({
            id: article._id,
            data: { 
                isPublished: !article.isPublished,
                // Preserve other fields to avoid conflicts
                isFeatured: article.isFeatured,
            },
        });
    };

    const handleToggleFeatured = (article) => {
        updateArticle.mutate({
            id: article._id,
            data: { 
                isFeatured: !article.isFeatured,
                // Preserve other fields to avoid conflicts
                isPublished: article.isPublished,
            },
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
        // Refetch articles after save
        refetch();
    };

    // Prepare category options for filter
    const categoryOptions = useMemo(() => {
        const options = [{ value: "all", label: "همه دسته‌ها" }];
        
        if (categoriesData?.data && Array.isArray(categoriesData.data)) {
            categoriesData.data.forEach((category) => {
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
            options: categoryOptions,
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
                    <Suspense fallback={<Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>}>
                        <ArticleForm article={editingArticle} onSave={handleSaveArticle} onCancel={handleSaveArticle} />
                    </Suspense>
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

                {/* Article Preview Modal */}
                <Dialog 
                    open={isPreviewOpen} 
                    onClose={() => setIsPreviewOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", m: 0, p: 2 }}>
                        <Box component="span" sx={{ fontSize: "1.25rem", fontWeight: 500 }}>پیش‌نمایش مقاله</Box>
                        <Button
                            onClick={() => setIsPreviewOpen(false)}
                            size="small"
                            startIcon={<Close />}
                        >
                            بستن
                        </Button>
                    </DialogTitle>
                    <DialogContent dividers>
                        {previewArticle && (
                            <Paper sx={{ p: 3 }}>
                                {previewArticle.featuredImage && (
                                    <Box sx={{ mb: 3, textAlign: "center" }}>
                                        <img 
                                            src={previewArticle.featuredImage} 
                                            alt={getPersianValue(previewArticle.title, "")}
                                            style={{ maxWidth: "100%", borderRadius: 8 }}
                                        />
                                    </Box>
                                )}
                                <Typography variant="h4" gutterBottom fontWeight="bold">
                                    {getPersianValue(previewArticle.title, "بدون عنوان")}
                                </Typography>
                                {previewArticle.excerpt && (
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                        {getPersianValue(previewArticle.excerpt, "")}
                                    </Typography>
                                )}
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                    {previewArticle.categories?.map((category, index) => (
                                        <Chip 
                                            key={index} 
                                            label={getPersianValue(category?.name || category, category?.name || category || "بدون دسته‌بندی")} 
                                            size="small" 
                                        />
                                    ))}
                                </Box>
                                {previewArticle.content && (
                                    <Box 
                                        sx={{ 
                                            mt: 2,
                                            "& img": { maxWidth: "100%" },
                                            "& p": { mb: 2 }
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                            __html: getPersianValue(previewArticle.content, "") 
                                        }}
                                    />
                                )}
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary">
                                        نویسنده: {previewArticle.author?.name || "نامشخص"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        تاریخ: {formatDate(previewArticle.createdAt)}
                                    </Typography>
                                </Box>
                            </Paper>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsPreviewOpen(false)}>بستن</Button>
                        {canEdit && previewArticle && (
                            <Button 
                                variant="contained" 
                                onClick={() => {
                                    setIsPreviewOpen(false);
                                    handleEdit(previewArticle);
                                }}
                            >
                                ویرایش مقاله
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
