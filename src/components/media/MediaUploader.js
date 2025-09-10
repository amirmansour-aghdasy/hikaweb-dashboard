"use client";
import {
    Box,
    Button,
    Grid,
    IconButton,
    Typography,
    Paper,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    ImageList,
    ImageListItem,
    ImageListItemBar,
} from "@mui/material";
import { CloudUpload, Delete, Edit, Add, Close, Image, VideoFile, AttachFile, Visibility } from "@mui/icons-material";
import { useState, useRef, useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function MediaUploader({ value = [], onChange, maxFiles = 10, acceptedTypes = ["image/*"], maxSizeInMB = 5, gallery = false, single = false, showPreview = true }) {
    const [uploading, setUploading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const fileInputRef = useRef();

    const { useCreateData } = useApi();

    const uploadMutation = useCreateData("/api/v1/media", {
        successMessage: "فایل با موفقیت آپلود شد",
    });

    const handleFileSelect = useCallback(
        (event) => {
            const files = Array.from(event.target.files);

            if (single && files.length > 1) {
                toast.error("فقط یک فایل انتخاب کنید");
                return;
            }

            if (!single && value.length + files.length > maxFiles) {
                toast.error(`حداکثر ${maxFiles} فایل مجاز است`);
                return;
            }

            files.forEach((file) => {
                // Validate file size
                if (file.size > maxSizeInMB * 1024 * 1024) {
                    toast.error(`حجم ${file.name} بیشتر از ${maxSizeInMB}MB است`);
                    return;
                }

                // Validate file type
                const isValidType = acceptedTypes.some((type) => {
                    if (type.includes("*")) {
                        return file.type.startsWith(type.replace("*", ""));
                    }
                    return file.type === type;
                });

                if (!isValidType) {
                    toast.error(`نوع فایل ${file.name} مجاز نیست`);
                    return;
                }

                uploadFile(file);
            });

            // Reset input
            event.target.value = "";
        },
        [value, maxFiles, maxSizeInMB, acceptedTypes, single]
    );

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", getFileType(file.type));

        setUploading(true);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        try {
            const response = await fetch("/api/v1/media", {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${document.cookie.match(/token=([^;]+)/)?.[1]}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress((prev) => ({ ...prev, [file.name]: percentCompleted }));
                },
            });

            const result = await response.json();

            if (result.success) {
                const newFile = {
                    id: result.data._id,
                    url: result.data.url,
                    name: result.data.originalName,
                    type: result.data.mimeType,
                    size: result.data.size,
                    alt: "",
                    caption: "",
                };

                if (single) {
                    onChange([newFile]);
                } else {
                    onChange([...value, newFile]);
                }

                toast.success(`${file.name} آپلود شد`);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(`خطا در آپلود ${file.name}`);
        } finally {
            setUploading(false);
            setUploadProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
            });
        }
    };

    const getFileType = (mimeType) => {
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        return "document";
    };

    const getFileIcon = (type) => {
        if (type && type.startsWith("image/")) return <Image />;
        if (type && type.startsWith("video/")) return <VideoFile />;
        return <AttachFile />;
    };

    const removeFile = (index) => {
        const newFiles = value.filter((_, i) => i !== index);
        onChange(newFiles);
    };

    const updateFileInfo = (index, updates) => {
        const newFiles = value.map((file, i) => (i === index ? { ...file, ...updates } : file));
        onChange(newFiles);
    };

    const openPreview = (file) => {
        setPreviewFile(file);
        setPreviewOpen(true);
    };

    return (
        <Box>
            {/* Upload Area */}
            <Paper
                sx={{
                    border: "2px dashed",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                    cursor: "pointer",
                    "&:hover": { borderColor: "primary.main", bgcolor: "grey.50" },
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {single ? "فایل خود را انتخاب کنید" : "فایل‌های خود را انتخاب کنید"}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {acceptedTypes.join(", ")} - حداکثر {maxSizeInMB}MB
                </Typography>
                <Button variant="contained" component="span" startIcon={<Add />}>
                    انتخاب فایل
                </Button>
            </Paper>

            <input type="file" ref={fileInputRef} multiple={!single} accept={acceptedTypes.join(",")} onChange={handleFileSelect} style={{ display: "none" }} />

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
                <Box sx={{ mt: 2 }}>
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <Box key={fileName} sx={{ mb: 1 }}>
                            <Typography variant="caption">{fileName}</Typography>
                            <LinearProgress variant="determinate" value={progress} />
                        </Box>
                    ))}
                </Box>
            )}

            {/* File List/Gallery */}
            {value.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        فایل‌های انتخاب شده ({value.length})
                    </Typography>

                    {gallery ? (
                        <ImageList sx={{ width: "100%", height: 400 }} cols={3} rowHeight={200}>
                            {value.map((file, index) => (
                                <ImageListItem key={file.id || index}>
                                    {file.type?.startsWith("image/") ? (
                                        <img src={file.url} alt={file.alt || file.name} style={{ objectFit: "cover", cursor: "pointer" }} onClick={() => openPreview(file)} />
                                    ) : (
                                        <Box
                                            sx={{
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                bgcolor: "grey.100",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => openPreview(file)}
                                        >
                                            {getFileIcon(file.type)}
                                            <Typography variant="caption" sx={{ ml: 1 }}>
                                                {file.name}
                                            </Typography>
                                        </Box>
                                    )}
                                    <ImageListItemBar
                                        title={file.name}
                                        subtitle={file.caption}
                                        actionIcon={
                                            <Box>
                                                <IconButton sx={{ color: "rgba(255, 255, 255, 0.54)" }} onClick={() => openPreview(file)}>
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton sx={{ color: "rgba(255, 255, 255, 0.54)" }} onClick={() => removeFile(index)}>
                                                    <Delete />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    ) : (
                        <Grid container spacing={2}>
                            {value.map((file, index) => (
                                <Grid item xs={12} sm={6} md={4} key={file.id || index}>
                                    <Paper sx={{ p: 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                            {getFileIcon(file.type)}
                                            <Typography variant="subtitle2" sx={{ ml: 1, flex: 1 }}>
                                                {file.name}
                                            </Typography>
                                            <IconButton size="small" onClick={() => removeFile(index)}>
                                                <Delete />
                                            </IconButton>
                                        </Box>

                                        {file.type?.startsWith("image/") && <img src={file.url} alt={file.alt} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 4 }} />}

                                        <Chip label={`${(file.size / 1024 / 1024).toFixed(2)} MB`} size="small" sx={{ mt: 1 }} />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {previewFile?.name}
                    <IconButton onClick={() => setPreviewOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {previewFile?.type?.startsWith("image/") ? (
                        <img src={previewFile.url} alt={previewFile.alt} style={{ width: "100%", height: "auto" }} />
                    ) : (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            {getFileIcon(previewFile?.type || "unknown")}
                            <Typography variant="h6" sx={{ mt: 2 }}>
                                {previewFile?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {previewFile?.type}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>بستن</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
