"use client";
import { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Tab,
    Tabs,
    Grid,
    Divider,
} from "@mui/material";
import {
    Person,
    Security,
    Fingerprint,
    Devices,
    History,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import BiometricSettings from "@/components/settings/BiometricSettings";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SecuritySettings from "@/components/profile/SecuritySettings";
import ConnectedDevices from "@/components/profile/ConnectedDevices";
import ActivityHistory from "@/components/profile/ActivityHistory";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const tabs = [
        { label: "اطلاعات پروفایل", icon: <Person /> },
        { label: "امنیت", icon: <Security /> },
        { label: "دستگاه‌های متصل", icon: <Devices /> },
        { label: "تاریخچه فعالیت‌ها", icon: <History /> },
        { label: "احراز هویت بایومتریک", icon: <Fingerprint /> },
    ];

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        پروفایل کاربری
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        مدیریت اطلاعات شخصی و تنظیمات امنیتی
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Tabs Sidebar */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card>
                            <CardContent sx={{ p: 0 }}>
                                <Tabs
                                    orientation="vertical"
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    variant="scrollable"
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
                                {/* Profile Tab */}
                                {activeTab === 0 && (
                                    <Box>
                                        <ProfileAvatar />
                                        <Divider sx={{ my: 4 }} />
                                        <ProfileInfo />
                                    </Box>
                                )}

                                {/* Security Tab */}
                                {activeTab === 1 && <SecuritySettings />}

                                {/* Connected Devices Tab */}
                                {activeTab === 2 && <ConnectedDevices />}

                                {/* Activity History Tab */}
                                {activeTab === 3 && <ActivityHistory />}

                                {/* Biometric Settings Tab */}
                                {activeTab === 4 && <BiometricSettings />}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Layout>
    );
}

