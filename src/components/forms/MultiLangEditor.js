"use client";
import { Box, Tabs, Tab, Paper, Typography, FormHelperText, CircularProgress, useTheme, Button } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import MediaPicker from "../media/MediaPicker";

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
    const previousValueRef = useRef({ fa: value?.fa || "", en: value?.en || "" });
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
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
            // Initialize editorData with value on mount
            if (value) {
                const initialData = {
                    fa: value.fa || "",
                    en: value.en || ""
                };
                setEditorData(initialData);
                previousValueRef.current = { ...initialData };
            }
            return;
        }

        // Get current value strings (handle null/undefined)
        const currentValueFa = value?.fa || "";
        const currentValueEn = value?.en || "";
        const prevValueFa = previousValueRef.current.fa || "";
        const prevValueEn = previousValueRef.current.en || "";

        // Only update if value actually changed (compare strings, not references)
        // This prevents infinite loops when the value object reference changes but content is the same
        if (currentValueFa !== prevValueFa || currentValueEn !== prevValueEn) {
            // Update the ref first to prevent infinite loops
            previousValueRef.current = {
                fa: currentValueFa,
                en: currentValueEn
            };

            // Use functional update to get current editorData state
            setEditorData(prevEditorData => {
                // Only update if there's an actual difference
                if (currentValueFa !== prevEditorData.fa || currentValueEn !== prevEditorData.en) {
                    // Update editor content if editors are ready and content is different
                    // Use setTimeout to avoid disrupting user's current selection
                    setTimeout(() => {
                        if (editorRef.current.fa && currentValueFa && currentValueFa !== editorRef.current.fa.getData()) {
                            editorRef.current.fa.setData(currentValueFa);
                        }
                        if (editorRef.current.en && currentValueEn && currentValueEn !== editorRef.current.en.getData()) {
                            editorRef.current.en.setData(currentValueEn);
                        }
                    }, 0);

                    return {
                        fa: currentValueFa,
                        en: currentValueEn
                    };
                }
                return prevEditorData; // No change, return previous state
            });
        }
    }, [value?.fa, value?.en]); // Only depend on the actual content values, not editorData

    const handleChange = (lang, newValue) => {
        const updatedData = {
            ...editorData,
            [lang]: newValue || "",
        };
        setEditorData(updatedData);
        onChange(updatedData);
    };

    const getTabError = (lang) => {
        if (!error) return false;
        
        // Handle validation error object from react-hook-form v7+
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
        
        // Handle react-hook-form error structure
        if (error[lang] !== undefined) {
            // If it's a boolean true, it's an error
            if (typeof error[lang] === 'boolean' && error[lang] === true) {
                return true;
            }
            // If it's a string with error keywords, it's an error
            if (typeof error[lang] === 'string') {
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
        if (error.types) {
            const faError = error.types?.faRequired;
            const enError = error.types?.enRequired;
            if (lang === 'fa' && faError) {
                return typeof faError === 'string' ? faError : (faError?.message || "توضیحات فارسی الزامی است");
            }
            if (lang === 'en' && enError) {
                return typeof enError === 'string' ? enError : (enError?.message || "توضیحات انگلیسی الزامی است");
            }
        }
        
        // Handle validation error object from react-hook-form (legacy)
        if (error.type) {
            const isFaError = error.type === 'faRequired' && lang === 'fa';
            const isEnError = error.type === 'enRequired' && lang === 'en';
            if (isFaError || isEnError) {
                return error.message || "";
            }
        }
        
        // Handle react-hook-form error structure
        if (error[lang] !== undefined) {
            // If it's a string with error keywords, return it
            if (typeof error[lang] === 'string') {
                const errorKeywords = ['الزامی', 'required', 'نامعتبر', 'invalid', 'باید', 'must'];
                const isLikelyError = errorKeywords.some(keyword => error[lang].includes(keyword));
                if (isLikelyError) {
                    return error[lang];
                }
            }
            // If it's an object with message property, return the message
            if (error[lang]?.message && typeof error[lang].message === 'string') {
                return error[lang].message;
            }
        }
        
        // If error has message but no type, show for both languages (general error)
        if (error.message && typeof error.message === 'string') {
            const errorKeywords = ['الزامی', 'required', 'نامعتبر', 'invalid', 'باید', 'must'];
            const isLikelyError = errorKeywords.some(keyword => error.message.includes(keyword));
            if (isLikelyError) {
                return error.message;
            }
        }
        
        return "";
    };

    // Handle image selection from MediaPicker
    const handleImageSelect = (selected) => {
        if (!selected) {
            setMediaPickerOpen(false);
            return;
        }
        
        const imageData = Array.isArray(selected) ? selected[0] : selected;
        const imageUrl = typeof imageData === 'string' 
            ? imageData 
            : (imageData.url || imageData._id || imageData);
        
        const imageAlt = typeof imageData === 'object' 
            ? (imageData.altText?.fa || imageData.originalName || imageData.fileName || '') 
            : '';

        // Get current editor
        const currentEditor = editorRef.current[currentLang];
        if (!currentEditor) {
            setMediaPickerOpen(false);
            return;
        }

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

        setMediaPickerOpen(false);
    };

    // CKEditor configuration base
    const getEditorConfig = (lang) => ({
        fontFamily: {
            options: ["IRANSans, Arial, sans-serif", "Tahoma, sans-serif", "Times New Roman, serif"],
        },
        language: lang === "fa" ? "fa" : "en",
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
        },
        // Prevent content disruption
        updateSourceElementOnDestroy: false
    });

    // Add global styles for CKEditor link balloon to ensure it's visible and interactive
    // Only apply to CKEditor elements, not MUI modals
    useEffect(() => {
        if (typeof document !== 'undefined') {
            const style = document.createElement('style');
            style.textContent = `
                /* Only target CKEditor balloon elements */
                .ck-balloon-panel {
                    z-index: 100000 !important;
                    position: fixed !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .ck-balloon {
                    z-index: 100000 !important;
                    position: fixed !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .ck-link-form {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .ck-link-form input,
                .ck-link-form input[type="text"],
                .ck-link-form input[type="url"],
                .ck-link-form button {
                    pointer-events: auto !important;
                    z-index: 100001 !important;
                    position: relative !important;
                    cursor: text !important;
                    user-select: text !important;
                }
                .ck-link-form input:disabled,
                .ck-link-form input[disabled] {
                    pointer-events: none !important;
                }
                /* Ensure no overlay blocks the input */
                .ck-link-form::before,
                .ck-link-form::after {
                    display: none !important;
                    pointer-events: none !important;
                }
                /* Make sure CKEditor dialogs are above MUI modals when they exist */
                .ck-balloon-panel,
                .ck-balloon {
                    z-index: 100000 !important;
                }
                /* Make sure all children of link form are interactive */
                .ck-link-form * {
                    pointer-events: auto !important;
                }
                /* Remove any disabled state from inputs */
                .ck-link-form input:not([disabled]) {
                    pointer-events: auto !important;
                    cursor: text !important;
                }
                /* Force enable inputs - remove readonly and disabled attributes */
                .ck-link-form input[readonly] {
                    pointer-events: auto !important;
                    cursor: text !important;
                }
                /* Ensure input is focusable and editable */
                .ck-link-form input {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }
                /* Remove any backdrop or overlay that might block interaction */
                .ck-balloon-panel::before,
                .ck-balloon-panel::after,
                .ck-balloon::before,
                .ck-balloon::after {
                    display: none !important;
                    pointer-events: none !important;
                }
            `;
            document.head.appendChild(style);
            return () => {
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
            };
        }
    }, []);

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2">
                    {label} {required && <span style={{ color: "red" }}>*</span>}
                </Typography>
                <MediaPicker
                    value={null}
                    onChange={handleImageSelect}
                    label="درج تصویر"
                    accept="image/*"
                    multiple={false}
                    showPreview={false}
                    showEdit={true}
                    optimizeForWeb={true}
                    compact={true}
                    buttonProps={{
                        size: "small",
                        startIcon: <Box component="svg" viewBox="0 0 20 20" sx={{ width: 16, height: 16, fill: "currentColor" }}>
                            <path d="M2 4v12h16V4H2zm14 10H4V6h12v8zM6 8l4 4 2-2 4 4H4l2-4z"/>
                        </Box>,
                        sx: { minWidth: "auto", px: 2 }
                    }}
                />
            </Box>

            <Paper variant="outlined" sx={{ overflow: "visible", position: "relative" }}>
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
                        overflow: "visible",
                        "& .ck-editor": {
                            minHeight: height,
                            position: "relative",
                            overflow: "visible",
                        },
                        "& .ck-editor__editable": {
                            minHeight: `${height - 100}px`,
                            maxHeight: `${height - 100}px`,
                            overflowY: "auto",
                            overflowX: "visible",
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
                        // Ensure link dialog and buttons work correctly - use fixed positioning for dialogs
                        "& .ck-link-form": {
                            zIndex: 100000,
                            pointerEvents: "auto !important",
                            "& input": {
                                color: theme.palette.mode === "dark" ? "#E0E0E0" : "#000000",
                                pointerEvents: "auto !important",
                                zIndex: 100001,
                                position: "relative",
                                cursor: "text !important",
                                userSelect: "text !important",
                                "&:disabled": {
                                    pointerEvents: "none !important",
                                },
                            },
                            "& button": {
                                pointerEvents: "auto !important",
                                zIndex: 100001,
                                cursor: "pointer !important",
                            },
                            "& *": {
                                pointerEvents: "auto !important",
                            },
                        },
                        "& .ck-link-actions": {
                            zIndex: 100000,
                            pointerEvents: "auto !important",
                            "& button": {
                                pointerEvents: "auto !important",
                                cursor: "pointer !important",
                            },
                        },
                        "& .ck-balloon-panel": {
                            zIndex: "100000 !important",
                            position: "fixed !important",
                            display: "block !important",
                            visibility: "visible !important",
                            opacity: "1 !important",
                            pointerEvents: "auto !important",
                        },
                        "& .ck-balloon": {
                            zIndex: "100000 !important",
                            position: "fixed !important",
                            display: "block !important",
                            visibility: "visible !important",
                            opacity: "1 !important",
                            pointerEvents: "auto !important",
                        },
                        "& .ck-balloon-arrow": {
                            zIndex: "99999 !important",
                        },
                        "& .ck-link-form": {
                            display: "block !important",
                            visibility: "visible !important",
                            opacity: "1 !important",
                            pointerEvents: "auto !important",
                            "& input": {
                                pointerEvents: "auto !important",
                                zIndex: 100001,
                                position: "relative",
                                cursor: "text !important",
                                userSelect: "text !important",
                                "&:not([disabled])": {
                                    pointerEvents: "auto !important",
                                },
                            },
                            "& button": {
                                pointerEvents: "auto !important",
                                zIndex: 100001,
                                position: "relative",
                                cursor: "pointer !important",
                            },
                            "& *": {
                                pointerEvents: "auto !important",
                            },
                        },
                        "& .ck-link-actions": {
                            pointerEvents: "auto !important",
                            "& button": {
                                pointerEvents: "auto !important",
                            },
                        },
                        // Ensure links in content are visible and clickable
                        "& .ck-editor__editable a": {
                            color: theme.palette.mode === "dark" ? "#4FC3F7" : "#1976D2",
                            textDecoration: "underline",
                            cursor: "pointer",
                            "&:hover": {
                                color: theme.palette.mode === "dark" ? "#81D4FA" : "#1565C0",
                            },
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
                                    data={editorData.fa || ""}
                                    disabled={disabled}
                                    onReady={(editor) => {
                                        editorRef.current.fa = editor;
                                        // Set initial data if not already set
                                        if (!editorData.fa && value?.fa) {
                                            editor.setData(value.fa);
                                        }
                                        // Debug: Check if link plugin is available
                                        if (editor.plugins.has('Link')) {
                                            console.log('Link plugin is available');
                                        } else {
                                            console.warn('Link plugin is NOT available');
                                        }
                                    }}
                                    onChange={(event, editor) => {
                                        const data = editor.getData();
                                        // Only update if data actually changed to prevent loops
                                        if (data !== editorData.fa) {
                                            handleChange("fa", data);
                                        }
                                    }}
                                    onFocus={(event, editor) => {
                                        // Preserve selection when editor gains focus
                                        const selection = editor.model.document.selection;
                                        if (selection.rangeCount > 0) {
                                            // Selection is preserved automatically
                                        }
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
                                    data={editorData.en || ""}
                                    disabled={disabled}
                                    onReady={(editor) => {
                                        editorRef.current.en = editor;
                                        // Set initial data if not already set
                                        if (!editorData.en && value?.en) {
                                            editor.setData(value.en);
                                        }
                                        // Debug: Check if link plugin is available
                                        if (editor.plugins.has('Link')) {
                                            console.log('Link plugin is available');
                                        } else {
                                            console.warn('Link plugin is NOT available');
                                        }
                                    }}
                                    onChange={(event, editor) => {
                                        const data = editor.getData();
                                        // Only update if data actually changed to prevent loops
                                        if (data !== editorData.en) {
                                            handleChange("en", data);
                                        }
                                    }}
                                    onFocus={(event, editor) => {
                                        // Preserve selection when editor gains focus
                                        const selection = editor.model.document.selection;
                                        if (selection.rangeCount > 0) {
                                            // Selection is preserved automatically
                                        }
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

            {(getTabError("fa") || getTabError("en") || helperText) && (
                <FormHelperText error={!!(getTabError("fa") || getTabError("en"))}>
                    {getTabErrorMessage("fa") || getTabErrorMessage("en") || helperText || ""}
                </FormHelperText>
            )}
        </Box>
    );
}
