<template>
  <router-view />
  <AppDialog />

  <v-snackbar
    v-model="snackbar"
    class="api-notification"
    :class="`api-notification--${activeNotification?.type ?? 'info'}`"
    color="surface"
    elevation="12"
    location="top right"
    max-width="460"
    rounded="lg"
    :timeout="activeNotification?.timeout ?? 4500"
    transition="slide-x-reverse-transition"
  >
    <div
      v-if="activeNotification"
      class="api-notification__body"
      :class="`api-notification__body--${activeNotification.type}`"
      :role="activeNotification.type === 'error' ? 'alert' : 'status'"
      :aria-live="activeNotification.type === 'error' ? 'assertive' : 'polite'"
    >
      <div class="api-notification__icon" aria-hidden="true">
        <v-icon :icon="notificationPresentation.icon" size="21" />
      </div>

      <div class="api-notification__copy">
        <div class="api-notification__title">
          {{ activeNotification.title }}
        </div>
        <p class="api-notification__description">
          {{ activeNotification.description }}
        </p>

        <ul
          v-if="activeNotification.details.length"
          class="api-notification__details"
        >
          <li v-for="detail in visibleDetails" :key="detail">
            {{ detail }}
          </li>
          <li v-if="remainingDetailCount > 0" class="api-notification__more">
            +{{ remainingDetailCount }} more issue{{
              remainingDetailCount === 1 ? "" : "s"
            }}
          </li>
        </ul>
      </div>

      <button
        type="button"
        aria-label="Close notification"
        class="api-notification__close"
        @click="dismissNotification"
      >
        <v-icon icon="mdi-close" size="18" />
      </button>

      <span
        :key="activeNotification.id"
        aria-hidden="true"
        class="api-notification__progress"
        :style="{ animationDuration: `${activeNotification.timeout}ms` }"
      />
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useNotification } from "@/composables/useNotification";
import AppDialog from "@/components/AppDialog.vue";

const { activeNotification, snackbar, dismissNotification } = useNotification();

const notificationPresentation = computed(() => {
  const presentations = {
    success: { icon: "mdi-check-circle-outline" },
    error: { icon: "mdi-alert-circle-outline" },
    warning: { icon: "mdi-alert-outline" },
    info: { icon: "mdi-information-outline" },
  };

  return presentations[activeNotification.value?.type ?? "info"];
});

const visibleDetails = computed(
  () => activeNotification.value?.details.slice(0, 4) ?? [],
);
const remainingDetailCount = computed(() =>
  Math.max((activeNotification.value?.details.length ?? 0) - 4, 0),
);
</script>

<style>
:root {
  --app-dialog-radius: 16px;
}

/* Keep every application modal on the same corner system. */
.v-dialog > .v-overlay__content > .v-card,
.v-dialog > .v-overlay__content > .v-sheet,
.v-dialog > .v-overlay__content > form > .v-card,
.v-dialog > .v-overlay__content > form > .v-sheet {
  border-radius: var(--app-dialog-radius) !important;
}

/* Full-screen dialogs should remain flush with the viewport. */
.v-dialog--fullscreen > .v-overlay__content > .v-card,
.v-dialog--fullscreen > .v-overlay__content > .v-sheet,
.v-dialog--fullscreen > .v-overlay__content > form > .v-card,
.v-dialog--fullscreen > .v-overlay__content > form > .v-sheet {
  border-radius: 0 !important;
}

.v-application,
.v-application .v-card,
.v-application .v-sheet,
.v-application .v-navigation-drawer,
.v-application .v-field {
  transition:
    color 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease;
}

.api-notification {
  --api-notification-color: rgb(var(--v-theme-info));
  --api-notification-soft: rgba(var(--v-theme-info), 0.14);
}

.api-notification--success,
.api-notification__body--success {
  --api-notification-color: rgb(var(--v-theme-success));
  --api-notification-soft: rgba(var(--v-theme-success), 0.14);
}

.api-notification--error,
.api-notification__body--error {
  --api-notification-color: rgb(var(--v-theme-error));
  --api-notification-soft: rgba(var(--v-theme-error), 0.14);
}

.api-notification--warning,
.api-notification__body--warning {
  --api-notification-color: rgb(var(--v-theme-warning));
  --api-notification-soft: rgba(var(--v-theme-warning), 0.14);
}

.api-notification .v-snackbar__wrapper {
  min-width: min(440px, calc(100vw - 32px));
  max-width: min(460px, calc(100vw - 32px));
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
  box-shadow:
    0 18px 44px rgba(var(--v-theme-on-surface), 0.16),
    0 4px 12px rgba(var(--v-theme-on-surface), 0.08) !important;
}

.api-notification .v-snackbar__content {
  padding: 0 !important;
}

.api-notification__body {
  position: relative;
  display: flex !important;
  box-sizing: border-box;
  width: 100%;
  gap: 12px;
  align-items: start;
  padding: 15px 48px 16px 15px;
  background: rgb(var(--v-theme-surface));
}

.api-notification__icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 12px;
  color: var(--api-notification-color);
  background: var(--api-notification-soft);
}

.api-notification__copy {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 1px;
}

.api-notification__title {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
}

.api-notification__description {
  margin: 3px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.82rem;
  line-height: 1.45;
}

.api-notification__details {
  display: grid;
  gap: 5px;
  max-height: 142px;
  margin: 10px 0 0;
  padding: 9px 11px 9px 27px;
  overflow-y: auto;
  border-radius: 10px;
  color: rgba(var(--v-theme-on-surface), 0.82);
  background: rgba(var(--v-theme-on-surface), 0.055);
  font-size: 0.78rem;
  line-height: 1.4;
}

.api-notification__more {
  color: var(--api-notification-color);
  font-weight: 650;
}

.api-notification__close {
  position: absolute;
  top: 9px;
  right: 9px;
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: transparent;
  cursor: pointer;
  transition:
    color 150ms ease,
    background-color 150ms ease;
}

.api-notification__close:hover {
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.api-notification__close:focus-visible {
  outline: 2px solid var(--api-notification-color);
  outline-offset: 1px;
}

.api-notification__progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  transform-origin: left center;
  background: var(--api-notification-color);
  animation-name: api-notification-countdown;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes api-notification-countdown {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@media (max-width: 600px) {
  .api-notification .v-snackbar__wrapper {
    min-width: calc(100vw - 24px);
    max-width: calc(100vw - 24px);
    margin: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .api-notification__progress {
    animation: none;
  }
}
</style>
