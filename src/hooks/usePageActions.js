"use client";
import { usePermission } from "./usePermission";

/**
 * Hook for standard page actions (view, edit, delete) with authorization
 * @param {string} resource - Resource name (e.g., 'articles', 'users', 'roles')
 * @returns {Object} Action handlers and permission checks
 */
export const usePageActions = (resource) => {
    const { hasPermission } = usePermission();

    // Check permissions for each action
    const canView = hasPermission(`${resource}.read`) || hasPermission(`${resource}.view`);
    const canEdit = hasPermission(`${resource}.update`) || hasPermission(`${resource}.edit`);
    const canDelete = hasPermission(`${resource}.delete`);
    const canCreate = hasPermission(`${resource}.create`);

    return {
        canView,
        canEdit,
        canDelete,
        canCreate,
        hasPermission,
    };
};

