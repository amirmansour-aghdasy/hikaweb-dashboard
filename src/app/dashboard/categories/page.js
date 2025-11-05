"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, IconButton, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import { Category, Edit, Delete, Add, ExpandMore, ChevronRight } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import CategoryForm from "@/components/forms/CategoryForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CategoriesPage() {
    const [editingCategory, setEditingCategory] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'tree'
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("categories");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, typeFilter, page, limit]);

    const endpoint = `/categories?${queryParams}`;

    // Fetch categories
    const { data: categoriesData, isLoading } = useFetchData(["categories", queryParams], endpoint);

    // Update category
    const updateCategory = useUpdateData("/categories", {
        successMessage: "دسته‌بندی با موفقیت به‌روزرسانی شد",
        queryKey: "categories",
    });

    // Delete category
    const deleteCategory = useDeleteData("/categories", {
        successMessage: "دسته‌بندی با موفقیت حذف شد",
        queryKey: "categories",
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
                        mx: "auto"
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
                        {getPersianValue(row.name, "-")}
                    </Typography>
                    {row.description && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {getPersianValue(row.description, "").substring(0, 60)}
                            {getPersianValue(row.description, "").length > 60 ? "..." : ""}
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
            render: (row) =>
                row.parent ? (
                    <Typography variant="caption">{getPersianValue(row.parent.name, row.parent.name || "-")}</Typography>
                ) : (
                    <Chip label="دسته اصلی" size="small" variant="outlined" />
                ),
            align: "center",
        },
        {
            field: "stats",
            headerName: "آمار",
            width: 100,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        📄 {formatNumber(row.itemCount || 0)}
                    </Typography>
                    <Typography variant="caption" display="block">
                        📁 {formatNumber(row.childrenCount || 0)}
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
            width: 150,
            type: "date",
            align: "center",
        },
    ];

    const handleEdit = (category) => {
        if (!canEdit) return;
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleDelete = (category) => {
        if (!canDelete) return;
        if (category.childrenCount > 0) {
            toast.error("ابتدا زیردسته‌ها را حذف کنید");
            return;
        }
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (categoryToDelete) {
            deleteCategory.mutate(categoryToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                },
            });
        }
    };

    const handleToggleStatus = (category) => {
        const newStatus = category.status === "active" ? "inactive" : "active";
        updateCategory.mutate({
            id: category._id,
            data: { status: newStatus },
        });
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingCategory(null);
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

    const handleSaveCategory = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    // Filters for the data table
    const filters = [
        {
            key: "type",
            label: "نوع دسته‌بندی",
            value: typeFilter,
            onChange: (value) => {
                setTypeFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه انواع" },
                { value: "article", label: "مقالات" },
                { value: "service", label: "خدمات" },
                { value: "portfolio", label: "نمونه کارها" },
                { value: "general", label: "عمومی" },
            ],
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "تغییر وضعیت",
            icon: <Edit />,
            onClick: handleToggleStatus,
            color: "warning",
            permission: canEdit,
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
                            <Typography variant="body2">{getPersianValue(node.name, "-")}</Typography>
                            <Chip label={node.itemCount || 0} size="small" />
                            <Box sx={{ ml: "auto" }}>
                                {canEdit && (
                                    <IconButton size="small" onClick={() => handleEdit(node)}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                )}
                                {canDelete && (
                                    <IconButton size="small" onClick={() => handleDelete(node)}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                )}
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
                        {canCreate && (
                            <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                                دسته‌بندی جدید
                            </Button>
                        )}
                    </Stack>
                </Box>

                {viewMode === "table" ? (
                    <DataTable
                        title="لیست دسته‌بندی‌ها"
                        data={categoriesData?.data?.categories || categoriesData?.data || []}
                        columns={columns}
                        loading={isLoading}
                        pagination={categoriesData?.pagination}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        onSearch={handleSearch}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        onAdd={canCreate ? handleAdd : undefined}
                        searchPlaceholder="جستجو در دسته‌بندی‌ها (حداقل 3 کاراکتر)..."
                        enableSelection={false}
                        customActions={customActions}
                        filters={filters}
                        canView={canView}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canCreate={canCreate}
                        emptyStateProps={{
                            title: "دسته‌بندی‌ای یافت نشد",
                            description: "هنوز دسته‌بندی‌ای ایجاد نشده است. اولین دسته‌بندی خود را ایجاد کنید!",
                            action: canCreate
                                ? {
                                      label: "ایجاد دسته‌بندی جدید",
                                      onClick: handleAdd,
                                  }
                                : undefined,
                        }}
                    />
                ) : (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                نمای درختی دسته‌بندی‌ها
                            </Typography>
                            <CategoryTree categories={categoriesData?.data?.categories || categoriesData?.data || []} />
                        </CardContent>
                    </Card>
                )}

                {/* Category Form Modal */}
                <Modal
                    open={isModalOpen}
                    onClose={handleSaveCategory}
                    title={editingCategory ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <CategoryForm category={editingCategory} onSave={handleSaveCategory} onCancel={handleSaveCategory} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف دسته‌بندی <strong>{getPersianValue(categoryToDelete?.name, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteCategory.isPending}
                        >
                            {deleteCategory.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
