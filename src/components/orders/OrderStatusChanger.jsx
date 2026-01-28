"use client";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    CircularProgress,
} from "@mui/material";
import { Close, Save } from "@mui/icons-material";
import toast from "react-hot-toast";

export default function OrderStatusChanger({ open, onClose, order, onUpdate }) {
    const [status, setStatus] = useState("pending");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update status when order changes
    useEffect(() => {
        if (order?.status) {
            setStatus(order.status);
        }
        // Reset note when modal opens/closes
        if (!open) {
            setNote("");
        }
    }, [order, open]);

    // Valid status transitions based on backend validation
    const getValidStatusTransitions = (currentStatus) => {
        const validTransitions = {
            'pending': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'cancelled'],
            'delivered': ['refunded'],
            'cancelled': [],
            'refunded': []
        };
        return validTransitions[currentStatus] || [];
    };

    const allStatusOptions = [
        { value: "pending", label: "در انتظار پرداخت" },
        { value: "processing", label: "در حال پردازش" },
        { value: "shipped", label: "ارسال شده" },
        { value: "delivered", label: "تحویل داده شده" },
        { value: "cancelled", label: "لغو شده" },
        { value: "refunded", label: "بازگشت وجه" },
    ];

    // Filter status options based on current status
    const statusOptions = order?.status 
        ? allStatusOptions.filter(option => {
            const validTransitions = getValidStatusTransitions(order.status);
            // Always show current status and valid transitions
            return option.value === order.status || validTransitions.includes(option.value);
        })
        : allStatusOptions;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!order?._id) {
            toast.error("سفارش معتبر نیست");
            return;
        }

        // Validate status transition
        const validTransitions = getValidStatusTransitions(order.status);
        if (status !== order.status && !validTransitions.includes(status)) {
            toast.error(`نمی‌توان وضعیت را از "${allStatusOptions.find(o => o.value === order.status)?.label}" به "${allStatusOptions.find(o => o.value === status)?.label}" تغییر داد`);
            return;
        }

        if (status === order.status) {
            toast.info("وضعیت سفارش تغییر نکرده است");
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(order._id, status, note);
            toast.success("وضعیت سفارش با موفقیت به‌روزرسانی شد");
        } catch (error) {
            // Error is handled by parent component
            if (!error.response) {
                toast.error("خطا در به‌روزرسانی وضعیت");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" fontWeight="bold">
                            تغییر وضعیت سفارش {order.orderNumber}
                        </Typography>
                        <Button onClick={onClose} size="small">
                            <Close />
                        </Button>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>وضعیت جدید</InputLabel>
                            <Select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                label="وضعیت جدید"
                            >
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="یادداشت (اختیاری)"
                            multiline
                            rows={4}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="یادداشت مربوط به تغییر وضعیت..."
                        />

                        <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1 }}>
                            <Typography variant="body2" color="info.contrastText">
                                <strong>وضعیت فعلی:</strong> {statusOptions.find((o) => o.value === order.status)?.label}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        انصراف
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting || status === order.status}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
                    >
                        {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

