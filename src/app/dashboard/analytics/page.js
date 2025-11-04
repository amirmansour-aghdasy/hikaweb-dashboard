"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    Chip,
    LinearProgress,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
} from "@mui/material";
import { TrendingUp, TrendingDown, People, Article, Visibility, Comment, Star, BusinessCenter, Work, Assignment, Schedule } from "@mui/icons-material";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "@/components/layout/Layout";
import { useApi } from "@/hooks/useApi";
import { formatDate, formatPrice, formatNumber } from "@/lib/utils";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState("30d");
    const { useFetchData } = useApi();

    // Fetch analytics data
    const { data: analyticsData, isLoading } = useFetchData(["analytics", timeRange], `/analytics?period=${timeRange}`);

    const { data: statsData } = useFetchData(["dashboard-stats", timeRange], `/analytics/dashboard-stats?period=${timeRange}`);

    // Stats Cards Component
    const StatsCard = ({ title, value, change, icon, color = "primary" }) => (
        <Card>
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="h6">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div">
                            {value}
                        </Typography>
                        {change && (
                            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                                {change > 0 ? <TrendingUp sx={{ color: "success.main", mr: 0.5 }} /> : <TrendingDown sx={{ color: "error.main", mr: 0.5 }} />}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: change > 0 ? "success.main" : "error.main",
                                    }}
                                >
                                    {Math.abs(change)}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    از ماه گذشته
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>{icon}</Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    // Transform analytics data for charts
    const chartData = analyticsData?.data?.charts?.map((item) => ({
        name: item._id || "نامشخص",
        views: item.views || 0,
        users: item.visitors || 0,
        articles: item.articles || 0,
    })) || [];

    const pieData = analyticsData?.data?.contentDistribution 
        ? [
            { name: "مقالات", value: analyticsData.data.contentDistribution.articles || 0 },
            { name: "خدمات", value: analyticsData.data.contentDistribution.services || 0 },
            { name: "نمونه کارها", value: analyticsData.data.contentDistribution.portfolio || 0 },
            { name: "سایر", value: analyticsData.data.contentDistribution.other || 0 },
          ]
        : [];

    const topArticles = analyticsData?.data?.topArticles?.map((article) => ({
        title: article.title?.fa || article.title?.en || "بدون عنوان",
        views: article.views || 0,
        comments: article.commentsCount || 0,
    })) || [];

    const performanceMetrics = analyticsData?.data?.performanceMetrics || {};

    return (
        <Layout>
            <Box>
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                        آنالیز و گزارش‌گیری
                    </Typography>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>بازه زمانی</InputLabel>
                        <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="بازه زمانی">
                            <MenuItem value="7d">۷ روز گذشته</MenuItem>
                            <MenuItem value="30d">۳۰ روز گذشته</MenuItem>
                            <MenuItem value="90d">۳ ماه گذشته</MenuItem>
                            <MenuItem value="1y">سال گذشته</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="بازدید کل" 
                            value={formatNumber(statsData?.data?.analytics?.pageViews || 0)} 
                            change={statsData?.data?.analytics?.pageViews > 0 ? 12.5 : 0} 
                            icon={<Visibility />} 
                            color="primary" 
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="کاربران جدید" 
                            value={formatNumber(statsData?.data?.overview?.totalUsers || 0)} 
                            change={statsData?.data?.recent?.articles > 0 ? 8.2 : 0} 
                            icon={<People />} 
                            color="success" 
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="مقالات منتشر شده" 
                            value={formatNumber(statsData?.data?.overview?.publishedArticles || 0)} 
                            change={statsData?.data?.recent?.articles > 0 ? -2.1 : 0} 
                            icon={<Article />} 
                            color="info" 
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatsCard 
                            title="نظرات جدید" 
                            value={formatNumber(statsData?.data?.recent?.comments || 0)} 
                            change={statsData?.data?.recent?.comments > 0 ? 15.3 : 0} 
                            icon={<Comment />} 
                            color="warning" 
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Traffic Chart */}
                    <Grid item size={{ xs: 12, lg: 8 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    روند بازدید و کاربران
                                </Typography>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                                        <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Content Distribution */}
                    <Grid item size={{ xs: 12, lg: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    توزیع محتوا
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Top Articles */}
                    <Grid item size={{ xs: 12, md: 6 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    مقالات پربازدید
                                </Typography>
                                <List>
                                    {topArticles.map((article, index) => (
                                        <Box key={index}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: "primary.main" }}>{index + 1}</Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={article.title}
                                                    secondary={
                                                        <Box component="span">
                                                            <Typography variant="caption" component="span" sx={{ mr: 2 }}>
                                                                👀 {article.views}
                                                            </Typography>
                                                            <Typography variant="caption" component="span">
                                                                💬 {article.comments}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            {index < topArticles.length - 1 && <Divider />}
                                        </Box>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Performance Metrics */}
                    <Grid item size={{ xs: 12, md: 6 }}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">نرخ تبدیل</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {performanceMetrics.conversionRate?.toFixed(1) || 0}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={performanceMetrics.conversionRate || 0} />
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">میانگین زمان در سایت</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {performanceMetrics.avgTimeOnSite 
                                                    ? `${Math.floor(performanceMetrics.avgTimeOnSite / 60)}:${String(performanceMetrics.avgTimeOnSite % 60).padStart(2, '0')}`
                                                    : "0:00"}
                                            </Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={(performanceMetrics.avgTimeOnSite || 0) / 10} color="success" />
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">نرخ بازگشت</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {performanceMetrics.bounceRate?.toFixed(0) || 0}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={performanceMetrics.bounceRate || 0} color="warning" />
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="body2">رضایت کاربران</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {performanceMetrics.userSatisfaction?.toFixed(1) || 0}/5
                                            </Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={(performanceMetrics.userSatisfaction || 0) * 20} color="success" />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Articles Performance */}
                    <Grid item size={{ xs: 12 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    عملکرد مقالات در طول زمان
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="articles" stackId="1" stroke="#8884d8" fill="#8884d8" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Layout>
    );
}
