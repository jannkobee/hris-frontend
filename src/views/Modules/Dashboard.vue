<template>
  <v-container fluid class="pa-0">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <div class="text-h5 font-weight-bold">Dashboard</div>
        <p class="text-body-2 text-medium-emphasis mb-0">Today at a glance.</p>
      </div>
      <v-chip color="primary" variant="flat">Overview</v-chip>
    </div>

    <v-row>
      <v-col cols="12">
        <v-card border :loading="loading">
          <v-card-item>
            <template #prepend>
              <v-avatar
                color="secondary"
                variant="tonal"
                icon="mdi-bullhorn-outline"
              />
            </template>
            <v-card-title>Announcements</v-card-title>
          </v-card-item>

          <v-divider />

          <v-list v-if="latestAnnouncements.length" lines="two" class="py-0">
            <template
              v-for="(announcement, index) in latestAnnouncements"
              :key="announcement.id"
            >
              <v-list-item
                class="announcement-item"
                @click="openAnnouncement(announcement)"
              >
                <v-list-item-title class="font-weight-medium">
                  {{ announcement.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ announcementExcerpt(announcement.content) }}
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDate(announcement.published_at) }}
                  </span>
                </template>
              </v-list-item>
              <v-divider v-if="index < latestAnnouncements.length - 1" />
            </template>
          </v-list>

          <v-card-text v-else class="text-medium-emphasis text-center py-6">
            No announcements yet.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <template v-if="canViewEmployeeOverview">
      <v-row class="mt-6">
        <v-col cols="12" sm="6">
          <v-card border :loading="loading">
            <v-card-item>
              <template #prepend>
                <v-avatar
                  color="primary"
                  variant="tonal"
                  icon="mdi-account-group-outline"
                />
              </template>
              <v-card-subtitle>Current Employees</v-card-subtitle>
              <v-card-title class="text-h4">{{
                employees.length
              }}</v-card-title>
            </v-card-item>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card border :loading="loading">
            <v-card-item>
              <template #prepend>
                <v-avatar
                  color="warning"
                  variant="tonal"
                  icon="mdi-calendar-account-outline"
                />
              </template>
              <v-card-subtitle>On Leave Today</v-card-subtitle>
              <v-card-title class="text-h4">{{
                employeesOnLeave
              }}</v-card-title>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-1">
        <v-col cols="12">
          <v-card border :loading="loading">
            <v-tabs v-model="attendanceTab" color="primary">
              <v-tab value="in">In Today ({{ employeesInToday.length }})</v-tab>
              <v-tab value="out"
                >Out Today ({{ employeesOutToday.length }})</v-tab
              >
            </v-tabs>

            <v-window v-model="attendanceTab">
              <v-window-item value="in">
                <v-data-table
                  :headers="inHeaders"
                  :items="employeesInToday"
                  :items-per-page="10"
                  no-data-text="No employees have clocked in today."
                />
              </v-window-item>
              <v-window-item value="out">
                <v-data-table
                  :headers="outHeaders"
                  :items="employeesOutToday"
                  :items-per-page="10"
                  no-data-text="No employees are out today."
                />
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-dialog v-model="announcementDialog" max-width="700">
      <v-card v-if="selectedAnnouncement">
        <v-card-item>
          <v-card-title>{{ selectedAnnouncement.title }}</v-card-title>
          <v-card-subtitle>
            {{ formatDate(selectedAnnouncement.published_at) }}
          </v-card-subtitle>
        </v-card-item>

        <v-divider />

        <v-card-text>
          <div
            class="announcement-content"
            v-html="selectedAnnouncement.content"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="announcementDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";
import { usePermissions } from "@/composables/usePermissions";

const { authUser, getUser } = useAuth();
const { checkPermissions } = usePermissions();

const loading = ref(false);
const attendanceTab = ref("in");
const employees = ref<any[]>([]);
const leaveRequests = ref<any[]>([]);
const attendances = ref<any[]>([]);
const announcements = ref<any[]>([]);
const announcementDialog = ref(false);
const selectedAnnouncement = ref<any>(null);

const { getOptions: getEmployees } = useApi("/employees");
const { getOptions: getLeaveRequests } = useApi("/leave-requests");
const { getOptions: getAttendances } = useApi("/attendances");
const { getOptions: getAnnouncements } = useApi("/announcements");

// API responses are sometimes a plain array and sometimes a paginated
// wrapper (e.g. Laravel's `{ data: [...], meta: {...} }`). Normalize
// here so downstream refs are always guaranteed to be arrays — this is
// what prevents `attendances.value.filter is not a function` and similar
// crashes if a response shape ever changes.
const toArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as any).data)
  ) {
    return (value as any).data;
  }
  console.warn(
    "Expected an array (or paginated {data: []}) response, got:",
    value,
  );
  return [];
};

// Regular Users land on this same dashboard, so the employee headcount,
// leave count, and attendance tables (HR/admin data) are gated behind
// permission checks. Announcements stay visible to everyone.
const canViewEmployeeOverview = computed(() =>
  ["view-employees", "view-attendances", "view-leave-requests"].every(
    checkPermissions,
  ),
);

const today = new Date().toLocaleDateString("en-CA");
const inHeaders = [
  { title: "Employee", key: "name" },
  { title: "Employee No.", key: "employee_no" },
  { title: "Time In", key: "time_in" },
];
const outHeaders = [
  { title: "Employee", key: "name" },
  { title: "Employee No.", key: "employee_no" },
  { title: "Status", key: "status" },
];

const activeLeaveEmployeeIds = computed(
  () =>
    new Set(
      leaveRequests.value
        .filter(
          (request) =>
            request.status === "approved" &&
            request.start_date <= today &&
            request.end_date >= today,
        )
        .map((request) => request.employee_id),
    ),
);

const employeesOnLeave = computed(() => activeLeaveEmployeeIds.value.size);

const employeesInToday = computed(() =>
  attendances.value
    .filter((attendance) => attendance.date === today && attendance.time_in)
    .map((attendance) => ({
      id: attendance.id,
      name: attendance.employee?.user?.full_name ?? "Unknown employee",
      employee_no: attendance.employee?.employee_no ?? "—",
      time_in: formatTime(attendance.time_in),
    })),
);

const employeesOutToday = computed(() => {
  const checkedInEmployeeIds = new Set(
    attendances.value
      .filter((attendance) => attendance.date === today && attendance.time_in)
      .map((attendance) => attendance.employee_id),
  );

  return employees.value
    .filter(
      (employee) =>
        !checkedInEmployeeIds.has(employee.id) &&
        !activeLeaveEmployeeIds.value.has(employee.id),
    )
    .map((employee) => ({
      id: employee.id,
      name: employee.user?.full_name ?? "Unknown employee",
      employee_no: employee.employee_no ?? "—",
      status: "Out",
    }));
});

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString([], { month: "short", day: "numeric" })
    : "—";

const announcementExcerpt = (html: string, length = 90): string => {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
};

const latestAnnouncements = computed(() =>
  announcements.value
    .filter((announcement) => announcement.is_active)
    .sort(
      (a, b) =>
        new Date(b.published_at ?? b.created_at ?? 0).getTime() -
        new Date(a.published_at ?? a.created_at ?? 0).getTime(),
    )
    .slice(0, 5),
);

const openAnnouncement = (announcement: any) => {
  selectedAnnouncement.value = announcement;
  announcementDialog.value = true;
};

onMounted(async () => {
  loading.value = true;

  try {
    await getUser();

    const requests: Promise<any>[] = [getAnnouncements()];
    if (canViewEmployeeOverview.value) {
      requests.push(
        getEmployees({ relations: "user" }),
        getLeaveRequests(),
        getAttendances({ relations: "employee.user", date: today }),
      );
    }

    const [
      announcementRecords,
      employeeRecords,
      leaveRecords,
      attendanceRecords,
    ] = await Promise.all(requests);

    announcements.value = toArray(announcementRecords);

    if (canViewEmployeeOverview.value) {
      employees.value = toArray(employeeRecords);
      leaveRequests.value = toArray(leaveRecords);
      attendances.value = toArray(attendanceRecords);
    }
  } catch (error) {
    console.error("Unable to load dashboard data:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="css" scoped>
.announcement-item {
  cursor: pointer;
}

.announcement-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.announcement-content :deep(p) {
  margin-bottom: 8px;
}

.announcement-content :deep(ul),
.announcement-content :deep(ol) {
  padding-left: 24px;
  margin-bottom: 8px;
}

.announcement-content :deep(blockquote) {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 3px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.announcement-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  margin: 8px 0;
}
</style>
