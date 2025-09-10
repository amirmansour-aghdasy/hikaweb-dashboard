"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, IconButton, Tooltip } from "@mui/material";
import { Help, Edit, Delete, Add, ExpandMore, DragIndicator, QuestionAnswer, Category, Reorder } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FAQForm from "@/components/forms/FAQForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

export default function FAQPage() {
    const [editingFAQ, setEditingFAQ] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'preview'

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, categoryFilter]);

    const endpoint = `/faq${queryParams ? `?${queryParams}` : ""}`;

    // Fetch FAQs
    const { data: faqData, isLoading } = useFetchData(["faq", queryParams], endpoint);

    // Update FAQ
    const updateFAQ = useUpdateData("/faq", {
        successMessage: "سوال با موفقیت به‌روزرسانی شد",
    });

    // Delete FAQ
    const deleteFAQ = useDeleteData("/faq", {
        successMessage: "سوال با موفقیت حذف شد",
    });

    const columns = [
        {
            field: "question",
            headerName: "سوال",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.question?.fa}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.question?.en}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "answer",
            headerName: "پاسخ",
            flex: 2,
            render: (row) => <Typography variant="body2">{row.answer?.fa?.length > 100 ? `${row.answer.fa.substring(0, 100)}...` : row.answer?.fa}</Typography>,
        },
        {
            field: "category",
            headerName: "دسته‌بندی",
            width: 150,
            render: (row) =>
                row.category ? <Chip label={row.category.name?.fa || row.category.name} size="small" color="primary" variant="outlined" /> : <Chip label="بدون دسته" size="small" variant="outlined" />,
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
            width: 80,
            render: (row) => <Typography variant="caption">{row.viewCount || 0}</Typography>,
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

    const handleEdit = (faq) => {
        setEditingFAQ(faq);
        setIsModalOpen(true);
    };

    const handleDelete = (faq) => {
        if (window.confirm("آیا از حذف این سوال اطمینان دارید؟")) {
            deleteFAQ.mutate(faq._id);
        }
    };

    const handleAdd = () => {
        setEditingFAQ(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveFAQ = () => {
        setIsModalOpen(false);
        setEditingFAQ(null);
    };

    const customActions = [
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
            key: "category",
            label: "دسته‌بندی",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [{ value: "all", label: "همه دسته‌ها" }],
        },
    ];

    // FAQ Preview Component
    const FAQPreview = ({ faqs }) => (
        <Stack spacing={2}>
            {faqs.map((faq, index) => (
                <Card key={faq._id}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                                <QuestionAnswer sx={{ mr: 1, color: "primary.main" }} />
                                <Typography variant="body1" sx={{ flex: 1 }}>
                                    {faq.question?.fa}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
                                    <IconButton size="small" onClick={() => handleEdit(faq)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(faq)}>
                                        <Delete />
                                    </IconButton>
                                </Stack>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {faq.answer?.fa}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                {faq.category && <Chip label={faq.category.name?.fa} size="small" color="primary" variant="outlined" />}
                                <Chip label={`ترتیب: ${faq.order}`} size="small" variant="outlined" />
                                <Chip label={`بازدید: ${faq.viewCount || 0}`} size="small" variant="outlined" />
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
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                            سوال جدید
                        </Button>
                    </Stack>
                </Box>

                {viewMode === "table" ? (
                    <DataTable
                        title="لیست سوالات متداول"
                        data={faqData?.data || []}
                        columns={columns}
                        loading={isLoading}
                        pagination={faqData?.pagination}
                        onSearch={handleSearch}
                        onEdit={handleEdit}
                        onAdd={handleAdd}
                        searchPlaceholder="جستجو در سوالات (حداقل 3 کاراکتر)..."
                        enableSelection={true}
                        customActions={customActions}
                        filters={filters}
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
                                    <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                                        افزودن سوال جدید
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}

                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFAQ ? "ویرایش سوال" : "افزودن سوال جدید"} maxWidth="lg" fullWidth>
                    <FAQForm faq={editingFAQ} onSave={handleSaveFAQ} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}
