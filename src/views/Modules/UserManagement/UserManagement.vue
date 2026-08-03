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
    @close="close"
    @execute="execute"
  />
  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">User Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage user accounts and their role assignments.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Users</v-chip>
    </div>

    <Table
      :entity="entity"
      title="User Records"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      :relations="relations"
      @filter="index"
      @create="create"
      @view="view"
      @edit="edit"
      @remove="remove"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, readonly } from "vue";
import { useApi } from "@/composables/useApi";
import { fields } from "@/fields/user";
import { User } from "@/types/types";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/users");

const { getOptions } = useApi("/roles");

const relations = "role";

const entity = ref("User");
const action = ref("");
const data = ref();

const isFormVisible = ref(false);

const form = ref<User>({
  id: "",
  role_id: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  gender: "",
  birthday: "",
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

  data.value = {
    ...dataParam,
    role: {
      id: dataParam.role_id,
      name: dataParam.role?.name || "",
    },
  };
};

const remove = (dataParam: any) => {
  isFormVisible.value = true;

  action.value = "Remove";

  data.value = dataParam;
};

const close = () => {
  isFormVisible.value = false;
};

const execute = async (data: any) => {
  try {
    if (action.value === "Create") {
      await store(data);
    } else if (action.value === "Edit") {
      await update(data.id, data);
    } else if (action.value === "Remove") {
      await destroy(data.id);
    }

    isFormVisible.value = false;
  } catch (error) {
    console.error(error);
  }
};

const addRoleOptions = async () => {
  const options = await getOptions();

  const roleOptions = options.map((option: any) => ({
    label: option.name,
    value: option.id,
  }));

  const roleField = fields.find((field) => field.key === "role.name");

  if (roleField) {
    roleField.inputOptions = roleOptions;
  }
};

onMounted(async () => {
  await addRoleOptions();
});
</script>
