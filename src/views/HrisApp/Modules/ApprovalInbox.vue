<template>
  <v-container fluid
    ><ModuleHeader
      eyebrow="Manager workspace"
      title="Approval Inbox"
      subtitle="Pending attendance, leave, and overtime decisions."
      icon="mdi-inbox-arrow-down-outline"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="load"
          >Refresh</v-btn
        >
      </template>
    </ModuleHeader>
    <v-card
      ><v-table
        ><thead>
          <tr>
            <th>Type</th>
            <th>Employee</th>
            <th>Details</th>
            <th>Submitted</th>
            <th>Open</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="`${item.type}-${item.id}`">
            <td>
              <v-chip size="small">{{ label(item.type) }}</v-chip>
            </td>
            <td>{{ item.employee }}</td>
            <td>{{ item.summary }}</td>
            <td>{{ date(item.submitted_at) }}</td>
            <td>
              <v-btn size="small" variant="tonal" @click="open(item)"
                >Review</v-btn
              >
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="5" class="text-center text-medium-emphasis py-8">
              No approvals are waiting.
            </td>
          </tr>
        </tbody></v-table
      ></v-card
    ></v-container
  >
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "@/plugins/axios";
const router = useRouter();
const items = ref<any[]>([]);
const load = async () => {
  const r = await axios.get("/approvals/inbox");
  items.value = r.data.data ?? [];
};
const label = (type: string) =>
  ({
    attendance_correction: "Attendance correction",
    leave: "Leave",
    overtime: "Overtime",
  })[type] ?? type;
const date = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const open = (item: any) =>
  router.push({
    name:
      item.type === "attendance_correction"
        ? "attendance-management"
        : item.type === "leave"
          ? "leave-management"
          : "overtime-management",
  });
onMounted(load);
</script>
