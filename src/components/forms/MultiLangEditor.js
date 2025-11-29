"use client";
import { Box, Tabs, Tab, Paper, Typography, FormHelperText, CircularProgress } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import CKEditor to avoid SSR issues
const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor), {
    ssr: false,
    loading: () => (
        <Box sx={{ p: 2, textAlign: "center" }}>
            <CircularProgress size={24} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
                در حال بارگذاری ویرایشگر...
            </Typography>
        </Box>
    ),
});

import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export default function MultiLangEditor({ label, value = { fa: "", en: "" }, onChange, error, helperText, required = false, height = 300, disabled = false }) {
    const [activeTab, setActiveTab] = useState(0);
    const [editorData, setEditorData] = useState({ fa: value.fa || "", en: value.en || "" });
    const [editorLoaded, setEditorLoaded] = useState(false);
    const editorRef = useRef({ fa: null, en: null });

    useEffect(() => {
        if (typeof window !== "undefined") {
            setEditorLoaded(true);
        }
    }, []);

    // Don't sync editorData with value prop changes - this causes content to reset
    // editorData is managed internally and only updated via handleChange
    // The value prop is only used for initial state

    const handleChange = (lang, newValue) => {
        const updatedData = {
            ...editorData,
            [lang]: newValue || "",
        };
        setEditorData(updatedData);
        onChange(updatedData);
    };

    const getTabError = (lang) => {
        return error && error[lang];
    };

    // CKEditor configuration base
    const getEditorConfig = (lang) => ({
        fontFamily: {
            options: ["IRANSans, Arial, sans-serif", "Tahoma, sans-serif", "Times New Roman, serif"],
        },
        language: lang,
        toolbar: ["heading", "|", "bold", "italic", "link", "bulletedList", "numberedList", "|", "outdent", "indent", "|", "blockQuote", "insertTable", "mediaEmbed", "|", "undo", "redo"],
        heading: {
            options: lang === "fa" ? [
                { model: "paragraph", title: "پاراگراف", class: "ck-heading_paragraph" },
                { model: "heading1", view: "h1", title: "عنوان 1", class: "ck-heading_heading1" },
                { model: "heading2", view: "h2", title: "عنوان 2", class: "ck-heading_heading2" },
                { model: "heading3", view: "h3", title: "عنوان 3", class: "ck-heading_heading3" },
            ] : [
                { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
                { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
                { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
                { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
            ],
        },
        placeholder: lang === "fa" ? "محتوای خود را اینجا بنویسید..." : "Write your content here...",
    });

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                {label} {required && <span style={{ color: "red" }}>*</span>}
            </Typography>

            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => {
                        setActiveTab(newValue);
                    }}
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

                <Box
                    sx={{
                        minHeight: height,
                        position: "relative",
                        "& .ck-editor": {
                            minHeight: height,
                        },
                        "& .ck-editor__editable": {
                            minHeight: `${height - 100}px`,
                            maxHeight: `${height - 100}px`,
                            overflow: "auto",
                        },
                    }}
                >
                    {editorLoaded ? (
                        <>
                            {/* Persian Editor */}
                            {/* Persian Editor */}
                            <Box
                                sx={{
                                    display: activeTab === 0 ? "block" : "none",
                                    "& .ck-editor__editable": {
                                        direction: "rtl",
                                    },
                                    "& .ck-toolbar": {
                                        direction: "rtl",
                                    },
                                }}
                            >
                                <CKEditor
                                    editor={ClassicEditor}
                                    config={getEditorConfig("fa")}
                                    data={editorData.fa || "<p>محتوای خود را اینجا بنویسید...</p>"}
                                    disabled={disabled}
                                    onReady={(editor) => {
                                        editorRef.current.fa = editor;
                                    }}
                                    onChange={(event, editor) => {
                                        const data = editor.getData();
                                        handleChange("fa", data);
                                    }}
                                />
                            </Box>
                            
                            {/* English Editor */}
                            <Box
                                sx={{
                                    display: activeTab === 1 ? "block" : "none",
                                    "& .ck-editor__editable": {
                                        direction: "ltr",
                                    },
                                    "& .ck-toolbar": {
                                        direction: "ltr",
                                    },
                                }}
                            >
                                <CKEditor
                                    editor={ClassicEditor}
                                    config={getEditorConfig("en")}
                                    data={editorData.en || "<p>Write your content here...</p>"}
                                    disabled={disabled}
                                    onReady={(editor) => {
                                        editorRef.current.en = editor;
                                    }}
                                    onChange={(event, editor) => {
                                        const data = editor.getData();
                                        handleChange("en", data);
                                    }}
                                />
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ p: 2, textAlign: "center" }}>
                            <CircularProgress size={24} sx={{ mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                در حال بارگذاری ویرایشگر...
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            {(error?.fa || error?.en || helperText) && <FormHelperText error={!!(error?.fa || error?.en)}>{error?.fa || error?.en || helperText}</FormHelperText>}
        </Box>
    );
}
