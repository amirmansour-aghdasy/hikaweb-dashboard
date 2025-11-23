"use client";
import { useState, useCallback } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Slider,
    Typography,
    Stack,
    IconButton,
    Tabs,
    Tab,
    Grid,
    Chip,
} from "@mui/material";
import { Close, Crop, Filter, Adjust, Save, RotateLeft, RotateRight, Flip, FlipCameraAndroid } from "@mui/icons-material";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/imageUtils";
import { useApi } from "@/hooks/useApi";
import toast from "react-hot-toast";

/**
 * Image Editor Component
 * Provides image editing capabilities: crop, resize, rotate, filters
 */
export default function ImageEditor({ open, onClose, image, onSave }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [processing, setProcessing] = useState(false);

    const { useUpdateData } = useApi();

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!image) {
            toast.error("لطفاً تصویر را انتخاب کنید");
            return;
        }

        setProcessing(true);
        try {
            // If crop is applied, create cropped image
            let editedImageBlob = null;
            if (croppedAreaPixels && activeTab === 0) {
                editedImageBlob = await getCroppedImg(
                    imageUrl,
                    croppedAreaPixels,
                    rotation,
                    flip
                );
            }

            // Send to backend for processing
            const formData = new FormData();
            if (editedImageBlob) {
                formData.append('file', editedImageBlob, `edited-${image.originalName || image.filename || 'image.jpg'}`);
            }
            if (croppedAreaPixels) {
                formData.append('crop', JSON.stringify(croppedAreaPixels));
            }
            formData.append('rotation', rotation.toString());
            formData.append('flip', JSON.stringify(flip));
            formData.append('filters', JSON.stringify({
                brightness,
                contrast,
                saturation
            }));

            const token = document.cookie.match(/token=([^;]+)/)?.[1];
            if (!token) {
                throw new Error("لطفاً ابتدا وارد شوید");
            }

            const response = await fetch(`/api/v1/media/${image._id || image.id}/edit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                toast.success("تصویر با موفقیت ویرایش شد");
                onSave(result.data.media);
                onClose();
            } else {
                throw new Error(result.message || "خطا در ویرایش تصویر");
            }
        } catch (error) {
            toast.error(error.message || "خطا در ویرایش تصویر");
            console.error("Image editing error:", error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setFlip({ horizontal: false, vertical: false });
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    };

    const imageUrl = image?.url || image;

    if (!imageUrl) return null;

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="lg" 
            fullWidth
            disableEnforceFocus
            disableAutoFocus
        >
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                ویرایش تصویر
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                    <Tab icon={<Crop />} label="برش" />
                    <Tab icon={<Adjust />} label="تنظیمات" />
                    <Tab icon={<Filter />} label="فیلترها" />
                </Tabs>

                {/* Crop Tab */}
                {activeTab === 0 && (
                    <Box sx={{ position: "relative", height: 400, bgcolor: "grey.900" }}>
                        <Cropper
                            image={imageUrl}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={undefined} // Free aspect ratio
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                            flip={flip}
                        />
                    </Box>
                )}

                {/* Adjustments Tab */}
                {activeTab === 1 && (
                    <Box>
                        <Box sx={{ position: "relative", height: 400, bgcolor: "grey.900", mb: 3 }}>
                            <img
                                src={imageUrl}
                                alt="Preview"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    filter: `
                                        brightness(${brightness}%) 
                                        contrast(${contrast}%) 
                                        saturate(${saturation}%)
                                    `,
                                    transform: `
                                        rotate(${rotation}deg) 
                                        scaleX(${flip.horizontal ? -1 : 1}) 
                                        scaleY(${flip.vertical ? -1 : 1})
                                    `,
                                }}
                            />
                        </Box>

                        <Stack spacing={3}>
                            <Box>
                                <Typography gutterBottom>روشنایی: {brightness}%</Typography>
                                <Slider
                                    value={brightness}
                                    onChange={(e, v) => setBrightness(v)}
                                    min={0}
                                    max={200}
                                    step={1}
                                />
                            </Box>

                            <Box>
                                <Typography gutterBottom>کنتراست: {contrast}%</Typography>
                                <Slider
                                    value={contrast}
                                    onChange={(e, v) => setContrast(v)}
                                    min={0}
                                    max={200}
                                    step={1}
                                />
                            </Box>

                            <Box>
                                <Typography gutterBottom>اشباع رنگ: {saturation}%</Typography>
                                <Slider
                                    value={saturation}
                                    onChange={(e, v) => setSaturation(v)}
                                    min={0}
                                    max={200}
                                    step={1}
                                />
                            </Box>
                        </Stack>
                    </Box>
                )}

                {/* Filters Tab */}
                {activeTab === 2 && (
                    <Box>
                        <Box sx={{ position: "relative", height: 400, bgcolor: "grey.900", mb: 3 }}>
                            <img
                                src={imageUrl}
                                alt="Preview"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    filter: `
                                        brightness(${brightness}%) 
                                        contrast(${contrast}%) 
                                        saturate(${saturation}%)
                                    `,
                                }}
                            />
                        </Box>

                        <Grid container spacing={2}>
                            {[
                                { name: "عادی", filter: "none" },
                                { name: "سیاه و سفید", filter: "grayscale(100%)" },
                                { name: "سپیا", filter: "sepia(100%)" },
                                { name: "نوستالژی", filter: "sepia(50%) contrast(120%)" },
                            ].map((filter) => (
                                <Grid item size={{ xs: 6, sm: 3 }} key={filter.name}>
                                    <Box
                                        sx={{
                                            border: 1,
                                            borderColor: "divider",
                                            borderRadius: 1,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            "&:hover": { borderColor: "primary.main" },
                                        }}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={filter.name}
                                            style={{
                                                width: "100%",
                                                height: 100,
                                                objectFit: "cover",
                                                filter: filter.filter,
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ p: 1, display: "block", textAlign: "center" }}>
                                            {filter.name}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Controls */}
                <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <Button
                            variant="outlined"
                            startIcon={<RotateLeft />}
                            onClick={() => setRotation((prev) => prev - 90)}
                        >
                            چرخش چپ
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RotateRight />}
                            onClick={() => setRotation((prev) => prev + 90)}
                        >
                            چرخش راست
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Flip />}
                            onClick={() => setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }))}
                        >
                            افقی
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FlipCameraAndroid />}
                            onClick={() => setFlip((prev) => ({ ...prev, vertical: !prev.vertical }))}
                        >
                            عمودی
                        </Button>
                        <Button variant="outlined" onClick={handleReset}>
                            بازنشانی
                        </Button>
                    </Stack>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>لغو</Button>
                <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={processing}>
                    {processing ? "در حال پردازش..." : "ذخیره تغییرات"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

