import Joi from "joi";

// Article validation schema - matches backend schema
export const articleValidation = Joi.object({
    title: Joi.object({
        fa: Joi.string().required().trim().min(5).max(200).messages({
            "string.empty": "عنوان فارسی الزامی است",
            "string.min": "عنوان فارسی باید حداقل ۵ کاراکتر باشد",
            "string.max": "عنوان فارسی نمی‌تواند بیش از ۲۰۰ کاراکتر باشد",
            "any.required": "عنوان فارسی الزامی است",
        }),
        en: Joi.string().required().trim().min(5).max(200).messages({
            "string.empty": "عنوان انگلیسی الزامی است",
            "string.min": "عنوان انگلیسی باید حداقل ۵ کاراکتر باشد",
            "any.required": "عنوان انگلیسی الزامی است",
        }),
    }).required(),

    slug: Joi.object({
        fa: Joi.string()
            .optional()
            .trim()
            .pattern(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9-]+$/)
            .messages({
                "string.pattern.base": "آدرس یکتا فارسی فقط می‌تواند شامل حروف فارسی، حروف انگلیسی کوچک، اعداد و خط تیره باشد",
            }),
        en: Joi.string()
            .optional()
            .trim()
            .lowercase()
            .pattern(/^[a-z0-9-]+$/)
            .messages({
                "string.pattern.base": "آدرس یکتا انگلیسی فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد",
            }),
    }).optional(),

    excerpt: Joi.object({
        fa: Joi.string().allow("").max(500),
        en: Joi.string().allow("").max(500),
    }).optional(),

    content: Joi.object({
        fa: Joi.string().required().min(50).messages({
            "string.empty": "محتوای فارسی الزامی است",
            "string.min": "محتوای فارسی باید حداقل ۵۰ کاراکتر باشد",
            "any.required": "محتوای فارسی الزامی است",
        }),
        en: Joi.string().required().min(50).messages({
            "string.empty": "محتوای انگلیسی الزامی است",
            "string.min": "محتوای انگلیسی باید حداقل ۵۰ کاراکتر باشد",
            "any.required": "محتوای انگلیسی الزامی است",
        }),
    }).required(),

    featuredImage: Joi.string().allow("").optional(),

    categories: Joi.array()
        .items(
            Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    "string.pattern.base": "شناسه دسته‌بندی نامعتبر است",
                })
        )
        .min(1)
        .required()
        .messages({
            "array.min": "حداقل یک دسته‌بندی باید انتخاب شود",
            "any.required": "دسته‌بندی الزامی است",
        }),

    tags: Joi.object({
        fa: Joi.array().items(Joi.string().trim()).optional(),
        en: Joi.array().items(Joi.string().trim()).optional(),
    }).optional(),

    isPublished: Joi.boolean().default(false),
    isFeatured: Joi.boolean().default(false),
    allowComments: Joi.boolean().default(true),

    metaTitle: Joi.object({
        fa: Joi.string().allow("").max(60),
        en: Joi.string().allow("").max(60),
    }).optional(),

    metaDescription: Joi.object({
        fa: Joi.string().allow("").max(160),
        en: Joi.string().allow("").max(160),
    }).optional(),

    metaKeywords: Joi.object({
        fa: Joi.array().items(Joi.string()),
        en: Joi.array().items(Joi.string()),
    }).optional(),

    downloadBox: Joi.object({
        title: Joi.object({
            fa: Joi.string().allow("").max(200),
            en: Joi.string().allow("").max(200),
        }).optional(),
        description: Joi.object({
            fa: Joi.string().allow("").max(500),
            en: Joi.string().allow("").max(500),
        }).optional(),
        fileUrl: Joi.string().uri().allow("").optional(),
        fileName: Joi.string().allow("").optional(),
        fileSize: Joi.number().min(0).optional(),
        fileType: Joi.string().allow("").optional(),
        isActive: Joi.boolean().default(false),
    }).optional(),
});

// Update schema for edit mode (all fields optional)
export const articleUpdateValidation = articleValidation.fork(
    ["title", "slug", "content", "categories"],
    (schema) => schema.optional()
);

// Service validation schema
export const serviceValidation = Joi.object({
    name: Joi.object({
        fa: Joi.string().required().min(3).max(100).messages({
            "string.empty": "نام فارسی الزامی است",
            "string.min": "نام فارسی باید حداقل ۳ کاراکتر باشد",
            "string.max": "نام فارسی نباید بیش از ۱۰۰ کاراکتر باشد",
        }),
        en: Joi.string().required().min(3).max(100).messages({
            "string.empty": "نام انگلیسی الزامی است",
            "string.min": "نام انگلیسی باید حداقل ۳ کاراکتر باشد",
        }),
    }).required(),

    slug: Joi.object({
        fa: Joi.string()
            .required()
            .trim()
            .pattern(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9-]+$/)
            .messages({
                "string.empty": "نامک فارسی الزامی است",
                "string.pattern.base": "نامک فارسی فقط می‌تواند شامل حروف فارسی، حروف انگلیسی کوچک، اعداد و خط تیره باشد",
            }),
        en: Joi.string()
            .required()
            .trim()
            .lowercase()
            .pattern(/^[a-z0-9-]+$/)
            .messages({
                "string.empty": "نامک انگلیسی الزامی است",
                "string.pattern.base": "نامک انگلیسی فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد",
            }),
    }).required(),

    description: Joi.object({
        fa: Joi.string().required().min(50).messages({
            "string.empty": "توضیحات فارسی الزامی است",
            "string.min": "توضیحات باید حداقل ۵۰ کاراکتر باشد",
            "any.required": "توضیحات فارسی الزامی است",
        }),
        en: Joi.string().required().min(50).messages({
            "string.empty": "توضیحات انگلیسی الزامی است",
            "string.min": "توضیحات باید حداقل ۵۰ کاراکتر باشد",
            "any.required": "توضیحات انگلیسی الزامی است",
        }),
    }).required(),

    shortDescription: Joi.object({
        fa: Joi.string().max(300).optional(),
        en: Joi.string().max(300).optional(),
    }).optional(),

    icon: Joi.string().allow("").optional(),
    featuredImage: Joi.string().allow("").optional(),

    categories: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required()
        .messages({
            "array.min": "حداقل یک دسته‌بندی باید انتخاب شود",
            "any.required": "دسته‌بندی الزامی است",
        }),

    pricing: Joi.object({
        startingPrice: Joi.number().min(0).optional(),
        currency: Joi.string().valid("IRR", "USD", "EUR").default("IRR"),
        isCustom: Joi.boolean().default(false),
        packages: Joi.array()
            .items(
                Joi.object({
                    name: Joi.object({
                        fa: Joi.string().required(),
                        en: Joi.string().required(),
                    }).required(),
                    value: Joi.string().required(),
                    subTitle: Joi.object({
                        fa: Joi.string(),
                        en: Joi.string(),
                    }).optional(),
                    features: Joi.array().items(Joi.string()).optional(),
                    desc: Joi.object({
                        fa: Joi.string(),
                        en: Joi.string(),
                    }).optional(),
                    actionBtnText: Joi.object({
                        fa: Joi.string(),
                        en: Joi.string(),
                    }).optional(),
                    duration: Joi.string().optional(),
                    isPopular: Joi.boolean().default(false),
                })
            )
            .optional(),
    }).optional(),

    processSteps: Joi.array()
        .items(
            Joi.object({
                title: Joi.string().required(),
                description: Joi.object({
                    fa: Joi.string(),
                    en: Joi.string(),
                }).optional(),
                icon: Joi.string().optional(),
                order: Joi.number().required(),
            })
        )
        .optional(),

    features: Joi.array()
        .items(
            Joi.object({
                title: Joi.object({
                    fa: Joi.string().required(),
                    en: Joi.string().required(),
                }).required(),
                description: Joi.object({
                    fa: Joi.string(),
                    en: Joi.string(),
                }).optional(),
                icon: Joi.string().optional(),
            })
        )
        .optional(),

    subServices: Joi.array()
        .items(
            Joi.object({
                icon: Joi.string().required(),
                title: Joi.object({
                    fa: Joi.string().required(),
                    en: Joi.string().required(),
                }).required(),
            })
        )
        .optional(),

    isPopular: Joi.boolean().default(false),
    orderIndex: Joi.number().default(0),
});

// Update schema for edit mode
export const serviceUpdateValidation = serviceValidation.fork(
    ["name", "slug", "description", "categories"],
    (schema) => schema.optional()
);

// User validation schema
export const userValidation = Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
        "string.empty": "نام الزامی است",
        "string.min": "نام باید حداقل ۲ کاراکتر باشد",
        "string.max": "نام نباید بیش از ۵۰ کاراکتر باشد",
    }),

    email: Joi.string().email().required().messages({
        "string.empty": "ایمیل الزامی است",
        "string.email": "فرمت ایمیل نادرست است",
    }),

    phone: Joi.string()
        .pattern(/^09\d{9}$/)
        .allow("")
        .messages({
            "string.pattern.base": "شماره تلفن نادرست است",
        }),

    password: Joi.string()
        .min(6)
        .when("$isUpdate", {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            "string.empty": "رمز عبور الزامی است",
            "string.min": "رمز عبور باید حداقل ۶ کاراکتر باشد",
        }),

    role: Joi.string().required().messages({
        "string.empty": "انتخاب نقش الزامی است",
    }),

    status: Joi.string().valid("active", "inactive", "suspended").default("active"),
    avatar: Joi.string().uri().allow(""),
    bio: Joi.string().allow("").max(500),
    isEmailVerified: Joi.boolean().default(false),
    isPhoneVerified: Joi.boolean().default(false),
});

// Login validation schema
export const loginValidation = Joi.object({
    email: Joi.string().email().required().messages({
        "string.empty": "ایمیل الزامی است",
        "string.email": "فرمت ایمیل نادرست است",
    }),

    password: Joi.string().required().messages({
        "string.empty": "رمز عبور الزامی است",
    }),
});

// Comment validation schema
export const commentValidation = Joi.object({
    content: Joi.string().required().min(10).max(1000).messages({
        "string.empty": "متن نظر الزامی است",
        "string.min": "نظر باید حداقل ۱۰ کاراکتر باشد",
        "string.max": "نظر نباید بیش از ۱۰۰۰ کاراکتر باشد",
    }),

    rating: Joi.number().min(1).max(5).required().messages({
        "number.min": "امتیاز باید بین ۱ تا ۵ باشد",
        "number.max": "امتیاز باید بین ۱ تا ۵ باشد",
        "any.required": "امتیاز الزامی است",
    }),

    author: Joi.object({
        name: Joi.string().required().min(2).max(50),
        email: Joi.string().email().required(),
    }).required(),
});

// Settings validation schema
export const settingsValidation = Joi.object({
    siteName: Joi.object({
        fa: Joi.string().required(),
        en: Joi.string().allow(""),
    }),

    siteDescription: Joi.object({
        fa: Joi.string().allow(""),
        en: Joi.string().allow(""),
    }),

    contactInfo: Joi.object({
        address: Joi.object({
            fa: Joi.string().allow(""),
            en: Joi.string().allow(""),
        }),
        phone: Joi.string().allow(""),
        email: Joi.string().email().allow(""),
        workingHours: Joi.object({
            fa: Joi.string().allow(""),
            en: Joi.string().allow(""),
        }),
    }),

    socialMedia: Joi.object({
        telegram: Joi.string().uri().allow(""),
        instagram: Joi.string().uri().allow(""),
        linkedin: Joi.string().uri().allow(""),
        twitter: Joi.string().uri().allow(""),
        youtube: Joi.string().uri().allow(""),
    }),

    seoSettings: Joi.object({
        metaTitle: Joi.object({
            fa: Joi.string().allow("").max(60),
            en: Joi.string().allow("").max(60),
        }),
        metaDescription: Joi.object({
            fa: Joi.string().allow("").max(160),
            en: Joi.string().allow("").max(160),
        }),
        metaKeywords: Joi.object({
            fa: Joi.string().allow(""),
            en: Joi.string().allow(""),
        }),
        googleAnalyticsId: Joi.string().allow(""),
        googleSearchConsoleId: Joi.string().allow(""),
    }),
});

// Video validation schema - matches backend schema
export const videoValidation = Joi.object({
    title: Joi.object({
        fa: Joi.string().required().trim().max(200).messages({
            "string.empty": "عنوان فارسی الزامی است",
            "any.required": "عنوان فارسی الزامی است",
        }),
        en: Joi.string().required().trim().max(200).messages({
            "string.empty": "عنوان انگلیسی الزامی است",
            "any.required": "عنوان انگلیسی الزامی است",
        }),
    }).required(),

    slug: Joi.object({
        fa: Joi.string()
            .optional()
            .trim()
            .pattern(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9-]+$/)
            .messages({
                "string.pattern.base": "آدرس یکتا فارسی فقط می‌تواند شامل حروف فارسی، حروف انگلیسی کوچک، اعداد و خط تیره باشد",
            }),
        en: Joi.string()
            .optional()
            .trim()
            .lowercase()
            .pattern(/^[a-z0-9-]+$/)
            .messages({
                "string.pattern.base": "آدرس یکتا انگلیسی فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد",
            }),
    }).optional(),

    description: Joi.object({
        fa: Joi.string().max(2000).allow("").optional(),
        en: Joi.string().max(2000).allow("").optional(),
    }).optional(),

    shortDescription: Joi.object({
        fa: Joi.string().max(500).allow("").optional(),
        en: Joi.string().max(500).allow("").optional(),
    }).optional(),

    videoUrl: Joi.string().uri().required().messages({
        "string.empty": "آدرس ویدیو الزامی است",
        "string.uri": "آدرس ویدیو باید یک URL معتبر باشد",
        "any.required": "آدرس ویدیو الزامی است",
    }),

    thumbnailUrl: Joi.string().uri().required().messages({
        "string.empty": "تصویر بندانگشتی الزامی است",
        "string.uri": "آدرس تصویر بندانگشتی باید یک URL معتبر باشد",
        "any.required": "تصویر بندانگشتی الزامی است",
    }),

    videoMediaId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).optional().messages({
        "string.pattern.base": "شناسه ویدیو نامعتبر است",
    }),

    duration: Joi.number().min(0).required().messages({
        "number.min": "مدت زمان باید عدد مثبت باشد",
        "any.required": "مدت زمان الزامی است",
    }),

    fileSize: Joi.number().min(0).optional(),

    quality: Joi.string().valid("360p", "480p", "720p", "1080p", "1440p", "2160p", "auto").default("auto"),

    format: Joi.string().valid("mp4", "webm", "m3u8", "other").default("mp4"),

    categories: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .optional(),

    tags: Joi.object({
        fa: Joi.array().items(Joi.string().trim()).optional(),
        en: Joi.array().items(Joi.string().trim()).optional(),
    }).optional(),

    relatedServices: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .optional(),

    relatedPortfolios: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .optional(),

    relatedArticles: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .optional(),

    isPublished: Joi.boolean().default(false),
    isFeatured: Joi.boolean().default(false),

    metadata: Joi.object({
        width: Joi.number().optional(),
        height: Joi.number().optional(),
        fps: Joi.number().optional(),
        codec: Joi.string().optional(),
        bitrate: Joi.number().optional(),
    }).optional(),

    seo: Joi.object({
        metaTitle: Joi.object({
            fa: Joi.string().allow("").max(60).optional(),
            en: Joi.string().allow("").max(60).optional(),
        }).optional(),
        metaDescription: Joi.object({
            fa: Joi.string().allow("").max(160).optional(),
            en: Joi.string().allow("").max(160).optional(),
        }).optional(),
        metaKeywords: Joi.object({
            fa: Joi.array().items(Joi.string()).optional(),
            en: Joi.array().items(Joi.string()).optional(),
        }).optional(),
        ogImage: Joi.string().uri().allow("").optional(),
    }).optional(),

    infoBox: Joi.object({
        title: Joi.object({
            fa: Joi.string().allow("").optional(),
            en: Joi.string().allow("").optional(),
        }).optional(),
        content: Joi.object({
            fa: Joi.string().allow("").optional(),
            en: Joi.string().allow("").optional(),
        }).optional(),
        isActive: Joi.boolean().default(false),
    }).optional(),
});

// Update schema for edit mode
export const videoUpdateValidation = videoValidation.fork(
    ["title", "slug", "videoUrl", "thumbnailUrl", "duration"],
    (schema) => schema.optional()
);

// Portfolio validation schema
export const portfolioValidation = Joi.object({
    title: Joi.object({
        fa: Joi.string().required().trim().min(5).max(200).messages({
            "string.empty": "عنوان فارسی الزامی است",
            "string.min": "عنوان باید حداقل ۵ کاراکتر باشد",
        }),
        en: Joi.string().required().trim().min(5).max(200).messages({
            "string.empty": "عنوان انگلیسی الزامی است",
        }),
    }).required(),

    slug: Joi.object({
        fa: Joi.string()
            .required()
            .trim()
            .pattern(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9-]+$/)
            .messages({
                "string.empty": "نامک فارسی الزامی است",
                "string.pattern.base": "نامک فارسی فقط می‌تواند شامل حروف فارسی، حروف انگلیسی کوچک، اعداد و خط تیره باشد",
            }),
        en: Joi.string()
            .required()
            .trim()
            .lowercase()
            .pattern(/^[a-z0-9-]+$/)
            .messages({
                "string.empty": "نامک انگلیسی الزامی است",
                "string.pattern.base": "نامک انگلیسی فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد",
            }),
    }).required(),

    description: Joi.object({
        fa: Joi.string().required().min(50).messages({
            "string.empty": "توضیحات فارسی الزامی است",
            "string.min": "توضیحات باید حداقل ۵۰ کاراکتر باشد",
            "any.required": "توضیحات فارسی الزامی است",
        }),
        en: Joi.string().required().min(50).messages({
            "string.empty": "توضیحات انگلیسی الزامی است",
            "string.min": "توضیحات باید حداقل ۵۰ کاراکتر باشد",
            "any.required": "توضیحات انگلیسی الزامی است",
        }),
    }).required(),

    shortDescription: Joi.object({
        fa: Joi.string().max(300).optional(),
        en: Joi.string().max(300).optional(),
    }).optional(),

    client: Joi.object({
        name: Joi.string().required().trim().max(100).messages({
            "any.required": "نام مشتری الزامی است",
        }),
        logo: Joi.string().allow("").optional(),
        website: Joi.string().uri().allow("").optional(),
        industry: Joi.object({
            fa: Joi.string().optional(),
            en: Joi.string().optional(),
        }).optional(),
        size: Joi.string().valid("startup", "small", "medium", "large", "enterprise").optional(),
    }).required(),

    project: Joi.object({
        duration: Joi.number().required().min(1).messages({
            "any.required": "مدت زمان پروژه الزامی است",
            "number.min": "مدت زمان باید حداقل ۱ روز باشد",
        }),
        budget: Joi.string().valid("under-1m", "1m-5m", "5m-10m", "10m-50m", "over-50m").optional(),
        completedAt: Joi.date().required().messages({
            "any.required": "تاریخ تکمیل پروژه الزامی است",
        }),
        projectType: Joi.object({
            fa: Joi.string().optional(),
            en: Joi.string().optional(),
        }).optional(),
    }).required(),

    services: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required()
        .messages({
            "array.min": "حداقل یک خدمت باید انتخاب شود",
            "any.required": "خدمات الزامی است",
        }),

    categories: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .optional(),

    featuredImage: Joi.string().required().messages({
        "any.required": "تصویر اصلی الزامی است",
    }),

    tags: Joi.object({
        fa: Joi.array().items(Joi.string().trim()).optional(),
        en: Joi.array().items(Joi.string().trim()).optional(),
    }).optional(),

    isPublished: Joi.boolean().default(false),
    isFeatured: Joi.boolean().default(false),
});

// Update schema for edit mode
export const portfolioUpdateValidation = portfolioValidation.fork(
    ["title", "slug", "description", "client", "project", "services", "featuredImage"],
    (schema) => schema.optional()
);

// Category validation schema
export const categoryValidation = Joi.object({
    name: Joi.object({
        fa: Joi.string().required().trim().min(2).max(100).messages({
            "string.empty": "نام فارسی دسته‌بندی الزامی است",
            "string.min": "نام باید حداقل ۲ کاراکتر باشد",
        }),
        en: Joi.string().required().trim().min(2).max(100).messages({
            "string.empty": "نام انگلیسی دسته‌بندی الزامی است",
        }),
    }).required(),

    slug: Joi.object({
        fa: Joi.string()
            .required()
            .trim()
            .pattern(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9-]+$/)
            .messages({
                "string.empty": "نامک فارسی الزامی است",
                "string.pattern.base": "نامک فارسی فقط می‌تواند شامل حروف فارسی، حروف انگلیسی کوچک، اعداد و خط تیره باشد",
            }),
        en: Joi.string()
            .required()
            .trim()
            .lowercase()
            .pattern(/^[a-z0-9-]+$/)
            .messages({
                "string.empty": "نامک انگلیسی الزامی است",
                "string.pattern.base": "نامک انگلیسی فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد",
            }),
    }).required(),

    description: Joi.object({
        fa: Joi.string().allow("").optional(),
        en: Joi.string().allow("").optional(),
    }).optional(),

    type: Joi.string().required().valid("article", "service", "portfolio", "faq").messages({
        "string.empty": "نوع دسته‌بندی الزامی است",
        "any.required": "نوع دسته‌بندی الزامی است",
    }),

    parent: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).optional(),
    icon: Joi.string().allow("").optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default("#000000"),
    orderIndex: Joi.number().default(0),
});

// Update schema for edit mode
export const categoryUpdateValidation = categoryValidation.fork(
    ["name", "slug", "type"],
    (schema) => schema.optional()
).keys({
    status: Joi.string().valid("active", "inactive", "archived").optional(),
});

// Validation helper function
export const validateData = (schema, data, options = {}) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        context: options,
        ...options,
    });

    if (error) {
        const validationErrors = {};
        error.details.forEach((detail) => {
            const path = detail.path.join(".");
            validationErrors[path] = detail.message;
        });

        return {
            isValid: false,
            errors: validationErrors,
            data: null,
        };
    }

    return {
        isValid: true,
        errors: {},
        data: value,
    };
};
