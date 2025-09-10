import Joi from "joi";

// Article validation schema
export const articleValidation = Joi.object({
    title: Joi.object({
        fa: Joi.string().required().min(3).max(200).messages({
            "string.empty": "عنوان فارسی الزامی است",
            "string.min": "عنوان فارسی باید حداقل ۳ کاراکتر باشد",
            "string.max": "عنوان فارسی نباید بیش از ۲۰۰ کاراکتر باشد",
        }),
        en: Joi.string().allow("").max(200),
    }).required(),

    slug: Joi.object({
        fa: Joi.string()
            .required()
            .pattern(/^[a-z0-9-]+$/)
            .messages({
                "string.empty": "نامک فارسی الزامی است",
                "string.pattern.base": "نامک فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد",
            }),
        en: Joi.string()
            .allow("")
            .pattern(/^[a-z0-9-]+$/),
    }).required(),

    excerpt: Joi.object({
        fa: Joi.string().allow("").max(500),
        en: Joi.string().allow("").max(500),
    }),

    content: Joi.object({
        fa: Joi.string().required().min(50).messages({
            "string.empty": "محتوای فارسی الزامی است",
            "string.min": "محتوای فارسی باید حداقل ۵۰ کاراکتر باشد",
        }),
        en: Joi.string().allow("").min(50),
    }).required(),

    category: Joi.string().required().messages({
        "string.empty": "انتخاب دسته‌بندی الزامی است",
    }),

    tags: Joi.array().items(Joi.string()),
    featuredImage: Joi.string().uri().allow(""),
    status: Joi.string().valid("draft", "published", "archived").default("draft"),
    featured: Joi.boolean().default(false),
    allowComments: Joi.boolean().default(true),

    seoTitle: Joi.object({
        fa: Joi.string().allow("").max(60),
        en: Joi.string().allow("").max(60),
    }),

    seoDescription: Joi.object({
        fa: Joi.string().allow("").max(160),
        en: Joi.string().allow("").max(160),
    }),

    seoKeywords: Joi.object({
        fa: Joi.string().allow(""),
        en: Joi.string().allow(""),
    }),
});

// Service validation schema
export const serviceValidation = Joi.object({
    name: Joi.object({
        fa: Joi.string().required().min(3).max(100).messages({
            "string.empty": "نام فارسی الزامی است",
            "string.min": "نام فارسی باید حداقل ۳ کاراکتر باشد",
            "string.max": "نام فارسی نباید بیش از ۱۰۰ کاراکتر باشد",
        }),
        en: Joi.string().allow("").max(100),
    }).required(),

    slug: Joi.object({
        fa: Joi.string()
            .required()
            .pattern(/^[a-z0-9-]+$/)
            .messages({
                "string.empty": "نامک فارسی الزامی است",
                "string.pattern.base": "نامک فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد",
            }),
        en: Joi.string()
            .allow("")
            .pattern(/^[a-z0-9-]+$/),
    }).required(),

    shortDescription: Joi.object({
        fa: Joi.string().required().min(10).max(300).messages({
            "string.empty": "توضیح کوتاه فارسی الزامی است",
            "string.min": "توضیح کوتاه فارسی باید حداقل ۱۰ کاراکتر باشد",
        }),
        en: Joi.string().allow("").max(300),
    }).required(),

    fullDescription: Joi.object({
        fa: Joi.string().allow(""),
        en: Joi.string().allow(""),
    }),

    pricing: Joi.object({
        type: Joi.string().valid("fixed", "hourly", "custom").default("custom"),
        basePrice: Joi.number().min(0).default(0),
        currency: Joi.string().default("IRR"),
        description: Joi.object({
            fa: Joi.string().allow(""),
            en: Joi.string().allow(""),
        }),
    }),

    processSteps: Joi.array().items(
        Joi.object({
            title: Joi.object({
                fa: Joi.string().required(),
                en: Joi.string().allow(""),
            }),
            description: Joi.object({
                fa: Joi.string().allow(""),
                en: Joi.string().allow(""),
            }),
            order: Joi.number().required(),
        })
    ),

    duration: Joi.string().allow(""),
    category: Joi.string().allow(""),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid("active", "inactive", "archived").default("active"),
    featured: Joi.boolean().default(false),
    popular: Joi.boolean().default(false),
});

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
    emailVerified: Joi.boolean().default(false),
    phoneVerified: Joi.boolean().default(false),
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
