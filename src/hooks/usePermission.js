"use client";
import { useAuth } from "./useAuth";

/**
 * Hook for checking user permissions
 * @returns {Object} Permission checking functions
 */
export const usePermission = () => {
    const { user } = useAuth();

    /**
     * Check if user has a specific permission
     * @param {string} permission - Permission string (e.g., 'articles.create', 'users.delete')
     * @returns {boolean}
     */
    const hasPermission = (permission) => {
        if (!user) return false;

        // Super admin has all permissions
        if (user.role?.name === "super_admin" || user.role?.permissions?.includes("admin.all")) {
            return true;
        }

        // Check if user has the specific permission
        const permissions = user.role?.permissions || [];
        
        // Support wildcard permissions (e.g., 'articles.*' matches 'articles.create')
        if (permissions.includes(permission)) {
            return true;
        }

        // Check wildcard patterns
        const permissionParts = permission.split(".");
        if (permissionParts.length === 2) {
            const wildcardPermission = `${permissionParts[0]}.*`;
            if (permissions.includes(wildcardPermission)) {
                return true;
            }
        }

        return false;
    };

    /**
     * Check if user has any of the specified permissions
     * @param {string[]} permissions - Array of permission strings
     * @returns {boolean}
     */
    const hasAnyPermission = (permissions) => {
        return permissions.some((permission) => hasPermission(permission));
    };

    /**
     * Check if user has all of the specified permissions
     * @param {string[]} permissions - Array of permission strings
     * @returns {boolean}
     */
    const hasAllPermissions = (permissions) => {
        return permissions.every((permission) => hasPermission(permission));
    };

    /**
     * Check if user has a specific role
     * @param {string|string[]} roleNames - Role name(s) to check
     * @returns {boolean}
     */
    const hasRole = (roleNames) => {
        if (!user) return false;
        
        const userRole = user.role?.name;
        if (Array.isArray(roleNames)) {
            return roleNames.includes(userRole);
        }
        return userRole === roleNames;
    };

    /**
     * Check if user is super admin
     * @returns {boolean}
     */
    const isSuperAdmin = () => {
        return hasRole("super_admin");
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        isSuperAdmin,
    };
};

