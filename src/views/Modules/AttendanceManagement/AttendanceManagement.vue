<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :fields="fields"
    :data="data"
    @close="close"
    @execute="execute"
  />

  <DataTable
    :entity="entity"
    :title="title"
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
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields as importedFields } from "@/fields/attendance";
import type { ColumnConfig } from "@/types/types";
import Form from "@/components/Form.vue";

const fields = ref<ColumnConfig[]>([...importedFields] as ColumnConfig[]);

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/attendances");

const relations = "user";

const title = ref("Attendance Management");
const entity = ref("Attendance");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

type AttendanceForm = {
  id: string;
  user_id: string;
  date: string;
  time_in: string;
  time_out: string;
  status: string;
};

const initializeForm = (): AttendanceForm => ({
  id: "",
  user_id: "",
  date: "",
  time_in: "",
  time_out: "",
  status: "",
});

const form = ref<AttendanceForm>(initializeForm());

const readOnly = () => action.value === "View";

const create = () => {
  form.value = initializeForm();
  data.value = { ...form.value };
  action.value = "Create";
  isFormVisible.value = true;
};

const view = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "View";
  data.value = dataParam;
};

const edit = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Edit";
  data.value = { ...dataParam };
};

const remove = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Remove";
  data.value = dataParam;
};

const close = () => {
  isFormVisible.value = false;
  form.value = initializeForm();
};

const execute = async (payload: any) => {
  try {
    if (action.value === "Create") {
      await store(payload);
    } else if (action.value === "Edit") {
      await update(payload.id, payload);
    } else if (action.value === "Remove") {
      await destroy(payload.id);
    }

    isFormVisible.value = false;
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  await index({ relations } as any);
});
</script>
