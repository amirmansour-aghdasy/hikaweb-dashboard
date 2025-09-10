"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Grid, Tab, Tabs, Button, Alert, Fab, TextField, Switch, FormControlLabel, MenuItem, Divider, Paper, Slider } from "@mui/material";
import { Settings as SettingsIcon, Save, Business, Email, Security, Storage, Notifications, Palette } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import MultiLangTextField from "@/components/forms/MultiLangTextField";
import { useApi } from "@/hooks/useApi";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [settings, setSettings] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const { useFetchData, useUpdateData } = useApi();

    // Fetch settings
    const { data: settingsData, isLoading, refetch } = useFetchData(["settings"], "/settings");

    // Update settings
    const updateSettings = useUpdateData("/settings", {
        successMessage: "تنظیمات با موفقیت به‌روزرسانی شد",
        onSuccess: () => {
            setHasChanges(false);
            refetch();
        },
    });

    useEffect(() => {
        if (settingsData?.data) {
            setSettings(settingsData.data);
        }
    }, [settingsData]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleSettingsChange = (section, data) => {
        setSettings((prev) => ({
            ...prev,
            [section]: { ...prev[section], ...data },
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateSettings.mutateAsync({
                id: settingsData.data._id,
                data: settings,
            });
        } catch (error) {
            console.error("خطا در ذخیره تنظیمات:", error);
        }
    };

    const handleReset = () => {
        if (settingsData?.data) {
            setSettings(settingsData.data);
            setHasChanges(false);
        }
    };

    const tabs = [
        { label: "عمومی", icon: <SettingsIcon /> },
        { label: "تماس", icon: <Business /> },
        { label: "ایمیل", icon: <Email /> },
        { label: "امنیت", icon: <Security /> },
        { label: "رسانه", icon: <Storage /> },
        { label: "اعلان‌ها", icon: <Notifications /> },
        { label: "ظاهر", icon: <Palette /> },
    ];

    if (isLoading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography>در حال بارگذاری تنظیمات...</Typography>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        تنظیمات سایت
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        مدیریت تنظیمات کلی وب‌سایت و سیستم
                    </Typography>
                </Box>

                {/* Changes Alert */}
                {hasChanges && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 3 }}
                        action={
                            <Box>
                                <Button size="small" onClick={handleReset} sx={{ mr: 1 }}>
                                    لغو
                                </Button>
                                <Button size="small" variant="contained" onClick={handleSave} disabled={updateSettings.isLoading}>
                                    ذخیره
                                </Button>
                            </Box>
                        }
                    >
                        تغییراتی اعمال شده که هنوز ذخیره نشده‌اند.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Tabs Sidebar */}
                    <Grid item size={{ xs: 12, md: 3 }}>
                        <Card>
                            <CardContent sx={{ p: 0 }}>
                                <Tabs
                                    orientation="vertical"
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    sx={{
                                        borderRight: 1,
                                        borderColor: "divider",
                                        "& .MuiTab-root": {
                                            alignItems: "flex-start",
                                            textAlign: "left",
                                            minHeight: 60,
                                            px: 3,
                                        },
                                    }}
                                >
                                    {tabs.map((tab, index) => (
                                        <Tab
                                            key={index}
                                            label={
                                                <Box display="flex" alignItems="center" width="100%">
                                                    <Box sx={{ mr: 2, color: "text.secondary" }}>{tab.icon}</Box>
                                                    <Typography variant="body2">{tab.label}</Typography>
                                                </Box>
                                            }
                                        />
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Content */}
                    <Grid item size={{ xs: 12, md: 9 }}>
                        <Card>
                            <CardContent sx={{ p: 4 }}>
                                {/* General Settings */}
                                {activeTab === 0 && <GeneralSettings settings={settings.general || {}} onChange={(data) => handleSettingsChange("general", data)} />}

                                {/* Contact Settings */}
                                {activeTab === 1 && <ContactSettings settings={settings.contact || {}} onChange={(data) => handleSettingsChange("contact", data)} />}

                                {/* Email Settings */}
                                {activeTab === 2 && <EmailSettings settings={settings.email || {}} onChange={(data) => handleSettingsChange("email", data)} />}

                                {/* Security Settings */}
                                {activeTab === 3 && <SecuritySettings settings={settings.security || {}} onChange={(data) => handleSettingsChange("security", data)} />}

                                {/* Media Settings */}
                                {activeTab === 4 && <MediaSettings settings={settings.media || {}} onChange={(data) => handleSettingsChange("media", data)} />}

                                {/* Notification Settings */}
                                {activeTab === 5 && <NotificationSettings settings={settings.notifications || {}} onChange={(data) => handleSettingsChange("notifications", data)} />}

                                {/* Theme Settings */}
                                {activeTab === 6 && <ThemeSettings settings={settings.theme || {}} onChange={(data) => handleSettingsChange("theme", data)} />}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Floating Save Button */}
                {hasChanges && (
                    <Fab color="primary" sx={{ position: "fixed", bottom: 24, right: 24 }} onClick={handleSave} disabled={updateSettings.isLoading}>
                        <Save />
                    </Fab>
                )}
            </Box>
        </Layout>
    );
}

// General Settings Component
function GeneralSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        siteName: { fa: "", en: "" },
        description: { fa: "", en: "" },
        keywords: { fa: "", en: "" },
        timezone: "Asia/Tehran",
        dateFormat: "YYYY-MM-DD",
        defaultLanguage: "fa",
        enableMultiLanguage: true,
        maintenanceMode: false,
        maxFileSize: 10485760,
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تنظیمات عمومی
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MultiLangTextField label="نام وب‌سایت" value={formData.siteName} onChange={(value) => handleChange("siteName", value)} required />
                </Grid>

                <Grid item xs={12}>
                    <MultiLangTextField label="توضیحات وب‌سایت" value={formData.description} onChange={(value) => handleChange("description", value)} multiline rows={3} />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth select label="منطقه زمانی" value={formData.timezone} onChange={(e) => handleChange("timezone", e.target.value)}>
                        <MenuItem value="Asia/Tehran">تهران</MenuItem>
                        <MenuItem value="Asia/Dubai">دبی</MenuItem>
                        <MenuItem value="Europe/London">لندن</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth select label="زبان پیش‌فرض" value={formData.defaultLanguage} onChange={(e) => handleChange("defaultLanguage", e.target.value)}>
                        <MenuItem value="fa">فارسی</MenuItem>
                        <MenuItem value="en">انگلیسی</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel control={<Switch checked={formData.enableMultiLanguage} onChange={(e) => handleChange("enableMultiLanguage", e.target.checked)} />} label="فعال‌سازی چندزبانه" />
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel control={<Switch checked={formData.maintenanceMode} onChange={(e) => handleChange("maintenanceMode", e.target.checked)} />} label="حالت تعمیر و نگهداری" />
                </Grid>
            </Grid>
        </Box>
    );
}

// Contact Settings Component
function ContactSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        mobile: "",
        address: { fa: "", en: "" },
        socialMedia: {
            instagram: "",
            telegram: "",
            linkedin: "",
            twitter: "",
            youtube: "",
        },
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    const handleSocialMediaChange = (platform, value) => {
        const newSocialMedia = { ...formData.socialMedia, [platform]: value };
        handleChange("socialMedia", newSocialMedia);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                اطلاعات تماس
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth type="email" label="ایمیل اصلی" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="تلفن ثابت" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </Grid>

                <Grid item xs={12}>
                    <MultiLangTextField label="آدرس" value={formData.address} onChange={(value) => handleChange("address", value)} multiline rows={3} />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        شبکه‌های اجتماعی
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Instagram" value={formData.socialMedia.instagram} onChange={(e) => handleSocialMediaChange("instagram", e.target.value)} placeholder="@username" />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Telegram" value={formData.socialMedia.telegram} onChange={(e) => handleSocialMediaChange("telegram", e.target.value)} placeholder="@username" />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="LinkedIn" value={formData.socialMedia.linkedin} onChange={(e) => handleSocialMediaChange("linkedin", e.target.value)} />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="YouTube" value={formData.socialMedia.youtube} onChange={(e) => handleSocialMediaChange("youtube", e.target.value)} />
                </Grid>
            </Grid>
        </Box>
    );
}

// Email Settings Component
function EmailSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        smtp: {
            host: "",
            port: 587,
            user: "",
            password: "",
        },
        from: {
            name: "",
            email: "",
        },
        notifications: {
            newUser: true,
            newComment: true,
            newTicket: true,
        },
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    const handleSmtpChange = (field, value) => {
        const newSmtp = { ...formData.smtp, [field]: value };
        handleChange("smtp", newSmtp);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تنظیمات ایمیل
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        تنظیمات SMTP
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="هاست SMTP" value={formData.smtp.host} onChange={(e) => handleSmtpChange("host", e.target.value)} placeholder="smtp.gmail.com" />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth type="number" label="پورت" value={formData.smtp.port} onChange={(e) => handleSmtpChange("port", parseInt(e.target.value))} />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="نام کاربری" value={formData.smtp.user} onChange={(e) => handleSmtpChange("user", e.target.value)} />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField fullWidth type="password" label="رمز عبور" value={formData.smtp.password} onChange={(e) => handleSmtpChange("password", e.target.value)} />
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        اعلان‌های ایمیل
                    </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.notifications.newUser}
                                onChange={(e) => {
                                    const newNotifications = { ...formData.notifications, newUser: e.target.checked };
                                    handleChange("notifications", newNotifications);
                                }}
                            />
                        }
                        label="کاربر جدید"
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.notifications.newComment}
                                onChange={(e) => {
                                    const newNotifications = { ...formData.notifications, newComment: e.target.checked };
                                    handleChange("notifications", newNotifications);
                                }}
                            />
                        }
                        label="نظر جدید"
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.notifications.newTicket}
                                onChange={(e) => {
                                    const newNotifications = { ...formData.notifications, newTicket: e.target.checked };
                                    handleChange("notifications", newNotifications);
                                }}
                            />
                        }
                        label="تیکت جدید"
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

// Security Settings Component
function SecuritySettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        rateLimit: {
            enabled: true,
            maxRequests: 100,
        },
        password: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
        },
        security: {
            maxLoginAttempts: 5,
            enableCsrfProtection: true,
        },
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تنظیمات امنیت
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
                تغییر این تنظیمات بر امنیت سیستم تأثیر می‌گذارد.
            </Alert>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            محدودیت نرخ درخواست
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.rateLimit.enabled}
                                            onChange={(e) => {
                                                const newRateLimit = { ...formData.rateLimit, enabled: e.target.checked };
                                                handleChange("rateLimit", newRateLimit);
                                            }}
                                        />
                                    }
                                    label="فعال‌سازی محدودیت نرخ"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="حداکثر درخواست"
                                    value={formData.rateLimit.maxRequests}
                                    onChange={(e) => {
                                        const newRateLimit = { ...formData.rateLimit, maxRequests: parseInt(e.target.value) };
                                        handleChange("rateLimit", newRateLimit);
                                    }}
                                    disabled={!formData.rateLimit.enabled}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            خط‌مشی رمز عبور
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography gutterBottom>حداقل طول رمز عبور: {formData.password.minLength}</Typography>
                                <Slider
                                    value={formData.password.minLength}
                                    onChange={(e, value) => {
                                        const newPassword = { ...formData.password, minLength: value };
                                        handleChange("password", newPassword);
                                    }}
                                    min={6}
                                    max={20}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.password.requireUppercase}
                                            onChange={(e) => {
                                                const newPassword = { ...formData.password, requireUppercase: e.target.checked };
                                                handleChange("password", newPassword);
                                            }}
                                        />
                                    }
                                    label="نیاز به حروف بزرگ"
                                />
                                <br />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.password.requireNumbers}
                                            onChange={(e) => {
                                                const newPassword = { ...formData.password, requireNumbers: e.target.checked };
                                                handleChange("password", newPassword);
                                            }}
                                        />
                                    }
                                    label="نیاز به اعداد"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

// Media Settings Component
function MediaSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        storage: {
            provider: "local",
            maxFileSize: 10485760,
            allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
        },
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تنظیمات رسانه
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label="نوع ذخیره‌سازی"
                        value={formData.storage.provider}
                        onChange={(e) => {
                            const newStorage = { ...formData.storage, provider: e.target.value };
                            handleChange("storage", newStorage);
                        }}
                    >
                        <MenuItem value="local">محلی</MenuItem>
                        <MenuItem value="arvan">آروان کلود</MenuItem>
                        <MenuItem value="aws">آمازون S3</MenuItem>
                    </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="number"
                        label="حداکثر اندازه فایل (بایت)"
                        value={formData.storage.maxFileSize}
                        onChange={(e) => {
                            const newStorage = { ...formData.storage, maxFileSize: parseInt(e.target.value) };
                            handleChange("storage", newStorage);
                        }}
                        helperText="10MB = 10485760 بایت"
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

// Notification Settings Component
function NotificationSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        telegram: {
            enabled: false,
            botToken: "",
            chatId: "",
        },
        sms: {
            enabled: false,
            apiKey: "",
            sender: "",
        },
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تنظیمات اعلان‌رسانی
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        تلگرام
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.telegram.enabled}
                                onChange={(e) => {
                                    const newTelegram = { ...formData.telegram, enabled: e.target.checked };
                                    handleChange("telegram", newTelegram);
                                }}
                            />
                        }
                        label="فعال‌سازی تلگرام"
                    />
                </Grid>

                {formData.telegram.enabled && (
                    <>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Bot Token"
                                value={formData.telegram.botToken}
                                onChange={(e) => {
                                    const newTelegram = { ...formData.telegram, botToken: e.target.value };
                                    handleChange("telegram", newTelegram);
                                }}
                                type="password"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Chat ID"
                                value={formData.telegram.chatId}
                                onChange={(e) => {
                                    const newTelegram = { ...formData.telegram, chatId: e.target.value };
                                    handleChange("telegram", newTelegram);
                                }}
                            />
                        </Grid>
                    </>
                )}

                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        پیامک
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.sms.enabled}
                                onChange={(e) => {
                                    const newSms = { ...formData.sms, enabled: e.target.checked };
                                    handleChange("sms", newSms);
                                }}
                            />
                        }
                        label="فعال‌سازی پیامک"
                    />
                </Grid>

                {formData.sms.enabled && (
                    <>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="API Key"
                                value={formData.sms.apiKey}
                                onChange={(e) => {
                                    const newSms = { ...formData.sms, apiKey: e.target.value };
                                    handleChange("sms", newSms);
                                }}
                                type="password"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="شماره فرستنده"
                                value={formData.sms.sender}
                                onChange={(e) => {
                                    const newSms = { ...formData.sms, sender: e.target.value };
                                    handleChange("sms", newSms);
                                }}
                            />
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );
}

// Theme Settings Component
function ThemeSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        colors: {
            primary: "#1976d2",
            secondary: "#dc004e",
            background: "#ffffff",
        },
        typography: {
            fontFamily: "IRANSans",
            fontSize: 14,
        },
        features: {
            darkMode: false,
            rtlSupport: true,
            animations: true,
        },
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    const handleColorChange = (field, value) => {
        const newColors = { ...formData.colors, [field]: value };
        handleChange("colors", newColors);
    };

    const resetToDefault = () => {
        const defaultTheme = {
            colors: {
                primary: "#1976d2",
                secondary: "#dc004e",
                background: "#ffffff",
            },
            typography: {
                fontFamily: "IRANSans",
                fontSize: 14,
            },
            features: {
                darkMode: false,
                rtlSupport: true,
                animations: true,
            },
        };
        setFormData(defaultTheme);
        onChange(defaultTheme);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تنظیمات ظاهر
            </Typography>

            <Grid container spacing={3}>
                {/* Colors */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            رنگ‌های سیستم
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="color" label="رنگ اصلی" value={formData.colors.primary} onChange={(e) => handleColorChange("primary", e.target.value)} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="color" label="رنگ ثانویه" value={formData.colors.secondary} onChange={(e) => handleColorChange("secondary", e.target.value)} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="color" label="رنگ پس‌زمینه" value={formData.colors.background} onChange={(e) => handleColorChange("background", e.target.value)} />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Typography */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            تایپوگرافی
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="فونت اصلی"
                                    value={formData.typography.fontFamily}
                                    onChange={(e) => {
                                        const newTypography = { ...formData.typography, fontFamily: e.target.value };
                                        handleChange("typography", newTypography);
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography gutterBottom>اندازه فونت: {formData.typography.fontSize}px</Typography>
                                <Slider
                                    value={formData.typography.fontSize}
                                    onChange={(e, value) => {
                                        const newTypography = { ...formData.typography, fontSize: value };
                                        handleChange("typography", newTypography);
                                    }}
                                    min={12}
                                    max={18}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Features */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            ویژگی‌ها
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.features.darkMode}
                                            onChange={(e) => {
                                                const newFeatures = { ...formData.features, darkMode: e.target.checked };
                                                handleChange("features", newFeatures);
                                            }}
                                        />
                                    }
                                    label="حالت تیره"
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.features.rtlSupport}
                                            onChange={(e) => {
                                                const newFeatures = { ...formData.features, rtlSupport: e.target.checked };
                                                handleChange("features", newFeatures);
                                            }}
                                        />
                                    }
                                    label="پشتیبانی راست به چپ"
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.features.animations}
                                            onChange={(e) => {
                                                const newFeatures = { ...formData.features, animations: e.target.checked };
                                                handleChange("features", newFeatures);
                                            }}
                                        />
                                    }
                                    label="انیمیشن‌ها"
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3 }}>
                            <Button variant="outlined" onClick={resetToDefault}>
                                بازگشت به پیش‌فرض
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
