import axios from "@/plugins/axios";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { User } from "@/types/types";

// 1. ALL state variables moved outside the function so they are shared globally
const loading = ref(false);
const authUser = ref<User>();
const settings = ref<Record<string, any>>({});

export const useAuth = () => {
  const router = useRouter();

  async function login(payload: any) {
    const response = await axios.post("/auth/login", payload);
    const authPayload = response.data.data;

    if (authPayload.mfa_required) {
      return authPayload;
    }

    window.localStorage.setItem("APP_TOKEN", authPayload.token);

    window.location.href = "/dashboard";

    return authPayload;
  }

  async function verifyMfaChallenge(payload: { challenge: string; code: string }) {
    const response = await axios.post("/auth/mfa/challenge", payload);
    const authPayload = response.data.data;

    window.localStorage.setItem("APP_TOKEN", authPayload.token);
    window.location.href = "/dashboard";

    return authPayload;
  }

  async function logout() {
    try {
      await axios.post("/auth/logout");

      window.localStorage.removeItem("APP_TOKEN");
    } catch (e) {
      console.error(e);
    } finally {
      router.push("/login");
    }
  }

  async function getUser() {
    try {
      loading.value = true;

      const res = await axios.get("/auth/auth-user");

      authUser.value = res.data.data;
      settings.value = authUser.value?.settings ?? {};

      loading.value = false;

      return res.data;
    } catch (err) {
      console.error(err);
      loading.value = false; // Always a good idea to reset loading on error
    }
  }

  async function getSettings() {
    try {
      const res = await axios.get("/auth/settings");
      settings.value = res.data.data ?? {};

      if (authUser.value) {
        authUser.value.settings = settings.value;
      }

      return settings.value;
    } catch (err) {
      console.error(err);
    }
  }

  async function updateSettings(payload: Record<string, any>) {
    try {
      const res = await axios.patch("/auth/settings", payload);
      settings.value = { ...settings.value, ...payload };

      if (authUser.value) {
        authUser.value.settings = settings.value;
      }

      return res;
    } catch (err) {
      console.error(err);
    }
  }

  async function forgot_password(payload: any) {
    const response = await axios.post("/auth/forgot-password", payload);

    return response;
  }

  async function reset_password(payload: any) {
    const response = await axios.post("/auth/reset-password", payload);

    return response;
  }

  async function update_password(payload: any) {
    const res = await axios.post("/auth/password", payload);

    return res;
  }

  return {
    loading,
    authUser,
    settings,
    login,
    verifyMfaChallenge,
    logout,
    getUser,
    getSettings,
    updateSettings,
    forgot_password,
    reset_password,
    update_password,
  };
};
