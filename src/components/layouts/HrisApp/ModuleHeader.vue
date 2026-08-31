<template>
  <header class="module-header">
    <div class="module-header__identity">
      <div class="module-header__icon" aria-hidden="true">
        <v-icon :icon="icon" size="25" />
      </div>
      <div class="module-header__copy">
        <span v-if="eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
    </div>

    <div v-if="$slots.actions" class="module-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle: string;
    icon: string;
    eyebrow?: string;
  }>(),
  {
    eyebrow: "Workspace",
  },
);
</script>

<style scoped>
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 128px;
  margin-bottom: 24px;
  padding: 28px 24px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background:
    linear-gradient(
      135deg,
      rgba(var(--v-theme-primary), 0.055),
      transparent 48%
    ),
    rgb(var(--v-theme-surface));
}

.module-header__identity {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
}

.module-header__icon {
  display: grid;
  flex: 0 0 50px;
  width: 50px;
  height: 50px;
  place-items: center;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.13);
}

.module-header__copy {
  min-width: 0;
}

.module-header__copy > span {
  display: block;
  margin-bottom: 5px;
  color: rgb(var(--v-theme-primary));
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  line-height: 1.2;
  text-transform: uppercase;
}

.module-header h1 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.module-header p {
  max-width: 760px;
  margin: 5px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.84rem;
  line-height: 1.5;
}

.module-header__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

@media (max-width: 700px) {
  .module-header {
    align-items: stretch;
    flex-direction: column;
    min-height: 0;
    padding: 20px;
  }

  .module-header__identity {
    align-items: flex-start;
  }

  .module-header__actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>
