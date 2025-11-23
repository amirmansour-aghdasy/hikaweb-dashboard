"use client";
import { Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Box, Typography, Divider, Collapse, useTheme } from "@mui/material";
import {
    Dashboard,
    People,
    Article,
    Work,
    Business,
    Comment,
    Group,
    Help,
    SupportAgent,
    Category,
    BrandingWatermark,
    Psychology,
    Folder,
    Settings,
    ViewCarousel,
    ExpandLess,
    ExpandMore,
    Analytics,
    AdminPanelSettings,
    BugReport,
    Assignment,
    CalendarToday,
    Person,
} from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePermission } from "../../hooks/usePermission";

const menuItems = [
    {
        title: "داشبورد",
        icon: <Dashboard />,
        path: "/dashboard",
    },
    {
        title: "آنالیز و گزارش",
        icon: <Analytics />,
        path: "/dashboard/analytics",
    },
    {
        title: "مدیریت کاربران",
        icon: <People />,
        children: [
            { title: "کاربران", path: "/dashboard/users" },
            { title: "نقش‌ها", path: "/dashboard/roles" },
        ],
    },
    {
        title: "مدیریت محتوا",
        icon: <Article />,
        children: [
            { title: "مقالات", path: "/dashboard/articles" },
            { title: "خدمات", path: "/dashboard/services" },
            { title: "نمونه کارها", path: "/dashboard/portfolio" },
            { title: "دسته‌بندی‌ها", path: "/dashboard/categories" },
        ],
    },
    {
        title: "تعامل کاربران",
        icon: <Comment />,
        children: [
            { title: "نظرات", path: "/dashboard/comments" },
            { title: "تیکت‌ها", path: "/dashboard/tickets" },
            { title: "درخواست مشاوره", path: "/dashboard/consultations" },
        ],
    },
    {
        title: "معرفی شرکت",
        icon: <Business />,
        children: [
            { title: "اعضای تیم", path: "/dashboard/team" },
            { title: "برندهای مشتریان", path: "/dashboard/brands" },
            { title: "سوالات متداول", path: "/dashboard/faq" },
        ],
    },
    {
        title: "رسانه",
        icon: <Folder />,
        path: "/dashboard/media",
    },
    {
        title: "اسلایدرها",
        icon: <ViewCarousel />,
        path: "/dashboard/carousel",
    },
    {
        title: "وظایف",
        icon: <Assignment />,
        path: "/dashboard/tasks",
    },
    {
        title: "تقویم اجرایی",
        icon: <CalendarToday />,
        path: "/dashboard/calendar",
    },
    {
        title: "تنظیمات",
        icon: <Settings />,
        path: "/dashboard/settings",
    },
    {
        title: "پروفایل",
        icon: <Person />,
        path: "/dashboard/profile",
    },
    {
        title: "لاگ‌های سیستم",
        icon: <BugReport />,
        path: "/dashboard/logs",
        superAdminOnly: true,
    },
];

export default function Sidebar({ open, onClose, isMobile }) {
    const pathname = usePathname();
    const router = useRouter();
    const theme = useTheme();
    const { user } = useAuth();
    const { isSuperAdmin } = usePermission();
    const [expandedItems, setExpandedItems] = useState({});

    useEffect(() => {
        menuItems.forEach((item) => {
            if (item.children) {
                const hasActiveChild = item.children.some((child) => isItemActive(child.path));
                if (hasActiveChild) {
                    setExpandedItems((prev) => ({
                        ...prev,
                        [item.title]: true,
                    }));
                }
            }
        });
    }, [pathname]);

    const handleItemClick = (item) => {
        if (item.children) {
            setExpandedItems((prev) => ({
                ...prev,
                [item.title]: !prev[item.title],
            }));
        } else {
            router.push(item.path);
            if (isMobile) {
                onClose();
            }
        }
    };

    const isItemActive = (path) => {
        if (pathname === path) return true;

        if (path === "/dashboard" && pathname !== "/dashboard") return false;

        if (pathname.startsWith(path + "/")) return true;
        return false;
    };

    const sidebarContent = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Logo and Title */}
            <Box
                sx={{
                    p: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    textAlign: "center",
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    هیکاوب
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    پنل مدیریت
                </Typography>
            </Box>

            {/* User Info */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                        }}
                    >
                        {user?.name?.charAt(0) || "A"}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {user?.name || "مدیر سیستم"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {user?.role?.displayName?.fa || user?.role?.name || "مدیر"}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Navigation Menu */}
            <Box sx={{ flex: 1, overflow: "auto" }}>
                <List sx={{ py: 1 }}>
                    {menuItems
                        .filter((item) => !item.superAdminOnly || isSuperAdmin())
                        .map((item) => (
                        <div key={item.title}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => handleItemClick(item)}
                                    sx={{
                                        mx: 1,
                                        borderRadius: 2,
                                        mb: 0.5,
                                        bgcolor: isItemActive(item.path) ? "primary.light" : "transparent",
                                        color: isItemActive(item.path) ? "primary.contrastText" : "text.primary",
                                        "&:hover": {
                                            bgcolor: isItemActive(item.path) ? "primary.main" : "action.hover",
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: isItemActive(item.path) ? "primary.contrastText" : "text.secondary",
                                            minWidth: 40,
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.title}
                                        primaryTypographyProps={{
                                            fontSize: "0.9rem",
                                            fontWeight: isItemActive(item.path) ? 600 : 400,
                                        }}
                                    />
                                    {item.children && (expandedItems[item.title] ? <ExpandLess /> : <ExpandMore />)}
                                </ListItemButton>
                            </ListItem>

                            {/* Submenu */}
                            {item.children && (
                                <Collapse in={expandedItems[item.title]} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {item.children.map((subItem) => (
                                            <ListItem key={subItem.path} disablePadding>
                                                <ListItemButton
                                                    onClick={() => {
                                                        router.push(subItem.path);
                                                        if (isMobile) onClose();
                                                    }}
                                                    sx={{
                                                        mx: 1,
                                                        mr: 3,
                                                        borderRadius: 2,
                                                        mb: 0.5,
                                                        bgcolor: isItemActive(subItem.path) ? "primary.light" : "transparent",
                                                        color: isItemActive(subItem.path) ? "primary.contrastText" : "text.primary",
                                                        "&:hover": {
                                                            bgcolor: isItemActive(subItem.path) ? "primary.main" : "action.hover",
                                                        },
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={subItem.title}
                                                        primaryTypographyProps={{
                                                            fontSize: "0.85rem",
                                                            fontWeight: isItemActive(subItem.path) ? 600 : 400,
                                                        }}
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                            )}
                        </div>
                    ))}
                </List>
            </Box>
        </Box>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            {!isMobile && (
                <Drawer
                    variant="persistent"
                    anchor="left"
                    open={open}
                    sx={{
                        width: 280,
                        flexShrink: 0,
                        "& .MuiDrawer-paper": {
                            width: 280,
                            boxSizing: "border-box",
                            borderRight: "none",
                            boxShadow: theme.shadows[3],
                        },
                    }}
                >
                    {sidebarContent}
                </Drawer>
            )}

            {/* Mobile Sidebar */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    anchor="left"
                    open={open}
                    onClose={onClose}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        "& .MuiDrawer-paper": {
                            width: 280,
                            boxSizing: "border-box",
                        },
                    }}
                >
                    {sidebarContent}
                </Drawer>
            )}
        </>
    );
}
