"use client";
import { Box, Tabs, Tab, Paper, Typography, FormHelperText } from "@mui/material";
import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";

export default function MultiLangEditor({ label, value = { fa: "", en: "" }, onChange, error, helperText, required = false, height = 300, disabled = false }) {
    const [activeTab, setActiveTab] = useState(0);

    const handleChange = (lang, newValue) => {
        onChange({
            ...value,
            [lang]: newValue || "",
        });
    };

    const getTabError = (lang) => {
        return error && error[lang];
    };

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                {label} {required && <span style={{ color: "red" }}>*</span>}
            </Typography>

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
                        label="محتوای فارسی"
                        sx={{
                            color: getTabError("fa") ? "error.main" : "text.primary",
                            "&.Mui-selected": {
                                color: getTabError("fa") ? "error.main" : "primary.main",
                            },
                        }}
                    />
                    <Tab
                        label="English Content"
                        sx={{
                            color: getTabError("en") ? "error.main" : "text.primary",
                            "&.Mui-selected": {
                                color: getTabError("en") ? "error.main" : "primary.main",
                            },
                        }}
                    />
                </Tabs>

                <Box sx={{ minHeight: height }}>
                    {activeTab === 0 && (
                        <MDEditor
                            value={value.fa || ""}
                            onChange={(val) => handleChange("fa", val)}
                            height={height}
                            data-color-mode="light"
                            textareaProps={{
                                disabled,
                                dir: "rtl",
                                style: { fontFamily: "inherit" },
                            }}
                        />
                    )}

                    {activeTab === 1 && (
                        <MDEditor
                            value={value.en || ""}
                            onChange={(val) => handleChange("en", val)}
                            height={height}
                            data-color-mode="light"
                            textareaProps={{
                                disabled,
                                dir: "ltr",
                                style: { fontFamily: "inherit" },
                            }}
                        />
                    )}
                </Box>
            </Paper>

            {(error?.fa || error?.en || helperText) && <FormHelperText error={!!(error?.fa || error?.en)}>{error?.fa || error?.en || helperText}</FormHelperText>}
        </Box>
    );
}
