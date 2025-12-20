"use client";
import { Autocomplete, TextField, Chip, Box, Typography, Paper, Avatar } from "@mui/material";
import { Category, Add } from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";
import { useApi } from "../../hooks/useApi";
import { denormalizeCategories } from "../../lib/utils/formTransformers";

// Inner component that handles the actual Autocomplete logic
function CategorySelectorInner({
    value,
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

    // Convert value (array of IDs) to display format (array of objects) for Autocomplete
    // This is memoized to avoid unnecessary recalculations
    const displayValue = useMemo(() => {
        if (!categories.length) {
            return multiple ? [] : null;
        }
        
        if (!value) {
            return multiple ? [] : null;
        }
        
        // Handle both array of IDs and array of objects (for backward compatibility)
        const valueIds = Array.isArray(value)
            ? value.map(v => typeof v === 'object' && v !== null ? (v._id || v.id) : v).filter(Boolean)
            : (typeof value === 'object' && value !== null ? [value._id || value.id] : value ? [value] : []);
        
        if (multiple) {
            return denormalizeCategories(valueIds, categories);
        } else {
            const id = valueIds[0] || (typeof value === 'string' ? value : (value?._id || value?.id));
            return categories.find(cat => cat._id === id || cat.id === id) || null;
        }
    }, [value, categories, multiple]);

    const handleChange = (_, newValue) => {
        if (!onChange) return;
        
        // Convert category objects to IDs (form expects array of IDs)
        if (multiple) {
            const ids = Array.isArray(newValue)
                ? newValue.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        return item._id || item.id || String(item);
                    }
                    return String(item);
                }).filter(Boolean)
                : [];
            onChange(ids);
        } else {
            // Single selection
            if (newValue && typeof newValue === 'object' && newValue !== null) {
                onChange(newValue._id || newValue.id || String(newValue));
            } else if (newValue) {
                onChange(String(newValue));
            } else {
                onChange(null);
            }
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
            value={displayValue}
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

// Main component that wraps with Controller if needed
export default function CategorySelector({
    value,
    onChange,
    name,
    control,
    label = "دسته‌بندی‌ها",
    multiple = true,
    type = "general", // article, service, portfolio, etc.
    error,
    helperText,
    required = false,
    disabled = false,
}) {
    // If used with react-hook-form Controller, wrap with Controller
    if (name && control) {
        return (
            <Controller
                name={name}
                control={control}
                render={({ field, fieldState }) => (
                    <CategorySelectorInner
                        value={field.value}
                        onChange={field.onChange}
                        label={label}
                        multiple={multiple}
                        type={type}
                        error={fieldState.error}
                        helperText={fieldState.error?.message || helperText}
                        required={required}
                        disabled={disabled}
                    />
                )}
            />
        );
    }

    // Otherwise, use directly
    return (
        <CategorySelectorInner
            value={value}
            onChange={onChange}
            label={label}
            multiple={multiple}
            type={type}
            error={error}
            helperText={helperText}
            required={required}
            disabled={disabled}
        />
    );
}

