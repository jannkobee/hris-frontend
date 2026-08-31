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
    <ModuleHeader
      eyebrow="Access administration"
      title="User Management"
      subtitle="Manage user accounts and their role assignments."
      icon="mdi-account-multiple-outline"
    />

    <Table
      :entity="entity"
      title="User Records"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      :relations="relations"
      :show-import="true"
      :show-download-template="true"
      @filter="index"
      @create="create"
      @view="view"
      @edit="edit"
      @remove="remove"
      @download-template="handleDownloadTemplate"
      @import="handleImport"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { useUpload } from "@/composables/useUpload";
import { useNotification } from "@/composables/useNotification";
import axios from "@/plugins/axios";
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
const { downloadFile } = useUpload(); // 1. Use your upload composable
const { showNotification } = useNotification(); // 2. Use your notification composable

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
      showNotification("Success", "User created successfully.", "success");
    } else if (action.value === "Edit") {
      await update(data.id, data);
      showNotification("Success", "User updated successfully.", "success");
    } else if (action.value === "Remove") {
      await destroy(data.id);
      showNotification("Success", "User removed successfully.", "success");
    }

    isFormVisible.value = false;
  } catch (error: any) {
    console.error(error);
    showNotification(
      "Error",
      error?.response?.data?.message || "An error occurred.",
      "error",
    );
  }
};

const handleDownloadTemplate = async () => {
  try {
    // 3. Use configured axios and downloadFile to handle the binary stream securely
    const res = await axios.get("/users/template", {
      responseType: "arraybuffer",
    });

    downloadFile(res.data, "user_template.xlsx");
  } catch (error: any) {
    console.error("Error downloading template", error);
    showNotification("Error", "Failed to download template.", "error");
  }
};

const handleImport = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    loading.value = true; // Use table loading state

    // 4. Use the global axios instance so headers/tokens are handled automatically
    const response = await axios.post("/users/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    await index();
    showNotification(
      "Success",
      response.data.message || "Users imported successfully.",
      "success",
    );
  } catch (error: any) {
    console.error("Error uploading file", error);

    const errorMessage =
      error?.response?.data?.message || "An error occurred while importing.";
    showNotification("Import Failed", errorMessage, "error");
  } finally {
    loading.value = false;
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
