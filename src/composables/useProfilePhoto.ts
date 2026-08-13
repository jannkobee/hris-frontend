import { ref } from "vue";
import axios from "@/plugins/axios";

const photoUrl = ref<string | null>(null);

export const useProfilePhoto = () => {
  const loadingPhoto = ref(false);

  const clearProfilePhoto = () => {
    if (photoUrl.value?.startsWith("blob:")) URL.revokeObjectURL(photoUrl.value);
    photoUrl.value = null;
  };

  const loadProfilePhoto = async (endpoint?: string | null) => {
    clearProfilePhoto();
    if (!endpoint) return null;

    loadingPhoto.value = true;
    try {
      const response = await axios.get(endpoint, {
        responseType: "blob",
        headers: { "X-Suppress-Success-Notification": "true" },
      });
      photoUrl.value = URL.createObjectURL(response.data);
      return photoUrl.value;
    } catch (error: any) {
      if (error?.response?.status !== 404) console.error(error);
      return null;
    } finally {
      loadingPhoto.value = false;
    }
  };

  return { photoUrl, loadingPhoto, loadProfilePhoto, clearProfilePhoto };
};
