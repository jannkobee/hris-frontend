import axios from "@/plugins/axios";

const previewRequests = new Map<string, Promise<string | null>>();

export const loadMessageAttachmentPreview = (
  endpoint: string,
  fallbackEndpoint?: string,
): Promise<string | null> => {
  const cacheKey = `${endpoint}|${fallbackEndpoint ?? ""}`;
  const cached = previewRequests.get(cacheKey);
  if (cached) return cached;

  const fetchBlob = (url: string) =>
    axios.get<Blob>(url, {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    });

  const request = fetchBlob(endpoint)
    .catch((error) => {
      if (!fallbackEndpoint || fallbackEndpoint === endpoint) throw error;
      return fetchBlob(fallbackEndpoint);
    })
    .then((response) => URL.createObjectURL(response.data))
    .catch(() => {
      previewRequests.delete(cacheKey);
      return null;
    });

  previewRequests.set(cacheKey, request);
  return request;
};
