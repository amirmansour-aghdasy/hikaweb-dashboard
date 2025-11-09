"use client";
import { useState, useMemo, useEffect } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent } from "@mui/material";
import { SupportAgent, Edit, Delete, Add, Assignment, Reply, Close, CheckCircle, Person } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import TicketForm from "@/components/forms/TicketForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, formatRelativeDate } from "@/lib/utils";

const PRIORITY_CONFIG = {
    low: { label: "کم", color: "success", icon: "🟢" },
    normal: { label: "عادی", color: "info", icon: "🔵" },
    high: { label: "بالا", color: "warning", icon: "🟡" },
    urgent: { label: "فوری", color: "error", icon: "🔴" },
};

const STATUS_CONFIG = {
    open: { label: "باز", color: "info" },
    in_progress: { label: "در حال بررسی", color: "warning" },
    waiting_customer: { label: "انتظار پاسخ مشتری", color: "secondary" },
    resolved: { label: "حل شده", color: "success" },
    closed: { label: "بسته", color: "default" },
};

export default function TicketsPage() {
    const [editingTicket, setEditingTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [statistics, setStatistics] = useState(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("tickets");

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
        if (priorityFilter !== "all") {
            params.append("priority", priorityFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, priorityFilter, page, limit]);

    const endpoint = `/tickets?${queryParams}`;

    // Fetch tickets
    const { data: ticketsData, isLoading } = useFetchData(["tickets", queryParams], endpoint);

    // Fetch statistics
    const { data: statisticsData } = useFetchData("tickets-statistics", "/tickets/stats/overview");

    useEffect(() => {
        if (statisticsData?.success && statisticsData.data) {
            setStatistics(statisticsData.data);
        }
    }, [statisticsData]);

    // Update ticket
    const updateTicket = useUpdateData("/tickets", {
        successMessage: "تیکت با موفقیت به‌روزرسانی شد",
        queryKey: "tickets",
    });

    // Delete ticket
    const deleteTicket = useDeleteData("/tickets", {
        successMessage: "تیکت با موفقیت حذف شد",
        queryKey: "tickets",
    });

    const columns = [
        {
            field: "ticketNumber",
            headerName: "شماره تیکت",
            width: 120,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold" color="primary">
                    #{row.ticketNumber}
                </Typography>
            ),
        },
        {
            field: "subject",
            headerName: "موضوع",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.subject}
                    </Typography>
                    {row.description && (
                        <Typography variant="caption" color="text.secondary">
                            {row.description.length > 60 ? `${row.description.substring(0, 60)}...` : row.description}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "customer",
            headerName: "مشتری",
            width: 180,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={row.customer?.avatar} sx={{ width: 32, height: 32 }}>
                        {row.customer?.name?.charAt(0) || <Person />}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="bold">
                            {row.customer?.name || "کاربر ناشناس"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {row.customer?.email || "-"}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: "priority",
            headerName: "اولویت",
            width: 100,
            render: (row) => {
                const config = PRIORITY_CONFIG[row.priority] || PRIORITY_CONFIG.normal;
                return (
                    <Chip
                        label={config.label}
                        size="small"
                        color={config.color}
                        icon={<span style={{ fontSize: "12px" }}>{config.icon}</span>}
                    />
                );
            },
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 150,
            render: (row) => {
                const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.open;
                return (
                    <Chip
                        label={config.label}
                        size="small"
                        color={config.color}
                        variant={row.status === "resolved" || row.status === "closed" ? "filled" : "outlined"}
                    />
                );
            },
        },
        {
            field: "assignee",
            headerName: "مسئول پاسخ",
            width: 150,
            render: (row) =>
                row.assignee ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar src={row.assignee.avatar} sx={{ width: 24, height: 24 }}>
                            {row.assignee.name?.charAt(0) || "?"}
                        </Avatar>
                        <Typography variant="caption">{row.assignee.name}</Typography>
                    </Box>
                ) : (
                    <Chip label="تخصیص نیافته" size="small" variant="outlined" />
                ),
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            type: "date",
        },
    ];

    const handleEdit = (ticket) => {
        if (!canEdit) return;
        setEditingTicket(ticket);
        setIsModalOpen(true);
    };

    const handleDelete = (ticket) => {
        if (!canDelete) return;
        setTicketToDelete(ticket);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (ticketToDelete) {
            deleteTicket.mutate(ticketToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setTicketToDelete(null);
                },
            });
        }
    };

    const handleStatusChange = (ticket, newStatus) => {
        updateTicket.mutate({
            id: ticket._id,
            data: { status: newStatus },
        });
    };

    const handleAssign = (ticket) => {
        // This would open an assign dialog
        console.log("Assign ticket:", ticket);
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingTicket(null);
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

    const handleSaveTicket = () => {
        setIsModalOpen(false);
        setEditingTicket(null);
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
                ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                })),
            ],
        },
        {
            key: "priority",
            label: "اولویت",
            value: priorityFilter,
            onChange: (value) => {
                setPriorityFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه" },
                ...Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                })),
            ],
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "پاسخ",
            icon: <Reply />,
            onClick: (ticket) => handleEdit(ticket),
            color: "primary",
            permission: canEdit,
            disabled: (ticket) => ticket.status === "closed",
        },
        {
            label: "تخصیص",
            icon: <Assignment />,
            onClick: handleAssign,
            color: "info",
            permission: canEdit,
            disabled: (ticket) => !!ticket.assignee,
        },
        {
            label: "حل شده",
            icon: <CheckCircle />,
            onClick: (ticket) => handleStatusChange(ticket, "resolved"),
            color: "success",
            permission: canEdit,
            disabled: (ticket) => ticket.status === "resolved" || ticket.status === "closed",
        },
        {
            label: "بستن",
            icon: <Close />,
            onClick: (ticket) => handleStatusChange(ticket, "closed"),
            color: "warning",
            permission: canEdit,
            disabled: (ticket) => ticket.status === "closed",
        },
    ];

    return (
        <Layout>
            <Box>
                {/* Statistics Cards */}
                {statistics?.overview && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        کل تیکت‌ها
                                    </Typography>
                                    <Typography variant="h4">{statistics.overview.total || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        باز
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {statistics.overview.open || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        در حال بررسی
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {statistics.overview.inProgress || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        حل شده
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {statistics.overview.resolved || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت تیکت‌ها
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                            تیکت جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست تیکت‌ها"
                    data={ticketsData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={ticketsData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در تیکت‌ها (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "تیکتی یافت نشد",
                        description: "هنوز تیکتی ایجاد نشده است.",
                    }}
                />

                <Modal
                    open={isModalOpen}
                    onClose={handleSaveTicket}
                    title={editingTicket ? "ویرایش تیکت" : "ایجاد تیکت جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <TicketForm ticket={editingTicket} onSave={handleSaveTicket} onCancel={handleSaveTicket} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف تیکت <strong>#{ticketToDelete?.ticketNumber}</strong> اطمینان دارید؟
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
                            disabled={deleteTicket.isPending}
                        >
                            {deleteTicket.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
