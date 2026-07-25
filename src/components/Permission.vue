<template>
  <v-dialog v-model="props.visible" max-width="1000" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <div class="text-h6">{{ props.action }} Permissions</div>
          <div class="text-caption text-medium-emphasis">
            {{ props.data?.name || "Role" }} • {{ selectedCount }} selected
          </div>
        </div>
        <v-chip color="primary" variant="flat" rounded>
          {{ selectedCount }} selected
        </v-chip>
      </v-card-title>

      <v-card-text>
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

        <v-progress-linear
          v-if="loadingPermissions"
          indeterminate
          class="mb-4"
        />

        <v-row v-else no-gutters class="permission-shell">
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

          <v-divider vertical class="d-none d-sm-flex mx-2" />

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
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('close')">Close</v-btn>
        <v-btn
          v-if="!props.readOnly"
          prepend-icon="mdi-content-save"
          color="primary"
          :loading="loading"
          @click="execute"
        >
          Save Permissions
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { useApi } from "@/composables/useApi";
import { Permission } from "@/types/types";
import type { PropType } from "vue";
import axios from "@/plugins/axios";

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

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      fillPermissions();
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
.permission-shell {
  min-height: 420px;
  max-height: 60vh;
}

.module-nav {
  overflow-y: auto;
  max-height: 60vh;
  padding-right: 16px;
}

.module-content {
  overflow-y: auto;
  max-height: 60vh;
  padding-left: 24px;
}

@media (max-width: 600px) {
  .module-nav {
    max-height: 240px;
    padding-right: 0;
    margin-bottom: 16px;
  }

  .module-content {
    padding-left: 0;
  }
}
</style>
