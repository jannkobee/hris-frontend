<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :form="form"
    :data="data"
    :fields="activeFields"
    @close="close"
    @execute="execute"
  />

  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Leave Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage employee leave requests, credits, and conversions.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Leave</v-chip>
    </div>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab v-for="key in tabKeys" :key="key" :value="key">
        {{ tabLabels[key] }}
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item v-for="key in tabKeys" :key="key" :value="key">
        <Table
          :entity="tabs[key].entity"
          :title="tabs[key].title"
          :headers="tabs[key].fields.value"
          :data="tabs[key].api.items.value"
          :loading="tabs[key].api.loading.value"
          :pagination="tabs[key].api.pagination.value"
          :relations="tabs[key].relations"
          :show-create-action="key !== 'credits'"
          :show-edit-action="key === 'conversions'"
          :show-delete-action="key === 'conversions'"
          @filter="
            (opts: any) =>
              tabs[key].api.index({ relations: tabs[key].relations, ...opts })
          "
          @create="() => openForm(key, 'Create')"
          @view="(item: any) => openForm(key, 'View', item)"
          @edit="(item: any) => openForm(key, 'Edit', item)"
          @remove="(item: any) => openForm(key, 'Remove', item)"
        >
          <template v-if="key === 'conversions'" #extra-actions="{ item }">
            <v-btn
              v-if="canApproveConversions && item.status === 'pending'"
              size="small"
              color="success"
              variant="text"
              :loading="conversionActionLoading === item.id"
              @click="approveConversion(item)"
            >
              Approve
            </v-btn>
            <v-btn
              v-if="canApproveConversions && item.status === 'pending'"
              size="small"
              color="error"
              variant="text"
              :loading="conversionActionLoading === item.id"
              @click="rejectConversion(item)"
            >
              Reject
            </v-btn>
          </template>
          <template v-if="key === 'requests'" #extra-actions="{ item }">
            <v-btn
              v-for="attachment in item.attachments ?? []"
              :key="attachment.id"
              size="small"
              color="primary"
              variant="text"
              @click="downloadAttachment(item, attachment)"
            >
              {{ attachment.original_name }}
            </v-btn>
            <v-btn
              v-if="canApproveLeaveRequests && item.status === 'pending'"
              size="small"
              color="success"
              variant="text"
              :loading="leaveActionLoading === item.id"
              @click="actionLeave(item, 'approve')"
            >
              Approve
            </v-btn>
            <v-btn
              v-if="canApproveLeaveRequests && item.status === 'pending'"
              size="small"
              color="error"
              variant="text"
              :loading="leaveActionLoading === item.id"
              @click="actionLeave(item, 'reject')"
            >
              Reject
            </v-btn>
            <v-btn
              v-if="
                item.status === 'pending' &&
                (canManageAllLeaveRequests ||
                  item.employee_id === authUser?.employee?.id)
              "
              size="small"
              color="warning"
              variant="text"
              :loading="leaveActionLoading === item.id"
              @click="actionLeave(item, 'cancel')"
            >
              Cancel
            </v-btn>
          </template>
        </Table>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, toRaw } from "vue";
import axios from "@/plugins/axios";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";
import { useAppSettings } from "@/composables/useAppSettings";
import { usePermissions } from "@/composables/usePermissions";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import type { ColumnConfig } from "@/types/types";

import { fields as requestFieldsRaw } from "@/fields/leave_request";
import { fields as creditFieldsRaw } from "@/fields/leave_credit";
import { fields as conversionFieldsRaw } from "@/fields/leave_conversion_request";

type TabKey = "requests" | "credits" | "conversions";

const activeTab = ref<TabKey>("requests");
const entity = ref("LeaveRequest");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);
const conversionActionLoading = ref<string | null>(null);
const leaveActionLoading = ref<string | null>(null);
const { authUser, getUser } = useAuth();
const { setting, loadAppSettings } = useAppSettings();
const { checkPermissions, hasAnyPermission } = usePermissions();
const canApproveLeaveRequests = computed(() =>
  checkPermissions("approve-leave-requests"),
);
const canManageAllLeaveRequests = computed(() =>
  hasAnyPermission(["manage-leave-requests", "approve-leave-requests"]),
);
const canApproveConversions = computed(() =>
  checkPermissions("approve-leave-conversion-requests"),
);
const attachmentsEnabled = computed(() =>
  setting("leave.attachments_enabled", true),
);

const requestFields = ref<ColumnConfig[]>([...requestFieldsRaw]);
const creditFields = ref<ColumnConfig[]>([...creditFieldsRaw]);
const conversionFields = ref<ColumnConfig[]>([...conversionFieldsRaw]);

const requestApi = useApi("/leave-requests");
const creditApi = useApi("/leave-credits");
const conversionApi = useApi("/leave-conversion-requests");

const { getOptions: getEmployees } = useApi("/employees");
const { getOptions: getLeaveTypes } = useApi("/leave-types");

const emptyRequestForm = () => ({
  id: "",
  employee_id: authUser.value?.employee?.id ?? "",
  leave_type_id: "",
  start_at: "",
  end_at: "",
  reason: "",
  attachments: [],
});

const emptyCreditForm = () => ({
  id: "",
  employee_id: "",
  leave_type_id: "",
  year: new Date().getFullYear(),
  total_earned: 0,
  used: 0,
});

const emptyConversionForm = () => ({
  id: "",
  employee_id: "",
  leave_type_id: "",
  credits_requested: 0,
  monetary_value: null,
  reason: "",
});

const tabs = {
  requests: {
    entity: "LeaveRequest",
    title: "Manage Leave Requests",
    fields: requestFields,
    relations: "employee.user,leaveType,approver,attachments",
    emptyForm: emptyRequestForm,
    api: requestApi,
  },
  credits: {
    entity: "LeaveCredit",
    title: "Employee Leave Balances",
    fields: creditFields,
    relations: "employee.user,leaveType",
    emptyForm: emptyCreditForm,
    api: creditApi,
  },
  conversions: {
    entity: "LeaveConversionRequest",
    title: "Leave Conversion Requests",
    fields: conversionFields,
    relations: "employee.user,leaveType,approver",
    emptyForm: emptyConversionForm,
    api: conversionApi,
  },
} as const;

const allTabKeys = Object.keys(tabs) as TabKey[];
const tabLabels: Record<TabKey, string> = {
  requests: "Leave Requests",
  credits: "Leave Credits",
  conversions: "Leave Conversions",
};
const tabKeys = computed<TabKey[]>(() =>
  allTabKeys.filter((key) => {
    if (key === "credits") return checkPermissions("view-leave-credits");
    if (key === "conversions") {
      return checkPermissions("view-leave-conversion-requests");
    }
    return checkPermissions("view-leave-requests");
  }),
);

const loadingActions = computed(() =>
  tabKeys.value.some((key) => tabs[key].api.loadingActions.value),
);

const activeFields = computed(() =>
  tabs[activeTab.value].fields.value.filter(
    (field) =>
      activeTab.value !== "requests" ||
      attachmentsEnabled.value ||
      field.key !== "attachments",
  ),
);

const form = computed(() => tabs[activeTab.value].emptyForm());

const readOnly = () => action.value === "View";

const setSelectOptions = (
  selectKey: string,
  options: any[],
  label: string | ((option: any) => string),
) => {
  const mapped = options.map((option) => ({
    label: typeof label === "function" ? label(option) : (option[label] ?? ""),
    value: option.id,
  }));

  allTabKeys.forEach((key) => {
    const field = tabs[key].fields.value.find(
      (item) => item.selectKey === selectKey,
    );
    if (field) field.inputOptions = mapped;
  });
};

const loadOptions = async () => {
  const canViewEmployees = checkPermissions("view-employees");
  const [employees, leaveTypes] = await Promise.all([
    canViewEmployees
      ? getEmployees({ relations: "user" })
      : Promise.resolve(
          authUser.value?.employee
            ? [{ ...authUser.value.employee, user: authUser.value }]
            : [],
        ),
    getLeaveTypes(),
  ]);

  setSelectOptions(
    "employee_id",
    employees,
    (employee) =>
      `${employee.user?.first_name ?? ""} ${
        employee.user?.last_name ?? ""
      }`.trim() || employee.employee_no,
  );
  setSelectOptions("leave_type_id", leaveTypes, "name");
};

const actionLeave = async (item: any, actionName: "approve" | "reject" | "cancel") => {
  const remarks = actionName === "approve" ? undefined : window.prompt(
    actionName === "cancel" ? "Reason for cancellation (optional):" : "Reason for rejection (optional):",
  ) ?? undefined;
  leaveActionLoading.value = item.id;

  try {
    await axios.post(`/leave-requests/${item.id}/${actionName}`, { remarks });
    await requestApi.index({ relations: tabs.requests.relations });
  } catch (error) {
    console.error(`Unable to ${actionName} leave request:`, error);
  } finally {
    leaveActionLoading.value = null;
  }
};

const downloadAttachment = async (request: any, attachment: any) => {
  try {
    const response = await axios.get(
      `/leave-requests/${request.id}/attachments/${attachment.id}`,
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.original_name;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Unable to download leave attachment:", error);
  }
};

const openForm = (key: TabKey, actionName: string, item?: any) => {
  entity.value = tabs[key].entity;
  action.value = actionName;
  data.value = actionName === "Create"
    ? tabs[key].emptyForm()
    : { ...item, ...(key === "requests" ? { attachments: [] } : {}) };
  isFormVisible.value = true;
};

const close = () => {
  isFormVisible.value = false;
};

const execute = async (payload: any) => {
  const meta = tabs[activeTab.value];

  try {
    if (action.value === "Create") {
      if (activeTab.value === "requests") {
        const formData = new FormData();
        ["employee_id", "leave_type_id", "start_at", "end_at", "reason"].forEach((key) => {
          formData.append(key, payload[key]);
        });
        const attachments = Array.isArray(payload.attachments)
          ? payload.attachments
          : payload.attachments ? [payload.attachments] : [];
        attachments.forEach((value: any) => {
          const file = toRaw(value);
          if (file instanceof File) formData.append("attachments[]", file, file.name);
        });
        await meta.api.store(formData);
      } else {
        await meta.api.store(payload);
      }
    }
    if (action.value === "Edit") await meta.api.update(payload.id, payload);
    if (action.value === "Remove") await meta.api.destroy(payload.id);

    isFormVisible.value = false;
  } catch (error) {
    console.error(`Unable to save ${meta.entity}:`, error);
  }
};

// Approve/reject aren't plain CRUD, so they bypass useApi's store/update
// and hit the two extra endpoints directly, then refresh the tab.
const approveConversion = async (item: any) => {
  conversionActionLoading.value = item.id;

  try {
    await axios.post(`/leave-conversion-requests/${item.id}/approve`);
    await conversionApi.index({ relations: tabs.conversions.relations });
  } catch (error) {
    console.error("Unable to approve conversion request:", error);
  } finally {
    conversionActionLoading.value = null;
  }
};

const rejectConversion = async (item: any) => {
  const remarks =
    window.prompt("Reason for rejecting (optional):") ?? undefined;
  conversionActionLoading.value = item.id;

  try {
    await axios.post(`/leave-conversion-requests/${item.id}/reject`, {
      remarks,
    });
    await conversionApi.index({ relations: tabs.conversions.relations });
  } catch (error) {
    console.error("Unable to reject conversion request:", error);
  } finally {
    conversionActionLoading.value = null;
  }
};

onMounted(async () => {
  await getUser();
  await loadAppSettings();
  await Promise.all([
    loadOptions(),
    ...tabKeys.value.map((key) =>
      tabs[key].api.index({ relations: tabs[key].relations }),
    ),
  ]);
});
</script>
