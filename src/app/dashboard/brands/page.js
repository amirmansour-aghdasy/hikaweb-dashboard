"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Card, CardContent, Grid, IconButton, Tooltip, Rating, Link } from "@mui/material";
import { Business, Edit, Delete, Add, Language, Email, Phone, Star, Work, TrendingUp, Visibility, LinkedIn, Twitter, Instagram } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import BrandForm from "@/components/forms/BrandForm";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

const INDUSTRY_CONFIG = {
    technology: { label: "فناوری", color: "primary", icon: "💻" },
    healthcare: { label: "بهداشت و درمان", color: "success", icon: "🏥" },
    finance: { label: "مالی", color: "warning", icon: "💰" },
    education: { label: "آموزش", color: "info", icon: "🎓" },
    retail: { label: "خرده‌فروشی", color: "secondary", icon: "🛒" },
    manufacturing: { label: "تولیدی", color: "default", icon: "🏭" },
    services: { label: "خدمات", color: "primary", icon: "🔧" },
    other: { label: "سایر", color: "default", icon: "🏢" },
};

const COMPANY_SIZES = {
    startup: { label: "استارتاپ", color: "info" },
    small: { label: "کوچک", color: "success" },
    medium: { label: "متوسط", color: "warning" },
    large: { label: "بزرگ", color: "error" },
    enterprise: { label: "سازمانی", color: "secondary" },
};

export default function BrandsPage() {
    const [editingBrand, setEditingBrand] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [industryFilter, setIndustryFilter] = useState("all");
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
        if (industryFilter !== "all") {
            params.append("industry", industryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, industryFilter]);

    const endpoint = `/brands${queryParams ? `?${queryParams}` : ""}`;

    // Fetch brands
    const { data: brandsData, isLoading } = useFetchData(["brands", queryParams], endpoint);

    // Update brand
    const updateBrand = useUpdateData("/brands", {
        successMessage: "برند با موفقیت به‌روزرسانی شد",
    });

    // Delete brand
    const deleteBrand = useDeleteData("/brands", {
        successMessage: "برند با موفقیت حذف شد",
    });

    const columns = [
        {
            field: "logo",
            headerName: "لوگو",
            width: 80,
            render: (row) => (
                <Avatar src={row.logo} variant="rounded" sx={{ width: 40, height: 40 }}>
                    <Business />
                </Avatar>
            ),
        },
        {
            field: "name",
            headerName: "نام برند",
            flex: 2,
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.website && (
                            <Link href={row.website} target="_blank" rel="noopener">
                                {row.website.replace(/^https?:\/\//, "")}
                            </Link>
                        )}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "industry",
            headerName: "صنعت",
            width: 150,
            render: (row) => {
                const config = INDUSTRY_CONFIG[row.industry] || INDUSTRY_CONFIG.other;
                return <Chip label={config.label} size="small" color={config.color} icon={<span style={{ fontSize: "12px" }}>{config.icon}</span>} />;
            },
        },
        {
            field: "companySize",
            headerName: "اندازه شرکت",
            width: 120,
            render: (row) => {
                const config = COMPANY_SIZES[row.companySize] || COMPANY_SIZES.small;
                return <Chip label={config.label} size="small" color={config.color} variant="outlined" />;
            },
        },
        {
            field: "contact",
            headerName: "تماس",
            width: 200,
            render: (row) => (
                <Box>
                    {row.contactPerson && (
                        <Typography variant="caption" display="block" fontWeight="bold">
                            {row.contactPerson}
                        </Typography>
                    )}
                    {row.email && (
                        <Typography variant="caption" display="block" color="text.secondary">
                            📧 {row.email}
                        </Typography>
                    )}
                    {row.phone && (
                        <Typography variant="caption" display="block" color="text.secondary">
                            📞 {row.phone}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "collaboration",
            headerName: "همکاری",
            width: 150,
            render: (row) => (
                <Box>
                    {row.startDate && (
                        <Typography variant="caption" display="block">
                            شروع: {formatDate(row.startDate)}
                        </Typography>
                    )}
                    {row.rating && <Rating value={row.rating} readOnly size="small" precision={0.5} />}
                    <Typography variant="caption" color="text.secondary">
                        {row.projectsCount || 0} پروژه
                    </Typography>
                </Box>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 100,
            type: "status",
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 120,
            render: (row) => <Typography variant="caption">{formatDate(row.createdAt)}</Typography>,
        },
    ];

    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const handleDelete = (brand) => {
        if (window.confirm("آیا از حذف این برند اطمینان دارید؟")) {
            deleteBrand.mutate(brand._id);
        }
    };

    const handleToggleFeatured = (brand) => {
        updateBrand.mutate({
            id: brand._id,
            data: { isFeatured: !brand.isFeatured },
        });
    };

    const handleAdd = () => {
        setEditingBrand(null);
        setIsModalOpen(true);
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const handleSaveBrand = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    const customActions = [
        {
            label: "مشاهده وب‌سایت",
            icon: <Language />,
            onClick: (brand) => {
                if (brand.website) {
                    window.open(brand.website, "_blank");
                }
            },
            show: (brand) => !!brand.website,
        },
        {
            label: "ویژه",
            icon: (brand) => (brand.isFeatured ? <Star /> : <Star style={{ opacity: 0.3 }} />),
            onClick: handleToggleFeatured,
            color: (brand) => (brand.isFeatured ? "secondary" : "default"),
        },
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
            key: "industry",
            label: "صنعت",
            value: industryFilter,
            onChange: setIndustryFilter,
            options: [
                { value: "all", label: "همه صنایع" },
                ...Object.entries(INDUSTRY_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: config.label,
                })),
            ],
        },
    ];

    // Brand Card Component
    const BrandCard = ({ brand }) => (
        <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
            <CardContent>
                <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Avatar src={brand.logo} variant="rounded" sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}>
                        <Business sx={{ fontSize: 40 }} />
                    </Avatar>

                    <Typography variant="h6" gutterBottom>
                        {brand.name}
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                        <Chip label={INDUSTRY_CONFIG[brand.industry]?.label || "نامشخص"} size="small" color={INDUSTRY_CONFIG[brand.industry]?.color || "default"} />
                        {brand.isFeatured && <Chip label="ویژه" size="small" color="secondary" icon={<Star />} />}
                    </Stack>
                </Box>

                {brand.description && (
                    <Typography variant="body2" sx={{ mb: 2, fontSize: "0.875rem", textAlign: "center" }}>
                        {brand.description.length > 100 ? `${brand.description.substring(0, 100)}...` : brand.description}
                    </Typography>
                )}

                <Box sx={{ mb: 2 }}>
                    {brand.contactPerson && (
                        <Typography variant="caption" display="block">
                            👤 {brand.contactPerson}
                        </Typography>
                    )}
                    {brand.email && (
                        <Typography variant="caption" display="block">
                            📧 {brand.email}
                        </Typography>
                    )}
                    {brand.phone && (
                        <Typography variant="caption" display="block">
                            📞 {brand.phone}
                        </Typography>
                    )}
                </Box>

                {brand.rating && (
                    <Box sx={{ textAlign: "center", mb: 2 }}>
                        <Rating value={brand.rating} readOnly size="small" precision={0.5} />
                        <Typography variant="caption" display="block" color="text.secondary">
                            {brand.projectsCount || 0} پروژه انجام شده
                        </Typography>
                    </Box>
                )}

                {/* Social Media Links */}
                {(brand.socialMedia?.linkedin || brand.socialMedia?.twitter || brand.socialMedia?.instagram) && (
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                        {brand.socialMedia?.linkedin && (
                            <IconButton size="small" component={Link} href={brand.socialMedia.linkedin} target="_blank">
                                <LinkedIn fontSize="small" />
                            </IconButton>
                        )}
                        {brand.socialMedia?.twitter && (
                            <IconButton size="small" component={Link} href={brand.socialMedia.twitter} target="_blank">
                                <Twitter fontSize="small" />
                            </IconButton>
                        )}
                        {brand.socialMedia?.instagram && (
                            <IconButton size="small" component={Link} href={brand.socialMedia.instagram} target="_blank">
                                <Instagram fontSize="small" />
                            </IconButton>
                        )}
                    </Stack>
                )}

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={0.5}>
                        {brand.website && (
                            <IconButton size="small" onClick={() => window.open(brand.website, "_blank")}>
                                <Language fontSize="small" />
                            </IconButton>
                        )}
                        <IconButton size="small" onClick={() => handleEdit(brand)}>
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(brand)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Chip label={COMPANY_SIZES[brand.companySize]?.label || "نامشخص"} size="small" color={COMPANY_SIZES[brand.companySize]?.color || "default"} variant="outlined" />
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
                            مدیریت برندها
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            مدیریت برندها و مشتریان آژانس
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
                            برند جدید
                        </Button>
                    </Stack>
                </Box>

                {viewMode === "table" ? (
                    <DataTable
                        title="لیست برندها"
                        data={brandsData?.data || []}
                        columns={columns}
                        loading={isLoading}
                        pagination={brandsData?.pagination}
                        onSearch={handleSearch}
                        onEdit={handleEdit}
                        onAdd={handleAdd}
                        searchPlaceholder="جستجو در برندها (حداقل 3 کاراکتر)..."
                        enableSelection={true}
                        customActions={customActions}
                        filters={filters}
                    />
                ) : (
                    <Box>
                        <Grid container spacing={3}>
                            {(brandsData?.data || []).map((brand) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={brand._id}>
                                    <BrandCard brand={brand} />
                                </Grid>
                            ))}
                        </Grid>

                        {(!brandsData?.data || brandsData.data.length === 0) && !isLoading && (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Business sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    برندی یافت نشد
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    اولین برند خود را اضافه کنید
                                </Typography>
                                <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                                    افزودن برند جدید
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Brand Form Modal */}
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBrand ? "ویرایش برند" : "افزودن برند جدید"} maxWidth="md" fullWidth>
                    <BrandForm brand={editingBrand} onSave={handleSaveBrand} onCancel={() => setIsModalOpen(false)} />
                </Modal>
            </Box>
        </Layout>
    );
}
