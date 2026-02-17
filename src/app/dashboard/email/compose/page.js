"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import { useApi } from "@/hooks/useApi";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function EmailComposePage() {
    const [accountId, setAccountId] = useState("");
    const [to, setTo] = useState("");
    const [cc, setCc] = useState("");
    const [bcc, setBcc] = useState("");
    const [subject, setSubject] = useState("");
    const [html, setHtml] = useState("");
    const [sending, setSending] = useState(false);

    const { useFetchData } = useApi();
    const { data: accountsData } = useFetchData("email-accounts", "/email-accounts");
    const accounts = accountsData?.data?.items ?? [];

    useEffect(() => {
        if (accounts.length > 0 && !accountId) {
            const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
            if (defaultAcc) setAccountId(defaultAcc._id);
        }
    }, [accounts, accountId]);

    const handleSend = async () => {
        if (!to.trim()) {
            toast.error("گیرنده را وارد کنید.");
            return;
        }
        if (!subject.trim()) {
            toast.error("موضوع را وارد کنید.");
            return;
        }
        setSending(true);
        try {
            const payload = {
                to: to.trim().includes(",") ? to.split(",").map((e) => e.trim()).filter(Boolean) : to.trim(),
                subject: subject.trim(),
                html: html || undefined,
                text: html ? html.replace(/<[^>]*>/g, "").trim() : "",
            };
            if (cc.trim()) payload.cc = cc.trim().includes(",") ? cc.split(",").map((e) => e.trim()).filter(Boolean) : cc.trim();
            if (bcc.trim()) payload.bcc = bcc.trim().includes(",") ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : bcc.trim();
            if (accountId) payload.accountId = accountId;

            await api.post(accountId ? `/email-accounts/${accountId}/send` : "/email-accounts/send", payload);
            toast.success("ایمیل با موفقیت ارسال شد.");
            setTo("");
            setCc("");
            setBcc("");
            setSubject("");
            setHtml("");
        } catch (err) {
            const msg = err.response?.data?.message || "خطا در ارسال ایمیل.";
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    return (
        <Layout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    نوشتن ایمیل
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ارسال ایمیل از یکی از حساب‌های متصل
                </Typography>
                {accounts.length === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        ابتدا در بخش «حساب‌های ایمیل» حداقل یک حساب (مثلاً info@hikaweb.ir) اضافه کنید.
                    </Alert>
                )}
                <Paper sx={{ p: 3, maxWidth: 720 }}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>ارسال با حساب</InputLabel>
                        <Select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            label="ارسال با حساب"
                        >
                            {accounts.map((acc) => (
                                <MenuItem key={acc._id} value={acc._id}>
                                    {acc.displayName || acc.address} {acc.isDefault && "(پیش‌فرض)"}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        size="small"
                        label="گیرنده (ایمیل یا چند ایمیل با کاما)"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        sx={{ mb: 2 }}
                        placeholder="example@domain.com"
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="رونوشت (cc)"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="رونوشت مخفی (bcc)"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="موضوع"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        minRows={8}
                        label="متن ایمیل (می‌توانید از HTML استفاده کنید)"
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        sx={{ mb: 2 }}
                        placeholder="<p>سلام،</p><p>متن پیام...</p>"
                    />
                    <Button
                        variant="contained"
                        startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send />}
                        onClick={handleSend}
                        disabled={sending || accounts.length === 0}
                    >
                        {sending ? "در حال ارسال..." : "ارسال"}
                    </Button>
                </Paper>
            </Box>
        </Layout>
    );
}
