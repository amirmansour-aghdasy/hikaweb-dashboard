"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, Card, CardContent, Grid, Tab, Tabs, Button, Alert, Fab, TextField, Switch, FormControlLabel, MenuItem, Divider, Paper, Slider, IconButton, FormControl, InputLabel, Select, Chip, Stack, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { Settings as SettingsIcon, Save, Business, Email, Security, Storage, Notifications, Palette, WhatsApp, Add, Delete, ExpandMore, Phone, Schedule, Message, Settings as SettingsIconSmall, Search, Campaign } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import MultiLangTextField from "@/components/forms/MultiLangTextField";
import WhatsAppSettings from "@/components/settings/WhatsAppSettings";
import { useApi } from "@/hooks/useApi";
import { useUIStore } from "@/store/useUIStore";

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
        queryKey: "settings", // Explicitly set queryKey for proper cache invalidation
        onSuccess: () => {
            setHasChanges(false);
            refetch();
        },
    });

    useEffect(() => {
        if (settingsData?.data) {
            // Settings response structure: { data: { settings: {...} } }
            const settingsObj = settingsData.data.settings || settingsData.data;
            
            // Organize settings into sections for the form
            const organizedSettings = {
                general: {
                    siteName: settingsObj.siteName || { fa: "", en: "" },
                    description: settingsObj.siteDescription || { fa: "", en: "" },
                    keywords: settingsObj.seo?.defaultKeywords || { fa: [], en: [] },
                    timezone: settingsObj.system?.timezone || "Asia/Tehran",
                    dateFormat: settingsObj.system?.dateFormat || "YYYY-MM-DD",
                    defaultLanguage: settingsObj.system?.defaultLanguage || "fa",
                    enableMultiLanguage: true, // This might need to be added to backend
                    maxFileSize: settingsObj.system?.maxFileSize || 10485760,
                },
                contact: settingsObj.contact || {},
                email: settingsObj.email || {},
                security: settingsObj.security || {},
                media: settingsObj.media || {},
                notifications: settingsObj.notifications || {},
                theme: settingsObj.theme || {},
                system: settingsObj.system || {},
                seo: settingsObj.seo || {},
                whatsapp: settingsObj.whatsapp || {
                    enabled: true,
                    agents: [],
                    config: {
                        position: "bottom-right",
                        showPulse: true,
                        size: "medium",
                        collectUserInfo: false,
                        showOnPages: [],
                        hideOnPages: [],
                        offlineMode: "message",
                        language: "fa",
                        autoCloseTimer: 0,
                        notificationBadge: null
                    }
                },
                announcementBar: settingsObj.announcementBar ?? {
                    enabled: true,
                    text: "تخفیف ویژه نوروز — تا ۲۰٪ برای خدمات منتخب",
                    link: "/pricing",
                    durationDays: 7,
                    autoRenew: true,
                },
            };
            
            setSettings(organizedSettings);
        }
    }, [settingsData]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Helper function to deep merge objects, removing undefined values
    const deepMergeRemoveUndefined = (target, source) => {
        if (typeof source !== 'object' || source === null || Array.isArray(source)) {
            return source;
        }
        
        if (typeof target !== 'object' || target === null || Array.isArray(target)) {
            return source;
        }
        
        const result = { ...target };
        Object.keys(source).forEach(key => {
            if (source[key] !== undefined) {
                if (
                    typeof source[key] === 'object' &&
                    source[key] !== null &&
                    !Array.isArray(source[key]) &&
                    typeof target[key] === 'object' &&
                    target[key] !== null &&
                    !Array.isArray(target[key])
                ) {
                    result[key] = deepMergeRemoveUndefined(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        });
        return result;
    };

    const handleSettingsChange = (section, data) => {
        setSettings((prev) => {
            const newSettings = {
                ...prev,
                [section]: deepMergeRemoveUndefined(prev[section] || {}, data),
            };
            
            // Special handling for maintenance mode in general settings
            if (section === 'general' && data.maintenanceMode !== undefined) {
                newSettings.system = {
                    ...prev.system,
                    maintenanceMode: {
                        enabled: data.maintenanceMode,
                        message: prev.system?.maintenanceMode?.message || {
                            fa: 'سایت در حال تعمیر و نگهداری است. لطفاً بعداً مراجعه کنید.',
                            en: 'Site is under maintenance. Please check back later.'
                        },
                        allowedIPs: prev.system?.maintenanceMode?.allowedIPs || []
                    }
                };
                // Remove maintenanceMode from general section
                delete newSettings.general?.maintenanceMode;
            }
            
            return newSettings;
        });
        setHasChanges(true);
    };

    // Helper function to remove undefined values recursively
    // Also handles empty strings in siteDescription - if both fa and en are empty, remove the object
    const removeUndefined = (obj) => {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            return obj;
        }
        
        const cleaned = {};
        Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    // Special handling for siteDescription - if both fa and en are empty, skip it
                    if (key === 'siteDescription') {
                        const desc = obj[key];
                        if (desc.fa === "" && desc.en === "") {
                            // Skip empty siteDescription
                            return;
                        }
                    }
                    const cleanedNested = removeUndefined(obj[key]);
                    // Only add if nested object is not empty
                    if (Object.keys(cleanedNested).length > 0) {
                        cleaned[key] = cleanedNested;
                    }
                } else {
                    cleaned[key] = obj[key];
                }
            }
        });
        return cleaned;
    };

    const handleSave = async () => {
        try {
            // Convert organized settings back to flat structure for backend
            const flatSettings = {
                siteName: settings.general?.siteName,
                siteDescription: settings.general?.description,
                contact: settings.contact,
                email: settings.email,
                security: settings.security,
                media: settings.media,
                notifications: settings.notifications,
                theme: settings.theme,
                system: settings.system,
                seo: settings.seo || {},
                whatsapp: settings.whatsapp,
                announcementBar: settings.announcementBar,
            };
            
            // Remove undefined values before sending to backend
            const cleanedSettings = removeUndefined(flatSettings);
            
            // Debug log
            console.log("Saving settings:", JSON.stringify(cleanedSettings, null, 2));
            
            // Settings endpoint doesn't require ID (it's a singleton)
            await updateSettings.mutateAsync({
                id: null, // No ID needed for settings endpoint
                data: cleanedSettings,
            });
        } catch (error) {
            console.error("خطا در ذخیره تنظیمات:", error);
            // Show error toast if available
            if (error.response?.data?.message) {
                console.error("Error message:", error.response.data.message);
            }
        }
    };

    const handleReset = () => {
        if (settingsData?.data) {
            // Settings response structure: { data: { settings: {...} } }
            const settingsObj = settingsData.data.settings || settingsData.data;
            
            // Organize settings into sections for the form (same as useEffect)
            const organizedSettings = {
                general: {
                    siteName: settingsObj.siteName || { fa: "", en: "" },
                    description: settingsObj.siteDescription || { fa: "", en: "" },
                    keywords: settingsObj.seo?.defaultKeywords || { fa: [], en: [] },
                    timezone: settingsObj.system?.timezone || "Asia/Tehran",
                    dateFormat: settingsObj.system?.dateFormat || "YYYY-MM-DD",
                    defaultLanguage: settingsObj.system?.defaultLanguage || "fa",
                    enableMultiLanguage: true,
                    maxFileSize: settingsObj.system?.maxFileSize || 10485760,
                },
                contact: settingsObj.contact || {},
                email: settingsObj.email || {},
                security: settingsObj.security || {},
                media: settingsObj.media || {},
                notifications: settingsObj.notifications || {},
                theme: settingsObj.theme || {},
                system: settingsObj.system || {},
                seo: settingsObj.seo || {},
                announcementBar: settingsObj.announcementBar || {
                    enabled: true,
                    text: "تخفیف ویژه نوروز — تا ۲۰٪ برای خدمات منتخب",
                    link: "/pricing",
                    durationDays: 7,
                    autoRenew: true,
                },
            };
            
            setSettings(organizedSettings);
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
        { label: "سئو", icon: <Search /> },
        { label: "واتساپ", icon: <WhatsApp /> },
        { label: "نوار اعلان", icon: <Campaign /> },
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
                    <Grid size={{ xs: 12, md: 3 }}>
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
                    <Grid size={{ xs: 12, md: 9 }}>
                        <Card>
                            <CardContent sx={{ p: 4 }}>
                                {/* General Settings */}
                                {activeTab === 0 && <GeneralSettings settings={{ ...settings.general, system: settings.system }} onChange={(data) => handleSettingsChange("general", data)} />}

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

                                {/* SEO Settings */}
                                {activeTab === 7 && <SEOSettings settings={settings.seo || {}} onChange={(data) => handleSettingsChange("seo", data)} />}

                                {/* WhatsApp Settings */}
                                {activeTab === 8 && <WhatsAppSettings settings={settings.whatsapp || {}} onChange={(data) => handleSettingsChange("whatsapp", data)} />}

                                {/* Announcement Bar Settings */}
                                {activeTab === 9 && <AnnouncementBarSettings settings={settings.announcementBar || {}} onChange={(data) => handleSettingsChange("announcementBar", data)} />}
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
        // Extract maintenanceMode from system.maintenanceMode.enabled
        const maintenanceMode = settings?.system?.maintenanceMode?.enabled || false;
        
        // Merge settings with extracted maintenanceMode
        setFormData((prev) => ({
            ...prev,
            ...settings,
            maintenanceMode: maintenanceMode,
        }));
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
                <Grid size={{ xs: 12 }}>
                    <MultiLangTextField label="نام وب‌سایت" value={formData.siteName} onChange={(value) => handleChange("siteName", value)} required />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <MultiLangTextField label="توضیحات وب‌سایت" value={formData.description} onChange={(value) => handleChange("description", value)} multiline rows={3} />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth select label="منطقه زمانی" value={formData.timezone} onChange={(e) => handleChange("timezone", e.target.value)}>
                        <MenuItem value="Asia/Tehran">تهران</MenuItem>
                        <MenuItem value="Asia/Dubai">دبی</MenuItem>
                        <MenuItem value="Europe/London">لندن</MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth select label="زبان پیش‌فرض" value={formData.defaultLanguage} onChange={(e) => handleChange("defaultLanguage", e.target.value)}>
                        <MenuItem value="fa">فارسی</MenuItem>
                        <MenuItem value="en">انگلیسی</MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <FormControlLabel control={<Switch checked={formData.enableMultiLanguage} onChange={(e) => handleChange("enableMultiLanguage", e.target.checked)} />} label="فعال‌سازی چندزبانه" />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, bgcolor: formData.maintenanceMode ? 'warning.light' : 'background.paper' }}>
                        <FormControlLabel 
                            control={
                                <Switch 
                                    checked={formData.maintenanceMode} 
                                    onChange={(e) => handleChange("maintenanceMode", e.target.checked)} 
                                    color="warning"
                                />
                            } 
                            label="حالت تعمیر و نگهداری" 
                        />
                        {formData.maintenanceMode && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                با فعال‌سازی این گزینه، سایت برای کاربران عادی غیرفعال می‌شود و فقط صفحه تعمیر و نگهداری نمایش داده می‌شود.
                            </Alert>
                        )}
                    </Paper>
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
        phoneNumber: "",
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
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth type="email" label="ایمیل اصلی" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="تلفن ثابت" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <MultiLangTextField label="آدرس" value={formData.address} onChange={(value) => handleChange("address", value)} multiline rows={3} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        شبکه‌های اجتماعی
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Instagram" value={formData.socialMedia.instagram} onChange={(e) => handleSocialMediaChange("instagram", e.target.value)} placeholder="@username" />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Telegram" value={formData.socialMedia.telegram} onChange={(e) => handleSocialMediaChange("telegram", e.target.value)} placeholder="@username" />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="LinkedIn" value={formData.socialMedia.linkedin} onChange={(e) => handleSocialMediaChange("linkedin", e.target.value)} />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
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
        setFormData((prev) => ({
            ...prev,
            smtp: {
                host: settings?.smtp?.host ?? "",
                port: settings?.smtp?.port ?? 587,
                user: settings?.smtp?.user ?? "",
                password: settings?.smtp?.password ?? "",
            },
            from: settings?.from || { name: "", email: "" },
            notifications: settings?.notifications || { newUser: true, newComment: true, newTicket: true },
        }));
    }, [settings]);

    const handleChange = useCallback((field, value) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };
            onChange(newData);
            return newData;
        });
    }, [onChange]);

    const handleSmtpChange = useCallback((field, value) => {
        setFormData((prev) => {
            const newSmtp = { ...prev.smtp, [field]: value };
            const newData = { ...prev, smtp: newSmtp };
            onChange(newData);
            return newData;
        });
    }, [onChange]);

    const handleNotificationChange = useCallback((field, checked) => {
        setFormData((prev) => {
            const newNotifications = { ...prev.notifications, [field]: checked };
            const newData = { ...prev, notifications: newNotifications };
            onChange(newData);
            return newData;
        });
    }, [onChange]);

    return (
        <Box component="form" onSubmit={(e) => e.preventDefault()}>
            <Typography variant="h6" gutterBottom>
                تنظیمات ایمیل
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        تنظیمات SMTP
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                        fullWidth 
                        label="هاست SMTP" 
                        value={formData.smtp?.host ?? ""} 
                        onChange={(e) => handleSmtpChange("host", e.target.value)} 
                        placeholder="smtp.gmail.com" 
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                        fullWidth 
                        type="number" 
                        label="پورت" 
                        value={formData.smtp?.port ?? 587} 
                        onChange={(e) => handleSmtpChange("port", parseInt(e.target.value) || 587)} 
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                        fullWidth 
                        label="نام کاربری" 
                        value={formData.smtp?.user ?? ""} 
                        onChange={(e) => handleSmtpChange("user", e.target.value)}
                        autoComplete="username"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                        fullWidth 
                        type="password" 
                        label="رمز عبور" 
                        value={formData.smtp?.password ?? ""} 
                        onChange={(e) => handleSmtpChange("password", e.target.value)} 
                        autoComplete="new-password"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        اعلان‌های ایمیل
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.notifications?.newUser ?? false}
                                onChange={(e) => handleNotificationChange("newUser", e.target.checked)}
                            />
                        }
                        label="کاربر جدید"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.notifications?.newComment ?? false}
                                onChange={(e) => handleNotificationChange("newComment", e.target.checked)}
                            />
                        }
                        label="نظر جدید"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.notifications?.newTicket ?? false}
                                onChange={(e) => handleNotificationChange("newTicket", e.target.checked)}
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
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            محدودیت نرخ درخواست
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
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

                            <Grid size={{ xs: 12, md: 6 }}>
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

                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            خط‌مشی رمز عبور
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
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

                            <Grid size={{ xs: 12, md: 6 }}>
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
                <Grid size={{ xs: 12, md: 6 }}>
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

                <Grid size={{ xs: 12, md: 6 }}>
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
        setFormData({
            telegram: {
                enabled: settings?.telegram?.enabled ?? false,
                botToken: settings?.telegram?.botToken ?? "",
                chatId: settings?.telegram?.chatId ?? "",
            },
            sms: {
                enabled: settings?.sms?.enabled ?? false,
                apiKey: settings?.sms?.apiKey ?? "",
                sender: settings?.sms?.sender ?? "",
            },
        });
    }, [settings]);

    const handleChange = useCallback((field, value) => {
        setFormData((prev) => {
            const newData = { 
                ...prev, 
                [field]: value,
                // Ensure nested objects always exist
                telegram: field === 'telegram' ? value : (prev.telegram || { enabled: false, botToken: "", chatId: "" }),
                sms: field === 'sms' ? value : (prev.sms || { enabled: false, apiKey: "", sender: "" }),
            };
            onChange(newData);
            return newData;
        });
    }, [onChange]);

    return (
        <Box component="form" onSubmit={(e) => e.preventDefault()}>
            <Typography variant="h6" gutterBottom>
                تنظیمات اعلان‌رسانی
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        تلگرام
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.telegram?.enabled ?? false}
                                onChange={(e) => {
                                    const newTelegram = { ...formData.telegram, enabled: e.target.checked };
                                    handleChange("telegram", newTelegram);
                                }}
                            />
                        }
                        label="فعال‌سازی تلگرام"
                    />
                </Grid>

                {(formData.telegram?.enabled ?? false) && (
                    <>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Bot Token"
                                value={formData.telegram?.botToken ?? ""}
                                onChange={(e) => {
                                    const newTelegram = { ...formData.telegram, botToken: e.target.value };
                                    handleChange("telegram", newTelegram);
                                }}
                                type="password"
                                autoComplete="new-password"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Chat ID"
                                value={formData.telegram?.chatId ?? ""}
                                onChange={(e) => {
                                    const newTelegram = { ...formData.telegram, chatId: e.target.value };
                                    handleChange("telegram", newTelegram);
                                }}
                            />
                        </Grid>
                    </>
                )}

                <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        پیامک
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.sms?.enabled ?? false}
                                onChange={(e) => {
                                    const newSms = { ...formData.sms, enabled: e.target.checked };
                                    handleChange("sms", newSms);
                                }}
                            />
                        }
                        label="فعال‌سازی پیامک"
                    />
                </Grid>

                {(formData.sms?.enabled ?? false) && (
                    <>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="API Key"
                                value={formData.sms?.apiKey ?? ""}
                                onChange={(e) => {
                                    const newSms = { ...formData.sms, apiKey: e.target.value };
                                    handleChange("sms", newSms);
                                }}
                                type="password"
                                autoComplete="new-password"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="شماره فرستنده"
                                value={formData.sms?.sender ?? ""}
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
    const { darkMode, setDarkMode } = useUIStore();
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
            darkMode: darkMode,
            rtlSupport: true,
            animations: true,
        },
    });

    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...settings, features: { ...prev.features, darkMode } }));
    }, [settings, darkMode]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    const handleColorChange = (field, value) => {
        const newColors = { ...formData.colors, [field]: value };
        handleChange("colors", newColors);
    };

    const handleDarkModeToggle = (enabled) => {
        setDarkMode(enabled);
        handleChange("features", { ...formData.features, darkMode: enabled });
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
        setDarkMode(false);
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
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            رنگ‌های سیستم
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth type="color" label="رنگ اصلی" value={formData.colors.primary} onChange={(e) => handleColorChange("primary", e.target.value)} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth type="color" label="رنگ ثانویه" value={formData.colors.secondary} onChange={(e) => handleColorChange("secondary", e.target.value)} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth type="color" label="رنگ پس‌زمینه" value={formData.colors.background} onChange={(e) => handleColorChange("background", e.target.value)} />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Typography */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            تایپوگرافی
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
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

                            <Grid size={{ xs: 12, md: 6 }}>
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
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            ویژگی‌ها
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.features.darkMode}
                                            onChange={(e) => {
                                                handleDarkModeToggle(e.target.checked);
                                            }}
                                        />
                                    }
                                    label="حالت تیره"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
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

                            <Grid size={{ xs: 12, md: 4 }}>
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

// Announcement Bar Settings Component
function AnnouncementBarSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        enabled: true,
        text: "تخفیف ویژه نوروز — تا ۲۰٪ برای خدمات منتخب",
        link: "/pricing",
        durationDays: 7,
        autoRenew: true,
    });

    const defaults = {
        enabled: true,
        text: "تخفیف ویژه نوروز — تا ۲۰٪ برای خدمات منتخب",
        link: "/pricing",
        durationDays: 7,
        autoRenew: true,
    };
    useEffect(() => {
        setFormData({
            enabled: settings?.enabled ?? defaults.enabled,
            text: settings?.text ?? defaults.text,
            link: settings?.link ?? defaults.link,
            durationDays: settings?.durationDays ?? defaults.durationDays,
            autoRenew: settings?.autoRenew ?? defaults.autoRenew,
        });
    }, [
        settings?.enabled,
        settings?.text,
        settings?.link,
        settings?.durationDays,
        settings?.autoRenew,
    ]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                نوار اعلان (بالای صفحه)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                متن و لینک نوار اعلان بالای سایت و مدت زمان شمارش‌معکوس را تنظیم کنید.
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.enabled}
                                onChange={(e) => handleChange("enabled", e.target.checked)}
                            />
                        }
                        label="نمایش نوار اعلان"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="متن سمت راست نوار"
                        value={formData.text}
                        onChange={(e) => handleChange("text", e.target.value)}
                        placeholder="مثال: تخفیف ویژه نوروز — تا ۲۰٪ برای خدمات منتخب"
                        helperText="این متن در سمت راست نوار (در چیدمان RTL) نمایش داده می‌شود."
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="لینک کلی نوار"
                        value={formData.link}
                        onChange={(e) => handleChange("link", e.target.value)}
                        placeholder="/pricing"
                        helperText="با کلیک روی کل نوار کاربر به این آدرس هدایت می‌شود. مثال: /pricing برای صفحه تعرفه خدمات"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        type="number"
                        label="مدت زمان نمایش (روز)"
                        value={formData.durationDays}
                        onChange={(e) => handleChange("durationDays", Math.max(1, parseInt(e.target.value, 10) || 7))}
                        inputProps={{ min: 1, max: 365 }}
                        helperText="مدت زمان شمارش‌معکوس تایمر به روز (۱ تا ۳۶۵)"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.autoRenew}
                                onChange={(e) => handleChange("autoRenew", e.target.checked)}
                            />
                        }
                        label="تمدید خودکار (پس از اتمام زمان، شمارش‌معکوس دوباره از همین مدت شروع شود)"
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

// SEO Settings Component
function SEOSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
        defaultMetaTitle: { fa: "", en: "" },
        defaultMetaDescription: { fa: "", en: "" },
        defaultKeywords: { fa: [], en: [] },
        googleAnalyticsId: "",
        googleTagManagerId: "",
        googleSiteVerification: "",
        bingVerification: "",
    });

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            defaultMetaTitle: settings?.defaultMetaTitle || { fa: "", en: "" },
            defaultMetaDescription: settings?.defaultMetaDescription || { fa: "", en: "" },
            defaultKeywords: settings?.defaultKeywords || { fa: [], en: [] },
            googleAnalyticsId: settings?.googleAnalyticsId || "",
            googleTagManagerId: settings?.googleTagManagerId || "",
            googleSiteVerification: settings?.googleSiteVerification || "",
            bingVerification: settings?.bingVerification || "",
        }));
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تنظیمات سئو
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Meta Tags پیش‌فرض
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <MultiLangTextField
                        label="عنوان Meta پیش‌فرض"
                        value={formData.defaultMetaTitle}
                        onChange={(value) => handleChange("defaultMetaTitle", value)}
                        placeholder={{
                            fa: "عنوان سئو فارسی...",
                            en: "SEO title in English...",
                        }}
                        helperText="حداکثر 60 کاراکتر"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <MultiLangTextField
                        label="توضیحات Meta پیش‌فرض"
                        value={formData.defaultMetaDescription}
                        onChange={(value) => handleChange("defaultMetaDescription", value)}
                        multiline
                        rows={3}
                        placeholder={{
                            fa: "توضیحات سئو فارسی...",
                            en: "SEO description in English...",
                        }}
                        helperText="حداکثر 160 کاراکتر"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        Google Services
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Google Site Verification Code"
                        value={formData.googleSiteVerification}
                        onChange={(e) => handleChange("googleSiteVerification", e.target.value)}
                        placeholder="VLxXvWTZwewU8KWLrwYHStrIQCcM8AHLQh4BtVcnhtM"
                        helperText="کد verification از Google Search Console (فقط کد، نه کل meta tag)"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Google Analytics ID"
                        value={formData.googleAnalyticsId}
                        onChange={(e) => handleChange("googleAnalyticsId", e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        helperText="شناسه Google Analytics (GA4)"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Google Tag Manager ID"
                        value={formData.googleTagManagerId}
                        onChange={(e) => handleChange("googleTagManagerId", e.target.value)}
                        placeholder="GTM-XXXXXXX"
                        helperText="شناسه Google Tag Manager"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        Bing Webmaster Tools
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Bing Verification Code"
                        value={formData.bingVerification}
                        onChange={(e) => handleChange("bingVerification", e.target.value)}
                        placeholder="Bing verification code"
                        helperText="کد verification از Bing Webmaster Tools"
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
