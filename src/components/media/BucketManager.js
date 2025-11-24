"use client";
import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Stack,
    Divider,
    Alert,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemSecondaryAction,
    Breadcrumbs,
    Link,
} from "@mui/material";
import {
    Storage,
    Add,
    Delete,
    Folder,
    FolderOpen,
    NavigateNext,
    Home,
} from "@mui/icons-material";
import { useApi } from "@/hooks/useApi";
import { formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BucketManager({ selectedBucket, onBucketSelect, selectedFolder, onFolderSelect }) {
    const [buckets, setBuckets] = useState([]);
    const [folders, setFolders] = useState([]);
    const [createBucketDialog, setCreateBucketDialog] = useState(false);
    const [createFolderDialog, setCreateFolderDialog] = useState(false);
    const [folderPath, setFolderPath] = useState("/");
    const [newBucket, setNewBucket] = useState({
        name: "",
        displayName: "",
        description: "",
        region: "ir-thr-at1",
        isPublic: false,
    });

    const { useFetchData, useCreateData, useDeleteData } = useApi();

    // Fetch buckets
    const { data: bucketsData, refetch: refetchBuckets } = useFetchData("buckets", "/media/buckets");
    const { data: foldersData, refetch: refetchFolders } = useFetchData(
        ["folders", selectedBucket, folderPath],
        selectedBucket ? `/media/buckets/${selectedBucket}/folders?parentFolder=${encodeURIComponent(folderPath)}` : null,
        { enabled: !!selectedBucket }
    );

    const createBucket = useCreateData("/media/buckets", {
        successMessage: "Bucket با موفقیت ایجاد شد",
        onSuccess: () => {
            setCreateBucketDialog(false);
            setNewBucket({ name: "", displayName: "", description: "", region: "ir-thr-at1", isPublic: false });
            refetchBuckets();
        },
    });

    const createFolder = useCreateData("/media/folders", {
        successMessage: "پوشه با موفقیت ایجاد شد",
        onSuccess: () => {
            setCreateFolderDialog(false);
            refetchFolders();
        },
    });

    const deleteBucket = useDeleteData("/media/buckets", {
        successMessage: "Bucket با موفقیت حذف شد",
        onSuccess: () => refetchBuckets(),
    });

    useEffect(() => {
        if (bucketsData?.success && bucketsData.data) {
            setBuckets(bucketsData.data);
        }
    }, [bucketsData]);

    useEffect(() => {
        if (foldersData?.success && foldersData.data?.folders) {
            setFolders(foldersData.data.folders);
        }
    }, [foldersData]);

    const handleCreateBucket = () => {
        if (!newBucket.name || !newBucket.displayName) {
            toast.error("نام و نام نمایشی bucket الزامی است");
            return;
        }

        createBucket.mutate(newBucket);
    };

    const handleCreateFolder = () => {
        if (!selectedBucket) {
            toast.error("ابتدا یک bucket انتخاب کنید");
            return;
        }

        const folderName = prompt("نام پوشه را وارد کنید:");
        if (!folderName) return;

        const fullPath = folderPath === "/" ? `/${folderName}` : `${folderPath}/${folderName}`;
        createFolder.mutate({
            path: fullPath,
            bucketId: selectedBucket,
        });
    };

    const handleBucketSelect = (bucketId) => {
        onBucketSelect(bucketId);
        setFolderPath("/");
        onFolderSelect("/");
    };

    const handleFolderClick = (folder) => {
        onFolderSelect(folder);
        setFolderPath(folder);
    };

    const handleFolderUp = () => {
        if (folderPath === "/") return;
        const parentPath = folderPath.split("/").slice(0, -1).join("/") || "/";
        setFolderPath(parentPath);
        onFolderSelect(parentPath);
    };

    const getFolderBreadcrumbs = () => {
        if (folderPath === "/") return ["/"];
        return folderPath.split("/").filter(Boolean);
    };

    return (
        <Box>
            {/* Buckets List */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Bucket ها</Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setCreateBucketDialog(true)}
                        >
                            ایجاد Bucket
                        </Button>
                    </Box>

                    {buckets.length === 0 ? (
                        <Alert severity="info">هیچ bucket ای وجود ندارد</Alert>
                    ) : (
                        <List>
                            {buckets.map((bucket) => (
                                <ListItem
                                    key={bucket._id}
                                    disablePadding
                                    sx={{ mb: 0.5 }}
                                >
                                    <ListItemButton
                                        selected={selectedBucket === bucket._id}
                                        onClick={() => handleBucketSelect(bucket._id)}
                                        sx={{
                                            borderRadius: 1,
                                            "&.Mui-selected": {
                                                bgcolor: "primary.light",
                                                "&:hover": {
                                                    bgcolor: "primary.light",
                                                },
                                            },
                                        }}
                                    >
                                        <Storage sx={{ mr: 2, color: "primary.main" }} />
                                        <ListItemText
                                            primary={bucket.displayName}
                                            secondary={
                                                <>
                                                    <Typography variant="caption" component="span" display="block">
                                                        {bucket.name} • {bucket.region}
                                                    </Typography>
                                                    <Typography variant="caption" component="span" display="block" color="text.secondary">
                                                        {bucket.totalFiles} فایل • {formatFileSize(bucket.totalSize || 0)}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItemButton>
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`آیا از حذف bucket "${bucket.displayName}" اطمینان دارید؟`)) {
                                                    deleteBucket.mutate(bucket._id);
                                                }
                                            }}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* Folders List */}
            {selectedBucket && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6">پوشه‌ها</Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleCreateFolder}
                            >
                                ایجاد پوشه
                            </Button>
                        </Box>

                        {/* Breadcrumbs */}
                        {folderPath !== "/" && (
                            <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => {
                                        setFolderPath("/");
                                        onFolderSelect("/");
                                    }}
                                    sx={{ display: "flex", alignItems: "center" }}
                                >
                                    <Home fontSize="small" sx={{ mr: 0.5 }} />
                                    ریشه
                                </Link>
                                {getFolderBreadcrumbs().map((part, index) => {
                                    const path = "/" + getFolderBreadcrumbs().slice(0, index + 1).join("/");
                                    return (
                                        <Link
                                            key={path}
                                            component="button"
                                            variant="body2"
                                            onClick={() => {
                                                setFolderPath(path);
                                                onFolderSelect(path);
                                            }}
                                        >
                                            {part}
                                        </Link>
                                    );
                                })}
                            </Breadcrumbs>
                        )}

                        {folders.length === 0 ? (
                            <Alert severity="info">هیچ پوشه‌ای وجود ندارد</Alert>
                        ) : (
                            <List>
                                {folderPath !== "/" && (
                                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                                        <ListItemButton
                                            onClick={handleFolderUp}
                                            sx={{ borderRadius: 1 }}
                                        >
                                            <FolderOpen sx={{ mr: 2, color: "text.secondary" }} />
                                            <ListItemText primary=".." secondary="بازگشت" />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {folders.map((folder, index) => (
                                    <ListItem
                                        key={index}
                                        disablePadding
                                        sx={{ mb: 0.5 }}
                                    >
                                        <ListItemButton
                                            selected={selectedFolder === folder}
                                            onClick={() => handleFolderClick(folder)}
                                            sx={{
                                                borderRadius: 1,
                                                "&.Mui-selected": {
                                                    bgcolor: "action.selected",
                                                },
                                            }}
                                        >
                                            <Folder sx={{ mr: 2, color: "primary.main" }} />
                                            <ListItemText
                                                primary={folder.split("/").filter(Boolean).pop() || folder}
                                                secondary={folder}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Create Bucket Dialog */}
            <Dialog open={createBucketDialog} onClose={() => setCreateBucketDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>ایجاد Bucket جدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="نام Bucket"
                            value={newBucket.name}
                            onChange={(e) =>
                                setNewBucket({ ...newBucket, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                            }
                            helperText="فقط حروف کوچک، اعداد و خط تیره مجاز است"
                            required
                        />
                        <TextField
                            fullWidth
                            label="نام نمایشی"
                            value={newBucket.displayName}
                            onChange={(e) => setNewBucket({ ...newBucket, displayName: e.target.value })}
                            required
                        />
                        <TextField
                            fullWidth
                            label="توضیحات"
                            value={newBucket.description}
                            onChange={(e) => setNewBucket({ ...newBucket, description: e.target.value })}
                            multiline
                            rows={3}
                        />
                        <FormControl fullWidth>
                            <InputLabel>منطقه</InputLabel>
                            <Select
                                value={newBucket.region}
                                onChange={(e) => setNewBucket({ ...newBucket, region: e.target.value })}
                                label="منطقه"
                            >
                                <MenuItem value="ir-thr-at1">سیمین (ir-thr-at1)</MenuItem>
                                <MenuItem value="ir-tbz-sh1">شهریار (ir-tbz-sh1)</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>دسترسی</InputLabel>
                            <Select
                                value={newBucket.isPublic ? "public" : "private"}
                                onChange={(e) => setNewBucket({ ...newBucket, isPublic: e.target.value === "public" })}
                                label="دسترسی"
                            >
                                <MenuItem value="private">خصوصی</MenuItem>
                                <MenuItem value="public">عمومی</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateBucketDialog(false)}>انصراف</Button>
                    <Button variant="contained" onClick={handleCreateBucket}>
                        ایجاد
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

