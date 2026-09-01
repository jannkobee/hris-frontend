<template>
  <v-app class="showcase">
    <header class="site-header">
      <div class="site-nav">
        <RouterLink class="brand" to="/saas">Lexis<span>One</span></RouterLink>
        <nav class="nav-links">
          <a href="#features">Features</a><a href="#solutions">Solutions</a
          ><a href="#security">Security</a><a href="#pricing">Pricing</a>
        </nav>
        <div class="nav-actions">
          <v-btn variant="text" to="/login">Sign in</v-btn
          ><v-btn color="primary" to="/start-trial">Start free trial</v-btn>
        </div>
      </div>
    </header>
    <main>
      <section class="hero section-shell text-center">
        <v-chip color="primary" variant="tonal" class="mb-5"
          >Built for Philippine teams, ready for global operations</v-chip
        >
        <h1>Run your workforce with clarity, from clock-in to payroll.</h1>
        <p>
          LexisOne connects employee records, schedules, attendance, approvals,
          leave, overtime, and payroll in one policy-aware workspace.
        </p>
        <div class="d-flex justify-center flex-wrap ga-3">
          <v-btn color="primary" size="x-large" to="/start-trial"
            >Start your 14-day trial</v-btn
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
          <h2>A connected operating system for your workforce</h2>
          <p>
            Replace fragmented tools with workflows that preserve context,
            approvals, and audit history.
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
              <h2>Capture, approve, calculate, and report</h2>
              <p>
                Every step carries the original record, policy decision,
                approver, and resulting payroll impact.
              </p>
            </div>
            <v-btn color="primary" variant="tonal" to="/start-trial"
              >Explore with a free trial</v-btn
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
              >Enterprise-ready foundation</v-chip
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
        <div class="section-heading">
          <span>Philippines launch pricing</span>
          <h2>Plans that grow with your workforce</h2>
          <p>
            Prices are shown in PHP. Regional pricing is applied from your
            organization country.
          </p>
        </div>
        <v-row
          ><v-col v-for="plan in plans" :key="plan.name" cols="12" sm="6" lg="3"
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
                  >Most popular</v-chip
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
                  :to="
                    plan.code === 'enterprise'
                      ? '/start-trial'
                      : { path: '/start-trial', query: { plan: plan.code } }
                  "
                  >{{
                    plan.code === "enterprise"
                      ? "Contact sales"
                      : `Start ${plan.name} trial`
                  }}</v-btn
                ></v-card-actions
              ></v-card
            ></v-col
          ></v-row
        >
      </section>
      <section class="section-shell faq section-block">
        <div class="section-heading">
          <span>Frequently asked questions</span>
          <h2>Start with confidence</h2>
        </div>
        <v-expansion-panels variant="accordion"
          ><v-expansion-panel
            v-for="item in faqs"
            :key="item.question"
            :title="item.question"
            :text="item.answer"
        /></v-expansion-panels>
      </section>
      <section class="final-cta">
        <h2>Move your HR operations into one reliable workspace.</h2>
        <p>Start with your team today. No payment details required.</p>
        <v-btn color="primary" size="x-large" to="/start-trial"
          >Create your free trial</v-btn
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
          ><RouterLink to="/start-trial">Start a trial</RouterLink>
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
    title: "Payroll confidence",
    text: "Policy-aware calculations, locked payroll runs, statutory versioning, and payslip snapshots.",
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
    title: "Capture the source record",
    text: "Import schedules and holidays, then collect attendance, leave, overtime, and employee changes.",
  },
  {
    title: "Route the right approval",
    text: "Send requests to managers or active delegates with notes, history, and notification reminders.",
  },
  {
    title: "Apply policy consistently",
    text: "Evaluate balances, blackout dates, rest days, premiums, and effective-dated statutory rules.",
  },
  {
    title: "Lock and report",
    text: "Create immutable payroll snapshots and export the operational evidence behind every result.",
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
const plans = [
  {
    name: "Starter",
    code: "starter",
    price: "₱1,990",
    unit: "/month",
    limit: "Up to 25 employees",
    description: "Essential HR operations for small teams.",
    features: ["Core HR", "Attendance and leave", "Overtime and calendar"],
  },
  {
    name: "Growth",
    code: "growth",
    price: "₱4,990",
    unit: "/month",
    limit: "Up to 100 employees",
    featured: true,
    description: "Manager workflows and visibility for growing companies.",
    features: [
      "Shift rosters",
      "Corrections and approvals",
      "Documents and reports",
    ],
  },
  {
    name: "Business",
    code: "business",
    price: "₱11,990",
    unit: "/month",
    limit: "Up to 500 employees",
    description: "Payroll, automation, and governance for complex operations.",
    features: ["Payroll and audit logs", "Scheduled reports", "Workplace Hub"],
  },
  {
    name: "Enterprise",
    code: "enterprise",
    price: "Custom",
    unit: "",
    limit: "Custom workforce size",
    description:
      "Identity, integrations, and tailored controls for larger organizations.",
    features: [
      "OIDC and SCIM",
      "APIs and webhooks",
      "Custom scale and support",
    ],
  },
];
const faqs = [
  {
    question: "Is a credit card required for the trial?",
    answer:
      "No. You can create a 14-day workspace without entering payment details.",
  },
  {
    question: "Can we import Philippine holidays?",
    answer:
      "Yes. Your organization country determines the holiday source and regional behavior used by the workforce calendar.",
  },
  {
    question: "Can plans change as our headcount grows?",
    answer:
      "Yes. Plans and employee limits are managed through subscription entitlements and can be upgraded as your organization grows.",
  },
  {
    question: "Is the Platform Console part of the customer HRIS?",
    answer:
      "No. It is a separate, staff-only operations area used to provision and support customer organizations.",
  },
];
</script>
<style scoped>
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
