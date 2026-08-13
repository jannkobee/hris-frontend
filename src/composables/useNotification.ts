import { computed, ref } from "vue";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  details?: string[];
  timeout?: number;
}

export interface Notification {
  id: number;
  title: string;
  description: string;
  type: NotificationType;
  details: string[];
  timeout: number;
}

const activeNotification = ref<Notification | null>(null);
const notificationQueue = ref<Notification[]>([]);
let notificationId = 0;
let nextNotificationTimer: number | undefined;

const defaultTimeouts: Record<NotificationType, number> = {
  success: 3500,
  info: 4500,
  warning: 5500,
  error: 6500,
};

const showNextNotification = () => {
  if (!activeNotification.value && notificationQueue.value.length > 0) {
    activeNotification.value = notificationQueue.value.shift() ?? null;
  }
};

const dismissNotification = () => {
  activeNotification.value = null;

  window.clearTimeout(nextNotificationTimer);
  nextNotificationTimer = window.setTimeout(showNextNotification, 160);
};

const snackbar = computed({
  get: () => activeNotification.value !== null,
  set: (value: boolean) => {
    if (!value) dismissNotification();
  },
});

const title = computed(() => activeNotification.value?.title ?? "");
const description = computed(
  () => activeNotification.value?.description ?? "",
);
const color = computed(() => activeNotification.value?.type ?? "info");

function showNotification(
  newTitle: string,
  newDescription: string,
  type: NotificationType = "success",
  options: NotificationOptions = {},
) {
  const description = newDescription?.trim() || "The request was completed.";
  const details = [...new Set(options.details?.filter(Boolean) ?? [])].filter(
    (detail) => detail !== description,
  );

  const notification: Notification = {
    id: ++notificationId,
    title: newTitle?.trim() || "Notification",
    description,
    type,
    details,
    timeout: options.timeout ?? defaultTimeouts[type],
  };

  const pendingNotifications = [
    activeNotification.value,
    ...notificationQueue.value,
  ];
  const isDuplicate = pendingNotifications.some(
    (item) =>
      item?.title === notification.title &&
      item.description === notification.description &&
      item.type === notification.type,
  );

  if (isDuplicate) return;

  if (activeNotification.value) {
    notificationQueue.value.push(notification);
  } else {
    window.clearTimeout(nextNotificationTimer);
    activeNotification.value = notification;
  }
}

export function useNotification() {
  return {
    activeNotification,
    snackbar,
    title,
    description,
    color,
    showNotification,
    dismissNotification,
  };
}
