"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
} from "@mui/material";
import {
    Fingerprint,
    Delete,
    Add,
    CheckCircle,
    Cancel,
} from "@mui/icons-material";
import { startRegistration } from "@simplewebauthn/browser";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useApi } from "@/hooks/useApi";

export default function BiometricSettings() {
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, credentialId: null });
    const [deviceName, setDeviceName] = useState("");
    const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
    const { useFetchData, useDeleteData } = useApi();

    // Fetch credentials
    const { data: credentialsData, isLoading, refetch } = useFetchData(
        ["webauthn-credentials"],
        "/auth/webauthn/credentials"
    );

    // Delete credential
    const deleteCredential = useDeleteData("/auth/webauthn/credentials", {
        successMessage: "Credential با موفقیت حذف شد",
        onSuccess: () => {
            refetch();
            setDeleteDialog({ open: false, credentialId: null });
        },
    });

    useEffect(() => {
        // Check if WebAuthn is supported
        setIsWebAuthnSupported(
            typeof window !== "undefined" &&
            typeof window.PublicKeyCredential !== "undefined"
        );

        if (credentialsData?.data) {
            setCredentials(credentialsData.data);
        }
    }, [credentialsData]);

    const handleRegister = async () => {
        if (!isWebAuthnSupported) {
            toast.error("مرورگر شما از احراز هویت بایومتریک پشتیبانی نمی‌کند");
            return;
        }

        // Check if device actually supports authenticators
        if (typeof window !== "undefined" && window.PublicKeyCredential) {
            try {
                const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (!available) {
                    toast.error("دستگاه شما از احراز هویت بایومتریک پشتیبانی نمی‌کند. لطفاً از دستگاهی با قابلیت اثر انگشت یا Face ID استفاده کنید.");
                    return;
                }
            } catch (error) {
                // If check fails, still try to register (some browsers don't support this check)
                console.warn("Could not check for platform authenticator availability:", error);
            }
        }

        setRegistering(true);

        try {
            // Get registration options
            const optionsResponse = await api.post("/auth/webauthn/register/options", {
                deviceName: deviceName || undefined,
            });

            if (!optionsResponse.data.success) {
                throw new Error(optionsResponse.data.message || "خطا در دریافت گزینه‌های ثبت‌نام");
            }

            const options = optionsResponse.data.data;

            // Validate options structure
            if (!options || typeof options !== 'object') {
                throw new Error("گزینه‌های ثبت‌نام نامعتبر است");
            }

            // Start registration with proper options and timeout
            const registrationResponse = await startRegistration({
                ...options,
                // Ensure challenge is present
                challenge: options.challenge,
                // Ensure rp is present
                rp: options.rp || { id: options.rpID, name: options.rpName },
                // Ensure user is present
                user: options.user || {
                    id: options.userID,
                    name: options.userName,
                    displayName: options.userDisplayName
                },
                // Add timeout to prevent hanging
                timeout: 60000 // 60 seconds
            });

            // Verify registration
            const verifyResponse = await api.post("/auth/webauthn/register", {
                response: registrationResponse,
                deviceName: deviceName || undefined,
            });

            if (verifyResponse.data.success) {
                toast.success("احراز هویت بایومتریک با موفقیت ثبت شد");
                setDeviceName("");
                refetch();
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "خطا در ثبت احراز هویت بایومتریک";
            toast.error(errorMessage);
        } finally {
            setRegistering(false);
        }
    };

    const handleDeleteClick = (credentialId) => {
        setDeleteDialog({ open: true, credentialId });
    };

    const handleDeleteConfirm = async () => {
        if (deleteDialog.credentialId) {
            await deleteCredential.mutateAsync(deleteDialog.credentialId);
        }
    };

    const getDeviceTypeLabel = (type) => {
        const labels = {
            mobile: "موبایل",
            desktop: "دسکتاپ",
            tablet: "تبلت",
            unknown: "نامشخص",
        };
        return labels[type] || "نامشخص";
    };

    const getAuthenticatorTypeLabel = (type) => {
        const labels = {
            fingerprint: "اثر انگشت",
            face: "Face ID",
            hardware: "سخت‌افزاری",
            platform: "پلتفرم",
            unknown: "نامشخص",
        };
        return labels[type] || "نامشخص";
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">احراز هویت بایومتریک</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleRegister}
                    disabled={registering || !isWebAuthnSupported}
                >
                    {registering ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            در حال ثبت...
                        </>
                    ) : (
                        "ثبت اثر انگشت جدید"
                    )}
                </Button>
            </Box>

            {!isWebAuthnSupported && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    مرورگر شما از احراز هویت بایومتریک پشتیبانی نمی‌کند. لطفاً از مرورگرهای مدرن استفاده کنید.
                </Alert>
            )}

            {credentials.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <Fingerprint sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                هیچ credential بایومتریک ثبت نشده است
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                برای استفاده از ورود با اثر انگشت، ابتدا یک credential ثبت کنید
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <List>
                    {credentials.map((credential) => (
                        <Card key={credential.id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {credential.deviceName || "دستگاه بدون نام"}
                                        </Typography>
                                        <Box display="flex" gap={1} mt={1}>
                                            <Chip
                                                label={getDeviceTypeLabel(credential.deviceType)}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={getAuthenticatorTypeLabel(credential.authenticatorType)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                            آخرین استفاده:{" "}
                                            {credential.lastUsed
                                                ? new Date(credential.lastUsed).toLocaleDateString("fa-IR")
                                                : "هرگز"}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDeleteClick(credential.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </List>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, credentialId: null })}>
                <DialogTitle>حذف Credential</DialogTitle>
                <DialogContent>
                    <Typography>
                        آیا از حذف این credential اطمینان دارید؟ پس از حذف، دیگر نمی‌توانید با این دستگاه وارد شوید.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, credentialId: null })}>
                        انصراف
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleteCredential.isPending}
                    >
                        {deleteCredential.isPending ? <CircularProgress size={20} /> : "حذف"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

