"use client";
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Container,
    Paper,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validateEmail } from "../../../lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [step, setStep] = useState(token ? "reset" : "request"); // "request" or "reset"
    const [formData, setFormData] = useState({
        email: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            setStep("reset");
        }
    }, [token]);

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

    const validateRequestForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = "ایمیل الزامی است";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "فرمت ایمیل نادرست است";
        }
        return newErrors;
    };

    const validateResetForm = () => {
        const newErrors = {};
        if (!formData.newPassword) {
            newErrors.newPassword = "رمز عبور جدید الزامی است";
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = "رمز عبور باید حداقل ۸ کاراکتر باشد";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
            newErrors.newPassword = "رمز عبور باید شامل حروف کوچک، بزرگ و عدد باشد";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "تکرار رمز عبور الزامی است";
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "رمز عبور و تکرار آن یکسان نیستند";
        }

        return newErrors;
    };

    const handleRequestReset = async (e) => {
        e.preventDefault();

        const validationErrors = validateRequestForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await api.post("/auth/password/reset/request", {
                email: formData.email,
            });

            if (response.data.success) {
                setSuccess(true);
                toast.success(response.data.message);
                // Show token in development
                if (response.data.data?.token) {
                    setMessage(
                        `لینک بازنشانی: ${window.location.origin}/auth/reset-password?token=${response.data.data.token}`
                    );
                }
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "خطا در درخواست بازنشانی";
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        const validationErrors = validateResetForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (!token) {
            setMessage("توکن بازنشانی یافت نشد");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await api.post("/auth/password/reset", {
                token,
                newPassword: formData.newPassword,
            });

            if (response.data.success) {
                setSuccess(true);
                toast.success(response.data.message);
                setTimeout(() => {
                    router.push("/auth/login");
                }, 2000);
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "خطا در بازنشانی رمز عبور";
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
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
                <Paper elevation={8} sx={{ width: "100%", maxWidth: 450 }}>
                    <Box sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}
                            >
                                {step === "request" ? "بازنشانی رمز عبور" : "تغییر رمز عبور"}
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                {step === "request"
                                    ? "ایمیل خود را وارد کنید"
                                    : "رمز عبور جدید خود را وارد کنید"}
                            </Typography>
                        </Box>

                        {/* Messages */}
                        {message && (
                            <Alert
                                severity={success ? "success" : "error"}
                                sx={{ mb: 2 }}
                            >
                                {message}
                            </Alert>
                        )}

                        {/* Request Form */}
                        {step === "request" && !success && (
                            <form onSubmit={handleRequestReset}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                                                در حال ارسال...
                                            </>
                                        ) : (
                                            "ارسال لینک بازنشانی"
                                        )}
                                    </Button>

                                    <Box sx={{ textAlign: "center", mt: 2 }}>
                                        <Button
                                            variant="text"
                                            onClick={() => router.push("/auth/login")}
                                        >
                                            بازگشت به صفحه ورود
                                        </Button>
                                    </Box>
                                </Box>
                            </form>
                        )}

                        {/* Reset Form */}
                        {step === "reset" && !success && (
                            <form onSubmit={handleResetPassword}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <TextField
                                        fullWidth
                                        label="رمز عبور جدید"
                                        name="newPassword"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        error={!!errors.newPassword}
                                        helperText={
                                            errors.newPassword ||
                                            "حداقل ۸ کاراکتر شامل حروف کوچک، بزرگ و عدد"
                                        }
                                        disabled={loading}
                                        variant="outlined"
                                    />

                                    <TextField
                                        fullWidth
                                        label="تکرار رمز عبور"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        error={!!errors.confirmPassword}
                                        helperText={errors.confirmPassword}
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
                                                در حال تغییر...
                                            </>
                                        ) : (
                                            "تغییر رمز عبور"
                                        )}
                                    </Button>

                                    <Box sx={{ textAlign: "center", mt: 2 }}>
                                        <Button
                                            variant="text"
                                            onClick={() => router.push("/auth/login")}
                                        >
                                            بازگشت به صفحه ورود
                                        </Button>
                                    </Box>
                                </Box>
                            </form>
                        )}

                        {/* Success Message */}
                        {success && (
                            <Box sx={{ textAlign: "center" }}>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    {step === "request"
                                        ? "لینک بازنشانی به شماره موبایل شما ارسال شد"
                                        : "رمز عبور با موفقیت تغییر کرد. در حال انتقال به صفحه ورود..."}
                                </Alert>
                                <Button
                                    variant="contained"
                                    onClick={() => router.push("/auth/login")}
                                >
                                    رفتن به صفحه ورود
                                </Button>
                            </Box>
                        )}

                        {/* Footer */}
                        <Box sx={{ textAlign: "center", mt: 4 }}>
                            <Typography variant="body2" color="textSecondary">
                                آژانس دیجیتال مارکتینگ هیکاوب
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

