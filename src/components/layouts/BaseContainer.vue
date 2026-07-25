<template>
  <v-dialog v-model="showConfirm" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Confirm Logout</v-card-title>
      <v-card-text>Do you really want to log out of your account?</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" @click="showConfirm = false">Cancel</v-btn>
        <v-btn prepend-icon="mdi-logout" color="red" @click="logout">
          Logout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-layout>
    <v-navigation-drawer :rail="rail" permanent @click="rail = false">
      <v-list>
        <v-skeleton-loader :loading="loading" type="avatar, list-item-two-line">
          <v-list-item
            prepend-avatar="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
            :title="`
              ${authUser?.first_name}
              ${authUser?.middle_name ? ' ' + authUser?.middle_name : ''}
              ${authUser?.last_name ? ' ' + authUser?.last_name : ''}
            `"
            :subtitle="authUser?.email"
          >
            <template #prepend>
              <v-avatar color="surface-variant" class="text-on-surface">
                <span class="text-h6">{{ authUser?.initials }}</span>
              </v-avatar>
            </template>
            <template #append>
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                @click.stop="rail = !rail"
              />
            </template>
          </v-list-item>
        </v-skeleton-loader>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          @click="$router.push({ name: 'dashboard' })"
        />

        <v-list-item
          v-if="checkPermissions('view-users')"
          prepend-icon="mdi-account-cog-outline"
          title="User Management"
          value="user-management"
          @click="$router.push({ name: 'user-management' })"
        />

        <v-list-item
          v-if="checkPermissions('view-roles')"
          prepend-icon="mdi-head-cog-outline"
          title="Role Management"
          value="role-management"
          @click="$router.push({ name: 'role-management' })"
        />

        <v-list-item
          v-if="checkPermissions('view-employees')"
          prepend-icon="mdi-account-group-outline"
          title="Employee Management"
          value="employee-management"
          @click="$router.push({ name: 'employee-management' })"
        />

        <v-list-item
          v-if="checkPermissions('view-attendances')"
          prepend-icon="mdi-calendar-clock"
          title="Attendance Management"
          value="attendance-management"
          @click="$router.push({ name: 'attendance-management' })"
        />

        <v-list-item
          v-if="checkPermissions('view-leave-requests')"
          prepend-icon="mdi-calendar-account"
          title="Leave Management"
          value="leave-management"
          @click="$router.push({ name: 'leave-management' })"
        />

        <v-list-item
          v-if="checkPermissions('view-announcements')"
          prepend-icon="mdi-bullhorn-outline"
          title="Announcements"
          value="announcements"
          @click="$router.push({ name: 'announcement-management' })"
        />

        <v-list-group
          v-if="
            checkPermissions('view-employment-statuses') ||
            checkPermissions('view-positions') ||
            checkPermissions('view-departments') ||
            checkPermissions('view-leave-types')
          "
          value="configuration"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-cog-outline"
              title="Configurations"
            />
          </template>

          <v-list-item
            v-if="checkPermissions('view-employment-statuses')"
            prepend-icon="mdi-list-status"
            title="Employment Statuses"
            value="employment-statuses"
            @click="$router.push({ name: 'employment-status-management' })"
          />

          <v-list-item
            v-if="checkPermissions('view-positions')"
            prepend-icon="mdi-briefcase-outline"
            title="Positions"
            value="positions"
            @click="$router.push({ name: 'position-management' })"
          />

          <v-list-item
            v-if="checkPermissions('view-departments')"
            prepend-icon="mdi-domain"
            title="Departments"
            value="departments"
            @click="$router.push({ name: 'department-management' })"
          />

          <v-list-item
            v-if="checkPermissions('view-leave-types')"
            prepend-icon="mdi-calendar-badge"
            title="Leave Types"
            value="leave-types"
            @click="$router.push({ name: 'leave-type-management' })"
          />

          <v-list-item
            prepend-icon="mdi-cog-box"
            title="App Settings"
            value="theme-settings"
            @click="$router.push({ name: 'theme-settings' })"
          />

          <v-list-item
            v-if="checkPermissions('view-employee-number-settings')"
            prepend-icon="mdi-badge-account-horizontal-outline"
            title="Employee Number Settings"
            value="employee-number-settings"
            @click="$router.push({ name: 'employee-number-settings' })"
          />
        </v-list-group>
      </v-list>

      <v-divider></v-divider>

      <template v-slot:append>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            value="logout"
            @click="showConfirm = true"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <div style="padding: 20px">
        <router-view />
      </div>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import { useAuth } from "@/composables/useAuth";

const rail = ref(false);

const showConfirm = ref(false);

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const applyTheme = (themeName: string) => {
  theme.global.name.value = themeName;
  localStorage.setItem("APP_THEME", themeName);
};

const { loading, getUser, getSettings, authUser, logout } = useAuth();

const checkPermissions = (permission: string): boolean => {
  if (!authUser.value?.role?.permissions) {
    return false;
  }

  const value = authUser.value.role.permissions.some(
    (perm: { slug: string }) => perm.slug === permission,
  );

  console.log("Checking permissions for:", permission, "→", value);
  return value;
};

onMounted(async () => {
  await getUser();

  const savedSettings = await getSettings();
  const savedTheme =
    savedSettings?.theme || localStorage.getItem("APP_THEME") || "light";

  applyTheme(savedTheme);
});
</script>

<style lang="css" scoped>
:deep(.v-list-group__items) {
  padding-left: 0 !important;
}

:deep(.v-list-group--sub .v-list-item) {
  padding-inline-start: 12px !important;
}

:deep(.v-list-item--nav) {
  padding-inline-start: 12px !important;
}
</style>
