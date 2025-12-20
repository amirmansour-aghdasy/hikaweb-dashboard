"use client";
import { Box, TextField, Tabs, Tab, Paper, Typography, FormHelperText } from "@mui/material";
import { Language, Flag } from "@mui/icons-material";
import { useState } from "react";

export default function MultiLangTextField({
    label,
    value = { fa: "", en: "" },
    onChange,
    error,
    helperText,
    required = false,
    multiline = false,
    rows = 1,
    maxLength,
    placeholder,
    disabled = false,
    variant = "outlined",
    size = "medium",
}) {
    const [activeTab, setActiveTab] = useState(0);

    // Use value directly - no need for internal state
    // React will re-render when value prop changes

    const handleChange = (lang, newValue) => {
        onChange({
            ...value,
            [lang]: newValue,
        });
    };

    const getTabError = (lang) => {
        if (!error) return false;
        
        // Handle validation error object from react-hook-form v7+
        // react-hook-form v7+ uses error.types for validate rules
        if (error.types) {
            const faError = error.types?.faRequired;
            const enError = error.types?.enRequired;
            if (lang === 'fa' && faError) return true;
            if (lang === 'en' && enError) return true;
        }
        
        // Handle validation error object from react-hook-form (legacy)
        if (error.type) {
            const isFaError = error.type === 'faRequired' && lang === 'fa';
            const isEnError = error.type === 'enRequired' && lang === 'en';
            return isFaError || isEnError;
        }
        
        // Handle react-hook-form error structure - only if it's actually an error message
        // Don't treat input values as errors
        if (error[lang] !== undefined) {
            // Only return true if it's a validation error (string with error keywords or boolean true)
            if (typeof error[lang] === 'boolean' && error[lang] === true) {
                return true;
            }
            if (typeof error[lang] === 'string') {
                // Check if it's likely an error message (contains common error keywords)
                const errorKeywords = ['الزامی', 'required', 'نامعتبر', 'invalid', 'باید', 'must'];
                const isLikelyError = errorKeywords.some(keyword => error[lang].includes(keyword));
                if (isLikelyError) {
                    return true;
                }
            }
            // If it's an object with message property, it's an error
            if (error[lang]?.message) {
                return true;
            }
        }
        
        // If error has message but no type, show for both languages (general error)
        if (error.message && typeof error.message === 'string') {
            const errorKeywords = ['الزامی', 'required', 'نامعتبر', 'invalid', 'باید', 'must'];
            const isLikelyError = errorKeywords.some(keyword => error.message.includes(keyword));
            if (isLikelyError) {
                return true;
            }
        }
        
        return false;
    };
    
    const getTabErrorMessage = (lang) => {
        if (!error) return "";
        
        // Handle validation error object from react-hook-form v7+
        // react-hook-form v7+ uses error.types for validate rules
        if (error.types) {
            const faError = error.types?.faRequired;
            const enError = error.types?.enRequired;
            if (lang === 'fa' && faError) {
                return typeof faError === 'string' ? faError : (faError?.message || "عنوان فارسی الزامی است");
            }
            if (lang === 'en' && enError) {
                return typeof enError === 'string' ? enError : (enError?.message || "عنوان انگلیسی الزامی است");
            }
        }
        
        // Handle validation error object from react-hook-form (legacy)
        if (error.type) {
            // Check if error type matches the language
            const isFaError = error.type === 'faRequired' && lang === 'fa';
            const isEnError = error.type === 'enRequired' && lang === 'en';
            if (isFaError || isEnError) {
                return error.message || "";
            }
        }
        
        // Handle react-hook-form error structure (only if it's actually an error, not input value)
        // Check if error[lang] is a validation error message (not the input value)
        if (error[lang] !== undefined) {
            // Only return if it's a string that looks like an error message
            // Error messages are typically short and don't match typical input patterns
            if (typeof error[lang] === 'string') {
                // Check if it's likely an error message (contains common error keywords)
                const errorKeywords = ['الزامی', 'required', 'نامعتبر', 'invalid', 'باید', 'must'];
                const isLikelyError = errorKeywords.some(keyword => error[lang].includes(keyword));
                if (isLikelyError) {
                    return error[lang];
                }
                // If it doesn't contain error keywords, it's probably an input value, not an error
                // Don't return it as error message
                return "";
            }
            // If it's an object with message property, it's an error
            if (error[lang]?.message) {
                return error[lang].message;
            }
        }
        
        // If error has message but no type, show for both languages (general error)
        if (error.message && typeof error.message === 'string') {
            // Check if it's likely an error message
            const errorKeywords = ['الزامی', 'required', 'نامعتبر', 'invalid', 'باید', 'must'];
            const isLikelyError = errorKeywords.some(keyword => error.message.includes(keyword));
            if (isLikelyError) {
                return error.message;
            }
        }
        
        return "";
    };

    const getTabHelperText = (lang) => {
        // Only show helper text if there's no error
        if (getTabError(lang)) {
            return ""; // Don't show helper text when there's an error
        }
        if (helperText && helperText[lang]) return helperText[lang];
        if (maxLength && value?.[lang]) {
            return `${value[lang].length}/${maxLength} کاراکتر`;
        }
        return "";
    };

    return (
        <Box>
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        minHeight: 40,
                        "& .MuiTab-root": { minHeight: 40, py: 1 },
                    }}
                >
                    <Tab
                        label="فارسی"
                        icon={<span style={{ fontSize: "1.2em" }}>🇮🇷</span>}
                        iconPosition="start"
                        sx={{
                            color: getTabError("fa") ? "error.main" : "text.primary",
                            "&.Mui-selected": {
                                color: getTabError("fa") ? "error.main" : "primary.main",
                            },
                        }}
                    />
                    <Tab
                        label="English"
                        icon={<span style={{ fontSize: "1.2em" }}>🇺🇸</span>}
                        iconPosition="start"
                        sx={{
                            color: getTabError("en") ? "error.main" : "text.primary",
                            "&.Mui-selected": {
                                color: getTabError("en") ? "error.main" : "primary.main",
                            },
                        }}
                    />
                </Tabs>

                <Box sx={{ p: 2 }}>
                    {activeTab === 0 && (
                        <TextField
                            fullWidth
                            label={`${label} (فارسی)`}
                            value={value?.fa || ""}
                            onChange={(e) => handleChange("fa", e.target.value)}
                            error={getTabError("fa")}
                            helperText={getTabErrorMessage("fa") || (getTabError("fa") ? "" : getTabHelperText("fa"))}
                            multiline={multiline}
                            rows={multiline ? rows : undefined}
                            placeholder={placeholder?.fa}
                            disabled={disabled}
                            variant={variant}
                            size={size}
                            inputProps={{
                                maxLength: maxLength,
                                dir: "rtl",
                            }}
                        />
                    )}

                    {activeTab === 1 && (
                        <TextField
                            fullWidth
                            label={`${label} (English)`}
                            value={value?.en || ""}
                            onChange={(e) => handleChange("en", e.target.value)}
                            error={getTabError("en")}
                            helperText={getTabErrorMessage("en") || (getTabError("en") ? "" : getTabHelperText("en"))}
                            multiline={multiline}
                            rows={multiline ? rows : undefined}
                            placeholder={placeholder?.en}
                            disabled={disabled}
                            variant={variant}
                            size={size}
                            inputProps={{
                                maxLength: maxLength,
                                dir: "ltr",
                            }}
                        />
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
