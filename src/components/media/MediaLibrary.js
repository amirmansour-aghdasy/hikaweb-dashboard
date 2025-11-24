"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    IconButton,
    Chip,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Tooltip,
    CircularProgress,
    Alert,
    Pagination,
} from "@mui/material";
import {
    CloudUpload,
    Delete,
    Edit,
    Search,
    FilterList,
    Image,
    VideoFile,
    PictureAsPdf,
    Description,
    Close,
    CheckCircle,
    CheckCircleOutline,
    Add,
    Folder,
    FolderOpen,
} from "@mui/icons-material";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";
import MediaUploader from "./MediaUploader";

/**
 * Media Library Component - WordPress-like media picker
 * 
 * Features:
 * - Browse existing media
 * - Upload new files
 * - Select single or multiple files
 * - Filter by type, folder, date
 * - Search functionality
 * - Grid and List view
 */
export default function MediaLibrary({
    open,
    onClose,
    onSelect,
    multiple = false,
    acceptedTypes = ["image/*"],
    maxFiles = 10,
    title = "انتخاب رسانه",
    showUpload = true,
}) {
    const [activeTab, setActiveTab] = useState(0); // 0: Library, 1: Upload
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedItems, setSelectedItems] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(24);
    const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
    const searchInputRef = useRef(null);

    const debouncedSearch = useDebounce(searchTerm, 500);
    const { useFetchData, useDeleteData } = useApi();

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearch) {
            params.append("search", debouncedSearch);
        }
        if (typeFilter !== "all") {
            params.append("fileType", typeFilter);
        }
        return params.toString();
    }, [debouncedSearch, typeFilter, page, limit]);

    const endpoint = `/media?${queryParams}`;

    // Fetch media
    const { data: mediaData, isLoading, refetch } = useFetchData(["media-library", queryParams], endpoint, {
        enabled: open && activeTab === 0,
    });

    // Delete media
    const deleteMedia = useDeleteData("/media", {
        successMessage: "فایل با موفقیت حذف شد",
        onSuccess: () => refetch(),
    });

    const mediaItems = mediaData?.data || [];
    const pagination = mediaData?.pagination || {};

    // Focus on search input when dialog opens to prevent aria-hidden warning
    useEffect(() => {
        if (open && activeTab === 0) {
            const timer = setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [open, activeTab]);

    const handleSelect = (item) => {
        if (multiple) {
            if (selectedItems.find((i) => i._id === item._id)) {
                setSelectedItems(selectedItems.filter((i) => i._id !== item._id));
            } else {
                if (selectedItems.length >= maxFiles) {
                    toast.error(`حداکثر ${maxFiles} فایل می‌توانید انتخاب کنید`);
                    return;
                }
                setSelectedItems([...selectedItems, item]);
            }
        } else {
            setSelectedItems([item]);
        }
    };

    const handleConfirm = () => {
        if (selectedItems.length === 0) {
            toast.error("لطفاً حداقل یک فایل انتخاب کنید");
            return;
        }
        onSelect(multiple ? selectedItems : selectedItems[0]);
        handleClose();
    };

    const handleClose = () => {
        setSelectedItems([]);
        setSearchTerm("");
        setTypeFilter("all");
        setPage(1);
        setActiveTab(0);
        onClose();
    };

    const handleDelete = async (item, e) => {
        e.stopPropagation();
        if (window.confirm(`آیا از حذف "${item.originalName}" اطمینان دارید؟`)) {
            try {
                await deleteMedia.mutateAsync({ id: item._id });
            } catch (error) {
                console.error("Error deleting media:", error);
            }
        }
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith("image/")) return <Image />;
        if (mimeType?.startsWith("video/")) return <VideoFile />;
        if (mimeType === "application/pdf") return <PictureAsPdf />;
        return <Description />;
    };

    const fileTypes = [
        { value: "all", label: "همه" },
        { value: "image", label: "تصاویر" },
        { value: "video", label: "ویدیوها" },
        { value: "document", label: "اسناد" },
        { value: "other", label: "سایر" },
    ];

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="lg" 
            fullWidth 
            sx={{ "& .MuiDialog-paper": { height: "90vh" } }}
        >
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
                {title}
                <IconButton onClick={handleClose}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                        <Tab label="کتابخانه رسانه" icon={<Image />} iconPosition="start" />
                        {showUpload && <Tab label="آپلود فایل جدید" icon={<CloudUpload />} iconPosition="start" />}
                    </Tabs>
                </Box>

                {/* Library Tab */}
                {activeTab === 0 && (
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        {/* Filters and Search */}
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    inputRef={searchInputRef}
                                    size="small"
                                    placeholder="جستجو..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>نوع فایل</InputLabel>
                                    <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="نوع فایل">
                                        {fileTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {selectedItems.length > 0 && (
                                    <Chip label={`${selectedItems.length} انتخاب شده`} color="primary" />
                                )}
                            </Stack>
                        </Box>

                        {/* Media Grid */}
                        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                            {isLoading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                                    <CircularProgress />
                                </Box>
                            ) : mediaItems.length === 0 ? (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    هیچ فایلی یافت نشد. {showUpload && "برای آپلود فایل جدید، به تب آپلود بروید."}
                                </Alert>
                            ) : (
                                <Grid container spacing={2}>
                                    {mediaItems.map((item) => {
                                        const isSelected = selectedItems.find((i) => i._id === item._id);
                                        return (
                                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item._id}>
                                                <Card
                                                    sx={{
                                                        position: "relative",
                                                        border: isSelected ? 2 : 1,
                                                        borderColor: isSelected ? "primary.main" : "divider",
                                                        cursor: "pointer",
                                                        "&:hover": { boxShadow: 4 },
                                                    }}
                                                    onClick={() => handleSelect(item)}
                                                >
                                                    {/* Selection Checkbox */}
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            top: 8,
                                                            left: 8,
                                                            zIndex: 1,
                                                            bgcolor: "background.paper",
                                                            borderRadius: "50%",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelect(item);
                                                        }}
                                                    >
                                                        {isSelected ? (
                                                            <CheckCircle color="primary" />
                                                        ) : (
                                                            <CheckCircleOutline color="action" />
                                                        )}
                                                    </Box>

                                                    {/* Delete Button */}
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            position: "absolute",
                                                            top: 8,
                                                            right: 8,
                                                            zIndex: 1,
                                                            bgcolor: "background.paper",
                                                            "&:hover": { bgcolor: "error.light", color: "error.main" },
                                                        }}
                                                        onClick={(e) => handleDelete(item, e)}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>

                                                    {/* Media Preview */}
                                                    {item.fileType === "image" ? (
                                                        <CardMedia
                                                            component="img"
                                                            height="150"
                                                            image={item.thumbnailUrl || item.url}
                                                            alt={item.originalName}
                                                            sx={{ objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                height: 150,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                bgcolor: "grey.100",
                                                            }}
                                                        >
                                                            {getFileIcon(item.mimeType)}
                                                        </Box>
                                                    )}

                                                    <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                                                        <Typography variant="caption" noWrap title={item.originalName}>
                                                            {item.originalName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {formatFileSize(item.size)}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Box>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "center" }}>
                                <Pagination
                                    count={pagination.totalPages}
                                    page={pagination.page}
                                    onChange={(e, page) => setPage(page)}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {/* Upload Tab */}
                {activeTab === 1 && showUpload && (
                    <Box sx={{ p: 2, overflow: "auto" }}>
                        <MediaUploader
                            value={[]}
                            onChange={(files) => {
                                // Add uploaded files to selection
                                if (files && files.length > 0) {
                                    setSelectedItems((prev) => [...prev, ...files]);
                                }
                                // Switch to library tab
                                setActiveTab(0);
                                refetch();
                            }}
                            onUploadSuccess={(uploadedFiles) => {
                                // Add uploaded files to selection
                                if (uploadedFiles && uploadedFiles.length > 0) {
                                    setSelectedItems((prev) => [...prev, ...uploadedFiles]);
                                }
                                // Switch to library tab
                                setActiveTab(0);
                                refetch();
                            }}
                            multiple={multiple}
                            maxFiles={maxFiles}
                            acceptedTypes={acceptedTypes}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1.5 }}>
                <Button onClick={handleClose}>لغو</Button>
                <Button variant="contained" onClick={handleConfirm} disabled={selectedItems.length === 0}>
                    انتخاب ({selectedItems.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
}

