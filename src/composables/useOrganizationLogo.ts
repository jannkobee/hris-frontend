import { ref } from "vue";
import axios from "@/plugins/axios";

// Kept at module scope so the navigation and Organization Settings always use
// the same authenticated blob URL. This also prevents protected tenant logos
// from being exposed as public storage URLs.
const logoUrl = ref<string | null>(null);

export const useOrganizationLogo = () => {
  const loadingLogo = ref(false);

  const clearOrganizationLogo = () => {
    if (logoUrl.value?.startsWith("blob:")) {
      URL.revokeObjectURL(logoUrl.value);
    }

    logoUrl.value = null;
  };

  const loadOrganizationLogo = async (endpoint?: string | null) => {
    clearOrganizationLogo();
    if (!endpoint) return null;

    loadingLogo.value = true;
    try {
      const response = await axios.get(endpoint, {
        responseType: "blob",
        headers: { "X-Suppress-Success-Notification": "true" },
      });
      logoUrl.value = URL.createObjectURL(response.data);
      return logoUrl.value;
    } catch (error: any) {
      if (error?.response?.status !== 404) console.error(error);
      return null;
    } finally {
      loadingLogo.value = false;
    }
  };

  return { logoUrl, loadingLogo, loadOrganizationLogo, clearOrganizationLogo };
};
