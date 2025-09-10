"use client";
import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Stack,
    Avatar,
    Tooltip,
    Menu,
    MenuList,
    MenuItem as MenuItemComponent,
    ListItemIcon,
    ListItemText,
    Alert,
} from "@mui/material";
import {
    CloudUpload,
    Delete,
    Edit,
    Download,
    Share,
    FilterList,
    ViewList,
    ViewModule,
    MoreVert,
    Image,
    VideoFile,
    PictureAsPdf,
    Description,
    Folder,
    FolderOpen,
    Add,
    Search,
} from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import MediaUploader from "@/components/media/MediaUploader";
import GalleryManager from "@/components/media/GalleryManager";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatFileSize } from "@/lib/utils";

export default function MediaPage() {
    const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingFile, setEditingFile] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [contextFile, setContextFile] = useState(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { useFetchData, useUpdateData, useDeleteData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
        }
        if (typeFilter !== "all") {
            params.append("type", typeFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, typeFilter]);

    const endpoint = `/media${queryParams ? `?${queryParams}` : ""}`;

    // Fetch media files
    const { data: mediaData, isLoading, refetch } = useFetchData(["media", queryParams], endpoint);

    // Update media
    const updateMedia = useUpdateData("/media", {
        successMessage: "فایل با موفقیت به‌روزرسانی شد",
        onSuccess: () => refetch(),
    });

    // Delete media
    const deleteMedia = useDeleteData("/media", {
        successMessage: "فایل با موفقیت حذف شد",
        onSuccess: () => refetch(),
    });

    const files = mediaData?.data || [];

    const handleFileSelect = (fileId) => {
        setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]));
    };

    const handleSelectAll = () => {
        if (selectedFiles.length === files.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(files.map((file) => file._id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedFiles.length === 0) return;

        try {
            await Promise.all(selectedFiles.map((id) => deleteMedia.mutateAsync({ id })));
            setSelectedFiles([]);
        } catch (error) {
            console.error("خطا در حذف فایل‌ها:", error);
        }
    };

    const handleContextMenu = (event, file) => {
        event.preventDefault();
        setContextFile(file);
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setContextFile(null);
    };

    const handleEdit = (file) => {
        setEditingFile(file);
        setEditDialogOpen(true);
        handleMenuClose();
    };

    const handleDelete = async (file) => {
        try {
            await deleteMedia.mutateAsync({ id: file._id });
        } catch (error) {
            console.error("خطا در حذف فایل:", error);
        }
        handleMenuClose();
    };

    const handleDownload = (file) => {
        window.open(file.url, "_blank");
        handleMenuClose();
    };

    const getFileIcon = (type) => {
        if (type?.startsWith("image/")) return <Image />;
        if (type?.startsWith("video/")) return <VideoFile />;
        if (type === "application/pdf") return <PictureAsPdf />;
        return <Description />;
    };

    const getFileTypeColor = (type) => {
        if (type?.startsWith("image/")) return "primary";
        if (type?.startsWith("video/")) return "secondary";
        if (type === "application/pdf") return "error";
        return "default";
    };

    const fileTypes = [
        { value: "all", label: "همه فایل‌ها" },
        { value: "image", label: "تصاویر" },
        { value: "video", label: "ویدیوها" },
        { value: "document", label: "اسناد" },
        { value: "other", label: "سایر" },
    ];

    if (isLoading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography>در حال بارگذاری...</Typography>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            مدیریت رسانه
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            مدیریت فایل‌ها، تصاویر و اسناد
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadDialogOpen(true)}>
                        آپلود فایل
                    </Button>
                </Box>

                {/* Controls */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="جستجو در فایل‌ها..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>نوع فایل</InputLabel>
                                    <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="نوع فایل">
                                        {fileTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={5}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        {selectedFiles.length > 0 && (
                                            <Button color="error" startIcon={<Delete />} onClick={handleDeleteSelected} size="small">
                                                حذف انتخاب شده ({selectedFiles.length})
                                            </Button>
                                        )}
                                    </Box>

                                    <Box>
                                        <IconButton onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>{viewMode === "grid" ? <ViewList /> : <ViewModule />}</IconButton>
                                        <Button size="small" onClick={handleSelectAll}>
                                            {selectedFiles.length === files.length ? "لغو انتخاب" : "انتخاب همه"}
                                        </Button>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Files Display */}
                {files.length === 0 ? (
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 8 }}>
                            <Folder sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                هیچ فایلی یافت نشد
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                برای شروع، اولین فایل خود را آپلود کنید
                            </Typography>
                            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadDialogOpen(true)}>
                                آپلود فایل
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Grid container spacing={2}>
                        {files.map((file) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={file._id}>
                                <Card
                                    sx={{
                                        cursor: "pointer",
                                        border: selectedFiles.includes(file._id) ? 2 : 1,
                                        borderColor: selectedFiles.includes(file._id) ? "primary.main" : "divider",
                                        transition: "all 0.2s",
                                    }}
                                    onClick={() => handleFileSelect(file._id)}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                >
                                    {/* File Preview */}
                                    {file.type?.startsWith("image/") ? (
                                        <CardMedia component="img" height="200" image={file.url} alt={file.originalName} sx={{ objectFit: "cover" }} />
                                    ) : (
                                        <Box
                                            sx={{
                                                height: 200,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                bgcolor: "grey.100",
                                            }}
                                        >
                                            {getFileIcon(file.type)}
                                        </Box>
                                    )}

                                    <CardContent>
                                        <Typography variant="subtitle2" noWrap>
                                            {file.originalName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Chip label={file.type?.split("/")[0] || "unknown"} size="small" color={getFileTypeColor(file.type)} variant="outlined" />
                                        </Box>
                                    </CardContent>

                                    <CardActions>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(file);
                                            }}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(file);
                                            }}
                                        >
                                            <Download />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file);
                                            }}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Context Menu */}
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItemComponent onClick={() => handleEdit(contextFile)}>
                        <ListItemIcon>
                            <Edit />
                        </ListItemIcon>
                        <ListItemText>ویرایش</ListItemText>
                    </MenuItemComponent>
                    <MenuItemComponent onClick={() => handleDownload(contextFile)}>
                        <ListItemIcon>
                            <Download />
                        </ListItemIcon>
                        <ListItemText>دانلود</ListItemText>
                    </MenuItemComponent>
                    <MenuItemComponent onClick={() => handleDelete(contextFile)}>
                        <ListItemIcon>
                            <Delete />
                        </ListItemIcon>
                        <ListItemText>حذف</ListItemText>
                    </MenuItemComponent>
                </Menu>

                {/* Upload Dialog */}
                <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="lg" fullWidth>
                    <DialogTitle>آپلود فایل جدید</DialogTitle>
                    <DialogContent>
                        <MediaUploader
                            onUploadSuccess={() => {
                                setUploadDialogOpen(false);
                                refetch();
                            }}
                            multiple
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUploadDialogOpen(false)}>بستن</Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>ویرایش فایل</DialogTitle>
                    <DialogContent>
                        {editingFile && (
                            <EditFileForm
                                file={editingFile}
                                onSave={(data) => {
                                    updateMedia.mutate({
                                        id: editingFile._id,
                                        data,
                                    });
                                    setEditDialogOpen(false);
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        </Layout>
    );
}

// Edit File Form Component
function EditFileForm({ file, onSave }) {
    const [formData, setFormData] = useState({
        originalName: file.originalName || "",
        alt: file.alt || "",
        description: file.description || "",
        tags: file.tags?.join(", ") || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            tags: formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TextField fullWidth label="نام فایل" value={formData.originalName} onChange={(e) => setFormData((prev) => ({ ...prev, originalName: e.target.value }))} />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="متن جایگزین (Alt)"
                        value={formData.alt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, alt: e.target.value }))}
                        helperText="برای تصاویر استفاده می‌شود"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="توضیحات" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="برچسب‌ها"
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="برچسب‌ها را با کاما جدا کنید"
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button type="submit" variant="contained" fullWidth>
                        ذخیره تغییرات
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
}
