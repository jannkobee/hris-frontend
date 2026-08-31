<template>
  <v-container fluid
    ><ModuleHeader
      eyebrow="Activity center"
      title="Notifications"
      subtitle="Updates from your HR workflows."
      icon="mdi-bell-outline"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="load"
          >Refresh</v-btn
        >
      </template>
    </ModuleHeader>
    <v-card
      ><v-list lines="two"
        ><v-list-item
          v-for="item in items"
          :key="item.id"
          :class="{ unread: !item.read_at }"
          :prepend-icon="icon(item.type)"
          @click="open(item)"
          ><v-list-item-title>{{ item.title }}</v-list-item-title
          ><v-list-item-subtitle
            >{{ item.body }} · {{ date(item.created_at) }}</v-list-item-subtitle
          ><template #append
            ><v-chip v-if="!item.read_at" size="x-small" color="primary"
              >New</v-chip
            ></template
          ></v-list-item
        ><v-list-item
          v-if="!items.length"
          title="You are all caught up"
          subtitle="No notifications yet." /></v-list></v-card
  ></v-container>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "@/plugins/axios";
const router = useRouter();
const items = ref<any[]>([]);
const load = async () => {
  const r = await axios.get("/notifications", { params: { limit: 50 } });
  items.value = r.data.data?.data ?? [];
};
const date = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const icon = (type: string) =>
  type.includes("attendance") ? "mdi-clock-edit-outline" : "mdi-bell-outline";
const open = async (item: any) => {
  if (!item.read_at) await axios.patch(`/notifications/${item.id}/read`);
  if (item.type.includes("attendance_correction"))
    await router.push({ name: "attendance-management" });
  await load();
};
onMounted(load);
</script>
<style scoped>
.unread {
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
