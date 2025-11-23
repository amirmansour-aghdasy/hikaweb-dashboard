"use client";
import { useState } from "react";
import { Menu, MenuItem, Box, Typography, Divider, Button, IconButton, Chip, Avatar, useTheme } from "@mui/material";
import { useApi } from "../../hooks/useApi";
import { formatRelativeDate } from "../../lib/utils";
import { CheckCircle, Delete } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import NotificationDetailModal from "../notifications/NotificationDetailModal";
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

export default function NotificationsMenu({ anchorEl, open, onClose }) {
    const theme = useTheme();
    const router = useRouter();
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Fetch notifications
    const { data: notificationsData, refetch } = useFetchData(
        "notifications",
        "/notifications?limit=10&isRead=false",
        {
            enabled: open, // Only fetch when menu is open
            staleTime: 5000,
        }
    );

    const markAsRead = useUpdateData("/notifications", {
        successMessage: false, // Don't show toast
        onSuccess: () => refetch(),
    });

    const deleteNotification = useDeleteData("/notifications", {
        successMessage: false,
        onSuccess: () => refetch(),
    });

    const handleMarkAsRead = async (notificationId, e) => {
        e.stopPropagation();
        try {
            await markAsRead.mutateAsync({
                id: notificationId,
                data: { isRead: true },
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleDelete = async (notificationId, e) => {
        e.stopPropagation();
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
        try {
            await markAsRead.mutateAsync({
                id: notificationId,
                data: { isRead: true },
            });
            refetch();
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleDetailModalDelete = async (notificationId) => {
        try {
            await deleteNotification.mutateAsync(notificationId);
            refetch();
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleDetailModalNavigate = (url) => {
        router.push(url);
        onClose();
        handleDetailModalClose();
    };

    const notifications = notificationsData?.data || [];

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            PaperProps={{
                elevation: 3,
                sx: {
                    mt: 1.5,
                    minWidth: 350,
                    maxHeight: 500,
                    overflow: "auto",
                },
            }}
        >
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    اعلان‌ها
                </Typography>
                {notifications.length > 0 && (
                    <Chip label={`${notifications.length} خوانده نشده`} size="small" color="error" />
                )}
            </Box>

            {notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                        اعلان جدیدی وجود ندارد
                    </Typography>
                </Box>
            ) : (
                <Box>
                    {notifications.map((notification) => (
                        <MenuItem
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            sx={{
                                py: 1.5,
                                px: 2,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                bgcolor: notification.isRead ? "transparent" : "action.hover",
                                "&:hover": {
                                    bgcolor: "action.selected",
                                },
                            }}
                        >
                            <Box sx={{ display: "flex", width: "100%", gap: 1.5 }}>
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: notification.isRead ? "grey.300" : "primary.main",
                                        fontSize: "1rem",
                                    }}
                                >
                                    {NOTIFICATION_ICONS[notification.type] || "📢"}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: notification.isRead ? 400 : 600,
                                            mb: 0.5,
                                        }}
                                    >
                                        {notification.title?.fa || notification.message?.fa || "اعلان جدید"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {formatRelativeDate(notification.createdAt)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                    {!notification.isRead && (
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMarkAsRead(notification._id, e)}
                                            sx={{ p: 0.5 }}
                                        >
                                            <CheckCircle fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleDelete(notification._id, e)}
                                        sx={{ p: 0.5 }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </MenuItem>
                    ))}
                </Box>
            )}
            <Divider />
            <MenuItem sx={{ justifyContent: "center", py: 1.5 }}>
                <Button size="small" variant="outlined" onClick={() => router.push("/dashboard/notifications")}>
                    مشاهده همه اعلان‌ها
                </Button>
            </MenuItem>
            <NotificationDetailModal
                notification={selectedNotification}
                open={isDetailModalOpen}
                onClose={handleDetailModalClose}
                onMarkAsRead={handleDetailModalMarkAsRead}
                onDelete={handleDetailModalDelete}
                onNavigate={handleDetailModalNavigate}
            />
        </Menu>
    );
}

