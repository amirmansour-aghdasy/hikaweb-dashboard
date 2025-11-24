"use client";
import { IconButton, Badge } from "@mui/material";
import { Notifications } from "@mui/icons-material";
import { useApi } from "../../hooks/useApi";
import { useEffect, useState } from "react";

export default function NotificationButton({ onOpen }) {
    const { useFetchData } = useApi();
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notifications count
    const { data: countData } = useFetchData(
        "notifications-unread-count",
        "/notifications/unread-count",
        {
            refetchInterval: 30000, // Refetch every 30 seconds
            staleTime: 10000, // Consider data stale after 10 seconds
        }
    );

    useEffect(() => {
        if (countData?.data?.count !== undefined) {
            setUnreadCount(countData.data.count);
        }
    }, [countData]);

    return (
        <IconButton color="primary" onClick={onOpen}>
            <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error">
                <Notifications />
            </Badge>
        </IconButton>
    );
}

