import axios from "@/plugins/axios";

const photoRequests = new Map<string, Promise<string | null>>();

export const loadUserPhoto = (endpoint: string): Promise<string | null> => {
  const cached = photoRequests.get(endpoint);
  if (cached) return cached;

  const request = axios
    .get(endpoint, {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    })
    .then((response) => URL.createObjectURL(response.data))
    .catch(() => null);

  photoRequests.set(endpoint, request);
  return request;
};
