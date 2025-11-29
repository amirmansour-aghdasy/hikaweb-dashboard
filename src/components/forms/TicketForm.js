"use client";
import {
    Box,
    TextField,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Chip,
    Card,
    CardContent,
    Divider,
    Avatar,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import { Save, Cancel, SupportAgent, Person, Flag, Assignment, Reply, Send, AttachFile, ExpandMore, Schedule, History } from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import MediaUploader from "../media/MediaUploader";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { formatDate, formatRelativeDate } from "../../lib/utils";
import toast from "react-hot-toast";

const PRIORITY_OPTIONS = [
    { value: "low", label: "کم", color: "success" },
    { value: "normal", label: "عادی", color: "info" },
    { value: "high", label: "بالا", color: "warning" },
    { value: "urgent", label: "فوری", color: "error" },
];

const STATUS_OPTIONS = [
    { value: "open", label: "باز" },
    { value: "in_progress", label: "در حال بررسی" },
    { value: "waiting_customer", label: "انتظار پاسخ مشتری" },
    { value: "resolved", label: "حل شده" },
    { value: "closed", label: "بسته" },
];

const CATEGORY_OPTIONS = [
    { value: "technical", label: "فنی" },
    { value: "billing", label: "مالی" },
    { value: "general", label: "عمومی" },
    { value: "feature_request", label: "درخواست ویژگی" },
    { value: "bug_report", label: "گزارش خطا" },
];

export default function TicketForm({ ticket, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [responseMode, setResponseMode] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { useCreateData, useUpdateData, useFetchData } = useApi();

    const createTicket = useCreateData("/tickets", {
        queryKey: "tickets"
    });
    const updateTicket = useUpdateData("/tickets", {
        queryKey: "tickets"
    });
    // Note: Backend uses /tickets/:id/messages, not /tickets/responses
    // We'll handle this in onSubmit function

    // Fetch users for assignment - backend supports comma-separated roles
    const usersEndpoint = useMemo(() => {
        const params = new URLSearchParams();
        params.append("role", "admin,support");
        return `/users?${params.toString()}`;
    }, []);
    const { data: usersData } = useFetchData("support-users", usersEndpoint);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            subject: "",
            description: "",
            priority: "normal",
            category: "general",
            status: "open",
            assignee: "",
            customerName: "",
            customerEmail: "",
            customerPhone: "",
            attachments: [],
            internalNotes: "",
            tags: [],
            estimatedTime: "",
            // For response mode
            responseText: "",
            responseType: "public", // public, private, internal
            responseAttachments: [],
        },
    });

    const {
        fields: attachmentsFields,
        append: appendAttachment,
        remove: removeAttachment,
    } = useFieldArray({
        control,
        name: "attachments",
    });

    useEffect(() => {
        if (ticket) {
            setResponseMode(true);
            reset({
                subject: ticket.subject || "",
                description: ticket.description || "",
                priority: ticket.priority || "normal",
                category: ticket.category || "general",
                status: ticket.ticketStatus || ticket.status || "open",
                assignee: (ticket.assignedTo?._id || ticket.assignee?._id || ticket.assignedTo || ticket.assignee) || "",
                customerName: ticket.customer?.name || "",
                customerEmail: ticket.customer?.email || "",
                customerPhone: ticket.customer?.phone || "",
                attachments: ticket.attachments || [],
                internalNotes: ticket.internalNotes || "",
                tags: ticket.tags || [],
                estimatedTime: ticket.estimatedTime || "",
                responseText: "",
                responseType: "public",
                responseAttachments: [],
            });
        }
    }, [ticket, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            if (responseMode && ticket) {
                // Create response using correct endpoint: /tickets/:id/messages
                if (data.responseText.trim()) {
                    await api.post(`/tickets/${ticket._id}/messages`, {
                        content: data.responseText,
                        isInternal: data.responseType === "internal" || data.responseType === "private",
                    });
                    // Invalidate tickets queries after adding message
                    queryClient.invalidateQueries({ 
                        queryKey: ["tickets"],
                        exact: false 
                    });
                    queryClient.invalidateQueries({ 
                        queryKey: ["tickets-statistics"],
                        exact: false 
                    });
                }

                // Update ticket if status, priority, or assignee changed
                const updateData = {};
                if (data.status && data.status !== (ticket.ticketStatus || ticket.status)) {
                    updateData.ticketStatus = data.status;
                }
                if (data.priority && data.priority !== ticket.priority) {
                    updateData.priority = data.priority;
                }
                if (data.assignee !== (ticket.assignedTo?._id || ticket.assignedTo)) {
                    updateData.assignedTo = data.assignee || null;
                }
                if (data.internalNotes !== undefined) {
                    updateData.internalNotes = data.internalNotes;
                }

                // Only update if there are changes
                if (Object.keys(updateData).length > 0) {
                    await updateTicket.mutateAsync({
                        id: ticket._id,
                        data: updateData,
                    });
                }

                toast.success("پاسخ ارسال شد و تیکت به‌روزرسانی شد");
            } else {
                // Create new ticket
                const ticketData = {
                    subject: data.subject,
                    description: data.description,
                    priority: data.priority,
                    department: data.category, // Backend uses 'department' not 'category'
                    ticketStatus: data.status,
                    assignedTo: data.assignee || null,
                    attachments: data.attachments || [],
                    tags: data.tags || [],
                };

                await createTicket.mutateAsync(ticketData);
                toast.success("تیکت جدید ایجاد شد");
            }

            onSave();
        } catch (error) {
            console.error("Error saving ticket:", error);
            toast.error("خطا در ذخیره تیکت");
        } finally {
            setLoading(false);
        }
    };

    const handleAttachmentsUpload = (files) => {
        setValue("attachments", [...watch("attachments"), ...files]);
    };

    const handleResponseAttachmentsUpload = (files) => {
        setValue("responseAttachments", [...watch("responseAttachments"), ...files]);
    };

    // Ticket History Component
    const TicketHistory = ({ ticket }) => {
        if (!ticket?.responses) return null;

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <History /> تاریخچه تیکت
                    </Typography>

                    <Stack spacing={2}>
                        {ticket.responses.map((response, index) => (
                            <Card key={index} variant="outlined">
                                <CardContent sx={{ py: 2 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Avatar src={response.author?.avatar} sx={{ width: 24, height: 24 }}>
                                                {response.author?.name?.charAt(0)}
                                            </Avatar>
                                            <Typography variant="subtitle2">{response.author?.name}</Typography>
                                            <Chip label={response.type === "public" ? "عمومی" : "داخلی"} size="small" color={response.type === "public" ? "primary" : "secondary"} />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatRelativeDate(response.createdAt)}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2">{response.message}</Typography>

                                    {response.attachments?.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Stack direction="row" spacing={1}>
                                                {response.attachments.map((file, fileIndex) => (
                                                    <Chip key={fileIndex} label={file.name} size="small" variant="outlined" icon={<AttachFile />} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Ticket Info Header (if editing) */}
            {ticket && (
                <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6">تیکت #{ticket.ticketNumber}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ایجاد شده: {formatDate(ticket.createdAt)}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Chip
                                        label={PRIORITY_OPTIONS.find((p) => p.value === ticket.priority)?.label}
                                        color={PRIORITY_OPTIONS.find((p) => p.value === ticket.priority)?.color}
                                        size="small"
                                    />
                                    <Chip label={STATUS_OPTIONS.find((s) => s.value === (ticket.ticketStatus || ticket.status))?.label} size="small" variant="outlined" />
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Ticket History */}
            {ticket && <TicketHistory ticket={ticket} />}

            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={3}>
                        {/* Response Section (if editing) */}
                        {responseMode && (
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Reply /> پاسخ جدید
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="responseText"
                                                control={control}
                                                rules={{ required: "متن پاسخ الزامی است" }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="متن پاسخ"
                                                        multiline
                                                        rows={4}
                                                        required
                                                        error={!!errors.responseText}
                                                        helperText={errors.responseText?.message}
                                                        fullWidth
                                                        placeholder="پاسخ خود را بنویسید..."
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="responseType"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl fullWidth>
                                                        <InputLabel>نوع پاسخ</InputLabel>
                                                        <Select {...field} label="نوع پاسخ">
                                                            <MenuItem value="public">عمومی (مشتری می‌بیند)</MenuItem>
                                                            <MenuItem value="internal">داخلی (فقط تیم)</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                فایل‌های ضمیمه پاسخ
                                            </Typography>
                                            <Controller
                                                name="responseAttachments"
                                                control={control}
                                                render={({ field }) => (
                                                    <MediaUploader
                                                        value={field.value}
                                                        onChange={handleResponseAttachmentsUpload}
                                                        acceptedTypes={["image/*", "application/pdf", ".doc", ".docx", ".txt"]}
                                                        maxFiles={5}
                                                        maxSizeInMB={10}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}

                        {/* Basic Information */}
                        {!responseMode && (
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <SupportAgent /> اطلاعات تیکت
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="subject"
                                                control={control}
                                                rules={{ required: "موضوع تیکت الزامی است" }}
                                                render={({ field }) => <TextField {...field} label="موضوع تیکت" required error={!!errors.subject} helperText={errors.subject?.message} fullWidth />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Controller
                                                name="description"
                                                control={control}
                                                rules={{ required: "توضیحات الزامی است" }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="توضیحات کامل"
                                                        multiline
                                                        rows={4}
                                                        required
                                                        error={!!errors.description}
                                                        helperText={errors.description?.message}
                                                        fullWidth
                                                        placeholder="مشکل یا درخواست خود را به تفصیل شرح دهید..."
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}

                        {/* Customer Information */}
                        {!responseMode && (
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Person /> اطلاعات مشتری
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="customerName"
                                                control={control}
                                                rules={{ required: "نام مشتری الزامی است" }}
                                                render={({ field }) => (
                                                    <TextField {...field} label="نام مشتری" required error={!!errors.customerName} helperText={errors.customerName?.message} fullWidth />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller
                                                name="customerEmail"
                                                control={control}
                                                rules={{
                                                    required: "ایمیل مشتری الزامی است",
                                                    pattern: {
                                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                        message: "فرمت ایمیل صحیح نیست",
                                                    },
                                                }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        label="ایمیل مشتری"
                                                        type="email"
                                                        required
                                                        error={!!errors.customerEmail}
                                                        helperText={errors.customerEmail?.message}
                                                        fullWidth
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Controller name="customerPhone" control={control} render={({ field }) => <TextField {...field} label="تلفن مشتری" fullWidth />} />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}

                        {/* Internal Notes */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">یادداشت‌های داخلی</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Controller
                                    name="internalNotes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="یادداشت‌های داخلی"
                                            multiline
                                            rows={3}
                                            fullWidth
                                            placeholder="یادداشت‌هایی که فقط تیم پشتیبانی می‌بیند..."
                                            helperText="این یادداشت‌ها برای مشتری قابل مشاهده نیست"
                                        />
                                    )}
                                />
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        {/* Status & Priority */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Flag /> وضعیت و اولویت
                                </Typography>

                                <Stack spacing={2}>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>وضعیت</InputLabel>
                                                <Select {...field} label="وضعیت">
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <MenuItem key={status.value} value={status.value}>
                                                            {status.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        name="priority"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>اولویت</InputLabel>
                                                <Select {...field} label="اولویت">
                                                    {PRIORITY_OPTIONS.map((priority) => (
                                                        <MenuItem key={priority.value} value={priority.value}>
                                                            <Chip label={priority.label} size="small" color={priority.color} sx={{ mr: 1 }} />
                                                            {priority.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        name="category"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>دسته‌بندی</InputLabel>
                                                <Select {...field} label="دسته‌بندی">
                                                    {CATEGORY_OPTIONS.map((category) => (
                                                        <MenuItem key={category.value} value={category.value}>
                                                            {category.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Assignment */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Assignment /> تخصیص
                                </Typography>

                                <Stack spacing={2}>
                                    <Controller
                                        name="assignee"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>مسئول پاسخ</InputLabel>
                                                <Select {...field} label="مسئول پاسخ">
                                                    <MenuItem value="">تخصیص نیافته</MenuItem>
                                                    {(usersData?.data || []).map((user) => (
                                                        <MenuItem key={user._id} value={user._id}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                <Avatar src={user.avatar} sx={{ width: 24, height: 24 }}>
                                                                    {user.name?.charAt(0)}
                                                                </Avatar>
                                                                {user.name}
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        name="estimatedTime"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="زمان تخمینی (ساعت)"
                                                type="number"
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <Schedule sx={{ mr: 1, color: "text.secondary" }} />,
                                                }}
                                            />
                                        )}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Attachments */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <AttachFile /> فایل‌های ضمیمه
                                </Typography>

                                <Controller
                                    name="attachments"
                                    control={control}
                                    render={({ field }) => (
                                        <MediaUploader
                                            value={field.value}
                                            onChange={handleAttachmentsUpload}
                                            acceptedTypes={["image/*", "application/pdf", ".doc", ".docx", ".txt"]}
                                            maxFiles={10}
                                            maxSizeInMB={10}
                                        />
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={onCancel} disabled={loading} startIcon={<Cancel />}>
                    انصراف
                </Button>

                <Button type="submit" variant="contained" disabled={loading} startIcon={responseMode ? <Send /> : <Save />}>
                    {loading ? "در حال ذخیره..." : responseMode ? "ارسال پاسخ" : "ایجاد تیکت"}
                </Button>
            </Box>
        </Box>
    );
}
