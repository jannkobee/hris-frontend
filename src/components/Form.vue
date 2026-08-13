<template>
  <v-dialog
    :model-value="props.visible"
    :fullscreen="props.action === 'Remove' ? false : isFullscreen"
    :max-width="props.action === 'Remove' ? 500 : undefined"
    persistent
    scrollable
    @update:model-value="(value) => !value && emit('close')"
  >
    <v-card
      ref="cardEl"
      :class="[
        props.action === 'Remove' ? 'delete-card' : 'resizable-card',
        `action-${props.action.toLowerCase()}`,
        { 'is-fullscreen': isFullscreen && props.action !== 'Remove', dragging, resizing },
      ]"
      :style="isFullscreen || props.action === 'Remove' ? undefined : cardStyle"
    >
      <v-card-title
        class="crud-dialog-header d-flex align-center"
        :class="{ 'drag-handle': props.action !== 'Remove' }"
        @mousedown="onTitleMouseDown"
      >
        <v-avatar :color="actionPresentation.color" variant="tonal" size="38" class="mr-3">
          <v-icon :icon="actionPresentation.icon" size="21" />
        </v-avatar>
        <div class="crud-dialog-heading">
          <div class="text-subtitle-1 font-weight-bold">{{ actionPresentation.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ actionPresentation.description }}</div>
        </div>
        <v-spacer />
        <v-btn
          v-if="props.action !== 'Remove'"
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          variant="text"
          size="small"
          density="comfortable"
          :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          @click.stop="isFullscreen = !isFullscreen"
          class="mr-2"
        />
        <v-btn icon="mdi-close" variant="text" size="small" density="comfortable" aria-label="Close dialog" @click.stop="emit('close')" />
      </v-card-title>

      <v-card-text class="crud-dialog-body">
        <template v-if="props.action === 'Remove'">
          <div class="delete-confirmation">
            <v-avatar color="error" variant="tonal" size="58">
              <v-icon icon="mdi-delete-alert-outline" size="29" />
            </v-avatar>
            <div class="text-h6 mt-4">Delete this {{ displayEntity.toLowerCase() }}?</div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              This record will be permanently removed. This action cannot be undone.
            </div>
          </div>
        </template>

        <v-form v-else ref="formEl" class="crud-workflow" @submit.prevent="execute">
          <div class="section-heading">
            <v-avatar color="primary" variant="tonal" size="34">
              <v-icon icon="mdi-file-document-edit-outline" size="19" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Record information</div>
              <div class="text-caption text-medium-emphasis">
                {{ props.action === 'View' ? 'Review the saved information below.' : 'Complete the details for this record.' }}
              </div>
            </div>
            <v-spacer />
            <v-btn
              v-if="props.showPermissionAction && props.entity === 'Role'"
              prepend-icon="mdi-account-lock-outline"
              color="primary"
              variant="tonal"
              size="small"
              class="text-none"
              @click="emit('permission')"
            >Permissions</v-btn>
          </div>

          <section class="form-section">
            <div class="form-section-title">{{ displayEntity }} details</div>
            <div class="form-section-description">Fields marked with an asterisk are required.</div>
            <div class="crud-field-grid mt-4">
              <div
                v-for="field in formFields"
                :key="field.key"
                class="crud-field"
                :class="{ 'crud-field--wide': field.inputField === 'richtext' || field.multiple }"
              >
                <v-text-field
                  v-if="['text', 'date', 'time', 'datetime'].includes(field.inputField ?? '')"
                  v-model="form[field.key]"
                  :type="field.inputField === 'datetime' ? 'datetime-local' : field.inputField"
                  :label="field.title"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                  :readonly="isFieldReadOnly(field)"
                  :required="field.required"
                  :rules="field.required ? [(value) => !!value || `${field.title} is required`] : []"
                />
                <v-file-input
                  v-else-if="field.inputField === 'file'"
                  v-model="form[field.key]"
                  :label="field.title"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                  :readonly="isFieldReadOnly(field)"
                  :required="field.required"
                  :multiple="field.multiple"
                  :accept="field.accept"
                  show-size
                  clearable
                />
                <div v-else-if="field.inputField === 'richtext'" class="richtext-field">
                  <div class="field-label">{{ field.title }}<span v-if="field.required" class="text-error"> *</span></div>
                  <RichTextEditor v-model="form[field.key]" :read-only="isFieldReadOnly(field)" />
                </div>
                <v-checkbox
                  v-else-if="field.inputField === 'checkbox'"
                  v-model="form[field.key]"
                  :label="field.title"
                  density="compact"
                  hide-details="auto"
                  :readonly="isFieldReadOnly(field)"
                />
                <div v-else-if="field.inputField === 'radio'" class="radio-field">
                  <div class="field-label">{{ field.title }}<span v-if="field.required" class="text-error"> *</span></div>
                  <v-radio-group v-model="form[field.key]" density="compact" hide-details="auto" :readonly="isFieldReadOnly(field)" :rules="field.required ? [(value) => !!value || `${field.title} is required`] : []">
                    <v-radio v-for="option in field.inputOptions" :key="option.value" :label="option.label" :value="option.value" density="compact" />
                  </v-radio-group>
                </div>
                <v-autocomplete
                  v-else-if="field.inputField === 'select'"
                  v-model="form[field.selectKey!]"
                  :label="field.title"
                  :items="field.inputOptions"
                  :item-title="(item) => getSelectOptionLabel(item)"
                  :item-value="(item) => getSelectOptionValue(item)"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                  :readonly="isFieldReadOnly(field)"
                  :required="field.required"
                  :multiple="field.multiple"
                  :chips="field.multiple"
                  :closable-chips="field.multiple"
                  :rules="field.required ? [(value) => (field.multiple ? !!value?.length : !!value) || `${field.title} is required`] : []"
                  clearable
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps" :title="getSelectOptionLabel(item.raw)" :subtitle="getSelectOptionDescription(item.raw)" />
                  </template>
                </v-autocomplete>
              </div>
            </div>
          </section>
          <button type="submit" class="sr-only" tabindex="-1" aria-hidden="true" />
        </v-form>
      </v-card-text>

      <v-card-actions class="crud-dialog-actions">
        <v-spacer />
        <v-btn variant="text" class="text-none" :disabled="props.loading" @click="emit('close')">
          {{ props.action === 'View' ? 'Close' : 'Cancel' }}
        </v-btn>
        <v-btn v-if="props.action === 'Create'" prepend-icon="mdi-plus" color="success" variant="flat" class="text-none" :loading="props.loading" :disabled="props.readOnly" @click="execute">Create {{ displayEntity }}</v-btn>
        <v-btn v-else-if="props.action === 'Edit'" prepend-icon="mdi-pencil" color="info" variant="flat" class="text-none" :loading="props.loading" :disabled="props.readOnly" @click="execute">Save {{ displayEntity }}</v-btn>
        <v-btn v-else-if="props.action === 'Remove'" prepend-icon="mdi-delete" color="error" variant="flat" class="text-none" :loading="props.loading" :disabled="props.readOnly" @click="execute">Delete {{ displayEntity }}</v-btn>
      </v-card-actions>

      <div v-if="!isFullscreen && props.action !== 'Remove'" class="resize-handle" @mousedown="onResizeMouseDown" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick } from "vue";
import type { ColumnConfig } from "@/types/types";
import RichTextEditor from "@/components/RIchTextEditor.vue";
import { useDraggable } from "@/composables/useDraggable";
import { useResizable } from "@/composables/useResizable";

const props = defineProps({
  loading: { type: Boolean, default: false },
  entity: { type: String, default: "" },
  action: { type: String, default: "" },
  readOnly: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  form: { type: Object, default: () => ({}) },
  data: { type: Object, default: () => ({}) },
  fields: { type: Array as () => ColumnConfig[], default: () => [] },
  showPermissionAction: { type: Boolean, default: true },
});

const form = ref<Record<string, any>>({});
const isFullscreen = ref(false);
const formEl = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);

// Guards the field-linking watchers below from firing when the form is
// being populated/reset by opening the dialog, rather than by the user
// actually changing a field.
const isPopulating = ref(false);

// v-card's template ref is the component instance, not the DOM node —
// useResizable needs the actual element to read its rendered size.
const cardEl = ref<{ $el: HTMLElement } | null>(null);
const cardElement = computed<HTMLElement | null>(
  () => cardEl.value?.$el ?? null,
);

const {
  offset: dragOffset,
  dragging,
  onMouseDown: onTitleMouseDown,
  reset: resetDrag,
} = useDraggable(() => isFullscreen.value);

const {
  size,
  resizing,
  onMouseDown: onResizeMouseDown,
  reset: resetResize,
} = useResizable(
  cardElement,
  { minWidth: 600, minHeight: 400, maxWidth: window.innerWidth * 0.95 },
  () => isFullscreen.value || props.action === "Remove",
);

// Combining position + size in one binding keeps them in sync through the
// same Vue-reactive style patch, rather than mixing a JS-driven transform
// with the browser's own native `resize` box model.
const cardStyle = computed(() => ({
  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
  ...(size.width !== null ? { width: `${size.width}px` } : {}),
  ...(size.height !== null ? { height: `${size.height}px` } : {}),
}));

const resetDialogGeometry = () => {
  resetDrag();
  resetResize();
};

const emit = defineEmits(["permission", "close", "execute"]);

const isFieldReadOnly = (field: ColumnConfig): boolean => {
  if (props.readOnly) return true;
  if (field.readOnly) return true;
  if (field.readOnlyOnEdit && props.action === "Edit") return true;
  return false;
};

// The "action" column is a Table-only concept (it's where Table.vue renders
// its view/edit/delete buttons). Fields configs share one array between
// Table's headers and Form's fields, so Form must filter that column out
// itself rather than relying on every fields file remembering to mark it
// `inputField: "none"`.
const formFields = computed(() =>
  props.fields.filter(
    (field) => field.key !== "action" && field.inputField !== "none",
  ),
);

const getSelectOptionLabel = (option: any): string => {
  if (!option) return "";

  if (typeof option === "string") return option;
  if (typeof option?.label === "string") return option.label;
  if (typeof option?.title === "string") return option.title;
  if (typeof option?.name === "string") return option.name;

  return String(option?.value ?? "");
};

const getSelectOptionValue = (option: any): unknown => {
  if (!option) return "";
  if (typeof option === "string") return option;

  return option?.value ?? option?.id ?? option;
};

const getSelectOptionDescription = (option: any): string => {
  if (!option || typeof option === "string") return "";

  return option?.description ?? option?.subtitle ?? option?.hint ?? "";
};

const displayEntity = computed(() => {
  const raw = (props.entity ?? "").toString().trim();
  if (!raw) return "";

  let formatted = raw
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

  const words = formatted.split(" ");
  const lastWord = words.pop() as string;

  let singularLastWord = lastWord;
  if (lastWord.endsWith("ies")) {
    singularLastWord = lastWord.slice(0, -3) + "y";
  } else if (lastWord.endsWith("ses")) {
    singularLastWord = lastWord.slice(0, -2);
  } else if (lastWord.endsWith("s")) {
    singularLastWord = lastWord.slice(0, -1);
  }

  words.push(singularLastWord);

  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
});

const actionPresentation = computed(() => {
  const entity = displayEntity.value;
  const presentations: Record<string, { color: string; icon: string; title: string; description: string }> = {
    Create: { color: "primary", icon: "mdi-plus-circle-outline", title: `Create ${entity}`, description: "Add a new record and complete the required details." },
    Edit: { color: "info", icon: "mdi-pencil-outline", title: `Edit ${entity}`, description: "Review and update the record details." },
    View: { color: "primary", icon: "mdi-eye-outline", title: `${entity} details`, description: "Review the complete record information." },
    Remove: { color: "error", icon: "mdi-delete-alert-outline", title: `Delete ${entity}`, description: "Confirm permanent removal of this record." },
  };

  return presentations[props.action] ?? {
    color: "primary",
    icon: "mdi-file-document-edit-outline",
    title: `${props.action} ${entity}`.trim(),
    description: "Review the record details below.",
  };
});

const execute = async () => {
  if (props.action !== "Remove") {
    const result = await formEl.value?.validate();
    if (result && !result.valid) return;
  }
  emit("execute", form.value);
};

watch(isFullscreen, (value) => {
  if (!value) resetDialogGeometry();
});

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      isPopulating.value = true;
      form.value = { ...props.form, ...props.data };
      resetDialogGeometry();
      await nextTick();
      isPopulating.value = false;
    } else {
      isFullscreen.value = false;
      resetDialogGeometry();
    }
  },
);

// Wire up any field that declares an `onChange` handler (e.g. "Frequency"
// auto-populating "Run Months"). Fields are fixed for the lifetime of a
// given Form instance, so it's safe to set these watchers up once.
props.fields
  .filter((field) => field.onChange)
  .forEach((field) => {
    const bindKey = field.selectKey ?? field.key;
    watch(
      () => form.value[bindKey],
      (newValue) => {
        if (isPopulating.value) return;
        const patch = field.onChange!(newValue, form.value);
        if (patch) Object.assign(form.value, patch);
      },
    );
  });
</script>

<style lang="css" scoped>
.dialog-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  margin: 0;
  padding: 0;
}

.dialog-heading {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 13px;
  align-items: center;
}

.dialog-heading__title {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1.05rem;
  font-weight: 750;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-heading__subtitle {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.75rem;
  font-weight: 450;
  line-height: 1.35;
  white-space: normal;
}

.dialog-controls {
  display: flex;
  flex: 0 0 auto;
  gap: 2px;
}

.drag-handle {
  cursor: move;
}

.resizable-card.dragging,
.resizable-card.resizing {
  cursor: grabbing;
  user-select: none;
}

.resizable-card {
  /* Vuetify's own VDialog.sass sets `flex: 1 1 var(--v-card-height, 100%)`
     on this exact element unconditionally (not just with the `scrollable`
     prop), which force-grows the card to fill the dialog's available
     height on every layout pass — silently overriding any height we set
     ourselves. Cancel that out so our own width/height bindings are the
     only thing controlling size, and escape ancestor `align-items` so
     centering recalculates in both directions. */
  flex: 0 0 auto !important;
  align-self: center;
  justify-self: center;

  width: min(760px, 94vw);
  max-height: 88vh;
  min-width: 320px;
  min-height: 240px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.28),
    0 5px 18px rgba(0, 0, 0, 0.12) !important;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  z-index: 1;
  background: linear-gradient(
    135deg,
    transparent 0%,
    transparent 45%,
    rgba(var(--v-theme-on-surface), 0.35) 45%,
    rgba(var(--v-theme-on-surface), 0.35) 55%,
    transparent 55%,
    transparent 60%,
    rgba(var(--v-theme-on-surface), 0.35) 60%,
    rgba(var(--v-theme-on-surface), 0.35) 70%,
    transparent 70%,
    transparent 75%,
    rgba(var(--v-theme-on-surface), 0.35) 75%,
    rgba(var(--v-theme-on-surface), 0.35) 85%,
    transparent 85%
  );
}

.resizable-card.is-fullscreen {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0;
  min-height: 0;
  resize: none;
}

.resizable-card :deep(.v-card-text) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.resizable-card :deep(.v-card-item) {
  margin: 0;
  padding: 0;
}

.resizable-card :deep(.v-card-title) {
  margin: 0;
  padding: 12px 16px;
}

.resizable-card :deep(.v-card-actions) {
  min-height: 62px;
  padding: 10px 20px 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.018);
}

.form-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
  row-gap: 6px;
}

.form-field {
  min-width: 0;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.form-field h5 {
  margin: 0 0 6px 2px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgb(var(--v-theme-on-surface-variant));
}

.form-field :deep(.v-field) {
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.018);
}

.form-field :deep(input[type="date"]),
.form-field :deep(input[type="time"]),
.form-field :deep(input[type="datetime-local"]) {
  position: relative;
  width: 100%;
  max-width: none;
  padding-right: 34px !important;
}

.form-field :deep(input[type="date"]::-webkit-calendar-picker-indicator),
.form-field :deep(input[type="time"]::-webkit-calendar-picker-indicator),
.form-field :deep(input[type="datetime-local"]::-webkit-calendar-picker-indicator) {
  position: absolute;
  right: 2px;
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 2px;
  cursor: pointer;
}

.action-view .form-field :deep(.v-field) {
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.remove-confirmation {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 18px;
  border-radius: 14px;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-error), 0.09);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 600px) {
  .form-fields {
    grid-template-columns: 1fr;
  }

  .form-field--wide {
    grid-column: auto;
  }

  .resizable-card :deep(.v-card-text) {
    padding: 16px;
  }

  .dialog-heading__subtitle {
    display: none;
  }

  .remove-confirmation {
    grid-template-columns: 1fr;
  }
}
/* Shared CRUD dialogs intentionally mirror EmployeeStepperForm. */
.resizable-card {
  width: min(980px, 94vw);
  min-width: 600px;
  min-height: 400px;
  border: 0;
  box-shadow: none !important;
}

.delete-card {
  flex: 0 0 auto !important;
}

.crud-dialog-header {
  min-height: 66px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.resizable-card > .crud-dialog-header {
  padding: 12px 18px;
}

.crud-dialog-heading {
  min-width: 0;
}

.crud-dialog-heading > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crud-dialog-body {
  padding: 0 !important;
}

.crud-workflow {
  padding: 22px 26px 26px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}

.form-section {
  padding: 18px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.form-section-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.form-section-description {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.73rem;
}

.crud-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.crud-field {
  min-width: 0;
}

.crud-field--wide {
  grid-column: 1 / -1;
}

.crud-field :deep(input[type="date"]),
.crud-field :deep(input[type="time"]),
.crud-field :deep(input[type="datetime-local"]) {
  position: relative;
  width: 100%;
  max-width: none;
  padding-right: 34px !important;
}

.crud-field :deep(input[type="date"]::-webkit-calendar-picker-indicator),
.crud-field :deep(input[type="time"]::-webkit-calendar-picker-indicator),
.crud-field :deep(input[type="datetime-local"]::-webkit-calendar-picker-indicator) {
  position: absolute;
  right: 2px;
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 2px;
  cursor: pointer;
}

.action-view .crud-field :deep(.v-field) {
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.field-label {
  margin: 0 0 6px 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.75rem;
  font-weight: 600;
}

.delete-confirmation {
  max-width: 360px;
  margin: 0 auto;
  padding: 34px 24px;
  text-align: center;
}

.crud-dialog-actions {
  min-height: 58px;
  padding: 10px 20px 14px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.resizable-card > .crud-dialog-actions,
.delete-card > .crud-dialog-actions {
  min-height: 58px;
  padding: 10px 20px 14px;
  background: rgb(var(--v-theme-surface));
}

.resize-handle {
  right: 2px;
  bottom: 2px;
  width: 14px;
  height: 14px;
  z-index: 2;
  opacity: 0.45;
}

@media (max-width: 700px) {
  .resizable-card {
    width: 96vw;
    min-width: 0;
  }

  .crud-field-grid {
    grid-template-columns: 1fr;
  }

  .crud-field--wide {
    grid-column: auto;
  }

  .crud-workflow {
    padding: 18px 16px 22px;
  }

  .section-heading {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .crud-dialog-heading .text-caption {
    display: none;
  }
}
</style>
