"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Paper, Checkbox, FormGroup, FormControl, FormLabel, Divider, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { Save, Cancel, Security, ExpandMore } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import { useApi } from "../../hooks/useApi";

const PERMISSIONS = {
    users: ["users.create", "users.read", "users.update", "users.delete"],
    roles: ["roles.create", "roles.read", "roles.update", "roles.delete"],
    articles: ["articles.create", "articles.read", "articles.update", "articles.delete"],
    services: ["services.create", "services.read", "services.update", "services.delete"],
    portfolio: ["portfolio.create", "portfolio.read", "portfolio.update", "portfolio.delete"],
    team: ["team.create", "team.read", "team.update", "team.delete"],
    faq: ["faq.create", "faq.read", "faq.update", "faq.delete"],
    brands: ["brands.create", "brands.read", "brands.update", "brands.delete"],
    carousel: ["carousel.create", "carousel.read", "carousel.update", "carousel.delete"],
    categories: ["categories.create", "categories.read", "categories.update", "categories.delete"],
    comments: ["comments.create", "comments.read", "comments.update", "comments.delete", "comments.moderate"],
    tickets: ["tickets.create", "tickets.read", "tickets.update", "tickets.delete", "tickets.assign"],
    consultations: ["consultations.read", "consultations.update", "consultations.delete"],
    media: ["media.create", "media.read", "media.update", "media.delete"],
    settings: ["settings.read", "settings.update"],
    analytics: ["analytics.read"],
    admin: ["admin.all"],
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
    admin: "مدیریت کل",
};

export default function RoleForm({ role, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const { useCreateData, useUpdateData } = useApi();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            name: "",
            displayName: { fa: "", en: "" },
            description: { fa: "", en: "" },
            permissions: [],
            priority: 0,
            isSystem: false,
            status: "active",
        },
    });

    const createRole = useCreateData("/roles", {
        successMessage: "نقش با موفقیت ایجاد شد",
    });

    const updateRole = useUpdateData("/roles", {
        successMessage: "نقش با موفقیت به‌روزرسانی شد",
    });

    useEffect(() => {
        if (role) {
            reset({
                name: role.name || "",
                displayName: role.displayName || { fa: "", en: "" },
                description: role.description || { fa: "", en: "" },
                permissions: role.permissions || [],
                priority: role.priority || 0,
                isSystem: role.isSystem || false,
                status: role.status || "active",
            });
        } else {
            reset({
                name: "",
                displayName: { fa: "", en: "" },
                description: { fa: "", en: "" },
                permissions: [],
                priority: 0,
                isSystem: false,
                status: "active",
            });
        }
    }, [role, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            // Auto-generate name from displayName if not provided
            if (!data.name && data.displayName?.fa) {
                data.name = data.displayName.fa
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, "");
            }

            if (role) {
                await updateRole.mutateAsync({ id: role._id, data });
            } else {
                await createRole.mutateAsync(data);
            }

            if (onSave) onSave();
        } catch (error) {
            // Don't log to console - show user-friendly error message
        } finally {
            setLoading(false);
        }
    };

    const watchedPermissions = watch("permissions") || [];

    const handlePermissionChange = (permission, checked, onChange) => {
        const current = watchedPermissions;
        if (checked) {
            onChange([...current, permission]);
        } else {
            onChange(current.filter((p) => p !== permission));
        }
    };

    const handleSelectAll = (group, permissions, onChange) => {
        const current = watchedPermissions;
        const allSelected = permissions.every((p) => current.includes(p));
        
        if (allSelected) {
            // Deselect all
            onChange(current.filter((p) => !permissions.includes(p)));
        } else {
            // Select all
            const newPermissions = [...new Set([...current, ...permissions])];
            onChange(newPermissions);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">{role ? "ویرایش نقش" : "نقش جدید"}</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button variant="contained" type="submit" startIcon={<Save />} disabled={loading}>
                            {loading ? "در حال ذخیره..." : "ذخیره"}
                        </Button>
                        <Button variant="outlined" startIcon={<Cancel />} onClick={onCancel} disabled={loading}>
                            انصراف
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                اطلاعات پایه
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{ required: "شناسه نقش الزامی است" }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label="شناسه نقش (انگلیسی)"
                                                placeholder="admin, editor, etc."
                                                error={!!errors.name}
                                                helperText={errors.name?.message}
                                                disabled={!!role} // Cannot change name after creation
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="displayName"
                                        control={control}
                                        rules={{ required: "نام نمایشی الزامی است" }}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="نام نمایشی"
                                                required
                                                error={errors.displayName}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="توضیحات"
                                                multiline
                                                rows={3}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="priority"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                fullWidth
                                                label="اولویت"
                                                helperText="نقش‌های با اولویت بالاتر در ابتدای لیست نمایش داده می‌شوند"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <select
                                                    {...field}
                                                    style={{
                                                        width: "100%",
                                                        padding: "16.5px 14px",
                                                        border: "1px solid #ddd",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    <option value="active">فعال</option>
                                                    <option value="inactive">غیرفعال</option>
                                                </select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Permissions */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                دسترسی‌ها
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                دسترسی‌های مورد نیاز برای این نقش را انتخاب کنید
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {Object.entries(PERMISSIONS).map(([group, permissions]) => (
                                    <Accordion key={group}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                                                <Controller
                                                    name="permissions"
                                                    control={control}
                                                    render={({ field: { onChange } }) => (
                                                        <Checkbox
                                                            checked={permissions.every((p) => watchedPermissions.includes(p))}
                                                            indeterminate={
                                                                permissions.some((p) => watchedPermissions.includes(p)) &&
                                                                !permissions.every((p) => watchedPermissions.includes(p))
                                                            }
                                                            onChange={(e) => handleSelectAll(group, permissions, onChange)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    )}
                                                />
                                                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                                                    {PERMISSION_GROUPS[group]}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                                    {permissions.filter((p) => watchedPermissions.includes(p)).length} / {permissions.length}
                                                </Typography>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <FormGroup>
                                                <Grid container spacing={1}>
                                                    {permissions.map((permission) => (
                                                        <Grid size={{ xs: 12, md: 6 }} key={permission}>
                                                            <Controller
                                                                name="permissions"
                                                                control={control}
                                                                render={({ field: { onChange } }) => (
                                                                    <FormControlLabel
                                                                        control={
                                                                            <Checkbox
                                                                                checked={watchedPermissions.includes(permission)}
                                                                                onChange={(e) =>
                                                                                    handlePermissionChange(permission, e.target.checked, onChange)
                                                                                }
                                                                            />
                                                                        }
                                                                        label={permission.replace(".", " - ")}
                                                                    />
                                                                )}
                                                            />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </FormGroup>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
}

