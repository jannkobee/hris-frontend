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

  <DataTable
    :entity="entity"
    :title="title"
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
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields } from "@/fields/employment_status";

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/employment-statuses");

const title = ref("Employment Status Management");
const entity = ref("Employment_Statuses"); // match your permission slug style if needed
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

const form = ref<any>({
  id: "",
  name: "",
  description: "",
});

const readOnly = () => action.value === "View";

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
  data.value = { ...dataParam };
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
  if (action.value === "Create") await store(payload);
  if (action.value === "Edit") await update(payload.id, payload);
  if (action.value === "Remove") await destroy(payload.id);

  isFormVisible.value = false;
};

onMounted(async () => {
  await index();
});
</script>
