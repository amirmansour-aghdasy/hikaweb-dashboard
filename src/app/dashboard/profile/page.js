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
} from "@mui/material";
import {
    Person,
    Security,
    Fingerprint,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import BiometricSettings from "@/components/settings/BiometricSettings";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const tabs = [
        { label: "پروفایل", icon: <Person /> },
        { label: "امنیت", icon: <Security /> },
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
                                        minHeight: 400,
                                    }}
                                >
                                    {tabs.map((tab, index) => (
                                        <Tab
                                            key={index}
                                            icon={tab.icon}
                                            iconPosition="start"
                                            label={tab.label}
                                            sx={{
                                                textAlign: "right",
                                                alignItems: "flex-start",
                                                minHeight: 64,
                                            }}
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
                                        <Typography variant="h6" gutterBottom>
                                            اطلاعات پروفایل
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            این بخش به زودی اضافه خواهد شد
                                        </Typography>
                                    </Box>
                                )}

                                {/* Security Tab */}
                                {activeTab === 1 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            تنظیمات امنیتی
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            این بخش به زودی اضافه خواهد شد
                                        </Typography>
                                    </Box>
                                )}

                                {/* Biometric Settings Tab */}
                                {activeTab === 2 && <BiometricSettings />}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Layout>
    );
}

