"use client";
import { TextField, InputAdornment, Select, MenuItem, Box, FormControl, InputLabel, FormHelperText } from "@mui/material";
import { AttachMoney } from "@mui/icons-material";

const currencies = [
    { value: "IRR", label: "ریال", symbol: "﷼" },
    { value: "USD", label: "دلار", symbol: "€" },
    { value: "EUR", label: "یورو", symbol: "€" },
];

export default function PriceInput({ value = { amount: "", currency: "IRR" }, onChange, label = "قیمت", error, helperText, required = false, disabled = false }) {
    const handleAmountChange = (e) => {
        const amount = e.target.value.replace(/[^0-9]/g, "");
        onChange({
            ...value,
            amount: amount,
        });
    };

    const handleCurrencyChange = (e) => {
        onChange({
            ...value,
            currency: e.target.value,
        });
    };

    const formatNumber = (num) => {
        if (!num) return "";
        return new Intl.NumberFormat("fa-IR").format(num);
    };

    const selectedCurrency = currencies.find((c) => c.value === value.currency) || currencies[0];

    return (
        <Box>
            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                    flex={2}
                    label={label}
                    value={formatNumber(value.amount)}
                    onChange={handleAmountChange}
                    error={!!error}
                    required={required}
                    disabled={disabled}
                    slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start">{selectedCurrency.symbol}</InputAdornment>,
                        },
                    }}
                    sx={{ flex: 2 }}
                />

                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>واحد</InputLabel>
                    <Select value={value.currency} onChange={handleCurrencyChange} label="واحد" disabled={disabled}>
                        {currencies.map((currency) => (
                            <MenuItem key={currency.value} value={currency.value}>
                                {currency.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {(error || helperText) && <FormHelperText error={!!error}>{error || helperText}</FormHelperText>}
        </Box>
    );
}
