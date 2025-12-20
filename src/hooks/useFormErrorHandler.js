import { useCallback } from "react";

/**
 * Hook to handle form errors from backend and set them in react-hook-form state
 * @param {Object} setValue - setValue function from react-hook-form
 * @param {Object} getValues - getValues function from react-hook-form
 * @returns {Function} Function to handle errors
 */
export const useFormErrorHandler = (setValue, getValues) => {
    return useCallback((error) => {
        // Handle validation errors from backend - set them in form state
        if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            const validationErrors = error.response.data.errors;
            // Set errors in form state so they appear under inputs
            validationErrors.forEach(err => {
                const fieldPath = err.path?.join('.') || err.field || '';
                if (fieldPath) {
                    // Trigger validation by setting the value again
                    const currentValue = getValues(fieldPath);
                    setValue(fieldPath, currentValue, { 
                        shouldValidate: true,
                        shouldTouch: true 
                    });
                }
            });
            return true; // Indicates validation errors were handled
        }
        return false; // No validation errors, handle as general error
    }, [setValue, getValues]);
};

