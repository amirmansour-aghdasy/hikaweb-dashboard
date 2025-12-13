"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    MenuItem,
    Divider,
} from "@mui/material";
import { Save, Email, Phone, Language } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { formatDate, normalizeUserFields } from "@/lib/utils";

export default function ProfileInfo() {
    const { user, updateProfile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            language: "fa",
        },
    });

    useEffect(() => {
        if (user) {
            const normalized = normalizeUserFields(user);
            reset({
                name: normalized.name || "",
                email: normalized.email || "",
                phoneNumber: normalized.phone || "",
                language: user.language || "fa",
            });
        }
    }, [user, reset]);

    // Note: checkAuth is now handled globally in useAuth hook
    // No need to call it here as it will be called once on app mount

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            const result = await updateProfile({
                name: data.name,
                phoneNumber: data.phoneNumber || null,
                language: data.language,
            });

            if (result?.success) {
                toast.success("اطلاعات پروفایل با موفقیت به‌روزرسانی شد");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                اطلاعات پروفایل
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                اطلاعات شخصی خود را ویرایش کنید
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    <Grid size={{xs:12, md: 6}}>
                        <Controller
                            name="name"
                            control={control}
                            rules={{
                                required: "نام الزامی است",
                                minLength: {
                                    value: 2,
                                    message: "نام باید حداقل ۲ کاراکتر باشد",
                                },
                                maxLength: {
                                    value: 100,
                                    message: "نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد",
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    label="نام و نام خانوادگی"
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    required
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{xs:12, md: 6}}>
                        <TextField
                            fullWidth
                            label="ایمیل"
                            value={user?.email || ""}
                            disabled
                            InputProps={{
                                startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
                            }}
                            helperText="ایمیل قابل تغییر نیست"
                        />
                    </Grid>

                    <Grid size={{xs:12, md: 6}}>
                        <Controller
                            name="phoneNumber"
                            control={control}
                            rules={{
                                pattern: {
                                    value: /^(\+98|0)?9\d{9}$/,
                                    message: "شماره موبایل صحیح نیست",
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value || ""}
                                    fullWidth
                                    label="شماره موبایل"
                                    error={!!errors.phoneNumber}
                                    helperText={errors.phoneNumber?.message || "مثال: 09123456789"}
                                    InputProps={{
                                        startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />,
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{xs:12, md: 6}}>
                        <Controller
                            name="language"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    select
                                    label="زبان"
                                    InputProps={{
                                        startAdornment: <Language sx={{ mr: 1, color: "text.secondary" }} />,
                                    }}
                                >
                                    <MenuItem value="fa">فارسی</MenuItem>
                                    <MenuItem value="en">English</MenuItem>
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid size={{xs: 12}}>
                        <Divider sx={{ my: 2 }} />
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    اطلاعات اضافی
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <Typography variant="body2" color="text.secondary">
                                            نقش:
                                        </Typography>
                                        <Typography variant="body1">
                                            {user?.role?.name || user?.role || "نامشخص"}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <Typography variant="body2" color="text.secondary">
                                            آخرین ورود:
                                        </Typography>
                                        <Typography variant="body1">
                                            {user?.lastLogin ? formatDate(user.lastLogin) : "هرگز"}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <Typography variant="body2" color="text.secondary">
                                            وضعیت ایمیل:
                                        </Typography>
                                        <Typography variant="body1" color={user?.isEmailVerified ? "success.main" : "warning.main"}>
                                            {user?.isEmailVerified ? "تایید شده" : "تایید نشده"}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <Typography variant="body2" color="text.secondary">
                                            وضعیت موبایل:
                                        </Typography>
                                        <Typography variant="body1" color={user?.isPhoneNumberVerified ? "success.main" : "warning.main"}>
                                            {user?.isPhoneNumberVerified ? "تایید شده" : "تایید نشده"}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{xs: 12}}>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                                disabled={!isDirty || saving}
                            >
                                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
}

