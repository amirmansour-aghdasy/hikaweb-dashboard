"use client";
import { useState, useCallback, useEffect } from "react";
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import { Close, Crop, Filter, Adjust, Save, RotateLeft, RotateRight, Flip, FlipCameraAndroid, ZoomIn, ZoomOut, AspectRatio, Undo, Redo } from "@mui/icons-material";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/imageUtils";
import api from "@/lib/api";
import toast from "react-hot-toast";

/**
 * Image Editor Component
 * Provides advanced image editing capabilities: crop, resize, rotate, filters, aspect ratios
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
    const [aspectRatio, setAspectRatio] = useState(undefined); // undefined = free aspect
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectedFilter, setSelectedFilter] = useState("none");

    // Get image URL
    const imageUrl = image?.url || image;

    // Reset state when image changes
    useEffect(() => {
        if (open && imageUrl) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setFlip({ horizontal: false, vertical: false });
            setCroppedAreaPixels(null);
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
            setAspectRatio(undefined);
            setSelectedFilter("none");
            setHistory([]);
            setHistoryIndex(-1);
        }
    }, [open, imageUrl]);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Aspect ratio presets
    const aspectRatioPresets = [
        { label: "آزاد", value: undefined },
        { label: "مربع (1:1)", value: 1 },
        { label: "افقی (16:9)", value: 16 / 9 },
        { label: "عمودی (9:16)", value: 9 / 16 },
        { label: "4:3", value: 4 / 3 },
        { label: "3:4", value: 3 / 4 },
        { label: "21:9", value: 21 / 9 },
    ];

    // Save state to history for undo/redo
    const saveToHistory = useCallback(() => {
        const currentState = {
            crop,
            zoom,
            rotation,
            flip,
            brightness,
            contrast,
            saturation,
            aspectRatio,
            selectedFilter,
        };
        setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(currentState);
            return newHistory.slice(-20); // Keep last 20 states
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 19));
    }, [crop, zoom, rotation, flip, brightness, contrast, saturation, aspectRatio, selectedFilter, historyIndex]);

    // Undo
    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setCrop(prevState.crop);
            setZoom(prevState.zoom);
            setRotation(prevState.rotation);
            setFlip(prevState.flip);
            setBrightness(prevState.brightness);
            setContrast(prevState.contrast);
            setSaturation(prevState.saturation);
            setAspectRatio(prevState.aspectRatio);
            setSelectedFilter(prevState.selectedFilter);
            setHistoryIndex((prev) => prev - 1);
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setCrop(nextState.crop);
            setZoom(nextState.zoom);
            setRotation(nextState.rotation);
            setFlip(nextState.flip);
            setBrightness(nextState.brightness);
            setContrast(nextState.contrast);
            setSaturation(nextState.saturation);
            setAspectRatio(nextState.aspectRatio);
            setSelectedFilter(nextState.selectedFilter);
            setHistoryIndex((prev) => prev + 1);
        }
    };

    const handleSave = async () => {
        if (!image || !imageUrl) {
            toast.error("لطفاً تصویر را انتخاب کنید");
            return;
        }

        setProcessing(true);
        try {
            // Apply all edits and create final image
            let editedImageBlob = null;
            
            // If crop is applied, create cropped image
            // Note: Due to CORS, we can only crop same-origin images
            // For cross-origin images, we'll send crop data to backend
            if (croppedAreaPixels && activeTab === 0) {
                try {
                    // Try to crop client-side (works for same-origin images)
                    const croppedBlob = await getCroppedImg(
                        imageUrl,
                        croppedAreaPixels,
                        rotation,
                        flip
                    );
                    
                    // If filters are also applied, apply them to the cropped image
                    if (brightness !== 100 || contrast !== 100 || saturation !== 100 || selectedFilter !== "none") {
                        const croppedUrl = URL.createObjectURL(croppedBlob);
                        try {
                            const filteredBlob = await applyFiltersToImage(croppedUrl, {
                                brightness,
                                contrast,
                                saturation,
                                rotation: 0, // Already rotated during crop
                                flip: { horizontal: false, vertical: false }, // Already flipped during crop
                                filter: selectedFilter
                            });
                            editedImageBlob = filteredBlob || croppedBlob;
                        } finally {
                            URL.revokeObjectURL(croppedUrl);
                        }
                    } else {
                        editedImageBlob = croppedBlob;
                    }
                } catch (error) {
                    // If CORS error, we'll send crop data to backend
                    console.warn("Client-side crop failed, sending to backend:", error);
                    editedImageBlob = null;
                }
            } else if (brightness !== 100 || contrast !== 100 || saturation !== 100 || selectedFilter !== "none" || rotation !== 0 || flip.horizontal || flip.vertical) {
                // If only filters/adjustments are applied (no crop), try to process client-side
                try {
                    editedImageBlob = await applyFiltersToImage(imageUrl, {
                        brightness,
                        contrast,
                        saturation,
                        rotation,
                        flip,
                        filter: selectedFilter
                    });
                } catch (error) {
                    console.warn("Client-side filter application failed, backend will process:", error);
                    editedImageBlob = null;
                }
            }

            // Send to backend for processing
            const formData = new FormData();
            if (editedImageBlob) {
                const fileName = image.originalName || image.filename || 'image.jpg';
                formData.append('file', editedImageBlob, `edited-${fileName}`);
            }
            if (croppedAreaPixels) {
                formData.append('crop', JSON.stringify(croppedAreaPixels));
            }
            formData.append('rotation', rotation.toString());
            formData.append('flip', JSON.stringify(flip));
            formData.append('filters', JSON.stringify({
                brightness,
                contrast,
                saturation,
                filter: selectedFilter
            }));

            const mediaId = image._id || image.id;
            if (!mediaId) {
                throw new Error("شناسه تصویر یافت نشد");
            }

            // Use axios directly for multipart/form-data (api interceptor might override Content-Type)
            const token = document.cookie.match(/token=([^;]+)/)?.[1];
            if (!token) {
                throw new Error("لطفاً ابتدا وارد شوید");
            }

            const axios = (await import('axios')).default;
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/media/${mediaId}/edit`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("تصویر با موفقیت ویرایش شد");
                onSave(response.data.data.media);
                onClose();
            } else {
                throw new Error(response.data.message || "خطا در ویرایش تصویر");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "خطا در ویرایش تصویر";
            toast.error(errorMessage);
            console.error("Image editing error:", error);
        } finally {
            setProcessing(false);
        }
    };

    // Apply filters to image and return blob
    // Note: Due to CORS restrictions with cross-origin images,
    // we can only process same-origin images client-side
    // For cross-origin images, we'll send metadata to backend for processing
    const applyFiltersToImage = async (imageSrc, options) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Check if image is from same origin
            const isSameOrigin = !imageSrc.startsWith('http') || 
                                 imageSrc.includes(window.location.hostname) ||
                                 imageSrc.startsWith('/');
            
            if (!isSameOrigin) {
                // For cross-origin images, we can't process client-side due to CORS
                // Backend will handle processing
                resolve(null);
                return;
            }
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('No 2d context'));
                        return;
                    }

                    // Calculate dimensions after rotation
                    let width = img.width;
                    let height = img.height;
                    if (options.rotation % 180 !== 0) {
                        [width, height] = [height, width];
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Apply transformations
                    ctx.save();
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate((options.rotation * Math.PI) / 180);
                    ctx.scale(options.flip?.horizontal ? -1 : 1, options.flip?.vertical ? -1 : 1);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    ctx.restore();

                    // Apply filters using ImageData manipulation (only works for same-origin)
                    try {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        
                        // Apply brightness, contrast, saturation
                        const brightnessFactor = (options.brightness || 100) / 100;
                        const contrastFactor = (options.contrast || 100) / 100;
                        const saturationFactor = (options.saturation || 100) / 100;
                        
                        for (let i = 0; i < data.length; i += 4) {
                            // Brightness
                            data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor));
                            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor));
                            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor));
                            
                            // Contrast
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            data[i] = Math.min(255, Math.max(0, (r - 128) * contrastFactor + 128));
                            data[i + 1] = Math.min(255, Math.max(0, (g - 128) * contrastFactor + 128));
                            data[i + 2] = Math.min(255, Math.max(0, (b - 128) * contrastFactor + 128));
                            
                            // Saturation
                            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                            data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * saturationFactor));
                            data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * saturationFactor));
                            data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * saturationFactor));
                            
                            // Apply additional filter effects
                            if (options.filter && options.filter !== 'none') {
                                if (options.filter.includes('grayscale')) {
                                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                                    data[i] = gray;
                                    data[i + 1] = gray;
                                    data[i + 2] = gray;
                                } else if (options.filter.includes('sepia')) {
                                    const r = data[i];
                                    const g = data[i + 1];
                                    const b = data[i + 2];
                                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                                }
                            }
                        }
                        
                        ctx.putImageData(imageData, 0, 0);
                    } catch (corsError) {
                        // If CORS error, we can't manipulate pixels
                        // Backend will handle processing
                        console.warn("CORS error during pixel manipulation, backend will process:", corsError);
                    }

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Canvas is empty'));
                                return;
                            }
                            resolve(blob);
                        },
                        'image/jpeg',
                        0.95
                    );
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = (error) => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = imageSrc;
        });
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setFlip({ horizontal: false, vertical: false });
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setAspectRatio(undefined);
        setSelectedFilter("none");
        setCroppedAreaPixels(null);
        saveToHistory();
    };

    if (!imageUrl || !open) return null;

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

            <DialogContent sx={{ minHeight: 500 }}>
                {/* Toolbar */}
                <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    <Tooltip title="بازگشت">
                        <span>
                            <IconButton 
                                onClick={handleUndo} 
                                disabled={historyIndex <= 0}
                                size="small"
                            >
                                <Undo />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="بازگشت به جلو">
                        <span>
                            <IconButton 
                                onClick={handleRedo} 
                                disabled={historyIndex >= history.length - 1}
                                size="small"
                            >
                                <Redo />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Box sx={{ flex: 1 }} />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>نسبت تصویر</InputLabel>
                        <Select
                            value={aspectRatio === undefined ? "" : aspectRatio}
                            onChange={(e) => {
                                const value = e.target.value === "" ? undefined : e.target.value;
                                setAspectRatio(value);
                                saveToHistory();
                            }}
                            label="نسبت تصویر"
                        >
                            {aspectRatioPresets.map((preset) => (
                                <MenuItem key={preset.label} value={preset.value || ""}>
                                    {preset.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="بزرگنمایی">
                        <IconButton onClick={() => setZoom((prev) => Math.min(prev + 0.1, 3))} size="small">
                            <ZoomIn />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="کوچکنمایی">
                        <IconButton onClick={() => setZoom((prev) => Math.max(prev - 0.1, 1))} size="small">
                            <ZoomOut />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                    <Tab icon={<Crop />} label="برش" />
                    <Tab icon={<Adjust />} label="تنظیمات" />
                    <Tab icon={<Filter />} label="فیلترها" />
                </Tabs>

                {/* Crop Tab */}
                {activeTab === 0 && (
                    <Box>
                        <Box sx={{ position: "relative", height: 500, bgcolor: "grey.900", borderRadius: 1, overflow: "hidden" }}>
                            <Cropper
                                image={imageUrl}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspectRatio}
                                onCropChange={(crop) => {
                                    setCrop(crop);
                                    saveToHistory();
                                }}
                                onZoomChange={(zoom) => {
                                    setZoom(zoom);
                                    saveToHistory();
                                }}
                                onRotationChange={(rotation) => {
                                    setRotation(rotation);
                                    saveToHistory();
                                }}
                                onCropComplete={onCropComplete}
                                flip={flip}
                            />
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Typography gutterBottom>بزرگنمایی: {Math.round(zoom * 100)}%</Typography>
                            <Slider
                                value={zoom}
                                onChange={(e, v) => {
                                    setZoom(v);
                                    saveToHistory();
                                }}
                                min={1}
                                max={3}
                                step={0.1}
                            />
                        </Box>
                    </Box>
                )}

                {/* Adjustments Tab */}
                {activeTab === 1 && (
                    <Box>
                        <Box sx={{ position: "relative", height: 400, bgcolor: "grey.900", mb: 3, borderRadius: 1, overflow: "hidden" }}>
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
                                        ${selectedFilter !== "none" ? selectedFilter : ""}
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
                                    onChange={(e, v) => {
                                        setBrightness(v);
                                        saveToHistory();
                                    }}
                                    min={0}
                                    max={200}
                                    step={1}
                                />
                            </Box>

                            <Box>
                                <Typography gutterBottom>کنتراست: {contrast}%</Typography>
                                <Slider
                                    value={contrast}
                                    onChange={(e, v) => {
                                        setContrast(v);
                                        saveToHistory();
                                    }}
                                    min={0}
                                    max={200}
                                    step={1}
                                />
                            </Box>

                            <Box>
                                <Typography gutterBottom>اشباع رنگ: {saturation}%</Typography>
                                <Slider
                                    value={saturation}
                                    onChange={(e, v) => {
                                        setSaturation(v);
                                        saveToHistory();
                                    }}
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
                        <Box sx={{ position: "relative", height: 400, bgcolor: "grey.900", mb: 3, borderRadius: 1, overflow: "hidden" }}>
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
                                        ${selectedFilter !== "none" ? selectedFilter : ""}
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
                                { name: "ویویج", filter: "saturate(150%) contrast(110%)" },
                                { name: "کلاسیک", filter: "contrast(120%) brightness(95%)" },
                                { name: "روشن", filter: "brightness(120%) contrast(110%)" },
                                { name: "تاریک", filter: "brightness(80%) contrast(120%)" },
                            ].map((filter) => (
                                <Grid size={{ xs: 6, sm: 3 }} key={filter.name}>
                                    <Box
                                        onClick={() => {
                                            setSelectedFilter(filter.filter);
                                            saveToHistory();
                                        }}
                                        sx={{
                                            border: 2,
                                            borderColor: selectedFilter === filter.filter ? "primary.main" : "divider",
                                            borderRadius: 1,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            "&:hover": { borderColor: "primary.main" },
                                            transition: "all 0.2s",
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
                                        <Typography variant="caption" sx={{ p: 1, display: "block", textAlign: "center", fontWeight: selectedFilter === filter.filter ? "bold" : "normal" }}>
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
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" flexWrap="wrap">
                        <Tooltip title="چرخش 90 درجه به چپ">
                            <Button
                                variant="outlined"
                                startIcon={<RotateLeft />}
                                onClick={() => {
                                    setRotation((prev) => prev - 90);
                                    saveToHistory();
                                }}
                            >
                                چرخش چپ
                            </Button>
                        </Tooltip>
                        <Tooltip title="چرخش 90 درجه به راست">
                            <Button
                                variant="outlined"
                                startIcon={<RotateRight />}
                                onClick={() => {
                                    setRotation((prev) => prev + 90);
                                    saveToHistory();
                                }}
                            >
                                چرخش راست
                            </Button>
                        </Tooltip>
                        <Tooltip title="چرخش 1 درجه به چپ">
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setRotation((prev) => prev - 1);
                                    saveToHistory();
                                }}
                            >
                                -1°
                            </Button>
                        </Tooltip>
                        <Tooltip title="چرخش 1 درجه به راست">
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setRotation((prev) => prev + 1);
                                    saveToHistory();
                                }}
                            >
                                +1°
                            </Button>
                        </Tooltip>
                        <Tooltip title="چرخش افقی">
                            <Button
                                variant="outlined"
                                startIcon={<Flip />}
                                onClick={() => {
                                    setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }));
                                    saveToHistory();
                                }}
                            >
                                افقی
                            </Button>
                        </Tooltip>
                        <Tooltip title="چرخش عمودی">
                            <Button
                                variant="outlined"
                                startIcon={<FlipCameraAndroid />}
                                onClick={() => {
                                    setFlip((prev) => ({ ...prev, vertical: !prev.vertical }));
                                    saveToHistory();
                                }}
                            >
                                عمودی
                            </Button>
                        </Tooltip>
                        <Button variant="outlined" onClick={handleReset}>
                            بازنشانی
                        </Button>
                    </Stack>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={processing}>لغو</Button>
                <Button 
                    variant="contained" 
                    startIcon={processing ? <CircularProgress size={16} /> : <Save />} 
                    onClick={handleSave} 
                    disabled={processing}
                >
                    {processing ? "در حال پردازش..." : "ذخیره تغییرات"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

