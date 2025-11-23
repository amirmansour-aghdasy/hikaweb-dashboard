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
} from "@mui/material";
import { History, Search } from "@mui/icons-material";
import { useApi } from "@/hooks/useApi";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

const ACTION_COLORS = {
    CREATE: "success",
    UPDATE: "info",
    DELETE: "error",
    READ: "default",
    LOGIN: "primary",
    LOGOUT: "secondary",
    CHANGE_PASSWORD: "warning",
    UPDATE_PROFILE: "info",
};

const ACTION_LABELS = {
    CREATE: "ایجاد",
    UPDATE: "ویرایش",
    DELETE: "حذف",
    READ: "مشاهده",
    LOGIN: "ورود",
    LOGOUT: "خروج",
    CHANGE_PASSWORD: "تغییر رمز عبور",
    UPDATE_PROFILE: "به‌روزرسانی پروفایل",
};

export default function ActivityHistory() {
    const { useFetchData } = useApi();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
        }
        if (actionFilter !== "all") {
            params.append("action", actionFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, actionFilter, page, limit]);

    const { data: activityData, isLoading } = useFetchData(
        ["user-activity", queryParams],
        `/auth/activity?${queryParams}`
    );

    const activities = activityData?.data || [];
    const pagination = activityData?.pagination || {};

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                تاریخچه فعالیت‌ها
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                مشاهده تاریخچه فعالیت‌های خود در سیستم
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item size={{xs: 12, md: 6}}>
                    <TextField
                        fullWidth
                        placeholder="جستجو در فعالیت‌ها..."
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
                <Grid item size={{xs: 12, md: 6}}>
                    <TextField
                        fullWidth
                        select
                        label="فیلتر بر اساس عملیات"
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <MenuItem value="all">همه</MenuItem>
                        {Object.keys(ACTION_LABELS).map((action) => (
                            <MenuItem key={action} value={action}>
                                {ACTION_LABELS[action]}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>

            {isLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : activities.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <History sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                هیچ فعالیتی یافت نشد
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <List>
                        {activities.map((activity, index) => (
                            <Card key={activity._id || index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                                        <Box flex={1}>
                                            <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                                                <Chip
                                                    label={ACTION_LABELS[activity.action] || activity.action}
                                                    color={ACTION_COLORS[activity.action] || "default"}
                                                    size="small"
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDateTime(activity.createdAt)}
                                                </Typography>
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                {activity.description || `${activity.action} ${activity.resource}`}
                                            </Typography>
                                            {activity.resource && (
                                                <Typography variant="body2" color="text.secondary">
                                                    منبع: {activity.resource}
                                                </Typography>
                                            )}
                                            {activity.ip && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    IP: {activity.ip}
                                                </Typography>
                                            )}
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
                            نمایش {((page - 1) * limit) + 1} تا {Math.min(page * limit, pagination.total)} از {pagination.total} فعالیت
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );
}

