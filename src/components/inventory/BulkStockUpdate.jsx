"use client";
import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Stack,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Alert,
} from "@mui/material";
import { Save, Close } from "@mui/icons-material";
import { useApi } from "@/hooks/useApi";
import toast from "react-hot-toast";

export default function BulkStockUpdate({ open, onClose, products, onUpdate }) {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [updateType, setUpdateType] = useState("set"); // 'set', 'add', 'subtract'
    const [value, setValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { useUpdateData } = useApi();

    const updateInventory = useUpdateData("/products", {
        successMessage: "موجودی با موفقیت به‌روزرسانی شد",
        queryKey: ["products", "inventory"],
    });

    const handleToggleProduct = (productId) => {
        setSelectedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSelectAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map((p) => p._id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedProducts.length === 0) {
            toast.error("لطفاً حداقل یک محصول انتخاب کنید");
            return;
        }

        if (!value || isNaN(value)) {
            toast.error("لطفاً مقدار معتبری وارد کنید");
            return;
        }

        setIsSubmitting(true);
        try {
            const updateValue = parseInt(value);
            const updates = selectedProducts.map(async (productId) => {
                const product = products.find((p) => p._id === productId);
                if (!product || !product.inventory?.trackInventory) {
                    return;
                }

                let newQuantity = product.inventory.quantity || 0;
                if (updateType === "set") {
                    newQuantity = updateValue;
                } else if (updateType === "add") {
                    newQuantity += updateValue;
                } else if (updateType === "subtract") {
                    newQuantity = Math.max(0, newQuantity - updateValue);
                }

                await updateInventory.mutateAsync({
                    id: productId,
                    endpoint: `/products/${productId}`,
                    data: {
                        inventory: {
                            ...product.inventory,
                            quantity: newQuantity,
                        },
                    },
                });
            });

            await Promise.all(updates);
            toast.success(`${selectedProducts.length} محصول با موفقیت به‌روزرسانی شد`);
            setSelectedProducts([]);
            setValue("");
            onUpdate();
            onClose();
        } catch (error) {
            toast.error("خطا در به‌روزرسانی موجودی");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    به‌روزرسانی دسته‌ای موجودی
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        <Alert severity="info">
                            می‌توانید موجودی چندین محصول را به صورت همزمان به‌روزرسانی کنید.
                        </Alert>

                        <Box>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    انتخاب محصولات ({selectedProducts.length} از {products.length})
                                </Typography>
                                <Button size="small" onClick={handleSelectAll}>
                                    {selectedProducts.length === products.length ? "لغو انتخاب همه" : "انتخاب همه"}
                                </Button>
                            </Stack>
                            <Box
                                sx={{
                                    maxHeight: 300,
                                    overflowY: "auto",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    p: 1,
                                }}
                            >
                                {products
                                    .filter((p) => p.inventory?.trackInventory)
                                    .map((product) => (
                                        <FormControlLabel
                                            key={product._id}
                                            control={
                                                <Checkbox
                                                    checked={selectedProducts.includes(product._id)}
                                                    onChange={() => handleToggleProduct(product._id)}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography variant="body2">
                                                        {product.name?.fa || product.name || "-"}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        موجودی فعلی: {product.inventory?.quantity || 0}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    ))}
                            </Box>
                        </Box>

                        <TextField
                            select
                            label="نوع به‌روزرسانی"
                            value={updateType}
                            onChange={(e) => setUpdateType(e.target.value)}
                            fullWidth
                            SelectProps={{
                                native: true,
                            }}
                        >
                            <option value="set">تنظیم مقدار</option>
                            <option value="add">افزودن</option>
                            <option value="subtract">کاهش</option>
                        </TextField>

                        <TextField
                            label="مقدار"
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            fullWidth
                            required
                            helperText={
                                updateType === "set"
                                    ? "مقدار جدید موجودی"
                                    : updateType === "add"
                                    ? "مقداری که به موجودی اضافه می‌شود"
                                    : "مقداری که از موجودی کم می‌شود"
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        <Close sx={{ mr: 1 }} />
                        انصراف
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting || selectedProducts.length === 0}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
                    >
                        {isSubmitting ? "در حال به‌روزرسانی..." : "به‌روزرسانی"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

