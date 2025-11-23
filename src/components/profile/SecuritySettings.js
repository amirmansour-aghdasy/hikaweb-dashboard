"use client";
import { useState } from "react";
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
    Divider,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { Save, Visibility, VisibilityOff, Lock } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";

export default function SecuritySettings() {
    const { changePassword } = useAuth();
    const [saving, setSaving] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const newPassword = watch("newPassword");

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            const result = await changePassword(data.currentPassword, data.newPassword);

            if (result?.success) {
                toast.success("رمز عبور با موفقیت تغییر کرد");
                reset();
            }
        } catch (error) {
            console.error("Error changing password:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تغییر رمز عبور
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                برای تغییر رمز عبور، رمز عبور فعلی و رمز عبور جدید خود را وارد کنید
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                رمز عبور باید حداقل ۸ کاراکتر باشد و شامل حروف کوچک، بزرگ و عدد باشد.
            </Alert>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    <Grid item size={{xs: 12}}>
                        <Controller
                            name="currentPassword"
                            control={control}
                            rules={{
                                required: "رمز عبور فعلی الزامی است",
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    type={showCurrentPassword ? "text" : "password"}
                                    label="رمز عبور فعلی"
                                    placeholder="رمز عبور فعلی خود را وارد کنید"
                                    error={!!errors.currentPassword}
                                    helperText={errors.currentPassword?.message || "رمز عبور فعلی برای تغییر رمز عبور الزامی است"}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock sx={{ color: "text.secondary" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    edge="end"
                                                >
                                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item size={{xs: 12, md: 6}}>
                        <Controller
                            name="newPassword"
                            control={control}
                            rules={{
                                required: "رمز عبور جدید الزامی است",
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
                                    type={showNewPassword ? "text" : "password"}
                                    label="رمز عبور جدید"
                                    error={!!errors.newPassword}
                                    helperText={errors.newPassword?.message}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    edge="end"
                                                >
                                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item size={{xs: 12, md: 6}}>
                        <Controller
                            name="confirmPassword"
                            control={control}
                            rules={{
                                required: "تکرار رمز عبور الزامی است",
                                validate: (value) =>
                                    value === newPassword || "رمز عبور و تکرار آن یکسان نیستند",
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    type={showConfirmPassword ? "text" : "password"}
                                    label="تکرار رمز عبور جدید"
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword?.message}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item size={{xs: 12}}>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => reset()}
                                disabled={!isDirty || saving}
                            >
                                انصراف
                            </Button>
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

