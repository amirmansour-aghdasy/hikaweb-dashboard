"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Avatar,
    Button,
    ButtonGroup,
    Card,
    CardContent,
    CircularProgress,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import MediaPicker from "@/components/media/MediaPicker";
import toast from "react-hot-toast";
import { normalizeUserFields, getInitials } from "@/lib/utils";

export default function ProfileAvatar() {
    const { user, updateProfile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);

    useEffect(() => {
        if (user?.avatar !== undefined) {
            setAvatarUrl(user.avatar || null);
        }
    }, [user?.avatar]);

    const handleAvatarChange = async (selected) => {
        if (!selected) {
            setAvatarUrl(null);
            return;
        }

        setUploading(true);
        try {
            const imageUrl = typeof selected === "object" && selected.url ? selected.url : selected;
            setAvatarUrl(imageUrl);

            const result = await updateProfile({
                avatar: imageUrl,
            });

            if (result?.success) {
                toast.success("تصویر پروفایل با موفقیت به‌روزرسانی شد");
            }
        } catch (error) {
            console.error("Error updating avatar:", error);
            toast.error("خطا در به‌روزرسانی تصویر پروفایل");
            setAvatarUrl(user?.avatar || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setUploading(true);
        try {
            const result = await updateProfile({
                avatar: null,
            });

            if (result?.success) {
                setAvatarUrl(null);
                toast.success("تصویر پروفایل حذف شد");
            }
        } catch (error) {
            console.error("Error removing avatar:", error);
            toast.error("خطا در حذف تصویر پروفایل");
        } finally {
            setUploading(false);
        }
    };


    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تصویر پروفایل
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                تصویر پروفایل خود را تغییر دهید
            </Typography>

            <Card variant="outlined">
                <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                        <Box position="relative">
                            <Avatar
                                src={avatarUrl || undefined}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    fontSize: "3rem",
                                    bgcolor: "primary.main",
                                }}
                            >
                                {!avatarUrl && getInitials(user ? normalizeUserFields(user).name : "")}
                            </Avatar>
                            {uploading && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    bgcolor="rgba(0,0,0,0.5)"
                                    borderRadius="50%"
                                >
                                    <CircularProgress size={40} />
                                </Box>
                            )}
                        </Box>

                        <ButtonGroup variant="outlined" sx={{ justifyContent: "center" }}>
                            <MediaPicker
                                value={avatarUrl}
                                onChange={handleAvatarChange}
                                label="انتخاب تصویر"
                                accept="image/*"
                                multiple={false}
                                showPreview={false}
                                showEdit={true}
                                compact={true}
                                buttonProps={{
                                    sx: {
                                        borderTopRightRadius: avatarUrl ? 0 : undefined,
                                        borderBottomRightRadius: avatarUrl ? 0 : undefined,
                                    }
                                }}
                            />

                            {avatarUrl && (
                                <Button
                                    color="error"
                                    startIcon={<Delete />}
                                    onClick={handleRemoveAvatar}
                                    disabled={uploading}
                                    sx={{
                                        borderTopLeftRadius: 0,
                                        borderBottomLeftRadius: 0,
                                    }}
                                >
                                    حذف تصویر
                                </Button>
                            )}
                        </ButtonGroup>

                        <Typography variant="caption" color="text.secondary" textAlign="center">
                            تصویر باید در فرمت JPG، PNG یا GIF باشد و حداکثر ۵ مگابایت حجم داشته باشد.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

