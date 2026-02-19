"use client";
import { useState, useRef } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Checkbox,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Email } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import { useApi } from "@/hooks/useApi";
import toast from "react-hot-toast";

const defaultForm = {
    address: "",
    displayName: "",
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    isDefault: false,
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
};

export default function EmailAccountsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const passwordInputRef = useRef(null);

    const { useFetchData, useCreateData, useUpdateData, useDeleteData } = useApi();

    const { data: listData, isLoading, refetch } = useFetchData("email-accounts", "/email-accounts");
    const accounts = listData?.data?.items ?? [];

    const createAccount = useCreateData("/email-accounts", {
        successMessage: "حساب ایمیل اضافه شد.",
        queryKey: "email-accounts",
        onSuccess: () => {
            setDialogOpen(false);
            setForm(defaultForm);
            setEditId(null);
            refetch();
        },
    });

    const updateAccount = useUpdateData("/email-accounts", {
        successMessage: "حساب ایمیل به‌روزرسانی شد.",
        queryKey: "email-accounts",
        onSuccess: () => {
            setDialogOpen(false);
            setForm(defaultForm);
            setEditId(null);
            refetch();
        },
    });

    const deleteAccount = useDeleteData("/email-accounts", {
        successMessage: "حساب ایمیل حذف شد.",
        queryKey: "email-accounts",
        onSuccess: () => {
            setDeleteConfirm(null);
            refetch();
        },
    });

    const openCreate = () => {
        setForm(defaultForm);
        setEditId(null);
        setDialogOpen(true);
    };

    const openEdit = (acc) => {
        setForm({
            address: acc.address || "",
            displayName: acc.displayName || "",
            smtpHost: acc.smtpHost || "",
            smtpPort: acc.smtpPort ?? 587,
            smtpSecure: acc.smtpSecure || false,
            smtpUser: acc.smtpUser || "",
            smtpPassword: "",
            isDefault: acc.isDefault || false,
            imapHost: acc.imapHost || "",
            imapPort: acc.imapPort ?? 993,
            imapSecure: acc.imapSecure !== false,
        });
        setEditId(acc._id);
        setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!form.address || !form.smtpHost || !form.smtpUser) {
            toast.error("آدرس ایمیل، سرور SMTP و نام کاربری را پر کنید.");
            return;
        }
        // در حالت ویرایش مقدار واقعی فیلد رمز را از DOM بخوان (autofill مرورگر در state نمی‌آید)
        const passwordFromInput = editId && passwordInputRef.current
            ? (passwordInputRef.current.value || "").trim()
            : "";
        const effectivePassword = (form.smtpPassword?.trim() || passwordFromInput) || "";
        if (!editId && !effectivePassword) {
            toast.error("رمز عبور SMTP را وارد کنید.");
            return;
        }
        const hasImap = !!(form.imapHost && form.imapHost.trim());
        if (editId && hasImap && !effectivePassword) {
            toast.error("برای استفاده از صندوق ورودی باید رمز عبور را در این فرم وارد کنید.");
            return;
        }
        const payload = { ...form };
        payload.smtpPassword = effectivePassword || undefined;
        if (!payload.smtpPassword) delete payload.smtpPassword;
        if (editId) {
            updateAccount.mutate({ id: editId, data: payload });
        } else {
            createAccount.mutate(payload);
        }
    };

    return (
        <Layout>
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            حساب‌های ایمیل
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            مدیریت حساب‌های ایمیل برای ارسال از داشبورد (مثلاً info@hikaweb.ir)
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                        افزودن حساب
                    </Button>
                </Box>
                <Paper>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>آدرس</TableCell>
                                    <TableCell>نام نمایشی</TableCell>
                                    <TableCell>سرور SMTP</TableCell>
                                    <TableCell>پیش‌فرض</TableCell>
                                    <TableCell align="left">عملیات</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            در حال بارگذاری...
                                        </TableCell>
                                    </TableRow>
                                ) : accounts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }} color="text.secondary">
                                            هنوز حسابی اضافه نشده. برای شروع حساب info@hikaweb.ir را با تنظیمات SMTP اضافه کنید.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    accounts.map((acc) => (
                                        <TableRow key={acc._id}>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <Email fontSize="small" color="action" />
                                                    {acc.address}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{acc.displayName || "—"}</TableCell>
                                            <TableCell>{acc.smtpHost}:{acc.smtpPort}</TableCell>
                                            <TableCell>{acc.isDefault ? "بله" : "—"}</TableCell>
                                            <TableCell align="left">
                                                <Tooltip title="ویرایش">
                                                    <IconButton size="small" onClick={() => openEdit(acc)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="حذف">
                                                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(acc)}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editId ? "ویرایش حساب ایمیل" : "افزودن حساب ایمیل"}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        size="small"
                        label="آدرس ایمیل"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        sx={{ mt: 1, mb: 2 }}
                        placeholder="info@hikaweb.ir"
                        disabled={!!editId}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="نام نمایشی (اختیاری)"
                        value={form.displayName}
                        onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="سرور SMTP"
                        value={form.smtpHost}
                        onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
                        sx={{ mb: 2 }}
                        placeholder="mail.hikaweb.ir"
                    />
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="پورت SMTP"
                        value={form.smtpPort}
                        onChange={(e) => setForm((f) => ({ ...f, smtpPort: parseInt(e.target.value, 10) || 587 }))}
                        sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={form.smtpSecure}
                                onChange={(e) => setForm((f) => ({ ...f, smtpSecure: e.target.checked }))}
                            />
                        }
                        label="اتصال امن (TLS)"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="نام کاربری SMTP"
                        value={form.smtpUser}
                        onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        type="password"
                        inputRef={passwordInputRef}
                        label={editId ? "رمز عبور SMTP (برای صندوق ورودی الزامی است)" : "رمز عبور SMTP"}
                        placeholder={editId && form.imapHost ? "وارد کنید تا صندوق ورودی کار کند" : ""}
                        value={form.smtpPassword}
                        onChange={(e) => setForm((f) => ({ ...f, smtpPassword: e.target.value }))}
                        sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={form.isDefault}
                                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                            />
                        }
                        label="حساب پیش‌فرض برای ارسال"
                        sx={{ mb: 2 }}
                    />
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                        IMAP (برای صندوق ورودی)
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="سرور IMAP (اختیاری)"
                        value={form.imapHost}
                        onChange={(e) => setForm((f) => ({ ...f, imapHost: e.target.value }))}
                        sx={{ mb: 2 }}
                        placeholder="mail.hikaweb.ir"
                    />
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="پورت IMAP"
                        value={form.imapPort}
                        onChange={(e) => setForm((f) => ({ ...f, imapPort: parseInt(e.target.value, 10) || 993 }))}
                        sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={form.imapSecure}
                                onChange={(e) => setForm((f) => ({ ...f, imapSecure: e.target.checked }))}
                            />
                        }
                        label="اتصال امن IMAP (TLS)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>انصراف</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createAccount.isPending || updateAccount.isPending}>
                        {editId ? "ذخیره" : "افزودن"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
                <DialogTitle>حذف حساب</DialogTitle>
                <DialogContent>
                    آیا از حذف حساب «{deleteConfirm?.address}» اطمینان دارید؟
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)}>انصراف</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => deleteAccount.mutate(deleteConfirm?._id)}
                        disabled={deleteAccount.isPending}
                    >
                        حذف
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}
