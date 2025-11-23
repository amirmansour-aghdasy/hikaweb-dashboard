"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Chip,
    Button,
    Stack,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Paper,
    Alert,
} from "@mui/material";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import {
    BugReport,
    History,
    FilterList,
    Refresh,
    Download,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, getPersianValue } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";

const LEVEL_COLORS = {
    info: "info",
    warn: "warning",
    error: "error",
    debug: "default",
    critical: "error",
};

const ACTION_COLORS = {
    CREATE: "success",
    READ: "info",
    UPDATE: "warning",
    DELETE: "error",
    LOGIN: "info",
    LOGOUT: "default",
    PASSWORD_CHANGE: "warning",
    PASSWORD_RESET: "warning",
};

export default function LogsPage() {
    const router = useRouter();
    const { isSuperAdmin } = usePermission();
    const [tabValue, setTabValue] = useState(0); // 0: System, 1: Activity
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [filters, setFilters] = useState({
        search: "",
        level: "",
        type: "",
        action: "",
        resource: "",
        user: "",
        startDate: "",
        endDate: "",
    });

    const debouncedSearch = useDebounce(filters.search, 500);
    const { useFetchData } = useApi();

    // Build query params for system logs
    const systemQueryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (filters.level) params.append("level", filters.level);
        if (filters.type) params.append("type", filters.type);
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        return params.toString();
    }, [page, limit, filters.level, filters.type, debouncedSearch, filters.startDate, filters.endDate]);

    // Build query params for activity logs
    const activityQueryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (filters.action) params.append("action", filters.action);
        if (filters.resource) params.append("resource", filters.resource);
        if (filters.user) params.append("user", filters.user);
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        return params.toString();
    }, [page, limit, filters.action, filters.resource, filters.user, debouncedSearch, filters.startDate, filters.endDate]);

    // System Logs
    const {
        data: systemLogsData,
        isLoading: systemLoading,
        refetch: refetchSystem,
    } = useFetchData(
        ["logs-system", systemQueryParams],
        `/logs/system?${systemQueryParams}`,
        {
            enabled: tabValue === 0 && isSuperAdmin(),
        }
    );

    // Activity Logs
    const {
        data: activityLogsData,
        isLoading: activityLoading,
        refetch: refetchActivity,
    } = useFetchData(
        ["logs-activity", activityQueryParams],
        `/logs/activity?${activityQueryParams}`,
        {
            enabled: tabValue === 1 && isSuperAdmin(),
        }
    );

    const systemLogs = systemLogsData?.data || [];
    const systemPagination = systemLogsData?.pagination || {};

    const activityLogs = activityLogsData?.data || [];
    const activityPagination = activityLogsData?.pagination || {};

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
        setPage(1);
    };

    const handleResetFilters = () => {
        setFilters({
            search: "",
            level: "",
            type: "",
            action: "",
            resource: "",
            user: "",
            startDate: "",
            endDate: "",
        });
        setPage(1);
    };

    const systemColumns = useMemo(
        () => [
            {
                field: "level",
                headerName: "سطح",
                align: "left",
                width: 120,
                render: (row) => (
                    <Chip
                        label={row.level}
                        color={LEVEL_COLORS[row.level] || "default"}
                        size="small"
                    />
                ),
            },
            {
                field: "type",
                headerName: "نوع",
                align: "left",
                width: 150,
            },
            {
                field: "message",
                headerName: "پیام",
                align: "left",
                flex: 1,
                render: (row) => (
                    <Typography variant="body2" noWrap>
                        {row.message}
                    </Typography>
                ),
            },
            {
                field: "createdAt",
                headerName: "تاریخ",
                align: "left",
                width: 180,
                render: (row) => (
                    <Typography variant="body2">
                        {formatDate(row.createdAt)}
                    </Typography>
                ),
            },
        ],
        []
    );

    const activityColumns = useMemo(
        () => [
            {
                field: "action",
                headerName: "عملیات",
                align: "left",
                width: 120,
                render: (row) => (
                    <Chip
                        label={row.action}
                        color={ACTION_COLORS[row.action] || "default"}
                        size="small"
                    />
                ),
            },
            {
                field: "resource",
                headerName: "منبع",
                align: "left",
                width: 120,
            },
            {
                field: "user",
                headerName: "کاربر",
                align: "left",
                width: 200,
                render: (row) => (
                    <Typography variant="body2">
                        {row.user?.name || row.user?.email || "نامشخص"}
                    </Typography>
                ),
            },
            {
                field: "description",
                headerName: "توضیحات",
                align: "left",
                flex: 1,
                render: (row) => (
                    <Typography variant="body2" noWrap>
                        {row.description || `${row.action} ${row.resource}`}
                    </Typography>
                ),
            },
            {
                field: "ip",
                headerName: "IP",
                align: "left",
                width: 150,
            },
            {
                field: "createdAt",
                headerName: "تاریخ",
                align: "left",
                width: 180,
                render: (row) => (
                    <Typography variant="body2">
                        {formatDate(row.createdAt)}
                    </Typography>
                ),
            },
        ],
        []
    );

    if (!isSuperAdmin()) {
        return (
            <Layout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">
                        فقط مدیر کل می‌تواند به این بخش دسترسی داشته باشد.
                    </Alert>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                        لاگ‌های سیستم
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => {
                                if (tabValue === 0) refetchSystem();
                                else refetchActivity();
                            }}
                        >
                            به‌روزرسانی
                        </Button>
                    </Stack>
                </Box>

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab
                            icon={<BugReport />}
                            iconPosition="start"
                            label="لاگ سیستم"
                        />
                        <Tab
                            icon={<History />}
                            iconPosition="start"
                            label="لاگ فعالیت‌ها"
                        />
                    </Tabs>
                </Paper>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        <TextField
                            label="جستجو"
                            value={filters.search}
                            onChange={(e) =>
                                handleFilterChange("search", e.target.value)
                            }
                            size="small"
                            sx={{ minWidth: 200 }}
                        />

                        {tabValue === 0 ? (
                            <>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>سطح</InputLabel>
                                    <Select
                                        value={filters.level}
                                        onChange={(e) =>
                                            handleFilterChange("level", e.target.value)
                                        }
                                        label="سطح"
                                    >
                                        <MenuItem value="">همه</MenuItem>
                                        <MenuItem value="info">Info</MenuItem>
                                        <MenuItem value="warn">Warning</MenuItem>
                                        <MenuItem value="error">Error</MenuItem>
                                        <MenuItem value="critical">Critical</MenuItem>
                                        <MenuItem value="debug">Debug</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>نوع</InputLabel>
                                    <Select
                                        value={filters.type}
                                        onChange={(e) =>
                                            handleFilterChange("type", e.target.value)
                                        }
                                        label="نوع"
                                    >
                                        <MenuItem value="">همه</MenuItem>
                                        <MenuItem value="startup">Startup</MenuItem>
                                        <MenuItem value="shutdown">Shutdown</MenuItem>
                                        <MenuItem value="error">Error</MenuItem>
                                        <MenuItem value="database">Database</MenuItem>
                                        <MenuItem value="redis">Redis</MenuItem>
                                        <MenuItem value="external_service">
                                            External Service
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </>
                        ) : (
                            <>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>عملیات</InputLabel>
                                    <Select
                                        value={filters.action}
                                        onChange={(e) =>
                                            handleFilterChange("action", e.target.value)
                                        }
                                        label="عملیات"
                                    >
                                        <MenuItem value="">همه</MenuItem>
                                        <MenuItem value="CREATE">ایجاد</MenuItem>
                                        <MenuItem value="UPDATE">ویرایش</MenuItem>
                                        <MenuItem value="DELETE">حذف</MenuItem>
                                        <MenuItem value="LOGIN">ورود</MenuItem>
                                        <MenuItem value="LOGOUT">خروج</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="منبع"
                                    value={filters.resource}
                                    onChange={(e) =>
                                        handleFilterChange("resource", e.target.value)
                                    }
                                    size="small"
                                    sx={{ minWidth: 150 }}
                                />
                            </>
                        )}

                        <PersianDatePicker
                            label="از تاریخ"
                            value={filters.startDate ? new Date(filters.startDate) : null}
                            onChange={(date) =>
                                handleFilterChange("startDate", date ? date.toISOString().split('T')[0] : "")
                            }
                            size="small"
                            sx={{ minWidth: 150 }}
                        />

                        <PersianDatePicker
                            label="تا تاریخ"
                            value={filters.endDate ? new Date(filters.endDate) : null}
                            onChange={(date) =>
                                handleFilterChange("endDate", date ? date.toISOString().split('T')[0] : "")
                            }
                            size="small"
                            sx={{ minWidth: 150 }}
                        />

                        <Button
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={handleResetFilters}
                        >
                            پاک کردن فیلترها
                        </Button>
                    </Stack>
                </Paper>

                {/* DataTable */}
                {tabValue === 0 ? (
                    <DataTable
                        data={systemLogs}
                        columns={systemColumns}
                        loading={systemLoading}
                        pagination={{
                            page: systemPagination.page || 1,
                            total: systemPagination.total || 0,
                            totalPages: systemPagination.totalPages || 0,
                            limit: systemPagination.limit || 25,
                        }}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        canView={false}
                        canEdit={false}
                        canDelete={false}
                        canCreate={false}
                    />
                ) : (
                    <DataTable
                        data={activityLogs}
                        columns={activityColumns}
                        loading={activityLoading}
                        pagination={{
                            page: activityPagination.page || 1,
                            total: activityPagination.total || 0,
                            totalPages: activityPagination.totalPages || 0,
                            limit: activityPagination.limit || 25,
                        }}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        canView={false}
                        canEdit={false}
                        canDelete={false}
                        canCreate={false}
                    />
                )}
            </Box>
        </Layout>
    );
}

