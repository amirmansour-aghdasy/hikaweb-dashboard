"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select } from "@mui/material";
import { Psychology, Edit, Delete, Assignment, CheckCircle, Cancel, Email, Phone } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
    pending: { label: "در انتظار", color: "warning" },
    contacted: { label: "تماس گرفته شده", color: "info" },
    in_progress: { label: "در حال بررسی", color: "primary" },
    completed: { label: "تکمیل شده", color: "success" },
    cancelled: { label: "لغو شده", color: "error" },
};

export default function ConsultationsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [assigneeId, setAssigneeId] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [consultationToDelete, setConsultationToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("consultations");

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

    const endpoint = `/consultations?${queryParams}`;

    // Fetch consultations
    const { data: consultationsData, isLoading } = useFetchData(["consultations", queryParams], endpoint);

    // Fetch users for assignment
    const { data: usersData } = useFetchData("consultation-users", "/users?role=admin,consultant", {
        enabled: false, // Only fetch when needed
    });

    // Update consultation
    const updateConsultation = useUpdateData("/consultations", {
        successMessage: "درخواست مشاوره با موفقیت به‌روزرسانی شد",
        queryKey: "consultations",
    });

    // Delete consultation
    const deleteConsultation = useDeleteData("/consultations", {
        successMessage: "درخواست مشاوره با موفقیت حذف شد",
        queryKey: "consultations",
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
                    {row.company?.name && (
                        <Typography variant="caption" color="text.secondary">
                            {row.company.name}
                        </Typography>
                    )}
                </Box>
            ),
            align: "left"
        },
        {
            field: "contact",
            headerName: "اطلاعات تماس",
            width: 180,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        <Email sx={{ fontSize: 12, mr: 0.5, verticalAlign: "middle" }} />
                        {row.email}
                    </Typography>
                    {row.phoneNumber && (
                        <Typography variant="caption" display="block">
                            <Phone sx={{ fontSize: 12, mr: 0.5, verticalAlign: "middle" }} />
                            {row.phoneNumber}
                        </Typography>
                    )}
                </Box>
            ),
            align: "left"
        },
        {
            field: "services",
            headerName: "خدمات مورد نیاز",
            width: 200,
            render: (row) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {row.services?.slice(0, 2).map((service, index) => (
                        <Chip
                            key={index}
                            label={getPersianValue(service?.name || service, "-")}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                        />
                    ))}
                    {row.services?.length > 2 && (
                        <Chip label={`+${row.services.length - 2}`} size="small" variant="outlined" />
                    )}
                </Stack>
            ),
            align: "left"
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 150,
            render: (row) => {
                const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending;
                return <Chip label={config.label} size="small" color={config.color} variant="outlined" />;
            },
            align: "center"
        },
        {
            field: "assignee",
            headerName: "مسئول",
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
            align: "center"
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            type: "date",
            align: "center"
        },
    ];

    const handleEdit = (consultation) => {
        if (!canEdit) return;
        // Edit consultation would go here
        console.log("Edit consultation:", consultation);
    };

    const handleDelete = (consultation) => {
        if (!canDelete) return;
        setConsultationToDelete(consultation);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (consultationToDelete) {
            deleteConsultation.mutate(consultationToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setConsultationToDelete(null);
                },
            });
        }
    };

    const handleStatusChange = (consultation, newStatus) => {
        updateConsultation.mutate({
            id: consultation._id,
            data: { status: newStatus },
        });
    };

    const handleAssign = (consultation) => {
        setSelectedConsultation(consultation);
        setAssignDialogOpen(true);
    };

    const handleSaveAssignment = () => {
        if (!assigneeId) {
            toast.error("لطفاً یک مسئول انتخاب کنید");
            return;
        }

        updateConsultation.mutate({
            id: selectedConsultation._id,
            data: { assignee: assigneeId },
        });

        setAssignDialogOpen(false);
        setAssigneeId("");
        setSelectedConsultation(null);
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
                ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                })),
            ],
        },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "تخصیص",
            icon: <Assignment />,
            onClick: handleAssign,
            color: "info",
            permission: canEdit,
            disabled: (consultation) => !!consultation.assignee,
        },
        {
            label: "تکمیل شده",
            icon: <CheckCircle />,
            onClick: (consultation) => handleStatusChange(consultation, "completed"),
            color: "success",
            permission: canEdit,
            disabled: (consultation) => consultation.status === "completed",
        },
        {
            label: "لغو",
            icon: <Cancel />,
            onClick: (consultation) => handleStatusChange(consultation, "cancelled"),
            color: "error",
            permission: canEdit,
            disabled: (consultation) => consultation.status === "cancelled",
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت درخواست‌های مشاوره
                    </Typography>
                </Box>

                <DataTable
                    title="لیست درخواست‌های مشاوره"
                    data={consultationsData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={consultationsData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    searchPlaceholder="جستجو در درخواست‌ها (حداقل 3 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "درخواست مشاوره‌ای یافت نشد",
                        description: "هنوز درخواست مشاوره‌ای ثبت نشده است.",
                    }}
                />

                {/* Assign Dialog */}
                <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>تخصیص مسئول</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>مسئول</InputLabel>
                            <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} label="مسئول">
                                {usersData?.data?.map((user) => (
                                    <MenuItem key={user._id} value={user._id}>
                                        {user.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAssignDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleSaveAssignment} variant="contained">
                            ذخیره
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف درخواست مشاوره <strong>{consultationToDelete?.fullName}</strong> اطمینان دارید؟
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
                            disabled={deleteConsultation.isPending}
                        >
                            {deleteConsultation.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
