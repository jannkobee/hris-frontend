<template>
  <v-dialog
    v-model="props.visible"
    :fullscreen="props.action === 'Remove' ? false : isFullscreen"
    :max-width="props.action === 'Remove' ? 500 : undefined"
    persistent
  >
    <v-card
      ref="cardEl"
      :class="[
        props.action === 'Remove' ? '' : 'resizable-card',
        {
          'is-fullscreen': isFullscreen && props.action !== 'Remove',
          dragging,
          resizing,
        },
      ]"
      :style="isFullscreen || props.action === 'Remove' ? undefined : cardStyle"
    >
      <v-card-title
        class="d-flex align-center"
        :class="{ 'drag-handle': props.action !== 'Remove' }"
        @mousedown="onTitleMouseDown"
      >
        <span>{{ props.action }} {{ displayEntity }}</span>
        <v-spacer />
        <v-btn
          v-if="props.action !== 'Remove'"
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          variant="text"
          size="small"
          density="comfortable"
          :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          @click="isFullscreen = !isFullscreen"
          class="mr-2"
        />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          density="comfortable"
          @click="$emit('close')"
        />
      </v-card-title>

      <v-card-text>
        <template v-if="props.action === 'Remove'">
          <div class="pa-4 text-body-1">
            Are you sure you want to delete this item?
          </div>
        </template>
        <template v-else>
          <template v-for="field in props.fields" :key="field.key">
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
                field.required
                  ? [(v) => !!v || `${field.title} is required`]
                  : []
              "
            />
            <v-text-field
              v-else-if="field.inputField === 'date'"
              type="date"
              v-model="form[field.key]"
              :readonly="isFieldReadOnly(field)"
              :required="field.required"
              :rules="
                field.required
                  ? [(v) => !!v || `${field.title} is required`]
                  : []
              "
            />
            <v-text-field
              v-else-if="field.inputField === 'time'"
              type="time"
              v-model="form[field.key]"
              :readonly="isFieldReadOnly(field)"
              :required="field.required"
              :rules="
                field.required
                  ? [(v) => !!v || `${field.title} is required`]
                  : []
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
              :rules="
                field.required
                  ? [(v) => !!v || `${field.title} is required`]
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
            class="mt-4"
            @click="emit('permission')"
          >
            Permissions
          </v-btn>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
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
      </v-card-actions>

      <div
        v-if="!isFullscreen && props.action !== 'Remove'"
        class="resize-handle"
        @mousedown="onResizeMouseDown"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
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

const cardEl = ref<{ $el: HTMLElement } | null>(null);
const cardElement = computed<HTMLElement | null>(
  () => cardEl.value?.$el ?? null,
);

const {
  offset: dragOffset,
  dragging,
  onMouseDown: onTitleMouseDown,
  reset: resetDrag,
} = useDraggable(() => isFullscreen.value || props.action === "Remove");

const {
  size,
  resizing,
  onMouseDown: onResizeMouseDown,
  reset: resetResize,
} = useResizable(
  cardElement,
  { minWidth: 320, minHeight: 320, maxWidth: window.innerWidth * 0.95 },
  () => isFullscreen.value || props.action === "Remove",
);

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
  (visible) => {
    if (visible) {
      form.value = { ...props.form, ...props.data };
      resetDialogGeometry();
    } else {
      isFullscreen.value = false;
      resetDialogGeometry();
    }
  },
);
</script>

<style lang="css" scoped>
.drag-handle {
  cursor: move;
}

.resizable-card.dragging {
  cursor: grabbing;
  user-select: none;
}

.resizable-card.resizing {
  cursor: nwse-resize;
  user-select: none;
}

.resizable-card {
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
  right: 2px;
  bottom: 2px;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  z-index: 2;
  opacity: 0.45;
  transition: opacity 0.15s ease;
  background-image: linear-gradient(
    135deg,
    transparent 0%,
    transparent 65%,
    rgba(var(--v-theme-on-surface), 0.6) 65%,
    rgba(var(--v-theme-on-surface), 0.6) 75%,
    transparent 75%
  );
}

.resize-handle:hover,
.resizable-card.resizing .resize-handle {
  opacity: 0.9;
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

.resizable-card :deep(.v-card-actions) {
  padding-right: 20px;
  padding-bottom: 12px;
}
</style>
