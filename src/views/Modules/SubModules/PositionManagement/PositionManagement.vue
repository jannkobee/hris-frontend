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
        <div class="text-h5 font-weight-bold">Position Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage the positions used across employee records.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Positions</v-chip>
    </div>

    <Table
      :entity="entity"
      title="Position Records"
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
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import { fields } from "@/fields/position";

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/positions");

const entity = ref("Position");
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
