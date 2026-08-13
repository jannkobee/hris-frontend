<template>
  <v-dialog
    :model-value="state.visible"
    max-width="480"
    persistent
    @keydown.esc="cancel"
  >
    <v-card class="app-dialog">
      <v-card-text class="pa-6 pb-3">
        <div class="app-dialog__heading">
          <v-avatar :color="state.tone" variant="tonal" size="44">
            <v-icon :icon="icon" size="23" />
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ state.title }}</div>
            <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
              {{ state.message }}
            </p>
          </div>
        </div>

        <v-textarea
          v-if="state.kind === 'prompt'"
          v-model="state.inputValue"
          :label="state.inputLabel"
          :placeholder="state.inputPlaceholder"
          :rules="state.required ? [(value: string) => Boolean(value?.trim()) || 'This field is required.'] : []"
          variant="outlined"
          density="compact"
          rows="3"
          auto-grow
          autofocus
          class="mt-5"
          @keydown.ctrl.enter="accept"
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn
          v-if="state.kind !== 'alert'"
          variant="text"
          class="text-none"
          @click="cancel"
        >
          {{ state.cancelText }}
        </v-btn>
        <v-btn
          :color="state.tone"
          variant="flat"
          class="text-none px-5"
          :disabled="state.kind === 'prompt' && state.required && !state.inputValue.trim()"
          @click="accept"
        >
          {{ state.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";

const { state, accept, cancel } = useAppDialog();
const icon = computed(() => ({
  error: "mdi-alert-octagon-outline",
  warning: "mdi-alert-outline",
  info: "mdi-information-outline",
  primary: state.kind === "prompt" ? "mdi-text-box-edit-outline" : "mdi-help-circle-outline",
}[state.tone]));
</script>

<style scoped>
.app-dialog {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
}

.app-dialog__heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
</style>
