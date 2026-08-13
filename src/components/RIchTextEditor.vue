<template>
  <div class="rte" :class="{ 'rte--readonly': readOnly }">
    <div v-if="!readOnly" class="rte-toolbar">
      <v-select
        :model-value="currentBlock"
        :items="blockFormatOptions"
        item-title="label"
        item-value="value"
        density="compact"
        variant="outlined"
        hide-details
        class="rte-block-select"
        @mousedown.prevent="rememberSelection"
        @update:model-value="applyBlockFormat"
      />

      <v-divider vertical class="mx-1" />

      <v-btn
        v-for="btn in toolbarButtons"
        :key="btn.label"
        size="small"
        variant="text"
        density="comfortable"
        :icon="btn.icon"
        :color="btn.isActive?.() ? 'primary' : undefined"
        :title="btn.label"
        @mousedown.prevent="btn.action()"
      />

      <v-divider vertical class="mx-1" />

      <v-btn
        v-for="btn in alignButtons"
        :key="btn.label"
        size="small"
        variant="text"
        density="comfortable"
        :icon="btn.icon"
        :color="btn.isActive?.() ? 'primary' : undefined"
        :title="btn.label"
        @mousedown.prevent="btn.action()"
      />

      <v-divider vertical class="mx-1" />

      <v-menu :close-on-content-click="false" location="bottom start">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            size="small"
            variant="text"
            density="comfortable"
            icon="mdi-format-color-text"
            title="Text color"
            @mousedown.prevent="rememberSelection"
          />
        </template>
        <v-card width="180" class="pa-2">
          <div class="rte-swatches">
            <button
              v-for="color in swatchColors"
              :key="`fore-${color}`"
              type="button"
              class="rte-swatch"
              :style="{ background: color }"
              @mousedown.prevent="applyTextColor(color)"
            />
          </div>
        </v-card>
      </v-menu>

      <v-menu :close-on-content-click="false" location="bottom start">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            size="small"
            variant="text"
            density="comfortable"
            icon="mdi-format-color-highlight"
            title="Highlight color"
            @mousedown.prevent="rememberSelection"
          />
        </template>
        <v-card width="180" class="pa-2">
          <div class="rte-swatches">
            <button
              v-for="color in swatchColors"
              :key="`back-${color}`"
              type="button"
              class="rte-swatch"
              :style="{ background: color }"
              @mousedown.prevent="applyHighlightColor(color)"
            />
            <button
              type="button"
              class="rte-swatch rte-swatch--none"
              title="Remove highlight"
              @mousedown.prevent="applyHighlightColor('transparent')"
            >
              &times;
            </button>
          </div>
        </v-card>
      </v-menu>

      <v-divider vertical class="mx-1" />

      <v-btn
        v-for="btn in extraButtons"
        :key="btn.label"
        size="small"
        variant="text"
        density="comfortable"
        :icon="btn.icon"
        :color="btn.isActive?.() ? 'primary' : undefined"
        :title="btn.label"
        @mousedown.prevent="btn.action()"
      />

      <v-menu
        v-model="imageMenu"
        :close-on-content-click="false"
        location="bottom start"
      >
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            size="small"
            variant="text"
            density="comfortable"
            icon="mdi-image-outline"
            title="Insert image"
            @mousedown.prevent="rememberSelection"
          />
        </template>

        <v-card width="280">
          <v-card-text class="pb-2">
            <v-text-field
              v-model="imageUrl"
              label="Image URL"
              density="compact"
              hide-details
              class="mb-2"
              @keydown.enter="insertImageFromUrl"
            />
            <v-btn
              block
              size="small"
              variant="tonal"
              color="primary"
              :disabled="!imageUrl"
              class="mb-3"
              @click="insertImageFromUrl"
            >
              Insert from URL
            </v-btn>

            <div class="d-flex align-center ga-2 mb-1">
              <v-divider />
              <span class="text-caption text-medium-emphasis">or</span>
              <v-divider />
            </div>

            <v-btn
              block
              size="small"
              variant="outlined"
              prepend-icon="mdi-upload"
              @click="fileInputEl?.click()"
            >
              Upload from device
            </v-btn>
            <div class="text-caption text-medium-emphasis mt-2">
              Uploaded images are embedded directly in the content, keep them
              under 2MB for a snappy save.
            </div>
          </v-card-text>
        </v-card>
      </v-menu>

      <input
        ref="fileInputEl"
        type="file"
        accept="image/*"
        class="rte-file-input"
        @change="onFileSelected"
      />
    </div>

    <div
      ref="editorEl"
      class="rte-content"
      :contenteditable="!readOnly"
      :data-placeholder="placeholder"
      @input="onInput"
      @blur="onInput"
      @keyup="updateActiveState"
      @mouseup="updateActiveState"
    />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";

const props = defineProps({
  modelValue: { type: String, default: "" },
  readOnly: { type: Boolean, default: false },
  placeholder: { type: String, default: "Write something..." },
});

const emit = defineEmits(["update:modelValue"]);

const editorEl = ref<HTMLDivElement>();
const fileInputEl = ref<HTMLInputElement>();
const imageMenu = ref(false);
const imageUrl = ref("");
const activeCommands = ref<Set<string>>(new Set());
let savedRange: Range | null = null;
const { prompt, alert } = useAppDialog();

const rememberSelection = () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0).cloneRange();
  }
};

const restoreSelection = () => {
  editorEl.value?.focus();
  const selection = window.getSelection();
  if (selection && savedRange) {
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }
};

const exec = (command: string, value?: string) => {
  editorEl.value?.focus();
  document.execCommand(command, false, value);
  onInput();
  updateActiveState();
};

const toolbarButtons = [
  {
    label: "Bold",
    icon: "mdi-format-bold",
    action: () => exec("bold"),
    isActive: () => activeCommands.value.has("bold"),
  },
  {
    label: "Italic",
    icon: "mdi-format-italic",
    action: () => exec("italic"),
    isActive: () => activeCommands.value.has("italic"),
  },
  {
    label: "Underline",
    icon: "mdi-format-underline",
    action: () => exec("underline"),
    isActive: () => activeCommands.value.has("underline"),
  },
  {
    label: "Strikethrough",
    icon: "mdi-format-strikethrough",
    action: () => exec("strikeThrough"),
    isActive: () => activeCommands.value.has("strikeThrough"),
  },
  {
    label: "Bullet list",
    icon: "mdi-format-list-bulleted",
    action: () => exec("insertUnorderedList"),
    isActive: () => activeCommands.value.has("insertUnorderedList"),
  },
  {
    label: "Numbered list",
    icon: "mdi-format-list-numbered",
    action: () => exec("insertOrderedList"),
    isActive: () => activeCommands.value.has("insertOrderedList"),
  },
  {
    label: "Decrease indent",
    icon: "mdi-format-indent-decrease",
    action: () => exec("outdent"),
  },
  {
    label: "Increase indent",
    icon: "mdi-format-indent-increase",
    action: () => exec("indent"),
  },
  {
    label: "Quote",
    icon: "mdi-format-quote-close",
    action: () => exec("formatBlock", "blockquote"),
    isActive: () => activeCommands.value.has("blockquote"),
  },
  {
    label: "Link",
    icon: "mdi-link-variant",
    action: async () => {
      const url = await prompt({ title: "Add link", message: "Enter the destination URL.", inputLabel: "URL", initialValue: "https://", confirmText: "Add link" });
      if (!url) return;
      exec("createLink", url);
    },
    isActive: () => activeCommands.value.has("createLink"),
  },
  {
    label: "Remove link",
    icon: "mdi-link-off",
    action: () => exec("unlink"),
  },
  { label: "Undo", icon: "mdi-undo", action: () => exec("undo") },
  { label: "Redo", icon: "mdi-redo", action: () => exec("redo") },
];

const alignButtons = [
  {
    label: "Align left",
    icon: "mdi-format-align-left",
    action: () => exec("justifyLeft"),
    isActive: () => activeCommands.value.has("justifyLeft"),
  },
  {
    label: "Align center",
    icon: "mdi-format-align-center",
    action: () => exec("justifyCenter"),
    isActive: () => activeCommands.value.has("justifyCenter"),
  },
  {
    label: "Align right",
    icon: "mdi-format-align-right",
    action: () => exec("justifyRight"),
    isActive: () => activeCommands.value.has("justifyRight"),
  },
  {
    label: "Justify",
    icon: "mdi-format-align-justify",
    action: () => exec("justifyFull"),
    isActive: () => activeCommands.value.has("justifyFull"),
  },
];

const extraButtons = [
  {
    label: "Subscript",
    icon: "mdi-format-subscript",
    action: () => exec("subscript"),
    isActive: () => activeCommands.value.has("subscript"),
  },
  {
    label: "Superscript",
    icon: "mdi-format-superscript",
    action: () => exec("superscript"),
    isActive: () => activeCommands.value.has("superscript"),
  },
  {
    label: "Code block",
    icon: "mdi-code-tags",
    action: () => exec("formatBlock", "pre"),
    isActive: () => activeCommands.value.has("pre"),
  },
  {
    label: "Horizontal rule",
    icon: "mdi-minus",
    action: () => exec("insertHorizontalRule"),
  },
  {
    label: "Clear formatting",
    icon: "mdi-format-clear",
    action: () => exec("removeFormat"),
  },
];

const blockFormatOptions = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
];

const currentBlock = ref("p");

const applyBlockFormat = (value: string) => {
  restoreSelection();
  exec("formatBlock", value);
  currentBlock.value = value;
};

const swatchColors = [
  "#000000",
  "#5c5c5c",
  "#c0392b",
  "#e67e22",
  "#f1c40f",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#ffffff",
];

const applyTextColor = (color: string) => {
  restoreSelection();
  exec("foreColor", color);
};

const applyHighlightColor = (color: string) => {
  restoreSelection();
  // hiliteColor isn't supported in all browsers (e.g. Safari); backColor
  // is the reliable cross-browser fallback for the same effect.
  if (!document.execCommand("hiliteColor", false, color)) {
    exec("backColor", color);
  } else {
    onInput();
    updateActiveState();
  }
};

const insertImageFromUrl = () => {
  if (!imageUrl.value) return;
  restoreSelection();
  document.execCommand("insertImage", false, imageUrl.value);
  onInput();
  imageUrl.value = "";
  imageMenu.value = false;
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > MAX_IMAGE_BYTES) {
    void alert({ title: "Image is too large", message: "That image is larger than 2MB. Please use a smaller image or an image URL instead.", tone: "warning" });
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    restoreSelection();
    document.execCommand("insertImage", false, reader.result as string);
    onInput();
    imageMenu.value = false;
    input.value = "";
  };
  reader.readAsDataURL(file);
};

const onInput = () => {
  emit("update:modelValue", editorEl.value?.innerHTML ?? "");
};

const updateActiveState = () => {
  const next = new Set<string>();
  [
    "bold",
    "italic",
    "underline",
    "strikeThrough",
    "insertUnorderedList",
    "insertOrderedList",
    "subscript",
    "superscript",
    "justifyLeft",
    "justifyCenter",
    "justifyRight",
    "justifyFull",
  ].forEach((command) => {
    if (document.queryCommandState(command)) next.add(command);
  });

  const block = document.queryCommandValue("formatBlock")?.toLowerCase();
  if (block === "blockquote") next.add("blockquote");
  if (block === "pre") next.add("pre");

  if (block && blockFormatOptions.some((option) => option.value === block)) {
    currentBlock.value = block;
  } else if (!block) {
    currentBlock.value = "p";
  }

  activeCommands.value = next;
};

// Keep the DOM in sync with external changes (e.g. switching Create -> Edit)
// without clobbering the caret position while the user is actively typing.
watch(
  () => props.modelValue,
  (value) => {
    if (editorEl.value && value !== editorEl.value.innerHTML) {
      editorEl.value.innerHTML = value || "";
    }
  },
);

onMounted(() => {
  if (editorEl.value) {
    editorEl.value.innerHTML = props.modelValue || "";
  }
  document.addEventListener("selectionchange", updateActiveState);
});

onBeforeUnmount(() => {
  document.removeEventListener("selectionchange", updateActiveState);
});
</script>

<style lang="css" scoped>
.rte {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
}

.rte-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.rte-file-input {
  display: none;
}

.rte-block-select {
  max-width: 150px;
  min-width: 130px;
}

.rte-block-select :deep(.v-field__input) {
  min-height: 32px;
  padding-top: 2px;
  padding-bottom: 2px;
  font-size: 0.8125rem;
}

.rte-swatches {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.rte-swatch {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  padding: 0;
}

.rte-swatch--none {
  background: repeating-conic-gradient(
      rgb(var(--v-theme-surface-variant)) 0% 25%,
      rgb(var(--v-theme-surface)) 0% 50%
    )
    50% / 10px 10px;
  font-size: 14px;
  line-height: 1;
  color: rgb(var(--v-theme-error));
}

.rte-content {
  padding: 12px 14px;
  min-height: 160px;
  max-height: 420px;
  overflow-y: auto;
  outline: none;
}

.rte-content :deep(blockquote) {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 3px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.rte-content :deep(ul),
.rte-content :deep(ol) {
  padding-left: 24px;
  margin: 4px 0;
}

.rte-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  margin: 8px 0;
}

.rte-content :deep(h1),
.rte-content :deep(h2),
.rte-content :deep(h3),
.rte-content :deep(h4) {
  margin: 12px 0 6px;
  line-height: 1.25;
}

.rte-content :deep(pre) {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 6px;
  padding: 10px 12px;
  overflow-x: auto;
  font-family: "Roboto Mono", monospace;
  font-size: 0.85rem;
  margin: 8px 0;
}

.rte-content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin: 12px 0;
}

.rte--readonly .rte-content {
  min-height: 0;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.rte-content:empty::before {
  content: attr(data-placeholder);
  color: rgba(var(--v-theme-on-surface), 0.4);
  pointer-events: none;
}
</style>
