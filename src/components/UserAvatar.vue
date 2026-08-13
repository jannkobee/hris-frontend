<template>
  <v-avatar
    class="user-avatar"
    :class="{ 'user-avatar--photo': Boolean(photoUrl) }"
    :size="size"
    :color="color"
    :variant="variant"
  >
    <v-img v-if="photoUrl" :src="photoUrl" :alt="`${displayName} profile photo`" cover />
    <span v-else class="user-avatar__initials">{{ initials }}</span>
  </v-avatar>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref, watch } from "vue";
import { userDisplayName, userInitials } from "@/utils/userDisplay";
import { loadUserPhoto } from "@/utils/userPhotoCache";

type AvatarVariant = "flat" | "text" | "elevated" | "tonal" | "outlined" | "plain";

const props = defineProps({
  user: { type: Object as PropType<Record<string, any> | null>, default: null },
  name: { type: String, default: "Teammate" },
  size: { type: [Number, String], default: 40 },
  color: { type: String, default: "primary" },
  variant: { type: String as PropType<AvatarVariant>, default: "tonal" },
});

const photoUrl = ref<string | null>(null);
let loadSequence = 0;

const displayName = computed(() => userDisplayName(props.user, props.name));
const initials = computed(() => userInitials(props.user, props.name));
const endpoint = computed(() => props.user?.profile_photo_url || null);

watch(
  endpoint,
  async (url) => {
    const sequence = ++loadSequence;
    photoUrl.value = null;
    if (!url) return;

    const loadedUrl = await loadUserPhoto(url);
    if (sequence === loadSequence) photoUrl.value = loadedUrl;
  },
  { immediate: true },
);
</script>

<style scoped>
.user-avatar {
  flex: 0 0 auto;
  font-weight: 750;
  letter-spacing: 0.015em;
}

.user-avatar--photo {
  background: rgb(var(--v-theme-surface-variant));
}

.user-avatar__initials {
  font-size: 0.78em;
}
</style>
