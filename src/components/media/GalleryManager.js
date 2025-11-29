"use client";
import { Box, Grid, TextField, IconButton, Typography, Paper, Tooltip, Chip } from "@mui/material";
import { Delete, Edit, DragIndicator, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import MediaUploader from "./MediaUploader";

export default function GalleryManager({ value = [], onChange, showAltText = true, showCaptions = true, sortable = true }) {
    const [editingIndex, setEditingIndex] = useState(null);

    const updateGalleryItem = (index, updates) => {
        const newGallery = value.map((item, i) => (i === index ? { ...item, ...updates } : item));
        onChange(newGallery);
    };

    const removeGalleryItem = (index) => {
        const newGallery = value.filter((_, i) => i !== index);
        onChange(newGallery);
    };

    const moveItem = (fromIndex, toIndex) => {
        const newGallery = [...value];
        const [moved] = newGallery.splice(fromIndex, 1);
        newGallery.splice(toIndex, 0, moved);
        onChange(newGallery);
    };

    return (
        <Box>
            {/* Media Uploader */}
            <MediaUploader value={value} onChange={onChange} gallery={true} acceptedTypes={["image/*", "video/*"]} maxFiles={20} />

            {/* Gallery Items Editor */}
            {value.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        مدیریت گالری
                    </Typography>

                    <Grid container spacing={2}>
                        {value.map((item, index) => (
                            <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={item.id || item.url || index}>
                                <Paper 
                                    sx={{ 
                                        p: 2,
                                        "&:hover": {
                                            boxShadow: 3,
                                        }
                                    }}
                                >
                                    {/* Image Preview */}
                                    <Box sx={{ position: "relative", mb: 2 }}>
                                        {item.type?.startsWith("image/") && item.url ? (
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    height: 200,
                                                    borderRadius: 1,
                                                    overflow: "hidden",
                                                    bgcolor: "grey.100",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <img
                                                    src={item.url}
                                                    alt={item.alt || "تصویر"}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <Box
                                                sx={{
                                                    height: 200,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    bgcolor: "grey.100",
                                                    borderRadius: 1,
                                                }}
                                            >
                                                <Typography variant="body2" color="text.secondary">
                                                    {item.type?.startsWith("video/") ? "فایل ویدیو" : "فایل"}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Controls */}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 8,
                                                right: 8,
                                                display: "flex",
                                                gap: 0.5,
                                            }}
                                        >
                                            {sortable && (
                                                <Tooltip title="جابجایی">
                                                    <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "white" }}>
                                                        <DragIndicator />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            <Tooltip title="حذف">
                                                <IconButton size="small" sx={{ bgcolor: "rgba(255,0,0,0.7)", color: "white" }} onClick={() => removeGalleryItem(index)}>
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    {/* Alt Text */}
                                    {showAltText && (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="متن جایگزین (Alt)"
                                            value={item.alt || ""}
                                            onChange={(e) => updateGalleryItem(index, { alt: e.target.value })}
                                            sx={{ mb: 1 }}
                                        />
                                    )}

                                    {/* Caption */}
                                    {showCaptions && (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="توضیحات"
                                            value={item.caption || ""}
                                            onChange={(e) => updateGalleryItem(index, { caption: e.target.value })}
                                            multiline
                                            rows={2}
                                        />
                                    )}

                                    {/* File Info */}
                                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                        {item.size && !isNaN(item.size) && (
                                            <Chip 
                                                label={`${(item.size / 1024 / 1024).toFixed(2)} MB`} 
                                                size="small" 
                                                variant="outlined" 
                                            />
                                        )}
                                        {item.type && (
                                            <Chip 
                                                label={item.type?.split("/")[1] || "Unknown"} 
                                                size="small" 
                                                variant="outlined" 
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
