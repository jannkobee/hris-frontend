<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :form="form"
    :data="data"
    :fields="requestFields"
    @close="close"
    @execute="execute"
  />

  <v-container fluid>
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="requests">Leave Requests</v-tab>
      <v-tab value="credits">Leave Credits</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="requests">
        <Table
          :entity="entity"
          title="Manage Leave Requests"
          :headers="requestFields"
          :data="requestItems"
          :loading="loadingRequests"
          :pagination="requestPagination"
          :relations="requestRelations"
          @filter="fetchRequests"
          @create="createRequest"
          @view="viewRequest"
          @edit="editRequest"
          @remove="removeRequest"
        />
      </v-window-item>

      <v-window-item value="credits">
        <Table
          entity="LeaveCredit"
          title="Employee Leave Balances"
          :headers="creditFields"
          :data="creditItems"
          :loading="loadingCredits"
          :pagination="creditPagination"
          :relations="creditRelations"
          :showCreateAction="false"
          @filter="fetchCredits"
        />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import type { ColumnConfig } from "@/types/types";

// Import external field configurations
import { fields as importedRequestFields } from "@/fields/leave_request";
import { fields as importedCreditFields } from "@/fields/leave_credit";

const activeTab = ref("requests");
const entity = ref("LeaveRequest");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

const requestFields = ref<ColumnConfig[]>([...importedRequestFields]);
const creditFields = ref<ColumnConfig[]>([...importedCreditFields]);

const {
  index: fetchRequests,
  items: requestItems,
  loading: loadingRequests,
  loadingActions,
  pagination: requestPagination,
  store,
  update,
  destroy,
} = useApi("/leave-requests");

const {
  index: fetchCredits,
  items: creditItems,
  loading: loadingCredits,
  pagination: creditPagination,
} = useApi("/leave-credits");

const requestRelations = "employee,leaveType,approver";
const creditRelations = "employee,leaveType";

const form = ref<any>({
  id: "",
  employee_id: "",
  leave_type_id: "",
  start_date: "",
  end_date: "",
  reason: "",
  status: "pending",
});

const readOnly = () => action.value === "View";

const createRequest = () => {
  isFormVisible.value = true;
  action.value = "Create";
  data.value = { ...form.value };
};

const viewRequest = (item: any) => {
  isFormVisible.value = true;
  action.value = "View";
  data.value = item;
};

const editRequest = (item: any) => {
  isFormVisible.value = true;
  action.value = "Edit";
  data.value = { ...item };
};

const removeRequest = (item: any) => {
  isFormVisible.value = true;
  action.value = "Remove";
  data.value = item;
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
  await fetchRequests({ relations: requestRelations } as any);
  await fetchCredits({ relations: creditRelations } as any);
});
</script>
