"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Tooltip, Avatar } from "@mui/material";
import { Article, Edit, Delete, Visibility, Publish, UnpublishedSharp, Star, StarBorder, Language } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ArticleForm from "@/components/forms/ArticleForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

export default function ArticlesPage() {
    const [editingArticle, setEditingArticle] = useState(null);
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
            params.append("isPublished", statusFilter === "published");
        }
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, categoryFilter]);

    const endpoint = `/articles${queryParams ? `?${queryParams}` : ""}`;

    // Fetch articles
    const { data: articlesData, isLoading } = useFetchData(["articles", queryParams], endpoint);

    // Update article
    const updateArticle = useUpdateData("/articles", {
        successMessage: "مقاله با موفقیت به‌روزرسانی شد",
    });

    // Delete article
    const deleteArticle = useDeleteData("/articles", {
        successMessage: "مقاله با موفقیت حذف شد",
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
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.title?.fa}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.title?.en}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "author",
            headerName: "نویسنده",
            width: 120,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={row.author?.avatar} sx={{ width: 24, height: 24 }}>
                        {row.author?.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="caption">{row.author?.name}</Typography>
                </Box>
            ),
        },
        {
            field: "categories",
            headerName: "دسته‌بندی",
            width: 150,
            render: (row) => (
                <Stack direction="row" spacing={0.5}>
                    {row.categories?.slice(0, 2).map((category, index) => (
                        <Chip key={index} label={category.name?.fa || category.name} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                    ))}
                    {row.categories?.length > 2 && <Chip label={`+${row.categories.length - 2}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />}
                </Stack>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 100,
            render: (row) => (
                <Stack spacing={0.5}>
                    <Chip label={row.isPublished ? "منتشر شده" : "پیش‌نویس"} size="small" color={row.isPublished ? "success" : "warning"} variant={row.isPublished ? "filled" : "outlined"} />
                    {row.isFeatured && <Chip label="ویژه" size="small" color="secondary" icon={<Star sx={{ fontSize: "12px !important" }} />} />}
                </Stack>
            ),
        },
        {
            field: "metrics",
            headerName: "آمار",
            width: 100,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        👀 {row.views || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                        💬 {row.commentsCount || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                        👍 {row.likes || 0}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "language",
            headerName: "زبان",
            width: 80,
            render: (row) => (
                <Stack direction="row" spacing={0.5}>
                    {row.title?.fa && <Chip label="FA" size="small" variant="outlined" />}
                    {row.title?.en && <Chip label="EN" size="small" variant="outlined" />}
                </Stack>
            ),
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 120,
            render: (row) => <Typography variant="caption">{formatDate(row.createdAt)}</Typography>,
        },
        {
            field: "updatedAt",
            headerName: "آخرین ویرایش",
            width: 120,
            render: (row) => <Typography variant="caption">{formatDate(row.updatedAt)}</Typography>,
        },
    ];

    const handleEdit = (article) => {
        setEditingArticle(article);
        setIsModalOpen(true);
    };

    const handleDelete = (article) => {
        if (window.confirm("آیا از حذف این مقاله اطمینان دارید؟")) {
            deleteArticle.mutate(article._id);
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
        setEditingArticle(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveArticle = () => {
        setIsModalOpen(false);
        setEditingArticle(null);
    };

    const customActions = [
        {
            label: "مشاهده",
            icon: <Visibility />,
            onClick: (article) => {
                window.open(`/articles/${article.slug?.fa || article.slug}`, "_blank");
            },
        },
        {
            label: "تغییر انتشار",
            icon: (article) => (article.isPublished ? <UnpublishedSharp /> : <Publish />),
            onClick: handleTogglePublish,
            color: (article) => (article.isPublished ? "warning" : "success"),
        },
        {
            label: "ویژه",
            icon: (article) => (article.isFeatured ? <Star /> : <StarBorder />),
            onClick: handleToggleFeatured,
            color: (article) => (article.isFeatured ? "secondary" : "default"),
        },
        {
            label: "حذف",
            icon: <Delete />,
            onClick: handleDelete,
            color: "error",
        },
    ];

    // Filters for the data table
    const filters = [
        {
            key: "status",
            label: "وضعیت انتشار",
            value: statusFilter,
            onChange: setStatusFilter,
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
            onChange: setCategoryFilter,
            options: [
                { value: "all", label: "همه دسته‌ها" },
                // This would be populated from categories API
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت مقالات
                    </Typography>
                    <Button variant="contained" startIcon={<Article />} onClick={handleAdd} size="large">
                        مقاله جدید
                    </Button>
                </Box>

                <DataTable
                    title="لیست مقالات"
                    data={articlesData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={articlesData?.pagination}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در مقالات (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={customActions}
                    filters={filters}
                    emptyStateProps={{
                        title: "مقاله‌ای یافت نشد",
                        description: "هنوز مقاله‌ای ایجاد نشده است. اولین مقاله خود را بنویسید!",
                        action: {
                            label: "نوشتن مقاله جدید",
                            onClick: handleAdd,
                        },
                    }}
                />

                {/* Article Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingArticle ? "ویرایش مقاله" : "نوشتن مقاله جدید"} maxWidth="lg" fullWidth>
                    <ArticleForm article={editingArticle} onSave={handleSaveArticle} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}
