"use client";
import { Box, Grid, Card, CardContent, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Button, useTheme } from "@mui/material";
import { People, Article, Work, Comment, SupportAgent, TrendingUp, Notifications } from "@mui/icons-material";
import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import StatsCard from "../../components/ui/StatsCard";
import { useStatsStore } from "../../store/useStatsStore";
import { useApi } from "../../hooks/useApi";
import { formatNumber } from "../../lib/utils";

export default function DashboardPage() {
    const theme = useTheme();
    const { stats, loading, setStats, setLoading } = useStatsStore();
    const { useFetchData } = useApi();

    // Fetch dashboard stats
    const { data: statsData, isLoading: statsLoading } = useFetchData("dashboard-stats", "/api/v1/dashboard/stats", {
        refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    });

    useEffect(() => {
        if (statsData) {
            setStats(statsData.data);
        }
    }, [statsData, setStats]);

    const recentActivities = [
        {
            id: 1,
            type: "comment",
            message: 'نظر جدیدی برای مقاله "بازاریابی دیجیتال" ثبت شد',
            time: "۵ دقیقه پیش",
            avatar: <Comment />,
        },
        {
            id: 2,
            type: "ticket",
            message: "تیکت جدید از طرف احمد رضایی دریافت شد",
            time: "۱۰ دقیقه پیش",
            avatar: <SupportAgent />,
        },
        {
            id: 3,
            type: "user",
            message: "کاربر جدیدی عضو شد",
            time: "۱۵ دقیقه پیش",
            avatar: <People />,
        },
        {
            id: 4,
            type: "article",
            message: 'مقاله "SEO مقدماتی" منتشر شد',
            time: "۳۰ دقیقه پیش",
            avatar: <Article />,
        },
    ];

    return (
        <Layout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        داشبورد مدیریت
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        خوش آمدید! اینجا می‌توانید آخرین آمار و فعالیت‌های سایت را مشاهده کنید.
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard title="تعداد کاربران" value={formatNumber(stats.overview.totalUsers)} change="+12% نسبت به ماه گذشته" changeType="increase" icon={<People />} color="primary" />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard title="تعداد مقالات" value={formatNumber(stats.overview.totalArticles)} change="+8% نسبت به ماه گذشته" changeType="increase" icon={<Article />} color="success" />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard title="تعداد خدمات" value={formatNumber(stats.overview.totalServices)} change="+5% نسبت به ماه گذشته" changeType="increase" icon={<Work />} color="info" />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard
                            title="تیکت‌های باز"
                            value={formatNumber(stats.overview.pendingTickets)}
                            change="-3% نسبت به ماه گذشته"
                            changeType="decrease"
                            icon={<SupportAgent />}
                            color="warning"
                        />
                    </Grid>
                </Grid>

                {/* Charts and Activities */}
                <Grid container spacing={3}>
                    {/* Recent Activities */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: "100%" }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    فعالیت‌های اخیر
                                </Typography>
                                <Button size="small" variant="outlined">
                                    مشاهده همه
                                </Button>
                            </Box>

                            <List>
                                {recentActivities.map((activity) => (
                                    <ListItem key={activity.id} sx={{ px: 0 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: "primary.light" }}>{activity.avatar}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={activity.message}
                                            secondary={activity.time}
                                            primaryTypographyProps={{ fontSize: "0.9rem" }}
                                            secondaryTypographyProps={{ fontSize: "0.8rem" }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Quick Stats */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: "100%" }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                آمار سریع
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">نظرات جدید</Typography>
                                    <Chip label={`${stats.overview.totalComments} نظر`} color="info" size="small" />
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">درخواست‌های مشاوره</Typography>
                                    <Chip label={`${stats.overview.newConsultations} درخواست`} color="warning" size="small" />
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">نمونه کارها</Typography>
                                    <Chip label={`${stats.overview.totalPortfolio} پروژه`} color="success" size="small" />
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">تیکت‌های حل شده امروز</Typography>
                                    <Chip label="۱۵ تیکت" color="success" size="small" />
                                </Box>
                            </Box>

                            <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Button fullWidth variant="contained" startIcon={<TrendingUp />} href="/dashboard/analytics">
                                    مشاهده گزارش کامل
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Layout>
    );
}
