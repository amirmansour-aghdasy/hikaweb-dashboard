"use client";
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Typography, Divider, Stack, IconButton, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Save, Cancel, Add, Delete, Person, Work, Language, Link as LinkIcon, Image } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import TagInput from "./TagInput";
import MediaUploader from "../media/MediaUploader";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function TeamMemberForm({ member, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createMember = useCreateData("/api/v1/team");
    const updateMember = useUpdateData("/api/v1/team");

    const {
        control,
        handleSubmit,
        setValue,
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
            socialMedia: {
                linkedin: "",
                twitter: "",
                instagram: "",
                website: "",
            },
            order: 0,
            isPublic: true,
            status: "active",
        },
    });

    // Field Arrays
    const {
        fields: educationFields,
        append: appendEducation,
        remove: removeEducation,
    } = useFieldArray({
        control,
        name: "education",
    });

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
                experience: member.experience || "",
                education: member.education || [],
                socialMedia: member.socialMedia || {
                    linkedin: "",
                    twitter: "",
                    instagram: "",
                    website: "",
                },
                order: member.order || 0,
                isPublic: member.isPublic !== false,
                status: member.status || "active",
            });
        }
    }, [member, reset]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            if (member) {
                await updateMember.mutateAsync({
                    id: member._id,
                    data,
                });
            } else {
                await createMember.mutateAsync(data);
            }

            toast.success(member ? "عضو تیم با موفقیت ویرایش شد" : "عضو تیم با موفقیت اضافه شد");
            onSave();
        } catch (error) {
            console.error("Error saving team member:", error);
            toast.error("خطا در ذخیره عضو تیم");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = (images) => {
        if (images.length > 0) {
            setValue("avatar", images[0].url);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid item xs={12} md={8}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Person /> اطلاعات شخصی
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        rules={{ required: "نام الزامی است" }}
                                        render={({ field }) => <TextField {...field} label="نام و نام خانوادگی" required error={!!errors.name} helperText={errors.name?.message} fullWidth />}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        rules={{
                                            required: "ایمیل الزامی است",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "فرمت ایمیل صحیح نیست",
                                            },
                                        }}
                                        render={({ field }) => <TextField {...field} label="ایمیل" type="email" required error={!!errors.email} helperText={errors.email?.message} fullWidth />}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="شماره تماس" fullWidth />} />
                                </Grid>

                                <Grid item xs={12} md={6}>
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
                                <Grid item xs={12}>
                                    <Controller
                                        name="position"
                                        control={control}
                                        rules={{
                                            validate: {
                                                faRequired: (value) => value.fa?.trim() || "سمت فارسی الزامی است",
                                            },
                                        }}
                                        render={({ field }) => <MultiLangTextField {...field} label="سمت" required error={errors.position} />}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="department"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControl fullWidth>
                                                <InputLabel>بخش</InputLabel>
                                                <Select {...field} label="بخش">
                                                    <MenuItem value="management">مدیریت</MenuItem>
                                                    <MenuItem value="development">توسعه</MenuItem>
                                                    <MenuItem value="design">طراحی</MenuItem>
                                                    <MenuItem value="marketing">بازاریابی</MenuItem>
                                                    <MenuItem value="sales">فروش</MenuItem>
                                                    <MenuItem value="support">پشتیبانی</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller name="order" control={control} render={({ field }) => <TextField {...field} label="ترتیب نمایش" type="number" fullWidth />} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Controller name="bio" control={control} render={({ field }) => <MultiLangTextField {...field} label="بیوگرافی" multiline rows={4} />} />
                                </Grid>

                                <Grid item xs={12}>
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
                                                <Grid item xs={12} md={6}>
                                                    <Controller
                                                        name={`education.${index}.degree`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="مدرک" size="small" fullWidth />}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Controller
                                                        name={`education.${index}.field`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="رشته تحصیلی" size="small" fullWidth />}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <Controller
                                                        name={`education.${index}.university`}
                                                        control={control}
                                                        render={({ field }) => <TextField {...field} label="دانشگاه" size="small" fullWidth />}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* Avatar */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Image /> تصویر پروفایل
                            </Typography>
                            <Controller
                                name="avatar"
                                control={control}
                                render={({ field }) => (
                                    <MediaUploader
                                        value={field.value ? [{ url: field.value, type: "image/*" }] : []}
                                        onChange={handleAvatarUpload}
                                        single
                                        acceptedTypes={["image/*"]}
                                        maxSizeInMB={2}
                                    />
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
                                    name="socialMedia.linkedin"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="LinkedIn" placeholder="https://linkedin.com/in/username" size="small" fullWidth />}
                                />

                                <Controller
                                    name="socialMedia.twitter"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Twitter" placeholder="https://twitter.com/username" size="small" fullWidth />}
                                />

                                <Controller
                                    name="socialMedia.instagram"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="Instagram" placeholder="https://instagram.com/username" size="small" fullWidth />}
                                />

                                <Controller
                                    name="socialMedia.website"
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
