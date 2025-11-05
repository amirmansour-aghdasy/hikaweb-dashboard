"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Security, Edit, Delete, Lock } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import RoleForm from "@/components/forms/RoleForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

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
    const [editingRole, setEditingRole] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useDeleteData } = useApi();

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

    const endpoint = `/roles?${queryParams}`;

    // Fetch roles
    const { data: rolesData, isLoading } = useFetchData(["roles", queryParams], endpoint);

    // Delete role
    const deleteRole = useDeleteData("/roles", {
        successMessage: "نقش با موفقیت حذف شد",
        queryKey: "roles",
    });

    const columns = [
        {
            field: "displayName",
            headerName: "نام نقش",
            align: "left",
        },
        {
            field: "name",
            headerName: "شناسه",
            width: 150,
            render: (row) => <Chip label={row.name} size="small" variant="outlined" />,
            align: "center"
        },
        {
            field: "permissions",
            headerName: "دسترسی‌ها",
            flex: 2,
            render: (row) => {
                const permissions = row.permissions || [];
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
            align: "left"
        },
        {
            field: "isSystem",
            headerName: "نوع",
            width: 120,
            render: (row) =>
                row.isSystem ? (
                    <Tooltip title="نقش سیستم - قابل ویرایش نیست">
                        <Chip icon={<Lock />} label="سیستم" size="small" color="warning" />
                    </Tooltip>
                ) : (
                    <Chip label="سفارشی" size="small" color="default" />
                ),
                align: "center"
        },
        {
            field: "priority",
            headerName: "اولویت",
            width: 100,
            render: (row) => <Typography variant="body2">{row.priority || 0}</Typography>,
            align: "center"
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            render: (row) => <Typography variant="caption">{formatDate(row.createdAt)}</Typography>,
            align: "center"
        },
    ];

    const handleEdit = (role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleDelete = (role) => {
        setRoleToDelete(role);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (roleToDelete) {
            deleteRole.mutate(roleToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setRoleToDelete(null);
                },
            });
        }
    };

    const handleAdd = () => {
        setEditingRole(null);
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

    const handleSaveRole = () => {
        setIsModalOpen(false);
        setEditingRole(null);
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
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
            ],
        },
    ];

    // Custom actions
    const customActions = [
        {
            label: "ویرایش",
            icon: <Edit />,
            onClick: handleEdit,
            disabled: (role) => role.isSystem,
        },
        {
            label: "حذف",
            icon: <Delete />,
            onClick: handleDelete,
            color: "error",
            disabled: (role) => role.isSystem,
        },
    ];

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت نقش‌ها
                    </Typography>
                    <Button variant="contained" startIcon={<Security />} onClick={handleAdd} size="large">
                        نقش جدید
                    </Button>
                </Box>

                <DataTable
                    title="لیست نقش‌ها"
                    data={rolesData?.data || []}
                    columns={columns}
                    loading={isLoading}
                    pagination={rolesData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در نقش‌ها (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={customActions}
                    filters={filters}
                    emptyStateProps={{
                        title: "نقشی یافت نشد",
                        description: "هنوز نقشی ایجاد نشده است. اولین نقش خود را ایجاد کنید!",
                        action: {
                            label: "ایجاد نقش جدید",
                            onClick: handleAdd,
                        },
                    }}
                />

                {/* Role Form Modal */}
                <Modal open={isModalOpen} onClose={handleSaveRole} title={editingRole ? "ویرایش نقش" : "ایجاد نقش جدید"} maxWidth="md" fullWidth>
                    <RoleForm role={editingRole} onSave={handleSaveRole} onCancel={handleSaveRole} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف نقش <strong>{roleToDelete?.displayName?.fa || roleToDelete?.name}</strong> اطمینان دارید؟
                            {roleToDelete?.isSystem && (
                                <>
                                    <br />
                                    <br />
                                    <Typography variant="caption" color="error">
                                        توجه: این نقش یک نقش سیستم است و نمی‌توان آن را حذف کرد.
                                    </Typography>
                                </>
                            )}
                            {roleToDelete && !roleToDelete.isSystem && (
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
                        <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteRole.isPending || roleToDelete?.isSystem}>
                            {deleteRole.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
