import axios from "@/plugins/axios";

const storageKey = "HRIS_PLATFORM_SESSION_KEY";

export const platformKey = () => window.sessionStorage.getItem(storageKey) ?? "";
export const platformHeaders = () => ({
  "X-Platform-Provisioning-Key": platformKey(),
  "X-Suppress-Success-Notification": "true",
});
export const hasPlatformSession = () => !!platformKey();
export const clearPlatformSession = () => window.sessionStorage.removeItem(storageKey);

export async function establishPlatformSession(key: string) {
  await axios.get("/platform/session", {
    headers: {
      "X-Platform-Provisioning-Key": key,
      "X-Suppress-Success-Notification": "true",
    },
  });
  window.sessionStorage.setItem(storageKey, key);
}
