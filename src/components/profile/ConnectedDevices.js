"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Divider,
} from "@mui/material";
import { Delete, Devices, Logout } from "@mui/icons-material";
import { useApi } from "@/hooks/useApi";
import { formatDate, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ConnectedDevices() {
    const { useFetchData, useDeleteData } = useApi();
    const [deleteDialog, setDeleteDialog] = useState({ open: false, sessionId: null });
    const [revokeAllDialog, setRevokeAllDialog] = useState(false);

    // Fetch sessions
    const { data: sessionsData, isLoading, refetch } = useFetchData(
        ["user-sessions"],
        "/auth/sessions"
    );

    // Delete single session
    const deleteSession = useDeleteData("/auth/sessions", {
        successMessage: "جلسه با موفقیت قطع شد",
        onSuccess: (response) => {
            refetch();
            setDeleteDialog({ open: false, sessionId: null });
            // If current session was revoked, logout
            if (response?.data?.isCurrentSession) {
                setTimeout(() => {
                    window.location.href = "/auth/login";
                }, 1000);
            }
        },
    });

    // Delete all sessions
    const deleteAllSessions = useDeleteData("/auth/sessions", {
        method: "DELETE",
        successMessage: "تمام جلسات با موفقیت قطع شد",
        onSuccess: () => {
            refetch();
            setRevokeAllDialog(false);
        },
    });

    const handleDeleteClick = (sessionId) => {
        setDeleteDialog({ open: true, sessionId });
    };

    const handleDeleteConfirm = async () => {
        if (deleteDialog.sessionId) {
            await deleteSession.mutateAsync(deleteDialog.sessionId);
        }
    };

    const handleRevokeAllClick = () => {
        setRevokeAllDialog(true);
    };

    const handleRevokeAllConfirm = async () => {
        try {
            const token = document.cookie.match(/token=([^;]+)/)?.[1];
            if (!token) {
                throw new Error("لطفاً ابتدا وارد شوید");
            }

            const response = await fetch("/api/v1/auth/sessions", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (result.success) {
                toast.success("تمام جلسات با موفقیت قطع شد");
                refetch();
                setRevokeAllDialog(false);
                // If current session was revoked, logout
                if (result.data?.isCurrentSessionRevoked) {
                    setTimeout(() => {
                        window.location.href = "/auth/login";
                    }, 1000);
                }
            } else {
                throw new Error(result.message || "خطا در قطع جلسات");
            }
        } catch (error) {
            toast.error(error.message || "خطا در قطع جلسات");
        }
    };

    const getDeviceInfo = (session) => {
        // Try to extract device info from user agent if available
        // For now, we'll just show session creation date
        return "دستگاه ناشناس";
    };

    const isExpiringSoon = (expiresAt) => {
        const daysUntilExpiry = (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry < 1;
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    const sessions = sessionsData?.data?.sessions || [];

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h6">دستگاه‌های متصل</Typography>
                    <Typography variant="body2" color="text.secondary">
                        مدیریت جلسات فعال خود
                    </Typography>
                </Box>
                {sessions.length > 1 && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Logout />}
                        onClick={handleRevokeAllClick}
                    >
                        قطع تمام جلسات
                    </Button>
                )}
            </Box>

            {sessions.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <Devices sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                هیچ جلسه فعالی وجود ندارد
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        شما {sessions.length} جلسه فعال دارید. می‌توانید هر جلسه را به صورت جداگانه قطع کنید.
                    </Alert>

                    <List>
                        {sessions.map((session, index) => (
                            <Card key={session.id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box flex={1}>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <Devices sx={{ color: "text.secondary" }} />
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {getDeviceInfo(session)}
                                                </Typography>
                                                {session.isCurrent && (
                                                    <Chip label="جلسه فعلی" color="primary" size="small" />
                                                )}
                                                {isExpiringSoon(session.expiresAt) && (
                                                    <Chip
                                                        label="در حال انقضا"
                                                        color="warning"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                ایجاد شده: {formatDateTime(session.createdAt)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                انقضا: {formatDateTime(session.expiresAt)}
                                            </Typography>
                                        </Box>
                                        {!session.isCurrent && (
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteClick(session.id)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </List>
                </>
            )}

            {/* Delete Session Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, sessionId: null })}>
                <DialogTitle>قطع جلسه</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        آیا از قطع این جلسه اطمینان دارید؟ پس از قطع، باید دوباره وارد شوید.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, sessionId: null })}>
                        انصراف
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleteSession.isPending}
                    >
                        {deleteSession.isPending ? <CircularProgress size={20} /> : "قطع جلسه"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Revoke All Sessions Dialog */}
            <Dialog open={revokeAllDialog} onClose={() => setRevokeAllDialog(false)}>
                <DialogTitle>قطع تمام جلسات</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        آیا از قطع تمام جلسات اطمینان دارید؟ پس از قطع، باید از تمام دستگاه‌ها دوباره وارد شوید.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRevokeAllDialog(false)}>انصراف</Button>
                    <Button onClick={handleRevokeAllConfirm} color="error" variant="contained">
                        قطع تمام جلسات
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

