<template>
  <v-dialog v-model="props.visible" :fullscreen="isFullscreen" persistent>
    <v-card
      ref="cardEl"
      class="resizable-card"
      :class="{ 'is-fullscreen': isFullscreen, dragging, resizing }"
      :style="isFullscreen ? undefined : cardStyle"
    >
      <template v-slot:title>
        <div class="dialog-title-row drag-handle" @mousedown="onTitleMouseDown">
          <span>{{ props.action }} {{ displayEntity }}</span>
          <v-btn
            :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            variant="text"
            size="small"
            density="comfortable"
            :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            @click="isFullscreen = !isFullscreen"
          />
        </div>
      </template>
      <template v-slot:text>
        <template v-if="props.action === 'Remove'">
          Are you sure you want to delete this item?
        </template>
        <template v-else v-for="field in formFields" :key="field.key">
          <h5 v-if="field.inputField != 'none'">
            {{ field.title }}
            <span v-if="field.required" class="text-error">*</span>
          </h5>

          <v-text-field
            v-if="field.inputField === 'text'"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :rules="
              field.required ? [(v) => !!v || `${field.title} is required`] : []
            "
          />
          <v-text-field
            v-else-if="field.inputField === 'date'"
            type="date"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :rules="
              field.required ? [(v) => !!v || `${field.title} is required`] : []
            "
          />
          <v-text-field
            v-else-if="field.inputField === 'time'"
            type="time"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :rules="
              field.required ? [(v) => !!v || `${field.title} is required`] : []
            "
          />
          <RichTextEditor
            v-else-if="field.inputField === 'richtext'"
            v-model="form[field.key]"
            :read-only="isFieldReadOnly(field)"
          />
          <v-checkbox
            v-else-if="field.inputField === 'checkbox'"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
          />
          <v-radio-group
            v-else-if="field.inputField === 'radio'"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
          >
            <v-radio
              v-for="option in field.inputOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </v-radio-group>
          <v-autocomplete
            v-else-if="field.inputField === 'select'"
            v-model="form[field.selectKey!]"
            :items="field.inputOptions"
            :item-title="(item) => getSelectOptionLabel(item)"
            :item-value="(item) => getSelectOptionValue(item)"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :multiple="field.multiple"
            :chips="field.multiple"
            :closable-chips="field.multiple"
            :rules="
              field.required
                ? [
                    (v) =>
                      (field.multiple ? !!v?.length : !!v) ||
                      `${field.title} is required`,
                  ]
                : []
            "
            clearable
          >
            <template #item="{ props, item }">
              <v-list-item
                v-bind="props"
                :title="getSelectOptionLabel(item.raw)"
                :subtitle="getSelectOptionDescription(item.raw)"
              />
            </template>
          </v-autocomplete>
        </template>
        <v-btn
          v-if="props.entity === 'Role' && props.action !== 'Remove'"
          prepend-icon="mdi-account-lock-outline"
          @click="emit('permission')"
        >
          Permissions
        </v-btn>
      </template>

      <template v-slot:actions>
        <div class="form-actions">
          <v-btn @click="$emit('close')"> Close </v-btn>
          <v-btn
            v-if="props.action === 'Create'"
            prepend-icon="mdi-plus"
            color="success"
            :loading="props.loading"
            :disabled="props.readOnly"
            @click="execute"
          >
            Create {{ displayEntity }}
          </v-btn>
          <v-btn
            v-if="props.action === 'Edit'"
            prepend-icon="mdi-pencil"
            color="info"
            :loading="props.loading"
            :disabled="props.readOnly"
            @click="execute"
          >
            Save {{ displayEntity }}
          </v-btn>
          <v-btn
            v-if="props.action === 'Remove'"
            prepend-icon="mdi-delete"
            color="error"
            :loading="props.loading"
            :disabled="props.readOnly"
            @click="execute"
          >
            Delete {{ displayEntity }}
          </v-btn>
        </div>
      </template>

      <div
        v-if="!isFullscreen"
        class="resize-handle"
        @mousedown="onResizeMouseDown"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick } from "vue";
import { ColumnConfig } from "@/types/types";
import RichTextEditor from "@/components/RIchTextEditor.vue";
import { useDraggable } from "@/composables/useDraggable";
import { useResizable } from "@/composables/useResizable";

const props = defineProps({
  loading: { type: Boolean, default: false },
  entity: { type: String, default: "" },
  action: { type: String, default: "" },
  readOnly: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  form: { type: Object, default: () => {} },
  data: { type: Object, default: () => {} },
  fields: { type: Array as () => ColumnConfig[], default: () => [] },
});

const form = ref<Record<string, any>>({});
const isFullscreen = ref(false);

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
  { minWidth: 320, minHeight: 320, maxWidth: window.innerWidth * 0.95 },
  () => isFullscreen.value,
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
  props.fields.filter((field) => field.key !== "action"),
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

const execute = async () => {
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
  gap: 8px;
  width: 100%;
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

  width: min(1000px, 95vw);
  max-height: 90vh;
  min-width: 320px;
  min-height: 320px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
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
    rgba(255, 255, 255, 0.35) 45%,
    rgba(255, 255, 255, 0.35) 55%,
    transparent 55%,
    transparent 60%,
    rgba(255, 255, 255, 0.35) 60%,
    rgba(255, 255, 255, 0.35) 70%,
    transparent 70%,
    transparent 75%,
    rgba(255, 255, 255, 0.35) 75%,
    rgba(255, 255, 255, 0.35) 85%,
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
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0;
}
</style>
