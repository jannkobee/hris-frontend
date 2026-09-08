<template>
  <v-card
    v-if="visible"
    class="setup-checklist-card mb-6"
    variant="outlined"
    rounded="xl"
  >
    <div class="checklist-header">
      <div class="d-flex align-center ga-3">
        <v-avatar color="primary" variant="tonal" size="36">
          <v-icon icon="mdi-compass-outline" size="20" />
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2 flex-wrap">
            <h3 class="text-subtitle-1 font-weight-bold">
              Workspace Setup Guide
            </h3>
            <v-chip size="x-small" color="primary" variant="tonal">
              {{ completedCount }} of {{ steps.length }} done
            </v-chip>
          </div>
          <p class="text-caption text-medium-emphasis mb-0">
            Complete these 3 simple steps to get your team running smoothly on
            LexisOne.
          </p>
        </div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-btn
          variant="text"
          size="small"
          :icon="isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
          :title="isCollapsed ? 'Expand checklist' : 'Collapse checklist'"
          @click="toggleCollapse"
        />
        <v-btn
          variant="text"
          size="small"
          icon="mdi-close"
          title="Dismiss setup guide"
          @click="dismiss"
        />
      </div>
    </div>

    <!-- Progress Bar -->
    <v-progress-linear
      :model-value="progressPercent"
      color="primary"
      height="4"
      class="checklist-progress"
    />

    <!-- Expanded Step Cards -->
    <v-expand-transition>
      <div v-show="!isCollapsed" class="checklist-body">
        <div class="steps-grid">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="step-card"
            :class="{ 'step-completed': step.completed }"
          >
            <div class="step-icon-col">
              <v-icon
                :icon="step.completed ? 'mdi-check-circle' : step.icon"
                :color="step.completed ? 'success' : 'primary'"
                size="24"
              />
              <span class="step-num">Step {{ index + 1 }}</span>
            </div>

            <div class="step-info-col">
              <h4 class="text-body-2 font-weight-bold">{{ step.title }}</h4>
              <p class="text-caption text-medium-emphasis mb-2">
                {{ step.description }}
              </p>
              <div class="d-flex align-center ga-2">
                <v-btn
                  size="small"
                  :color="step.completed ? 'surface-variant' : 'primary'"
                  :variant="step.completed ? 'tonal' : 'flat'"
                  :to="step.to"
                >
                  {{ step.completed ? "Review" : step.actionLabel }}
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  color="medium-emphasis"
                  @click="toggleStepComplete(step.id)"
                >
                  {{ step.completed ? "Undo" : "Mark done" }}
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  headcount?: number;
}>();

const storageKeyDismiss = "LEXISONE_SETUP_DISMISSED";
const storageKeyProgress = "LEXISONE_SETUP_PROGRESS";

const visible = ref(window.localStorage.getItem(storageKeyDismiss) !== "true");
const isCollapsed = ref(false);

const loadSavedProgress = (): Record<string, boolean> => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKeyProgress) || "{}");
  } catch {
    return {};
  }
};

const savedProgress = ref<Record<string, boolean>>(loadSavedProgress());

const steps = computed(() => [
  {
    id: "settings",
    title: "Configure Organization Settings",
    description:
      "Set your company logo, work hours, timezone, and employee numbering.",
    icon: "mdi-cog-outline",
    actionLabel: "Configure Settings",
    to: { name: "settings" },
    completed: Boolean(savedProgress.value.settings),
  },
  {
    id: "employees",
    title: "Add Team Members",
    description:
      "Add up to 10 active employees included with your Free Basic plan.",
    icon: "mdi-account-plus-outline",
    actionLabel: "Add Employees",
    to: { name: "employee-management" },
    completed: Boolean(
      savedProgress.value.employees ||
        (props.headcount && props.headcount >= 2),
    ),
  },
  {
    id: "workflow",
    title: "Test Attendance & Approval",
    description:
      "Try employee clock-in, or submit and review a sample leave request.",
    icon: "mdi-check-decagram-outline",
    actionLabel: "Try Workflow",
    to: { name: "attendance-management" },
    completed: Boolean(savedProgress.value.workflow),
  },
]);

const completedCount = computed(
  () => steps.value.filter((s) => s.completed).length,
);

const progressPercent = computed(() =>
  Math.round((completedCount.value / steps.value.length) * 100),
);

const toggleStepComplete = (id: string) => {
  savedProgress.value = {
    ...savedProgress.value,
    [id]: !savedProgress.value[id],
  };
  window.localStorage.setItem(
    storageKeyProgress,
    JSON.stringify(savedProgress.value),
  );
};

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const dismiss = () => {
  visible.value = false;
  window.localStorage.setItem(storageKeyDismiss, "true");
};
</script>

<style scoped>
.setup-checklist-card {
  background: rgba(var(--v-theme-surface), 0.9);
  border-color: rgba(var(--v-theme-primary), 0.24);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.checklist-body {
  padding: 16px 20px 20px;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.step-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  background: rgba(var(--v-theme-surface-variant), 0.25);
  transition: all 0.2s ease;
}

.step-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-surface-variant), 0.4);
}

.step-card.step-completed {
  opacity: 0.85;
  border-color: rgba(var(--v-theme-success), 0.3);
}

.step-icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.step-num {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.step-info-col {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
