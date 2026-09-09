<template>
  <v-app class="showcase">
    <header class="site-header">
      <div class="site-nav">
        <RouterLink class="brand" to="/"
          ><LexisOneLogo /> Lexis<span>One</span></RouterLink
        >
        <nav class="nav-links">
          <a href="#features">Features</a><a href="#solutions">Solutions</a
          ><a href="#security">Security</a><a href="#pricing">Pricing</a>
        </nav>
        <div class="nav-actions">
          <v-btn variant="text" to="/login">Sign in</v-btn
          ><v-btn color="primary" to="/start-trial">Start free</v-btn>
        </div>
      </div>
    </header>
    <main>
      <section class="hero section-shell text-center">
        <v-chip color="primary" variant="tonal" class="mb-5"
          >Built for Philippine teams, ready for global operations</v-chip
        >
        <h1>Less HR paperwork.<br />More time for your people.</h1>
        <p>
          Keep employee records, attendance, leave, and approvals together. Give
          your team one place to request, review, and keep work moving.
        </p>
        <div class="d-flex justify-center flex-wrap ga-3">
          <v-btn color="primary" size="x-large" to="/start-trial"
            >Create your free workspace</v-btn
          ><v-btn size="x-large" variant="tonal" href="#workflow"
            >See how it works</v-btn
          >
        </div>
        <div class="hero-proof">
          No credit card required · Guided workspace setup · Upgrade when ready
        </div>
      </section>
      <section class="trust-strip">
        <div v-for="item in assurances" :key="item.title">
          <v-icon :icon="item.icon" color="primary" /><strong>{{
            item.title
          }}</strong
          ><span>{{ item.text }}</span>
        </div>
      </section>
      <section id="features" class="section-shell section-block">
        <div class="section-heading">
          <span>Everything HR needs</span>
          <h2>Everyday HR, in one place.</h2>
          <p>
            Spend less time chasing spreadsheets and chat messages. Explore the
            capabilities below; availability varies by plan.
          </p>
        </div>
        <div class="feature-grid">
          <article
            v-for="item in features"
            :key="item.title"
            class="feature-card"
          >
            <v-icon :icon="item.icon" color="primary" size="30" />
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </section>
      <section id="workflow" class="workflow-section section-block">
        <div class="section-shell workflow-grid">
          <div>
            <div class="section-heading align-left">
              <span>One reliable workflow</span>
              <h2>Try it without a sales meeting.</h2>
              <p>
                Create a free workspace online, set up your team, and try an
                everyday workflow. Your organization stays in control of its
                decisions.
              </p>
            </div>
            <v-btn color="primary" variant="tonal" to="/start-trial"
              >Get started free</v-btn
            >
          </div>
          <div class="workflow-list">
            <div v-for="(step, index) in workflow" :key="step.title">
              <div class="step-number">0{{ index + 1 }}</div>
              <div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="solutions" class="section-shell section-block">
        <div class="section-heading">
          <span>Designed around real operations</span>
          <h2>The right controls for how your teams work</h2>
        </div>
        <div class="solution-grid">
          <v-card
            v-for="solution in solutions"
            :key="solution.title"
            variant="outlined"
            rounded="lg"
            ><v-card-text
              ><v-icon :icon="solution.icon" color="primary" size="28" />
              <h3>{{ solution.title }}</h3>
              <p>{{ solution.text }}</p>
              <ul>
                <li v-for="point in solution.points" :key="point">
                  {{ point }}
                </li>
              </ul></v-card-text
            ></v-card
          >
        </div>
      </section>
      <section id="security" class="security-section section-block">
        <div class="section-shell security-grid">
          <div>
            <v-chip color="primary" variant="tonal"
              >Built around responsible access</v-chip
            >
            <h2>Security and governance are part of the workflow.</h2>
            <p>
              Keep each customer isolated, control identity lifecycle, and
              preserve sensitive payroll and approval records.
            </p>
          </div>
          <div class="security-list">
            <div v-for="item in security" :key="item.title">
              <v-icon icon="mdi-check-decagram" color="primary" />
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="pricing" class="section-shell section-block">
        <v-alert v-if="pricingError" type="error" role="alert"
          >{{ pricingError }} Please reload to try again.</v-alert
        >
        <p v-else-if="!pricingLoaded" role="status">Loading current pricing…</p>
        <template v-else>
          <div class="section-heading">
            <span>Free Basic · Upcoming Growth pricing</span>
            <h2>Start small. Grow affordably.</h2>
            <p>
              Basic: free for up to {{ pricing.free_employee_limit }} active
              employees. Growth:
              {{ formatPhp(pricing.growth_price_per_employee / 100) }} per
              additional employee per month, with your first
              {{ pricing.free_employee_limit }} places free.
            </p>
          </div>
          <div class="pricing-notice" role="note">
            <v-icon icon="mdi-check-decagram" color="primary" />
            <p>
              <strong
                >Free Basic is live. Growth billing scales
                automatically.</strong
              >
              Choose Basic at signup for
              {{ pricing.free_employee_limit }} active employees with no expiry
              and automatic workspace creation. When your team expands, Growth
              charges only
              {{ formatPhp(pricing.growth_price_per_employee / 100) }}/mo per
              employee above your free allowance.
            </p>
          </div>
          <v-row
            ><v-col
              v-for="plan in launchPlans"
              :key="plan.name"
              cols="12"
              md="6"
              ><v-card
                height="100%"
                rounded="lg"
                :class="{ featured: plan.featured }"
                ><v-card-text
                  ><v-chip
                    v-if="plan.featured"
                    color="primary"
                    size="small"
                    class="mb-3"
                    >For growing teams</v-chip
                  >
                  <h3>{{ plan.name }}</h3>
                  <div class="price">
                    {{ plan.price }}<small>{{ plan.unit }}</small>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-4">
                    {{ plan.limit }}
                  </div>
                  <p>{{ plan.description }}</p>
                  <v-list density="compact" bg-color="transparent"
                    ><v-list-item
                      v-for="feature in plan.features"
                      :key="feature"
                      prepend-icon="mdi-check"
                      :title="feature" /></v-list></v-card-text
                ><v-card-actions class="pa-4"
                  ><v-btn
                    block
                    :color="plan.featured ? 'primary' : undefined"
                    :variant="plan.featured ? 'flat' : 'tonal'"
                    href="#pricing-estimate"
                    >Estimate your team’s cost</v-btn
                  ></v-card-actions
                ></v-card
              ></v-col
            ></v-row
          >
          <div id="pricing-estimate" class="pricing-calculator">
            <div>
              <h3>What would your team pay?</h3>
              <label for="employee-count">Active employees</label>
              <input
                id="employee-count"
                v-model="headcount"
                type="number"
                min="1"
                max="100000"
                step="1"
                inputmode="numeric"
                :aria-invalid="estimate === null"
                aria-describedby="employee-count-help"
              />
              <p id="employee-count-help" class="estimate-note">
                Enter a whole number from 1 to 100,000. Archived employees are
                excluded from this proposed model.
              </p>
              <div class="example-counts">
                <button
                  v-for="count in [10, 25, 50, 100]"
                  :key="count"
                  type="button"
                  :aria-pressed="Number(headcount) === count"
                  @click="headcount = String(count)"
                >
                  {{ count }} people
                </button>
              </div>
            </div>
            <div class="estimate-result" aria-live="polite" aria-atomic="true">
              <template v-if="estimate">
                <p>
                  {{
                    estimate.billableEmployees
                      ? "Growth estimate"
                      : "Basic estimate"
                  }}
                </p>
                <strong
                  >{{ formatPhp(estimate.monthlyPesos)
                  }}<small>/ month</small></strong
                >
                <p>
                  {{
                    estimate.billableEmployees
                      ? `${estimate.billableEmployees} additional employees × ${formatPhp(pricing.growth_price_per_employee / 100)}`
                      : `Your team fits within the ${pricing.free_employee_limit} free places.`
                  }}
                </p>
                <p class="estimate-note">
                  {{
                    estimate.billableEmployees
                      ? `First ${pricing.free_employee_limit} employee places: ₱0.`
                      : "Growth-only features are not included in Basic."
                  }}
                  Indicative subscription subtotal; tax treatment will be
                  confirmed before checkout launches.
                </p>
              </template>
              <p v-else>Enter a valid employee count to see your estimate.</p>
            </div>
          </div>
          <p class="estimate-note">
            Payroll belongs to Business. Growth minimum monthly charge:
            {{
              formatPhp(
                ((pricing.minimum_billable_employees ?? 0) *
                  pricing.growth_price_per_employee) /
                  100,
              )
            }}.
          </p>
        </template>
      </section>
      <section class="section-shell automation-note">
        <v-icon icon="mdi-autorenew" color="primary" size="32" />
        <div>
          <h2>Automate the routine. Keep control of the decisions.</h2>
          <p>
            Employees submit requests and managers review them in the app.
            Notifications keep updates visible. Your organization still reviews
            payroll and decides its policies.
          </p>
          <p class="estimate-note">
            Self-service billing and account lifecycle automation remain release
            work. Fully hands-off operation is our goal, not a guarantee of the
            current release.
          </p>
        </div>
      </section>
      <section id="questions" class="section-shell faq section-block">
        <div class="section-heading">
          <span>Frequently asked questions</span>
          <h2>Start with confidence</h2>
        </div>
        <v-expansion-panels variant="accordion"
          ><v-expansion-panel
            v-for="item in launchFaqs"
            :key="item.question"
            :title="item.question"
            :text="item.answer"
        /></v-expansion-panels>
      </section>
      <section class="final-cta">
        <h2>Move your HR operations into one reliable workspace.</h2>
        <p>Start with your team today. No payment details required.</p>
        <v-btn color="primary" size="x-large" to="/start-trial"
          >Create your free workspace</v-btn
        >
      </section>
    </main>
    <footer>
      <div class="section-shell footer-grid">
        <div>
          <div class="brand">Lexis<span>One</span></div>
          <p>Practical workforce management for growing organizations.</p>
        </div>
        <div>
          <strong>Product</strong><a href="#features">Features</a
          ><a href="#pricing">Pricing</a
          ><RouterLink to="/login">Customer sign in</RouterLink>
        </div>
        <div>
          <strong>Company</strong><a href="#solutions">Solutions</a
          ><a href="#security">Security</a
          ><RouterLink to="/start-trial">Start free</RouterLink>
        </div>
        <div>
          <strong>Staff</strong
          ><RouterLink to="/platform/login">Platform Console</RouterLink
          ><small>Authorized internal users only</small>
        </div>
      </div>
      <div class="section-shell footer-bottom">
        © {{ new Date().getFullYear() }} LexisOne. All rights reserved.
      </div>
    </footer>
  </v-app>
</template>
<script setup lang="ts">
import LexisOneLogo from "@/components/LexisOneLogo.vue";
import { computed, ref, onMounted } from "vue";
import { fetchPricing } from "@/composables/PlatformConsole/usePlatformPricing";
import { estimateGrowthPricing, formatPhp } from "@/utils/growthPricing";

const headcount = ref("25");
const pricing = ref({
  free_employee_limit: 10,
  minimum_billable_employees: 0,
  growth_price_per_employee: 1900,
});
const pricingError = ref("");
const pricingLoaded = ref(false);
onMounted(async () => {
  try {
    pricing.value = await fetchPricing();
    pricingLoaded.value = true;
  } catch {
    pricingError.value = "Pricing is temporarily unavailable.";
  }
});
const estimate = computed(() =>
  pricingError.value
    ? null
    : estimateGrowthPricing(
        headcount.value,
        pricing.value.free_employee_limit,
        pricing.value.growth_price_per_employee / 100,
        pricing.value.minimum_billable_employees ?? 0,
      ),
);
const launchPlans = computed(() => [
  {
    name: "Basic",
    price: "₱0",
    unit: "/ month",
    limit: `Available now · Up to ${pricing.value.free_employee_limit} active employees`,
    featured: false,
    description: "The essentials for a small team. Free with no expiry.",
    features: [
      "Employee directory",
      "Attendance and corrections",
      "Leave and overtime requests",
      "Approvals and workforce calendar",
    ],
  },
  {
    name: "Growth",
    price: formatPhp(pricing.value.growth_price_per_employee / 100),
    unit: "/ additional employee / month",
    limit: `Coming soon · Your first ${pricing.value.free_employee_limit} employee places stay free`,
    featured: true,
    description:
      "Grow without jumping to a large fixed monthly bill. Payroll is separate.",
    features: [
      "Everything in Basic",
      "Shift scheduling",
      "Employee documents",
      "Operational reports",
    ],
  },
]);
const launchFaqs = [
  {
    question: "Can I get the free Basic plan today?",
    answer:
      "Yes. Choose Basic at signup to create your free workspace within the published free allowance, with no expiry or credit card. Employees count through their last day of employment; future hires reserve a place. Other plan selections start a 14-day trial.",
  },
  {
    question: "How does per-employee pricing work?",
    answer:
      "Growth is calculated from active employees above the free allowance multiplied by the published monthly rate. Use the calculator for your team size. Growth-only features for smaller teams are not priced here yet.",
  },
  {
    question: "Does Growth include payroll?",
    answer:
      "No. Payroll and advanced controls belong to Business. Revised Business pricing is being finalized; this calculator is not a payroll quote.",
  },
  {
    question: "Will starting a trial charge my card?",
    answer:
      "No credit card is required to create a trial. The upcoming prices shown here do not replace existing checkout offers.",
  },
  {
    question: "Is everything fully automated?",
    answer:
      "Not yet. Trial signup is self-service, and employee requests and manager reviews happen in the app. Billing and account lifecycle automation still need release verification. Your organization remains responsible for policies, approvals, and reviewing payroll.",
  },
  {
    question: "Are these prices available in other countries?",
    answer:
      "This upcoming offer is in Philippine pesos for Philippine organizations. Other regions are not covered by this pricing preview.",
  },
];
const assurances = [
  {
    icon: "mdi-domain",
    title: "Tenant isolated",
    text: "Separate organization data",
  },
  {
    icon: "mdi-shield-check-outline",
    title: "Audit ready",
    text: "Traceable actions and approvals",
  },
  {
    icon: "mdi-tune-variant",
    title: "Policy driven",
    text: "Rules that reflect real operations",
  },
];
const features = [
  {
    icon: "mdi-account-group-outline",
    title: "Core HR",
    text: "Employee records, roles, documents, announcements, profiles, and self-service.",
  },
  {
    icon: "mdi-calendar-clock-outline",
    title: "Time and scheduling",
    text: "Shift rosters, attendance exceptions, correction requests, holidays, and workforce calendars.",
  },
  {
    icon: "mdi-calendar-check-outline",
    title: "Leave and overtime",
    text: "Balances, carry-over, blackout dates, delegates, premiums, and reusable approvals.",
  },
  {
    icon: "mdi-cash-multiple",
    title: "Philippine payroll",
    text: "Payroll is available only for Philippine organizations on eligible plans. Core HR is available elsewhere; other countries' payroll and taxes are not supported.",
  },
  {
    icon: "mdi-bell-check-outline",
    title: "Approvals and notifications",
    text: "Persistent inboxes, manager queues, status updates, and overdue reminders.",
  },
  {
    icon: "mdi-chart-box-outline",
    title: "Reports and insights",
    text: "Operational dashboards, saved reports, exports, and scheduled delivery.",
  },
];
const workflow = [
  {
    title: "Create your workspace",
    text: "Register your organization and administrator through the online signup form.",
  },
  {
    title: "Set up your team",
    text: "Review organization settings, add employees, and assign the right access.",
  },
  {
    title: "Try a real request",
    text: "Record attendance or submit a leave request, then review it as a manager.",
  },
  {
    title: "Keep the outcome visible",
    text: "Check the decision and its notification in the employee workspace.",
  },
];
const solutions = [
  {
    icon: "mdi-store-outline",
    title: "Small business",
    text: "Launch core HR quickly without adding administrative overhead.",
    points: [
      "Employee self-service",
      "Attendance and leave",
      "Simple payroll controls",
    ],
  },
  {
    icon: "mdi-headset",
    title: "BPO and outsourced teams",
    text: "Manage high-volume schedules and approval exceptions.",
    points: ["Shift rosters", "Correction queues", "Overtime premiums"],
  },
  {
    icon: "mdi-factory",
    title: "Manufacturing and field",
    text: "Connect planned shifts to actual attendance and rest-day rules.",
    points: [
      "Late and missing-clock flags",
      "Holiday-aware overtime",
      "Manager review",
    ],
  },
  {
    icon: "mdi-rocket-launch-outline",
    title: "Growing technology teams",
    text: "Scale access and employee lifecycle controls with your organization.",
    points: ["Role-based access", "OIDC and SCIM", "APIs and webhooks"],
  },
];
const security = [
  {
    title: "Identity hardening",
    text: "MFA-ready authentication, session security, login throttling, OIDC, and SCIM provisioning.",
  },
  {
    title: "Organization isolation",
    text: "Tenant-aware models, requests, scheduled work, and entitlement enforcement.",
  },
  {
    title: "Payroll integrity",
    text: "Locked runs, effective-dated rules, snapshots, and auditable state changes.",
  },
  {
    title: "Plan controls",
    text: "Employee limits and product capabilities enforced from subscription entitlements.",
  },
];
</script>
<style scoped>
.pricing-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px;
  margin-bottom: 28px;
  background: rgba(var(--v-theme-primary), 0.08);
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.7;
}
.pricing-calculator {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 32px;
  margin-top: 28px;
  border: 1px solid rgba(var(--v-border-color), 0.2);
  border-radius: 16px;
  scroll-margin-top: 90px;
}
.pricing-calculator label {
  display: block;
  margin: 20px 0 8px;
  font-size: 0.85rem;
}
.pricing-calculator input {
  padding: 12px;
  width: 100%;
  max-width: 260px;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 6px;
  color: inherit;
  background: rgb(var(--v-theme-surface));
}
.estimate-note {
  font-size: 0.8rem;
  line-height: 1.7;
  opacity: 0.75;
  margin-top: 16px;
}
.estimate-result {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.06);
  border-radius: 12px;
  padding: 24px;
}
.estimate-result strong {
  font-size: clamp(2rem, 4vw, 3.3rem);
  margin-block: 12px;
  overflow-wrap: anywhere;
}
.estimate-result small {
  font-size: 0.8rem;
  font-weight: 400;
  margin-left: 8px;
}
.example-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.example-counts button {
  border: 1px solid rgba(var(--v-border-color), 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.8rem;
}
.example-counts button[aria-pressed="true"] {
  background: rgba(var(--v-theme-primary), 0.15);
  border-color: rgb(var(--v-theme-primary));
}
.automation-note {
  display: flex;
  gap: 24px;
  padding: 32px;
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.06);
}
.automation-note h2 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}
.automation-note p {
  line-height: 1.8;
}
:is(a, input, button):focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
}
section[id] {
  scroll-margin-top: 90px;
}
.showcase {
  background:
    radial-gradient(
      circle at 50% 0,
      rgba(var(--v-theme-primary), 0.13),
      transparent 30%
    ),
    rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}
.section-shell,
.site-nav {
  width: min(1180px, calc(100% - 40px));
  margin-inline: auto;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  background: rgba(var(--v-theme-background), 0.88);
  backdrop-filter: blur(18px);
}
.site-nav {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  color: inherit;
  text-decoration: none;
  font-size: 1.35rem;
  font-weight: 850;
  letter-spacing: -0.04em;
}
.brand span {
  color: rgb(var(--v-theme-primary));
}
.nav-links {
  display: flex;
  gap: 28px;
}
.nav-links a,
footer a {
  color: rgba(var(--v-theme-on-background), 0.72);
  text-decoration: none;
}
.nav-links a:hover,
footer a:hover {
  color: rgb(var(--v-theme-primary));
}
.nav-actions {
  display: flex;
  gap: 8px;
}
.hero {
  padding-block: 110px 90px;
  max-width: 900px;
}
.hero h1 {
  font-size: clamp(2.7rem, 7vw, 5.4rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
}
.hero p {
  max-width: 720px;
  margin: 26px auto 34px;
  font-size: 1.18rem;
  color: rgba(var(--v-theme-on-background), 0.7);
}
.hero-proof {
  margin-top: 22px;
  font-size: 0.82rem;
  color: rgba(var(--v-theme-on-background), 0.6);
}
.trust-strip {
  max-width: 1040px;
  margin: auto;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid rgba(var(--v-border-color), 0.16);
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.72);
}
.trust-strip > div {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 12px;
  padding: 6px 28px;
}
.trust-strip span {
  grid-column: 2;
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.62);
}
.section-block {
  padding-block: 96px;
}
.section-heading {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 44px;
}
.section-heading.align-left {
  text-align: left;
  margin-left: 0;
}
.section-heading > span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.section-heading h2,
.security-grid h2,
.final-cta h2 {
  margin-top: 9px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}
.section-heading p,
.security-grid > div > p {
  margin-top: 14px;
  color: rgba(var(--v-theme-on-background), 0.68);
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.feature-card {
  padding: 28px;
  border: 1px solid rgba(var(--v-border-color), 0.14);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
}
.feature-card h3,
.solution-grid h3 {
  margin: 16px 0 8px;
}
.feature-card p,
.solution-grid p,
.solution-grid li {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.67);
}
.workflow-section,
.security-section {
  background: rgba(var(--v-theme-primary), 0.055);
  border-block: 1px solid rgba(var(--v-border-color), 0.12);
}
.workflow-grid,
.security-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 88px;
  align-items: center;
}
.workflow-list {
  display: grid;
  gap: 10px;
}
.workflow-list > div {
  display: flex;
  gap: 20px;
  padding: 22px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.12);
}
.step-number {
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
}
.workflow-list h3 {
  font-size: 1rem;
}
.workflow-list p,
.security-list p {
  margin-top: 5px;
  font-size: 0.86rem;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.solution-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.solution-grid ul {
  margin: 16px 0 0;
  padding-left: 20px;
}
.solution-grid li {
  margin-top: 7px;
}
.security-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.security-list > div {
  display: flex;
  gap: 12px;
  padding: 18px;
}
.price {
  margin: 14px 0 3px;
  font-size: 1.85rem;
  font-weight: 850;
}
.price small {
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.featured {
  border: 2px solid rgb(var(--v-theme-primary));
  transform: translateY(-8px);
}
.faq {
  max-width: 900px;
}
.final-cta {
  text-align: center;
  margin: 30px auto 90px;
  padding: 72px 24px;
  max-width: 1050px;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.18),
    rgba(var(--v-theme-primary), 0.05)
  );
}
.final-cta p {
  margin: 16px 0 26px;
  color: rgba(var(--v-theme-on-background), 0.7);
}
footer {
  border-top: 1px solid rgba(var(--v-border-color), 0.14);
  padding: 58px 0 24px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: 48px;
}
.footer-grid > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.footer-grid p,
.footer-grid small,
.footer-bottom {
  font-size: 0.82rem;
  color: rgba(var(--v-theme-on-background), 0.58);
}
.footer-bottom {
  margin-top: 44px;
  padding-top: 20px;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
}
@media (max-width: 900px) {
  .nav-links {
    display: none;
  }
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .solution-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .workflow-grid,
  .security-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .pricing-calculator {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  .automation-note {
    flex-direction: column;
    padding: 24px;
  }
  .nav-actions .v-btn:first-child {
    display: none;
  }
  .hero {
    padding-block: 72px;
  }
  .trust-strip,
  .feature-grid,
  .solution-grid,
  .security-list,
  .footer-grid {
    grid-template-columns: 1fr;
  }
  .trust-strip > div {
    padding: 12px;
  }
  .section-block {
    padding-block: 70px;
  }
  .featured {
    transform: none;
  }
}
</style>
