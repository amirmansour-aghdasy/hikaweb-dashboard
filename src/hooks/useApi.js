import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";

export const useApi = () => {
    const queryClient = useQueryClient();
    const { setData, updateItem, addItem, removeItem } = useDataStore();
    const { showSnackbar } = useUIStore();

    const useFetchData = (key, endpoint, options = {}) => {
        return useQuery({
            queryKey: Array.isArray(key) ? key : [key],
            queryFn: async () => {
                const response = await api.get(endpoint);
                return response.data;
            },
            retry: 3,
            staleTime: 5 * 60 * 1000,
            onError: (error) => {
                showSnackbar("خطا در دریافت اطلاعات", "error");
            },
        });
    };

    const useUpdateData = (endpoint, options = {}) => {
        return useMutation({
            mutationFn: async ({ id, data }) => {
                const response = await api.put(`${endpoint}/${id}`, data);
                return response.data;
            },
            onSuccess: () => {
                // Invalidate همه queries مرتبط
                queryClient.invalidateQueries({ queryKey: ['users'] });
                showSnackbar(options.successMessage || "با موفقیت به‌روزرسانی شد", "success");
            },
            onError: (error) => {
                showSnackbar(error.response?.data?.message || "خطا در به‌روزرسانی", "error");
            },
        });
    };

    const useCreateData = (endpoint, options = {}) => {
        return useMutation({
            mutationFn: async (data) => {
                const response = await api.post(endpoint, data);
                return response.data;
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [options.storeKey || 'data'] });
                showSnackbar(options.successMessage || "با موفقیت ایجاد شد", "success");
            },
            onError: (error) => {
                showSnackbar(error.response?.data?.message || "خطا در ایجاد", "error");
            },
        });
    };

    const useDeleteData = (endpoint, options = {}) => {
        return useMutation({
            mutationFn: async (id) => {
                const response = await api.delete(`${endpoint}/${id}`);
                return response.data;
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [options.storeKey || 'data'] });
                showSnackbar(options.successMessage || "با موفقیت حذف شد", "success");
            },
            onError: (error) => {
                showSnackbar(error.response?.data?.message || "خطا در حذف", "error");
            },
        });
    };

    return { useFetchData, useCreateData, useUpdateData, useDeleteData };
};