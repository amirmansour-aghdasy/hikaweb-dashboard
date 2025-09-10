"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
import { Add, Edit, Delete, Visibility } from "@mui/icons-material";
import Layout from "../../../components/layout/Layout";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import { useApi } from "../../../hooks/useApi";
import { useDataStore } from "../../../store/useDataStore";
import { useUIStore } from "../../../store/useUIStore";

export default function ArticlesPage() {
    const [editingArticle, setEditingArticle] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { useFetchData, useDeleteData } = useApi();
    const { openModal, closeModal } = useUIStore();
    const { cache, filters, setFilter } = useDataStore();

    // Fetch articles
    const {
        data: articlesData,
        isLoading,
        refetch,
    } = useFetchData("articles", "/api/v1/articles", {
        updateStore: true,
        storeKey: "articles",
    });

    // Delete mutation
    const deleteArticle = useDeleteData("/api/v1/articles", {
        updateStore: true,
        storeKey: "articles",
        successMessage: "مقاله با موفقیت حذف شد",
        invalidateKeys: ["articles"],
    });

    const columns = [
        {
            field: "title.fa",
            headerName: "عنوان",
            type: "truncate",
            render: (row) => row.title?.fa || row.title?.en || "-",
        },
        {
            field: "author",
            headerName: "نویسنده",
            render: (row) => row.author?.name || "-",
        },
        {
            field: "category",
            headerName: "دسته‌بندی",
            render: (row) => row.category?.name?.fa || "-",
        },
        {
            field: "status",
            headerName: "وضعیت",
            type: "status",
        },
        {
            field: "views",
            headerName: "بازدید",
            align: "center",
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            type: "date",
        },
    ];

    const handleEdit = (article) => {
        setEditingArticle(article);
        setIsModalOpen(true);
    };

    const handleDelete = (article) => {
        if (confirm("آیا از حذف این مقاله اطمینان دارید؟")) {
            deleteArticle.mutate(article._id);
        }
    };

    const handleAdd = () => {
        setEditingArticle(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchTerm) => {
        setFilter("articles", { search: searchTerm });
    };

    return (
        <Layout>
            <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    مدیریت مقالات
                </Typography>

                <DataTable
                    title="لیست مقالات"
                    data={cache.articles.data}
                    columns={columns}
                    loading={isLoading}
                    pagination={articlesData?.pagination}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در مقالات..."
                    enableSelection={true}
                    customActions={[
                        {
                            label: "مشاهده در سایت",
                            icon: <Visibility />,
                            onClick: (row) => window.open(`/articles/${row.slug.fa}`, "_blank"),
                        },
                    ]}
                />

                {/* Article Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingArticle ? "ویرایش مقاله" : "افزودن مقاله جدید"} maxWidth="lg">
                    {/* Article Form Component would go here */}
                    <Box sx={{ p: 3 }}>
                        <Typography>فرم مقاله در اینجا قرار می‌گیرد</Typography>
                    </Box>
                </Modal>
            </Box>
        </Layout>
    );
}
