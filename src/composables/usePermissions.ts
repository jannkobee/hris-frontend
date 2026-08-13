import { useAuth } from "@/composables/useAuth";

export const usePermissions = () => {
  const { authUser } = useAuth();

  const checkPermissions = (permission: string): boolean => {
    if (authUser.value?.role?.name === "Admin") return true;
    if (!authUser.value?.role?.permissions) return false;

    const assigned = authUser.value.role.permissions.some(
      (item: { slug: string }) => item.slug === permission,
    );
    if (assigned) return true;

    // The API uses one capability-based permission for all write operations.
    // Normalize legacy table requests so FE and BE share the same contract.
    const normalized = permission.replace(
      /^(create|update|delete)-/,
      "manage-",
    );

    return authUser.value.role.permissions.some(
      (item: { slug: string }) => item.slug === normalized,
    );
  };

  const canCreate = (entity: string) =>
    checkPermissions(`manage-${entity.toLowerCase()}s`);
  const canUpdate = (entity: string) =>
    checkPermissions(`manage-${entity.toLowerCase()}s`);
  const canDelete = (entity: string) =>
    checkPermissions(`manage-${entity.toLowerCase()}s`);
  const canView = (entity: string) =>
    checkPermissions(`view-${entity.toLowerCase()}s`);

  return {
    checkPermissions,
    hasAnyPermission: (permissions: string[]) =>
      permissions.some(checkPermissions),
    canCreate,
    canUpdate,
    canDelete,
    canView,
  };
};
