<template>
  <section class="billing-page">
    <header class="module-header">
      <div>
        <p class="eyebrow">ORGANIZATION ADMINISTRATION</p>
        <h1>Billing & subscription</h1>
        <p>Manage invoices, payment methods, and your subscription securely.</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-open-in-new"
        :loading="opening"
        @click="openPortal"
      >
        Manage billing
      </v-btn>
    </header>

    <v-alert type="info" variant="tonal" class="mb-5">
      Billing is managed in a secure provider-hosted portal. Only organization
      administrators can open it.
    </v-alert>
    <v-alert v-if="errorMessage" type="error" variant="tonal">{{
      errorMessage
    }}</v-alert>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
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

<style scoped>
.billing-page {
  display: grid;
  gap: 20px;
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: linear-gradient(
    120deg,
    rgba(var(--v-theme-primary), 0.1),
    transparent 45%
  );
}

.module-header h1 {
  margin: 4px 0 6px;
}

.module-header p {
  margin: 0;
}

.eyebrow {
  color: rgb(var(--v-theme-primary));
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

@media (max-width: 640px) {
  .module-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
