<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="action === 'View'"
    :visible="isFormVisible"
    :form="form"
    :data="data"
    :fields="fields"
    @close="isFormVisible = false"
    @execute="execute"
  />

  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Announcement Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Create and publish company-wide announcements.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Announcements</v-chip>
    </div>

    <Table
      :entity="entity"
      title="Announcements"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      @filter="index"
      @create="open('Create')"
      @view="open('View', $event)"
      @edit="open('Edit', $event)"
      @remove="open('Remove', $event)"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useApi } from "@/composables/useApi";
import Form from "@/components/Form.vue";
import Table from "@/components/Table.vue";
import { fields } from "@/fields/announcement";

const entity = "Announcement";
const action = ref("");
const data = ref<any>();
const isFormVisible = ref(false);
const form = {
  id: "",
  title: "",
  content: "",
  published_at: "",
  is_active: true,
};

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/announcements");

const open = (nextAction: string, item: any = null) => {
  action.value = nextAction;
  data.value = item ? { ...item } : { ...form };
  isFormVisible.value = true;
};

const execute = async (payload: any) => {
  if (action.value === "Create") await store(payload);
  if (action.value === "Edit") await update(payload.id, payload);
  if (action.value === "Remove") await destroy(payload.id);
  isFormVisible.value = false;
};

onMounted(index);
</script>
