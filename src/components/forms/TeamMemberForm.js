"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Divider, Stack, IconButton, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Save, Cancel, Add, Delete, Person, Work, Language, Link as LinkIcon, Image } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import TagInput from "./TagInput";
import MediaPicker from "../media/MediaPicker";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function TeamMemberForm({ member, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createMember = useCreateData("/team");
    const updateMember = useUpdateData("/team");

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            position: { fa: "", en: "" },
            department: "",
            bio: { fa: "", en: "" },
            avatar: "",
            skills: [],
            experience: "",
            education: [],
            socialLinks: {
                linkedin: "",
                twitter: "",
                instagram: "",
                website: "",
            },
            order: 0,
            orderIndex: 0,
            isPublic: true,
            status: "active",
        },
    });

    const watchedName = watch("name");

    // Field Arrays
    const {
        fields: educationFields,
        append: appendEducation,
        remove: removeEducation,
    } = useFieldArray({
        control,
        name: "education",
    });

    // Generate slug from name (replace spaces with dash, remove dots and commas, keep Persian characters)
    const generateSlug = (name) => {
        if (!name || typeof name !== 'object') return "";
        const nameText = name.fa || name.en || "";
        if (!nameText) return "";
        
        // Replace spaces with dash, remove dots and commas, keep all characters (including Persian)
        return nameText
            .trim()
            .replace(/[،,\.]/g, "") // Remove Persian comma (،), English comma, and dots
            .replace(/\s+/g, "-") // Replace spaces with dash
            .replace(/-+/g, "-") // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
    };

    // Auto-generate slug from name (only in create mode)
    useEffect(() => {
        // Only auto-generate in create mode (not edit mode)
        if (!member && watchedName && (watchedName.fa || watchedName.en)) {
            const newSlug = generateSlug(watchedName);
            
            // Get current slug value
            const currentSlug = watch("slug") || "";
            
            // Auto-generate if slug is empty or if it matches the auto-generated version
            // This allows manual editing: if user manually changes slug, it won't be overwritten
            if (newSlug && (!currentSlug || currentSlug === newSlug)) {
                setValue("slug", newSlug, { shouldValidate: false, shouldDirty: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedName?.fa, watchedName?.en]);

    useEffect(() => {
        if (member) {
            reset({
                name: member.name || "",
                email: member.email || "",
                phone: member.phone || "",
                position: member.position || { fa: "", en: "" },
                department: member.department || "",
                bio: member.bio || { fa: "", en: "" },
                avatar: member.avatar || "",
                skills: member.skills || [],
                experience: member.experience?.years ?? member.experience ?? "",
                education: member.education || [],
                socialLinks: member.socialLinks || member.socialMedia || {
                    linkedin: "",
                    twitter: "",
                    instagram: "",
                    website: "",
                },
                order: member.order || member.orderIndex || 0,
                orderIndex: member.orderIndex || member.order || 0,
                isPublic: member.isPublic !== false,
                status: member.status || "active",
                slug: member.slug || "",
            });
        }
    }, [member, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        // Prepare data for submission
        let submitData = {
            name: data.name,
            position: data.position,
            slug: data.slug || generateSlug(data.name) || `team-member-${Date.now()}`,
            avatar: data.avatar,
            department: data.department,
            bio: data.bio || { fa: "", en: "" },
            email: data.email || undefined,
            phone: data.phone || undefined,
            orderIndex: data.orderIndex || data.order || 0,
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            status: data.status || "active",
        };
        
        // Handle socialLinks - only include if they exist and are not empty
        if (data.socialLinks) {
            const socialLinks = {};
            if (data.socialLinks.linkedin) socialLinks.linkedin = data.socialLinks.linkedin;
            if (data.socialLinks.twitter) socialLinks.twitter = data.socialLinks.twitter;
            if (data.socialLinks.github) socialLinks.github = data.socialLinks.github;
            if (data.socialLinks.telegram) socialLinks.telegram = data.socialLinks.telegram;
            if (data.socialLinks.instagram) socialLinks.instagram = data.socialLinks.instagram;
            if (Object.keys(socialLinks).length > 0) {
                submitData.socialLinks = socialLinks;
            }
        }
        
        // Handle skills - only include if they exist and are not empty
        if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
            submitData.skills = data.skills;
        }
        
        // Handle experience - only include if it's a valid number
        // Backend expects a number (validation schema), but model stores as object {years, description}
        // We send just the number, backend will handle the conversion
        if (data.experience !== undefined && data.experience !== null && data.experience !== "") {
            const experienceNum = Number(data.experience);
            if (!isNaN(experienceNum) && experienceNum >= 0) {
                submitData.experience = experienceNum;
            }
        }
        
        // Remove undefined values
        Object.keys(submitData).forEach(key => {
            if (submitData[key] === undefined) {
                delete submitData[key];
            }
        });

        try {
            if (member) {
                await updateMember.mutateAsync({
                    id: member._id,
                    data: submitData,
                });
            } else {
                await createMember.mutateAsync(submitData);
            }

            toast.success(member ? "عضو تیم با موفقیت ویرایش شد" : "عضو تیم با موفقیت اضافه شد");
            onSave();
        } catch (error) {
            console.error("Error saving team member:", error);
            console.error("Error response:", error.response?.data);
            console.error("Submit data:", submitData);
            
            // Show detailed error message from API
            let errorMessage = "خطا در ذخیره عضو تیم";
            
            if (error.response?.data) {
                // Handle validation errors
                if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
                    const fieldLabels = {
                        'name': 'نام',
                        'position': 'سمت',
                        'avatar': 'عکس پروفایل',
                        'department': 'بخش',
                        'slug': 'نامک',
                        'email': 'ایمیل',
                        'phone': 'شماره تماس',
                    };
                    const validationErrors = error.response.data.errors.map(err => {
                        const field = err.field || err.path || "";
                        const fieldLabel = fieldLabels[field] || field;
                        return `${fieldLabel}: ${err.message || "مقدار نامعتبر"}`;
                    }).join("، ");
                    errorMessage = `خطاهای اعتبارسنجی: ${validationErrors}`;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = (selected) => {
        // MediaPicker returns either a string URL or an object with url property
        if (selected) {
            const imageUrl = typeof selected === 'object' && selected.url ? selected.url : selected;
            setValue("avatar", imageUrl, { shouldValidate: true });
        } else {
            setValue("avatar", "", { shouldValidate: true });
        }
    };

    const onError = (errors) => {
        console.error("Form validation errors:", errors);
        
        // Field name mapping to Persian
        const fieldLabels = {
            'name': 'نام و نام خانوادگی',
            'email': 'ایمیل',
            'position': 'سمت',
            'department': 'بخش',
            'avatar': 'عکس پروفایل',
        };
        
        // Show first error with better message handling
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
            let errorMessage = "لطفاً تمام فیلدهای الزامی را پر کنید";
            
            // Handle nested validation errors
            const errorObj = errors[firstErrorKey];
            
            if (errorObj) {
                // Check if it's a validation error object from react-hook-form
                if (errorObj.message && typeof errorObj.message === 'string') {
                    // If message is a string, use it directly
                    errorMessage = errorObj.message;
                } else if (errorObj.type) {
                    // Handle validation type errors (faRequired, enRequired, etc.)
                    const fieldLabel = fieldLabels[firstErrorKey] || firstErrorKey;
                    const typeMessages = {
                        faRequired: `${fieldLabel} (فارسی) الزامی است`,
                        enRequired: `${fieldLabel} (انگلیسی) الزامی است`,
                        required: `${fieldLabel} الزامی است`,
                    };
                    errorMessage = typeMessages[errorObj.type] || errorObj.message || `${fieldLabel} الزامی است`;
                } else if (typeof errorObj === 'string') {
                    // If errorObj itself is a string, use it
                    errorMessage = errorObj;
                } else if (errorObj.fa || errorObj.en) {
                    // If errorObj is the field value itself (wrong validation return), show generic message
                    const fieldLabel = fieldLabels[firstErrorKey] || firstErrorKey;
                    errorMessage = `لطفاً ${fieldLabel} را به درستی وارد کنید`;
                }
            }
            
            toast.error(errorMessage);
        } else {
            toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate>
            <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Person /> اطلاعات شخصی
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => {
                                                    if (!value || typeof value !== 'object') {
                                                        return "نام الزامی است";
                                                    }
                                                    const trimmed = value.fa?.trim();
                                                    if (!trimmed) {
                                                        return "نام فارسی الزامی است";
                                                    }
                                                    return true;
                                                },
                                                enRequired: (value) => {
                                                    if (!value || typeof value !== 'object') {
                                                        return "نام الزامی است";
                                                    }
                                                    const trimmed = value.en?.trim();
                                                    if (!trimmed) {
                                                        return "نام انگلیسی الزامی است";
                                                    }
                                                    return true;
                                                },
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="نام و نام خانوادگی" required error={errors.name} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        rules={{
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "فرمت ایمیل صحیح نیست",
                                            },
                                        }}
                                        render={({ field }) => <TextField {...field} label="ایمیل" type="email" error={!!errors.email} helperText={errors.email?.message} fullWidth />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="شماره تماس" fullWidth />} />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller name="experience" control={control} render={({ field }) => <TextField {...field} label="سابقه کار (سال)" type="number" fullWidth />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Professional Information */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Work /> اطلاعات شغلی
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="position"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => {
                                                    if (!value || typeof value !== 'object') {
                                                        return "سمت الزامی است";
                                                    }
                                                    const trimmed = value.fa?.trim();
                                                    if (!trimmed) {
                                                        return "سمت فارسی الزامی است";
                                                    }
                                                    return true;
                                                },
                                                enRequired: (value) => {
                                                    if (!value || typeof value !== 'object') {
                                                        return "سمت الزامی است";
                                                    }
                                                    const trimmed = value.en?.trim();
                                                    if (!trimmed) {
                                                        return "سمت انگلیسی الزامی است";
                                                    }
                                                    return true;
                                                },
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="سمت" required error={errors.position} />}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="department"
                                        control={control}
                                        rules={{ required: "بخش الزامی است" }}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.department}>
                                                <InputLabel>بخش</InputLabel>
                                                <Select {...field} label="بخش">
                                                    <MenuItem value="management">مدیریت</MenuItem>
                                                    <MenuItem value="development">توسعه</MenuItem>
                                                    <MenuItem value="design">طراحی</MenuItem>
                                                    <MenuItem value="marketing">بازاریابی</MenuItem>
                                                    <MenuItem value="sales">فروش</MenuItem>
                                                    <MenuItem value="support">پشتیبانی</MenuItem>
                                                </Select>
                                                {errors.department && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{errors.department.message}</Typography>}
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller name="orderIndex" control={control} render={({ field }) => <TextField {...field} label="ترتیب نمایش" type="number" fullWidth />} />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller name="bio" control={control} render={({ field }) => <MultiLangTextField {...field} label="بیوگرافی" multiline rows={4} />} />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Controller name="skills" control={control} render={({ field }) => <TagInput {...field} label="مهارت‌ها و تخصص‌ها" placeholder="مهارت جدید اضافه کنید..." />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Education */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تحصیلات
                            </Typography>

                            <Stack spacing={2}>
                                {educationFields.map((field, index) => (
                                    <Card key={field.id} variant="outlined">
                                        <CardContent>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                                <Typography variant="subtitle1">تحصیلات {index + 1}</Typography>
                                                <IconButton onClick={() => removeEducation(index)} size="small">
                                                    <Delete />
                                                </IconButton>
                                            </Box>

                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Controller
                                                        name={`education.${index}.degree`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="مدرک" size="small" fullWidth />}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Controller
                                                        name={`education.${index}.field`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="رشته تحصیلی" size="small" fullWidth />}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Controller
                                                        name={`education.${index}.university`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="دانشگاه" size="small" fullWidth />}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Controller
                                                        name={`education.${index}.year`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="سال فارغ‌التحصیلی" type="number" size="small" fullWidth />}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Button
                                    startIcon={<Add />}
                                    onClick={() =>
                                        appendEducation({
                                            degree: "",
                                            field: "",
                                            university: "",
                                            year: "",
                                        })
                                    }
                                    variant="outlined"
                                >
                                    افزودن تحصیلات
                                </Button>
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={3}>
                        {/* Avatar */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر پروفایل
                            </Typography>
                            <Controller
                                name="avatar"
                                control={control}
                                rules={{ required: "عکس پروفایل الزامی است" }}
                                render={({ field }) => (
                                    <Box>
                                        <MediaPicker
                                            value={field.value || null}
                                            onChange={handleAvatarUpload}
                                            label="انتخاب تصویر پروفایل"
                                            accept="image/*"
                                            multiple={false}
                                            showPreview={true}
                                            showEdit={true}
                                            optimizeForWeb={true}
                                        />
                                        {errors.avatar && (
                                            <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                                                {errors.avatar.message}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Social Media */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LinkIcon /> شبکه‌های اجتماعی
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="socialLinks.linkedin"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="LinkedIn" placeholder="https://linkedin.com/in/username" size="small" fullWidth />}
                                />

                                <Controller
                                    name="socialLinks.twitter"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Twitter" placeholder="https://twitter.com/username" size="small" fullWidth />}
                                />

                                <Controller
                                    name="socialLinks.instagram"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Instagram" placeholder="https://instagram.com/username" size="small" fullWidth />}
                                />

                                <Controller
                                    name="socialLinks.website"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="وب‌سایت شخصی" placeholder="https://website.com" size="small" fullWidth />}
                                />
                            </Stack>
                        </Box>

                        {/* Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات
                            </Typography>

                            <Stack spacing={2}>
                                <Controller name="isPublic" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="نمایش عمومی" />} />

                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth size="small">
                                            <InputLabel>وضعیت</InputLabel>
                                            <Select {...field} label="وضعیت">
                                                <MenuItem value="active">فعال</MenuItem>
                                                <MenuItem value="inactive">غیرفعال</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={onCancel} disabled={loading} startIcon={<Cancel />}>
                    انصراف
                </Button>

                <Button type="submit" variant="contained" disabled={loading} startIcon={<Save />}>
                    {loading ? "در حال ذخیره..." : member ? "ویرایش عضو تیم" : "اضافه کردن عضو تیم"}
                </Button>
            </Box>
        </Box>
    );
}
