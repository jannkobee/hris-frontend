<template>
  <v-dialog :model-value="visible" max-width="920" scrollable @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="document-header">
        <v-avatar color="primary" variant="tonal" size="40">
          <v-icon icon="mdi-folder-account-outline" />
        </v-avatar>
        <div class="min-width-0">
          <div class="text-subtitle-1 font-weight-bold">Employee 201 files</div>
          <div class="text-caption text-medium-emphasis text-truncate">
            {{ employeeLabel }} · Private personnel records
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-5">
        <EmployeeDocumentsPanel :employee="employee" :active="visible" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import EmployeeDocumentsPanel from "@/components/EmployeeDocumentsPanel.vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  employee: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["close"]);
const employeeLabel = computed(
  () => props.employee?.user?.full_name || props.employee?.employee_no || "Employee",
);
const close = () => emit("close");
</script>

<style scoped>
.document-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px; }
.min-width-0 { min-width: 0; }
</style>
