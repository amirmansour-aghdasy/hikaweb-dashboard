"use client";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box } from "@mui/material";
import { Close } from "@mui/icons-material";

export default function Modal({ open, onClose, title, children, actions, maxWidth = "lg", fullWidth = true, showCloseButton = true }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                    },
                },
            }}
        >
            {title && (
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {title}
                    {showCloseButton && (
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    )}
                </DialogTitle>
            )}

            <DialogContent dividers>{children}</DialogContent>

            {actions && <DialogActions sx={{ p: 2, gap: 1 }}>{actions}</DialogActions>}
        </Dialog>
    );
}
