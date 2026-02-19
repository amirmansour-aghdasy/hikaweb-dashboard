"use client";
import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
} from "@mui/material";
import { Email, MarkEmailUnread } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";

export default function EmailInboxPage() {
    const [accountId, setAccountId] = useState("");
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [viewUid, setViewUid] = useState(null);
    const [messageDetail, setMessageDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const { useFetchData } = useApi();
    const { data: accountsData } = useFetchData("email-accounts", "/email-accounts");
    const accounts = (accountsData?.data?.items ?? []).filter(
        (a) => a.imapHost && String(a.imapHost).trim() !== ""
    );

    const inboxQuery = useMemo(() => {
        if (!accountId) return null;
        const params = new URLSearchParams();
        params.append("page", (page + 1).toString());
        params.append("limit", limit.toString());
        return `/email-accounts/${accountId}/inbox?${params.toString()}`;
    }, [accountId, page, limit]);

    const { data: inboxData, isLoading } = useFetchData(
        ["email-inbox", accountId, page, limit],
        inboxQuery,
        { enabled: !!accountId, retry: 0 }
    );

    const items = inboxData?.data?.items ?? [];
    const total = inboxData?.data?.total ?? 0;

    const openMessage = async (uid) => {
        setViewUid(uid);
        setMessageDetail(null);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/email-accounts/${accountId}/inbox/${uid}`);
            setMessageDetail(res.data?.data ?? null);
        } catch (e) {
            setMessageDetail(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    return (
        <Layout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    صندوق ورودی
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    مشاهده ایمیل‌های دریافتی (حساب باید IMAP داشته باشد)
                </Typography>
                {accounts.length === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        هیچ حسابی با IMAP تنظیم نشده. در «حساب‌های ایمیل» برای حساب موردنظر فیلد «سرور IMAP» را پر کنید.
                    </Alert>
                )}
                <FormControl size="small" sx={{ minWidth: 280, mb: 2 }}>
                    <InputLabel>حساب ایمیل</InputLabel>
                    <Select
                        value={accountId}
                        onChange={(e) => { setAccountId(e.target.value); setPage(0); }}
                        label="حساب ایمیل"
                    >
                        {accounts.map((acc) => (
                            <MenuItem key={acc._id} value={acc._id}>
                                {acc.displayName || acc.address}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>از</TableCell>
                                <TableCell>موضوع</TableCell>
                                <TableCell>تاریخ</TableCell>
                                <TableCell width={48} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!accountId ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }} color="text.secondary">
                                        یک حساب را انتخاب کنید.
                                    </TableCell>
                                </TableRow>
                            ) : isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }} color="text.secondary">
                                        پیامی در صندوق ورودی نیست.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow
                                        key={item.uid}
                                        hover
                                        onClick={() => openMessage(item.uid)}
                                        sx={{
                                            cursor: "pointer",
                                            bgcolor: item.seen ? "transparent" : "action.hover",
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                {!item.seen && <MarkEmailUnread fontSize="small" color="primary" />}
                                                {item.fromName || item.from}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 360 }} noWrap>
                                            {item.subject}
                                        </TableCell>
                                        <TableCell>
                                            {item.date ? formatDate(item.date) : "—"}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {accountId && total > 0 && (
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={limit}
                            onRowsPerPageChange={(e) => {
                                setLimit(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 20, 50]}
                            labelRowsPerPage="در هر صفحه:"
                        />
                    )}
                </TableContainer>
            </Box>

            <Dialog
                open={viewUid != null}
                onClose={() => { setViewUid(null); setMessageDetail(null); }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {messageDetail?.envelope?.subject ?? "در حال بارگذاری..."}
                </DialogTitle>
                <DialogContent dividers>
                    {loadingDetail && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {!loadingDetail && messageDetail && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                از: {messageDetail.envelope?.fromName || messageDetail.envelope?.from} &lt;{messageDetail.envelope?.from}&gt;
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                تاریخ: {messageDetail.envelope?.date ? formatDate(messageDetail.envelope.date) : "—"}
                            </Typography>
                            {messageDetail.html ? (
                                <Box
                                    component="div"
                                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2, overflow: "auto", maxHeight: 480 }}
                                    dangerouslySetInnerHTML={{ __html: messageDetail.html }}
                                />
                            ) : (
                                <Typography component="pre" variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                                    {messageDetail.text || "(بدون متن)"}
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setViewUid(null); setMessageDetail(null); }}>
                        بستن
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
