"use client";
import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Email, Person, Schedule } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";

export default function EmailSentPage() {
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const { useFetchData } = useApi();

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", (page + 1).toString());
        params.append("limit", limit.toString());
        return params.toString();
    }, [page, limit]);

    const { data: sentData, isLoading } = useFetchData(
        ["email-sent", queryParams],
        `/email-accounts/sent?${queryParams}`
    );

    const items = sentData?.data?.items ?? [];
    const total = sentData?.data?.total ?? 0;

    return (
        <Layout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    ارسال شده
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    لیست ایمیل‌های ارسال شده از طریق داشبورد
                </Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>از</TableCell>
                                <TableCell>به</TableCell>
                                <TableCell>موضوع</TableCell>
                                <TableCell>تاریخ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        در حال بارگذاری...
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }} color="text.secondary">
                                        هنوز ایمیلی ارسال نشده است.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item._id} hover>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Email fontSize="small" color="action" />
                                                {item.fromAddress}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {(item.to || []).slice(0, 2).join(", ")}
                                            {(item.to || []).length > 2 && "…"}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 280 }} noWrap>
                                            {item.subject}
                                        </TableCell>
                                        <TableCell>
                                            {item.createdAt ? formatDate(item.createdAt) : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
                </TableContainer>
            </Box>
        </Layout>
    );
}
