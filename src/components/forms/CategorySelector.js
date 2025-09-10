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

    const { useFetchData } = useApi();

    const { data: categoriesData, isLoading } = useFetchData(["categories", type], `/api/v1/categories?type=${type}&status=active`);

    useEffect(() => {
        if (categoriesData?.data) {
            setCategories(categoriesData.data);
        }
    }, [categoriesData]);

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

    const renderOption = (props, option) => (
        <Box component="li" {...props}>
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

    return (
        <Autocomplete
            multiple={multiple}
            value={value}
            onChange={handleChange}
            options={categories}
            loading={isLoading}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderOption={renderOption}
            renderTags={multiple ? renderTags : undefined}
            renderInput={(params) => <TextField {...params} label={label} error={!!error} helperText={error || helperText} required={required} disabled={disabled} />}
            PaperComponent={({ children, ...props }) => (
                <Paper {...props} sx={{ mt: 1 }}>
                    {children}
                </Paper>
            )}
        />
    );
}
