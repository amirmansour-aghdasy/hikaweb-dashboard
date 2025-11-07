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
    Tabs,
    Tab,
    Link,
    Divider,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { validateEmail } from "../../../lib/utils";
import api from "@/lib/api";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [tabValue, setTabValue] = useState(0); // 0: Password, 1: OTP
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        otp: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState("");

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

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setFormData({ email: formData.email, password: "", otp: "" });
        setErrors({});
        setMessage("");
        setOtpSent(false);
    };

    const validateEmailField = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = "ایمیل الزامی است";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "فرمت ایمیل نادرست است";
        }
        return newErrors;
    };

    const validatePasswordForm = () => {
        const newErrors = validateEmailField();
        if (!formData.password) {
            newErrors.password = "رمز عبور الزامی است";
        } else if (formData.password.length < 6) {
            newErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد";
        }
        return newErrors;
    };

    const validateOTPForm = () => {
        const newErrors = validateEmailField();
        if (!formData.otp) {
            newErrors.otp = "کد تایید الزامی است";
        } else if (formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
            newErrors.otp = "کد تایید باید ۶ رقم باشد";
        }
        return newErrors;
    };

    const handleRequestOTP = async () => {
        const validationErrors = validateEmailField();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setOtpLoading(true);
        setMessage("");

        try {
            const response = await api.post("/auth/dashboard/otp/request", {
                email: formData.email,
            });

            if (response.data.success) {
                setOtpSent(true);
                toast.success(response.data.message || "کد تایید ارسال شد");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "خطا در ارسال کد تایید";
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOTPLogin = async (e) => {
        e.preventDefault();

        const validationErrors = validateOTPForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (!otpSent) {
            setMessage("لطفاً ابتدا کد تایید را درخواست دهید");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await api.post("/auth/dashboard/otp/verify", {
                email: formData.email,
                otp: formData.otp,
            });

            if (response.data.success) {
                const { user, tokens } = response.data.data;
                const token = tokens.accessToken || tokens.token;

                if (!token) {
                    toast.error("خطا در دریافت توکن احراز هویت");
                    return;
                }

                Cookies.set("token", token, {
                    expires: 7,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    path: "/",
                });

                toast.success("با موفقیت وارد شدید");
                router.push("/dashboard");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "خطا در ورود";
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();

        const validationErrors = validatePasswordForm();
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
                <Paper elevation={8} sx={{ width: "100%", maxWidth: 450 }}>
                    <Box sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}
                            >
                                هیکاوب
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                ورود به پنل مدیریت
                            </Typography>
                        </Box>

                        {/* Tabs */}
                        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant="fullWidth"
                            >
                                <Tab label="رمز عبور" />
                                <Tab label="کد یکبار مصرف" />
                            </Tabs>
                        </Box>

                        {/* Messages */}
                        {message && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {message}
                            </Alert>
                        )}

                        {/* Password Login Form */}
                        {tabValue === 0 && (
                            <form onSubmit={handlePasswordLogin}>
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

                                    <Box sx={{ textAlign: "left" }}>
                                        <Link
                                            href="/auth/reset-password"
                                            underline="hover"
                                            sx={{ fontSize: "0.875rem" }}
                                        >
                                            رمز عبور را فراموش کرده‌اید؟
                                        </Link>
                                    </Box>

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
                        )}

                        {/* OTP Login Form */}
                        {tabValue === 1 && (
                            <form onSubmit={handleOTPLogin}>
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
                                        disabled={loading || otpSent}
                                        variant="outlined"
                                    />

                                    {!otpSent ? (
                                        <Button
                                            type="button"
                                            fullWidth
                                            variant="outlined"
                                            size="large"
                                            onClick={handleRequestOTP}
                                            disabled={otpLoading || loading}
                                            sx={{
                                                py: 1.5,
                                                fontSize: "1rem",
                                            }}
                                        >
                                            {otpLoading ? (
                                                <>
                                                    <CircularProgress size={20} sx={{ mr: 2 }} />
                                                    در حال ارسال...
                                                </>
                                            ) : (
                                                "ارسال کد تایید"
                                            )}
                                        </Button>
                                    ) : (
                                        <>
                                            <TextField
                                                fullWidth
                                                label="کد تایید"
                                                name="otp"
                                                type="text"
                                                value={formData.otp}
                                                onChange={handleChange}
                                                error={!!errors.otp}
                                                helperText={errors.otp || "کد ۶ رقمی ارسال شده را وارد کنید"}
                                                disabled={loading}
                                                variant="outlined"
                                                inputProps={{
                                                    maxLength: 6,
                                                    pattern: "[0-9]*",
                                                }}
                                            />

                                            <Button
                                                type="button"
                                                variant="text"
                                                size="small"
                                                onClick={handleRequestOTP}
                                                disabled={otpLoading || loading}
                                                sx={{ alignSelf: "flex-start" }}
                                            >
                                                {otpLoading ? "در حال ارسال..." : "ارسال مجدد کد"}
                                            </Button>

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
                                                    "ورود با کد تایید"
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </form>
                        )}

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
