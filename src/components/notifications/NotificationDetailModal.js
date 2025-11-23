"use client";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Avatar,
    Divider,
    CircularProgress,
    Alert,
} from "@mui/material";
import { Close, OpenInNew, CheckCircle, Delete } from "@mui/icons-material";
import { formatDateTime, formatRelativeDate } from "@/lib/utils";
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

const PRIORITY_COLORS = {
    low: "default",
    normal: "info",
    high: "warning",
    urgent: "error",
};

export default function NotificationDetailModal({ notification, open, onClose, onMarkAsRead, onDelete, onNavigate }) {
    const [loading, setLoading] = useState(false);
    const [entityExists, setEntityExists] = useState(null); // null = checking, true = exists, false = not exists

    useEffect(() => {
        if (open && notification?.actionUrl) {
            checkEntityExists();
        } else {
            setEntityExists(null);
        }
    }, [open, notification?.actionUrl]);

    const checkEntityExists = async () => {
        if (!notification?.actionUrl) {
            setEntityExists(null);
            return;
        }

        setLoading(true);
        setEntityExists(null);

        try {
            // Extract entity type and ID from actionUrl
            // Format: /dashboard/tasks/123, /dashboard/tickets/123, etc.
            const urlParts = notification.actionUrl.split("/");
            const entityType = urlParts[2]; // tasks, tickets, etc.
            const entityId = urlParts[3];

            if (!entityType || !entityId) {
                setEntityExists(false);
                setLoading(false);
                return;
            }

            // Check if entity exists by making a request
            const endpoint = `/${entityType}/${entityId}`;
            const response = await api.get(endpoint);

            if (response.data.success) {
                setEntityExists(true);
            } else {
                setEntityExists(false);
            }
        } catch (error) {
            // If 404 or other error, entity doesn't exist
            setEntityExists(false);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = () => {
        if (notification?.actionUrl && entityExists) {
            if (onNavigate) {
                onNavigate(notification.actionUrl);
            } else {
                window.location.href = notification.actionUrl;
            }
            onClose();
        }
    };

    const handleMarkAsRead = () => {
        if (onMarkAsRead) {
            onMarkAsRead(notification._id);
        }
        onClose();
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(notification._id);
        }
        onClose();
    };

    if (!notification) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            disableEnforceFocus
            disableAutoFocus
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: 1,
                    borderColor: "divider",
                    pb: 2,
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
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
                    <Box>
                        <Typography variant="h6" component="div">
                            {notification.title?.fa || notification.message?.fa || "اعلان"}
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                            {!notification.isRead && (
                                <Chip label="جدید" size="small" color="error" />
                            )}
                            {notification.priority && (
                                <Chip
                                    label={notification.priority}
                                    size="small"
                                    color={PRIORITY_COLORS[notification.priority] || "default"}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
                <Button onClick={onClose} size="small" sx={{ minWidth: "auto", p: 1 }}>
                    <Close />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {notification.message?.fa && (
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {notification.message.fa}
                    </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        نوع اعلان:
                    </Typography>
                    <Chip label={notification.type?.replace(/_/g, " ")} size="small" />

                    <Typography variant="caption" color="text.secondary" display="block" mt={2} mb={1}>
                        تاریخ ایجاد:
                    </Typography>
                    <Typography variant="body2">
                        {formatDateTime(notification.createdAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ({formatRelativeDate(notification.createdAt)})
                    </Typography>

                    {notification.readAt && (
                        <>
                            <Typography variant="caption" color="text.secondary" display="block" mt={2} mb={1}>
                                تاریخ خواندن:
                            </Typography>
                            <Typography variant="body2">
                                {formatDateTime(notification.readAt)}
                            </Typography>
                        </>
                    )}

                    {notification.actionUrl && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            {loading ? (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" color="text.secondary">
                                        در حال بررسی...
                                    </Typography>
                                </Box>
                            ) : entityExists === false ? (
                                <Alert severity="warning">
                                    این مورد مرتبط با این اعلان دیگر وجود ندارد (احتمالاً حذف شده است).
                                </Alert>
                            ) : entityExists === true ? (
                                <Alert severity="success">
                                    این مورد مرتبط هنوز موجود است. می‌توانید با کلیک روی دکمه "مشاهده" به آن دسترسی پیدا کنید.
                                </Alert>
                            ) : null}
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, borderTop: 1, borderColor: "divider", pt: 2 }}>
                <Box display="flex" gap={1} width="100%" justifyContent="space-between">
                    <Box display="flex" gap={1}>
                        {!notification.isRead && (
                            <Button
                                variant="outlined"
                                startIcon={<CheckCircle />}
                                onClick={handleMarkAsRead}
                                color="success"
                            >
                                علامت‌گذاری به عنوان خوانده شده
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            startIcon={<Delete />}
                            onClick={handleDelete}
                            color="error"
                        >
                            حذف
                        </Button>
                    </Box>
                    <Box display="flex" gap={1}>
                        {notification.actionUrl && entityExists === true && (
                            <Button
                                variant="contained"
                                startIcon={<OpenInNew />}
                                onClick={handleNavigate}
                            >
                                مشاهده
                            </Button>
                        )}
                        <Button variant="outlined" onClick={onClose}>
                            بستن
                        </Button>
                    </Box>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

