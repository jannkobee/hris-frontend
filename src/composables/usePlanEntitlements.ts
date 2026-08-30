import { computed } from "vue";
import { useAuth } from "@/composables/useAuth";

export const usePlanEntitlements = () => {
  const { authUser } = useAuth();

  const organization = computed(() => authUser.value?.organization);
  const plan = computed(() => organization.value?.plan);
  const features = computed(() => plan.value?.features ?? []);

  const hasFeature = (feature: string): boolean =>
    features.value.includes(feature);

  return {
    organization,
    plan,
    features,
    hasFeature,
  };
};
