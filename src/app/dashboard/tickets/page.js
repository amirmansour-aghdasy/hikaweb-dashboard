"use client";
import { useState, useMemo } from "react";
import { Box, Grid, Typography, Chip, Button, Stack, Avatar, Card, CardContent, LinearProgress, Tooltip, Badge } from "@mui/material";
import { SupportAgent, Edit, Delete, Add, Assignment, Reply, Close, Schedule, Person, Flag, CheckCircle } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import TicketForm from "@/components/forms/TicketForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
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
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            params.append("status", statusFilter);
        }
        if (priorityFilter !== "all") {
            params.append("priority", priorityFilter);
        }
        if (assigneeFilter !== "all") {
            params.append("assignee", assigneeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, priorityFilter, assigneeFilter]);

    const endpoint = `/tickets${queryParams ? `?${queryParams}` : ""}`;

    // Fetch tickets
    const { data: ticketsData, isLoading } = useFetchData(["tickets", queryParams], endpoint);

    // Update ticket
    const updateTicket = useUpdateData("/tickets", {
        successMessage: "تیکت با موفقیت به‌روزرسانی شد",
    });

    // Delete ticket
    const deleteTicket = useDeleteData("/tickets", {
        successMessage: "تیکت با موفقیت حذف شد",
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
                    <Typography variant="caption" color="text.secondary">
                        {row.description?.length > 60 ? `${row.description.substring(0, 60)}...` : row.description}
                    </Typography>
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
                            {row.customer?.email}
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
                return <Chip label={config.label} size="small" color={config.color} icon={<span style={{ fontSize: "12px" }}>{config.icon}</span>} />;
            },
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 150,
            render: (row) => {
                const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.open;
                return <Chip label={config.label} size="small" color={config.color} variant={row.status === "resolved" ? "filled" : "outlined"} />;
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
                            {row.assignee.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="caption">{row.assignee.name}</Typography>
                    </Box>
                ) : (
                    <Chip label="تخصیص نیافته" size="small" variant="outlined" />
                ),
        },
        {
            field: "category",
            headerName: "دسته‌بندی",
            width: 120,
            render: (row) =>
                row.category ? (
                    <Chip label={row.category} size="small" color="primary" variant="outlined" />
                ) : (
                    <Typography variant="caption" color="text.secondary">
                        بدون دسته
                    </Typography>
                ),
        },
        {
            field: "responseTime",
            headerName: "زمان پاسخ",
            width: 120,
            render: (row) => (
                <Box>
                    {row.firstResponseAt ? (
                        <Typography variant="caption" color="success.main">
                            پاسخ داده شده
                        </Typography>
                    ) : (
                        <Typography variant="caption" color="warning.main">
                            در انتظار پاسخ
                        </Typography>
                    )}
                    <Typography variant="caption" display="block">
                        {formatRelativeDate(row.createdAt)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "lastActivity",
            headerName: "آخرین فعالیت",
            width: 120,
            render: (row) => <Typography variant="caption">{formatRelativeDate(row.updatedAt)}</Typography>,
        },
    ];

    const handleEdit = (ticket) => {
        setEditingTicket(ticket);
        setIsModalOpen(true);
    };

    const handleDelete = (ticket) => {
        if (window.confirm("آیا از حذف این تیکت اطمینان دارید؟")) {
            deleteTicket.mutate(ticket._id);
        }
    };

    const handleAssign = (ticket) => {
        // Open assignment modal or dropdown
        console.log("Assign ticket:", ticket);
    };

    const handleStatusChange = (ticket, newStatus) => {
        updateTicket.mutate({
            id: ticket._id,
            data: { status: newStatus },
        });
    };

    const handlePriorityChange = (ticket, newPriority) => {
        updateTicket.mutate({
            id: ticket._id,
            data: { priority: newPriority },
        });
    };

    const handleAdd = () => {
        setEditingTicket(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveTicket = () => {
        setIsModalOpen(false);
        setEditingTicket(null);
    };

    const customActions = [
        {
            label: "پاسخ",
            icon: <Reply />,
            onClick: (ticket) => handleEdit(ticket),
            color: "primary",
            show: (ticket) => ticket.status !== "closed",
        },
        {
            label: "تخصیص",
            icon: <Assignment />,
            onClick: handleAssign,
            color: "info",
            show: (ticket) => !ticket.assignee,
        },
        {
            label: "حل شده",
            icon: <CheckCircle />,
            onClick: (ticket) => handleStatusChange(ticket, "resolved"),
            color: "success",
            show: (ticket) => ticket.status !== "resolved" && ticket.status !== "closed",
        },
        {
            label: "بستن",
            icon: <Close />,
            onClick: (ticket) => handleStatusChange(ticket, "closed"),
            color: "warning",
            show: (ticket) => ticket.status !== "closed",
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
                { value: "open", label: "باز" },
                { value: "in_progress", label: "در حال بررسی" },
                { value: "waiting_customer", label: "انتظار پاسخ مشتری" },
                { value: "resolved", label: "حل شده" },
                { value: "closed", label: "بسته" },
            ],
        },
        {
            key: "priority",
            label: "اولویت",
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "low", label: "کم" },
                { value: "normal", label: "عادی" },
                { value: "high", label: "بالا" },
                { value: "urgent", label: "فوری" },
            ],
        },
        {
            key: "assignee",
            label: "مسئول",
            value: assigneeFilter,
            onChange: setAssigneeFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "unassigned", label: "تخصیص نیافته" },
                { value: "me", label: "تیکت‌های من" },
            ],
        },
    ];

    // Summary Cards Component
    const SummaryCards = () => {
        const summary = ticketsData?.summary || {};

        return (
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 2 }}>
                            <Typography variant="h4" color="info.main">
                                {summary.open || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                تیکت‌های باز
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 2 }}>
                            <Typography variant="h4" color="warning.main">
                                {summary.in_progress || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                در حال بررسی
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 2 }}>
                            <Typography variant="h4" color="error.main">
                                {summary.urgent || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                فوری
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 2 }}>
                            <Typography variant="h4" color="success.main">
                                {summary.resolved || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                حل شده امروز
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            مدیریت تیکت‌های پشتیبانی
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            مدیریت درخواست‌ها و تیکت‌های پشتیبانی مشتریان
                        </Typography>
                    </Box>

                    <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                        تیکت جدید
                    </Button>
                </Box>

                <SummaryCards />

                <DataTable
                    title="لیست تیکت‌های پشتیبانی"
                    data={ticketsData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={ticketsData?.pagination}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در تیکت‌ها (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={customActions}
                    filters={filters}
                    emptyStateProps={{
                        title: "تیکتی یافت نشد",
                        description: "هنوز درخواست پشتیبانی‌ای ثبت نشده است.",
                        action: {
                            label: "ایجاد تیکت جدید",
                            onClick: handleAdd,
                        },
                    }}
                />

                {/* Ticket Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTicket ? "پاسخ به تیکت" : "ایجاد تیکت جدید"} maxWidth="lg" fullWidth>
                    <TicketForm ticket={editingTicket} onSave={handleSaveTicket} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}
