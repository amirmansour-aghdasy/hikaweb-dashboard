"use client";
import { useState, useMemo, useEffect } from "react";
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
import BucketManager from "@/components/media/BucketManager";
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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [statistics, setStatistics] = useState(null);
    const [selectedBucket, setSelectedBucket] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState("/");
    const [showBucketManager, setShowBucketManager] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { useFetchData, useUpdateData, useDeleteData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
        }
        if (typeFilter !== "all") {
            params.append("fileType", typeFilter);
        }
        if (selectedBucket) {
            params.append("bucket", selectedBucket);
        }
        if (selectedFolder && selectedFolder !== "/") {
            params.append("folder", selectedFolder);
        }
        return params.toString();
    }, [debouncedSearchTerm, typeFilter, page, limit, selectedBucket, selectedFolder]);

    const endpoint = `/media${queryParams ? `?${queryParams}` : ""}`;

    // Fetch media files
    const { data: mediaData, isLoading, refetch } = useFetchData(["media", queryParams], endpoint);

    // Fetch statistics
    const { data: statisticsData } = useFetchData("media-statistics", "/media/statistics");

    useEffect(() => {
        if (statisticsData?.success && statisticsData.data) {
            setStatistics(statisticsData.data);
        }
    }, [statisticsData]);

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
    
    console.log(files);

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                {/* Statistics Cards */}
                {statistics && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        کل فایل‌ها
                                    </Typography>
                                    <Typography variant="h4">{statistics.total || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        تصاویر
                                    </Typography>
                                    <Typography variant="h4" color="primary.main">
                                        {statistics.byFileType?.image?.count || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        ویدیوها
                                    </Typography>
                                    <Typography variant="h4" color="error.main">
                                        {statistics.byFileType?.video?.count || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        حجم کل
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {formatFileSize(statistics.totalSize || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

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
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Folder />}
                            onClick={() => setShowBucketManager(!showBucketManager)}
                        >
                            {showBucketManager ? "مخفی کردن" : "مدیریت Bucket"}
                        </Button>
                        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadDialogOpen(true)}>
                            آپلود فایل
                        </Button>
                    </Stack>
                </Box>

                {/* Bucket Manager and Content */}
                <Grid container spacing={3}>
                    {showBucketManager && (
                        <Grid size={{ xs: 12, md: 3 }}>
                            <BucketManager
                                selectedBucket={selectedBucket}
                                onBucketSelect={setSelectedBucket}
                                selectedFolder={selectedFolder}
                                onFolderSelect={setSelectedFolder}
                            />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, md: showBucketManager ? 9 : 12 }}>
                        {/* Controls */}
                        <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 4 }}>
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

                            <Grid size={{ xs: 12, md: 3 }}>
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

                            <Grid size={{ xs: 12, md: 5 }}>
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
                                {selectedBucket
                                    ? `در bucket انتخاب شده و پوشه "${selectedFolder}" فایلی وجود ندارد`
                                    : "برای شروع، اولین فایل خود را آپلود کنید"}
                            </Typography>
                            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadDialogOpen(true)}>
                                آپلود فایل
                            </Button>
                        </CardContent>
                    </Card>
                        ) : (
                            <Grid container spacing={2}>
                                {files.map((file) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file._id}>
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
                                    {file.fileType?.startsWith("image") ? (
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
                    </Grid>
                </Grid>

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
                        <Box sx={{ mb: 2 }}>
                            <Alert severity="info">
                                {selectedBucket
                                    ? `فایل‌ها در bucket انتخاب شده و پوشه "${selectedFolder}" آپلود می‌شوند`
                                    : "فایل‌ها در bucket پیش‌فرض آپلود می‌شوند"}
                            </Alert>
                        </Box>
                        <MediaUploader
                            onUploadSuccess={() => {
                                setUploadDialogOpen(false);
                                refetch();
                            }}
                            multiple
                            bucketId={selectedBucket}
                            folder={selectedFolder}
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
                <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="نام فایل" value={formData.originalName} onChange={(e) => setFormData((prev) => ({ ...prev, originalName: e.target.value }))} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="متن جایگزین (Alt)"
                        value={formData.alt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, alt: e.target.value }))}
                        helperText="برای تصاویر استفاده می‌شود"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField fullWidth multiline rows={3} label="توضیحات" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="برچسب‌ها"
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="برچسب‌ها را با کاما جدا کنید"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Button type="submit" variant="contained" fullWidth>
                        ذخیره تغییرات
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
}
