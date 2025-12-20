import { useMemo } from "react";
import { joiResolver } from "@hookform/resolvers/joi";

/**
 * Hook for using Joi validation with react-hook-form
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Object} Resolver configuration for react-hook-form
 */
export const useJoiValidation = (schema) => {
    return useMemo(
        () => joiResolver(schema, {
            abortEarly: false, // Return all errors, not just the first one
        }),
        [schema]
    );
};

/**
 * Helper function to get field error from Joi validation errors
 * @param {Object} errors - react-hook-form errors object
 * @param {string} fieldPath - Field path (e.g., "title.fa" or "slug.en")
 * @returns {string|null} Error message or null
 */
export const getFieldError = (errors, fieldPath) => {
    if (!errors) return null;
    
    const pathParts = fieldPath.split(".");
    let error = errors;
    
    for (const part of pathParts) {
        if (!error || typeof error !== "object") return null;
        error = error[part];
    }
    
    if (!error) return null;
    
    // Handle different error formats
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.type) {
        // Handle validation rule errors
        const errorMessages = {
            required: "این فیلد الزامی است",
            min: `حداقل ${error.min} کاراکتر لازم است`,
            max: `حداکثر ${error.max} کاراکتر مجاز است`,
            pattern: "فرمت وارد شده صحیح نیست",
        };
        return errorMessages[error.type] || "مقدار وارد شده صحیح نیست";
    }
    
    return null;
};

/**
 * Helper function to validate a single field value
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {Object} formData - Current form data
 * @param {string} fieldPath - Field path to validate
 * @returns {string|null} Error message or null
 */
export const validateField = (schema, formData, fieldPath) => {
    try {
        const { error } = schema.validate(formData, {
            abortEarly: false,
            allowUnknown: true,
        });
        
        if (!error) return null;
        
        const fieldError = error.details.find(
            (detail) => detail.path.join(".") === fieldPath
        );
        
        if (!fieldError) return null;
        
        return fieldError.message;
    } catch (err) {
        console.error("Validation error:", err);
        return null;
    }
};

