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

    const handleChange = (lang, newValue) => {
        onChange({
            ...value,
            [lang]: newValue,
        });
    };

    const getTabError = (lang) => {
        if (!error) return false;
        
        // Handle react-hook-form error structure
        // Error can be: { fa: true/string, en: true/string } or { type: '...', message: '...' }
        if (error[lang] !== undefined) {
            // Direct language-specific error
            return !!error[lang];
        }
        
        // Handle validation error object from react-hook-form
        // Check if error type matches the language (faRequired/enRequired)
        if (error.type) {
            const isFaError = error.type === 'faRequired' && lang === 'fa';
            const isEnError = error.type === 'enRequired' && lang === 'en';
            return isFaError || isEnError;
        }
        
        // If error has message but no type, show for both languages (general error)
        if (error.message) {
            return !!error.message;
        }
        
        return false;
    };
    
    const getTabErrorMessage = (lang) => {
        if (!error) return "";
        
        // Handle react-hook-form error structure
        if (error[lang]) {
            // If it's a string, return it; if it's true/object, check for message
            if (typeof error[lang] === 'string') return error[lang];
            if (error[lang]?.message) return error[lang].message;
        }
        
        // Handle validation error object from react-hook-form
        if (error.type) {
            // Check if error type matches the language
            const isFaError = error.type === 'faRequired' && lang === 'fa';
            const isEnError = error.type === 'enRequired' && lang === 'en';
            if (isFaError || isEnError) {
                return error.message || "";
            }
        }
        
        // If error has message but no type, show for both languages (general error)
        if (error.message) {
            return error.message;
        }
        
        return "";
    };

    const getTabHelperText = (lang) => {
        if (helperText && helperText[lang]) return helperText[lang];
        if (maxLength && value[lang]) {
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
                            value={value.fa || ""}
                            onChange={(e) => handleChange("fa", e.target.value)}
                            error={getTabError("fa")}
                            helperText={getTabErrorMessage("fa") || getTabHelperText("fa")}
                            required={required}
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
                            value={value.en || ""}
                            onChange={(e) => handleChange("en", e.target.value)}
                            error={getTabError("en")}
                            helperText={getTabErrorMessage("en") || getTabHelperText("en")}
                            required={required}
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
