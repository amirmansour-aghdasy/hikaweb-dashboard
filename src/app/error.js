"use client";
import { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" gap={2}>
            <Typography variant="h4">خطایی رخ داده است!</Typography>
            <Typography variant="body1" color="textSecondary">
                {error?.message || "خطای غیرمنتظره"}
            </Typography>
            <Button variant="contained" onClick={reset}>
                تلاش مجدد
            </Button>
        </Box>
    );
}
