import axios from "@/plugins/axios";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { User } from "@/types/types";

const loading = ref(false);

export const useAuth = () => {
  const router = useRouter();

  const authUser = ref<User>();
  const settings = ref<Record<string, any>>({});

  async function login(payload: any) {
    const response = await axios.post("/auth/login", payload);

    window.localStorage.setItem("APP_TOKEN", response.data.token);

    window.location.href = "/dashboard";
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
    const response = await axios.post("/forgot-password", payload);

    return response;
  }

  async function reset_password(payload: any) {
    const response = await axios.post("/reset-password", payload);

    return response;
  }

  async function update_password(payload: any) {
    const res = await axios.post(`update_password`, payload);

    return res;
  }

  return {
    loading,
    authUser,
    settings,
    login,
    logout,
    getUser,
    getSettings,
    updateSettings,
    forgot_password,
    reset_password,
    update_password,
  };
};
