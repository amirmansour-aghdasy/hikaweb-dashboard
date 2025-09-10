"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Rating, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { Comment, CheckCircle, Cancel, Delete, Reply, Report, Person, Article, ThumbUp, ThumbDown, Visibility } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CommentsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);
    const [replyText, setReplyText] = useState("");

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData, useCreateData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            params.append("status", statusFilter);
        }
        if (typeFilter !== "all") {
            params.append("referenceType", typeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, typeFilter]);

    const endpoint = `/comments${queryParams ? `?${queryParams}` : ""}`;

    // Fetch comments
    const { data: commentsData, isLoading } = useFetchData(["comments", queryParams], endpoint);

    // Update comment
    const updateComment = useUpdateData("/comments", {
        successMessage: "نظر با موفقیت به‌روزرسانی شد",
    });

    // Delete comment
    const deleteComment = useDeleteData("/comments", {
        successMessage: "نظر با موفقیت حذف شد",
    });

    // Reply to comment
    const replyToComment = useCreateData("/api/v1/comments", {
        successMessage: "پاسخ با موفقیت ارسال شد",
    });

    const columns = [
        {
            field: "author",
            headerName: "نویسنده",
            width: 150,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={row.author?.avatar} sx={{ width: 32, height: 32 }}>
                        {row.author?.name?.charAt(0) || row.guestName?.charAt(0) || <Person />}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="bold">
                            {row.author?.name || row.guestName || "ناشناس"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {row.author?.email || row.guestEmail}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: "createdAt",
            headerName: "تاریخ ارسال",
            width: 120,
            render: (row) => <Typography variant="caption">{formatDate(row.createdAt)}</Typography>,
        },
    ];

    const handleApprove = (comment) => {
        updateComment.mutate({
            id: comment._id,
            data: { status: "approved" },
        });
    };

    const handleReject = (comment) => {
        updateComment.mutate({
            id: comment._id,
            data: { status: "rejected" },
        });
    };

    const handleMarkAsSpam = (comment) => {
        updateComment.mutate({
            id: comment._id,
            data: { status: "spam" },
        });
    };

    const handleDelete = (comment) => {
        if (window.confirm("آیا از حذف این نظر اطمینان دارید؟")) {
            deleteComment.mutate(comment._id);
        }
    };

    const handleReply = (comment) => {
        setSelectedComment(comment);
        setReplyDialogOpen(true);
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) {
            toast.error("متن پاسخ را وارد کنید");
            return;
        }

        try {
            await replyToComment.mutateAsync({
                content: replyText,
                referenceType: selectedComment.referenceType,
                referenceId: selectedComment.referenceId._id,
                parentComment: selectedComment._id,
                status: "approved",
            });

            setReplyDialogOpen(false);
            setReplyText("");
            setSelectedComment(null);
        } catch (error) {
            toast.error("خطا در ارسال پاسخ");
        }
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const customActions = [
        {
            label: "تایید",
            icon: <CheckCircle />,
            onClick: handleApprove,
            color: "success",
            show: (comment) => comment.status !== "approved",
        },
        {
            label: "رد",
            icon: <Cancel />,
            onClick: handleReject,
            color: "warning",
            show: (comment) => comment.status !== "rejected",
        },
        {
            label: "پاسخ",
            icon: <Reply />,
            onClick: handleReply,
            color: "primary",
        },
        {
            label: "اسپم",
            icon: <Report />,
            onClick: handleMarkAsSpam,
            color: "error",
            show: (comment) => comment.status !== "spam",
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
            key: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "pending", label: "در انتظار" },
                { value: "approved", label: "تایید شده" },
                { value: "rejected", label: "رد شده" },
                { value: "spam", label: "اسپم" },
            ],
        },
        {
            key: "type",
            label: "نوع",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "article", label: "مقالات" },
                { value: "service", label: "خدمات" },
                { value: "portfolio", label: "نمونه کار" },
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت نظرات
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        بررسی و مدیریت نظرات کاربران در سایت
                    </Typography>
                </Box>

                <DataTable
                    title="لیست نظرات"
                    data={commentsData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={commentsData?.pagination}
                    onSearch={handleSearch}
                    searchPlaceholder="جستجو در نظرات (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={customActions}
                    filters={filters}
                    emptyStateProps={{
                        title: "نظری یافت نشد",
                        description: "هنوز نظری ثبت نشده است.",
                    }}
                />

                {/* Reply Dialog */}
                <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>پاسخ به نظر</DialogTitle>
                    <DialogContent>
                        {selectedComment && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    نظر اصلی:
                                </Typography>
                                <Typography variant="body2">{selectedComment.content}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    نویسنده: {selectedComment.author?.name || selectedComment.guestName}
                                </Typography>
                            </Box>
                        )}

                        <TextField fullWidth multiline rows={4} label="متن پاسخ" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="پاسخ خود را بنویسید..." />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setReplyDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleSendReply} variant="contained" disabled={!replyText.trim()}>
                            ارسال پاسخ
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
