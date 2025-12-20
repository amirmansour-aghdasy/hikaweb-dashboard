"use client";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, actions, maxWidth = "lg", fullWidth = true, showCloseButton = true }) {

    // Fix aria-hidden warning by removing aria-hidden from backdrop container when dialog is open
    useEffect(() => {
        if (!open || typeof document === 'undefined') return;

        const fixAriaHidden = () => {
            // Find all dialog elements
            const dialogs = document.querySelectorAll('[role="dialog"]');
            
            dialogs.forEach((dialog) => {
                // Traverse up the DOM tree to find elements with aria-hidden="true"
                let element = dialog.parentElement;
                while (element && element !== document.body) {
                    if (element.getAttribute('aria-hidden') === 'true') {
                        // Check if this element contains any focusable elements within the dialog
                        const hasFocusableElements = element.querySelector(
                            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                        );
                        
                        if (hasFocusableElements) {
                            // Remove aria-hidden to fix accessibility warning
                            element.removeAttribute('aria-hidden');
                        }
                    }
                    element = element.parentElement;
                }
            });
        };

        // Use MutationObserver to watch for aria-hidden changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
                    fixAriaHidden();
                } else if (mutation.type === 'childList') {
                    // Check when new nodes are added (dialog opens)
                    fixAriaHidden();
                }
            });
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-hidden']
        });

        // Run immediately
        fixAriaHidden();
        
        // Also run after a delay to catch delayed DOM updates
        const timeoutId = setTimeout(fixAriaHidden, 150);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [open]);

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
            disableEnforceFocus={true}
            disableAutoFocus={true}
            disableRestoreFocus={true}
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
