import axios from "axios";
import { useNotification } from "@/composables/useNotification";
import router from "@/router";

const { showNotification } = useNotification();

const successNotification = (title: string, description: string) => {
  showNotification(title, description, "success");
};

const errorNotification = (title: string, description: string) => {
  showNotification(title, description, "error");
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

    if (successAlertsEnabled() && !suppressSuccessNotification && (status === 201 || (status === 200 && (isLogout || isDelete || isEmailSent)) || status === 202)) {
      successNotification("Success", data.message);
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

    const { status, data, request } = error.response;

    if (status === 500) {
      errorNotification(
        "Network Error",
        "Unable to connect to the server. Please check your internet connection.",
      );
      router.push({ name: "network-error", params: { type: "2" } });
    } else if (status === 422) {
      errorNotification("Validation Error", data.message);
    } else if (status === 419 && !request.responseURL.endsWith("/auth-user")) {
      errorNotification("Error", "Server Error");
    } else if (status === 401 && request.responseURL.endsWith("/auth-user")) {
      errorNotification("Error", "Authentication Error. Please login again.");
      window.localStorage.removeItem("APP_TOKEN");
      router.push("/login");
    } else {
      errorNotification(
        "Error",
        data.message || "Something went wrong. Please try again.",
      );
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
