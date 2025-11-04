"use client";
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Switch, FormControlLabel, Button, Typography, Paper, Avatar } from "@mui/material";
import { Save, Cancel, PhotoCamera } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useApi } from "@/hooks/useApi";

export default function UserForm({ user, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const { useFetchData, useCreateData, useUpdateData } = useApi();

    // Fetch roles for dropdown
    const { data: rolesData } = useFetchData("roles", "/users/roles");

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            password: "",
            confirmPassword: "",
            role: "",
            status: "active",
            avatar: "",
            bio: "",
            emailVerified: false,
            phoneNumberVerified: false,
        },
    });

    // Mutations
    const createUser = useCreateData("/users", {
        updateStore: true,
        storeKey: "users",
        successMessage: "کاربر با موفقیت ایجاد شد",
    });

    const updateUser = useUpdateData("/users", {
        updateStore: true,
        storeKey: "users",
        successMessage: "کاربر با موفقیت به‌روزرسانی شد",
    });

    useEffect(() => {
        if (user) {
            // Handle role - it might be populated object or just ObjectId
            const roleValue = typeof user.role === 'object' && user.role?._id 
                ? user.role._id 
                : user.role;
            
            reset({
                name: user.name || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                role: roleValue || "",
                status: user.status || "active",
                avatar: user.avatar || "",
                bio: user.bio || "",
                emailVerified: user.emailVerified || user.isEmailVerified || false,
                phoneNumberVerified: user.phoneNumberVerified || user.isPhoneNumberVerified || false,
                password: "",
                confirmPassword: "",
            });
        } else {
            // Reset to default values when no user
            reset({
                name: "",
                email: "",
                phoneNumber: "",
                password: "",
                confirmPassword: "",
                role: "",
                status: "active",
                avatar: "",
                bio: "",
                emailVerified: false,
                phoneNumberVerified: false,
            });
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            // Remove password fields if empty (for updates)
            if (user && !data.password) {
                delete data.password;
                delete data.confirmPassword;
            }

            if (user) {
                await updateUser.mutateAsync({ id: user._id, data });
            } else {
                await createUser.mutateAsync(data);
            }

            if (onSave) onSave();
        } catch (error) {
            console.error("Error saving user:", error);
        } finally {
            setLoading(false);
        }
    };

    const password = watch("password");

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">{user ? "ویرایش کاربر" : "کاربر جدید"}</Typography>
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
                    {/* Avatar Section */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, textAlign: "center" }}>
                            <Typography variant="h6" gutterBottom>
                                تصویر پروفایل
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ width: 120, height: 120 }} src={watch("avatar")}>
                                    {watch("name")?.charAt(0)}
                                </Avatar>

                                <Button variant="outlined" startIcon={<PhotoCamera />} component="label">
                                    انتخاب تصویر
                                    <input type="file" hidden accept="image/*" />
                                </Button>

                                <Controller name="avatar" control={control} render={({ field }) => <TextField {...field} fullWidth label="URL تصویر" size="small" />} />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Form Fields */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                اطلاعات کاربر
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{ required: "نام الزامی است" }}
                                        render={({ field }) => <TextField {...field} fullWidth label="نام و نام خانوادگی" error={!!errors.name} helperText={errors.name?.message} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        rules={{
                                            required: "ایمیل الزامی است",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "فرمت ایمیل نادرست است",
                                            },
                                        }}
                                        render={({ field }) => <TextField {...field} fullWidth type="email" label="ایمیل" error={!!errors.email} helperText={errors.email?.message} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="phoneNumber"
                                        control={control}
                                        rules={{
                                            pattern: {
                                                value: /^09\d{9}$/,
                                                message: "شماره تلفن نادرست است",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField {...field} fullWidth label="شماره تلفن" placeholder="09123456789" error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message} />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="role"
                                        control={control}
                                        rules={{ required: "انتخاب نقش الزامی است" }}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.role}>
                                                <InputLabel>نقش کاربر</InputLabel>
                                                <Select {...field} label="نقش کاربر">
                                                    {rolesData?.data?.roles?.map((role) => (
                                                        <MenuItem key={role._id} value={role._id}>
                                                            {role.displayName?.fa || role.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                {/* Password Fields (only for new users or when updating password) */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="password"
                                        control={control}
                                        rules={{
                                            required: !user ? "رمز عبور الزامی است" : false,
                                            minLength: {
                                                value: 6,
                                                message: "رمز عبور باید حداقل ۶ کاراکتر باشد",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                type="password"
                                                label={user ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
                                                error={!!errors.password}
                                                helperText={errors.password?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="confirmPassword"
                                        control={control}
                                        rules={{
                                            required: password ? "تایید رمز عبور الزامی است" : false,
                                            validate: (value) => value === password || "رمز عبور و تایید آن یکسان نیستند",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                type="password"
                                                label="تایید رمز عبور"
                                                error={!!errors.confirmPassword}
                                                helperText={errors.confirmPassword?.message}
                                                disabled={!password}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="bio"
                                        control={control}
                                        render={({ field }) => <TextField {...field} fullWidth multiline rows={3} label="بیوگرافی" placeholder="توضیح کوتاهی در مورد کاربر..." />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>وضعیت</InputLabel>
                                                <Select {...field} label="وضعیت">
                                                    <MenuItem value="active">فعال</MenuItem>
                                                    <MenuItem value="inactive">غیرفعال</MenuItem>
                                                    <MenuItem value="suspended">مسدود</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="emailVerified"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="ایمیل تایید شده" />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="phoneNumberVerified"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="تلفن تایید شده" />}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
}
