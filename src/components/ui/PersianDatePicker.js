"use client";
import { useState, useEffect } from "react";
import { InputAdornment, IconButton } from "@mui/material";
import { CalendarToday } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFnsJalali } from "@mui/x-date-pickers/AdapterDateFnsJalali";

/**
 * Persian (Jalali) Date Picker
 * - باز شدن پاپ‌آپ با کلیک روی اینپوت یا آیکن تقویم
 * - تقویم شمسی (جلالی) و اعداد و متن فارسی
 * - مقدار به صورت Date (میلادی) به onChange داده می‌شود برای سازگاری با بک‌اند
 */
export default function PersianDatePicker({
    value,
    onChange,
    label,
    error,
    helperText,
    required = false,
    disabled = false,
    fullWidth = true,
    ...props
}) {
    const [internalValue, setInternalValue] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (value != null && value !== "") {
            const dateObj = value instanceof Date ? value : new Date(value);
            if (!isNaN(dateObj.getTime())) {
                setInternalValue(dateObj);
            } else {
                setInternalValue(null);
            }
        } else {
            setInternalValue(null);
        }
    }, [value]);

    const handleDateChange = (newDate) => {
        setInternalValue(newDate);
        if (onChange) onChange(newDate);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFnsJalali}>
            <DatePicker
                label={label}
                value={internalValue}
                onChange={handleDateChange}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                open={open}
                disabled={disabled}
                format="yyyy/MM/dd"
                slotProps={{
                    textField: {
                        fullWidth,
                        error,
                        helperText: helperText || "کلیک کنید و از تقویم تاریخ انتخاب کنید",
                        required,
                        onClick: () => !disabled && setOpen(true),
                        InputProps: {
                            readOnly: false,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        disabled={disabled}
                                        aria-label="باز کردن تقویم"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!disabled) setOpen(true);
                                        }}
                                    >
                                        <CalendarToday />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                        ...props,
                    },
                }}
                enableAccessibleFieldDOMStructure={false}
                {...props}
            />
        </LocalizationProvider>
    );
}
