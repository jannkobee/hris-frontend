<template>
  <img
    class="lexisone-logo"
    :class="{ 'lexisone-logo--opaque': !usesTransparentAsset }"
    :src="logo"
    alt=""
    width="40"
    height="40"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "vuetify";
import opaqueLogo from "@/assets/lexisone-logo.png";
import transparentLogo from "@/assets/lexisone-logo-transparent.png";

const props = withDefaults(
  defineProps<{
    surface?: "auto" | "light" | "dark";
  }>(),
  { surface: "auto" },
);
const theme = useTheme();
const usesTransparentAsset = computed(() => {
  if (props.surface === "light") return true;
  if (props.surface === "dark") return false;

  return !theme.global.current.value.dark;
});
const logo = computed(() =>
  usesTransparentAsset.value ? transparentLogo : opaqueLogo,
);
</script>

<style scoped>
.lexisone-logo {
  display: inline-block;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  object-fit: contain;
  vertical-align: middle;
  border-radius: 8px;
}
.lexisone-logo--opaque {
  background: #fff;
}
</style>
