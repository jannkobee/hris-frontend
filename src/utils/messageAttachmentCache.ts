import axios from "@/plugins/axios";

const previewRequests = new Map<string, Promise<string | null>>();

export const loadMessageAttachmentPreview = (endpoint: string): Promise<string | null> => {
  const cached = previewRequests.get(endpoint);
  if (cached) return cached;

  const request = axios
    .get(endpoint, {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    })
    .then((response) => URL.createObjectURL(response.data))
    .catch(() => null);

  previewRequests.set(endpoint, request);
  return request;
};
