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

export default function MediaUploader({ 
    value = [], 
    onChange, 
    maxFiles = 10, 
    acceptedTypes = ["image/*"], 
    maxSizeInMB = 5, 
    gallery = false, 
    single = false, 
    showPreview = true,
    onUploadSuccess = null
}) {
    const [uploading, setUploading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const fileInputRef = useRef();

    const { useCreateData } = useApi();

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

        setUploading(true);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        try {
            const token = document.cookie.match(/token=([^;]+)/)?.[1];
            if (!token) {
                throw new Error("لطفاً ابتدا وارد شوید");
            }

            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentCompleted = Math.round((e.loaded * 100) / e.total);
                    setUploadProgress((prev) => ({ ...prev, [file.name]: percentCompleted }));
                }
            });

            // Handle response
            xhr.addEventListener('load', () => {
                if (xhr.status === 201 || xhr.status === 200) {
                    try {
                        const result = JSON.parse(xhr.responseText);

                        if (result.success) {
                            const newFile = {
                                _id: result.data.media._id,
                                id: result.data.media._id,
                                url: result.data.media.url,
                                originalName: result.data.media.originalName,
                                name: result.data.media.originalName,
                                mimeType: result.data.media.mimeType,
                                type: result.data.media.mimeType,
                                fileType: result.data.media.fileType,
                                size: result.data.media.size,
                                thumbnailUrl: result.data.media.thumbnailUrl,
                                dimensions: result.data.media.dimensions,
                                alt: result.data.media.altText?.fa || "",
                                caption: result.data.media.caption?.fa || "",
                            };

                            if (single) {
                                onChange([newFile]);
                            } else {
                                onChange([...value, newFile]);
                            }

                            // Call onUploadSuccess callback if provided
                            if (onUploadSuccess) {
                                onUploadSuccess([newFile]);
                            }

                            toast.success(`${file.name} آپلود شد`);
                        } else {
                            throw new Error(result.message || "خطا در آپلود فایل");
                        }
                    } catch (parseError) {
                        console.error("Parse error:", parseError);
                        throw new Error("خطا در پردازش پاسخ سرور");
                    }
                } else {
                    throw new Error(`خطای سرور: ${xhr.status}`);
                }
            });

            xhr.addEventListener('error', () => {
                throw new Error("خطا در ارتباط با سرور");
            });

            xhr.open('POST', '/api/v1/media/upload');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error.message || `خطا در آپلود ${file.name}`);
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
