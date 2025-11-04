"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Card, CardContent, Grid, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Security, Edit, Delete, Add, CheckCircle, Cancel, Lock } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import RoleForm from "@/components/forms/RoleForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
    active: { label: "فعال", color: "success" },
    inactive: { label: "غیرفعال", color: "error" },
};

const PERMISSION_GROUPS = {
    users: "کاربران",
    roles: "نقش‌ها",
    articles: "مقالات",
    services: "خدمات",
    portfolio: "نمونه کارها",
    team: "تیم",
    faq: "سوالات متداول",
    brands: "برندها",
    carousel: "اسلایدر",
    categories: "دسته‌بندی‌ها",
    comments: "نظرات",
    tickets: "تیکت‌ها",
    consultations: "مشاوره‌ها",
    media: "رسانه",
    settings: "تنظیمات",
    analytics: "آنالیتیکس",
};

export default function RolesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedRole, setSelectedRole] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    const debouncedSearch = useDebounce(searchTerm, 300);
    const { useFetchData, useDeleteData } = useApi();

    // Fetch roles
    const {
        data: rolesData,
        isLoading,
        refetch,
    } = useFetchData(["roles", debouncedSearch, statusFilter], `/roles?search=${debouncedSearch}&status=${statusFilter === "all" ? "" : statusFilter}&limit=100`);

    // Delete mutation
    const deleteRole = useDeleteData("/roles", {
        successMessage: "نقش با موفقیت حذف شد",
        queryKey: "roles",
        onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setRoleToDelete(null);
            refetch();
        },
    });

    const roles = rolesData?.data || [];

    const handleEdit = (role) => {
        setSelectedRole(role);
        setIsFormOpen(true);
    };

    const handleDelete = (role) => {
        setRoleToDelete(role);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (roleToDelete) {
            deleteRole.mutate(roleToDelete._id);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedRole(null);
        refetch();
    };

    const handleAddNew = () => {
        setSelectedRole(null);
        setIsFormOpen(true);
    };

    const columns = [
        {
            field: "displayName",
            headerName: "نام نقش",
            flex: 1,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>
                        {params.row.displayName?.fa || params.row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.displayName?.en || params.row.name}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "name",
            headerName: "شناسه",
            width: 150,
            renderCell: (params) => <Chip label={params.row.name} size="small" variant="outlined" />,
        },
        {
            field: "permissions",
            headerName: "دسترسی‌ها",
            flex: 1,
            renderCell: (params) => {
                const permissions = params.row.permissions || [];
                const grouped = permissions.reduce((acc, perm) => {
                    const [group] = perm.split(".");
                    acc[group] = (acc[group] || 0) + 1;
                    return acc;
                }, {});

                return (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        {Object.keys(grouped)
                            .slice(0, 3)
                            .map((group) => (
                                <Chip key={group} label={`${PERMISSION_GROUPS[group] || group}: ${grouped[group]}`} size="small" color="primary" variant="outlined" />
                            ))}
                        {Object.keys(grouped).length > 3 && <Chip label={`+${Object.keys(grouped).length - 3} بیشتر`} size="small" variant="outlined" />}
                    </Stack>
                );
            },
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 120,
            renderCell: (params) => {
                const status = params.row.status || "active";
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
                return <Chip label={config.label} color={config.color} size="small" />;
            },
        },
        {
            field: "isSystem",
            headerName: "نوع",
            width: 100,
            renderCell: (params) =>
                params.row.isSystem ? (
                    <Tooltip title="نقش سیستم - قابل ویرایش نیست">
                        <Chip icon={<Lock />} label="سیستم" size="small" color="warning" />
                    </Tooltip>
                ) : (
                    <Chip label="سفارشی" size="small" color="default" />
                ),
        },
        {
            field: "priority",
            headerName: "اولویت",
            width: 100,
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            renderCell: (params) => formatDate(params.row.createdAt),
        },
        {
            field: "actions",
            headerName: "عملیات",
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="ویرایش">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)} disabled={params.row.isSystem}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف">
                        <IconButton size="small" color="error" onClick={() => handleDelete(params.row)} disabled={params.row.isSystem}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    return (
        <Layout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            مدیریت نقش‌ها
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            مدیریت نقش‌ها و دسترسی‌های کاربران
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
                        نقش جدید
                    </Button>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item size={{ xs: 12, md: 6 }}>
                                <input
                                    type="text"
                                    placeholder="جستجو در نقش‌ها..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 6 }}>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                >
                                    <option value="all">همه وضعیت‌ها</option>
                                    <option value="active">فعال</option>
                                    <option value="inactive">غیرفعال</option>
                                </select>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Roles Table */}
                <Card>
                    <CardContent>
                        <DataTable data={roles} rows={roles} columns={columns} loading={isLoading} getRowId={(row) => row._id} />
                    </CardContent>
                </Card>

                {/* Role Form Modal */}
                <Modal open={isFormOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
                    <RoleForm role={selectedRole} onSave={handleCloseForm} onCancel={handleCloseForm} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف نقش <strong>{roleToDelete?.displayName?.fa || roleToDelete?.name}</strong> اطمینان دارید؟
                            {roleToDelete && (
                                <>
                                    <br />
                                    <br />
                                    <Typography variant="caption" color="error">
                                        توجه: این عملیات قابل بازگشت نیست و در صورت استفاده از این نقش توسط کاربران، حذف امکان‌پذیر نخواهد بود.
                                    </Typography>
                                </>
                            )}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteRole.isPending}>
                            {deleteRole.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
