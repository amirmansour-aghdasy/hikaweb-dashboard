"use client";
import { Card, CardContent, Typography, Box, Avatar, useTheme } from "@mui/material";
import { TrendingUp, TrendingDown } from "@mui/icons-material";

export default function StatsCard({ title, value, change, changeType = "increase", icon, color = "primary" }) {
    const theme = useTheme();

    const getChangeColor = () => {
        if (changeType === "increase") return "success.main";
        if (changeType === "decrease") return "error.main";
        return "text.secondary";
    };

    return (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                        {change && (
                            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                                {changeType === "increase" ? (
                                    <TrendingUp sx={{ color: "success.main", fontSize: "1rem", mr: 0.5 }} />
                                ) : (
                                    <TrendingDown sx={{ color: "error.main", fontSize: "1rem", mr: 0.5 }} />
                                )}
                                <Typography variant="body2" sx={{ color: getChangeColor() }}>
                                    {change}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {icon && (
                        <Avatar
                            sx={{
                                bgcolor: `${color}.light`,
                                color: `${color}.main`,
                                width: 56,
                                height: 56,
                            }}
                        >
                            {icon}
                        </Avatar>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
