"use client";
import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Avatar, Divider, Button, useTheme, useMediaQuery } from "@mui/material";
import { Menu as MenuIcon, AccountCircle, Logout, Settings, Person, Language } from "@mui/icons-material";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import NotificationButton from "./NotificationButton";
import NotificationsMenu from "./NotificationsMenu";

export default function Header({ onMenuClick, sidebarOpen }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { user, logout } = useAuth();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchor, setNotificationAnchor] = useState(null);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationOpen = (event) => {
        setNotificationAnchor(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchor(null);
    };

    const handleLogout = async () => {
        await logout();
        handleProfileMenuClose();
    };

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    bgcolor: "background.paper",
                    color: "text.primary",
                    boxShadow: theme.shadows[1],
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    transition: theme.transitions.create(["margin"], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    ...(sidebarOpen &&
                        !isMobile && {
                            marginLeft: "280px",
                            width: "calc(100% - 280px)",
                        }),
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" aria-label="toggle drawer" onClick={onMenuClick} edge="start" sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
                        داشبورد مدیریت
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

                        {/* Notifications */}
                        <NotificationButton onOpen={handleNotificationOpen} />

                        {/* Profile Menu */}
                        <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                            <Avatar
                                src={user?.avatar || undefined}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: "primary.main",
                                    fontSize: "1rem",
                                }}
                            >
                                {!user?.avatar && (user?.name?.charAt(0) || "A")}
                            </Avatar>
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Profile Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        mt: 1.5,
                        minWidth: 200,
                        "& .MuiMenuItem-root": {
                            px: 2,
                            py: 1.5,
                        },
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {user?.name || "مدیر سیستم"}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {user?.email}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => router.push("/dashboard/profile")}>
                    <Person sx={{ mr: 2 }} />
                    پروفایل کاربری
                </MenuItem>
                <MenuItem onClick={() => router.push("/dashboard/settings")}>
                    <Settings sx={{ mr: 2 }} />
                    تنظیمات
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                    <Logout sx={{ mr: 2 }} />
                    خروج از حساب
                </MenuItem>
            </Menu>

            {/* Notifications Menu */}
            <NotificationsMenu
                anchorEl={notificationAnchor}
                open={Boolean(notificationAnchor)}
                onClose={handleNotificationClose}
            />
        </>
    );
}
