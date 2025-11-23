"use client";
import { Box, Grid, Card, CardContent, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Button, useTheme, CircularProgress } from "@mui/material";
import { 
    People, Article, Work, Comment, SupportAgent, TrendingUp, Notifications, 
    Assignment, CalendarToday, Folder, CheckCircle, Schedule, Warning 
} from "@mui/icons-material";
import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "../../components/layout/Layout";
import StatsCard from "../../components/ui/StatsCard";
import { useStatsStore } from "../../store/useStatsStore";
import { useApi } from "../../hooks/useApi";
import { formatNumber, formatRelativeDate } from "../../lib/utils";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function DashboardPage() {
    const theme = useTheme();
    const { stats, setStats } = useStatsStore();
    const { useFetchData } = useApi();
    const [loading, setLoading] = useState(true);

    // Fetch comprehensive stats from new endpoint
    const { data: comprehensiveStatsData, isLoading } = useFetchData(
        "comprehensive-stats",
        "/analytics/comprehensive-stats",
        {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        }
    );

    useEffect(() => {
        if (comprehensiveStatsData?.success && comprehensiveStatsData.data) {
            setStats(comprehensiveStatsData.data);
            setLoading(false);
        } else if (!isLoading) {
            setLoading(false);
        }
    }, [comprehensiveStatsData, isLoading, setStats]);

    // Fetch recent activities from notifications
    const { data: activitiesData } = useFetchData("recent-activities", "/notifications?limit=5");
    
    // Icon map for notifications (memoized outside component to avoid recreation)
    const iconMap = useMemo(() => ({
        comment_new: <Comment />,
        comment_approved: <Comment />,
        ticket_new: <SupportAgent />,
        ticket_assigned: <SupportAgent />,
        consultation_new: <SupportAgent />,
        user_registered: <People />,
        article_published: <Article />,
        task_assigned: <Assignment />,
        task_updated: <Assignment />,
    }), []);
    
    // Transform notifications to activities format (memoized)
    const recentActivities = useMemo(() => {
        return activitiesData?.data?.map((notification) => ({
            id: notification._id,
            type: notification.type,
            message: notification.message?.fa || notification.title?.fa || "اعلان جدید",
            time: formatRelativeDate(notification.createdAt),
            avatar: iconMap[notification.type] || <Notifications />,
        })) || [];
    }, [activitiesData?.data, iconMap]);

    // Prepare chart data for tasks by status (memoized)
    const taskStatusData = useMemo(() => {
        if (!stats?.tasks?.byStatus) return [];
        return Object.entries(stats.tasks.byStatus).map(([key, value]) => ({
            name: key === 'pending' ? 'در انتظار' : key === 'in_progress' ? 'در حال انجام' : key === 'completed' ? 'تکمیل شده' : key === 'cancelled' ? 'لغو شده' : key,
            value: value
        }));
    }, [stats?.tasks?.byStatus]);

    // Prepare chart data for tickets by status (memoized)
    const ticketStatusData = useMemo(() => {
        if (!stats?.tickets) return [];
        return [
            { name: 'باز', value: stats.tickets.open || 0, color: '#FF8042' },
            { name: 'در حال بررسی', value: stats.tickets.inProgress || 0, color: '#FFBB28' },
            { name: 'حل شده', value: stats.tickets.resolved || 0, color: '#00C49F' },
            { name: 'بسته', value: stats.tickets.closed || 0, color: '#8884D8' },
        ];
    }, [stats?.tickets]);

    // Prepare chart data for calendar events by type (memoized)
    const calendarTypeData = useMemo(() => {
        if (!stats?.calendar?.byType) return [];
        return Object.entries(stats.calendar.byType).map(([key, value]) => ({
            name: key === 'meeting' ? 'جلسه' : key === 'event' ? 'رویداد' : key === 'reminder' ? 'یادآوری' : key,
            value: value
        }));
    }, [stats?.calendar?.byType]);

    // Prepare chart data for media by file type (memoized)
    const mediaTypeData = useMemo(() => {
        if (!stats?.media?.byFileType) return [];
        return Object.entries(stats.media.byFileType).map(([key, value]) => ({
            name: key === 'image' ? 'تصویر' : key === 'video' ? 'ویدیو' : key === 'document' ? 'سند' : key === 'audio' ? 'صدا' : key,
            value: value.count || 0
        }));
    }, [stats?.media?.byFileType]);

    if (loading || isLoading) {
        return (
            <Layout>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

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

                {/* Main Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="تعداد کاربران" 
                            value={formatNumber(stats?.overview?.totalUsers || 0)} 
                            change={stats?.recent?.users ? `${formatNumber(stats.recent.users)} کاربر جدید` : "0 کاربر"} 
                            changeType="increase" 
                            icon={<People />} 
                            color="primary" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="تعداد مقالات" 
                            value={formatNumber(stats?.overview?.totalArticles || 0)} 
                            change={stats?.recent?.articles ? `${formatNumber(stats.recent.articles)} مقاله جدید` : "0 مقاله"} 
                            changeType="increase" 
                            icon={<Article />} 
                            color="success" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="تیکت‌های باز" 
                            value={formatNumber(stats?.overview?.pendingTickets || 0)} 
                            change={stats?.overview?.totalTickets ? `${Math.round((stats.overview.pendingTickets / stats.overview.totalTickets) * 100)}% در انتظار` : "0%"} 
                            changeType={stats?.overview?.pendingTickets > 0 ? "decrease" : "neutral"} 
                            icon={<SupportAgent />} 
                            color="warning" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="وظایف" 
                            value={formatNumber(stats?.overview?.totalTasks || 0)} 
                            change={stats?.tasks?.overdue ? `${formatNumber(stats.tasks.overdue)} وظیفه معوق` : "همه به موقع"} 
                            changeType={stats?.tasks?.overdue > 0 ? "decrease" : "neutral"} 
                            icon={<Assignment />} 
                            color="info" 
                        />
                    </Grid>
                </Grid>

                {/* Secondary Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="رویدادهای تقویم" 
                            value={formatNumber(stats?.overview?.totalCalendarEvents || 0)} 
                            change={stats?.calendar?.upcoming ? `${formatNumber(stats.calendar.upcoming)} رویداد آینده` : "0 رویداد"} 
                            changeType="increase" 
                            icon={<CalendarToday />} 
                            color="primary" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="فایل‌های رسانه" 
                            value={formatNumber(stats?.overview?.totalMediaFiles || 0)} 
                            change={stats?.media?.totalSizeFormatted || "0 B"} 
                            changeType="neutral" 
                            icon={<Folder />} 
                            color="info" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="نظرات" 
                            value={formatNumber(stats?.overview?.totalComments || 0)} 
                            change={stats?.recent?.comments ? `${formatNumber(stats.recent.comments)} نظر جدید` : "0 نظر"} 
                            changeType="increase" 
                            icon={<Comment />} 
                            color="success" 
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="تیکت‌های حل شده" 
                            value={formatNumber(stats?.overview?.resolvedTickets || 0)} 
                            change={stats?.overview?.totalTickets ? `${Math.round((stats.overview.resolvedTickets / stats.overview.totalTickets) * 100)}% حل شده` : "0%"} 
                            changeType="increase" 
                            icon={<CheckCircle />} 
                            color="success" 
                        />
                    </Grid>
                </Grid>

                {/* Charts and Activities */}
                <Grid container spacing={3}>
                    {/* Tasks Status Chart */}
                    {taskStatusData.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 3, height: "100%" }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    وضعیت وظایف
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={taskStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {taskStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    )}

                    {/* Tickets Status Chart */}
                    {ticketStatusData.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 3, height: "100%" }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    وضعیت تیکت‌ها
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={ticketStatusData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    )}

                    {/* Calendar Events Chart */}
                    {calendarTypeData.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 3, height: "100%" }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    رویدادهای تقویم بر اساس نوع
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={calendarTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {calendarTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    )}

                    {/* Media Files Chart */}
                    {mediaTypeData.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 3, height: "100%" }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    فایل‌های رسانه بر اساس نوع
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={mediaTypeData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#00C49F" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    )}

                    {/* Recent Activities */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, height: "100%" }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    فعالیت‌های اخیر
                                </Typography>
                                <Button size="small" variant="outlined" href="/dashboard/notifications">
                                    مشاهده همه
                                </Button>
                            </Box>

                            {recentActivities.length > 0 ? (
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
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                                    فعالیتی وجود ندارد
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Quick Stats Summary */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, height: "100%" }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                خلاصه آمار
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">وظایف معوق</Typography>
                                    <Chip 
                                        label={`${formatNumber(stats?.tasks?.overdue || 0)} وظیفه`} 
                                        color={stats?.tasks?.overdue > 0 ? "error" : "success"} 
                                        size="small" 
                                        icon={stats?.tasks?.overdue > 0 ? <Warning /> : <CheckCircle />}
                                    />
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">رویدادهای آینده</Typography>
                                    <Chip 
                                        label={`${formatNumber(stats?.calendar?.upcoming || 0)} رویداد`} 
                                        color="info" 
                                        size="small" 
                                        icon={<Schedule />}
                                    />
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">حجم کل فایل‌ها</Typography>
                                    <Chip 
                                        label={stats?.media?.totalSizeFormatted || "0 B"} 
                                        color="primary" 
                                        size="small" 
                                    />
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="body2">تیکت‌های در حال بررسی</Typography>
                                    <Chip 
                                        label={`${formatNumber(stats?.tickets?.inProgress || 0)} تیکت`} 
                                        color="warning" 
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
