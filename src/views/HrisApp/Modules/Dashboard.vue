<template>
  <v-container fluid class="dashboard-page pa-0">
    <section class="welcome-panel">
      <div class="welcome-copy">
        <span class="welcome-date">{{ longToday }}</span>
        <h1>{{ greeting }}, {{ authUser?.first_name || "there" }}</h1>
        <p>Here is what is happening around your workplace today.</p>
      </div>
      <div
        class="daily-focus"
        :class="{ 'daily-focus--loading': calendarLoading && !dailyQuote.text }"
      >
        <v-icon icon="mdi-format-quote-open" size="25" />
        <div v-if="dailyQuote.text">
          <span>Daily {{ dailyQuote.theme }}</span>
          <blockquote>{{ dailyQuote.text }}</blockquote>
        </div>
        <div v-else><v-skeleton-loader type="text, text" width="360" /></div>
      </div>
    </section>

    <div class="metric-grid">
      <article class="metric-card">
        <v-avatar color="primary" variant="tonal"
          ><v-icon icon="mdi-account-group-outline"
        /></v-avatar>
        <div>
          <span>Current employees</span><strong>{{ presence.length }}</strong
          ><small>Company headcount</small>
        </div>
      </article>
      <article class="metric-card">
        <v-avatar color="warning" variant="tonal"
          ><v-icon icon="mdi-calendar-account-outline"
        /></v-avatar>
        <div>
          <span>On leave today</span><strong>{{ employeesOnLeave }}</strong
          ><small>Approved leave</small>
        </div>
      </article>
      <article class="metric-card">
        <v-avatar color="success" variant="tonal"
          ><v-icon icon="mdi-account-check-outline"
        /></v-avatar>
        <div>
          <span>Currently in</span><strong>{{ employeesInToday.length }}</strong
          ><small>Still clocked in</small>
        </div>
      </article>
      <article class="metric-card">
        <v-avatar color="info" variant="tonal"
          ><v-icon icon="mdi-calendar-clock-outline"
        /></v-avatar>
        <div>
          <span>Calendar items</span
          ><strong>{{ todayCalendarEvents.length }}</strong
          ><small>Your schedule today</small>
        </div>
      </article>
    </div>

    <section v-if="canViewReports" class="analytics-panel mb-5">
      <header>
        <div><span>Last 30 days</span><strong>Workforce analytics</strong></div>
        <div class="d-flex ga-2">
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-download"
            :loading="analyticsExporting"
            @click="exportAnalytics"
            >Export</v-btn
          >
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-file-chart-outline"
            @click="$router.push({ name: 'reports' })"
            >Open reports</v-btn
          >
        </div>
      </header>
      <div class="analytics-grid">
        <div>
          <span>Headcount</span><strong>{{ analytics.headcount }}</strong>
        </div>
        <div>
          <span>Attendance exceptions</span
          ><strong>{{ analytics.attendance_exceptions }}</strong>
        </div>
        <div>
          <span>Approved leave days</span
          ><strong>{{ analytics.leave_days }}</strong>
        </div>
        <div>
          <span>Premium overtime hours</span
          ><strong>{{ analytics.overtime_premium_hours }}</strong>
        </div>
        <div>
          <span>Approved payroll</span
          ><strong>{{ formatMoney(analytics.payroll_net) }}</strong>
        </div>
      </div>
      <div v-if="analytics.trends.length" class="trend-wrap">
        <div class="trend-legend">
          <span><i class="exceptions" /> Attendance exceptions</span
          ><span><i class="overtime" /> Premium overtime hours</span>
        </div>
        <div class="trend-chart">
          <div
            v-for="point in analytics.trends"
            :key="point.date"
            class="trend-day"
            :title="`${point.label}: ${point.attendance_exceptions} exceptions, ${point.overtime_hours} overtime hours`"
          >
            <div class="trend-bars">
              <i
                class="exceptions"
                :style="{ height: trendHeight(point.attendance_exceptions) }"
              /><i
                class="overtime"
                :style="{ height: trendHeight(point.overtime_hours) }"
              />
            </div>
            <small>{{ point.label }}</small>
          </div>
        </div>
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="calendar-panel">
        <MonthlyCalendar
          :events="calendarEvents"
          :loading="calendarLoading"
          :timezone="companyTimezone"
          compact
          :legend="calendarLegend"
          @range-change="loadCalendar"
          @event-click="openCalendarEvent"
          @day-click="selectedDay = $event"
        />
      </section>

      <aside class="dashboard-sidebar">
        <section class="agenda-card">
          <header>
            <div>
              <span>Selected day</span><strong>{{ selectedDayLabel }}</strong>
            </div>
            <v-chip size="x-small" variant="tonal"
              >{{ selectedDayEvents.length }} item{{
                selectedDayEvents.length === 1 ? "" : "s"
              }}</v-chip
            >
          </header>
          <div v-if="selectedDayEvents.length" class="agenda-list">
            <button
              v-for="event in selectedDayEvents"
              :key="event.id"
              type="button"
              @click="openCalendarEvent(event)"
            >
              <i :style="{ background: event.color }" />
              <div>
                <strong>{{ event.title }}</strong
                ><span
                  >{{
                    event.all_day ? "All day" : eventTime(event.starts_at)
                  }}
                  · {{ eventLabel(event.type) }}</span
                >
              </div>
              <v-icon icon="mdi-chevron-right" size="18" />
            </button>
          </div>
          <div v-else class="agenda-empty">
            <v-icon icon="mdi-calendar-check-outline" /><span
              >No scheduled items.</span
            >
          </div>
        </section>

        <section class="announcements-card">
          <header>
            <div>
              <span>Company updates</span><strong>Announcements</strong>
            </div>
            <v-icon icon="mdi-bullhorn-outline" color="primary" />
          </header>
          <div v-if="calendarLoading && !announcements.length">
            <v-skeleton-loader type="list-item-two-line@3" />
          </div>
          <div v-else-if="announcements.length" class="announcement-list">
            <button
              v-for="announcement in announcements"
              :key="announcement.id"
              type="button"
              @click="openAnnouncement(announcement)"
            >
              <span>{{ formatDate(announcement.published_at) }}</span>
              <div>
                <strong>{{ announcement.title }}</strong
                ><small>{{ announcementExcerpt(announcement.content) }}</small>
              </div>
            </button>
          </div>
          <div v-else class="agenda-empty">
            <v-icon icon="mdi-bullhorn-outline" /><span
              >No announcements yet.</span
            >
          </div>
        </section>

        <section v-if="canUseNotes" class="notes-card">
          <header>
            <div>
              <span>Personal workspace</span><strong>Recent notes</strong>
            </div>
            <div class="notes-card__actions">
              <v-btn
                icon="mdi-plus"
                size="small"
                variant="tonal"
                color="primary"
                title="Create note"
                :to="{ name: 'notes', query: { create: '1' } }"
              /><v-btn
                icon="mdi-arrow-right"
                size="small"
                variant="text"
                title="Open notes"
                :to="{ name: 'notes' }"
              />
            </div>
          </header>
          <v-skeleton-loader
            v-if="recentNotesLoading"
            type="list-item-two-line@3"
          />
          <div v-else-if="recentNotes.length" class="recent-notes">
            <RouterLink
              v-for="note in recentNotes"
              :key="note.id"
              :to="{ name: 'notes', query: { open: note.id } }"
              ><i :style="{ background: noteColor(note.color) }" />
              <div>
                <strong>{{ note.title }}</strong
                ><span>{{
                  noteExcerpt(note.content) || "No content yet"
                }}</span>
              </div>
              <v-icon
                v-if="note.is_pinned"
                icon="mdi-pin"
                color="warning"
                size="15"
            /></RouterLink>
          </div>
          <div v-else class="agenda-empty">
            <v-icon icon="mdi-note-plus-outline" /><span
              >No personal notes yet.</span
            ><v-btn
              size="small"
              variant="text"
              :to="{ name: 'notes', query: { create: '1' } }"
              >Create one</v-btn
            >
          </div>
        </section>
      </aside>
    </div>

    <section class="attendance-panel">
      <header>
        <div>
          <span>Team presence</span
          ><strong>Who’s in and who’s out today</strong>
        </div>
        <v-tabs v-model="attendanceTab" color="primary" density="compact"
          ><v-tab value="in">In ({{ employeesInToday.length }})</v-tab
          ><v-tab value="out"
            >Out ({{ employeesOutToday.length }})</v-tab
          ></v-tabs
        >
      </header>
      <v-window v-model="attendanceTab">
        <v-window-item value="in"
          ><v-data-table
            :headers="inHeaders"
            :items="employeesInToday"
            :items-per-page="10"
            :loading="presenceLoading"
            no-data-text="No employees are currently clocked in."
            ><template #item.name="{ item }"
              ><div class="presence-person">
                <UserAvatar :user="item.user" :size="34" /><span
                  ><strong>{{ item.name }}</strong
                  ><small>{{
                    item.position || item.department || "Employee"
                  }}</small></span
                >
              </div></template
            ><template #item.status="{ item }"
              ><v-chip size="small" variant="tonal" color="success">{{
                presenceStatusLabel(item.status)
              }}</v-chip></template
            ></v-data-table
          ></v-window-item
        >
        <v-window-item value="out"
          ><v-data-table
            :headers="outHeaders"
            :items="employeesOutToday"
            :items-per-page="10"
            :loading="presenceLoading"
            no-data-text="Everyone is currently clocked in."
            ><template #item.name="{ item }"
              ><div class="presence-person">
                <UserAvatar :user="item.user" :size="34" /><span
                  ><strong>{{ item.name }}</strong
                  ><small>{{
                    item.position || item.department || "Employee"
                  }}</small></span
                >
              </div></template
            ><template #item.status="{ item }"
              ><v-chip
                size="small"
                variant="tonal"
                :color="presenceStatusColor(item.status)"
                >{{ presenceStatusLabel(item.status) }}</v-chip
              ></template
            ></v-data-table
          ></v-window-item
        >
      </v-window>
    </section>

    <v-dialog v-model="announcementDialog" max-width="700">
      <v-card v-if="selectedAnnouncement" rounded="xl"
        ><v-card-title class="dialog-title"
          ><v-avatar color="primary" variant="tonal"
            ><v-icon icon="mdi-bullhorn-outline"
          /></v-avatar>
          <div>
            <strong>{{ selectedAnnouncement.title }}</strong
            ><small>{{ formatDate(selectedAnnouncement.published_at) }}</small>
          </div>
          <v-spacer /><v-btn
            icon="mdi-close"
            variant="text"
            @click="announcementDialog = false" /></v-card-title
        ><v-divider /><v-card-text
          ><div
            class="announcement-content"
            v-html="sanitizedAnnouncementContent" /></v-card-text
      ></v-card>
    </v-dialog>

    <v-dialog v-model="eventDialog" max-width="560">
      <v-card v-if="selectedCalendarEvent" rounded="xl"
        ><v-card-title class="dialog-title"
          ><v-avatar
            :color="eventColorName(selectedCalendarEvent.type)"
            variant="tonal"
            ><v-icon :icon="eventIcon(selectedCalendarEvent.type)"
          /></v-avatar>
          <div>
            <strong>{{ selectedCalendarEvent.title }}</strong
            ><small>{{ eventDateLabel(selectedCalendarEvent) }}</small>
          </div>
          <v-spacer /><v-btn
            icon="mdi-close"
            variant="text"
            @click="eventDialog = false" /></v-card-title
        ><v-divider /><v-card-text class="event-detail"
          ><div>
            <span>Type</span
            ><strong>{{ eventLabel(selectedCalendarEvent.type) }}</strong>
          </div>
          <div v-if="selectedCalendarEvent.raw?.subtitle">
            <span>Details</span
            ><strong>{{ selectedCalendarEvent.raw.subtitle }}</strong>
          </div></v-card-text
        ><v-card-actions
          v-if="selectedCalendarEvent.type === 'meeting'"
          class="px-5 pb-5"
          ><v-spacer /><v-btn
            color="primary"
            class="text-none"
            prepend-icon="mdi-office-building-marker-outline"
            @click="$router.push({ name: 'workplace-hub' })"
            >Open Workplace Hub</v-btn
          ></v-card-actions
        ></v-card
      >
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import MonthlyCalendar, {
  CalendarEvent,
} from "@/components/MonthlyCalendar.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { useAuth } from "@/composables/useAuth";
import { useAppSettings } from "@/composables/useAppSettings";
import { usePermissions } from "@/composables/usePermissions";
import { usePlanEntitlements } from "@/composables/usePlanEntitlements";
import { dateKeyInTimeZone, formatTimeInTimeZone } from "@/utils/timezone";

const { authUser, getUser } = useAuth();
const { checkPermissions } = usePermissions();
const { hasFeature } = usePlanEntitlements();
const canViewReports = computed(() => checkPermissions("view-reports"));
const canUseNotes = computed(
  () => checkPermissions("view-notes") && hasFeature("notes"),
);
const analytics = ref<any>({
  headcount: 0,
  attendance_exceptions: 0,
  leave_days: 0,
  overtime_premium_hours: 0,
  payroll_net: 0,
  trends: [],
});
const analyticsExporting = ref(false);
const trendMaximum = computed(() =>
  Math.max(
    1,
    ...analytics.value.trends.flatMap((point: any) => [
      Number(point.attendance_exceptions),
      Number(point.overtime_hours),
    ]),
  ),
);
const trendHeight = (value: number) =>
  Number(value)
    ? `${Math.max(6, (Number(value) / trendMaximum.value) * 100)}%`
    : "0";
const { setting, loadAppSettings } = useAppSettings();
const companyTimezone = computed(() =>
  setting("organization.timezone", "Asia/Manila"),
);
const calendarLoading = ref(false);
const attendanceTab = ref("in");
const presence = ref<any[]>([]);
const announcements = ref<any[]>([]);
const recentNotes = ref<any[]>([]);
const recentNotesLoading = ref(false);
const calendarEvents = ref<CalendarEvent[]>([]);
const dailyQuote = ref({ text: "", theme: "" });
const announcementDialog = ref(false);
const eventDialog = ref(false);
const selectedAnnouncement = ref<any>(null);
const sanitizedAnnouncementContent = computed(() =>
  sanitizeHtml(selectedAnnouncement.value?.content ?? ""),
);
const selectedCalendarEvent = ref<CalendarEvent | null>(null);
const today = computed(() =>
  dateKeyInTimeZone(new Date(), companyTimezone.value),
);
const selectedDay = ref(today.value);
const calendarLegend = [
  { type: "meeting", label: "Meeting", color: "#5b8def" },
  { type: "leave", label: "Approved leave", color: "#8b6ccf" },
  { type: "announcement", label: "Announcement", color: "#e49a44" },
  { type: "holiday", label: "Workforce calendar", color: "#e05d6f" },
];
const longToday = computed(() =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: companyTimezone.value,
  }).format(new Date()),
);
const greeting = computed(() => {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: companyTimezone.value,
    }).format(new Date()),
  );
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
});
const selectedDayEvents = computed(() =>
  calendarEvents.value.filter(
    (event) => eventDateKey(event) === selectedDay.value,
  ),
);
const todayCalendarEvents = computed(() =>
  calendarEvents.value.filter((event) => eventDateKey(event) === today.value),
);
const selectedDayLabel = computed(() =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${selectedDay.value}T12:00:00`)),
);
const presenceLoading = computed(
  () => calendarLoading.value && !presence.value.length,
);
const employeesOnLeave = computed(
  () =>
    presence.value.filter((employee) => employee.status === "on_leave").length,
);
const presenceRows = computed(() =>
  presence.value.map((employee) => ({
    ...employee,
    id: employee.employee_id,
    name: employee.user?.full_name || "Unknown employee",
    time_in: formatTime(employee.time_in),
    time_out: formatTime(employee.time_out),
  })),
);
const employeesInToday = computed(() =>
  presenceRows.value.filter((employee) => employee.status === "in"),
);
const employeesOutToday = computed(() =>
  presenceRows.value.filter((employee) => employee.status !== "in"),
);
const inHeaders = [
  { title: "Employee", key: "name" },
  { title: "Employee No.", key: "employee_no" },
  { title: "Department", key: "department" },
  { title: "Time In", key: "time_in" },
  { title: "Status", key: "status" },
];
const outHeaders = [
  { title: "Employee", key: "name" },
  { title: "Employee No.", key: "employee_no" },
  { title: "Department", key: "department" },
  { title: "Last activity", key: "time_out" },
  { title: "Status", key: "status" },
];

function eventDateKey(event: CalendarEvent) {
  return event.all_day
    ? event.starts_at.slice(0, 10)
    : dateKeyInTimeZone(event.starts_at, companyTimezone.value);
}
function formatTime(value?: string | null) {
  return value ? formatTimeInTimeZone(value, companyTimezone.value) : "—";
}
function presenceStatusLabel(value: string) {
  return (
    (
      {
        in: "In",
        clocked_out: "Clocked out",
        on_leave: "On leave",
        not_clocked_in: "Not clocked in",
      } as Record<string, string>
    )[value] ?? "Out"
  );
}
function presenceStatusColor(value: string) {
  return (
    (
      {
        in: "success",
        clocked_out: "info",
        on_leave: "warning",
        not_clocked_in: "secondary",
      } as Record<string, string>
    )[value] ?? "secondary"
  );
}
function formatDate(value: string) {
  return value
    ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(
        [],
        { month: "short", day: "numeric" },
      )
    : "—";
}
function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));
}
function eventTime(value: string) {
  return formatTimeInTimeZone(value, companyTimezone.value, "en-PH");
}
function announcementExcerpt(html: string, length = 76) {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
function eventLabel(type?: string) {
  return (
    (
      {
        meeting: "Meeting",
        leave: "Approved leave",
        announcement: "Announcement",
        holiday: "Workforce calendar",
      } as any
    )[type ?? ""] ?? "Calendar item"
  );
}
function eventIcon(type?: string) {
  return (
    (
      {
        meeting: "mdi-account-group-outline",
        leave: "mdi-calendar-account-outline",
        announcement: "mdi-bullhorn-outline",
        holiday: "mdi-calendar-star",
      } as any
    )[type ?? ""] ?? "mdi-calendar-outline"
  );
}
function eventColorName(type?: string) {
  return (
    (
      {
        meeting: "primary",
        leave: "secondary",
        announcement: "warning",
        holiday: "error",
      } as any
    )[type ?? ""] ?? "primary"
  );
}
function eventDateLabel(event: CalendarEvent) {
  return event.all_day
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "full",
        timeZone: "UTC",
      }).format(new Date(`${event.starts_at.slice(0, 10)}T12:00:00Z`))
    : new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: companyTimezone.value,
      }).format(new Date(event.starts_at));
}
function openAnnouncement(announcement: any) {
  selectedAnnouncement.value = announcement;
  announcementDialog.value = true;
}
function openCalendarEvent(event: CalendarEvent) {
  if (event.type === "announcement") {
    const announcement = announcements.value.find(
      (item) => `announcement-${item.id}` === event.id,
    );
    if (announcement) return openAnnouncement(announcement);
  }
  selectedCalendarEvent.value = event;
  eventDialog.value = true;
}
async function loadCalendar(range: { from: string; to: string }) {
  calendarLoading.value = true;
  try {
    const response = await axios.get("/dashboard/overview", {
      params: range,
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    const data = response.data.data;
    dailyQuote.value = data.quote ?? dailyQuote.value;
    announcements.value = data.announcements ?? announcements.value;
    presence.value = data.presence ?? presence.value;
    calendarEvents.value = (data.events ?? []).map((event: any) => ({
      ...event,
      raw: event,
    }));
  } finally {
    calendarLoading.value = false;
  }
}

async function loadAnalytics() {
  if (!canViewReports.value) return;
  const response = await axios.get("/dashboard/analytics", {
    headers: { "X-Suppress-Success-Notification": "true" },
  });
  analytics.value = response.data.data ?? analytics.value;
}

function noteExcerpt(html: string, length = 72) {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function noteColor(color?: string) {
  return `rgb(var(--v-theme-${color || "primary"}))`;
}

async function loadRecentNotes() {
  if (!canUseNotes.value) return;
  recentNotesLoading.value = true;
  try {
    const response = await axios.get("/notes", {
      params: { limit: 3, archived: false },
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    recentNotes.value = response.data.data?.data ?? [];
  } finally {
    recentNotesLoading.value = false;
  }
}

async function exportAnalytics() {
  analyticsExporting.value = true;
  try {
    const response = await axios.get("/dashboard/analytics/export", {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dashboard-analytics.csv";
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    analyticsExporting.value = false;
  }
}

onMounted(async () => {
  const initialDay = selectedDay.value;
  await Promise.all([
    !authUser.value ? getUser() : Promise.resolve(),
    loadAppSettings(),
  ]);
  await Promise.all([loadAnalytics(), loadRecentNotes()]);
  if (selectedDay.value === initialDay) selectedDay.value = today.value;
});
</script>

<style scoped>
.dashboard-page {
  --panel-border: rgba(var(--v-theme-on-surface), 0.09);
  max-width: 1600px;
  margin-inline: auto;
}
.welcome-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.8fr);
  align-items: center;
  gap: 28px;
  overflow: hidden;
  margin-bottom: 20px;
  padding: 28px 30px;
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 22px;
  background: linear-gradient(
    120deg,
    rgba(var(--v-theme-primary), 0.15),
    rgba(var(--v-theme-surface), 0.98) 58%,
    rgba(var(--v-theme-secondary), 0.1)
  );
}
.analytics-panel {
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  padding: 20px;
  background: rgb(var(--v-theme-surface));
}
.analytics-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.analytics-panel header span,
.analytics-grid span {
  display: block;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.analytics-panel header strong {
  display: block;
  font-size: 1.05rem;
}
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.analytics-grid > div {
  padding: 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
}
.analytics-grid strong {
  display: block;
  margin-top: 5px;
  font-size: 1.22rem;
}
.trend-wrap {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--panel-border);
}
.trend-legend {
  display: flex;
  gap: 18px;
  justify-content: flex-end;
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.68);
}
.trend-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.trend-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.trend-chart {
  height: 145px;
  display: grid;
  grid-template-columns: repeat(14, minmax(20px, 1fr));
  gap: 7px;
  align-items: end;
  margin-top: 10px;
}
.trend-day {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
}
.trend-bars {
  height: 112px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
}
.trend-bars i {
  width: min(10px, 38%);
  border-radius: 4px 4px 0 0;
  transition: height 0.2s ease;
}
.trend-day small {
  margin-top: 5px;
  font-size: 0.62rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
}
.exceptions {
  background: rgb(var(--v-theme-warning));
}
.overtime {
  background: rgb(var(--v-theme-primary));
}
.welcome-panel:after {
  position: absolute;
  right: -80px;
  bottom: -110px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.07);
  content: "";
  pointer-events: none;
}
.welcome-copy,
.daily-focus {
  position: relative;
  z-index: 1;
}
.welcome-date {
  color: rgb(var(--v-theme-primary));
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.welcome-copy h1 {
  margin: 5px 0 3px;
  font-size: clamp(1.55rem, 2.4vw, 2rem);
  line-height: 1.2;
}
.welcome-copy p {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.88rem;
}
.daily-focus {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 17px 18px;
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(8px);
}
.daily-focus > .v-icon {
  color: rgb(var(--v-theme-primary));
}
.daily-focus > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.daily-focus span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.daily-focus blockquote {
  margin: 4px 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.5;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.metric-card {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
  padding: 17px 18px;
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
}
.metric-card > div {
  display: grid;
  grid-template-columns: 1fr auto;
  min-width: 0;
  flex: 1;
  align-items: center;
}
.metric-card span,
.metric-card small {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.7rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.metric-card span {
  font-weight: 650;
}
.metric-card strong {
  grid-row: span 2;
  font-size: 1.55rem;
  line-height: 1;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(310px, 0.65fr);
  align-items: start;
  gap: 16px;
}
.calendar-panel,
.agenda-card,
.announcements-card,
.notes-card,
.attendance-panel {
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
}
.calendar-panel :deep(.calendar-shell) {
  border-radius: 0;
  background: transparent;
}
.dashboard-sidebar {
  display: grid;
  gap: 16px;
}
.agenda-card > header,
.announcements-card > header,
.notes-card > header,
.attendance-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 18px 19px;
  border-bottom: 1px solid var(--panel-border);
}
.agenda-card header > div,
.announcements-card header > div,
.notes-card header > div:first-child,
.attendance-panel header > div {
  display: flex;
  flex-direction: column;
}
.agenda-card header span,
.announcements-card header span,
.notes-card header span,
.attendance-panel header span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.agenda-list,
.announcement-list {
  display: grid;
  padding: 8px;
}
.agenda-list button,
.announcement-list button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 0;
  border-radius: 11px;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.agenda-list button:hover,
.announcement-list button:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}
.agenda-list i {
  width: 5px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 5px;
}
.agenda-list button > div,
.announcement-list button > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.agenda-list strong,
.announcement-list strong {
  overflow: hidden;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.agenda-list span,
.announcement-list small {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.69rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.announcement-list button > span {
  width: 42px;
  flex: 0 0 auto;
  color: rgb(var(--v-theme-primary));
  font-size: 0.66rem;
  font-weight: 750;
}
.notes-card__actions {
  display: flex;
  align-items: center;
  gap: 3px;
}
.recent-notes {
  display: grid;
  padding: 8px;
}
.recent-notes a {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border-radius: 11px;
  color: inherit;
  text-decoration: none;
  transition: background 0.15s ease;
}
.recent-notes a:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}
.recent-notes i {
  width: 5px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 5px;
}
.recent-notes a > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.recent-notes strong,
.recent-notes span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-notes strong {
  font-size: 0.79rem;
}
.recent-notes span {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
}
.agenda-empty {
  display: flex;
  min-height: 130px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.76rem;
}
.agenda-empty .v-icon {
  opacity: 0.6;
}
.attendance-panel {
  margin-top: 16px;
}
.dialog-title {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 11px;
  padding: 18px;
  white-space: normal;
}
.dialog-title > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.dialog-title > .v-spacer {
  display: none;
}
.dialog-title > .v-btn {
  align-self: start;
  margin: -4px -4px 0 0;
}
.dialog-title strong {
  display: block;
  overflow-wrap: anywhere;
  font-size: 1rem;
  line-height: 1.35;
  white-space: normal;
}
.dialog-title small {
  margin-top: 3px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.73rem;
  line-height: 1.35;
  white-space: normal;
}
.event-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.event-detail > div {
  display: flex;
  flex-direction: column;
  padding: 13px;
  border-radius: 11px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.event-detail span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.69rem;
}
.event-detail strong {
  overflow-wrap: anywhere;
  line-height: 1.4;
  white-space: normal;
}
.announcement-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 9px;
}
.announcement-content :deep(ul),
.announcement-content :deep(ol) {
  padding-left: 24px;
}
.metric-card > .v-avatar {
  display: inline-flex;
  min-width: 40px;
  max-width: 40px;
  flex: 0 0 40px;
}
.metric-card > div:not(.v-avatar) {
  display: grid;
  grid-template-columns: 1fr auto;
  min-width: 0;
  flex: 1;
  align-items: center;
}
.metric-card span,
.metric-card small {
  font-size: 0.75rem;
}
.presence-person {
  display: flex;
  min-width: 220px;
  align-items: center;
  gap: 10px;
  padding-block: 4px;
}
.presence-person > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.presence-person strong {
  overflow: hidden;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.presence-person small {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attendance-panel :deep(.v-data-table__td) {
  font-size: 0.75rem;
}
.attendance-panel :deep(.v-data-table-header__content) {
  font-size: 0.7rem;
  font-weight: 750;
}
@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-sidebar {
    grid-template-columns: 1fr 1fr;
  }
  .analytics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 760px) {
  .welcome-panel {
    grid-template-columns: 1fr;
    padding: 22px;
  }
  .daily-focus {
    width: 100%;
  }
  .metric-grid,
  .dashboard-sidebar {
    grid-template-columns: 1fr;
  }
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .attendance-panel > header {
    align-items: flex-start;
    flex-direction: column;
  }
  .event-detail {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .welcome-panel {
    padding: 18px;
    border-radius: 18px;
  }
  .welcome-copy h1 {
    font-size: 1.4rem;
  }
  .metric-card {
    padding: 14px;
  }
}
</style>
