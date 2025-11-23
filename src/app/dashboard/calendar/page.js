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
    Grid,
    Card,
    CardContent,
} from "@mui/material";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import {
    Add,
    Event,
    LocationOn,
    Person,
    CheckCircle,
    Cancel,
    Schedule,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, getPersianValue } from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";

const TYPE_COLORS = {
    meeting: "primary",
    event: "info",
    reminder: "warning",
    deadline: "error",
    holiday: "success",
    other: "default",
};

const TYPE_LABELS = {
    meeting: "جلسه",
    event: "رویداد",
    reminder: "یادآوری",
    deadline: "مهلت",
    holiday: "تعطیل",
    other: "سایر",
};

export default function CalendarPage() {
    const [editingEvent, setEditingEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
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
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, typeFilter, page, limit]);

    const endpoint = `/calendar?${queryParams}`;
    const { useFetchData } = useApi();

    // Fetch events
    const {
        data: eventsData,
        isLoading,
        refetch,
    } = useFetchData(["calendar", queryParams], endpoint);

    // Fetch upcoming events
    const { data: upcomingEventsData } = useFetchData("calendar-upcoming", "/calendar/upcoming?limit=5");

    // Fetch statistics
    const { data: statisticsData } = useFetchData("calendar-statistics", "/calendar/statistics");

    useEffect(() => {
        if (statisticsData?.success && statisticsData.data) {
            setStatistics(statisticsData.data);
        }
    }, [statisticsData]);
    
    useEffect(() => {
        if (upcomingEventsData?.success && upcomingEventsData.data) {
            setUpcomingEvents(upcomingEventsData.data || []);
        }
    }, [upcomingEventsData]);

    const events = eventsData?.data || [];
    const pagination = eventsData?.pagination || {};

    const handleAdd = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleDelete = (event) => {
        setEventToDelete(event);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!eventToDelete) return;

        try {
            await api.delete(`/calendar/${eventToDelete._id}`);
            toast.success("رویداد با موفقیت حذف شد");
            setIsDeleteDialogOpen(false);
            setEventToDelete(null);
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || "خطا در حذف رویداد");
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingEvent) {
                await api.put(`/calendar/${editingEvent._id}`, formData);
                toast.success("رویداد با موفقیت به‌روزرسانی شد");
            } else {
                await api.post("/calendar", formData);
                toast.success("رویداد با موفقیت ایجاد شد");
            }
            setIsModalOpen(false);
            setEditingEvent(null);
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || "خطا در ذخیره رویداد");
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
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.title}
                    </Typography>
                    {row.description && (
                        <Typography variant="caption" color="textSecondary" noWrap>
                            {row.description}
                        </Typography>
                    )}
                </Box>
            ),
            align: "left"
        },
        {
            field: "type",
            headerName: "نوع",
            width: 120,
            render: (row) => (
                <Chip
                    label={TYPE_LABELS[row.type] || row.type}
                    color={TYPE_COLORS[row.type] || "default"}
                    size="small"
                />
            ),
            align: "center"
        },
        {
            field: "startDate",
            headerName: "تاریخ شروع",
            width: 180,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="body2">
                        {formatDate(row.startDate)}
                    </Typography>
                </Box>
            ),
            align: "center"
        },
        {
            field: "endDate",
            headerName: "تاریخ پایان",
            width: 180,
            render: (row) => (
                <Typography variant="body2">
                    {row.endDate ? formatDate(row.endDate) : "-"}
                </Typography>
            ),
            align: "center"
        },
        {
            field: "location",
            headerName: "مکان",
            width: 150,
            render: (row) => (
                row.location ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" noWrap>
                            {row.location}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="body2" color="textSecondary">-</Typography>
                )
            ),
            align: "center"
        },
        {
            field: "organizer",
            headerName: "سازنده",
            width: 150,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                        {row.organizer?.name?.charAt(0) || "?"}
                    </Avatar>
                    <Typography variant="body2">
                        {row.organizer?.name || "-"}
                    </Typography>
                </Box>
            ),
            align: "left"
        },
    ];

    const filters = [
        {
            name: "type",
            label: "نوع",
            value: typeFilter,
            onChange: (e) => {
                setTypeFilter(e.target.value);
                setPage(1);
            },
            options: [
                { value: "all", label: "همه" },
                { value: "meeting", label: "جلسه" },
                { value: "event", label: "رویداد" },
                { value: "reminder", label: "یادآوری" },
                { value: "deadline", label: "مهلت" },
                { value: "holiday", label: "تعطیل" },
                { value: "other", label: "سایر" },
            ],
        },
    ];

    return (
        <Layout>
            <Box>
                {/* Statistics Cards */}
                {statistics && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        کل رویدادها
                                    </Typography>
                                    <Typography variant="h4">{statistics.total || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        رویدادهای آینده
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {statistics.upcoming || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        رویدادهای گذشته
                                    </Typography>
                                    <Typography variant="h4" color="text.secondary">
                                        {statistics.past || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        جلسات
                                    </Typography>
                                    <Typography variant="h4" color="primary.main">
                                        {statistics.byType?.meeting || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            رویدادهای پیش‌رو
                        </Typography>
                        <Grid container spacing={2}>
                            {upcomingEvents.map((event) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event._id}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {event.title}
                                                </Typography>
                                                <Chip
                                                    label={TYPE_LABELS[event.type]}
                                                    color={TYPE_COLORS[event.type]}
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                {formatDate(event.startDate)}
                                            </Typography>
                                            {event.location && (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                                                    <LocationOn fontSize="small" color="action" />
                                                    <Typography variant="caption" color="textSecondary">
                                                        {event.location}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
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
                        تقویم اجرایی
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAdd}
                        size="large"
                    >
                        رویداد جدید
                    </Button>
                </Box>

                <DataTable
                    title="لیست رویدادها"
                    data={events}
                    columns={columns}
                    loading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    searchPlaceholder="جستجو در رویدادها (حداقل 2 کاراکتر)..."
                    enableSelection={false}
                    filters={filters}
                    canView={false}
                    canEdit={true}
                    canDelete={true}
                    canCreate={true}
                    emptyStateProps={{
                        title: "رویدادی یافت نشد",
                        description:
                            "هنوز رویدادی ایجاد نشده است. اولین رویداد خود را ایجاد کنید!",
                        action: {
                            label: "ایجاد رویداد جدید",
                            onClick: handleAdd,
                        },
                    }}
                />

                {/* Event Form Modal */}
                <EventFormModal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingEvent(null);
                    }}
                    onSave={handleSave}
                    event={editingEvent}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                >
                    <DialogTitle>تایید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف رویداد <strong>{eventToDelete?.title}</strong> اطمینان
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

// Event Form Modal Component
function EventFormModal({ open, onClose, onSave, event }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        isAllDay: false,
        location: "",
        type: "event",
        color: "#1976d2",
        attendees: [],
        reminders: [],
        tags: [],
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { useFetchData: useFetchDataModal } = useApi();

    // Fetch users for attendees dropdown
    const { data: usersData } = useFetchDataModal("calendar-form-users", "/users?limit=100", {
        enabled: open,
    });

    useEffect(() => {
        if (usersData?.success && usersData.data) {
            setUsers(usersData.data);
        }
    }, [usersData]);

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || "",
                description: event.description || "",
                startDate: event.startDate
                    ? new Date(event.startDate).toISOString().slice(0, 16)
                    : "",
                endDate: event.endDate
                    ? new Date(event.endDate).toISOString().slice(0, 16)
                    : "",
                isAllDay: event.isAllDay || false,
                location: event.location || "",
                type: event.type || "event",
                color: event.color || "#1976d2",
                attendees: event.attendees?.map(a => a.user?._id || a.user) || [],
                reminders: event.reminders || [],
                tags: event.tags || [],
            });
        } else {
            setFormData({
                title: "",
                description: "",
                startDate: "",
                endDate: "",
                isAllDay: false,
                location: "",
                type: "event",
                color: "#1976d2",
                attendees: [],
                reminders: [],
                tags: [],
            });
        }
    }, [event, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate) : undefined,
                endDate: formData.endDate ? new Date(formData.endDate) : undefined,
            };
            await onSave(submitData);
        } catch (error) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={event ? "ویرایش رویداد" : "رویداد جدید"}
            maxWidth="md"
        >
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

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <PersianDatePicker
                                label="تاریخ شروع"
                                value={formData.startDate ? new Date(formData.startDate) : null}
                                onChange={(date) =>
                                    setFormData({
                                        ...formData,
                                        startDate: date ? date.toISOString() : "",
                                    })
                                }
                                required
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <PersianDatePicker
                                label="تاریخ پایان"
                                value={formData.endDate ? new Date(formData.endDate) : null}
                                onChange={(date) =>
                                    setFormData({
                                        ...formData,
                                        endDate: date ? date.toISOString() : "",
                                    })
                                }
                                fullWidth
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        label="مکان"
                        value={formData.location}
                        onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                        }
                        fullWidth
                    />

                    <FormControl fullWidth>
                        <InputLabel>نوع</InputLabel>
                        <Select
                            value={formData.type}
                            onChange={(e) =>
                                setFormData({ ...formData, type: e.target.value })
                            }
                            label="نوع"
                        >
                            <MenuItem value="meeting">جلسه</MenuItem>
                            <MenuItem value="event">رویداد</MenuItem>
                            <MenuItem value="reminder">یادآوری</MenuItem>
                            <MenuItem value="deadline">مهلت</MenuItem>
                            <MenuItem value="holiday">تعطیل</MenuItem>
                            <MenuItem value="other">سایر</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>شرکت‌کنندگان</InputLabel>
                        <Select
                            multiple
                            value={formData.attendees}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    attendees: e.target.value,
                                })
                            }
                            label="شرکت‌کنندگان"
                            renderValue={(selected) =>
                                selected
                                    .map(
                                        (id) =>
                                            users.find((u) => u._id === id)?.name || id
                                    )
                                    .join(", ")
                            }
                        >
                            {users.map((user) => (
                                <MenuItem key={user._id} value={user._id}>
                                    {user.name} ({user.email})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={onClose}>انصراف</Button>
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? "در حال ذخیره..." : "ذخیره"}
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Modal>
    );
}

