<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="action === 'View'"
    :visible="isFormVisible"
    :form="emptyNote"
    :data="data"
    :fields="fields"
    @close="isFormVisible = false"
    @execute="execute"
  />

  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">My Notes</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Private notes visible only to you within this company.
        </p>
      </div>

      <v-btn-toggle
        v-model="showArchived"
        color="primary"
        density="comfortable"
        mandatory
        variant="outlined"
      >
        <v-btn :value="false" prepend-icon="mdi-note-multiple-outline">Active</v-btn>
        <v-btn :value="true" prepend-icon="mdi-archive-outline">Archived</v-btn>
      </v-btn-toggle>
    </div>

    <Table
      :entity="entity"
      title="Notes"
      subtitle="Pinned notes appear first. Search covers titles, content, and categories."
      icon="mdi-note-edit-outline"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      empty-title="No notes here yet"
      empty-text="Create a note to keep personal HR reminders and working information in one place."
      @filter="loadNotes"
      @create="open('Create')"
      @view="open('View', $event)"
      @edit="open('Edit', $event)"
      @remove="open('Remove', $event)"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import Form from "@/components/Form.vue";
import Table from "@/components/Table.vue";
import { useApi } from "@/composables/useApi";
import { fields } from "@/fields/note";

const entity = "Note";
const action = ref("");
const data = ref<any>();
const isFormVisible = ref(false);
const showArchived = ref(false);
const lastFilter = ref<Record<string, any>>({});

const emptyNote = {
  id: "",
  title: "",
  content: "",
  category: "",
  color: "primary",
  is_pinned: false,
  is_archived: false,
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
} = useApi("/notes");

const loadNotes = async (filter: Record<string, any> = {}) => {
  lastFilter.value = filter;
  await index({ ...filter, archived: showArchived.value });
};

const open = (nextAction: string, item: any = null) => {
  action.value = nextAction;
  data.value = item ? { ...item } : { ...emptyNote, is_archived: showArchived.value };
  isFormVisible.value = true;
};

const execute = async (payload: any) => {
  if (action.value === "Create") await store(payload);
  if (action.value === "Edit") await update(payload.id, payload);
  if (action.value === "Remove") await destroy(payload.id);
  isFormVisible.value = false;
  await loadNotes(lastFilter.value);
};

watch(showArchived, () => loadNotes({ ...lastFilter.value, page: 1 }));
onMounted(() => loadNotes());
</script>
