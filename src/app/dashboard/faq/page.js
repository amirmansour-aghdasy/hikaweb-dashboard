"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Help, Edit, Delete, Add, ExpandMore } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FAQForm from "@/components/forms/FAQForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber } from "@/lib/utils";

export default function FAQPage() {
    const [editingFAQ, setEditingFAQ] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [faqToDelete, setFaqToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'preview'
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("faq");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, categoryFilter, page, limit]);

    const endpoint = `/faq?${queryParams}`;

    // Fetch FAQs
    const { data: faqData, isLoading } = useFetchData(["faq", queryParams], endpoint);

    // Update FAQ
    const updateFAQ = useUpdateData("/faq", {
        successMessage: "سوال با موفقیت به‌روزرسانی شد",
        queryKey: "faq",
    });

    // Delete FAQ
    const deleteFAQ = useDeleteData("/faq", {
        successMessage: "سوال با موفقیت حذف شد",
        queryKey: "faq",
    });

    const columns = [
        {
            field: "question",
            headerName: "سوال",
            flex: 2,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold">
                    {getPersianValue(row.question, "-")}
                </Typography>
            ),
        },
        {
            field: "answer",
            headerName: "پاسخ",
            flex: 2,
            render: (row) => {
                const answer = getPersianValue(row.answer, "");
                return (
                    <Typography variant="body2">
                        {answer.length > 100 ? `${answer.substring(0, 100)}...` : answer || "-"}
                    </Typography>
                );
            },
        },
        {
            field: "category",
            headerName: "دسته‌بندی",
            width: 150,
            render: (row) =>
                row.category ? (
                    <Chip
                        label={getPersianValue(row.category.name || row.category, "-")}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                ) : (
                    <Chip label="بدون دسته" size="small" variant="outlined" />
                ),
        },
        {
            field: "order",
            headerName: "ترتیب",
            width: 80,
            render: (row) => <Typography variant="caption">{row.order || 0}</Typography>,
        },
        {
            field: "viewCount",
            headerName: "بازدید",
            width: 100,
            render: (row) => <Typography variant="caption">{formatNumber(row.viewCount || 0)}</Typography>,
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 120,
            type: "status",
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            type: "date",
        },
    ];

    const handleEdit = (faq) => {
        if (!canEdit) return;
        setEditingFAQ(faq);
        setIsModalOpen(true);
    };

    const handleDelete = (faq) => {
        if (!canDelete) return;
        setFaqToDelete(faq);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (faqToDelete) {
            deleteFAQ.mutate(faqToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setFaqToDelete(null);
                },
            });
        }
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingFAQ(null);
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

    const handleSaveFAQ = () => {
        setIsModalOpen(false);
        setEditingFAQ(null);
    };

    // Filters for the data table
    const filters = [
        {
            key: "category",
            label: "دسته‌بندی",
            value: categoryFilter,
            onChange: (value) => {
                setCategoryFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [{ value: "all", label: "همه دسته‌ها" }],
        },
    ];

    // FAQ Preview Component
    const FAQPreview = ({ faqs }) => (
        <Stack spacing={2}>
            {faqs.map((faq) => (
                <Card key={faq._id}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                                <Help sx={{ mr: 1, color: "primary.main" }} />
                                <Typography variant="body1" sx={{ flex: 1 }}>
                                    {getPersianValue(faq.question, "-")}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
                                    {canEdit && (
                                        <IconButton size="small" onClick={() => handleEdit(faq)}>
                                            <Edit />
                                        </IconButton>
                                    )}
                                    {canDelete && (
                                        <IconButton size="small" onClick={() => handleDelete(faq)}>
                                            <Delete />
                                        </IconButton>
                                    )}
                                </Stack>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {getPersianValue(faq.answer, "-")}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                {faq.category && (
                                    <Chip
                                        label={getPersianValue(faq.category.name || faq.category, "-")}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}
                                <Chip label={`ترتیب: ${faq.order || 0}`} size="small" variant="outlined" />
                                <Chip label={`بازدید: ${formatNumber(faq.viewCount || 0)}`} size="small" variant="outlined" />
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                </Card>
            ))}
        </Stack>
    );

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            مدیریت سوالات متداول
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            مدیریت سوالات و پاسخ‌های متداول سایت
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <Button variant={viewMode === "table" ? "contained" : "outlined"} onClick={() => setViewMode("table")} size="small">
                            جدول
                        </Button>
                        <Button variant={viewMode === "preview" ? "contained" : "outlined"} onClick={() => setViewMode("preview")} size="small">
                            پیش‌نمایش
                        </Button>
                        {canCreate && (
                            <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                                سوال جدید
                            </Button>
                        )}
                    </Stack>
                </Box>

                {viewMode === "table" ? (
                    <DataTable
                        title="لیست سوالات متداول"
                        data={faqData?.data || []}
                        columns={columns}
                        loading={isLoading}
                        pagination={faqData?.pagination}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        onSearch={handleSearch}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        onAdd={canCreate ? handleAdd : undefined}
                        searchPlaceholder="جستجو در سوالات (حداقل 3 کاراکتر)..."
                        enableSelection={false}
                        filters={filters}
                        canView={canView}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canCreate={canCreate}
                        emptyStateProps={{
                            title: "سوالی یافت نشد",
                            description: "هنوز سوالی ایجاد نشده است. اولین سوال خود را ایجاد کنید!",
                            action: canCreate
                                ? {
                                      label: "ایجاد سوال جدید",
                                      onClick: handleAdd,
                                  }
                                : undefined,
                        }}
                    />
                ) : (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            پیش‌نمایش سوالات متداول
                        </Typography>
                        {faqData?.data && faqData.data.length > 0 ? (
                            <FAQPreview faqs={faqData.data} />
                        ) : (
                            <Card>
                                <CardContent sx={{ textAlign: "center", py: 8 }}>
                                    <Help sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        هنوز سوالی اضافه نشده
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        اولین سوال متداول خود را اضافه کنید
                                    </Typography>
                                    {canCreate && (
                                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                                            افزودن سوال جدید
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}

                <Modal
                    open={isModalOpen}
                    onClose={handleSaveFAQ}
                    title={editingFAQ ? "ویرایش سوال" : "افزودن سوال جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <FAQForm faq={editingFAQ} onSave={handleSaveFAQ} onCancel={handleSaveFAQ} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف سوال <strong>{getPersianValue(faqToDelete?.question, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteFAQ.isPending}
                        >
                            {deleteFAQ.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
