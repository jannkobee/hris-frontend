<template>
  <v-container fluid>
    <ModuleHeader
      v-if="showHeader"
      eyebrow="Attendance workflow"
      title="Attendance Corrections"
      subtitle="Request a correction for your attendance, or review your team's requests."
      icon="mdi-clock-edit-outline"
    >
      <template #actions>
        <v-chip color="primary" variant="tonal">
          {{ corrections.length }} requests
        </v-chip>
      </template>
    </ModuleHeader>
    <v-tabs v-model="tab" class="mb-4"
      ><v-tab value="my">My requests</v-tab
      ><v-tab v-if="canReview" value="review">Review queue</v-tab></v-tabs
    >
    <v-window v-model="tab"
      ><v-window-item value="my"
        ><v-card
          ><v-card-title>My attendance history</v-card-title
          ><v-table
            ><thead>
              <tr>
                <th>Date</th>
                <th>Original time in</th>
                <th>Original time out</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="attendance in history" :key="attendance.id">
                <td>{{ attendance.date }}</td>
                <td>{{ display(attendance.time_in) }}</td>
                <td>{{ display(attendance.time_out) }}</td>
                <td>
                  <v-btn
                    size="small"
                    variant="tonal"
                    @click="openRequest(attendance)"
                    >Request correction</v-btn
                  >
                </td>
              </tr>
            </tbody></v-table
          ></v-card
        ></v-window-item
      ><v-window-item value="review"
        ><v-card
          ><v-card-title>Pending review</v-card-title
          ><v-table
            ><thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Original</th>
                <th>Requested</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="request in pending" :key="request.id">
                <td>{{ request.employee?.user?.full_name }}</td>
                <td>{{ request.attendance?.date || "—" }}</td>
                <td>
                  {{ display(request.attendance?.time_in) }} –
                  {{ display(request.attendance?.time_out) }}
                </td>
                <td>
                  {{ display(request.requested_time_in) }} –
                  {{ display(request.requested_time_out) }}
                </td>
                <td>{{ request.reason }}</td>
                <td>
                  <div class="attendance-corrections__review-actions">
                    <v-btn
                      class="attendance-corrections__icon-action"
                      size="small"
                      density="comfortable"
                      color="success"
                      variant="tonal"
                      icon="mdi-check-circle-outline"
                      title="Approve correction"
                      aria-label="Approve correction"
                      @click="openReview(request, 'approved')"
                    />
                    <v-btn
                      class="attendance-corrections__icon-action"
                      size="small"
                      density="comfortable"
                      color="error"
                      variant="tonal"
                      icon="mdi-close-circle-outline"
                      title="Reject correction"
                      aria-label="Reject correction"
                      @click="openReview(request, 'rejected')"
                    />
                  </div>
                </td>
              </tr></tbody></v-table></v-card></v-window-item
    ></v-window>
    <v-dialog v-model="requestDialog" max-width="600"
      ><v-card
        ><v-card-title>Request attendance correction</v-card-title
        ><v-card-text
          ><v-alert type="info" variant="tonal" class="mb-4"
            >Original: {{ display(selectedAttendance?.time_in) }} –
            {{ display(selectedAttendance?.time_out) }}</v-alert
          ><v-row
            ><v-col
              ><v-text-field
                v-model="requestForm.requested_time_in"
                type="datetime-local"
                label="Requested time in"
                variant="outlined" /></v-col
            ><v-col
              ><v-text-field
                v-model="requestForm.requested_time_out"
                type="datetime-local"
                label="Requested time out"
                variant="outlined" /></v-col></v-row
          ><v-textarea
            v-model="requestForm.reason"
            label="Reason"
            :rules="[(v) => !!v || 'Reason is required']"
            variant="outlined" /></v-card-text
        ><v-card-actions
          ><v-spacer /><v-btn @click="requestDialog = false">Cancel</v-btn
          ><v-btn color="primary" :loading="saving" @click="submitRequest"
            >Submit request</v-btn
          ></v-card-actions
        ></v-card
      ></v-dialog
    >
    <v-dialog v-model="reviewDialog" max-width="520"
      ><v-card
        ><v-card-title
          >{{
            reviewForm.status === "approved" ? "Approve" : "Reject"
          }}
          correction</v-card-title
        ><v-card-text
          ><v-textarea
            v-model="reviewForm.reviewer_notes"
            label="Reviewer notes (optional)"
            variant="outlined" /></v-card-text
        ><v-card-actions
          ><v-spacer /><v-btn @click="reviewDialog = false">Cancel</v-btn
          ><v-btn
            :color="reviewForm.status === 'approved' ? 'success' : 'error'"
            :loading="saving"
            @click="submitReview"
            >Confirm</v-btn
          ></v-card-actions
        ></v-card
      ></v-dialog
    >
  </v-container>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";

withDefaults(defineProps<{ showHeader?: boolean }>(), {
  showHeader: true,
});
import { usePermissions } from "@/composables/usePermissions";
const { checkPermissions } = usePermissions();
const canReview = computed(() =>
  checkPermissions("approve-attendance-corrections"),
);
const tab = ref("my");
const history = ref<any[]>([]);
const corrections = ref<any[]>([]);
const selectedAttendance = ref<any>(null);
const requestDialog = ref(false);
const reviewDialog = ref(false);
const selectedCorrection = ref<any>(null);
const saving = ref(false);
const requestForm = ref({
  requested_time_in: "",
  requested_time_out: "",
  reason: "",
});
const reviewForm = ref({ status: "approved", reviewer_notes: "" });
const display = (value?: string) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const toLocal = (value?: string) =>
  value
    ? new Date(
        new Date(value).getTime() - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
const pending = computed(() =>
  corrections.value.filter((item) => item.status === "pending"),
);
const load = async () => {
  const [historyResponse, correctionResponse] = await Promise.all([
    axios.get("/attendances/history", { params: { limit: 30 } }),
    axios.get("/attendance-corrections", { params: { limit: 100 } }),
  ]);
  history.value = historyResponse.data.data?.data ?? [];
  corrections.value = correctionResponse.data.data?.data ?? [];
};
const openRequest = (attendance: any) => {
  selectedAttendance.value = attendance;
  requestForm.value = {
    requested_time_in: toLocal(attendance.time_in),
    requested_time_out: toLocal(attendance.time_out),
    reason: "",
  };
  requestDialog.value = true;
};
const submitRequest = async () => {
  if (!selectedAttendance.value || !requestForm.value.reason) return;
  saving.value = true;
  try {
    await axios.post("/attendance-corrections", {
      attendance_id: selectedAttendance.value.id,
      ...requestForm.value,
    });
    requestDialog.value = false;
    await load();
  } finally {
    saving.value = false;
  }
};
const openReview = (request: any, status: string) => {
  selectedCorrection.value = request;
  reviewForm.value = { status, reviewer_notes: "" };
  reviewDialog.value = true;
};
const submitReview = async () => {
  saving.value = true;
  try {
    await axios.patch(
      `/attendance-corrections/${selectedCorrection.value.id}/review`,
      reviewForm.value,
    );
    reviewDialog.value = false;
    await load();
  } finally {
    saving.value = false;
  }
};
onMounted(load);
</script>

<style scoped>
.attendance-corrections__review-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.attendance-corrections__icon-action {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
}
</style>
