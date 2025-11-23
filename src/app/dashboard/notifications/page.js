"use client";
import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress,
    TextField,
    MenuItem,
    Grid,
    Pagination,
    Alert,
    IconButton,
    Button,
    Tabs,
    Tab,
    Avatar,
    Divider,
} from "@mui/material";
import {
    History,
    Search,
    CheckCircle,
    Delete,
    Notifications as NotificationsIcon,
    NotificationsActive,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import NotificationDetailModal from "@/components/notifications/NotificationDetailModal";
import { useApi } from "@/hooks/useApi";
import { formatDate, formatDateTime, formatRelativeDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

const NOTIFICATION_ICONS = {
    comment_new: "💬",
    comment_approved: "✅",
    comment_rejected: "❌",
    ticket_new: "🎫",
    ticket_assigned: "📋",
    ticket_updated: "🔄",
    ticket_resolved: "✅",
    consultation_new: "🤝",
    consultation_assigned: "📋",
    user_registered: "👤",
    article_published: "📝",
    service_created: "⚙️",
    portfolio_created: "🎨",
    task_assigned: "📝",
    task_updated: "🔄",
    calendar_event: "📅",
    system_alert: "⚠️",
    other: "📢",
};

const ACTION_COLORS = {
    low: "default",
    normal: "info",
    high: "warning",
    urgent: "error",
};

export default function NotificationsPage() {
    const router = useRouter();
    const { useFetchData, useDeleteData } = useApi();
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [tabValue, setTabValue] = useState(0); // 0: unread, 1: all
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
        }
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        }
        if (tabValue === 0) {
            params.append("isRead", "false");
        }
        return params.toString();
    }, [debouncedSearchTerm, typeFilter, page, limit, tabValue]);

    const { data: notificationsData, isLoading, refetch } = useFetchData(
        ["notifications-list", queryParams],
        `/notifications?${queryParams}`
    );

    const handleMarkAsRead = async (notificationId) => {
        try {
            const response = await api.patch(`/notifications/${notificationId}/read`);

            if (response.data.success) {
                toast.success("اعلان به عنوان خوانده شده علامت‌گذاری شد");
                refetch();
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await api.patch("/notifications/read-all", {});

            if (response.data.success) {
                toast.success("تمام اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند");
                refetch();
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = useDeleteData("/notifications", {
        successMessage: false,
        updateCache: false, // Disable cache update for notifications
        onSuccess: () => {
            refetch();
            toast.success("اعلان حذف شد");
        },
    });

    const notifications = notificationsData?.data || [];
    const pagination = notificationsData?.pagination || {};

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification.mutateAsync(notificationId);
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleNotificationClick = (notification) => {
        setSelectedNotification(notification);
        setIsDetailModalOpen(true);
    };

    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedNotification(null);
    };

    const handleDetailModalMarkAsRead = async (notificationId) => {
        await handleMarkAsRead(notificationId);
    };

    const handleDetailModalDelete = async (notificationId) => {
        await handleDelete(notificationId);
    };

    const handleDetailModalNavigate = (url) => {
        router.push(url);
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            اعلان‌ها
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            مدیریت و مشاهده تمام اعلان‌های خود
                        </Typography>
                    </Box>
                    {tabValue === 0 && notifications.length > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<CheckCircle />}
                            onClick={handleMarkAllAsRead}
                        >
                            علامت‌گذاری همه به عنوان خوانده شده
                        </Button>
                    )}
                </Box>

                {/* Tabs */}
                <Card sx={{ mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab
                            icon={<NotificationsActive />}
                            iconPosition="start"
                            label="خوانده نشده"
                            sx={{ minHeight: 64 }}
                        />
                        <Tab
                            icon={<NotificationsIcon />}
                            iconPosition="start"
                            label="همه اعلان‌ها"
                            sx={{ minHeight: 64 }}
                        />
                    </Tabs>
                </Card>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            placeholder="جستجو در اعلان‌ها..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            select
                            label="فیلتر بر اساس نوع"
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <MenuItem value="all">همه</MenuItem>
                            {Object.keys(NOTIFICATION_ICONS).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type.replace(/_/g, " ")}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>

                {/* Notifications List */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Card>
                        <CardContent>
                            <Box textAlign="center" py={4}>
                                <NotificationsIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">
                                    {tabValue === 0
                                        ? "هیچ اعلان خوانده نشده‌ای وجود ندارد"
                                        : "هیچ اعلانی یافت نشد"}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <List>
                            {notifications.map((notification) => (
                                <Card key={notification._id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="flex-start"
                                            gap={2}
                                        >
                                            <Box
                                                display="flex"
                                                gap={2}
                                                flex={1}
                                                sx={{ cursor: notification.actionUrl ? "pointer" : "default" }}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        bgcolor: notification.isRead ? "grey.300" : "primary.main",
                                                        fontSize: "1.5rem",
                                                    }}
                                                >
                                                    {NOTIFICATION_ICONS[notification.type] || "📢"}
                                                </Avatar>
                                                <Box flex={1}>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Typography
                                                            variant="subtitle1"
                                                            fontWeight={notification.isRead ? 400 : 600}
                                                        >
                                                            {notification.title?.fa ||
                                                                notification.message?.fa ||
                                                                "اعلان جدید"}
                                                        </Typography>
                                                        {!notification.isRead && (
                                                            <Chip label="جدید" size="small" color="error" />
                                                        )}
                                                        {notification.priority && (
                                                            <Chip
                                                                label={notification.priority}
                                                                size="small"
                                                                color={ACTION_COLORS[notification.priority] || "default"}
                                                            />
                                                        )}
                                                    </Box>
                                                    {notification.message?.fa && (
                                                        <Typography variant="body2" color="text.secondary" mb={1}>
                                                            {notification.message.fa}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDateTime(notification.createdAt)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box display="flex" gap={0.5}>
                                                {!notification.isRead && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification._id);
                                                        }}
                                                        color="success"
                                                    >
                                                        <CheckCircle />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(notification._id);
                                                    }}
                                                    color="error"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </List>

                        {pagination.totalPages > 1 && (
                            <Box display="flex" justifyContent="center" mt={3}>
                                <Pagination
                                    count={pagination.totalPages || 1}
                                    page={page}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Box>
                        )}

                        {pagination.total && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                نمایش {((page - 1) * limit) + 1} تا {Math.min(page * limit, pagination.total)} از{" "}
                                {pagination.total} اعلان
                            </Alert>
                        )}
                    </>
                )}
            </Box>
            <NotificationDetailModal
                notification={selectedNotification}
                open={isDetailModalOpen}
                onClose={handleDetailModalClose}
                onMarkAsRead={handleDetailModalMarkAsRead}
                onDelete={handleDetailModalDelete}
                onNavigate={handleDetailModalNavigate}
            />
        </Layout>
    );
}

