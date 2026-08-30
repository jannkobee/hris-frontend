<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :form="form"
    :data="data"
    :fields="fields"
    :show-permission-action="
      canManageRolePermissions && action !== 'Create'
    "
    @permission="openPermissionModal"
    @close="close"
    @execute="execute"
  />
  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Role Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage roles and configure their permissions.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Roles</v-chip>
    </div>

    <Table
      :entity="entity"
      title="Role Records"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      @filter="index"
      @create="create"
      @view="view"
      @edit="edit"
      @remove="remove"
    />
  </v-container>

  <Permission
    v-if="canManageRolePermissions"
    :visible="isPermissionVisible"
    :action="action"
    :data="data"
    :readOnly="readOnly() || data?.name === 'Admin'"
    @close="closePermissionModal"
    @saved="syncSavedPermissions"
  />
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { useApi } from "@/composables/useApi";
import { fields } from "@/fields/role";
import { Role, RoleWithPermissions } from "@/types/types";
import Permission from "@/components/Permission.vue";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import { usePermissions } from "@/composables/usePermissions";

const { checkPermissions } = usePermissions();
const canManageRolePermissions = computed(() =>
  checkPermissions("manage-role-permissions"),
);

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi<RoleRecord>("/roles");

type RoleRecord = RoleWithPermissions & { id: string };

const relations = "permissions";

const entity = ref("Role");
const action = ref("");
const data = ref();

const isFormVisible = ref(false);
const isPermissionVisible = ref(false);

const form = ref<Role>({
  name: "",
  description: "",
});

const readOnly = () => {
  return action.value === "View";
};

const create = () => {
  isFormVisible.value = true;

  action.value = "Create";

  data.value = { ...form.value };
};

const view = (dataParam: any) => {
  isFormVisible.value = true;

  action.value = "View";

  data.value = dataParam;
};

const edit = (dataParam: any) => {
  isFormVisible.value = true;

  action.value = "Edit";

  data.value = dataParam;
};

const remove = (dataParam: any) => {
  isFormVisible.value = true;

  action.value = "Remove";

  data.value = dataParam;
};

const close = () => {
  isFormVisible.value = false;
};

const execute = async (payload: any) => {
  try {
    if (action.value === "Create") {
      const response = await store(payload);
      await index({ relations } as any);

      const createdRole = response.data?.data as RoleRecord | undefined;
      if (createdRole && canManageRolePermissions.value) {
        data.value =
          items.value.find((role) => role.id === createdRole.id) ??
          ({ ...createdRole, permissions: [] } as RoleRecord);
        action.value = "Edit";
        isFormVisible.value = false;
        isPermissionVisible.value = true;

        return;
      }
    } else if (action.value === "Edit") {
      await update(payload.id, payload);
      await index({ relations } as any);
    } else if (action.value === "Remove") {
      await destroy(payload.id);
      await index({ relations } as any);
    }

    isFormVisible.value = false;
  } catch (error) {
    console.error(error);
  }
};

const openPermissionModal = () => {
  isPermissionVisible.value = true;
};

const closePermissionModal = () => {
  isPermissionVisible.value = false;
};

const syncSavedPermissions = (updatedRole: RoleRecord) => {
  const roleIndex = items.value.findIndex((role) => role.id === updatedRole.id);
  const syncedRole =
    roleIndex === -1
      ? updatedRole
      : { ...items.value[roleIndex], ...updatedRole };

  if (roleIndex !== -1) {
    items.value.splice(roleIndex, 1, syncedRole);
  }

  data.value = syncedRole;
};

onMounted(async () => {
  await index({
    relations,
  } as any);
});
</script>
