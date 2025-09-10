"use client";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Container, Paper } from "@mui/material";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { validateEmail } from "../../../lib/utils";

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const { login } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = "ایمیل الزامی است";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "فرمت ایمیل نادرست است";
        }

        if (!formData.password) {
            newErrors.password = "رمز عبور الزامی است";
        } else if (formData.password.length < 6) {
            newErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setMessage("");

        const result = await login(formData.email, formData.password);

        if (!result.success) {
            setMessage(result.message);
        }

        setLoading(false);
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                }}
            >
                <Paper elevation={8} sx={{ width: "100%", maxWidth: 400 }}>
                    <Box sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
                                هیکاوب
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                ورود به پنل مدیریت
                            </Typography>
                        </Box>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                {message && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {message}
                                    </Alert>
                                )}

                                <TextField
                                    fullWidth
                                    label="ایمیل"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    disabled={loading}
                                    variant="outlined"
                                />

                                <TextField
                                    fullWidth
                                    label="رمز عبور"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    disabled={loading}
                                    variant="outlined"
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{
                                        py: 1.5,
                                        fontSize: "1.1rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 2 }} />
                                            در حال ورود...
                                        </>
                                    ) : (
                                        "ورود به پنل"
                                    )}
                                </Button>
                            </Box>
                        </form>

                        {/* Footer */}
                        <Box sx={{ textAlign: "center", mt: 4 }}>
                            <Typography variant="body2" color="textSecondary">
                                آژانس دیجیتال مارکتینگ هیکاوب
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                نسخه ۱.۰.۰
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
