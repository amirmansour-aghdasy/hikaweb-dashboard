"use client";
import {
    Box,
    TextField,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Rating,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import { Save, Cancel, Help, QuestionAnswer, Category, Reorder, ExpandMore, Star } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import MultiLangTextField from "./MultiLangTextField";
import MultiLangEditor from "./MultiLangEditor";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import { useApi } from "../../hooks/useApi";
import toast from "react-hot-toast";

export default function FAQForm({ faq, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);

    const { useCreateData, useUpdateData } = useApi();

    const createFAQ = useCreateData("/api/v1/faq");
    const updateFAQ = useUpdateData("/api/v1/faq");

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        defaultValues: {
            question: { fa: "", en: "" },
            answer: { fa: "", en: "" },
            category: "",
            tags: { fa: [], en: [] },
            order: 0,
            isActive: true,
            isFeatured: false,
            difficulty: "beginner", // beginner, intermediate, advanced
            estimatedReadTime: 1, // minutes
            helpfulness: 0, // user rating 1-5
            relatedQuestions: [],
            seo: {
                metaTitle: { fa: "", en: "" },
                metaDescription: { fa: "", en: "" },
                metaKeywords: { fa: [], en: [] },
            },
        },
    });

    const watchedQuestion = watch("question");

    useEffect(() => {
        if (faq) {
            reset({
                question: faq.question || { fa: "", en: "" },
                answer: faq.answer || { fa: "", en: "" },
                category: faq.category?._id || "",
                tags: faq.tags || { fa: [], en: [] },
                order: faq.order || 0,
                isActive: faq.status === "active",
                isFeatured: faq.isFeatured || false,
                difficulty: faq.difficulty || "beginner",
                estimatedReadTime: faq.estimatedReadTime || 1,
                helpfulness: faq.helpfulness || 0,
                relatedQuestions: faq.relatedQuestions || [],
                seo: faq.seo || {
                    metaTitle: { fa: "", en: "" },
                    metaDescription: { fa: "", en: "" },
                    metaKeywords: { fa: [], en: [] },
                },
            });
        }
    }, [faq, reset]);

    // Auto-generate SEO title from question
    useEffect(() => {
        if (watchedQuestion?.fa && !faq) {
            setValue("seo.metaTitle", {
                fa: watchedQuestion.fa,
                en: watchedQuestion.en || "",
            });
        }
    }, [watchedQuestion, setValue, faq]);

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            const faqData = {
                ...data,
                status: data.isActive ? "active" : "inactive",
            };

            if (faq) {
                await updateFAQ.mutateAsync({
                    id: faq._id,
                    data: faqData,
                });
            } else {
                await createFAQ.mutateAsync(faqData);
            }

            toast.success(faq ? "سوال با موفقیت ویرایش شد" : "سوال با موفقیت ایجاد شد");
            onSave();
        } catch (error) {
            console.error("Error saving FAQ:", error);
            toast.error("خطا در ذخیره سوال");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid item size={{xs:12, md:8}}>
                    <Stack spacing={3}>
                        {/* Question */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <QuestionAnswer /> سوال
                            </Typography>
                            <Controller
                                name="question"
                                control={control}
                                rules={{
                                    validate: {
                                        faRequired: (value) => value.fa?.trim() || "سوال فارسی الزامی است",
                                        enRequired: (value) => value.en?.trim() || "سوال انگلیسی الزامی است",
                                    },
                                }}
                                render={({ field }) => (
                                    <MultiLangTextField
                                        {...field}
                                        label="متن سوال"
                                        required
                                        error={errors.question}
                                        placeholder={{
                                            fa: "سوال خود را به فارسی بنویسید...",
                                            en: "Write your question in English...",
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Answer */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                پاسخ
                            </Typography>
                            <Controller
                                name="answer"
                                control={control}
                                rules={{
                                    validate: {
                                        faRequired: (value) => value.fa?.trim() || "پاسخ فارسی الزامی است",
                                    },
                                }}
                                render={({ field }) => <MultiLangEditor {...field} label="پاسخ کامل" required error={errors.answer} height={300} />}
                            />
                        </Box>

                        {/* SEO Settings */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">تنظیمات سئو</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Controller
                                        name="seo.metaTitle"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="عنوان Meta"
                                                placeholder={{
                                                    fa: "عنوان سئو فارسی...",
                                                    en: "SEO title in English...",
                                                }}
                                                maxLength={60}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="seo.metaDescription"
                                        control={control}
                                        render={({ field }) => (
                                            <MultiLangTextField
                                                {...field}
                                                label="توضیحات Meta"
                                                multiline
                                                rows={3}
                                                placeholder={{
                                                    fa: "توضیحات سئو فارسی...",
                                                    en: "SEO description in English...",
                                                }}
                                                maxLength={160}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="seo.metaKeywords.fa"
                                        control={control}
                                        render={({ field }) => <TagInput {...field} label="کلمات کلیدی فارسی" placeholder="کلمه کلیدی اضافه کنید..." />}
                                    />

                                    <Controller name="seo.metaKeywords.en" control={control} render={({ field }) => <TagInput {...field} label="English Keywords" placeholder="Add keyword..." />} />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* Related Questions */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">سوالات مرتبط</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Controller
                                    name="relatedQuestions"
                                    control={control}
                                    render={({ field }) => <TagInput {...field} label="شناسه سوالات مرتبط" placeholder="ID سوال مرتبط را اضافه کنید..." helperText="شناسه سوالات مرتبط را وارد کنید" />}
                                />
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid item size={{xs:12, md:4}}>
                    <Stack spacing={3}>
                        {/* Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات
                            </Typography>

                            <Stack spacing={2}>
                                <Controller name="isActive" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="فعال" />} />

                                <Controller name="isFeatured" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="سوال ویژه" />} />

                                <Controller
                                    name="order"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="ترتیب نمایش"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            InputProps={{
                                                startAdornment: <Reorder sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    )}
                                />
                            </Stack>
                        </Box>

                        {/* Category */}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Category /> دسته‌بندی
                            </Typography>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <CategorySelector
                                        value={field.value ? [{ _id: field.value }] : []}
                                        onChange={(categories) => field.onChange(categories[0]?._id || "")}
                                        type="faq"
                                        label="انتخاب دسته‌بندی"
                                        multiple={false}
                                    />
                                )}
                            />
                        </Box>

                        {/* Tags */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                برچسب‌ها
                            </Typography>
                            <Controller name="tags.fa" control={control} render={({ field }) => <TagInput {...field} label="برچسب‌های فارسی" placeholder="برچسب فارسی اضافه کنید..." />} />
                            <Box sx={{ mt: 2 }}>
                                <Controller name="tags.en" control={control} render={({ field }) => <TagInput {...field} label="برچسب‌های انگلیسی" placeholder="Add English tags..." />} />
                            </Box>
                        </Box>

                        {/* Additional Settings */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                تنظیمات اضافی
                            </Typography>

                            <Stack spacing={2}>
                                <Controller
                                    name="difficulty"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth size="small">
                                            <InputLabel>سطح دشواری</InputLabel>
                                            <Select {...field} label="سطح دشواری">
                                                <MenuItem value="beginner">مبتدی</MenuItem>
                                                <MenuItem value="intermediate">متوسط</MenuItem>
                                                <MenuItem value="advanced">پیشرفته</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />

                                <Controller
                                    name="estimatedReadTime"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="زمان مطالعه (دقیقه)" type="number" size="small" fullWidth />}
                                />

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        میزان مفید بودن
                                    </Typography>
                                    <Controller
                                        name="helpfulness"
                                        control={control}
                                        render={({ field }) => (
                                            <Rating
                                                {...field}
                                                value={field.value || 0}
                                                onChange={(_, newValue) => field.onChange(newValue)}
                                                precision={0.5}
                                                size="large"
                                                emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
                                            />
                                        )}
                                    />
                                </Box>
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
                    {loading ? "در حال ذخیره..." : faq ? "ویرایش سوال" : "ایجاد سوال"}
                </Button>
            </Box>
        </Box>
    );
}
