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
        <div>
          <div class="text-h6">{{ props.action }} Permissions</div>
          <div class="text-caption text-medium-emphasis">
            {{ props.data?.name || "Role" }} • {{ selectedCount }} selected
          </div>
        </div>
        <v-spacer />
        <div class="d-flex align-center ga-2">
          <v-chip color="primary" variant="flat" rounded>
            {{ selectedCount }} selected
          </v-chip>
          <v-btn
            v-if="props.action !== 'Remove'"
            :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            variant="text"
            size="small"
            density="comfortable"
            :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            @click="isFullscreen = !isFullscreen"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            density="comfortable"
            @click="$emit('close')"
          />
        </div>
      </v-card-title>

      <v-card-text>
        <template v-if="props.action === 'Remove'">
          <div class="pa-4 text-body-1">
            Are you sure you want to remove these permissions?
          </div>
        </template>
        <template v-else>
          <div style="flex: 0 0 auto">
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              Choose what this role can do across the system. Each permission is
              grouped by module and explained in plain language.
            </v-alert>

            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search permissions"
              clearable
              density="compact"
              hide-details
              class="mb-4"
            />
          </div>

          <v-progress-linear
            v-if="loadingPermissions"
            indeterminate
            class="mb-4"
            style="flex: 0 0 auto"
          />

          <v-row v-else class="permission-shell">
            <v-col cols="12" sm="4" md="3" class="module-nav">
              <v-list nav density="comfortable" class="pa-0">
                <v-list-item
                  v-for="(group, model) in filteredGroupedPermissions"
                  :key="model"
                  :active="activeModule === model"
                  :title="formatModuleName(model)"
                  rounded="lg"
                  class="mb-2 py-2"
                  @click="activeModule = model"
                >
                  <template #append>
                    <v-chip
                      size="small"
                      class="ml-3"
                      :color="selectedGroupCount(group) ? 'primary' : undefined"
                      :variant="selectedGroupCount(group) ? 'flat' : 'tonal'"
                    >
                      {{ selectedGroupCount(group) }}/{{ group.length }}
                    </v-chip>
                  </template>
                </v-list-item>

                <v-list-item
                  v-if="!Object.keys(filteredGroupedPermissions).length"
                >
                  <v-list-item-title class="text-medium-emphasis">
                    No modules match your search
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" sm="8" md="9" class="module-content">
              <template v-if="activeGroup">
                <div class="d-flex align-center justify-space-between mb-4">
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ formatModuleName(activeModule) }}
                  </div>
                  <div class="d-flex ga-2">
                    <v-btn
                      size="small"
                      variant="tonal"
                      :disabled="props.readOnly"
                      @click="selectAllGroup(activeGroup)"
                    >
                      Select all
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="text"
                      :disabled="props.readOnly"
                      @click="clearGroup(activeGroup)"
                    >
                      Clear
                    </v-btn>
                  </div>
                </div>

                <v-row>
                  <v-col
                    v-for="permission in activeGroup"
                    :key="permission.id"
                    cols="12"
                    sm="6"
                    class="py-2"
                  >
                    <v-checkbox
                      v-model="permissions"
                      :value="permission.id"
                      :readonly="props.readOnly"
                      hide-details
                      density="comfortable"
                    >
                      <template #label>
                        <div class="d-flex flex-column py-1">
                          <span class="font-weight-medium">
                            {{ formatPermissionLabel(permission) }}
                          </span>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatPermissionDescription(permission) }}
                          </span>
                        </div>
                      </template>
                    </v-checkbox>
                  </v-col>
                </v-row>
              </template>

              <div v-else class="text-medium-emphasis pa-4 text-center">
                Select a module on the left to view its permissions
              </div>
            </v-col>
          </v-row>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('close')">Close</v-btn>
        <v-btn
          v-if="props.action === 'Remove' && !props.readOnly"
          prepend-icon="mdi-delete"
          color="error"
          :loading="loading"
          @click="execute"
        >
          Remove Permissions
        </v-btn>
        <v-btn
          v-else-if="!props.readOnly"
          prepend-icon="mdi-content-save"
          color="primary"
          :loading="loading"
          @click="execute"
        >
          Save Permissions
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
import { ref, computed, onMounted, watch } from "vue";
import { useApi } from "@/composables/useApi";
import { Permission } from "@/types/types";
import type { PropType } from "vue";
import axios from "@/plugins/axios";
import { useDraggable } from "@/composables/useDraggable";
import { useResizable } from "@/composables/useResizable";

const props = defineProps({
  action: { type: String, default: "" },
  readOnly: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  data: {
    type: Object as PropType<{
      id: string;
      name: string;
      permissions: Permission[];
    }>,
    default: () => ({
      name: "",
      permissions: [],
    }),
  },
});

const { index, items } = useApi<Permission>("/permissions");

const loading = ref(false);
const loadingPermissions = ref(false);
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
  { minWidth: 320, minHeight: 420, maxWidth: window.innerWidth * 0.95 },
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

const emit = defineEmits(["close"]);

const permissions = ref<any>([]);
const search = ref("");
const activeModule = ref<string>("");

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};
  for (const permission of items.value) {
    if (!groups[permission.model]) {
      groups[permission.model] = [];
    }
    groups[permission.model].push(permission);
  }
  return groups;
});

const filteredGroupedPermissions = computed(() => {
  const normalizedSearch = search.value.trim().toLowerCase();

  return Object.entries(groupedPermissions.value).reduce(
    (acc, [model, group]) => {
      const filteredGroup = group.filter((permission) => {
        if (!normalizedSearch) {
          return true;
        }

        const haystack = `${permission.name} ${permission.model}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });

      if (filteredGroup.length) {
        acc[model] = filteredGroup;
      }

      return acc;
    },
    {} as Record<string, Permission[]>,
  );
});

const activeGroup = computed(() => {
  return filteredGroupedPermissions.value[activeModule.value] ?? null;
});

const selectedCount = computed(() => permissions.value.length);

const formatModuleName = (model: string): string => {
  const className = model.split("\\").pop() || model;

  return className
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
};

const formatPermissionLabel = (permission: Permission): string => {
  const fromName = permission.name?.trim();
  if (fromName) {
    return fromName
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    permission.slug
      ?.replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Permission"
  );
};

const formatPermissionDescription = (permission: Permission): string => {
  const slug = permission.slug?.trim();

  if (!slug) {
    return "Controls access to this feature";
  }

  const [action, ...resourceParts] = slug.split(/[-_]/g);
  const resource = resourceParts.join(" ");

  if (!resource) {
    return `Allows this role to ${action.replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    )}`;
  }

  const actionLabel = action
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  const resourceLabel = resource
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/([a-z])([A-Z])/g, "$1 $2");

  return `${actionLabel} ${resourceLabel}`;
};

const fillPermissions = () => {
  permissions.value = Array.isArray(props.data?.permissions)
    ? props.data.permissions.map((p) => p.id)
    : [];
};

const selectedGroupCount = (group: Permission[]) => {
  return group.filter((permission) => permissions.value.includes(permission.id))
    .length;
};

const selectAllGroup = (group: Permission[]) => {
  const ids = group.map((permission) => permission.id);
  permissions.value = Array.from(new Set([...permissions.value, ...ids]));
};

const clearGroup = (group: Permission[]) => {
  const ids = new Set(group.map((permission) => permission.id));
  permissions.value = permissions.value.filter((id: string) => !ids.has(id));
};

const execute = async () => {
  const data = {
    permissions: permissions.value,
  };

  loading.value = true;

  try {
    await axios.put(`/role-permissions/${props.data.id}`, data);
    emit("close");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  loadingPermissions.value = true;

  try {
    await index({ all: true } as any);
  } finally {
    loadingPermissions.value = false;
  }
});

watch(
  () => props.data,
  () => {
    fillPermissions();
  },
);

watch(isFullscreen, (value) => {
  if (!value) resetDialogGeometry();
});

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      fillPermissions();
      resetDialogGeometry();
    } else {
      isFullscreen.value = false;
      resetDialogGeometry();
    }
  },
);

watch(
  filteredGroupedPermissions,
  (groups) => {
    const modelKeys = Object.keys(groups);
    if (!modelKeys.includes(activeModule.value)) {
      activeModule.value = modelKeys[0] ?? "";
    }
  },
  { immediate: true },
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
  min-height: 420px;
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

.resizable-card :deep(.v-card-actions) {
  padding-right: 20px;
  padding-bottom: 12px;
}

.resizable-card.is-fullscreen {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0;
  min-height: 0;
}

.resizable-card .v-card-text {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.permission-shell {
  flex: 1 1 auto;
  min-height: 240px;
}

.module-nav {
  overflow-y: auto;
  min-height: 0;
}

.module-content {
  overflow-y: auto;
  min-height: 0;
}

@media (min-width: 600px) {
  .module-content {
    border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
}

@media (max-width: 599.98px) {
  .module-nav {
    max-height: 240px;
    margin-bottom: 16px;
  }
}
</style>
