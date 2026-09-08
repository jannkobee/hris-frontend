<template>
  <v-container fluid class="shift-roster">
    <ModuleHeader
      eyebrow="Workforce planning"
      title="Shifts & Roster"
      subtitle="Plan work schedules, configure shift templates, and maintain roster coverage."
      icon="mdi-calendar-clock-outline"
    >
      <template #actions>
        <v-btn
          v-if="canManage"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-plus"
          class="mr-2"
          @click="openTemplate()"
        >
          New template
        </v-btn>
        <v-btn
          v-if="canManage"
          color="primary"
          variant="flat"
          prepend-icon="mdi-calendar-plus"
          @click="openAssignment()"
        >
          Assign shift
        </v-btn>
      </template>
    </ModuleHeader>

    <!-- Summary Metrics -->
    <section class="roster-metrics" aria-label="Shift and roster summary">
      <article class="roster-metric">
        <div class="roster-metric__icon roster-metric__icon--primary">
          <v-icon icon="mdi-clock-time-four-outline" size="22" />
        </div>
        <div>
          <span>Active templates</span>
          <strong>{{ activeTemplatesCount }}</strong>
        </div>
      </article>

      <article class="roster-metric">
        <div class="roster-metric__icon roster-metric__icon--info">
          <v-icon icon="mdi-calendar-check-outline" size="22" />
        </div>
        <div>
          <span>Rostered shifts</span>
          <strong>{{ assignments.length }}</strong>
        </div>
      </article>

      <article class="roster-metric">
        <div class="roster-metric__icon roster-metric__icon--success">
          <v-icon icon="mdi-account-group-outline" size="22" />
        </div>
        <div>
          <span>Employees scheduled</span>
          <strong>{{ scheduledEmployeesCount }}</strong>
        </div>
      </article>

      <article class="roster-metric roster-metric--window">
        <div class="roster-metric__icon roster-metric__icon--warning">
          <v-icon icon="mdi-calendar-range" size="22" />
        </div>
        <div>
          <span>Coverage window</span>
          <strong :title="coverageWindowLabel">{{ coverageWindowLabel }}</strong>
        </div>
      </article>
    </section>

    <!-- Navigation Tabs -->
    <div class="roster-tabs-wrapper mb-4">
      <v-tabs
        v-model="tab"
        color="primary"
        density="compact"
        class="roster-tabs"
      >
        <v-tab value="roster" class="roster-tab">
          <v-icon icon="mdi-calendar-account-outline" class="mr-2" size="18" />
          Roster
          <span class="tab-count-pill ml-2">{{ assignments.length }}</span>
        </v-tab>
        <v-tab value="templates" class="roster-tab">
          <v-icon icon="mdi-clock-outline" class="mr-2" size="18" />
          Shift templates
          <span class="tab-count-pill ml-2">{{ templates.length }}</span>
        </v-tab>
      </v-tabs>
    </div>

    <v-window v-model="tab">
      <!-- Tab 1: Roster View (Unified Global Table) -->
      <v-window-item value="roster">
        <Table
          :show-title="false"
          :headers="rosterHeaders"
          :data="paginatedAssignments"
          :loading="loadingAssignments"
          :pagination="{ total: filteredAssignments.length }"
          :show-create-action="canManage"
          create-label="Assign shift"
          create-icon="mdi-calendar-plus"
          permission="manage-shifts"
          :show-view-action="false"
          :show-edit-action="canManage"
          :show-delete-action="canManage"
          :show-refresh="true"
          :show-search="true"
          search-placeholder="Search employee or shift..."
          empty-title="No shifts found"
          empty-text="No shifts are scheduled for this date range."
          @filter="onRosterFilter"
          @refresh="loadAssignments"
          @create="openAssignment()"
          @edit="openAssignment"
          @remove="confirmRemoveAssignment"
        >
          <!-- Global Filter Slot: Standardized Date Inputs & Range Selector -->
          <template #filters>
            <v-text-field
              v-model="from"
              type="date"
              label="From"
              density="compact"
              variant="outlined"
              hide-details
              class="roster-filter-date"
              @update:model-value="onDateChange"
            />
            <v-text-field
              v-model="to"
              type="date"
              label="To"
              density="compact"
              variant="outlined"
              hide-details
              class="roster-filter-date"
              @update:model-value="onDateChange"
            />
            <v-select
              v-model="activePreset"
              :items="presetOptions"
              item-title="title"
              item-value="value"
              label="Range"
              density="compact"
              variant="outlined"
              hide-details
              class="roster-filter-preset"
              @update:model-value="applyPreset"
            />
          </template>

          <!-- Custom Column Templates -->
          <template #item.work_date="{ item }: { item: any }">
            <div class="date-cell">
              <span class="day-chip">{{ getDayOfWeek(item.work_date) }}</span>
              <span class="date-text">{{ formatWorkDate(item.work_date) }}</span>
            </div>
          </template>

          <template #item.employee="{ item }: { item: any }">
            <div class="employee-cell">
              <div class="avatar-square">
                {{
                  getInitials(
                    item.employee?.user?.full_name ||
                      item.employee?.employee_no,
                  )
                }}
              </div>
              <div class="employee-meta">
                <span class="employee-name">
                  {{ item.employee?.user?.full_name || "Employee" }}
                </span>
                <span class="employee-code">
                  {{ item.employee?.employee_no || "—" }}
                </span>
              </div>
            </div>
          </template>

          <template #item.shift_name="{ item }: { item: any }">
            <div class="shift-name-cell">
              <span class="shift-title">{{ item.shift_name }}</span>
            </div>
          </template>

          <template #item.planned_hours="{ item }: { item: any }">
            <div class="hours-cell">
              <v-icon
                icon="mdi-clock-outline"
                size="14"
                class="mr-1 text-medium-emphasis"
              />
              <span class="time-range"
                >{{ item.start_time }} – {{ item.end_time }}</span
              >
              <span class="duration-badge">{{
                calculateDuration(item.start_time, item.end_time)
              }}</span>
            </div>
          </template>

          <template #item.break_grace="{ item }: { item: any }">
            <div class="break-grace-cell">
              <span>{{ item.break_minutes ?? 0 }}m break</span>
              <small class="text-medium-emphasis"
                >· {{ item.grace_minutes ?? 0 }}m grace</small
              >
            </div>
          </template>

          <template #item.notes="{ item }: { item: any }">
            <span class="notes-text" :title="item.notes || ''">
              {{ item.notes || "—" }}
            </span>
          </template>
        </Table>
      </v-window-item>

      <!-- Tab 2: Shift Templates View (Unified Global Table) -->
      <v-window-item value="templates">
        <Table
          :show-title="false"
          :headers="templateHeaders"
          :data="paginatedTemplates"
          :loading="loadingTemplates"
          :pagination="{ total: filteredTemplates.length }"
          :show-create-action="canManage"
          create-label="Add template"
          create-icon="mdi-plus"
          permission="manage-shifts"
          :show-view-action="false"
          :show-edit-action="canManage"
          :show-delete-action="false"
          :show-refresh="true"
          :show-search="true"
          search-placeholder="Filter templates..."
          empty-title="No shift templates found"
          empty-text="Create reusable shift templates to quickly schedule shifts."
          @filter="onTemplateFilter"
          @refresh="loadTemplates"
          @create="openTemplate()"
          @edit="openTemplate"
        >
          <!-- Custom Column Templates -->
          <template #item.name="{ item }: { item: any }">
            <div class="template-name-cell">
              <span class="template-title">{{ item.name }}</span>
            </div>
          </template>

          <template #item.code="{ item }: { item: any }">
            <code class="code-pill">{{ item.code || "—" }}</code>
          </template>

          <template #item.hours="{ item }: { item: any }">
            <div class="hours-cell">
              <v-icon
                icon="mdi-clock-outline"
                size="14"
                class="mr-1 text-medium-emphasis"
              />
              <span class="time-range"
                >{{ item.start_time }} – {{ item.end_time }}</span
              >
              <span class="duration-badge">{{
                calculateDuration(item.start_time, item.end_time)
              }}</span>
            </div>
          </template>

          <template #item.break_grace="{ item }: { item: any }">
            <div class="break-grace-cell">
              <span>{{ item.break_minutes }}m break</span>
              <small class="text-medium-emphasis"
                >· {{ item.grace_minutes }}m grace</small
              >
            </div>
          </template>

          <template #item.is_active="{ item }: { item: any }">
            <v-chip
              size="small"
              :color="item.is_active ? 'success' : 'default'"
              variant="tonal"
              class="font-weight-medium status-chip"
            >
              {{ item.is_active ? "Active" : "Inactive" }}
            </v-chip>
          </template>
        </Table>
      </v-window-item>
    </v-window>

    <!-- Template Dialog -->
    <v-dialog v-model="templateDialog" max-width="580" persistent>
      <v-card class="dialog-card">
        <header class="dialog-card__header">
          <div class="dialog-card__icon">
            <v-icon icon="mdi-clock-edit-outline" size="24" />
          </div>
          <div class="dialog-card__titles">
            <span>Shift configuration</span>
            <h2>
              {{
                templateForm.id
                  ? "Edit shift template"
                  : "Create shift template"
              }}
            </h2>
            <p>
              Define standard work hours, break times, and grace thresholds.
            </p>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Close dialog"
            @click="templateDialog = false"
          />
        </header>

        <v-divider />

        <v-card-text class="dialog-card__body">
          <v-row dense>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="templateForm.name"
                label="Template name"
                placeholder="e.g. Regular Day Shift"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="templateForm.code"
                label="Code (optional)"
                placeholder="e.g. DAY-8-5"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
              />
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="templateForm.start_time"
                type="time"
                label="Start time"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="templateForm.end_time"
                type="time"
                label="End time"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
              />
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="templateForm.break_minutes"
                type="number"
                label="Break minutes"
                placeholder="60"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="templateForm.grace_minutes"
                type="number"
                label="Grace minutes"
                placeholder="15"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3"
              />
            </v-col>
          </v-row>

          <div class="active-switch-container">
            <v-switch
              v-model="templateForm.is_active"
              label="Active and available for rostering"
              color="primary"
              hide-details
              density="compact"
            />
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="dialog-card__actions">
          <v-spacer />
          <v-btn variant="tonal" @click="templateDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="saving"
            :disabled="
              !templateForm.name ||
              !templateForm.start_time ||
              !templateForm.end_time
            "
            @click="saveTemplate"
          >
            Save template
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Assignment Dialog -->
    <v-dialog v-model="assignmentDialog" max-width="580" persistent>
      <v-card class="dialog-card">
        <header class="dialog-card__header">
          <div class="dialog-card__icon">
            <v-icon icon="mdi-calendar-plus" size="24" />
          </div>
          <div class="dialog-card__titles">
            <span>Roster schedule</span>
            <h2>
              {{ assignmentForm.id ? "Edit shift assignment" : "Assign shift" }}
            </h2>
            <p>
              Assign a predefined shift template to an employee for a specific date.
            </p>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Close dialog"
            @click="assignmentDialog = false"
          />
        </header>

        <v-divider />

        <v-card-text class="dialog-card__body">
          <v-select
            v-model="assignmentForm.employee_id"
            :items="employeeOptions"
            item-title="title"
            item-value="value"
            label="Employee"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-4"
          />

          <v-select
            v-model="assignmentForm.shift_template_id"
            :items="templateOptions"
            item-title="title"
            item-value="value"
            label="Shift template"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-4"
          />

          <v-text-field
            v-model="assignmentForm.work_date"
            type="date"
            label="Work date"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-4"
          />

          <v-textarea
            v-model="assignmentForm.notes"
            label="Notes (optional)"
            placeholder="Add operational notes or instructions..."
            rows="3"
            variant="outlined"
            density="compact"
            hide-details="auto"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="dialog-card__actions">
          <v-spacer />
          <v-btn variant="tonal" @click="assignmentDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="saving"
            :disabled="
              !assignmentForm.employee_id ||
              !assignmentForm.shift_template_id ||
              !assignmentForm.work_date
            "
            @click="saveAssignment"
          >
            Save assignment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteConfirmDialog" max-width="460">
      <v-card class="dialog-card">
        <header class="dialog-card__header">
          <div class="dialog-card__icon dialog-card__icon--danger">
            <v-icon icon="mdi-alert-circle-outline" size="24" />
          </div>
          <div class="dialog-card__titles">
            <span style="color: rgb(var(--v-theme-error))">Confirm removal</span>
            <h2>Remove shift assignment?</h2>
            <p>
              This will remove the scheduled shift from the employee's roster.
            </p>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Close dialog"
            @click="deleteConfirmDialog = false"
          />
        </header>

        <v-card-text class="dialog-card__body">
          <p class="text-body-2" v-if="assignmentToDelete">
            Are you sure you want to remove the shift for
            <strong>{{
              assignmentToDelete.employee?.user?.full_name || "this employee"
            }}</strong>
            on
            <strong>{{ formatWorkDate(assignmentToDelete.work_date) }}</strong>?
          </p>
        </v-card-text>

        <v-divider />

        <v-card-actions class="dialog-card__actions">
          <v-spacer />
          <v-btn variant="tonal" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleting"
            @click="executeRemoveAssignment"
          >
            Remove shift
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import { usePermissions } from "@/composables/usePermissions";
import ModuleHeader from "@/components/layouts/HrisApp/ModuleHeader.vue";
import Table from "@/components/Table.vue";
import type { ColumnConfig } from "@/types/types";

const tab = ref("roster");
const saving = ref(false);
const deleting = ref(false);
const loadingAssignments = ref(false);
const loadingTemplates = ref(false);
const templates = ref<any[]>([]);
const assignments = ref<any[]>([]);
const employees = ref<any[]>([]);
const templateDialog = ref(false);
const assignmentDialog = ref(false);
const deleteConfirmDialog = ref(false);
const assignmentToDelete = ref<any>(null);

// Search & Pagination State
const rosterSearch = ref("");
const rosterPage = ref(1);
const rosterLimit = ref(10);

const templateSearch = ref("");
const templatePage = ref(1);
const templateLimit = ref(10);

const activePreset = ref<"7d" | "14d" | "month" | null>("14d");

const today = new Date();
const date = (value: Date) => value.toISOString().slice(0, 10);
const from = ref(date(today));
const to = ref(
  date(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13)),
);

const presetOptions = [
  { value: "7d", title: "7 Days" },
  { value: "14d", title: "14 Days" },
  { value: "month", title: "This Month" },
];

// Table Column Definitions
const rosterHeaders: ColumnConfig[] = [
  { title: "Date", key: "work_date", sortable: true },
  { title: "Employee", key: "employee", sortable: false },
  { title: "Shift", key: "shift_name", sortable: true },
  { title: "Planned hours", key: "planned_hours", sortable: false },
  { title: "Break / Grace", key: "break_grace", sortable: false },
  { title: "Notes", key: "notes", sortable: false },
  { title: "Actions", key: "action", sortable: false, align: "end" },
];

const templateHeaders: ColumnConfig[] = [
  { title: "Template name", key: "name", sortable: true },
  { title: "Code", key: "code", sortable: true },
  { title: "Work hours & Duration", key: "hours", sortable: false },
  { title: "Break / Grace", key: "break_grace", sortable: false },
  { title: "Status", key: "is_active", sortable: true },
  { title: "Actions", key: "action", sortable: false, align: "end" },
];

const blankTemplate = () => ({
  id: "",
  name: "",
  code: "",
  start_time: "08:00",
  end_time: "17:00",
  break_minutes: 60,
  grace_minutes: 0,
  is_active: true,
});

const blankAssignment = () => ({
  id: "",
  employee_id: "",
  shift_template_id: "",
  work_date: date(today),
  notes: "",
});

const templateForm = ref(blankTemplate());
const assignmentForm = ref(blankAssignment());
const { checkPermissions } = usePermissions();
const canManage = computed(() => checkPermissions("manage-shifts"));

// Options
const employeeOptions = computed(() =>
  employees.value.map((employee) => ({
    value: employee.id,
    title: `${employee.user?.full_name || employee.employee_no} (${employee.employee_no})`,
  })),
);

const templateOptions = computed(() =>
  templates.value
    .filter((template) => template.is_active)
    .map((template) => ({
      value: template.id,
      title: `${template.name} · ${template.start_time}–${template.end_time}`,
    })),
);

// Metrics
const activeTemplatesCount = computed(
  () => templates.value.filter((t) => t.is_active).length,
);

const scheduledEmployeesCount = computed(() => {
  const ids = new Set(
    assignments.value.map((a) => a.employee_id).filter(Boolean),
  );
  return ids.size;
});

const coverageWindowLabel = computed(() => {
  if (!from.value || !to.value) return "Custom range";
  return `${from.value} to ${to.value}`;
});

// Filtered & Paginated Collections
const filteredAssignments = computed(() => {
  if (!rosterSearch.value.trim()) return assignments.value;
  const q = rosterSearch.value.trim().toLowerCase();
  return assignments.value.filter((a) => {
    const empName = a.employee?.user?.full_name?.toLowerCase() || "";
    const empNo = a.employee?.employee_no?.toLowerCase() || "";
    const shiftName = a.shift_name?.toLowerCase() || "";
    const workDate = a.work_date?.toLowerCase() || "";
    return (
      empName.includes(q) ||
      empNo.includes(q) ||
      shiftName.includes(q) ||
      workDate.includes(q)
    );
  });
});

const paginatedAssignments = computed(() => {
  const start = (rosterPage.value - 1) * rosterLimit.value;
  return filteredAssignments.value.slice(start, start + rosterLimit.value);
});

const filteredTemplates = computed(() => {
  if (!templateSearch.value.trim()) return templates.value;
  const q = templateSearch.value.trim().toLowerCase();
  return templates.value.filter((t) => {
    const name = t.name?.toLowerCase() || "";
    const code = t.code?.toLowerCase() || "";
    return name.includes(q) || code.includes(q);
  });
});

const paginatedTemplates = computed(() => {
  const start = (templatePage.value - 1) * templateLimit.value;
  return filteredTemplates.value.slice(start, start + templateLimit.value);
});

// Helpers
const getDayOfWeek = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

const formatWorkDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name?: string) => {
  if (!name) return "EM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const calculateDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "";
  const [sH, sM] = startTime.split(":").map(Number);
  const [eH, eM] = endTime.split(":").map(Number);
  let totalMinutes = eH * 60 + eM - (sH * 60 + sM);
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Overnight shift
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours} hrs`;
  return `${hours}h ${mins}m`;
};

// Filter & Preset Events
const applyPreset = (preset: string | null) => {
  if (!preset) return;
  activePreset.value = preset as "7d" | "14d" | "month";
  const now = new Date();
  if (preset === "7d") {
    from.value = date(now);
    to.value = date(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6),
    );
  } else if (preset === "14d") {
    from.value = date(now);
    to.value = date(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 13),
    );
  } else if (preset === "month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    from.value = date(firstDay);
    to.value = date(lastDay);
  }
  rosterPage.value = 1;
  loadAssignments();
};

const onDateChange = () => {
  activePreset.value = null;
  rosterPage.value = 1;
  loadAssignments();
};

const onRosterFilter = (payload: any) => {
  if (payload.page !== undefined) rosterPage.value = payload.page;
  if (payload.limit !== undefined) rosterLimit.value = payload.limit;
  if (payload.search !== undefined) {
    rosterSearch.value = payload.search || "";
    rosterPage.value = 1;
  }
};

const onTemplateFilter = (payload: any) => {
  if (payload.page !== undefined) templatePage.value = payload.page;
  if (payload.limit !== undefined) templateLimit.value = payload.limit;
  if (payload.search !== undefined) {
    templateSearch.value = payload.search || "";
    templatePage.value = 1;
  }
};

// API Calls
const loadTemplates = async () => {
  loadingTemplates.value = true;
  try {
    const response = await axios.get("/shift-templates", {
      params: { all: 1 },
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    templates.value = response.data.data ?? [];
  } finally {
    loadingTemplates.value = false;
  }
};

const loadEmployees = async () => {
  const response = await axios.get("/employees", {
    params: { all: 1, relations: "user" },
    headers: { "X-Suppress-Success-Notification": "true" },
  });
  employees.value = response.data.data ?? [];
};

const loadAssignments = async () => {
  loadingAssignments.value = true;
  try {
    const response = await axios.get("/shift-assignments", {
      params: { from: from.value, to: to.value, limit: 200 },
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    assignments.value = response.data.data?.data ?? [];
  } finally {
    loadingAssignments.value = false;
  }
};

const openTemplate = (template?: any) => {
  templateForm.value = template ? { ...template } : blankTemplate();
  templateDialog.value = true;
};

const openAssignment = (assignment?: any) => {
  assignmentForm.value = assignment
    ? { ...assignment, work_date: assignment.work_date?.slice(0, 10) }
    : blankAssignment();
  assignmentDialog.value = true;
};

const saveTemplate = async () => {
  saving.value = true;
  try {
    const { id, ...payload } = templateForm.value;
    if (id) await axios.put(`/shift-templates/${id}`, payload);
    else await axios.post("/shift-templates", payload);
    templateDialog.value = false;
    await loadTemplates();
  } finally {
    saving.value = false;
  }
};

const saveAssignment = async () => {
  saving.value = true;
  try {
    const { id, ...payload } = assignmentForm.value;
    if (id) await axios.put(`/shift-assignments/${id}`, payload);
    else await axios.post("/shift-assignments", payload);
    assignmentDialog.value = false;
    await loadAssignments();
  } finally {
    saving.value = false;
  }
};

const confirmRemoveAssignment = (assignment: any) => {
  assignmentToDelete.value = assignment;
  deleteConfirmDialog.value = true;
};

const executeRemoveAssignment = async () => {
  if (!assignmentToDelete.value) return;
  deleting.value = true;
  try {
    await axios.delete(`/shift-assignments/${assignmentToDelete.value.id}`);
    deleteConfirmDialog.value = false;
    assignmentToDelete.value = null;
    await loadAssignments();
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadTemplates(), loadEmployees(), loadAssignments()]);
});
</script>

<style scoped>
.shift-roster {
  padding-bottom: 32px;
}

/* Universal Zero Border Radius & Standard Heights */
.shift-roster :deep(.v-btn:not(.app-table__icon-action):not(.v-btn--icon)) {
  height: 36px !important;
  min-height: 36px !important;
  border-radius: 0 !important;
  font-weight: 600 !important;
  font-size: 0.8125rem !important;
  letter-spacing: 0.01em !important;
}

.shift-roster :deep(.v-btn) {
  border-radius: 0 !important;
}

.shift-roster :deep(.v-field),
.shift-roster :deep(.v-card),
.shift-roster :deep(.v-chip) {
  border-radius: 0 !important;
}

/* Summary Metrics */
.roster-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.roster-metric {
  display: flex;
  min-height: 84px;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  background: rgb(var(--v-theme-surface));
  border-radius: 0 !important;
}

.roster-metric__icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 0 !important;
}

.roster-metric__icon--primary {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}

.roster-metric__icon--info {
  color: rgb(var(--v-theme-info));
  background: rgba(var(--v-theme-info), 0.12);
}

.roster-metric__icon--success {
  color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.12);
}

.roster-metric__icon--warning {
  color: rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.12);
}

.roster-metric span {
  display: block;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.roster-metric strong {
  display: block;
  margin-top: 2px;
  font-size: 1.35rem;
  font-weight: 750;
  line-height: 1.2;
}

.roster-metric--window strong {
  font-size: 0.88rem;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tabs */
.roster-tabs-wrapper {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}

.roster-tabs {
  min-height: 38px;
}

.roster-tab {
  height: 38px !important;
  min-height: 38px !important;
  border-radius: 0 !important;
  font-size: 0.84rem !important;
  font-weight: 650 !important;
  letter-spacing: 0.01em !important;
  text-transform: none !important;
}

.tab-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.3;
  border-radius: 0 !important;
}

/* Table Filters in #filters slot */
.roster-filter-date {
  width: 145px;
  min-width: 135px;
}

.roster-filter-preset {
  width: 140px;
  min-width: 120px;
}

/* Cells */
.date-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.day-chip {
  display: inline-block;
  padding: 2px 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 0 !important;
}

.date-text {
  font-weight: 600;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-square {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  flex: 0 0 32px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  border-radius: 0 !important;
}

.employee-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.employee-name {
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-code {
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.72rem;
  font-family: monospace;
}

.shift-name-cell,
.template-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.shift-title,
.template-title {
  font-weight: 600;
}

.code-pill {
  display: inline-block;
  padding: 2px 7px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 600;
  border-radius: 0 !important;
}

.hours-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.time-range {
  font-weight: 600;
}

.duration-badge {
  display: inline-block;
  padding: 1px 6px;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.07);
  color: rgb(var(--v-theme-primary));
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 0 !important;
}

.break-grace-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  font-size: 0.8rem;
}

.status-chip {
  border-radius: 0 !important;
}

.notes-text {
  color: rgba(var(--v-theme-on-surface), 0.65);
  max-width: 240px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dialog Styles */
.dialog-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  border-radius: 0 !important;
}

.dialog-card__header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 18px 20px;
}

.dialog-card__icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  border-radius: 0 !important;
}

.dialog-card__icon--danger {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.12);
}

.dialog-card__titles span {
  display: block;
  color: rgb(var(--v-theme-primary));
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dialog-card__titles h2 {
  margin: 2px 0 0;
  font-size: 1.15rem;
  font-weight: 750;
  line-height: 1.25;
}

.dialog-card__titles p {
  margin: 2px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 0.78rem;
}

.dialog-card__body {
  padding: 18px 20px !important;
}

.dialog-card__actions {
  padding: 12px 20px !important;
  gap: 8px;
}

.active-switch-container {
  margin-top: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 0 !important;
}

/* Responsive */
@media (max-width: 960px) {
  .roster-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .roster-metrics {
    grid-template-columns: 1fr;
  }
  .roster-filter-date,
  .roster-filter-preset {
    width: 100%;
  }
}
</style>
