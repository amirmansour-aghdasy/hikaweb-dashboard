"use client";
import { useState, useEffect, useRef } from "react";
import { InputAdornment, IconButton } from "@mui/material";
import { CalendarToday } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { faIR } from "date-fns/locale";
import {
    dateToPersianInput,
} from "../../lib/dateUtils";

/**
 * Persian Date Picker Component
 * A wrapper around MUI DatePicker that displays dates in Persian (Jalaali) format
 * but stores them as Gregorian dates for backend compatibility
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
    const containerRef = useRef(null);

    // Convert incoming value (Date or string) to internal Date format
    useEffect(() => {
        if (value) {
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
        
        // Call onChange with Gregorian date (for backend)
        if (onChange) {
            onChange(newDate);
        }
    };

    // Update input value to show Persian date
    useEffect(() => {
        if (!internalValue || !containerRef.current) return;

        const updateToPersian = () => {
            const input = containerRef.current?.querySelector('input[type="text"]');
            if (input) {
                const persianDate = dateToPersianInput(internalValue);
                if (input.value && input.value !== persianDate) {
                    input.value = persianDate;
                }
            }
        };

        // Update after DatePicker finishes its update
        const timer = setTimeout(updateToPersian, 100);
        
        // Also set up an observer to catch when DatePicker updates the value
        const input = containerRef.current?.querySelector('input[type="text"]');
        if (input) {
            const observer = new MutationObserver(() => {
                updateToPersian();
            });
            
            observer.observe(input, {
                attributes: true,
                attributeFilter: ['value'],
            });

            return () => {
                clearTimeout(timer);
                observer.disconnect();
            };
        }

        return () => clearTimeout(timer);
    }, [internalValue]);

    return (
        <div ref={containerRef}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={faIR}>
                <DatePicker
                    label={label}
                    value={internalValue}
                    onChange={handleDateChange}
                    disabled={disabled}
                    slotProps={{
                        textField: {
                            fullWidth,
                            error,
                            helperText: helperText || "فرمت: ۱۴۰۳/۰۱/۰۱",
                            required,
                            InputProps: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton edge="end" disabled={disabled}>
                                            <CalendarToday />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                            ...props,
                        },
                    }}
                    format="yyyy/MM/dd"
                />
            </LocalizationProvider>
        </div>
    );
}
