<template>
  <v-theme-provider theme="dark" with-background
    ><v-container class="console-login" fluid>
      <div class="login-shell">
        <section class="login-intro">
          <div class="brand">
            <div><img :src="appIcon" alt="LexisOne" /></div>
            <span>LexisOne</span>
          </div>
          <div class="intro-copy">
            <v-chip size="small" variant="tonal" color="white"
              >Internal operations</v-chip
            >
            <h1>Manage every customer workspace from one control plane.</h1>
            <p>
              Provision organizations, monitor subscriptions, review billing
              health, and resolve access issues without entering the tenant
              workspace.
            </p>
          </div>
          <div class="security-note">
            <v-icon icon="mdi-shield-check-outline" /><span
              >Protected platform operations</span
            >
          </div>
        </section>
        <section class="login-form">
          <div class="form-heading">
            <div class="form-icon">
              <v-icon icon="mdi-shield-key-outline" />
            </div>
            <h2>Platform Console</h2>
            <p>Enter your staff access key to continue.</p>
          </div>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-5"
            >Authorized staff only. Access is retained for this browser
            tab.</v-alert
          ><v-form @submit.prevent="login"
            ><v-text-field
              v-model="key"
              label="Platform access key"
              placeholder="Enter your secure key"
              :type="show ? 'text' : 'password'"
              :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
              prepend-inner-icon="mdi-key-outline"
              variant="outlined"
              autocomplete="off"
              @click:append-inner="show = !show"
            /><v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
              :disabled="!key"
              >Open Platform Console</v-btn
            ></v-form
          ><RouterLink class="back-link" to="/"
            ><v-icon icon="mdi-arrow-left" size="16" />Return to public
            website</RouterLink
          >
        </section>
      </div>
    </v-container></v-theme-provider
  >
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { establishPlatformSession } from "@/composables/PlatformConsole/usePlatformAuth";
import appIcon from "@/assets/lexisone-logo.png";
const router = useRouter();
const key = ref("");
const show = ref(false);
const loading = ref(false);
const login = async () => {
  loading.value = true;
  try {
    await establishPlatformSession(key.value);
    await router.push({ name: "platform-overview" });
  } finally {
    loading.value = false;
  }
};
</script>
<style scoped>
.console-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  color: #dde4ee;
  background:
    radial-gradient(
      circle at 15% 10%,
      rgba(65, 104, 145, 0.12),
      transparent 32%
    ),
    #080b11;
}
.login-shell {
  width: min(940px, 100%);
  min-height: 570px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  overflow: hidden;
  border: 1px solid #252c38;
  border-radius: 24px;
  background: #131923;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.42);
}
.login-intro {
  display: flex;
  flex-direction: column;
  padding: 42px;
  color: #fff;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(80, 127, 165, 0.22),
      transparent 35%
    ),
    linear-gradient(145deg, #111a2a, #0b101a);
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  font-weight: 800;
}
.brand > div {
  width: 40px;
  height: 40px;
  overflow: hidden;
  border: 1px solid #343b48;
  border-radius: 11px;
  background: #f4f2ee;
}
.brand img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.intro-copy {
  margin: auto 0;
}
.intro-copy h1 {
  max-width: 430px;
  margin: 22px 0 18px;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.05em;
}
.intro-copy p {
  max-width: 430px;
  color: #a9b3c6;
  line-height: 1.65;
}
.security-note {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #8793aa;
  font-size: 0.75rem;
}
.login-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 54px;
  background: #151b25;
}
.form-heading {
  margin-bottom: 25px;
}
.form-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  border-radius: 12px;
  color: #90caf9;
  background: rgba(80, 145, 214, 0.14);
}
.form-heading h2 {
  font-size: 1.55rem;
  letter-spacing: -0.035em;
}
.form-heading p {
  margin-top: 5px;
  color: #8994a7;
  font-size: 0.85rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 23px;
  color: #9fb1c7;
  text-decoration: none;
  font-size: 0.78rem;
}
@media (max-width: 760px) {
  .console-login {
    padding: 14px;
  }
  .login-shell {
    grid-template-columns: 1fr;
  }
  .login-intro {
    min-height: 250px;
    padding: 28px;
  }
  .intro-copy {
    margin: 36px 0;
  }
  .intro-copy h1 {
    font-size: 2rem;
  }
  .security-note {
    display: none;
  }
  .login-form {
    padding: 32px 24px;
  }
}
</style>
