"use client";
import { useState } from "react";
import { Box, Button, TextField, Stack, Chip, IconButton, ImageList, ImageListItem, ImageListItemBar } from "@mui/material";
import { Image, Delete, Edit, Add } from "@mui/icons-material";
import MediaLibrary from "./MediaLibrary";
import ImageEditor from "./ImageEditor";

/**
 * Media Picker Component
 * A simple field component for selecting media (like WordPress)
 * 
 * Usage:
 * <MediaPicker
 *   value={imageUrl}
 *   onChange={(url) => setImageUrl(url)}
 *   label="تصویر شاخص"
 *   accept="image/*"
 * />
 */
export default function MediaPicker({
    value,
    onChange,
    label = "انتخاب فایل",
    accept = "image/*",
    multiple = false,
    maxFiles = 1,
    showPreview = true,
    showEdit = true,
    optimizeForWeb = false, // Convert images to WebP for better SEO and performance
    compact = false, // Compact mode: only show button, no preview
    buttonProps = {}, // Custom button props
}) {
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState(null);

    const handleSelect = (selected) => {
        if (multiple) {
            onChange(Array.isArray(selected) ? selected : [selected]);
        } else {
            onChange(selected);
        }
        setLibraryOpen(false);
    };

    const handleRemove = () => {
        onChange(multiple ? [] : null);
    };

    const handleEdit = (item) => {
        setEditingImage(item);
        setEditorOpen(true);
    };

    const handleEditorSave = (editedImage) => {
        if (multiple) {
            const updated = Array.isArray(value) 
                ? value.map((v) => (v._id === editedImage._id ? editedImage : v))
                : [editedImage];
            onChange(updated);
        } else {
            onChange(editedImage);
        }
        setEditorOpen(false);
        setEditingImage(null);
    };

    // Normalize value: handle both string URLs and objects
    const normalizeValue = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
            // If it's a string URL, return it as-is (will be handled in preview)
            return val;
        }
        if (typeof val === 'object' && val.url) {
            return val;
        }
        return val;
    };

    const normalizedValue = normalizeValue(value);
    const displayValue = multiple 
        ? (Array.isArray(normalizedValue) ? normalizedValue : []) 
        : (normalizedValue ? [normalizedValue] : []);

    // In compact mode, return only the button (for use in ButtonGroup)
    if (compact) {
        return (
            <>
                <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setLibraryOpen(true)}
                    {...buttonProps}
                >
                    {value ? "تغییر فایل" : label}
                </Button>
                <MediaLibrary
                    open={libraryOpen}
                    onClose={() => setLibraryOpen(false)}
                    onSelect={handleSelect}
                    multiple={multiple}
                    maxFiles={maxFiles}
                    acceptedTypes={Array.isArray(accept) ? accept : [accept]}
                    title={label}
                    showUpload={true}
                    optimizeForWeb={optimizeForWeb}
                />
                {editorOpen && editingImage && (
                    <ImageEditor
                        open={editorOpen}
                        onClose={() => {
                            setEditorOpen(false);
                            setEditingImage(null);
                        }}
                        image={editingImage}
                        onSave={handleEditorSave}
                    />
                )}
            </>
        );
    }

    return (
        <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setLibraryOpen(true)}
                    sx={{ flex: 1, ...buttonProps.sx }}
                    {...buttonProps}
                >
                    {value ? "تغییر فایل" : label}
                </Button>
                {value && (
                    <IconButton color="error" onClick={handleRemove}>
                        <Delete />
                    </IconButton>
                )}
            </Stack>

            {/* Preview */}
            {showPreview && !compact && displayValue.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    {(() => {
                        const item = displayValue[0];
                        const isString = typeof item === 'string';
                        const isImage = isString 
                            ? item.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) 
                            : (item?.fileType === "image" || item?.mimeType?.startsWith("image/"));
                        const imageUrl = isString ? item : (item?.url || item);
                        const imageAlt = isString ? "Preview" : (item?.originalName || item?.alt || "Preview");
                        
                        return isImage ? (
                            <Box sx={{ position: "relative", display: "inline-block" }}>
                                <img
                                    src={imageUrl}
                                    alt={imageAlt}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: 300,
                                        borderRadius: 8,
                                        objectFit: "contain",
                                    }}
                                />
                                {showEdit && !isString && item?._id && (
                                    <IconButton
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            bgcolor: "background.paper",
                                        }}
                                        onClick={() => handleEdit(item)}
                                    >
                                        <Edit />
                                    </IconButton>
                                )}
                            </Box>
                        ) : (
                            <Chip
                                icon={<Image />}
                                label={isString ? "فایل انتخاب شده" : (item?.originalName || "فایل انتخاب شده")}
                                onDelete={handleRemove}
                            />
                        );
                    })()}
                </Box>
            )}

            {/* Multiple Files Preview */}
            {multiple && displayValue.length > 1 && (
                <ImageList sx={{ width: "100%", height: 200 }} cols={3} rowHeight={150}>
                    {displayValue.map((item, index) => (
                        <ImageListItem key={item._id || index}>
                            <img
                                src={item.url || item}
                                alt={item.originalName || `File ${index + 1}`}
                                style={{ objectFit: "cover", cursor: "pointer" }}
                            />
                            <ImageListItemBar
                                title={item.originalName || `File ${index + 1}`}
                                actionIcon={
                                    <IconButton
                                        sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                                        onClick={() => {
                                            const updated = displayValue.filter((_, i) => i !== index);
                                            onChange(updated);
                                        }}
                                    >
                                        <Delete />
                                    </IconButton>
                                }
                            />
                        </ImageListItem>
                    ))}
                </ImageList>
            )}

            {/* Media Library Dialog */}
            <MediaLibrary
                open={libraryOpen}
                onClose={() => setLibraryOpen(false)}
                onSelect={handleSelect}
                multiple={multiple}
                maxFiles={maxFiles}
                acceptedTypes={Array.isArray(accept) ? accept : [accept]}
                title={label}
                optimizeForWeb={optimizeForWeb}
            />

            {/* Image Editor Dialog */}
            {editorOpen && editingImage && (
                <ImageEditor
                    open={editorOpen}
                    onClose={() => {
                        setEditorOpen(false);
                        setEditingImage(null);
                    }}
                    image={editingImage}
                    onSave={handleEditorSave}
                />
            )}
        </Box>
    );
}

