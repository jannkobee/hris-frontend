<template>
  <v-container fluid class="pa-0">
    <ModuleHeader
      eyebrow="Organization administration"
      title="Billing & subscription"
      subtitle="Manage invoices, payment methods, and your subscription securely."
      icon="mdi-credit-card-outline"
    >
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-open-in-new"
          :loading="opening"
          @click="openPortal"
        >
          Manage billing
        </v-btn>
      </template>
    </ModuleHeader>

    <v-alert type="info" variant="tonal" class="mb-5">
      Billing is managed in a secure provider-hosted portal. Only organization
      administrators can open it.
    </v-alert>
    <v-alert v-if="errorMessage" type="error" variant="tonal">{{
      errorMessage
    }}</v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ModuleHeader from "@/components/layouts/HrisApp/ModuleHeader.vue";
import axiosRequest from "@/plugins/axios";

const opening = ref(false);
const errorMessage = ref("");

const openPortal = async () => {
  opening.value = true;
  errorMessage.value = "";
  try {
    const response = await axiosRequest.post("/billing/portal-sessions", {
      return_url: `${window.location.origin}/billing`,
    });
    const url = response.data?.data?.url;
    if (!url) {
      throw new Error("The billing provider did not return a portal link.");
    }
    window.location.assign(url);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Unable to open the billing portal. Please try again later.";
  } finally {
    opening.value = false;
  }
};
</script>
