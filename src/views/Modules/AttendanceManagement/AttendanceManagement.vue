<template>
  <DataTable
    :entity="entity"
    :title="title"
    :headers="fields"
    :data="items"
    :loading="loading"
    :pagination="pagination"
    :relations="relations"
    @filter="index"
    @view="view"
  />
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields as importedFields } from "@/fields/attendance";
import type { ColumnConfig } from "@/types/types";

const fields = ref<ColumnConfig[]>([...importedFields] as ColumnConfig[]);

const { index, items, loading, pagination } = useApi("/attendances");

const relations = "user";

const title = ref("Attendance Logs");
const entity = ref("Attendance");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

const view = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "View";
  data.value = dataParam;
};

onMounted(async () => {
  await index({ relations } as any);
});
</script>
