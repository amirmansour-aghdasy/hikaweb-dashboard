"use client";
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Switch, FormControlLabel, Button, Typography, Paper, Avatar } from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useApi } from "@/hooks/useApi";
import MediaPicker from "../media/MediaPicker";
import { normalizeUserFields, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

export default function UserForm({ user, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const { useFetchData, useCreateData, useUpdateData } = useApi();

    // Fetch roles for dropdown
    const { data: rolesData, isLoading: rolesLoading } = useFetchData("roles", "/users/roles");

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
            isEmailVerified: false,
            isPhoneNumberVerified: false,
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
        // Wait for roles to load before setting role value
        if (rolesLoading) return;
        
        if (user) {
            // Handle role - it might be populated object or just ObjectId
            const roleValue = typeof user.role === 'object' && user.role?._id 
                ? user.role._id 
                : user.role;
            
            // Verify role exists in available roles
            const availableRoles = rolesData?.data?.roles || [];
            const roleExists = roleValue && availableRoles.some(r => r._id === roleValue);
            
            reset({
                name: user.name || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                role: roleExists ? roleValue : "",
                status: user.status || "active",
                avatar: user.avatar || "",
                bio: user.bio || "",
                isEmailVerified: user.isEmailVerified,
                isPhoneNumberVerified: user.isPhoneNumberVerified,
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
                isEmailVerified: false,
                isPhoneNumberVerified: false,
            });
        }
    }, [user, reset, rolesData, rolesLoading]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {

            // Prepare clean data object
            const submitData = {
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber || null,
                status: data.status,
                isEmailVerified: data.isEmailVerified,
                isPhoneNumberVerified: data.isPhoneNumberVerified,
            };

            // Handle avatar - extract URL from object or use string directly
            // IMPORTANT: data.avatar should already be a string URL from onChange handler,
            // but we check for object just in case
            let avatarUrl = null;
            
            if (data.avatar) {
                if (typeof data.avatar === 'string' && data.avatar.trim()) {
                    // Direct URL string (expected case)
                    avatarUrl = data.avatar.trim();
                } else if (typeof data.avatar === 'object' && data.avatar !== null) {
                    // Object with url property (fallback - should not happen if onChange works correctly)
                    // Try multiple possible properties
                    avatarUrl = data.avatar.url || 
                               data.avatar.thumbnailUrl || 
                               data.avatar._id || 
                               (typeof data.avatar === 'object' && data.avatar.toString ? data.avatar.toString() : null);
                    
                    // Convert to string if needed
                    if (avatarUrl && typeof avatarUrl !== 'string') {
                        avatarUrl = String(avatarUrl);
                    }
                    
                    if (avatarUrl) {
                        avatarUrl = avatarUrl.trim();
                    }
                }
            }
            
            // Only include avatar if we have a valid URL string
            if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.length > 0) {
                submitData.avatar = avatarUrl;
            } else if (user && (data.avatar === "" || data.avatar === null)) {
                // If avatar is explicitly cleared (empty string or null), send null to clear it
                submitData.avatar = null;
            }
            // If avatar is undefined or not provided, don't include it in submitData
            

            // Handle bio - only include if it has a value
            if (data.bio && data.bio.trim()) {
                submitData.bio = data.bio.trim();
            } else if (user && data.bio === "") {
                // If bio is explicitly cleared, send null
                submitData.bio = null;
            }

            // Only include role if it has changed (to avoid backend validation errors)
            if (user) {
                const currentRoleId = typeof user.role === 'object' && user.role?._id 
                    ? user.role._id 
                    : user.role;
                
                // Only send role if it's different from current role
                if (data.role && data.role !== currentRoleId) {
                    submitData.role = data.role;
                }
            } else {
                // For new users, role is required
                submitData.role = data.role;
            }

            // Add password only if provided (for new users or password updates)
            if (data.password && data.password.trim()) {
                submitData.password = data.password;
            }

            // Remove undefined values (but keep null for fields that should be cleared)
            Object.keys(submitData).forEach(key => {
                if (submitData[key] === undefined) {
                    delete submitData[key];
                }
            });

            if (user) {
                await updateUser.mutateAsync({ id: user._id, data: submitData });
            } else {
                await createUser.mutateAsync(submitData);
            }

            if (onSave) onSave();
        } catch (error) {
            // Don't log to console - show user-friendly error message
            
            // Show user-friendly error message
            let errorMessage = "خطا در ذخیره کاربر";
            
            if (error.response?.data) {
                // Try to get error message from response
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
                    // Handle validation errors
                    const validationErrors = error.response.data.errors
                        .map(err => err.message || err.msg || err)
                        .join("، ");
                    errorMessage = `خطاهای اعتبارسنجی: ${validationErrors}`;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Show error toast
            toast.error(errorMessage);
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
                                <Avatar 
                                    sx={{ width: 120, height: 120, fontSize: "3rem", bgcolor: "primary.main" }} 
                                    src={watch("avatar") || undefined}
                                >
                                    {!watch("avatar") && getInitials(watch("name") || "")}
                                </Avatar>

                                <Controller
                                    name="avatar"
                                    control={control}
                                    render={({ field }) => (
                                        <Box sx={{ width: "100%" }}>
                                            <MediaPicker
                                                value={field.value || null}
                                                onChange={(selected) => {
                                                    if (!selected) {
                                                        field.onChange("");
                                                        return;
                                                    }
                                                    
                                                    // Handle different return types from MediaPicker
                                                    let imageUrl = "";
                                                    
                                                    if (typeof selected === 'string') {
                                                        // Direct URL string
                                                        imageUrl = selected;
                                                    } else if (typeof selected === 'object' && selected !== null) {
                                                        // Object with url property (from MediaPicker/MediaLibrary)
                                                        imageUrl = selected.url || selected._id || null;
                                                        
                                                        // If still not a string, try to convert
                                                        if (imageUrl && typeof imageUrl !== 'string') {
                                                            imageUrl = String(imageUrl);
                                                        }
                                                    }
                                                    
                                                    // Only set if we have a valid URL string
                                                    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
                                                        field.onChange(imageUrl.trim());
                                                    } else {
                                                        field.onChange("");
                                                    }
                                                }}
                                                label="انتخاب تصویر پروفایل"
                                                accept="image/*"
                                                multiple={false}
                                                showPreview={true}
                                                showEdit={true}
                                                optimizeForWeb={true}
                                            />
                                        </Box>
                                    )}
                                />
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
                                        render={({ field }) => {
                                            const availableRoles = rolesData?.data?.roles || [];
                                            const isValidValue = !field.value || availableRoles.some(r => r._id === field.value);
                                            
                                            return (
                                                <FormControl fullWidth error={!!errors.role || (!rolesLoading && !isValidValue && field.value)}>
                                                    <InputLabel>نقش کاربر</InputLabel>
                                                    <Select
                                                        {...field}
                                                        label="نقش کاربر"
                                                        disabled={rolesLoading}
                                                        value={isValidValue ? field.value : ""}
                                                        inputProps={{
                                                            autoComplete: "off"
                                                        }}
                                                    >
                                                        {rolesLoading ? (
                                                            <MenuItem value="" disabled>در حال بارگذاری...</MenuItem>
                                                        ) : availableRoles.length > 0 ? (
                                                            availableRoles.map((role) => (
                                                                <MenuItem key={role._id} value={role._id}>
                                                                    {role.displayName?.fa || role.name}
                                                                </MenuItem>
                                                            ))
                                                        ) : (
                                                            <MenuItem value="" disabled>نقشی یافت نشد</MenuItem>
                                                        )}
                                                    </Select>
                                                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                                                    {!rolesLoading && !isValidValue && field.value && (
                                                        <FormHelperText error>نقش انتخابی نامعتبر است</FormHelperText>
                                                    )}
                                                </FormControl>
                                            );
                                        }}
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
                                                value: 8,
                                                message: "رمز عبور باید حداقل ۸ کاراکتر باشد",
                                            },
                                            pattern: {
                                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                message: "رمز عبور باید شامل حروف کوچک، بزرگ و عدد باشد",
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
                                                autoComplete="new-password"
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
                                                autoComplete="new-password"
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
                                        name="isEmailVerified"
                                        control={control}
                                        render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="ایمیل تایید شده" />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="isPhoneNumberVerified"
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
