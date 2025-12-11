"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select } from "@mui/material";
import { Email, Phone, Person, Delete, Visibility, CheckCircle, Archive } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";

const STATUS_CONFIG = {
    new: { label: "جدید", color: "error" },
    read: { label: "خوانده شده", color: "info" },
    archived: { label: "آرشیو شده", color: "default" },
};

export default function ContactMessagesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete } = usePageActions("contact-messages");

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
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, page, limit]);

    const endpoint = `/contact-messages?${queryParams}`;

    // Fetch contact messages
    const { data: messagesData, isLoading, refetch } = useFetchData(["contact-messages", queryParams], endpoint);

    // Update contact message
    const updateMessage = useUpdateData("/contact-messages", {
        successMessage: "پیام با موفقیت به‌روزرسانی شد",
        queryKey: "contact-messages",
    });

    // Delete contact message
    const deleteMessage = useDeleteData("/contact-messages", {
        successMessage: "پیام با موفقیت حذف شد",
        queryKey: "contact-messages",
    });

    const columns = [
        {
            field: "fullName",
            headerName: "نام و نام خانوادگی",
            width: 150,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.fullName}
                    </Typography>
                </Box>
            ),
            align: "left"
        },
        {
            field: "contact",
            headerName: "اطلاعات تماس",
            width: 200,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                        <Email sx={{ fontSize: 12, mr: 0.5, verticalAlign: "middle" }} />
                        {row.email}
                    </Typography>
                    <Typography variant="caption" display="block">
                        <Phone sx={{ fontSize: 12, mr: 0.5, verticalAlign: "middle" }} />
                        {row.phoneNumber}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "message",
            headerName: "پیام",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" sx={{ 
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical"
                    }}>
                        {row.message}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 130,
            render: (row) => {
                const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.new;
                return (
                    <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                        variant={row.status === "new" ? "filled" : "outlined"}
                    />
                );
            },
        },
        {
            field: "createdAt",
            headerName: "تاریخ ارسال",
            width: 150,
            type: "date",
        },
    ];

    const handleView = (message) => {
        if (!canView) return;
        setSelectedMessage(message);
        setViewDialogOpen(true);
    };

    const handleMarkAsRead = async (message) => {
        if (!canEdit) return;
        try {
            const response = await api.patch(`/contact-messages/${message._id}/read`);
            if (response.data.success) {
                toast.success("پیام به عنوان خوانده شده علامت‌گذاری شد");
                refetch();
            }
        } catch (error) {
            console.error("Error marking message as read:", error);
            toast.error("خطا در به‌روزرسانی پیام");
        }
    };

    const handleArchive = async (message) => {
        if (!canEdit) return;
        try {
            const response = await api.patch(`/contact-messages/${message._id}`, {
                status: "archived"
            });
            if (response.data.success) {
                toast.success("پیام آرشیو شد");
                refetch();
            }
        } catch (error) {
            console.error("Error archiving message:", error);
            toast.error("خطا در آرشیو کردن پیام");
        }
    };

    const handleDelete = (message) => {
        if (!canDelete) return;
        setMessageToDelete(message);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (messageToDelete) {
            deleteMessage.mutate(messageToDelete._id);
            setIsDeleteDialogOpen(false);
            setMessageToDelete(null);
        }
    };


    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    // Filters for the data table
    const filters = [
        {
            key: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: (value) => {
                setStatusFilter(value);
                setPage(1);
            },
            options: [
                { value: "all", label: "همه" },
                { value: "new", label: "جدید" },
                { value: "read", label: "خوانده شده" },
                { value: "archived", label: "آرشیو شده" },
            ],
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "خوانده شده",
            icon: <CheckCircle />,
            onClick: handleMarkAsRead,
            color: "primary",
            permission: canEdit,
            show: (message) => message.status === "new",
        },
        {
            label: "آرشیو",
            icon: <Archive />,
            onClick: handleArchive,
            color: "default",
            permission: canEdit,
            show: (message) => message.status !== "archived",
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت پیام‌های تماس با ما
                    </Typography>
                </Box>

                <DataTable
                    title="لیست پیام‌های تماس با ما"
                    data={messagesData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={messagesData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onView={canView ? handleView : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    searchPlaceholder="جستجو در پیام‌ها (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={false}
                    emptyStateProps={{
                        title: "پیامی یافت نشد",
                        description: "هنوز پیامی از طریق فرم تماس با ما ارسال نشده است.",
                    }}
                />

                {/* View Dialog */}
                <Dialog 
                    open={viewDialogOpen} 
                    onClose={() => {
                        setViewDialogOpen(false);
                        setSelectedMessage(null);
                    }}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="h6">جزئیات پیام</Typography>
                            {selectedMessage && (
                                <Chip
                                    label={STATUS_CONFIG[selectedMessage.status]?.label || "جدید"}
                                    color={STATUS_CONFIG[selectedMessage.status]?.color || "error"}
                                    size="small"
                                />
                            )}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {selectedMessage && (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        نام و نام خانوادگی
                                    </Typography>
                                    <Typography variant="body1">{selectedMessage.fullName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        ایمیل
                                    </Typography>
                                    <Typography variant="body1">
                                        <Email sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                        {selectedMessage.email}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        شماره تماس
                                    </Typography>
                                    <Typography variant="body1">
                                        <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                        {selectedMessage.phoneNumber}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        پیام
                                    </Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                                        {selectedMessage.message}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        تاریخ ارسال
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDate(selectedMessage.createdAt)}
                                    </Typography>
                                </Box>
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setViewDialogOpen(false);
                            setSelectedMessage(null);
                        }}>
                            بستن
                        </Button>
                        {selectedMessage && selectedMessage.status === "new" && canEdit && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    handleMarkAsRead(selectedMessage);
                                    setViewDialogOpen(false);
                                }}
                            >
                                علامت‌گذاری به عنوان خوانده شده
                            </Button>
                        )}
                        {selectedMessage && selectedMessage.status !== "archived" && canEdit && (
                            <Button
                                variant="outlined"
                                color="default"
                                onClick={() => {
                                    handleArchive(selectedMessage);
                                    setViewDialogOpen(false);
                                }}
                            >
                                آرشیو
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog 
                    open={isDeleteDialogOpen} 
                    onClose={() => {
                        setIsDeleteDialogOpen(false);
                        setMessageToDelete(null);
                    }}
                >
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف این پیام اطمینان دارید؟ این عمل قابل بازگشت نیست.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setMessageToDelete(null);
                        }}>
                            انصراف
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmDelete}
                        >
                            حذف
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}

