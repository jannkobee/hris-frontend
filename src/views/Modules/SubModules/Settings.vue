<template>
  <v-row justify="center">
    <v-col cols="12" lg="10" xl="8">
      <v-card class="modern-settings-card" rounded="xl" variant="elevated">
        <v-card-item class="pb-2">
          <div
            class="d-flex align-center justify-space-between flex-wrap gap-3"
          >
            <div>
              <div class="text-h5 font-weight-bold">App Settings</div>
              <p class="text-body-2 text-medium-emphasis mb-0">
                Personalize the application experience.
              </p>
            </div>
            <v-chip color="primary" variant="flat">Configurations</v-chip>
          </div>
        </v-card-item>

        <v-card-text>
          <v-sheet
            rounded="lg"
            class="pa-4 mb-4"
            color="surface-variant"
            variant="tonal"
          >
            <div class="d-flex align-center gap-3">
              <v-avatar color="primary" size="44">
                <v-icon icon="mdi-palette-outline" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-medium">Theme</div>
                <div class="text-body-2 text-medium-emphasis">
                  Choose the visual appearance for the app.
                </div>
              </div>
            </div>
          </v-sheet>

          <v-select
            v-model="theme"
            label="Application Theme"
            :items="themeOptions"
            variant="outlined"
            prepend-inner-icon="mdi-theme-light-dark"
          />

          <div class="d-flex justify-end mt-6">
            <v-btn
              color="primary"
              size="large"
              @click="saveTheme"
              :loading="saving"
            >
              Save Changes
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useTheme } from "vuetify";
import { useAuth } from "@/composables/useAuth";

const theme = ref("light");
const themeOptions = ["light", "dark"];
const saving = ref(false);
const vuetifyTheme = useTheme();
const { getSettings, updateSettings } = useAuth();

const applyTheme = (themeName: string) => {
  vuetifyTheme.global.name.value = themeName;
  localStorage.setItem("APP_THEME", themeName);
};

const saveTheme = async () => {
  saving.value = true;
  try {
    applyTheme(theme.value);
    await updateSettings({ theme: theme.value });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  const savedSettings = await getSettings();
  const savedTheme =
    savedSettings?.theme || localStorage.getItem("APP_THEME") || "light";
  theme.value = savedTheme;
  applyTheme(savedTheme);
});
</script>

<style scoped>
.modern-settings-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
}
</style>
