/**
 * Hook for handling form submission with common patterns
 * Reduces code duplication across all forms
 * 
 * @example
 * const { submit, loading } = useFormSubmission({
 *   endpoint: '/articles',
 *   queryKey: 'articles',
 *   existingItem: article,
 *   createMessage: 'مقاله با موفقیت ایجاد شد',
 *   updateMessage: 'مقاله با موفقیت ویرایش شد',
 *   onSuccess: onSave,
 *   transformData: (data) => {
 *     // Custom data transformation
 *     return transformedData;
 *   }
 * });
 */

import { useState } from 'react';
import { useApi } from './useApi';
import { useFormErrorHandler } from './useFormErrorHandler';
import toast from 'react-hot-toast';

/**
 * @param {Object} options - Configuration options
 * @param {string} options.endpoint - API endpoint (e.g., '/articles', '/services')
 * @param {string} options.queryKey - Query key for cache invalidation
 * @param {Object|null} options.existingItem - Existing item for update mode, null for create
 * @param {string} options.createMessage - Success message for create
 * @param {string} options.updateMessage - Success message for update
 * @param {Function} options.onSuccess - Callback on successful submission
 * @param {Function} options.transformData - Optional function to transform data before submission
 * @param {Function} options.onError - Optional custom error handler
 * @param {Object} options.setValue - setValue from react-hook-form
 * @param {Object} options.getValues - getValues from react-hook-form
 * @returns {Object} { submit, loading }
 */
export const useFormSubmission = ({
  endpoint,
  queryKey,
  existingItem,
  createMessage,
  updateMessage,
  onSuccess,
  transformData,
  onError,
  setValue,
  getValues,
}) => {
  const [loading, setLoading] = useState(false);
  const { useCreateData, useUpdateData } = useApi();
  
  const createMutation = useCreateData(endpoint, {
    queryKey: queryKey || endpoint.split('/')[1] || 'data',
  });
  
  const updateMutation = useUpdateData(endpoint, {
    queryKey: queryKey || endpoint.split('/')[1] || 'data',
  });

  // Initialize error handler if setValue and getValues are provided
  const handleFormError = setValue && getValues 
    ? useFormErrorHandler(setValue, getValues)
    : null;

  /**
   * Submit form data
   * @param {Object} data - Form data from react-hook-form
   * @returns {Promise<boolean>} true if successful, false otherwise
   */
  const submit = async (data) => {
    setLoading(true);

    try {
      // Transform data if transform function provided
      const submitData = transformData ? transformData(data) : data;

      if (existingItem) {
        await updateMutation.mutateAsync({
          id: existingItem._id || existingItem.id,
          data: submitData,
        });
        toast.success(updateMessage || 'با موفقیت به‌روزرسانی شد');
      } else {
        await createMutation.mutateAsync(submitData);
        toast.success(createMessage || 'با موفقیت ایجاد شد');
      }

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      // Handle validation errors if error handler is available
      if (handleFormError) {
        const hasValidationErrors = handleFormError(error);
        if (hasValidationErrors) {
          toast.error('لطفاً خطاهای اعتبارسنجی را برطرف کنید');
          if (onError) onError(error, true); // true = validation error
          return false;
        }
      }

      // Handle general errors
      let errorMessage = 'خطا در ذخیره اطلاعات';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      
      if (onError) {
        onError(error, false); // false = general error
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
};

