"use client";
import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Typography,
    Chip,
    Button,
    Stack,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Paper,
    Card,
    CardContent,
    Grid,
} from "@mui/material";
import {
    Add,
    Assignment,
    CheckCircle,
    Cancel,
    Schedule,
    Person,
    Flag,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, getPersianValue } from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";

const STATUS_COLORS = {
    pending: "default",
    in_progress: "info",
    completed: "success",
    cancelled: "error",
};

const PRIORITY_COLORS = {
    low: "default",
    normal: "info",
    high: "warning",
    urgent: "error",
};

const STATUS_LABELS = {
    pending: "در انتظار",
    in_progress: "در حال انجام",
    completed: "تکمیل شده",
    cancelled: "لغو شده",
};

const PRIORITY_LABELS = {
    low: "پایین",
    normal: "عادی",
    high: "بالا",
    urgent: "فوری",
};

export default function TasksPage() {
    const [editingTask, setEditingTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [statistics, setStatistics] = useState(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            params.append("status", statusFilter);
        }
        if (priorityFilter !== "all") {
            params.append("priority", priorityFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, priorityFilter, page, limit]);

    const endpoint = `/tasks?${queryParams}`;

    // Fetch tasks
    const {
        data: tasksData,
        loading: isLoading,
        refetch,
    } = useApi(endpoint);

    // Fetch statistics
    useApi("/tasks/statistics", {
        onSuccess: (data) => {
            if (data?.success) {
                setStatistics(data.data);
            }
        },
    });

    const tasks = tasksData?.data || [];
    const pagination = tasksData?.pagination || {};

    const handleAdd = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleDelete = (task) => {
        setTaskToDelete(task);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!taskToDelete) return;

        try {
            await api.delete(`/tasks/${taskToDelete._id}`);
            toast.success("وظیفه با موفقیت حذف شد");
            setIsDeleteDialogOpen(false);
            setTaskToDelete(null);
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || "خطا در حذف وظیفه");
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingTask) {
                await api.put(`/tasks/${editingTask._id}`, formData);
                toast.success("وظیفه با موفقیت به‌روزرسانی شد");
            } else {
                await api.post("/tasks", formData);
                toast.success("وظیفه با موفقیت ایجاد شد");
            }
            setIsModalOpen(false);
            setEditingTask(null);
            refetch();
        } catch (error) {
            toast.error(
                error.response?.data?.message || "خطا در ذخیره وظیفه"
            );
        }
    };

    const handleStatusChange = async (task, newStatus) => {
        try {
            await api.put(`/tasks/${task._id}`, { status: newStatus });
            toast.success("وضعیت وظیفه تغییر کرد");
            refetch();
        } catch (error) {
            toast.error(
                error.response?.data?.message || "خطا در تغییر وضعیت"
            );
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1);
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const columns = [
        {
            field: "title",
            headerName: "عنوان",
            flex: 2,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold">
                    {row.title}
                </Typography>
            ),
        },
        {
            field: "assignee",
            headerName: "اختصاص داده شده به",
            width: 180,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                        sx={{ width: 32, height: 32 }}
                        src={row.assignee?.avatar}
                    >
                        {row.assignee?.name?.charAt(0) || "?"}
                    </Avatar>
                    <Typography variant="body2">
                        {row.assignee?.name || "-"}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "status",
            headerName: "وضعیت",
            width: 140,
            render: (row) => (
                <Chip
                    label={STATUS_LABELS[row.status] || row.status}
                    color={STATUS_COLORS[row.status] || "default"}
                    size="small"
                />
            ),
        },
        {
            field: "priority",
            headerName: "اولویت",
            width: 120,
            render: (row) => (
                <Chip
                    label={PRIORITY_LABELS[row.priority] || row.priority}
                    color={PRIORITY_COLORS[row.priority] || "default"}
                    size="small"
                    icon={<Flag />}
                />
            ),
        },
        {
            field: "dueDate",
            headerName: "مهلت",
            width: 150,
            render: (row) => (
                <Typography variant="body2">
                    {row.dueDate ? formatDate(row.dueDate) : "-"}
                </Typography>
            ),
        },
        {
            field: "createdAt",
            headerName: "تاریخ ایجاد",
            width: 150,
            render: (row) => (
                <Typography variant="body2">
                    {formatDate(row.createdAt)}
                </Typography>
            ),
        },
    ];

    const customActions = [
        {
            label: "تغییر به در حال انجام",
            icon: <Schedule />,
            onClick: (task) => handleStatusChange(task, "in_progress"),
            disabled: (task) => task.status === "in_progress" || task.status === "completed" || task.status === "cancelled",
            color: "info",
        },
        {
            label: "تکمیل",
            icon: <CheckCircle />,
            onClick: (task) => handleStatusChange(task, "completed"),
            disabled: (task) => task.status === "completed" || task.status === "cancelled",
            color: "success",
        },
        {
            label: "لغو",
            icon: <Cancel />,
            onClick: (task) => handleStatusChange(task, "cancelled"),
            disabled: (task) => task.status === "cancelled" || task.status === "completed",
            color: "error",
        },
    ];

    const filters = [
        {
            name: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: (e) => {
                setStatusFilter(e.target.value);
                setPage(1);
            },
            options: [
                { value: "all", label: "همه" },
                { value: "pending", label: "در انتظار" },
                { value: "in_progress", label: "در حال انجام" },
                { value: "completed", label: "تکمیل شده" },
                { value: "cancelled", label: "لغو شده" },
            ],
        },
        {
            name: "priority",
            label: "اولویت",
            value: priorityFilter,
            onChange: (e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
            },
            options: [
                { value: "all", label: "همه" },
                { value: "low", label: "پایین" },
                { value: "normal", label: "عادی" },
                { value: "high", label: "بالا" },
                { value: "urgent", label: "فوری" },
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                {/* Statistics Cards */}
                {statistics && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        کل وظایف
                                    </Typography>
                                    <Typography variant="h4">
                                        {statistics.total || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        در انتظار
                                    </Typography>
                                    <Typography variant="h4" color="default">
                                        {statistics.byStatus?.pending || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        در حال انجام
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {statistics.byStatus?.in_progress || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        تکمیل شده
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {statistics.byStatus?.completed || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                <Box
                    sx={{
                        mb: 3,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت وظایف
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAdd}
                        size="large"
                    >
                        وظیفه جدید
                    </Button>
                </Box>

                <DataTable
                    title="لیست وظایف"
                    data={tasks}
                    columns={columns}
                    loading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در وظایف (حداقل 2 کاراکتر)..."
                    enableSelection={false}
                    customActions={customActions}
                    filters={filters}
                    canView={false}
                    canEdit={true}
                    canDelete={true}
                    canCreate={true}
                    emptyStateProps={{
                        title: "وظیفه‌ای یافت نشد",
                        description:
                            "هنوز وظیفه‌ای ایجاد نشده است. اولین وظیفه خود را ایجاد کنید!",
                        action: {
                            label: "ایجاد وظیفه جدید",
                            onClick: handleAdd,
                        },
                    }}
                />

                {/* Task Form Modal */}
                <TaskFormModal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTask(null);
                    }}
                    onSave={handleSave}
                    task={editingTask}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                >
                    <DialogTitle>تایید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف وظیفه{" "}
                            <strong>{taskToDelete?.title}</strong> اطمینان
                            دارید؟
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>
                            انصراف
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            color="error"
                            variant="contained"
                        >
                            حذف
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}

// Task Form Modal Component
function TaskFormModal({ open, onClose, onSave, task }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assignee: "",
        priority: "normal",
        dueDate: "",
        tags: [],
        notifications: {
            dashboard: true,
            email: false,
            sms: false,
        },
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch users for assignee dropdown
    const { data: usersData } = useApi("/users?limit=100", {
        enabled: open,
    });

    useEffect(() => {
        if (usersData?.success && usersData.data) {
            setUsers(usersData.data);
        }
    }, [usersData]);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || "",
                description: task.description || "",
                assignee: task.assignee?._id || task.assignee || "",
                priority: task.priority || "normal",
                dueDate: task.dueDate
                    ? new Date(task.dueDate).toISOString().split("T")[0]
                    : "",
                tags: task.tags || [],
                notifications: task.notifications || {
                    dashboard: true,
                    email: false,
                    sms: false,
                },
            });
        } else {
            setFormData({
                title: "",
                description: "",
                assignee: "",
                priority: "normal",
                dueDate: "",
                tags: [],
                notifications: {
                    dashboard: true,
                    email: false,
                    sms: false,
                },
            });
        }
    }, [task, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = {
                ...formData,
                dueDate: formData.dueDate || undefined,
            };
            await onSave(submitData);
        } catch (error) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={task ? "ویرایش وظیفه" : "وظیفه جدید"}>
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <TextField
                        label="عنوان"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                        }
                        required
                        fullWidth
                    />

                    <TextField
                        label="توضیحات"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                        multiline
                        rows={4}
                        fullWidth
                    />

                    <FormControl fullWidth required>
                        <InputLabel>اختصاص داده شده به</InputLabel>
                        <Select
                            value={formData.assignee}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    assignee: e.target.value,
                                })
                            }
                            label="اختصاص داده شده به"
                        >
                            {users.map((user) => (
                                <MenuItem key={user._id} value={user._id}>
                                    {user.name} ({user.email})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>اولویت</InputLabel>
                        <Select
                            value={formData.priority}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    priority: e.target.value,
                                })
                            }
                            label="اولویت"
                        >
                            <MenuItem value="low">پایین</MenuItem>
                            <MenuItem value="normal">عادی</MenuItem>
                            <MenuItem value="high">بالا</MenuItem>
                            <MenuItem value="urgent">فوری</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="مهلت"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                dueDate: e.target.value,
                            })
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            اعلان‌ها
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <FormControl>
                                <InputLabel>داشبورد</InputLabel>
                                <Select
                                    value={formData.notifications.dashboard}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            notifications: {
                                                ...formData.notifications,
                                                dashboard: e.target.value,
                                            },
                                        })
                                    }
                                >
                                    <MenuItem value={true}>فعال</MenuItem>
                                    <MenuItem value={false}>غیرفعال</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl>
                                <InputLabel>ایمیل</InputLabel>
                                <Select
                                    value={formData.notifications.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            notifications: {
                                                ...formData.notifications,
                                                email: e.target.value,
                                            },
                                        })
                                    }
                                >
                                    <MenuItem value={true}>فعال</MenuItem>
                                    <MenuItem value={false}>غیرفعال</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl>
                                <InputLabel>SMS</InputLabel>
                                <Select
                                    value={formData.notifications.sms}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            notifications: {
                                                ...formData.notifications,
                                                sms: e.target.value,
                                            },
                                        })
                                    }
                                >
                                    <MenuItem value={true}>فعال</MenuItem>
                                    <MenuItem value={false}>غیرفعال</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={onClose}>انصراف</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? "در حال ذخیره..." : "ذخیره"}
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Modal>
    );
}

