<template>
  <div class="message-attachment" :class="{ 'message-attachment--image': attachment.is_image }">
    <button
      v-if="attachment.is_image"
      type="button"
      class="message-attachment__image"
      :aria-label="`Preview ${attachment.original_name}`"
      :disabled="!previewUrl"
      @click="openPreview"
    >
      <v-img v-if="previewUrl" :src="previewUrl" :alt="attachment.original_name" cover />
      <v-skeleton-loader v-else type="image" />
      <span class="message-attachment__image-label">{{ attachment.original_name }}</span>
    </button>

    <button v-else type="button" class="message-attachment__file" @click="download">
      <span class="message-attachment__file-icon">
        <v-icon :icon="fileIcon" size="23" />
      </span>
      <span class="message-attachment__copy">
        <strong>{{ attachment.original_name }}</strong>
        <small>{{ fileType }} · {{ formatFileSize(attachment.size) }}</small>
      </span>
      <v-progress-circular v-if="downloading" indeterminate size="20" width="2" />
      <v-icon v-else icon="mdi-download-outline" size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import { loadMessageAttachmentPreview } from "@/utils/messageAttachmentCache";

const props = defineProps<{ attachment: Record<string, any> }>();
const emit = defineEmits<{
  (event: "preview", value: { url: string; name: string; downloadUrl: string }): void;
}>();

const previewUrl = ref<string | null>(null);
const downloading = ref(false);

const extension = computed(() =>
  String(props.attachment.original_name ?? "").split(".").pop()?.toLowerCase() ?? "",
);

const fileType = computed(() => extension.value.toUpperCase() || "FILE");

const fileIcon = computed(() => {
  if (extension.value === "pdf") return "mdi-file-pdf-box";
  if (["doc", "docx"].includes(extension.value)) return "mdi-file-word-outline";
  if (["xls", "xlsx", "csv"].includes(extension.value)) return "mdi-file-excel-outline";
  if (["ppt", "pptx"].includes(extension.value)) return "mdi-file-powerpoint-outline";
  if (["zip", "rar", "7z"].includes(extension.value)) return "mdi-folder-zip-outline";
  if (["mp3", "wav", "m4a"].includes(extension.value)) return "mdi-file-music-outline";
  if (["mp4", "mov", "webm"].includes(extension.value)) return "mdi-file-video-outline";
  return "mdi-file-document-outline";
});

const formatFileSize = (bytes: number): string => {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const openPreview = () => {
  if (!previewUrl.value) return;
  emit("preview", {
    url: previewUrl.value,
    name: props.attachment.original_name,
    downloadUrl: props.attachment.download_url,
  });
};

const download = async () => {
  if (downloading.value) return;
  downloading.value = true;

  try {
    const response = await axios.get(props.attachment.download_url, {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = props.attachment.original_name || "attachment";
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    downloading.value = false;
  }
};

onMounted(async () => {
  if (props.attachment.is_image && props.attachment.preview_url) {
    previewUrl.value = await loadMessageAttachmentPreview(props.attachment.preview_url);
  }
});
</script>

<style scoped>
.message-attachment {
  min-width: 0;
}

.message-attachment__image,
.message-attachment__file {
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.message-attachment__image {
  position: relative;
  display: block;
  width: min(280px, 58vw);
  height: 180px;
  overflow: hidden;
  border-radius: 15px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.message-attachment__image :deep(.v-img),
.message-attachment__image :deep(.v-skeleton-loader) {
  width: 100%;
  height: 100%;
}

.message-attachment__image-label {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 22px 10px 8px;
  overflow: hidden;
  color: white;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  font-size: 0.68rem;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-attachment__file {
  display: grid;
  width: min(320px, 68vw);
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 13px;
  background: rgb(var(--v-theme-surface));
  text-align: left;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.message-attachment__file:hover {
  border-color: rgba(var(--v-theme-primary), 0.38);
  background: rgba(var(--v-theme-primary), 0.045);
}

.message-attachment__file-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
}

.message-attachment__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.message-attachment__copy strong {
  overflow: hidden;
  font-size: 0.74rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-attachment__copy small {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 0.61rem;
}
</style>
