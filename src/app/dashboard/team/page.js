"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Card, CardContent, Grid, IconButton, Rating, Link } from "@mui/material";
import { Group, Edit, Delete, Add, LinkedIn, Twitter, Instagram, Language, Email, Phone, Star, Work, Person } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import TeamMemberForm from "@/components/forms/TeamMemberForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

export default function TeamPage() {
    const [editingMember, setEditingMember] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'

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
        if (roleFilter !== "all") {
            params.append("role", roleFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, roleFilter]);

    const endpoint = `/team${queryParams ? `?${queryParams}` : ""}`;

    // Fetch team members
    const { data: teamData, isLoading } = useFetchData(["team", queryParams], endpoint);

    // Update team member
    const updateMember = useUpdateData("/team", {
        successMessage: "عضو تیم با موفقیت به‌روزرسانی شد",
    });

    // Delete team member
    const deleteMember = useDeleteData("/team", {
        successMessage: "عضو تیم با موفقیت حذف شد",
    });

    const columns = [
        {
            field: "avatar",
            headerName: "تصویر",
            width: 80,
            render: (row) => (
                <Avatar src={row.avatar} sx={{ width: 40, height: 40 }}>
                    {row.name?.charAt(0)}
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
                        {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.email}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "position",
            headerName: "سمت",
            width: 150,
            render: (row) => (
                <Box>
                    <Typography variant="body2">{row.position?.fa || row.position}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.position?.en}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "department",
            headerName: "بخش",
            width: 120,
            render: (row) => <Chip label={row.department} size="small" color="primary" variant="outlined" />,
        },
        {
            field: "experience",
            headerName: "تجربه",
            width: 100,
            render: (row) => <Typography variant="caption">{row.experience} سال</Typography>,
        },
        {
            field: "skills",
            headerName: "مهارت‌ها",
            width: 200,
            render: (row) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {row.skills?.slice(0, 3).map((skill, index) => (
                        <Chip key={index} label={skill} size="small" variant="outlined" sx={{ fontSize: "0.7rem", mb: 0.5 }} />
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
            field: "social",
            headerName: "شبکه‌های اجتماعی",
            width: 150,
            render: (row) => (
                <Stack direction="row" spacing={0.5}>
                    {row.socialMedia?.linkedin && (
                        <IconButton size="small" component={Link} href={row.socialMedia.linkedin}>
                            <LinkedIn fontSize="small" />
                        </IconButton>
                    )}
                    {row.socialMedia?.twitter && (
                        <IconButton size="small" component={Link} href={row.socialMedia.twitter}>
                            <Twitter fontSize="small" />
                        </IconButton>
                    )}
                    {row.socialMedia?.instagram && (
                        <IconButton size="small" component={Link} href={row.socialMedia.instagram}>
                            <Instagram fontSize="small" />
                        </IconButton>
                    )}
                </Stack>
            ),
        },
        {
            field: "order",
            headerName: "ترتیب",
            width: 80,
            render: (row) => <Typography variant="caption">{row.order || 0}</Typography>,
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 100,
            type: "status",
        },
    ];

    const handleEdit = (member) => {
        setEditingMember(member);
        setIsModalOpen(true);
    };

    const handleDelete = (member) => {
        if (window.confirm("آیا از حذف این عضو تیم اطمینان دارید؟")) {
            deleteMember.mutate(member._id);
        }
    };

    const handleAdd = () => {
        setEditingMember(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveMember = () => {
        setIsModalOpen(false);
        setEditingMember(null);
    };

    const customActions = [
        {
            label: "ویرایش",
            icon: <Edit />,
            onClick: handleEdit,
            color: "primary",
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
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
            ],
        },
        {
            key: "role",
            label: "نقش",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
                { value: "all", label: "همه نقش‌ها" },
                { value: "manager", label: "مدیر" },
                { value: "developer", label: "توسعه‌دهنده" },
                { value: "designer", label: "طراح" },
                { value: "marketer", label: "بازاریاب" },
            ],
        },
    ];

    // Team Member Card Component
    const TeamMemberCard = ({ member }) => (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Avatar src={member.avatar} sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}>
                        {member.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                        {member.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {member.position?.fa || member.position}
                    </Typography>
                    <Chip label={member.department} size="small" color="primary" variant="outlined" />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        تجربه: {member.experience} سال
                    </Typography>
                </Box>

                {member.bio?.fa && (
                    <Typography variant="body2" sx={{ mb: 2, fontSize: "0.875rem" }}>
                        {member.bio.fa.substring(0, 100)}...
                    </Typography>
                )}

                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2 }}>
                    {member.skills?.slice(0, 4).map((skill, index) => (
                        <Chip key={index} label={skill} size="small" variant="outlined" sx={{ fontSize: "0.7rem", mb: 0.5 }} />
                    ))}
                </Stack>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={1}>
                        {member.socialMedia?.linkedin && (
                            <IconButton size="small" component={Link} href={member.socialMedia.linkedin}>
                                <LinkedIn fontSize="small" />
                            </IconButton>
                        )}
                        {member.socialMedia?.twitter && (
                            <IconButton size="small" component={Link} href={member.socialMedia.twitter}>
                                <Twitter fontSize="small" />
                            </IconButton>
                        )}
                        {member.email && (
                            <IconButton size="small" component={Link} href={`mailto:${member.email}`}>
                                <Email fontSize="small" />
                            </IconButton>
                        )}
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleEdit(member)}>
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(member)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
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
                            معرفی اعضای تیم و مهارت‌های آن‌ها
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <Button variant={viewMode === "table" ? "contained" : "outlined"} onClick={() => setViewMode("table")} size="small">
                            جدول
                        </Button>
                        <Button variant={viewMode === "cards" ? "contained" : "outlined"} onClick={() => setViewMode("cards")} size="small">
                            کارت‌ها
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                            عضو جدید
                        </Button>
                    </Stack>
                </Box>

                {viewMode === "table" ? (
                    <DataTable
                        title="لیست اعضای تیم"
                        data={teamData?.data || []}
                        columns={columns}
                        loading={isLoading}
                        pagination={teamData?.pagination}
                        onSearch={handleSearch}
                        onEdit={handleEdit}
                        onAdd={handleAdd}
                        searchPlaceholder="جستجو در اعضای تیم (حداقل 3 کاراکتر)..."
                        enableSelection={true}
                        customActions={customActions}
                        filters={filters}
                    />
                ) : (
                    <Box>
                        <Grid container spacing={3}>
                            {(teamData?.data || []).map((member) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={member._id}>
                                    <TeamMemberCard member={member} />
                                </Grid>
                            ))}
                        </Grid>

                        {(!teamData?.data || teamData.data.length === 0) && !isLoading && (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Typography variant="h6" color="text.secondary">
                                    عضوی در تیم یافت نشد
                                </Typography>
                                <Button variant="contained" startIcon={<Add />} onClick={handleAdd} sx={{ mt: 2 }}>
                                    اولین عضو تیم را اضافه کنید
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Team Member Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? "ویرایش عضو تیم" : "اضافه کردن عضو جدید"} maxWidth="lg" fullWidth>
                    <TeamMemberForm member={editingMember} onSave={handleSaveMember} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}
