import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
    return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" gap={2}>
            <Typography variant="h1" fontWeight="bold">
                ۴۰۴
            </Typography>
            <Typography variant="h4">صفحه یافت نشد</Typography>
            <Typography variant="body1" color="textSecondary">
                صفحه‌ای که دنبال آن می‌گردید وجود ندارد.
            </Typography>
            <Button variant="contained" color="primary" component={Link} href="/dashboard">
                بازگشت به داشبورد
            </Button>
        </Box>
    );
}
