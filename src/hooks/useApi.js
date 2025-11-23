import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useDataStore } from "../store/useDataStore";
import toast from "react-hot-toast";

export const useApi = () => {
    const queryClient = useQueryClient();
    const { setData, updateItem, addItem, removeItem, invalidateCache } = useDataStore();

    const useFetchData = (key, endpoint, options = {}) => {
        return useQuery({
            queryKey: Array.isArray(key) ? key : [key],
            queryFn: async () => {
                // Create a new params object to avoid readonly issues
                const params = options.params ? { ...options.params } : {};
                const response = await api.get(endpoint, {
                    params,
                });
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
            ...options,
        });
    };

    const useUpdateData = (endpoint, options = {}) => {
        return useMutation({
            mutationFn: async ({ id, data }) => {
                const response = await api.put(`${endpoint}/${id}`, data);
                return response.data;
            },
            onSuccess: (data, variables) => {
                // Invalidate related queries
                const queryKey = options.queryKey || endpoint.split("/")[1] || "data";
                queryClient.invalidateQueries({ 
                    queryKey: [queryKey],
                    exact: false 
                });
                
                // Update cache if needed
                if (options.updateCache !== false) {
                    updateItem(queryKey, variables.id, variables.data);
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