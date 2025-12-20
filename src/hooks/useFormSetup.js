/**
 * Hook for common form setup patterns
 * Reduces code duplication in form initialization
 * 
 * @example
 * const {
 *   control,
 *   handleSubmit,
 *   formState: { errors, isDirty },
 *   reset,
 *   setValue,
 *   getValues,
 *   watch,
 * } = useFormSetup({
 *   validationSchema: article ? articleUpdateValidation : articleValidation,
 *   defaultValues: { title: { fa: '', en: '' }, ... },
 *   existingItem: article,
 *   normalizeItem: (item) => {
 *     // Custom normalization logic
 *     return normalizedItem;
 *   }
 * });
 */

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useJoiValidation } from './useJoiValidation';

/**
 * @param {Object} options - Configuration options
 * @param {Object} options.validationSchema - Joi validation schema
 * @param {Object} options.defaultValues - Default values for form
 * @param {Object|null} options.existingItem - Existing item to populate form
 * @param {Function} options.normalizeItem - Optional function to normalize existing item
 * @param {string} options.mode - Validation mode ('onChange' | 'onBlur' | 'onSubmit')
 * @returns {Object} Form methods from react-hook-form
 */
export const useFormSetup = ({
  validationSchema,
  defaultValues,
  existingItem,
  normalizeItem,
  mode = 'onChange',
}) => {
  const resolver = useJoiValidation(validationSchema);

  const formMethods = useForm({
    resolver,
    mode,
    defaultValues,
  });

  const { reset } = formMethods;
  
  // Use refs to track previous values and prevent infinite loops
  const previousExistingItemRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const defaultValuesRef = useRef(defaultValues);
  const normalizeItemRef = useRef(normalizeItem);

  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    defaultValuesRef.current = defaultValues;
    normalizeItemRef.current = normalizeItem;
  }, [defaultValues, normalizeItem]);

  useEffect(() => {
    // Skip on initial mount - form is already initialized with defaultValues
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousExistingItemRef.current = existingItem;
      
      // Only reset if we have an existing item on mount
      if (existingItem) {
        const normalizedItem = normalizeItemRef.current 
          ? normalizeItemRef.current(existingItem)
          : existingItem;
        reset(normalizedItem, { keepDefaultValues: false });
      }
      return;
    }

    // Only reset if existingItem actually changed (compare by reference or ID)
    const existingItemId = existingItem?._id || existingItem?.id;
    const previousItemId = previousExistingItemRef.current?._id || previousExistingItemRef.current?.id;
    
    if (existingItemId !== previousItemId) {
      previousExistingItemRef.current = existingItem;
      
      if (existingItem) {
        // Normalize existing item if normalize function provided
        const normalizedItem = normalizeItemRef.current 
          ? normalizeItemRef.current(existingItem)
          : existingItem;
        
        reset(normalizedItem, { keepDefaultValues: false });
      } else {
        // Reset to default values when no existing item
        reset(defaultValuesRef.current, { keepDefaultValues: false });
      }
    }
  }, [existingItem, reset]); // Only depend on existingItem and reset

  return formMethods;
};

