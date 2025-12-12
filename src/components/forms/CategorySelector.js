"use client";
import { Autocomplete, TextField, Chip, Box, Typography, Paper, Avatar } from "@mui/material";
import { Category, Add } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";

export default function CategorySelector({
    value = [],
    onChange,
    label = "دسته‌بندی‌ها",
    multiple = true,
    type = "general", // article, service, portfolio, etc.
    error,
    helperText,
    required = false,
    disabled = false,
}) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [normalizedValue, setNormalizedValue] = useState(multiple ? [] : null);

    const { useFetchData } = useApi();

    const { data: categoriesData, isLoading } = useFetchData(["categories", type], `/categories?type=${type}&status=active`);

    useEffect(() => {
        if (categoriesData?.data) {
            // Ensure data is an array
            const categoriesArray = Array.isArray(categoriesData.data) 
                ? categoriesData.data 
                : (categoriesData.data.categories || []);
            setCategories(categoriesArray);
        } else {
            setCategories([]);
        }
    }, [categoriesData]);

    // Normalize value prop: convert IDs to category objects
    useEffect(() => {
        if (!categories.length || !value) {
            setNormalizedValue(multiple ? [] : null);
            return;
        }

        if (multiple) {
            // Handle array of values (IDs or objects)
            const normalized = Array.isArray(value)
                ? value.map(val => {
                    // If it's already an object with _id, return it
                    if (typeof val === 'object' && val !== null && val._id) {
                        return val;
                    }
                    // If it's a string ID, find the category object
                    const id = typeof val === 'string' ? val : (val?._id || val?.id);
                    return categories.find(cat => cat._id === id || cat.id === id) || val;
                }).filter(Boolean)
                : [];
            setNormalizedValue(normalized);
        } else {
            // Handle single value
            if (typeof value === 'object' && value !== null && value._id) {
                setNormalizedValue(value);
            } else {
                const id = typeof value === 'string' ? value : (value?._id || value?.id);
                const found = categories.find(cat => cat._id === id || cat.id === id);
                setNormalizedValue(found || null);
            }
        }
    }, [value, categories, multiple]);

    const handleChange = (_, newValue) => {
        if (multiple) {
            onChange(newValue);
        } else {
            onChange(newValue);
        }
    };

    const getOptionLabel = (option) => {
        if (typeof option === "string") return option;
        return option.name?.fa || option.name || "";
    };

    const renderOption = (props, option) => {
        const { key, ...otherProps } = props;
        return (
            <Box component="li" key={key} {...otherProps}>
                <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: option.color || "primary.main" }}>
                    <Category sx={{ fontSize: 16 }} />
                </Avatar>
                <Box>
                    <Typography variant="body2">{option.name?.fa || option.name}</Typography>
                    {option.description?.fa && (
                        <Typography variant="caption" color="text.secondary">
                            {option.description.fa}
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    };

    const renderTags = (tagValue, getTagProps) =>
        tagValue.map((option, index) => (
            <Chip
                {...getTagProps({ index })}
                key={option._id || option.id || index}
                label={getOptionLabel(option)}
                size="small"
                color="primary"
                variant="outlined"
                avatar={
                    <Avatar sx={{ bgcolor: option.color || "primary.main" }}>
                        <Category sx={{ fontSize: 14 }} />
                    </Avatar>
                }
            />
        ));

    // Ensure options is always an array
    const safeOptions = Array.isArray(categories) ? categories : [];

    return (
        <Autocomplete
            multiple={multiple}
            value={normalizedValue}
            onChange={handleChange}
            options={safeOptions}
            loading={isLoading}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                const optionId = option._id || option.id;
                const valueId = value._id || value.id || value;
                return optionId === valueId || String(optionId) === String(valueId);
            }}
            renderOption={renderOption}
            renderTags={multiple ? renderTags : undefined}
            renderInput={(params) => {
                // Clone params to avoid readonly issues
                const inputParams = { ...params };
                inputParams.inputProps = params.inputProps ? { ...params.inputProps } : {};
                // Disable browser validation for Autocomplete - we handle it with react-hook-form
                // Set required to false in inputProps to prevent browser native validation
                if (inputParams.inputProps) {
                    inputParams.inputProps.required = false;
                    // Also disable browser validation
                    inputParams.inputProps.autoComplete = "off";
                }
                // Get error message - handle both string and object error
                const errorMessage = error?.message || (typeof error === 'string' ? error : null) || helperText;
                // Remove required from TextField to prevent browser validation
                // We'll show error through react-hook-form validation instead
                return (
                    <TextField 
                        {...inputParams} 
                        label={label} 
                        error={!!error} 
                        helperText={errorMessage} 
                        disabled={disabled}
                        required={required}
                    />
                );
            }}
            PaperComponent={({ children, ...props }) => (
                <Paper {...props} sx={{ mt: 1 }}>
                    {safeOptions.length === 0 && !isLoading ? (
                        <Box sx={{ p: 2, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                دسته‌بندی‌ای یافت نشد
                            </Typography>
                        </Box>
                    ) : (
                        children
                    )}
                </Paper>
            )}
        />
    );
}
