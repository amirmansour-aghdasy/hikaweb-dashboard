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
} from "@mui/material";
import { Search, FilterList, MoreVert, Edit, Delete, Visibility, Add } from "@mui/icons-material";
import { useState } from "react";
import { formatDate } from "../../lib/utils";

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
}) {
    const [selected, setSelected] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelected(data.map((row) => row._id));
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
                return value ? <img src={value} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} /> : null;

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

                    <IconButton onClick={onFilter} disabled={!onFilter}>
                        <FilterList />
                    </IconButton>

                    {onAdd && (
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
                                        indeterminate={selected.length > 0 && selected.length < data.length}
                                        checked={data.length > 0 && selected.length === data.length}
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
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (enableSelection ? 1 : 0) + (enableActions ? 1 : 0)}>
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>داده‌ای یافت نشد</Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            (data || []).map((row) => (
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
                    rowsPerPage={pagination.limit || 20}
                    onRowsPerPageChange={(e) => onRowsPerPageChange && onRowsPerPageChange(e.target.value)}
                    labelRowsPerPage="تعداد در هر صفحه:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
                />
            )}

            {/* Actions Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {onView && (
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

                {onEdit && (
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

                {customActions.map((action, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            action.onClick(selectedRow);
                            handleMenuClose();
                        }}
                    >
                        {action.icon && <Box sx={{ mr: 1 }}>{action.icon}</Box>}
                        {action.label}
                    </MenuItem>
                ))}

                {onDelete && (
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
