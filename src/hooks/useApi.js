import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useDataStore } from "../store/useDataStore";
import toast from "react-hot-toast";

export const useApi = () => {
    const queryClient = useQueryClient();
    const { setData, updateItem, addItem, removeItem, invalidateCache } = useDataStore();

    const useFetchData = (key, endpoint, options = {}) => {
        // Extract params and other properties to avoid readonly issues
        const { params: optionsParams, ...restOptions } = options;
        
        return useQuery({
            queryKey: Array.isArray(key) ? key : [key],
            queryFn: async () => {
                // Create a new params object to avoid readonly issues
                // Use Object.assign to ensure we create a completely new object
                const params = optionsParams 
                    ? (typeof optionsParams === 'object' && !Array.isArray(optionsParams)
                        ? Object.assign({}, optionsParams)
                        : optionsParams)
                    : {};
                
                // Create a new config object to avoid readonly issues
                const config = params && Object.keys(params).length > 0
                    ? { params: Object.assign({}, params) }
                    : {};
                
                const response = await api.get(endpoint, config);
                return response.data;
            },
            retry: 3,
            staleTime: options.staleTime || 5 * 60 * 1000,
            cacheTime: options.cacheTime || 10 * 60 * 1000, // 10 minutes default cache
            refetchOnWindowFocus: false,
            enabled: options.enabled !== false,
            // Use select to transform data and prevent unnecessary re-renders
            select: options.select || undefined,
            onError: (error) => {
                // Error toast is handled by api interceptor
                if (options.onError) {
                    options.onError(error);
                }
            },
            // Spread rest options but exclude params to avoid readonly issues
            ...restOptions,
        });
    };

    const useUpdateData = (endpoint, options = {}) => {
        return useMutation({
            mutationFn: async ({ id, data }) => {
                // Support endpoints without ID (like settings)
                const url = id !== undefined && id !== null ? `${endpoint}/${id}` : endpoint;
                const response = await api.put(url, data);
                return response.data;
            },
            onSuccess: (responseData, variables) => {
                // Invalidate related queries - use broader pattern to catch all related queries
                const queryKey = options.queryKey || endpoint.split("/")[1] || "data";
                
                // Invalidate all queries that start with the queryKey
                // Use predicate function for more reliable matching
                queryClient.invalidateQueries({ 
                    predicate: (query) => {
                        const queryKeyArray = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey];
                        return queryKeyArray[0] === queryKey;
                    }
                });
                
                // Also invalidate statistics if it's tickets
                if (queryKey === "tickets") {
                    queryClient.invalidateQueries({ 
                        queryKey: ["tickets-statistics"],
                        exact: false 
                    });
                }
                
                // Update cache with response data if available
                if (options.updateCache !== false && responseData?.data?.ticket) {
                    // Use response data instead of variables.data for accurate updates
                    const updatedItem = responseData.data.ticket;
                    updateItem(queryKey, variables.id, updatedItem);
                }
                
                if (options.successMessage) {
                    toast.success(options.successMessage);
                }
                
                if (options.onSuccess) {
                    options.onSuccess(responseData, variables);
                }
            },
            onError: (error, variables) => {
                // Error toast is handled by api interceptor
                if (options.onError) {
                    options.onError(error, variables);
                }
            },
        });
    };

    const useCreateData = (endpoint, options = {}) => {
        return useMutation({
            mutationFn: async (data) => {
                const response = await api.post(endpoint, data);
                return response.data;
            },
            onSuccess: (data, variables) => {
                // Invalidate related queries
                const queryKey = options.queryKey || endpoint.split("/")[1] || "data";
                queryClient.invalidateQueries({ 
                    queryKey: [queryKey],
                    exact: false 
                });
                
                // Add to cache if needed
                if (options.updateCache !== false && data.data) {
                    addItem(queryKey, data.data);
                }
                
                if (options.successMessage) {
                    toast.success(options.successMessage);
                }
                
                if (options.onSuccess) {
                    options.onSuccess(data, variables);
                }
            },
            onError: (error, variables) => {
                // Error toast is handled by api interceptor
                if (options.onError) {
                    options.onError(error, variables);
                }
            },
        });
    };

    const useDeleteData = (endpoint, options = {}) => {
        return useMutation({
            mutationFn: async (idOrObject) => {
                // Support both direct ID (string/number) and object with id property
                const id = typeof idOrObject === 'object' && idOrObject !== null && 'id' in idOrObject
                    ? idOrObject.id
                    : idOrObject;
                const response = await api.delete(`${endpoint}/${id}`);
                return { data: response.data, id };
            },
            onSuccess: (result, idOrObject) => {
                // Extract id from result or idOrObject
                const id = result?.id || (typeof idOrObject === 'object' && idOrObject !== null && 'id' in idOrObject
                    ? idOrObject.id
                    : idOrObject);
                const data = result?.data || result;
                
                // Invalidate related queries
                const queryKey = options.queryKey || endpoint.split("/")[1] || "data";
                queryClient.invalidateQueries({ 
                    queryKey: [queryKey],
                    exact: false 
                });
                
                // Remove from cache if needed
                if (options.updateCache !== false) {
                    removeItem(queryKey, id);
                }
                
                if (options.successMessage) {
                    toast.success(options.successMessage);
                }
                
                if (options.onSuccess) {
                    options.onSuccess(data, id);
                }
            },
            onError: (error, idOrObject) => {
                // Extract id from idOrObject
                const id = typeof idOrObject === 'object' && idOrObject !== null && 'id' in idOrObject
                    ? idOrObject.id
                    : idOrObject;
                
                // Error toast is handled by api interceptor
                if (options.onError) {
                    options.onError(error, id);
                }
            },
        });
    };

    return { useFetchData, useCreateData, useUpdateData, useDeleteData };
};