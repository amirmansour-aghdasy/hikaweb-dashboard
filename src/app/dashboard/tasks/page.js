"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
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
    Menu,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Paper,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    CircularProgress,
    Skeleton,
} from "@mui/material";
import { Add, Schedule, MoreVert, Edit, Delete, DragIndicator } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";

const STATUS_ORDER = ["pending", "in_progress", "completed", "cancelled"];
const STATUS_LABELS = {
    pending: "در انتظار",
    in_progress: "در حال انجام",
    completed: "تکمیل شده",
    cancelled: "لغو شده",
};
const STATUS_COLORS = {
    pending: { bg: "#f4f5f7", header: "#6b778c", accent: "#6b778c" },
    in_progress: { bg: "#e3f2fd", header: "#1976d2", accent: "#1976d2" },
    completed: { bg: "#e8f5e9", header: "#2e7d32", accent: "#2e7d32" },
    cancelled: { bg: "#ffebee", header: "#c62828", accent: "#c62828" },
};
const PRIORITY_LABELS = { low: "پایین", normal: "عادی", high: "بالا", urgent: "فوری" };
const PRIORITY_COLORS = {
    low: "default",
    normal: "info",
    high: "warning",
    urgent: "error",
};

// Fetch all tasks for board (no pagination)
const BOARD_LIMIT = 500;

export default function TasksPage() {
    const theme = useTheme();
    const [editingTask, setEditingTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [statistics, setStatistics] = useState(null);

    const { useFetchData } = useApi();
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", "1");
        params.append("limit", BOARD_LIMIT.toString());
        if (searchTerm && searchTerm.length >= 2) params.append("search", searchTerm);
        return params.toString();
    }, [searchTerm]);

    const { data: tasksData, isLoading, refetch } = useFetchData(
        ["tasks-board", queryParams],
        `/tasks?${queryParams}`
    );
    const { data: statisticsData, refetch: refetchStatistics } = useFetchData("tasks-statistics", "/tasks/statistics");

    // استخراج لیست وظایف: API برمی‌گرداند { success, data: [...], pagination }
    const tasks = useMemo(() => {
        if (!tasksData) return [];
        if (Array.isArray(tasksData)) return tasksData;
        const list = tasksData.data ?? tasksData.items ?? tasksData.tasks;
        return Array.isArray(list) ? list : [];
    }, [tasksData]);

    const tasksByStatus = useMemo(() => {
        const map = { pending: [], in_progress: [], completed: [], cancelled: [] };
        tasks.forEach((t) => {
            const status = t.status && map[t.status] ? t.status : "pending";
            map[status].push(t);
        });
        return map;
    }, [tasks]);

    useEffect(() => {
        if (statisticsData?.success && statisticsData.data) setStatistics(statisticsData.data);
    }, [statisticsData]);

    const handleAdd = (status = "pending") => {
        setEditingTask({ status, _isNew: true });
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
            refetchStatistics();
        } catch (error) {
            toast.error(error.response?.data?.message || "خطا در حذف وظیفه");
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingTask?._id && !editingTask._isNew) {
                await api.put(`/tasks/${editingTask._id}`, formData);
                toast.success("وظیفه با موفقیت به‌روزرسانی شد");
            } else {
                await api.post("/tasks", { ...formData, status: editingTask?.status || "pending" });
                toast.success("وظیفه با موفقیت ایجاد شد");
            }
            setIsModalOpen(false);
            setEditingTask(null);
            refetch();
            refetchStatistics();
        } catch (error) {
            toast.error(error.response?.data?.message || "خطا در ذخیره وظیفه");
        }
    };

    const handleStatusChange = useCallback(
        async (task, newStatus) => {
            if (task.status === newStatus) return;
            try {
                await api.put(`/tasks/${task._id}`, { status: newStatus });
                toast.success("وضعیت وظیفه تغییر کرد");
                refetch();
                refetchStatistics();
            } catch (error) {
                toast.error(error.response?.data?.message || "خطا در تغییر وضعیت");
            }
        },
        [refetch, refetchStatistics]
    );

    const onDragStart = (e, task) => {
        setDraggedTask(task);
        e.dataTransfer.setData("text/plain", task._id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify({ id: task._id, status: task.status }));
    };

    const onDragOver = (e, status) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverColumn(status);
    };

    const onDragLeave = () => setDragOverColumn(null);

    const onDrop = (e, newStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (!draggedTask || draggedTask.status === newStatus) {
            setDraggedTask(null);
            return;
        }
        handleStatusChange(draggedTask, newStatus);
        setDraggedTask(null);
    };

    const onDragEnd = () => {
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    return (
        <Layout>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <Typography variant="h5" fontWeight="bold">
                        مدیریت وظایف
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="جستجو..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ minWidth: 200 }}
                        />
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleAdd("pending")} size="medium">
                            وظیفه جدید
                        </Button>
                    </Stack>
                </Box>

                {/* Stats strip (compact) */}
                {statistics && (
                    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
                        <Chip label={`کل: ${statistics.total || 0}`} size="small" />
                        <Chip label={`در انتظار: ${statistics.byStatus?.pending || 0}`} size="small" color="default" />
                        <Chip label={`در حال انجام: ${statistics.byStatus?.in_progress || 0}`} size="small" color="info" />
                        <Chip label={`تکمیل شده: ${statistics.byStatus?.completed || 0}`} size="small" color="success" />
                        <Chip label={`لغو شده: ${statistics.byStatus?.cancelled || 0}`} size="small" color="error" />
                    </Stack>
                )}

                {/* Trello-style board */}
                <Box
                    sx={{
                        flex: 1,
                        overflowX: "auto",
                        overflowY: "hidden",
                        pb: 1,
                        minHeight: 360,
                    }}
                >
                    {isLoading ? (
                        <Stack direction="row" spacing={2}>
                            {[1, 2, 3, 4].map((i) => (
                                <Paper key={i} sx={{ width: 280, minWidth: 280, p: 1.5, borderRadius: 2 }}>
                                    <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                                    <Stack spacing={1}>
                                        {[1, 2, 3].map((j) => (
                                            <Skeleton key={j} variant="rounded" height={72} sx={{ borderRadius: 1 }} />
                                        ))}
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ minWidth: "max-content", height: "100%" }}>
                        {STATUS_ORDER.map((status) => {
                            const col = STATUS_COLORS[status];
                            const list = tasksByStatus[status] || [];
                            const isOver = dragOverColumn === status;
                            return (
                                <Paper
                                    key={status}
                                    onDragOver={(e) => onDragOver(e, status)}
                                    onDragLeave={onDragLeave}
                                    onDrop={(e) => onDrop(e, status)}
                                    sx={{
                                        width: 280,
                                        minWidth: 280,
                                        maxHeight: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        bgcolor: isOver ? alpha(col.accent, 0.12) : col.bg,
                                        border: isOver ? `2px dashed ${col.accent}` : "1px solid",
                                        borderColor: alpha(theme.palette.divider, 0.5),
                                        borderRadius: 2,
                                        transition: "background-color 0.2s, border 0.2s",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 1.5,
                                            py: 1,
                                            borderBottom: "1px solid",
                                            borderColor: alpha(theme.palette.divider, 0.4),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: col.header }}>
                                            {STATUS_LABELS[status]}
                                        </Typography>
                                        <Chip label={list.length} size="small" sx={{ height: 22 }} />
                                    </Box>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            overflowY: "auto",
                                            overflowX: "hidden",
                                            p: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1,
                                        }}
                                    >
                                        {list.map((task) => (
                                            <TaskCard
                                                key={task._id}
                                                task={task}
                                                isDragging={draggedTask?._id === task._id}
                                                onDragStart={onDragStart}
                                                onDragEnd={onDragEnd}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </Box>
                                    {status !== "cancelled" && status !== "completed" && (
                                        <Button
                                            fullWidth
                                            startIcon={<Add />}
                                            onClick={() => handleAdd(status)}
                                            size="small"
                                            sx={{ justifyContent: "flex-start", py: 1, borderRadius: 1 }}
                                        >
                                            افزودن کارت
                                        </Button>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>
                    )}
                </Box>

                <TaskFormModal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTask(null);
                    }}
                    onSave={handleSave}
                    task={editingTask}
                />

                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تایید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف وظیفه <strong>{taskToDelete?.title}</strong> اطمینان دارید؟
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            حذف
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}

function TaskCard({ task, isDragging, onDragStart, onDragEnd, onEdit, onDelete }) {
    const [menuAnchor, setMenuAnchor] = useState(null);

    return (
        <Card
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onDragEnd={onDragEnd}
            sx={{
                cursor: "grab",
                opacity: isDragging ? 0.5 : 1,
                boxShadow: 1,
                "&:active": { cursor: "grabbing" },
                "&:hover": { boxShadow: 2 },
            }}
        >
            <CardContent sx={{ py: 1.5, px: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                    <DragIndicator sx={{ color: "action.disabled", fontSize: 18, mt: 0.25 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            fontWeight="600"
                            onClick={() => onEdit(task)}
                            sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                        >
                            {task.title}
                        </Typography>
                        {task.description && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.25 }}>
                                {task.description}
                            </Typography>
                        )}
                        <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                                size="small"
                                label={PRIORITY_LABELS[task.priority] || task.priority}
                                color={PRIORITY_COLORS[task.priority] || "default"}
                                sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                            {task.dueDate && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                    <Schedule sx={{ fontSize: 14 }} />
                                    {formatDate(task.dueDate)}
                                </Typography>
                            )}
                            {task.assignee && (
                                <Tooltip title={task.assignee?.name || ""}>
                                    <Avatar sx={{ width: 22, height: 22 }} src={task.assignee?.avatar}>
                                        {task.assignee?.name?.charAt(0) || "?"}
                                    </Avatar>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>
                    <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                        <MoreVert fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
            <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                <MenuItem onClick={() => { setMenuAnchor(null); onEdit(task); }}>
                    <Edit fontSize="small" sx={{ mr: 1 }} /> ویرایش
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setMenuAnchor(null);
                        onDelete(task);
                    }}
                    sx={{ color: "error.main" }}
                >
                    <Delete fontSize="small" sx={{ mr: 1 }} /> حذف
                </MenuItem>
            </Menu>
        </Card>
    );
}

function TaskFormModal({ open, onClose, onSave, task }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assignee: "",
        priority: "normal",
        dueDate: "",
        tags: [],
        notifications: { dashboard: true, email: false, sms: false },
    });
    const [loading, setLoading] = useState(false);
    const { useFetchData } = useApi();
    const { data: usersData } = useFetchData("task-form-users", "/users?limit=100", { enabled: open });
    const users = usersData?.data || [];

    useEffect(() => {
        if (!open) return;
        if (task?._id && !task._isNew) {
            setFormData({
                title: task.title || "",
                description: task.description || "",
                assignee: task.assignee?._id || task.assignee || "",
                priority: task.priority || "normal",
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                tags: task.tags || [],
                notifications: task.notifications || { dashboard: true, email: false, sms: false },
            });
        } else {
            setFormData({
                title: "",
                description: "",
                assignee: "",
                priority: "normal",
                dueDate: "",
                tags: [],
                notifications: { dashboard: true, email: false, sms: false },
            });
        }
    }, [open, task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ ...formData, dueDate: formData.dueDate || undefined });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{task?._id && !task._isNew ? "ویرایش وظیفه" : "وظیفه جدید"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField
                            label="عنوان"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            fullWidth
                        />
                        <TextField
                            label="توضیحات"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={3}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>اختصاص به</InputLabel>
                            <Select
                                value={formData.assignee && users.some((u) => u._id === formData.assignee) ? formData.assignee : ""}
                                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                label="اختصاص به"
                                displayEmpty
                            >
                                {users.length === 0 && <MenuItem value="">در حال بارگذاری...</MenuItem>}
                                {users.map((u) => (
                                    <MenuItem key={u._id} value={u._id}>
                                        {u.name} ({u.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>اولویت</InputLabel>
                            <Select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                label="اولویت"
                            >
                                <MenuItem value="low">پایین</MenuItem>
                                <MenuItem value="normal">عادی</MenuItem>
                                <MenuItem value="high">بالا</MenuItem>
                                <MenuItem value="urgent">فوری</MenuItem>
                            </Select>
                        </FormControl>
                        <PersianDatePicker
                            label="مهلت"
                            value={formData.dueDate ? new Date(formData.dueDate) : null}
                            onChange={(date) =>
                                setFormData({
                                    ...formData,
                                    dueDate: date ? date.toISOString().split("T")[0] : "",
                                })
                            }
                            fullWidth
                        />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                اعلان‌ها
                            </Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <InputLabel>داشبورد</InputLabel>
                                    <Select
                                        value={formData.notifications.dashboard ? "true" : "false"}
                                        label="داشبورد"
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                notifications: {
                                                    ...formData.notifications,
                                                    dashboard: e.target.value === "true",
                                                },
                                            })
                                        }
                                    >
                                        <MenuItem value="true">فعال</MenuItem>
                                        <MenuItem value="false">غیرفعال</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <InputLabel>ایمیل</InputLabel>
                                    <Select
                                        value={formData.notifications.email ? "true" : "false"}
                                        label="ایمیل"
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                notifications: {
                                                    ...formData.notifications,
                                                    email: e.target.value === "true",
                                                },
                                            })
                                        }
                                    >
                                        <MenuItem value="true">فعال</MenuItem>
                                        <MenuItem value="false">غیرفعال</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <InputLabel>SMS</InputLabel>
                                    <Select
                                        value={formData.notifications.sms ? "true" : "false"}
                                        label="SMS"
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                notifications: {
                                                    ...formData.notifications,
                                                    sms: e.target.value === "true",
                                                },
                                            })
                                        }
                                    >
                                        <MenuItem value="true">فعال</MenuItem>
                                        <MenuItem value="false">غیرفعال</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? "در حال ذخیره..." : "ذخیره"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
