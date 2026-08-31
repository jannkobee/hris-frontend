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
      eyebrow="Overtime configuration"
      title="Overtime Policy Management"
      subtitle="Configure premium multipliers for different day types."
      icon="mdi-clock-cog-outline"
    />

    <Table
      :entity="entity"
      title="Overtime Policy Configuration"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      @filter="index"
      @create="create"
      @edit="edit"
      @view="view"
      @remove="remove"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields as importedFields } from "@/fields/overtime_policy";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import type { ColumnConfig } from "@/types/types";

const fields = ref<ColumnConfig[]>([...importedFields]);

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/overtime-policies");

const entity = ref("OvertimePolicy");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

const form = ref<any>({
  id: "",
  day_type: "regular_day",
  multiplier: 1,
  is_active: true,
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
