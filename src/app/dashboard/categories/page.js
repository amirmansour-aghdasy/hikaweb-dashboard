"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, IconButton, Tooltip, Card, CardContent, Grid } from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import { Category, Edit, Delete, Add, ExpandMore, ChevronRight, Folder, FolderOpen, ColorLens, Reorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import CategoryForm from "@/components/forms/CategoryForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

export default function CategoriesPage() {
    const [editingCategory, setEditingCategory] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'tree'

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, typeFilter]);

    const endpoint = `/categories${queryParams ? `?${queryParams}` : ""}`;

    // Fetch categories
    const { data: categoriesData, isLoading } = useFetchData(["categories", queryParams], endpoint);

    // Update category
    const updateCategory = useUpdateData("/categories", {
        successMessage: "دسته‌بندی با موفقیت به‌روزرسانی شد",
    });

    const handleToggleStatus = (category) => {
        const newStatus = category.status === "active" ? "inactive" : "active";
        updateCategory.mutate({
            id: category._id,
            data: { status: newStatus },
        });
    };

    // Delete category
    const deleteCategory = useDeleteData("/categories", {
        successMessage: "دسته‌بندی با موفقیت حذف شد",
    });

    const columns = [
        {
            field: "icon",
            headerName: "آیکون",
            width: 80,
            render: (row) => (
                <Avatar
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: row.color || "primary.main",
                        fontSize: "1rem",
                    }}
                >
                    {row.icon ? <span style={{ fontSize: "16px" }}>{row.icon}</span> : <Category />}
                </Avatar>
            ),
            align: "center",
        },
        {
            field: "name",
            headerName: "نام دسته‌بندی",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.name?.fa}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.name?.en}
                    </Typography>
                    {row.description?.fa && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {row.description.fa.substring(0, 60)}...
                        </Typography>
                    )}
                </Box>
            ),
            align: "left",
        },
        {
            field: "type",
            headerName: "نوع",
            width: 120,
            render: (row) => {
                const typeLabels = {
                    article: "مقاله",
                    service: "خدمت",
                    portfolio: "نمونه کار",
                    general: "عمومی",
                };
                return <Chip label={typeLabels[row.type] || row.type} size="small" color="primary" variant="outlined" />;
            },
            align: "center",
        },
        {
            field: "parent",
            headerName: "دسته والد",
            width: 150,
            render: (row) => (row.parent ? <Typography variant="caption">{row.parent.name?.fa || row.parent.name}</Typography> : <Chip label="دسته اصلی" size="small" variant="outlined" />),
            align: "center",
        },
        {
            field: "stats",
            headerName: "آمار",
            width: 100,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        📄 {row.itemCount || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                        📁 {row.childrenCount || 0}
                    </Typography>
                </Box>
            ),
            align: "center",
        },
        {
            field: "order",
            headerName: "ترتیب",
            width: 80,
            render: (row) => <Typography variant="caption">{row.order || 0}</Typography>,
            align: "center",
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 100,
            type: "status",
            align: "center",
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 120,
            render: (row) => <Typography variant="caption">{formatDate(row.createdAt)}</Typography>,
            align: "center",
        },
    ];

    const handleEdit = (category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleDelete = (category) => {
        if (category.childrenCount > 0) {
            toast.error("ابتدا زیردسته‌ها را حذف کنید");
            return;
        }

        if (window.confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) {
            deleteCategory.mutate(category._id);
        }
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveCategory = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const customActions = [
        {
            label: "تغییر وضعیت",
            icon: <Edit />,
            onClick: handleToggleStatus,
            color: "warning",
        },
        {
            label: "ویرایش",
            icon: <Edit />,
            onClick: handleEdit,
            color: "primary",
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
            key: "type",
            label: "نوع دسته‌بندی",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: "all", label: "همه انواع" },
                { value: "article", label: "مقالات" },
                { value: "service", label: "خدمات" },
                { value: "portfolio", label: "نمونه کارها" },
                { value: "general", label: "عمومی" },
            ],
        },
    ];

    // Tree view component for hierarchical display
    const CategoryTree = ({ categories }) => {
        const buildTree = (items, parentId = null) => {
            return items
                .filter((item) => item.parent?._id === parentId || (!item.parent && !parentId))
                .map((item) => ({
                    ...item,
                    children: buildTree(items, item._id),
                }));
        };

        const tree = buildTree(categories || []);

        const renderTreeItems = (nodes) => {
            return nodes.map((node) => (
                <TreeItem
                    key={node._id}
                    itemId={node._id}
                    label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                            <Avatar
                                sx={{
                                    width: 24,
                                    height: 24,
                                    bgcolor: node.color || "primary.main",
                                    fontSize: "12px",
                                }}
                            >
                                {node.icon ? <span style={{ fontSize: "12px" }}>{node.icon}</span> : <Category />}
                            </Avatar>
                            <Typography variant="body2">{node.name?.fa}</Typography>
                            <Chip label={node.itemCount || 0} size="small" />
                            <Box sx={{ ml: "auto" }}>
                                <IconButton size="small" onClick={() => handleEdit(node)}>
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDelete(node)}>
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    }
                >
                    {node.children && renderTreeItems(node.children)}
                </TreeItem>
            ));
        };

        return (
            <SimpleTreeView
                slots={{
                    collapseIcon: ExpandMore,
                    expandIcon: ChevronRight,
                }}
                sx={{ flexGrow: 1, overflowY: "auto" }}
            >
                {renderTreeItems(tree)}
            </SimpleTreeView>
        );
    };

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            مدیریت دسته‌بندی‌ها
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            سازماندهی محتوا با دسته‌بندی‌های مختلف
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <Button variant={viewMode === "table" ? "contained" : "outlined"} onClick={() => setViewMode("table")} size="small">
                            جدول
                        </Button>
                        <Button variant={viewMode === "tree" ? "contained" : "outlined"} onClick={() => setViewMode("tree")} size="small">
                            درختی
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                            دسته‌بندی جدید
                        </Button>
                    </Stack>
                </Box>

                {viewMode === "table" ? (
                    <DataTable
                        title="لیست دسته‌بندی‌ها"
                        data={categoriesData?.data.categories || []}
                        columns={columns}
                        loading={isLoading}
                        pagination={categoriesData?.pagination}
                        onSearch={handleSearch}
                        onEdit={handleEdit}
                        onAdd={handleAdd}
                        searchPlaceholder="جستجو در دسته‌بندی‌ها (حداقل 3 کاراکتر)..."
                        enableSelection={true}
                        customActions={customActions}
                        filters={filters}
                    />
                ) : (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                نمای درختی دسته‌بندی‌ها
                            </Typography>
                            <CategoryTree categories={categoriesData?.data.categories || []} />
                        </CardContent>
                    </Card>
                )}

                {/* Category Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"} maxWidth="lg" fullWidth>
                    <CategoryForm category={editingCategory} onSave={handleSaveCategory} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}
