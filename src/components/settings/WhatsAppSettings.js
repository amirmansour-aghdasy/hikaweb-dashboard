"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Grid,
    TextField,
    Switch,
    FormControlLabel,
    Button,
    IconButton,
    Card,
    CardContent,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
} from "@mui/material";
import { Add, Delete, ExpandMore, Phone, Schedule, Message, Settings as SettingsIconSmall } from "@mui/icons-material";

const DAYS = [
    { value: "saturday", label: "شنبه" },
    { value: "sunday", label: "یکشنبه" },
    { value: "monday", label: "دوشنبه" },
    { value: "tuesday", label: "سه‌شنبه" },
    { value: "wednesday", label: "چهارشنبه" },
    { value: "thursday", label: "پنج‌شنبه" },
    { value: "friday", label: "جمعه" },
];

export default function WhatsAppSettings({ settings, onChange }) {
    const [formData, setFormData] = useState({
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
            notificationBadge: null,
        },
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                enabled: settings.enabled !== false,
                agents: settings.agents || [],
                config: {
                    position: settings.config?.position || "bottom-right",
                    showPulse: settings.config?.showPulse !== false,
                    size: settings.config?.size || "medium",
                    collectUserInfo: settings.config?.collectUserInfo || false,
                    showOnPages: settings.config?.showOnPages || [],
                    hideOnPages: settings.config?.hideOnPages || [],
                    offlineMode: settings.config?.offlineMode || "message",
                    language: settings.config?.language || "fa",
                    autoCloseTimer: settings.config?.autoCloseTimer || 0,
                    notificationBadge: settings.config?.notificationBadge || null,
                },
            });
        }
    }, [settings]);

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    };

    const handleConfigChange = (field, value) => {
        const newConfig = { ...formData.config, [field]: value };
        const newData = { ...formData, config: newConfig };
        setFormData(newData);
        onChange(newData);
    };

    const addAgent = () => {
        const newAgent = {
            phoneNumber: "",
            name: "",
            message: "سلام، می‌خواهم در مورد خدمات شما اطلاعات بیشتری دریافت کنم.",
            workingHours: {
                enabled: false,
                timezone: "Asia/Tehran",
                schedule: DAYS.map((day) => ({
                    day: day.value,
                    isOpen: true,
                    openTime: "09:00",
                    closeTime: "18:00",
                })),
            },
            offlineMessage: "متأسفانه در حال حاضر خارج از ساعات کاری هستیم. لطفاً پیام خود را ارسال کنید تا در اولین فرصت با شما تماس بگیریم.",
        };
        handleChange("agents", [...formData.agents, newAgent]);
    };

    const removeAgent = (index) => {
        const newAgents = formData.agents.filter((_, i) => i !== index);
        handleChange("agents", newAgents);
    };

    const updateAgent = (index, field, value) => {
        const newAgents = [...formData.agents];
        const agent = newAgents[index];
        
        if (field.includes(".")) {
            const parts = field.split(".");
            if (parts.length === 2) {
                const [parent, child] = parts;
                newAgents[index] = {
                    ...agent,
                    [parent]: {
                        ...(agent[parent] || {}),
                        [child]: value,
                    },
                };
            } else {
                // Handle deeper nesting if needed
                newAgents[index] = { ...agent, [field]: value };
            }
        } else {
            newAgents[index] = { ...agent, [field]: value };
        }
        handleChange("agents", newAgents);
    };

    const updateAgentSchedule = (agentIndex, dayValue, field, value) => {
        const newAgents = [...formData.agents];
        const agent = newAgents[agentIndex];
        const schedule = [...(agent.workingHours?.schedule || [])];
        
        // Find the schedule item for this day, or create a new one
        const scheduleIndex = schedule.findIndex((s) => s.day === dayValue);
        
        if (scheduleIndex >= 0) {
            // Update existing schedule item
            schedule[scheduleIndex] = { ...schedule[scheduleIndex], [field]: value };
        } else {
            // Create new schedule item
            schedule.push({
                day: dayValue,
                isOpen: true,
                openTime: "09:00",
                closeTime: "18:00",
                [field]: value,
            });
        }
        
        newAgents[agentIndex] = {
            ...agent,
            workingHours: {
                ...agent.workingHours,
                enabled: agent.workingHours?.enabled || false,
                timezone: agent.workingHours?.timezone || "Asia/Tehran",
                schedule,
            },
        };
        handleChange("agents", newAgents);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                مدیریت چت واتساپ
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                مدیریت کامل دکمه و چت واتساپ از اینجا
            </Typography>

            {/* Enable/Disable */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <FormControlLabel
                        control={<Switch checked={formData.enabled} onChange={(e) => handleChange("enabled", e.target.checked)} />}
                        label="فعال‌سازی چت واتساپ"
                    />
                    {!formData.enabled && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            چت واتساپ در حال حاضر غیرفعال است و در سایت نمایش داده نمی‌شود.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Agents */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">کارشناسان پشتیبانی</Typography>
                        <Button startIcon={<Add />} variant="outlined" onClick={addAgent} disabled={!formData.enabled}>
                            افزودن کارشناس
                        </Button>
                    </Box>

                    {formData.agents.length === 0 ? (
                        <Alert severity="warning">هیچ کارشناسی تعریف نشده است. لطفاً حداقل یک کارشناس اضافه کنید.</Alert>
                    ) : (
                        <Stack spacing={2}>
                            {formData.agents.map((agent, agentIndex) => (
                                <Accordion key={agentIndex} defaultExpanded={agentIndex === 0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Phone />
                                                <Typography variant="subtitle1">
                                                    {agent.name || `کارشناس ${agentIndex + 1}`}
                                                </Typography>
                                                {agent.phoneNumber && <Chip label={agent.phoneNumber} size="small" />}
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeAgent(agentIndex);
                                                }}
                                                color="error"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={3}>
                                            <Grid item size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="نام کارشناس"
                                                    value={agent.name}
                                                    onChange={(e) => updateAgent(agentIndex, "name", e.target.value)}
                                                    required
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="شماره واتساپ"
                                                    value={agent.phoneNumber}
                                                    onChange={(e) => updateAgent(agentIndex, "phoneNumber", e.target.value)}
                                                    placeholder="9120997935"
                                                    required
                                                    helperText="شماره را بدون + و فاصله وارد کنید"
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    label="پیام پیش‌فرض"
                                                    value={agent.message}
                                                    onChange={(e) => updateAgent(agentIndex, "message", e.target.value)}
                                                    multiline
                                                    rows={2}
                                                />
                                            </Grid>
                                            <Grid item size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    label="پیام آفلاین"
                                                    value={agent.offlineMessage}
                                                    onChange={(e) => updateAgent(agentIndex, "offlineMessage", e.target.value)}
                                                    multiline
                                                    rows={2}
                                                />
                                            </Grid>

                                            {/* Working Hours */}
                                            <Grid item size={{ xs: 12 }}>
                                                <Divider sx={{ my: 2 }} />
                                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                    <Schedule />
                                                    <Typography variant="subtitle1">ساعات کاری</Typography>
                                                </Box>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={agent.workingHours?.enabled || false}
                                                            onChange={(e) =>
                                                                updateAgent(agentIndex, "workingHours.enabled", e.target.checked)
                                                            }
                                                        />
                                                    }
                                                    label="فعال‌سازی ساعات کاری"
                                                />

                                                {agent.workingHours?.enabled && (
                                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                                        <Grid item size={{ xs: 12, md: 6 }}>
                                                            <FormControl fullWidth>
                                                                <InputLabel>منطقه زمانی</InputLabel>
                                                                <Select
                                                                    value={agent.workingHours?.timezone || "Asia/Tehran"}
                                                                    onChange={(e) =>
                                                                        updateAgent(agentIndex, "workingHours.timezone", e.target.value)
                                                                    }
                                                                    label="منطقه زمانی"
                                                                >
                                                                    <MenuItem value="Asia/Tehran">تهران</MenuItem>
                                                                    <MenuItem value="Asia/Dubai">دبی</MenuItem>
                                                                    <MenuItem value="Europe/London">لندن</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>
                                                        <Grid item size={{ xs: 12 }}>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                برنامه هفتگی:
                                                            </Typography>
                                                            <Stack spacing={1}>
                                                                {DAYS.map((day) => {
                                                                    const scheduleItem =
                                                                        agent.workingHours?.schedule?.find((s) => s.day === day.value) ||
                                                                        {
                                                                            day: day.value,
                                                                            isOpen: true,
                                                                            openTime: "09:00",
                                                                            closeTime: "18:00",
                                                                        };
                                                                    return (
                                                                        <Box key={day.value} display="flex" alignItems="center" gap={2}>
                                                                            <FormControlLabel
                                                                                control={
                                                                                    <Switch
                                                                                        checked={scheduleItem.isOpen}
                                                                                        onChange={(e) =>
                                                                                            updateAgentSchedule(
                                                                                                agentIndex,
                                                                                                day.value,
                                                                                                "isOpen",
                                                                                                e.target.checked
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                }
                                                                                label={day.label}
                                                                                sx={{ minWidth: 100 }}
                                                                            />
                                                                            {scheduleItem.isOpen && (
                                                                                <>
                                                                                    <TextField
                                                                                        type="time"
                                                                                        label="ساعت شروع"
                                                                                        value={scheduleItem.openTime}
                                                                                        onChange={(e) =>
                                                                                            updateAgentSchedule(
                                                                                                agentIndex,
                                                                                                day.value,
                                                                                                "openTime",
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        size="small"
                                                                                        sx={{ width: 150 }}
                                                                                        InputLabelProps={{ shrink: true }}
                                                                                    />
                                                                                    <TextField
                                                                                        type="time"
                                                                                        label="ساعت پایان"
                                                                                        value={scheduleItem.closeTime}
                                                                                        onChange={(e) =>
                                                                                            updateAgentSchedule(
                                                                                                agentIndex,
                                                                                                day.value,
                                                                                                "closeTime",
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        size="small"
                                                                                        sx={{ width: 150 }}
                                                                                        InputLabelProps={{ shrink: true }}
                                                                                    />
                                                                                </>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </Grid>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            {/* Config */}
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                        <SettingsIconSmall />
                        <Typography variant="h6">تنظیمات نمایش</Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>موقعیت دکمه</InputLabel>
                                <Select
                                    value={formData.config.position}
                                    onChange={(e) => handleConfigChange("position", e.target.value)}
                                    label="موقعیت دکمه"
                                >
                                    <MenuItem value="bottom-right">پایین راست</MenuItem>
                                    <MenuItem value="bottom-left">پایین چپ</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>اندازه دکمه</InputLabel>
                                <Select
                                    value={formData.config.size}
                                    onChange={(e) => handleConfigChange("size", e.target.value)}
                                    label="اندازه دکمه"
                                >
                                    <MenuItem value="small">کوچک</MenuItem>
                                    <MenuItem value="medium">متوسط</MenuItem>
                                    <MenuItem value="large">بزرگ</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.config.showPulse}
                                        onChange={(e) => handleConfigChange("showPulse", e.target.checked)}
                                    />
                                }
                                label="نمایش انیمیشن پالس"
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.config.collectUserInfo}
                                        onChange={(e) => handleConfigChange("collectUserInfo", e.target.checked)}
                                    />
                                }
                                label="دریافت اطلاعات کاربر قبل از چت"
                            />
                        </Grid>
                            <Grid item size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="زمان بسته شدن خودکار (ثانیه)"
                                value={formData.config.autoCloseTimer}
                                onChange={(e) => handleConfigChange("autoCloseTimer", parseInt(e.target.value) || 0)}
                                helperText="0 = غیرفعال"
                                InputProps={{ inputProps: { min: 0 } }}
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Badge اعلان (عدد)"
                                value={formData.config.notificationBadge || ""}
                                onChange={(e) =>
                                    handleConfigChange("notificationBadge", e.target.value ? parseInt(e.target.value) : null)
                                }
                                helperText="خالی = مخفی"
                                InputProps={{ inputProps: { min: 0 } }}
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>حالت آفلاین</InputLabel>
                                <Select
                                    value={formData.config.offlineMode}
                                    onChange={(e) => handleConfigChange("offlineMode", e.target.value)}
                                    label="حالت آفلاین"
                                >
                                    <MenuItem value="message">نمایش پیام</MenuItem>
                                    <MenuItem value="hide">مخفی کردن</MenuItem>
                                    <MenuItem value="button">فقط دکمه</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>زبان</InputLabel>
                                <Select
                                    value={formData.config.language}
                                    onChange={(e) => handleConfigChange("language", e.target.value)}
                                    label="زبان"
                                >
                                    <MenuItem value="fa">فارسی</MenuItem>
                                    <MenuItem value="en">انگلیسی</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="صفحات نمایش (جدا شده با کاما)"
                                value={formData.config.showOnPages?.join(", ") || ""}
                                onChange={(e) =>
                                    handleConfigChange(
                                        "showOnPages",
                                        e.target.value
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter((s) => s)
                                    )
                                }
                                helperText="خالی = همه صفحات. مثال: /, /contact-us"
                            />
                        </Grid>
                            <Grid item size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="صفحات مخفی (جدا شده با کاما)"
                                value={formData.config.hideOnPages?.join(", ") || ""}
                                onChange={(e) =>
                                    handleConfigChange(
                                        "hideOnPages",
                                        e.target.value
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter((s) => s)
                                    )
                                }
                                helperText="مثال: /admin, /dashboard"
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}

