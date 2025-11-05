"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Card, CardContent, Grid, IconButton, Link, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Group, Edit, Delete, Add, LinkedIn, Twitter, Instagram } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import TeamMemberForm from "@/components/forms/TeamMemberForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber } from "@/lib/utils";

const DEPARTMENT_LABELS = {
    management: "مدیریت",
    development: "توسعه",
    design: "طراحی",
    marketing: "بازاریابی",
    sales: "فروش",
    support: "پشتیبانی",
};

export default function TeamPage() {
    const [editingMember, setEditingMember] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("team");

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
        if (departmentFilter !== "all") {
            params.append("department", departmentFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, departmentFilter, page, limit]);

    const endpoint = `/team?${queryParams}`;

    // Fetch team members
    const { data: teamData, isLoading } = useFetchData(["team", queryParams], endpoint);

    // Update team member
    const updateMember = useUpdateData("/team", {
        successMessage: "عضو تیم با موفقیت به‌روزرسانی شد",
        queryKey: "team",
    });

    // Delete team member
    const deleteMember = useDeleteData("/team", {
        successMessage: "عضو تیم با موفقیت حذف شد",
        queryKey: "team",
    });

    const columns = [
        {
            field: "avatar",
            headerName: "تصویر",
            width: 80,
            render: (row) => (
                <Avatar src={row.avatar} sx={{ width: 40, height: 40 }}>
                    {getPersianValue(row.name, "?").charAt(0)}
                </Avatar>
            ),
        },
        {
            field: "name",
            headerName: "نام و نام خانوادگی",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {getPersianValue(row.name, "-")}
                    </Typography>
                    {row.email && (
                        <Typography variant="caption" color="text.secondary">
                            {row.email}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "position",
            headerName: "سمت",
            width: 150,
            render: (row) => (
                <Typography variant="body2">{getPersianValue(row.position, "-")}</Typography>
            ),
        },
        {
            field: "department",
            headerName: "بخش",
            width: 120,
            render: (row) => (
                <Chip
                    label={DEPARTMENT_LABELS[row.department] || row.department}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            ),
        },
        {
            field: "experience",
            headerName: "تجربه",
            width: 100,
            render: (row) => (
                <Typography variant="caption">
                    {row.experience?.years || row.experience || 0} سال
                </Typography>
            ),
        },
        {
            field: "skills",
            headerName: "مهارت‌ها",
            width: 200,
            render: (row) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {row.skills?.slice(0, 3).map((skill, index) => (
                        <Chip
                            key={index}
                            label={getPersianValue(skill?.name || skill, "-")}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                        />
                    ))}
                    {row.skills?.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                            +{row.skills.length - 3}
                        </Typography>
                    )}
                </Stack>
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
            headerName: "تاریخ ایجاد",
            width: 150,
            type: "date",
        },
    ];

    const handleEdit = (member) => {
        if (!canEdit) return;
        setEditingMember(member);
        setIsModalOpen(true);
    };

    const handleDelete = (member) => {
        if (!canDelete) return;
        setMemberToDelete(member);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (memberToDelete) {
            deleteMember.mutate(memberToDelete._id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setMemberToDelete(null);
                },
            });
        }
    };

    const handleAdd = () => {
        if (!canCreate) return;
        setEditingMember(null);
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

    const handleSaveMember = () => {
        setIsModalOpen(false);
        setEditingMember(null);
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
        {
            key: "department",
            label: "بخش",
            value: departmentFilter,
            onChange: (value) => {
                setDepartmentFilter(value);
                setPage(1); // Reset to first page on filter change
            },
            options: [
                { value: "all", label: "همه بخش‌ها" },
                ...Object.entries(DEPARTMENT_LABELS).map(([key, label]) => ({
                    value: key,
                    label,
                })),
            ],
        },
    ];

    // Team Member Card Component
    const TeamMemberCard = ({ member }) => (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Avatar src={member.avatar} sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}>
                        {getPersianValue(member.name, "?").charAt(0)}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                        {getPersianValue(member.name, "-")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getPersianValue(member.position, "-")}
                    </Typography>
                    <Chip
                        label={DEPARTMENT_LABELS[member.department] || member.department}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        تجربه: {member.experience?.years || member.experience || 0} سال
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    {member.socialLinks?.linkedin && (
                        <IconButton size="small" component={Link} href={member.socialLinks.linkedin} target="_blank">
                            <LinkedIn fontSize="small" />
                        </IconButton>
                    )}
                    {member.socialLinks?.twitter && (
                        <IconButton size="small" component={Link} href={member.socialLinks.twitter} target="_blank">
                            <Twitter fontSize="small" />
                        </IconButton>
                    )}
                    {member.socialLinks?.instagram && (
                        <IconButton size="small" component={Link} href={member.socialLinks.instagram} target="_blank">
                            <Instagram fontSize="small" />
                        </IconButton>
                    )}
                </Stack>

                <Stack direction="row" spacing={1} justifyContent="center">
                    {canEdit && (
                        <IconButton size="small" onClick={() => handleEdit(member)}>
                            <Edit fontSize="small" />
                        </IconButton>
                    )}
                    {canDelete && (
                        <IconButton size="small" onClick={() => handleDelete(member)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            مدیریت تیم
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            مدیریت اعضای تیم و اطلاعات آنها
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <Button variant={viewMode === "table" ? "contained" : "outlined"} onClick={() => setViewMode("table")} size="small">
                            جدول
                        </Button>
                        <Button variant={viewMode === "cards" ? "contained" : "outlined"} onClick={() => setViewMode("cards")} size="small">
                            کارت
                        </Button>
                        {canCreate && (
                            <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                                عضو جدید
                            </Button>
                        )}
                    </Stack>
                </Box>

                {viewMode === "table" ? (
                    <DataTable
                        title="لیست اعضای تیم"
                        data={teamData?.data || []}
                        columns={columns}
                        loading={isLoading}
                        pagination={teamData?.pagination}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        onSearch={handleSearch}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        onAdd={canCreate ? handleAdd : undefined}
                        searchPlaceholder="جستجو در اعضای تیم (حداقل 3 کاراکتر)..."
                        enableSelection={false}
                        filters={filters}
                        canView={canView}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canCreate={canCreate}
                        emptyStateProps={{
                            title: "عضو تیمی یافت نشد",
                            description: "هنوز عضوی به تیم اضافه نشده است. اولین عضو خود را اضافه کنید!",
                            action: canCreate
                                ? {
                                      label: "افزودن عضو جدید",
                                      onClick: handleAdd,
                                  }
                                : undefined,
                        }}
                    />
                ) : (
                    <Grid container spacing={3}>
                        {teamData?.data?.map((member) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={member._id}>
                                <TeamMemberCard member={member} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Modal
                    open={isModalOpen}
                    onClose={handleSaveMember}
                    title={editingMember ? "ویرایش عضو تیم" : "افزودن عضو جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <TeamMemberForm member={editingMember} onSave={handleSaveMember} onCancel={handleSaveMember} />
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف عضو تیم <strong>{getPersianValue(memberToDelete?.name, "-")}</strong> اطمینان دارید؟
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
                            disabled={deleteMember.isPending}
                        >
                            {deleteMember.isPending ? "در حال حذف..." : "حذف"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
