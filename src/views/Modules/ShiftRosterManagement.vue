<template>
  <v-container fluid class="shift-roster">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div><div class="text-h5 font-weight-bold">Shifts & Roster</div><p class="text-body-2 text-medium-emphasis mb-0">Plan work schedules, then compare them with attendance records.</p></div>
      <v-btn v-if="canManage" color="primary" prepend-icon="mdi-calendar-plus" @click="openAssignment()">Assign shift</v-btn>
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-4"><v-tab value="roster">Roster</v-tab><v-tab value="templates">Shift templates</v-tab></v-tabs>
    <v-window v-model="tab">
      <v-window-item value="roster">
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap ga-3">Employee roster <v-spacer /><v-text-field v-model="from" type="date" label="From" density="compact" hide-details variant="outlined" /><v-text-field v-model="to" type="date" label="To" density="compact" hide-details variant="outlined" /><v-btn icon="mdi-refresh" variant="text" @click="loadAssignments" /></v-card-title>
          <v-table><thead><tr><th>Date</th><th>Employee</th><th>Shift</th><th>Planned hours</th><th>Break / grace</th><th v-if="canManage">Actions</th></tr></thead><tbody><tr v-for="assignment in assignments" :key="assignment.id"><td>{{ assignment.work_date }}</td><td>{{ assignment.employee?.user?.full_name || 'Employee' }}</td><td>{{ assignment.shift_name }}</td><td>{{ assignment.start_time }} – {{ assignment.end_time }}</td><td>{{ assignment.break_minutes }}m / {{ assignment.grace_minutes }}m</td><td v-if="canManage"><v-btn icon="mdi-pencil-outline" size="small" variant="text" @click="openAssignment(assignment)" /><v-btn icon="mdi-delete-outline" size="small" color="error" variant="text" @click="removeAssignment(assignment)" /></td></tr><tr v-if="!assignments.length"><td :colspan="canManage ? 6 : 5" class="text-center text-medium-emphasis py-8">No shifts are assigned in this period.</td></tr></tbody></v-table>
        </v-card>
      </v-window-item>
      <v-window-item value="templates">
        <v-card><v-card-title class="d-flex align-center">Shift templates <v-spacer /><v-btn v-if="canManage" color="primary" size="small" prepend-icon="mdi-plus" @click="openTemplate()">Add template</v-btn></v-card-title>
          <v-table><thead><tr><th>Name</th><th>Code</th><th>Hours</th><th>Break / grace</th><th>Status</th><th v-if="canManage">Actions</th></tr></thead><tbody><tr v-for="template in templates" :key="template.id"><td>{{ template.name }}</td><td>{{ template.code || '—' }}</td><td>{{ template.start_time }} – {{ template.end_time }}</td><td>{{ template.break_minutes }}m / {{ template.grace_minutes }}m</td><td><v-chip size="small" :color="template.is_active ? 'success' : 'default'">{{ template.is_active ? 'Active' : 'Inactive' }}</v-chip></td><td v-if="canManage"><v-btn icon="mdi-pencil-outline" size="small" variant="text" @click="openTemplate(template)" /></td></tr></tbody></v-table>
        </v-card>
      </v-window-item>
    </v-window>

    <v-dialog v-model="templateDialog" max-width="560"><v-card><v-card-title>{{ templateForm.id ? 'Edit' : 'Create' }} shift template</v-card-title><v-card-text><v-text-field v-model="templateForm.name" label="Name" variant="outlined" /><v-text-field v-model="templateForm.code" label="Code (optional)" variant="outlined" /><v-row><v-col><v-text-field v-model="templateForm.start_time" type="time" label="Start" variant="outlined" /></v-col><v-col><v-text-field v-model="templateForm.end_time" type="time" label="End" variant="outlined" /></v-col></v-row><v-row><v-col><v-text-field v-model.number="templateForm.break_minutes" type="number" label="Break minutes" variant="outlined" /></v-col><v-col><v-text-field v-model.number="templateForm.grace_minutes" type="number" label="Grace minutes" variant="outlined" /></v-col></v-row><v-switch v-model="templateForm.is_active" label="Active and available for rostering" color="primary" /></v-card-text><v-card-actions><v-spacer /><v-btn @click="templateDialog = false">Cancel</v-btn><v-btn color="primary" :loading="saving" @click="saveTemplate">Save</v-btn></v-card-actions></v-card></v-dialog>
    <v-dialog v-model="assignmentDialog" max-width="560"><v-card><v-card-title>{{ assignmentForm.id ? 'Edit' : 'Assign' }} shift</v-card-title><v-card-text><v-select v-model="assignmentForm.employee_id" :items="employeeOptions" item-title="title" item-value="value" label="Employee" variant="outlined" /><v-select v-model="assignmentForm.shift_template_id" :items="templateOptions" item-title="title" item-value="value" label="Shift template" variant="outlined" /><v-text-field v-model="assignmentForm.work_date" type="date" label="Work date" variant="outlined" /><v-textarea v-model="assignmentForm.notes" label="Notes (optional)" variant="outlined" /></v-card-text><v-card-actions><v-spacer /><v-btn @click="assignmentDialog = false">Cancel</v-btn><v-btn color="primary" :loading="saving" @click="saveAssignment">Save</v-btn></v-card-actions></v-card></v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import { usePermissions } from "@/composables/usePermissions";

const tab = ref("roster"); const saving = ref(false); const templates = ref<any[]>([]); const assignments = ref<any[]>([]); const employees = ref<any[]>([]); const templateDialog = ref(false); const assignmentDialog = ref(false);
const today = new Date(); const date = (value: Date) => value.toISOString().slice(0, 10); const from = ref(date(today)); const to = ref(date(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13)));
const blankTemplate = () => ({ id: "", name: "", code: "", start_time: "08:00", end_time: "17:00", break_minutes: 60, grace_minutes: 0, is_active: true });
const blankAssignment = () => ({ id: "", employee_id: "", shift_template_id: "", work_date: date(today), notes: "" });
const templateForm = ref(blankTemplate()); const assignmentForm = ref(blankAssignment()); const { checkPermissions } = usePermissions(); const canManage = computed(() => checkPermissions("manage-shifts"));
const employeeOptions = computed(() => employees.value.map((employee) => ({ value: employee.id, title: `${employee.user?.full_name || employee.employee_no} (${employee.employee_no})` })));
const templateOptions = computed(() => templates.value.filter((template) => template.is_active).map((template) => ({ value: template.id, title: `${template.name} · ${template.start_time}–${template.end_time}` })));
const loadTemplates = async () => { const response = await axios.get("/shift-templates", { params: { all: 1 }, headers: { "X-Suppress-Success-Notification": "true" } }); templates.value = response.data.data ?? []; };
const loadEmployees = async () => { const response = await axios.get("/employees", { params: { all: 1, relations: "user" }, headers: { "X-Suppress-Success-Notification": "true" } }); employees.value = response.data.data ?? []; };
const loadAssignments = async () => { const response = await axios.get("/shift-assignments", { params: { from: from.value, to: to.value, limit: 200 }, headers: { "X-Suppress-Success-Notification": "true" } }); assignments.value = response.data.data?.data ?? []; };
const openTemplate = (template?: any) => { templateForm.value = template ? { ...template } : blankTemplate(); templateDialog.value = true; };
const openAssignment = (assignment?: any) => { assignmentForm.value = assignment ? { ...assignment, work_date: assignment.work_date?.slice(0, 10) } : blankAssignment(); assignmentDialog.value = true; };
const saveTemplate = async () => { saving.value = true; try { const { id, ...payload } = templateForm.value; if (id) await axios.put(`/shift-templates/${id}`, payload); else await axios.post("/shift-templates", payload); templateDialog.value = false; await loadTemplates(); } finally { saving.value = false; } };
const saveAssignment = async () => { saving.value = true; try { const { id, ...payload } = assignmentForm.value; if (id) await axios.put(`/shift-assignments/${id}`, payload); else await axios.post("/shift-assignments", payload); assignmentDialog.value = false; await loadAssignments(); } finally { saving.value = false; } };
const removeAssignment = async (assignment: any) => { await axios.delete(`/shift-assignments/${assignment.id}`); await loadAssignments(); };
onMounted(async () => { await Promise.all([loadTemplates(), loadEmployees(), loadAssignments()]); });
</script>

<style scoped>.shift-roster :deep(.v-card-title) { padding: 16px 20px; } .shift-roster :deep(th) { white-space: nowrap; }</style>
