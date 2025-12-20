"use client";
import { useState, useMemo, Suspense, lazy } from "react";
import { Box, Typography, Chip, Button, Stack, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Paper, Divider } from "@mui/material";
import { VideoLibrary, Publish, UnpublishedSharp, Star, StarBorder, Close, PlayArrow, Visibility, ThumbUp, Bookmark } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageActions } from "@/hooks/usePageActions";
import { formatDate, getPersianValue, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

// Lazy load VideoForm for better performance
const VideoForm = lazy(() => import("@/components/forms/VideoForm"));

export default function VideosPage({ params = {} }) {
    const [editingVideo, setEditingVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const debouncedSearchTerm = useDebounce(searchTerm, 800);
    const { useFetchData, useUpdateData, useDeleteData } = useApi();
    const { canView, canEdit, canDelete, canCreate } = usePageActions("videos");

    // Fetch categories for filter
    const { data: categoriesData } = useFetchData(["categories", "video"], "/categories?type=video&status=active&limit=100");

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
            params.append("search", debouncedSearchTerm);
        }
        if (statusFilter !== "all") {
            const isPublished = statusFilter === "published";
            params.append("isPublished", isPublished.toString());
        }
        if (categoryFilter !== "all") {
            params.append("category", categoryFilter);
        }
        return params.toString();
    }, [debouncedSearchTerm, statusFilter, categoryFilter, page, limit]);

    const endpoint = `/videos?${queryParams}`;

    // Fetch videos with refetch capability
    const { data: videosData, isLoading, refetch } = useFetchData(["videos", queryParams], endpoint);

    // Update video
    const updateVideo = useUpdateData("/videos", {
        successMessage: "ویدئو با موفقیت به‌روزرسانی شد",
        queryKey: "videos",
    });

    // Delete video
    const deleteVideo = useDeleteData("/videos", {
        successMessage: "ویدئو با موفقیت حذف شد",
        queryKey: "videos",
    });

    const formatDuration = (seconds) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const columns = [
        {
            field: "thumbnailUrl",
            headerName: "تصویر",
            width: 100,
            render: (row) => (
                <Avatar 
                    src={row.thumbnailUrl} 
                    variant="rounded" 
                    sx={{ width: 60, height: 40, mx: "auto" }}
                >
                    <VideoLibrary />
                </Avatar>
            ),
            align: "center"
        },
        {
            field: "title",
            headerName: "عنوان",
            flex: 2,
            render: (row) => (
                <Typography variant="body2" fontWeight="bold">
                    {getPersianValue(row.title, "-")}
                </Typography>
            ),
            align: "left"
        },
        {
            field: "duration",
            headerName: "مدت زمان",
            width: 100,
            render: (row) => (
                <Chip 
                    label={formatDuration(row.duration)} 
                    size="small" 
                    icon={<PlayArrow />}
                />
            ),
            align: "center"
        },
        {
            field: "views",
            headerName: "بازدید",
            width: 100,
            render: (row) => (
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                    <Visibility fontSize="small" />
                    <Typography variant="body2">
                        {formatNumber(row.views || 0)}
                    </Typography>
                </Stack>
            ),
            align: "center"
        },
        {
            field: "likes",
            headerName: "لایک",
            width: 80,
            render: (row) => (
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                    <ThumbUp fontSize="small" />
                    <Typography variant="body2">
                        {formatNumber(row.likes || 0)}
                    </Typography>
                </Stack>
            ),
            align: "center"
        },
        {
            field: "author",
            headerName: "سازنده",
            width: 150,
            render: (row) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">
                        {row.author?.name || "-"}
                    </Typography>
                </Box>
            ),
            align: "left"
        },
        {
            field: "isPublished",
            headerName: "وضعیت",
            width: 120,
            render: (row) => (
                <Chip
                    label={row.isPublished ? "منتشر شده" : "پیش‌نویس"}
                    color={row.isPublished ? "success" : "default"}
                    size="small"
                    icon={row.isPublished ? <Publish /> : <UnpublishedSharp />}
                />
            ),
            align: "center"
        },
        {
            field: "isFeatured",
            headerName: "ویژه",
            width: 80,
            render: (row) => (
                row.isFeatured ? (
                    <Star color="warning" />
                ) : (
                    <StarBorder color="disabled" />
                )
            ),
            align: "center"
        },
        {
            field: "publishedAt",
            headerName: "تاریخ انتشار",
            width: 150,
            render: (row) => (
                <Typography variant="body2">
                    {row.publishedAt ? formatDate(row.publishedAt) : "-"}
                </Typography>
            ),
            align: "left"
        }
    ];

    const handleEdit = (video) => {
        setEditingVideo(video);
        setIsModalOpen(true);
    };

    const handleDelete = (video) => {
        setVideoToDelete(video);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!videoToDelete) return;

        try {
            await deleteVideo.mutateAsync(videoToDelete._id);
            setIsDeleteDialogOpen(false);
            setVideoToDelete(null);
            refetch();
        } catch (error) {
            toast.error("خطا در حذف ویدئو");
        }
    };

    const handleTogglePublish = async (video) => {
        try {
            await updateVideo.mutateAsync({
                id: video._id,
                data: { isPublished: !video.isPublished }
            });
            refetch();
        } catch (error) {
            toast.error("خطا در تغییر وضعیت انتشار");
        }
    };

    const handleToggleFeatured = async (video) => {
        try {
            await updateVideo.mutateAsync({
                id: video._id,
                data: { isFeatured: !video.isFeatured }
            });
            refetch();
        } catch (error) {
            toast.error("خطا در تغییر وضعیت ویژه");
        }
    };

    const handlePreview = (video) => {
        setPreviewVideo(video);
        setIsPreviewOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingVideo(null);
        refetch();
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingVideo(null);
    };

    const customActions = (row) => [
        {
            label: "پیش‌نمایش",
            icon: <Visibility />,
            onClick: () => handlePreview(row),
            color: "info"
        },
        {
            label: row.isPublished ? "عدم انتشار" : "انتشار",
            icon: row.isPublished ? <UnpublishedSharp /> : <Publish />,
            onClick: () => handleTogglePublish(row),
            color: row.isPublished ? "warning" : "success"
        },
        {
            label: row.isFeatured ? "حذف از ویژه" : "افزودن به ویژه",
            icon: row.isFeatured ? <StarBorder /> : <Star />,
            onClick: () => handleToggleFeatured(row),
            color: "warning"
        }
    ];

    const filters = [
        {
            key: "status",
            label: "وضعیت",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: "all", label: "همه" },
                { value: "published", label: "منتشر شده" },
                { value: "draft", label: "پیش‌نویس" }
            ]
        },
        {
            key: "category",
            label: "دسته‌بندی",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
                { value: "all", label: "همه" },
                ...(Array.isArray(categoriesData?.data) ? categoriesData.data.map(cat => ({
                    value: cat._id,
                    label: getPersianValue(cat.name)
                })) : [])
            ]
        }
    ];

    const videos = Array.isArray(videosData?.data) ? videosData.data : [];
    const pagination = videosData?.pagination || {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 1
    };

    return (
        <Layout>
            <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" fontWeight="bold">
                        مدیریت ویدئوها
                    </Typography>
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<VideoLibrary />}
                            onClick={() => {
                                setEditingVideo(null);
                                setIsModalOpen(true);
                            }}
                        >
                            افزودن ویدئو جدید
                        </Button>
                    )}
                </Stack>

                <DataTable
                    title="لیست ویدئوها"
                    data={videos}
                    columns={columns}
                    loading={isLoading}
                    pagination={pagination}
                    onPageChange={setPage}
                    onRowsPerPageChange={setLimit}
                    onSearch={setSearchTerm}
                    searchPlaceholder="جستجو در ویدئوها..."
                    onFilter={filters}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    customActions={customActions}
                    enableSelection={false}
                    enableActions={true}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canCreate={canCreate}
                />

                {/* Edit/Create Modal */}
                <Modal
                    open={isModalOpen}
                    onClose={handleCancel}
                    title={editingVideo ? "ویرایش ویدئو" : "افزودن ویدئو جدید"}
                    maxWidth="lg"
                    fullWidth
                >
                    <Suspense fallback={<CircularProgress />}>
                        <VideoForm
                            video={editingVideo}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
                    </Suspense>
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                    <DialogTitle>تأیید حذف</DialogTitle>
                    <DialogContent>
                        <Typography>
                            آیا از حذف ویدئو "{getPersianValue(videoToDelete?.title)}" اطمینان دارید؟
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsDeleteDialogOpen(false)}>انصراف</Button>
                        <Button onClick={confirmDelete} color="error" variant="contained">
                            حذف
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Preview Dialog */}
                <Dialog 
                    open={isPreviewOpen} 
                    onClose={() => setIsPreviewOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">
                                {getPersianValue(previewVideo?.title)}
                            </Typography>
                            <Button onClick={() => setIsPreviewOpen(false)}>
                                <Close />
                            </Button>
                        </Stack>
                    </DialogTitle>
                    <DialogContent>
                        {previewVideo && (
                            <Stack spacing={2}>
                                {previewVideo.thumbnailUrl && (
                                    <Box
                                        component="img"
                                        src={previewVideo.thumbnailUrl}
                                        alt={getPersianValue(previewVideo.title)}
                                        sx={{ width: "100%", borderRadius: 2 }}
                                    />
                                )}
                                <Divider />
                                <Typography variant="body2" color="text.secondary">
                                    <strong>مدت زمان:</strong> {formatDuration(previewVideo.duration)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>بازدید:</strong> {formatNumber(previewVideo.views || 0)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>لایک:</strong> {formatNumber(previewVideo.likes || 0)}
                                </Typography>
                                {previewVideo.shortDescription && (
                                    <>
                                        <Divider />
                                        <Typography variant="body2">
                                            {getPersianValue(previewVideo.shortDescription)}
                                        </Typography>
                                    </>
                                )}
                                <Divider />
                                <Button
                                    variant="contained"
                                    fullWidth
                                    href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://hikaweb.ir"}/theater/${previewVideo.slug?.fa || previewVideo.slug?.en || previewVideo.slug}`}
                                    target="_blank"
                                    startIcon={<PlayArrow />}
                                >
                                    مشاهده در سایت
                                </Button>
                            </Stack>
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        </Layout>
    );
}

