"use client";
import { Autocomplete, TextField, Chip, Box, createFilterOptions } from "@mui/material";
import { useState } from "react";

const filter = createFilterOptions();

export default function TagInput({ value = [], onChange, label = "برچسب‌ها", placeholder = "برچسب جدید اضافه کنید...", error, helperText, maxTags = 10, disabled = false }) {
    const [inputValue, setInputValue] = useState("");

    const handleChange = (_, newValue) => {
        const tags = newValue.map((item) => {
            if (typeof item === "string") {
                return item;
            }
            if (item.inputValue) {
                return item.inputValue;
            }
            return item;
        });

        if (tags.length <= maxTags) {
            onChange(tags);
        }
    };

    const filterOptions = (options, params) => {
        const filtered = filter(options, params);

        const { inputValue } = params;
        const isExisting = options.some((option) => inputValue === option);

        if (inputValue !== "" && !isExisting) {
            filtered.push({
                inputValue,
                title: `اضافه کردن "${inputValue}"`,
            });
        }

        return filtered;
    };

    const getOptionLabel = (option) => {
        if (typeof option === "string") {
            return option;
        }
        if (option.inputValue) {
            return option.inputValue;
        }
        return option.title || option;
    };

    return (
        <Autocomplete
            multiple
            freeSolo
            value={value}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            options={[]}
            filterOptions={filterOptions}
            getOptionLabel={getOptionLabel}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => <Chip {...getTagProps({ index })} key={index} label={getOptionLabel(option)} size="small" color="primary" variant="outlined" />)
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={value.length === 0 ? placeholder : ""}
                    error={!!error}
                    helperText={error || helperText || `${value.length}/${maxTags} برچسب`}
                    disabled={disabled}
                />
            )}
            disabled={disabled || value.length >= maxTags}
        />
    );
}
