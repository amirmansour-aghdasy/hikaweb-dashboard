"use client";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Divider,
    Grid,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
} from "@mui/material";
import {
    Person,
    Email,
    Phone,
    LocationOn,
    ShoppingCart,
    AttachMoney,
    CalendarToday,
    LocalShipping,
    Payment,
    Close,
} from "@mui/icons-material";
import { formatDate, formatPrice, formatNumber } from "@/lib/utils";
import Image from "next/image";

export default function OrderDetailsModal({ open, onClose, order }) {
    if (!order) return null;

    const getStatusColor = (status) => {
        const colors = {
            pending: "warning",
            processing: "info",
            shipped: "primary",
            delivered: "success",
            cancelled: "error",
            refunded: "default",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: "در انتظار پرداخت",
            processing: "در حال پردازش",
            shipped: "ارسال شده",
            delivered: "تحویل داده شده",
            cancelled: "لغو شده",
            refunded: "بازگشت وجه",
        };
        return labels[status] || status;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">
                        جزئیات سفارش {order.orderNumber}
                    </Typography>
                    <Button onClick={onClose} size="small">
                        <Close />
                    </Button>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Customer Information */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                اطلاعات مشتری
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Person color="action" />
                                    <Typography variant="body2">
                                        <strong>نام:</strong> {order.contactInfo?.fullName || order.user?.name || "نامشخص"}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Email color="action" />
                                    <Typography variant="body2">
                                        <strong>ایمیل:</strong> {order.contactInfo?.email || order.user?.email || "نامشخص"}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Phone color="action" />
                                    <Typography variant="body2">
                                        <strong>موبایل:</strong> {order.contactInfo?.phoneNumber || order.user?.phoneNumber || "نامشخص"}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Order Information */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                اطلاعات سفارش
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <CalendarToday color="action" />
                                    <Typography variant="body2">
                                        <strong>تاریخ:</strong> {formatDate(order.createdAt)}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <ShoppingCart color="action" />
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2">
                                            <strong>وضعیت:</strong>
                                        </Typography>
                                        <Chip
                                            label={getStatusLabel(order.status)}
                                            color={getStatusColor(order.status)}
                                            size="small"
                                        />
                                    </Stack>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Payment color="action" />
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2">
                                            <strong>پرداخت:</strong>
                                        </Typography>
                                        <Chip
                                            label={order.payment?.status === "completed" ? "پرداخت شده" : "در انتظار"}
                                            color={order.payment?.status === "completed" ? "success" : "warning"}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <AttachMoney color="action" />
                                    <Typography variant="body2">
                                        <strong>مبلغ کل:</strong> {formatPrice(order.totals?.total || 0)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Shipping Address */}
                    {order.shipping?.address && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    آدرس ارسال
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1.5}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <LocationOn color="action" />
                                        <Typography variant="body2">
                                            {order.shipping.address.address}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {order.shipping.address.city}، {order.shipping.address.province}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        کد پستی: {order.shipping.address.postalCode}
                                    </Typography>
                                    {order.shipping.trackingNumber && (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <LocalShipping color="action" />
                                            <Typography variant="body2">
                                                <strong>کد رهگیری:</strong> {order.shipping.trackingNumber}
                                            </Typography>
                                        </Stack>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                    )}

                    {/* Order Items */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                محصولات سفارش
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>محصول</TableCell>
                                            <TableCell align="center">تعداد</TableCell>
                                            <TableCell align="center">قیمت واحد</TableCell>
                                            <TableCell align="center">جمع</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {order.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        {item.product?.featuredImage && (
                                                            <Image
                                                                src={item.product.featuredImage}
                                                                alt={item.product.name?.fa || item.product.name || ""}
                                                                width={50}
                                                                height={50}
                                                                style={{ borderRadius: 8 }}
                                                                unoptimized={item.product.featuredImage?.includes('picsum.photos')}
                                                            />
                                                        )}
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {item.product?.name?.fa || item.product?.name || "محصول"}
                                                            </Typography>
                                                            {item.product?.sku && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    SKU: {item.product.sku}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {formatNumber(item.quantity)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {formatPrice(item.price)}
                                                </TableCell>
                                                <TableCell align="center" fontWeight="bold">
                                                    {formatPrice(item.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    {/* Order Totals */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                خلاصه مالی
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">جمع جزء:</Typography>
                                    <Typography variant="body2">{formatPrice(order.totals?.subtotal || 0)}</Typography>
                                </Stack>
                                {order.totals?.discount > 0 && (
                                    <Stack direction="row" justifyContent="space-between" color="success.main">
                                        <Typography variant="body2">تخفیف:</Typography>
                                        <Typography variant="body2">-{formatPrice(order.totals.discount)}</Typography>
                                    </Stack>
                                )}
                                {order.totals?.shipping > 0 && (
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2">هزینه ارسال:</Typography>
                                        <Typography variant="body2">{formatPrice(order.totals.shipping)}</Typography>
                                    </Stack>
                                )}
                                {order.totals?.tax > 0 && (
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2">مالیات:</Typography>
                                        <Typography variant="body2">{formatPrice(order.totals.tax)}</Typography>
                                    </Stack>
                                )}
                                <Divider />
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight="bold">
                                        مجموع نهایی:
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                        {formatPrice(order.totals?.total || 0)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Status History */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    تاریخچه تغییرات
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={0}>
                                    {order.statusHistory.map((history, index) => (
                                        <Box key={index} sx={{ position: 'relative', pl: 4 }}>
                                            {/* Timeline line */}
                                            {index < order.statusHistory.length - 1 && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        left: 12,
                                                        top: 32,
                                                        bottom: -16,
                                                        width: 2,
                                                        bgcolor: 'divider',
                                                    }}
                                                />
                                            )}
                                            {/* Timeline dot */}
                                            <Avatar
                                                sx={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 4,
                                                    width: 24,
                                                    height: 24,
                                                    bgcolor: (theme) => {
                                                        const colorMap = {
                                                            warning: theme.palette.warning.main,
                                                            info: theme.palette.info.main,
                                                            primary: theme.palette.primary.main,
                                                            success: theme.palette.success.main,
                                                            error: theme.palette.error.main,
                                                            default: theme.palette.grey[500],
                                                        };
                                                        return colorMap[getStatusColor(history.status)] || colorMap.default;
                                                    },
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        bgcolor: 'white',
                                                    }}
                                                />
                                            </Avatar>
                                            {/* Timeline content */}
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {getStatusLabel(history.status)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(history.changedAt)}
                                                </Typography>
                                                {history.note && (
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                        {history.note}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    بستن
                </Button>
            </DialogActions>
        </Dialog>
    );
}

