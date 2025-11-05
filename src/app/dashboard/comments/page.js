"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { Comment, CheckCircle, Cancel, Delete, Reply, Report, Person, Article } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CommentsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData, useCreateData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("comments");

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
        if (typeFilter !== "all") {
            params.append("referenceType", typeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, typeFilter, page, limit]);

    const endpoint = `/comments?${queryParams}`;

    // Fetch comments
    const { data: commentsData, isLoading } = useFetchData(["comments", queryParams], endpoint);

    // Update comment
    const updateComment = useUpdateData("/comments", {
        successMessage: "نظر با موفقیت به‌روزرسانی شد",
        queryKey: "comments",
    });

    // Delete comment
    const deleteComment = useDeleteData("/comments", {
        successMessage: "نظر با موفقیت حذف شد",
        queryKey: "comments",
    });

    // Reply to comment
    const replyToComment = useCreateData("/comments", {
        successMessage: "پاسخ با موفقیت ارسال شد",
        queryKey: "comments",
    });

    const columns = [
        {
            field: "author",
            headerName: "نویسنده",
            width: 180,
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
                            {row.author?.email || row.guestEmail || "-"}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: "content",
            headerName: "محتوای نظر",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2">{row.content?.substring(0, 100)}</Typography>
                    {row.content?.length > 100 && <Typography variant="caption">...</Typography>}
                </Box>
            ),
        },
        {
            field: "reference",
            headerName: "مرجع",
            width: 200,
            render: (row) => (
                <Box>
                    <Chip
                        label={row.referenceType === "article" ? "مقاله" : row.referenceType === "service" ? "خدمت" : row.referenceType || "-"}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                    />
                    {row.referenceId && (
                        <Typography variant="caption" display="block" color="text.secondary">
                            {getPersianValue(row.referenceId.title || row.referenceId.name, row.referenceId.title?.fa || row.referenceId.name?.fa || "-")}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 120,
            type: "status",
        },
        {
            field: "createdAt",
            headerName: "تاریخ ارسال",
            width: 150,
            type: "date",
        },
    ];

    const handleApprove = (comment) => {
        if (!canEdit) return;
        updateComment.mutate({
            id: comment._id,
            data: { status: "approved" },
        });
    };

    const handleReject = (comment) => {
        if (!canEdit) return;
        updateComment.mutate({
            id: comment._id,
            data: { status: "rejected" },
        });
    };

    const handleMarkAsSpam = (comment) => {
        if (!canEdit) return;
        updateComment.mutate({
            id: comment._id,
            data: { status: "spam" },
        });
    };

    const handleDelete = (comment) => {
        if (!canDelete) return;
        setCommentToDelete(comment);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (commentToDelete) {
            deleteComment.mutate(commentToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setCommentToDelete(null);
                },
            });
        }
    };

    const handleReply = (comment) => {
        if (!canCreate) return;
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
        setPage(1); // Reset to first page on search
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1); // Reset to first page when changing limit
    };

    // Filters for the data table
    const filters = [
        {
            key: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: (value) => {
                setStatusFilter(value);
                setPage(1); // Reset to first page on filter change
            },
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
            onChange: (value) => {
                setTypeFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه انواع" },
                { value: "article", label: "مقالات" },
                { value: "service", label: "خدمات" },
                { value: "portfolio", label: "نمونه کارها" },
            ],
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "تایید",
            icon: <CheckCircle />,
            onClick: handleApprove,
            color: "success",
            permission: canEdit,
            disabled: (comment) => comment.status === "approved",
        },
        {
            label: "رد",
            icon: <Cancel />,
            onClick: handleReject,
            color: "warning",
            permission: canEdit,
            disabled: (comment) => comment.status === "rejected",
        },
        {
            label: "پاسخ",
            icon: <Reply />,
            onClick: handleReply,
            color: "primary",
            permission: canCreate,
        },
        {
            label: "اسپم",
            icon: <Report />,
            onClick: handleMarkAsSpam,
            color: "error",
            permission: canEdit,
            disabled: (comment) => comment.status === "spam",
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت نظرات
                    </Typography>
                </Box>

                <DataTable
                    title="لیست نظرات"
                    data={commentsData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={commentsData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onDelete={canDelete ? handleDelete : undefined}
                    searchPlaceholder="جستجو در نظرات (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "نظری یافت نشد",
                        description: "هنوز نظری ثبت نشده است.",
                    }}
                />

                {/* Reply Dialog */}
                <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>پاسخ به نظر</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                نظر اصلی:
                            </Typography>
                            <Typography variant="body2" sx={{ p: 1, bgcolor: "grey.100", borderRadius: 1 }}>
                                {selectedComment?.content}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="پاسخ شما"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="متن پاسخ را اینجا بنویسید..."
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setReplyDialogOpen(false)}>انصراف</Button>
                        <Button
                            onClick={handleSendReply}
                            variant="contained"
                            disabled={!replyText.trim() || replyToComment.isPending}
                        >
                            {replyToComment.isPending ? "در حال ارسال..." : "ارسال پاسخ"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف این نظر اطمینان دارید؟
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
                            disabled={deleteComment.isPending}
                        >
                            {deleteComment.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
