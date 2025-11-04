"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button } from "@mui/material";
import { Add, Block } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import UserForm from "@/components/forms/UserForm";

export default function UsersPage() {
    const [editingUser, setEditingUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // منطق هوشمند: حداقل 3 کاراکتر + debounce
    const shouldSearch = searchTerm.length === 0 || searchTerm.length >= 3;
    const debouncedSearchTerm = useDebounce(shouldSearch ? searchTerm : "", 800);

    const { useFetchData, useUpdateData } = useApi();

    // ساخت endpoint با search
    const endpoint = debouncedSearchTerm ? `/users?search=${encodeURIComponent(debouncedSearchTerm)}` : "/users";

    // Fetch users با شرط enabled
    const { data: usersData, isLoading } = useFetchData(["users", debouncedSearchTerm], endpoint, {
        enabled: shouldSearch,
        staleTime: 10 * 60 * 1000, // 10 دقیقه cache
    });

    // Update user mutation
    const updateUser = useUpdateData("/users", {
        successMessage: "کاربر با موفقیت به‌روزرسانی شد",
    });

    const columns = [
        { field: "name", headerName: "نام", align: "left" },
        { field: "email", headerName: "ایمیل", align: "left" },
        { field: "phoneNumber", headerName: "تلفن", align: "center" },
        { field: "role", headerName: "نقش", align: "center" },
        { field: "status", headerName: "وضعیت", type: "status", align: "center" },
        { field: "lastLogin", headerName: "آخرین ورود", type: "date", align: "center" },
        { field: "createdAt", headerName: "تاریخ عضویت", type: "date", align: "center" },
    ];

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleToggleStatus = (user) => {
        const newStatus = user.status === "active" ? "inactive" : "active";
        updateUser.mutate({
            id: user._id,
            data: { status: newStatus },
        });
    };

    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    // تعیین loading state
    const isSearchLoading = searchTerm.length > 0 && searchTerm.length < 3 ? false : isLoading;

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            مدیریت کاربران
                        </Typography>
                    </Box>

                    <Button variant="contained" startIcon={<Add />} onClick={handleAdd} size="large">
                        کاربر جدید
                    </Button>
                </Box>

                <DataTable
                    title="لیست کاربران"
                    data={usersData?.data || []}
                    columns={columns}
                    loading={isSearchLoading}
                    pagination={usersData?.pagination}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در کاربران (حداقل 3 کاراکتر)..."
                    enableSelection={true}
                    customActions={[
                        {
                            label: "تغییر وضعیت",
                            icon: <Block />,
                            onClick: handleToggleStatus,
                        },
                    ]}
                />

                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"} maxWidth="lg">
                    <UserForm
                        user={editingUser}
                        onSave={() => {
                            setIsModalOpen(false);
                            setEditingUser(null);
                        }}
                        onCancel={() => {
                            setIsModalOpen(false);
                            setEditingUser(null);
                        }}
                    />
                </Modal>
            </Box>
        </Layout>
    );
}
