"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select } from "@mui/material";
import { Psychology, Edit, Delete, Assignment, CheckCircle, Cancel, Email, Phone, Business, Schedule } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
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
        return params.toString();
    }, [debouncedSearchTerm, statusFilter]);

    const endpoint = `/consultations${queryParams ? `?${queryParams}` : ""}`;

    // Fetch consultations
    const { data: consultationsData, isLoading } = useFetchData(["consultations", queryParams], endpoint);

    // Fetch users for assignment
    const { data: usersData } = useFetchData("consultation-users", "/users?role=admin,consultant");

    // Update consultation
    const updateConsultation = useUpdateData("/consultations", {
        successMessage: "درخواست مشاوره با موفقیت به‌روزرسانی شد",
    });

    // Delete consultation
    const deleteConsultation = useDeleteData("/consultations", {
        successMessage: "درخواست مشاوره با موفقیت حذف شد",
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
                    <Typography variant="caption" color="text.secondary">
                        {row.company?.name || "بدون شرکت"}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "contact",
            headerName: "اطلاعات تماس",
            width: 180,
            render: (row) => (
                <Box>
                    <Typography variant="caption" display="block">
                        <Email sx={{ fontSize: 12, mr: 0.5 }} />
                        {row.email}
                    </Typography>
                    <Typography variant="caption" display="block">
                        <Phone sx={{ fontSize: 12, mr: 0.5 }} />
                        {row.phoneNumber}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "services",
            headerName: "خدمات مورد نیاز",
            width: 200,
            render: (row) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {row.services?.slice(0, 2).map((service, index) => (
                        <Chip key={index} label={service.name?.fa || service.name} size="small" variant="outlined" sx={{ fontSize: "0.7rem", mb: 0.5 }} />
                    ))}
                    {row.services?.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                            +{row.services.length - 2} بیشتر
                        </Typography>
                    )}
                </Stack>
            ),
        },
        {
            field: "project",
            headerName: "جزئیات پروژه",
            width: 200,
            render: (row) => (
                <Box>
                    {row.projectDescription && (
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            {row.projectDescription.substring(0, 60)}...
                        </Typography>
                    )}
                    {row.budget && (
                        <Chip label={`بودجه: ${row.budget}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", mr: 0.5 }} />
                    )}
                    {row.timeline && (
                        <Chip label={`زمان: ${row.timeline}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                    )}
                </Box>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 120,
            render: (row) => {
                const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending;
                return <Chip label={config.label} size="small" color={config.color} variant="outlined" />;
            },
        },
        {
            field: "assignedTo",
            headerName: "مسئول",
            width: 150,
            render: (row) =>
                row.assignedTo ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar src={row.assignedTo.avatar} sx={{ width: 24, height: 24 }}>
                            {row.assignedTo.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="caption">{row.assignedTo.name}</Typography>
                    </Box>
                ) : (
                    <Chip label="تخصیص نیافته" size="small" variant="outlined" color="warning" />
                ),
        },
        {
            field: "createdAt",
            headerName: "تاریخ درخواست",
            width: 120,
            render: (row) => <Typography variant="caption">{formatDate(row.createdAt)}</Typography>,
        },
    ];

    const handleStatusChange = (consultation, newStatus) => {
        updateConsultation.mutate({
            id: consultation._id,
            data: { status: newStatus },
        });
    };

    const handleAssign = (consultation) => {
        setSelectedConsultation(consultation);
        setAssigneeId(consultation.assignedTo?._id || "");
        setAssignDialogOpen(true);
    };

    const handleSaveAssignment = async () => {
        if (!selectedConsultation || !assigneeId) {
            toast.error("لطفاً مسئول را انتخاب کنید");
            return;
        }

        try {
            await updateConsultation.mutateAsync({
                id: selectedConsultation._id,
                data: { assignedTo: assigneeId },
            });
            setAssignDialogOpen(false);
            setSelectedConsultation(null);
            setAssigneeId("");
        } catch (error) {
            toast.error("خطا در تخصیص مسئول");
        }
    };

    const handleDelete = (consultation) => {
        if (window.confirm("آیا از حذف این درخواست مشاوره اطمینان دارید؟")) {
            deleteConsultation.mutate(consultation._id);
        }
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const customActions = [
        {
            label: "تخصیص",
            icon: <Assignment />,
            onClick: handleAssign,
            color: "info",
            show: (consultation) => !consultation.assignedTo,
        },
        {
            label: "تماس گرفته شده",
            icon: <CheckCircle />,
            onClick: (consultation) => handleStatusChange(consultation, "contacted"),
            color: "info",
            show: (consultation) => consultation.status === "pending",
        },
        {
            label: "تکمیل شده",
            icon: <CheckCircle />,
            onClick: (consultation) => handleStatusChange(consultation, "completed"),
            color: "success",
            show: (consultation) => consultation.status !== "completed" && consultation.status !== "cancelled",
        },
        {
            label: "لغو",
            icon: <Cancel />,
            onClick: (consultation) => handleStatusChange(consultation, "cancelled"),
            color: "error",
            show: (consultation) => consultation.status !== "cancelled",
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
                ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                })),
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت درخواست‌های مشاوره
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        بررسی و مدیریت درخواست‌های مشاوره مشتریان
                    </Typography>
                </Box>

                <DataTable
                    title="لیست درخواست‌های مشاوره"
                    data={consultationsData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={consultationsData?.pagination}
                    onSearch={handleSearch}
                    searchPlaceholder="جستجو در درخواست‌ها (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={customActions}
                    filters={filters}
                    emptyStateProps={{
                        title: "درخواستی یافت نشد",
                        description: "هنوز درخواست مشاوره‌ای ثبت نشده است.",
                    }}
                />

                {/* Assignment Dialog */}
                <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>تخصیص مسئول</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>مسئول</InputLabel>
                            <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} label="مسئول">
                                <MenuItem value="">بدون تخصیص</MenuItem>
                                {usersData?.data?.map((user) => (
                                    <MenuItem key={user._id} value={user._id}>
                                        {user.name} ({user.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAssignDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleSaveAssignment} variant="contained" disabled={!assigneeId}>
                            ذخیره
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}

