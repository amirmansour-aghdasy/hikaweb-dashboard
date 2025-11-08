"use client";
import { Box, Grid, Card, CardContent, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Button, useTheme } from "@mui/material";
import { People, Article, Work, Comment, SupportAgent, TrendingUp, Notifications } from "@mui/icons-material";
import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import StatsCard from "../../components/ui/StatsCard";
import { useStatsStore } from "../../store/useStatsStore";
import { useApi } from "../../hooks/useApi";
import { formatNumber, formatRelativeDate } from "../../lib/utils";

export default function DashboardPage() {
    const theme = useTheme();
    const { stats, loading, setStats, setLoading } = useStatsStore();
    const { useFetchData } = useApi();

    // Fetch dashboard stats - Note: Backend doesn't have /dashboard/stats endpoint yet
    // We'll fetch from individual endpoints and aggregate
    const { data: usersData } = useFetchData("users-count", "/users?limit=1&page=1");
    const { data: articlesData } = useFetchData("articles-count", "/articles?limit=1&page=1");
    const { data: servicesData } = useFetchData("services-count", "/services?limit=1&page=1");
    const { data: portfolioData } = useFetchData("portfolio-count", "/portfolio?limit=1&page=1");
    const { data: commentsData } = useFetchData("comments-count", "/comments?limit=1&page=1");
    const { data: ticketsData } = useFetchData("tickets-count", "/tickets?limit=1&page=1");
    const { data: consultationsData } = useFetchData("consultations-count", "/consultations?limit=1&page=1");

    useEffect(() => {
        // Aggregate stats from different endpoints
        const aggregatedStats = {
            overview: {
                totalUsers: usersData?.pagination?.total || 0,
                totalArticles: articlesData?.pagination?.total || 0,
                totalServices: servicesData?.pagination?.total || 0,
                totalPortfolio: portfolioData?.pagination?.total || 0,
                totalComments: commentsData?.pagination?.total || 0,
                totalTickets: ticketsData?.pagination?.total || 0,
                pendingTickets: ticketsData?.data?.filter(t => t.ticketStatus === "open" || t.ticketStatus === "in_progress").length || 0,
                newConsultations: consultationsData?.pagination?.total || 0,
            },
        };
        setStats(aggregatedStats);
    }, [usersData, articlesData, servicesData, portfolioData, commentsData, ticketsData, consultationsData, setStats]);

    // Fetch recent activities from notifications
    const { data: activitiesData } = useFetchData("recent-activities", "/notifications?limit=5");
    
    // Fetch recent articles
    const { data: recentArticlesData } = useFetchData("recent-articles", "/articles?limit=5&sort=-createdAt");
    
    // Fetch recent comments
    const { data: recentCommentsData } = useFetchData("recent-comments", "/comments?limit=5&sort=-createdAt");
    
    // Fetch recent tickets
    const { data: recentTicketsData } = useFetchData("recent-tickets", "/tickets?limit=5&sort=-createdAt");

    // Transform notifications to activities format
    const recentActivities = activitiesData?.data?.map((notification) => {
        const iconMap = {
            comment_new: <Comment />,
            comment_approved: <Comment />,
            ticket_new: <SupportAgent />,
            ticket_assigned: <SupportAgent />,
            consultation_new: <SupportAgent />,
            user_registered: <People />,
            article_published: <Article />,
        };

        return {
            id: notification._id,
            type: notification.type,
            message: notification.message?.fa || notification.title?.fa || "اعلان جدید",
            time: formatRelativeDate(notification.createdAt),
            avatar: iconMap[notification.type] || <Notifications />,
        };
    }) || [];

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
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="تعداد کاربران" 
                            value={formatNumber(stats.overview.totalUsers)} 
                            change={stats.overview.totalUsers > 0 ? `${Math.round((stats.recent?.articles || 0) * 10)}% نسبت به ماه گذشته` : "0%"} 
                            changeType={stats.overview.totalUsers > 0 ? "increase" : "neutral"} 
                            icon={<People />} 
                            color="primary" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="تعداد مقالات" 
                            value={formatNumber(stats.overview.totalArticles)} 
                            change={stats.overview.totalArticles > 0 ? `${Math.round((stats.recent?.articles || 0) * 5)}% نسبت به ماه گذشته` : "0%"} 
                            changeType={stats.overview.totalArticles > 0 ? "increase" : "neutral"} 
                            icon={<Article />} 
                            color="success" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="تعداد خدمات" 
                            value={formatNumber(stats.overview.totalServices)} 
                            change={stats.overview.totalServices > 0 ? `${Math.round((stats.overview.activeServices / stats.overview.totalServices) * 100)}% فعال` : "0%"} 
                            changeType={stats.overview.totalServices > 0 ? "increase" : "neutral"} 
                            icon={<Work />} 
                            color="info" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard
                            title="تیکت‌های باز"
                            value={formatNumber(stats.overview.pendingTickets)}
                            change={stats.overview.totalTickets > 0 ? `${Math.round((stats.overview.pendingTickets / stats.overview.totalTickets) * 100)}% در انتظار` : "0%"}
                            changeType={stats.overview.pendingTickets > 0 ? "decrease" : "neutral"}
                            icon={<SupportAgent />}
                            color="warning"
                        />
                    </Grid>
                </Grid>

                {/* Charts and Activities */}
                <Grid container spacing={3}>
                    {/* Recent Activities */}
                    <Grid size={{xs: 12, md: 6}}>
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
                    <Grid size={{xs: 12, md: 6}}>
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
                                    <Typography variant="body2">تیکت‌های حل شده</Typography>
                                    <Chip 
                                        label={`${ticketsData?.data?.filter(t => t.ticketStatus === "resolved" || t.ticketStatus === "closed").length || 0} تیکت`} 
                                        color="success" 
                                        size="small" 
                                    />
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
