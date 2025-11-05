"use client";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Checkbox,
    IconButton,
    Chip,
    Button,
    TextField,
    InputAdornment,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    Tooltip,
    Select,
    FormControl,
    InputLabel,
    Popover,
    Stack,
} from "@mui/material";
import { Search, FilterList, MoreVert, Edit, Delete, Visibility, Add } from "@mui/icons-material";
import { useState } from "react";
import { formatDate } from "../../lib/utils";
import Image from "next/image";

export default function DataTable({
    title,
    data = [],
    columns = [],
    loading = false,
    pagination = {},
    onPageChange,
    onRowsPerPageChange,
    onSearch,
    onFilter,
    onEdit,
    onDelete,
    onView,
    onAdd,
    searchPlaceholder = "جستجو...",
    enableSelection = false,
    enableActions = true,
    customActions = [],
    filters = [],
    emptyStateProps,
    // Authorization props - if provided, actions will be shown/hidden based on permissions
    canView = true,
    canEdit = true,
    canDelete = true,
    canCreate = true,
}) {
    // Ensure data is always an array
    const safeData = Array.isArray(data) ? data : (data?.data ? (Array.isArray(data.data) ? data.data : []) : []);
    
    const [selected, setSelected] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelected(safeData.map((row) => row._id));
        } else {
            setSelected([]);
        }
    };

    const handleSelectRow = (id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }

        setSelected(newSelected);
    };

    const handleMenuClick = (event, row) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    const getStatusChip = (status) => {
        const statusColors = {
            active: "success",
            inactive: "default",
            archived: "warning",
            pending: "info",
            approved: "success",
            rejected: "error",
        };

        const statusLabels = {
            active: "فعال",
            inactive: "غیرفعال",
            archived: "بایگانی",
            pending: "در انتظار",
            approved: "تایید شده",
            rejected: "رد شده",
        };

        return <Chip label={statusLabels[status] || status} color={statusColors[status] || "default"} size="small" variant="outlined" />;
    };

    const renderCellContent = (column, row) => {
        const value = row[column.field];

        // اگر column custom render function دارد
        if (column.render && typeof column.render === "function") {
            const rendered = column.render(row);
            // اطمینان از اینکه rendered یک valid React element است
            return rendered;
        }

        switch (column.type) {
            case "status":
                return getStatusChip(value);

            case "date":
                return value ? formatDate(value) : "-";

            case "image":
                return value ? <Image src={value} alt="" title="" width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} /> : null;

            case "boolean":
                return value ? "بله" : "خیر";

            case "array":
                return Array.isArray(value) ? value.join(", ") : "";

            case "truncate":
                return value?.length > 50 ? `${value.substring(0, 50)}...` : value;

            default:
                // برای field هایی مثل role که object هستند
                if (typeof value === "object" && value !== null) {
                    if (column.field === "role") {
                        return value.name || "کاربر";
                    }
                    // برای سایر object ها
                    return JSON.stringify(value);
                }
                return value || "-";
        }
    };

    return (
        <Paper sx={{ width: "100%", mb: 2 }}>
            {/* Toolbar */}
            <Toolbar sx={{ px: 2, py: 1 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                    {title}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                        size="small"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ minWidth: 200 }}
                    />

                    {filters && filters.length > 0 && (
                        <>
                            <IconButton 
                                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                                color={filters.some(f => f.value !== "all" && f.value !== "") ? "primary" : "default"}
                            >
                                <FilterList />
                            </IconButton>
                            <Popover
                                open={Boolean(filterAnchorEl)}
                                anchorEl={filterAnchorEl}
                                onClose={() => setFilterAnchorEl(null)}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "left",
                                }}
                            >
                                <Box sx={{ p: 2, minWidth: 250 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        فیلترها
                                    </Typography>
                                    <Stack spacing={2} sx={{ mt: 2 }}>
                                        {filters.map((filter) => (
                                            <FormControl key={filter.key} fullWidth size="small">
                                                <InputLabel>{filter.label}</InputLabel>
                                                <Select
                                                    value={filter.value}
                                                    label={filter.label}
                                                    onChange={(e) => {
                                                        if (filter.onChange) {
                                                            filter.onChange(e.target.value);
                                                        }
                                                    }}
                                                >
                                                    {filter.options?.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ))}
                                    </Stack>
                                </Box>
                            </Popover>
                        </>
                    )}
                    {!filters && onFilter && (
                        <IconButton onClick={onFilter}>
                            <FilterList />
                        </IconButton>
                    )}

                    {onAdd && canCreate && (
                        <Button variant="contained" startIcon={<Add />} onClick={onAdd} size="small">
                            افزودن
                        </Button>
                    )}
                </Box>
            </Toolbar>

            {/* Table */}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {enableSelection && (
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < safeData.length}
                                        checked={safeData.length > 0 && selected.length === safeData.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                            )}

                            {columns.map((column) => (
                                <TableCell key={column.field} align={column.align || "right"}>
                                    {column.headerName}
                                </TableCell>
                            ))}

                            {enableActions && <TableCell align="center">عملیات</TableCell>}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (enableSelection ? 1 : 0) + (enableActions ? 1 : 0)}>
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>در حال بارگذاری...</Box>
                                </TableCell>
                            </TableRow>
                        ) : safeData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (enableSelection ? 1 : 0) + (enableActions ? 1 : 0)}>
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4 }}>
                                        <Typography variant="body1" color="text.secondary" gutterBottom>
                                            {emptyStateProps?.title || "داده‌ای یافت نشد"}
                                        </Typography>
                                        {emptyStateProps?.description && (
                                            <Typography variant="body2" color="text.secondary">
                                                {emptyStateProps.description}
                                            </Typography>
                                        )}
                                        {emptyStateProps?.action && (
                                            <Button
                                                variant="contained"
                                                onClick={emptyStateProps.action.onClick}
                                                sx={{ mt: 2 }}
                                            >
                                                {emptyStateProps.action.label}
                                            </Button>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            safeData.map((row) => (
                                <TableRow key={row._id} hover selected={selected.indexOf(row._id) !== -1}>
                                    {enableSelection && (
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={selected.indexOf(row._id) !== -1} onChange={() => handleSelectRow(row._id)} />
                                        </TableCell>
                                    )}

                                    {columns.map((column) => (
                                        <TableCell key={column.field} align={column.align || "right"}>
                                            {renderCellContent(column, row)}
                                        </TableCell>
                                    ))}

                                    {enableActions && (
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
                                                <MoreVert />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination && (
                <TablePagination
                    component="div"
                    count={pagination.total || 0}
                    page={(pagination.page || 1) - 1}
                    onPageChange={(e, page) => onPageChange && onPageChange(page + 1)}
                    rowsPerPage={(() => {
                        const limit = pagination.limit || 25;
                        // MUI only accepts 10, 25, 50, 100
                        // Convert invalid values to closest valid value
                        if ([10, 25, 50, 100].includes(limit)) return limit;
                        // Convert 20 to 25 (most common invalid value)
                        if (limit === 20) return 25;
                        // For other invalid values, default to 25
                        return 25;
                    })()}
                    onRowsPerPageChange={(e) => {
                        const newLimit = parseInt(e.target.value, 10);
                        if (onRowsPerPageChange) {
                            onRowsPerPageChange(newLimit);
                        }
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="تعداد در هر صفحه:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
                />
            )}

            {/* Actions Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {/* View action - shown first if authorized */}
                {onView && selectedRow && canView && (
                    <MenuItem
                        onClick={() => {
                            onView(selectedRow);
                            handleMenuClose();
                        }}
                    >
                        <Visibility sx={{ mr: 1 }} fontSize="small" />
                        مشاهده
                    </MenuItem>
                )}

                {/* Edit action - shown second if authorized */}
                {onEdit && selectedRow && canEdit && (
                    <MenuItem
                        onClick={() => {
                            onEdit(selectedRow);
                            handleMenuClose();
                        }}
                    >
                        <Edit sx={{ mr: 1 }} fontSize="small" />
                        ویرایش
                    </MenuItem>
                )}

                {/* Custom actions - shown after standard actions if authorized */}
                {selectedRow && customActions.map((action, index) => {
                    // Check if action has permission requirement
                    const actionCanShow = action.permission 
                        ? (typeof action.permission === "function" ? action.permission(selectedRow) : action.permission)
                        : true;
                    
                    if (!actionCanShow) return null;

                    // Only evaluate disabled if selectedRow is not null
                    const isDisabled = typeof action.disabled === "function" 
                        ? action.disabled(selectedRow) 
                        : (action.disabled || false);
                    const actionColor = typeof action.color === "function" 
                        ? action.color(selectedRow) 
                        : (typeof action.color === "string" ? action.color : undefined);
                    
                    return (
                        <MenuItem
                            key={index}
                            onClick={() => {
                                if (!isDisabled && action.onClick) {
                                    action.onClick(selectedRow);
                                    handleMenuClose();
                                }
                            }}
                            disabled={isDisabled}
                            sx={actionColor ? { color: `${actionColor}.main` } : {}}
                        >
                            {typeof action.icon === "function" ? (
                                <Box sx={{ mr: 1 }}>{action.icon(selectedRow)}</Box>
                            ) : (
                                action.icon && <Box sx={{ mr: 1 }}>{action.icon}</Box>
                            )}
                            {action.label}
                        </MenuItem>
                    );
                })}

                {/* Delete action - shown last if authorized */}
                {onDelete && selectedRow && canDelete && (
                    <MenuItem
                        onClick={() => {
                            onDelete(selectedRow);
                            handleMenuClose();
                        }}
                        sx={{ color: "error.main" }}
                    >
                        <Delete sx={{ mr: 1 }} fontSize="small" />
                        حذف
                    </MenuItem>
                )}
            </Menu>
        </Paper>
    );
}
