"use client";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Stack,
    Switch,
    FormControlLabel,
    Typography,
    Box,
    Divider,
} from "@mui/material";
import { Save, Close } from "@mui/icons-material";
import { Controller, useForm } from "react-hook-form";
import { formatDate } from "@/lib/utils";

export default function CouponForm({ open, onClose, coupon = null, onSave }) {
    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            code: "",
            type: "percentage",
            value: 0,
            limits: {
                minOrderAmount: 0,
                maxDiscountAmount: null,
                maxUsage: null,
                maxUsagePerUser: null,
            },
            validFrom: new Date().toISOString().split("T")[0],
            validUntil: "",
            applicableTo: {
                allProducts: true,
                products: [],
                categories: [],
            },
            excludedFrom: {
                products: [],
                categories: [],
            },
            restrictions: {
                users: [],
                newUsersOnly: false,
                minUserLevel: 0,
            },
            description: {
                fa: "",
                en: "",
            },
            isActive: true,
        },
    });

    const couponType = watch("type");

    useEffect(() => {
        if (coupon) {
            reset({
                code: coupon.code || "",
                type: coupon.type || "percentage",
                value: coupon.value || 0,
                limits: {
                    minOrderAmount: coupon.limits?.minOrderAmount || 0,
                    maxDiscountAmount: coupon.limits?.maxDiscountAmount || null,
                    maxUsage: coupon.limits?.maxUsage || null,
                    maxUsagePerUser: coupon.limits?.maxUsagePerUser || null,
                },
                validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split("T")[0] : "",
                applicableTo: {
                    allProducts: coupon.applicableTo?.allProducts !== false,
                    products: coupon.applicableTo?.products || [],
                    categories: coupon.applicableTo?.categories || [],
                },
                excludedFrom: {
                    products: coupon.excludedFrom?.products || [],
                    categories: coupon.excludedFrom?.categories || [],
                },
                restrictions: {
                    users: coupon.restrictions?.users || [],
                    newUsersOnly: coupon.restrictions?.newUsersOnly || false,
                    minUserLevel: coupon.restrictions?.minUserLevel || 0,
                },
                description: {
                    fa: coupon.description?.fa || "",
                    en: coupon.description?.en || "",
                },
                isActive: coupon.isActive !== false,
            });
        } else {
            reset();
        }
    }, [coupon, reset]);

    const onSubmit = (data) => {
        // Convert date strings to Date objects
        const submitData = {
            ...data,
            validFrom: new Date(data.validFrom),
            validUntil: new Date(data.validUntil),
            value: parseFloat(data.value),
            limits: {
                ...data.limits,
                minOrderAmount: parseFloat(data.limits.minOrderAmount) || 0,
                maxDiscountAmount: data.limits.maxDiscountAmount ? parseFloat(data.limits.maxDiscountAmount) : null,
                maxUsage: data.limits.maxUsage ? parseInt(data.limits.maxUsage) : null,
                maxUsagePerUser: data.limits.maxUsagePerUser ? parseInt(data.limits.maxUsagePerUser) : null,
            },
        };
        onSave(submitData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    {coupon ? "ویرایش کد تخفیف" : "ایجاد کد تخفیف جدید"}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {/* Basic Info */}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="code"
                                    control={control}
                                    rules={{ required: "کد تخفیف الزامی است" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="کد تخفیف"
                                            fullWidth
                                            required
                                            error={!!errors.code}
                                            helperText={errors.code?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>نوع تخفیف</InputLabel>
                                            <Select {...field} label="نوع تخفیف">
                                                <MenuItem value="percentage">درصدی</MenuItem>
                                                <MenuItem value="fixed">مبلغ ثابت</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="value"
                                    control={control}
                                    rules={{
                                        required: "مقدار تخفیف الزامی است",
                                        min: { value: 0, message: "مقدار نمی‌تواند منفی باشد" },
                                        max: couponType === "percentage" ? { value: 100, message: "درصد نمی‌تواند بیش از 100 باشد" } : undefined,
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            label={couponType === "percentage" ? "درصد تخفیف" : "مبلغ تخفیف"}
                                            fullWidth
                                            required
                                            error={!!errors.value}
                                            helperText={errors.value?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch {...field} checked={field.value} />}
                                            label="فعال"
                                            sx={{ mt: 2 }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Validity Period */}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="validFrom"
                                    control={control}
                                    rules={{ required: "تاریخ شروع الزامی است" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            label="تاریخ شروع"
                                            fullWidth
                                            required
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.validFrom}
                                            helperText={errors.validFrom?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="validUntil"
                                    control={control}
                                    rules={{ required: "تاریخ انقضا الزامی است" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            label="تاریخ انقضا"
                                            fullWidth
                                            required
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.validUntil}
                                            helperText={errors.validUntil?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Limits */}
                        <Typography variant="h6" fontWeight="bold">
                            محدودیت‌ها
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="limits.minOrderAmount"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            label="حداقل مبلغ سفارش"
                                            fullWidth
                                            value={field.value || 0}
                                        />
                                    )}
                                />
                            </Grid>
                            {couponType === "percentage" && (
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="limits.maxDiscountAmount"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                label="حداکثر مبلغ تخفیف"
                                                fullWidth
                                                value={field.value || ""}
                                            />
                                        )}
                                    />
                                </Grid>
                            )}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="limits.maxUsage"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            label="حداکثر تعداد استفاده (خالی = نامحدود)"
                                            fullWidth
                                            value={field.value || ""}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="limits.maxUsagePerUser"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            label="حداکثر استفاده برای هر کاربر (خالی = نامحدود)"
                                            fullWidth
                                            value={field.value || ""}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Description */}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="description.fa"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="توضیحات (فارسی)"
                                            fullWidth
                                            multiline
                                            rows={3}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="description.en"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="توضیحات (انگلیسی)"
                                            fullWidth
                                            multiline
                                            rows={3}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} startIcon={<Close />}>
                        انصراف
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<Save />}>
                        {coupon ? "ذخیره تغییرات" : "ایجاد کد تخفیف"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

