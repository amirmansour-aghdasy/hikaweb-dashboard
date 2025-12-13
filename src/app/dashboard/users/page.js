"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Add } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, normalizeUserFields, getInitials } from "@/lib/utils";
import UserForm from "@/components/forms/UserForm";
import toast from "react-hot-toast";

export default function UsersPage() {
    const [editingUser, setEditingUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    // منطق هوشمند: حداقل 3 کاراکتر + debounce
    const shouldSearch = searchTerm.length === 0 || searchTerm.length >= 3;
    const debouncedSearchTerm = useDebounce(shouldSearch ? searchTerm : "", 800);

    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("users");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (roleFilter !== "all") {
            params.append("role", roleFilter);
        }
        if (statusFilter !== "all") {
            params.append("status", statusFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, roleFilter, statusFilter, page, limit]);

    const endpoint = `/users?${queryParams}`;

    // Fetch users
    const { data: usersData, isLoading } = useFetchData(["users", queryParams], endpoint, {
        enabled: shouldSearch,
    });

    // Update user mutation
    const updateUser = useUpdateData("/users", {
        successMessage: "کاربر با موفقیت به‌روزرسانی شد",
        queryKey: "users",
    });

    // Delete user mutation
    const deleteUser = useDeleteData("/users", {
        successMessage: "کاربر با موفقیت حذف شد",
        queryKey: "users",
    });

    const columns = [
        {
            field: "avatar",
            headerName: "تصویر",
            width: 80,
            render: (row) => {
                const normalized = normalizeUserFields(row);
                return (
                    <Avatar src={normalized.avatar || undefined} sx={{ width: 40, height: 40, mx: "auto" }}>
                        {getInitials(normalized.name)}
                    </Avatar>
                );
            },
            align: "center"
        },
        {
            field: "name",
            headerName: "نام",
            flex: 1,
            render: (row) => {
                const normalized = normalizeUserFields(row);
                return normalized.name || "-";
            },
            align: "left"
        },
        {
            field: "email",
            headerName: "ایمیل",
            flex: 1,
            render: (row) => {
                const normalized = normalizeUserFields(row);
                return normalized.email || "-";
            },
            align: "left"
        },
        {
            field: "phoneNumber",
            headerName: "تلفن",
            width: 150,
            render: (row) => {
                const normalized = normalizeUserFields(row);
                return normalized.phone || "-";
            },
            align: "center"
        },
        {
            field: "role",
            headerName: "نقش",
            width: 150,
            render: (row) => <Chip label={getPersianValue(row.role?.displayName || row.role?.name, row.role?.name || "-")} size="small" variant="outlined" />,
            align: "center"
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 120,
            type: "status",
            align: "center"
        },
        {
            field: "lastLogin",
            headerName: "آخرین ورود",
            width: 150,
            type: "date",
            align: "center"
        },
        {
            field: "createdAt",
            headerName: "تاریخ عضویت",
            width: 150,
            type: "date",
            align: "center"
        },
    ];

    const handleEdit = (user) => {
        if (!canEdit) return;
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (user) => {
        if (!canDelete) return;
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const handleBulkDelete = async (selectedIds) => {
        if (!canDelete || selectedIds.length === 0) return;
        
        try {
            // Delete all selected users
            await Promise.all(selectedIds.map(id => deleteUser.mutateAsync(id)));
            toast.success(`${selectedIds.length} کاربر با موفقیت حذف شد`);
        } catch (error) {
            console.error("Error deleting users:", error);
            toast.error("خطا در حذف کاربران");
        }
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            deleteUser.mutate(userToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setUserToDelete(null);
                },
            });
        }
    };

    const handleView = (user) => {
        if (!canView) return;
        setViewingUser(user);
        setIsViewDialogOpen(true);
    };

    const handleToggleStatus = (user) => {
        const newStatus = user.status === "active" ? "inactive" : "active";
        updateUser.mutate({
            id: user._id,
            data: { status: newStatus },
        });
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingUser(null);
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

    const handleSaveUser = () => {
        setIsModalOpen(false);
        setEditingUser(null);
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
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
            ],
        },
        // Role filter would be populated from roles API
        // {
        //     key: "role",
        //     label: "نقش",
        //     value: roleFilter,
        //     onChange: (value) => {
        //         setRoleFilter(value);
        //         setPage(1);
        //     },
        //     options: [
        //         { value: "all", label: "همه" },
        //         // Populated from roles API
        //     ],
        // },
    ];

    // Custom actions - shown after standard actions
    const customActions = [
        {
            label: "تغییر وضعیت",
            icon: <Add />, // You can use a better icon here
            onClick: handleToggleStatus,
            permission: canEdit,
        },
    ];

    // تعیین loading state
    const isSearchLoading = searchTerm.length > 0 && searchTerm.length < 3 ? false : isLoading;

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت کاربران
                    </Typography>
                    {canCreate && (
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                            کاربر جدید
                        </Button>
                    )}
                </Box>

                <DataTable
                    title="لیست کاربران"
                    data={usersData?.data || []}
                    columns={columns}
                    loading={isSearchLoading}
                    pagination={usersData?.pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onBulkDelete={canDelete ? handleBulkDelete : undefined}
                    onView={canView ? handleView : undefined}
                    onAdd={canCreate ? handleAdd : undefined}
                    searchPlaceholder="جستجو در کاربران (حداقل 3 کاراکتر)..."
                    enableSelection={canDelete}
                    customActions={customActions}
                    filters={filters}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                    emptyStateProps={{
                        title: "کاربری یافت نشد",
                        description: "هنوز کاربری ایجاد نشده است. اولین کاربر خود را ایجاد کنید!",
                        action: canCreate
                            ? {
                                  label: "ایجاد کاربر جدید",
                                  onClick: handleAdd,
                              }
                            : undefined,
                    }}
                />

                <Modal open={isModalOpen} onClose={handleSaveUser} title={editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"} maxWidth="lg">
                    <UserForm user={editingUser} onSave={handleSaveUser} onCancel={handleSaveUser} />
                </Modal>

                {/* View User Dialog */}
                <Dialog 
                    open={isViewDialogOpen} 
                    onClose={() => {
                        setIsViewDialogOpen(false);
                        setViewingUser(null);
                    }}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>مشاهده اطلاعات کاربر</DialogTitle>
                    <DialogContent>
                        {viewingUser && (
                            <Box sx={{ mt: 2 }}>
                                {(() => {
                                    const normalized = normalizeUserFields(viewingUser);
                                    return (
                                        <>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                                                <Avatar src={normalized.avatar || undefined} sx={{ width: 64, height: 64 }}>
                                                    {getInitials(normalized.name)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6">{normalized.name || "-"}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{normalized.email || "-"}</Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">نام</Typography>
                                                    <Typography variant="body1">{normalized.name || "-"}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">ایمیل</Typography>
                                                    <Typography variant="body1">{normalized.email || "-"}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">شماره تلفن</Typography>
                                                    <Typography variant="body1">{normalized.phone || "-"}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">نقش</Typography>
                                                    <Typography variant="body1">
                                                        {viewingUser.role ? (typeof viewingUser.role === "object" ? getPersianValue(viewingUser.role.displayName, viewingUser.role.name) : viewingUser.role) : "-"}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">وضعیت</Typography>
                                                    <Typography variant="body1">
                                                        {viewingUser.status === "active" ? "فعال" : "غیرفعال"}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">تاریخ ایجاد</Typography>
                                                    <Typography variant="body1">{formatDate(viewingUser.createdAt)}</Typography>
                                                </Box>
                                            </Box>
                                        </>
                                    );
                                })()}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setIsViewDialogOpen(false);
                            setViewingUser(null);
                        }}>
                            بستن
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف کاربر <strong>{userToDelete?.name}</strong> اطمینان دارید؟
                            <br />
                            <br />
                            <Typography variant="caption" color="error">
                                توجه: این عملیات قابل بازگشت نیست.
                            </Typography>
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteUser.isPending}>
                            {deleteUser.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
