"use client";
import { Box, Tabs, Tab, Paper, Typography, FormHelperText, CircularProgress, useTheme, Button } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import MediaLibrary from "../media/MediaLibrary";

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
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [editorData, setEditorData] = useState({ fa: value.fa || "", en: value.en || "" });
    const [editorLoaded, setEditorLoaded] = useState(false);
    const editorRef = useRef({ fa: null, en: null });
    const isInitialMount = useRef(true);
    const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState("fa");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setEditorLoaded(true);
        }
    }, []);

    // Sync editorData with value prop changes when editing existing article
    useEffect(() => {
        // Skip on initial mount to avoid overwriting user input
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Only update if value actually changed and is different from current editorData
        if (value && (value.fa !== editorData.fa || value.en !== editorData.en)) {
            setEditorData({
                fa: value.fa || "",
                en: value.en || ""
            });

            // Update editor content if editors are ready
            if (editorRef.current.fa && value.fa) {
                editorRef.current.fa.setData(value.fa);
            }
            if (editorRef.current.en && value.en) {
                editorRef.current.en.setData(value.en);
            }
        }
    }, [value?.fa, value?.en]); // Only depend on the actual content values

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

    // Handle image selection from MediaLibrary
    const handleImageSelect = (selected) => {
        if (!selected) return;
        
        const imageData = Array.isArray(selected) ? selected[0] : selected;
        const imageUrl = typeof imageData === 'string' 
            ? imageData 
            : (imageData.url || imageData);
        
        const imageAlt = typeof imageData === 'object' 
            ? (imageData.altText?.fa || imageData.originalName || '') 
            : '';

        // Get current editor
        const currentEditor = editorRef.current[currentLang];
        if (!currentEditor) return;

        // Insert image into editor
        currentEditor.model.change((writer) => {
            const imageElement = writer.createElement('imageBlock', {
                src: imageUrl,
                alt: imageAlt
            });

            // Insert at current selection or at the end
            const selection = currentEditor.model.document.selection;
            const insertPosition = selection.getFirstPosition();
            currentEditor.model.insertContent(imageElement, insertPosition);
        });

        setMediaLibraryOpen(false);
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
        // Keep toolbar direction consistent regardless of language
        ui: {
            viewportOffset: {
                top: 0
            }
        }
    });

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2">
                    {label} {required && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Box component="svg" viewBox="0 0 20 20" sx={{ width: 16, height: 16, fill: "currentColor" }}>
                        <path d="M2 4v12h16V4H2zm14 10H4V6h12v8zM6 8l4 4 2-2 4 4H4l2-4z"/>
                    </Box>}
                    onClick={() => {
                        setCurrentLang(activeTab === 0 ? "fa" : "en");
                        setMediaLibraryOpen(true);
                    }}
                    sx={{ minWidth: "auto", px: 2 }}
                >
                    درج تصویر
                </Button>
            </Box>

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
                            backgroundColor: theme.palette.mode === "dark" ? "#1E1E1E" : "#FFFFFF",
                            color: theme.palette.mode === "dark" ? "#E0E0E0" : "#000000",
                            "& p": {
                                color: theme.palette.mode === "dark" ? "#E0E0E0" : "#000000",
                            },
                            "& h1, & h2, & h3, & h4, & h5, & h6": {
                                color: theme.palette.mode === "dark" ? "#FFFFFF" : "#000000",
                            },
                            "& strong, & b": {
                                color: theme.palette.mode === "dark" ? "#FFFFFF" : "#000000",
                            },
                        },
                        "& .ck-toolbar": {
                            backgroundColor: theme.palette.mode === "dark" ? "#1E1E1E" : "#F5F5F5",
                            borderColor: theme.palette.divider,
                        },
                        "& .ck-editor": {
                            backgroundColor: theme.palette.mode === "dark" ? "#1E1E1E" : "#FFFFFF",
                        },
                        "& .ck-content": {
                            backgroundColor: theme.palette.mode === "dark" ? "#1E1E1E" : "#FFFFFF",
                        },
                        "& .ck-button": {
                            color: theme.palette.text.primary,
                            "&:hover": {
                                backgroundColor: theme.palette.mode === "dark" ? "#3D3D3D" : "#E0E0E0",
                            },
                        },
                        "& .ck-button_on": {
                            backgroundColor: theme.palette.mode === "dark" ? "#3D3D3D" : "#E0E0E0",
                        },
                    }}
                >
                    {editorLoaded ? (
                        <>
                            {/* Persian Editor */}
                            <Box
                                sx={{
                                    display: activeTab === 0 ? "block" : "none",
                                    "& .ck-editor__editable": {
                                        direction: "rtl",
                                        color: theme.palette.mode === "dark" ? "#E0E0E0" : "#000000",
                                        "& p, & span, & div": {
                                            color: theme.palette.mode === "dark" ? "#E0E0E0" : "#000000",
                                        },
                                    },
                                    "& .ck-toolbar": {
                                        direction: "rtl", // Keep toolbar RTL for Persian
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
                                        color: theme.palette.mode === "dark" ? "#E0E0E0" : "#000000",
                                        "& p, & span, & div": {
                                            color: theme.palette.mode === "dark" ? "#E0E0E0" : "#000000",
                                        },
                                    },
                                    "& .ck-toolbar": {
                                        direction: "rtl", // Keep toolbar RTL even for English (consistent with UI)
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

            {/* Media Library Dialog */}
            <MediaLibrary
                open={mediaLibraryOpen}
                onClose={() => setMediaLibraryOpen(false)}
                onSelect={handleImageSelect}
                multiple={false}
                maxFiles={1}
                acceptedTypes={["image/*"]}
                title="انتخاب تصویر"
                showUpload={true}
                optimizeForWeb={true}
            />
        </Box>
    );
}
