import axios from "axios";
import { useNotification } from "@/composables/useNotification";
import router from "@/router";

const { showNotification } = useNotification();

const successNotification = (title: string, description: string) => {
  showNotification(title, description, "success");
};

const getSuccessTitle = (message: unknown): string => {
  if (typeof message !== "string") return "Request completed";

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("updated") || normalizedMessage.includes("saved")) {
    return "Changes saved";
  }
  if (normalizedMessage.includes("created") || normalizedMessage.includes("added")) {
    return "Created successfully";
  }
  if (normalizedMessage.includes("deleted") || normalizedMessage.includes("removed")) {
    return "Removed successfully";
  }
  if (normalizedMessage.includes("sent")) return "Sent successfully";

  return "Request completed";
};

const errorNotification = (
  title: string,
  description: string,
  details: string[] = [],
) => {
  showNotification(title, description, "error", {
    details,
    timeout: details.length > 0 ? 8000 : undefined,
  });
};

const getValidationMessages = (errors: unknown): string[] => {
  if (!errors || typeof errors !== "object") return [];

  return [
    ...new Set(
      Object.values(errors)
        .flatMap((messages) =>
          Array.isArray(messages) ? messages : [messages],
        )
        .filter((message): message is string => typeof message === "string")
        .map((message) => message.trim())
        .filter(Boolean),
    ),
  ];
};

const successAlertsEnabled = () => {
  try {
    const settings = JSON.parse(
      localStorage.getItem("HRIS_APP_SETTINGS") ?? "{}",
    );
    return settings["notifications.success_alerts_enabled"] !== false;
  } catch {
    return true;
  }
};

const api = "http://localhost:8000/backend/api/v1";
// const api = "http://13.251.88.87:6083/core/api/v1"

axios.defaults.baseURL = api;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.withXSRFToken = true;

const axiosRequest = axios.create({
  baseURL: api,
  withCredentials: true,
  headers: {
    Authorization: `Bearer ${window.localStorage.getItem("APP_TOKEN")}`,
    Accept: "application/json",
  },
});

axiosRequest.interceptors.response.use(
  (res) => {
    const { status, data, request, config } = res;

    const isLogout = request.responseURL.endsWith("/logout");
    const isDelete = config.method === "delete";
    const isEmailSent = data.message === "Email Sent";

    const suppressSuccessNotification =
      config.headers?.get?.("X-Suppress-Success-Notification") === "true" ||
      config.headers?.["X-Suppress-Success-Notification"] === "true";

    if (
      successAlertsEnabled() &&
      !suppressSuccessNotification &&
      (status === 201 ||
        (status === 200 && (isLogout || isDelete || isEmailSent)) ||
      status === 202)
    ) {
      successNotification(
        getSuccessTitle(data.message),
        data.message || "Your changes were saved successfully.",
      );
    }

    return res;
  },
  (error) => {
    if (!error.response) {
      errorNotification(
        "Network Error",
        "Cannot reach the server. Please check your internet connection.",
      );
      router.push({ name: "network-error", params: { type: "1" } });

      return Promise.reject(error);
    }

    const { status, data } = error.response;

    const message =
      typeof data?.message === "string" && data.message.trim()
        ? data.message
        : "Something went wrong. Please try again.";

    if (status === 422) {
      const validationMessages = getValidationMessages(data?.errors);

      errorNotification(
        "Check your input",
        validationMessages.length > 0
          ? "Some information needs your attention."
          : message,
        validationMessages,
      );
    } else if (status === 401) {
      errorNotification(
        "Session expired",
        "Please sign in again to continue.",
      );
      window.localStorage.removeItem("APP_TOKEN");
      router.push("/login");
    } else if (status === 403) {
      errorNotification(
        "Permission denied",
        message || "You do not have permission to perform this action.",
      );
    } else if (status === 404) {
      errorNotification("Not found", message);
    } else if (status === 409) {
      errorNotification("Unable to complete request", message);
    } else if (status === 419) {
      errorNotification(
        "Session expired",
        "Refresh the page and try your request again.",
      );
    } else if (status === 429) {
      errorNotification(
        "Too many requests",
        "Please wait a moment before trying again.",
      );
    } else if (status >= 500) {
      errorNotification(
        "Server error",
        "The server could not complete your request. Please try again shortly.",
      );
    } else {
      errorNotification("Request failed", message);
    }

    return Promise.reject(error);
  },
);

// Let the browser generate the multipart boundary for FormData uploads. The
// app-wide JSON default is correct for normal API calls but prevents Laravel
// from receiving uploaded files when it is retained on this request.
axiosRequest.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.setContentType(false);
  }

  return config;
});

export default axiosRequest;
