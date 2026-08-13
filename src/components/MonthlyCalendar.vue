<template>
  <section class="calendar-shell" :class="{ 'calendar-shell--compact': compact }">
    <header class="calendar-header">
      <div>
        <span class="calendar-eyebrow">{{ compact ? 'Your schedule' : 'Schedule' }}</span>
        <h2>{{ monthLabel }}</h2>
      </div>
      <div class="calendar-controls">
        <v-btn size="small" variant="text" class="text-none" @click="goToday">Today</v-btn>
        <v-btn icon="mdi-chevron-left" size="small" variant="tonal" aria-label="Previous month" @click="moveMonth(-1)" />
        <v-btn icon="mdi-chevron-right" size="small" variant="tonal" aria-label="Next month" @click="moveMonth(1)" />
      </div>
    </header>

    <div class="calendar-weekdays" aria-hidden="true">
      <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
    </div>

    <div v-if="loading" class="calendar-loading">
      <v-skeleton-loader v-for="index in 14" :key="index" type="text" />
    </div>
    <div v-else class="calendar-grid">
      <div
        v-for="day in calendarDays"
        :key="day.key"
        role="button"
        tabindex="0"
        class="calendar-day"
        :class="{
          'calendar-day--outside': !day.currentMonth,
          'calendar-day--today': day.isToday,
          'calendar-day--selected': day.key === selectedDay,
        }"
        @click="selectDay(day.key)"
        @keydown.enter="selectDay(day.key)"
      >
        <span class="calendar-day__number">{{ day.date.getDate() }}</span>
        <span v-if="eventsFor(day.key).length" class="calendar-day__count">{{ eventsFor(day.key).length }}</span>
        <span class="calendar-day__events">
          <button
            v-for="event in eventsFor(day.key).slice(0, compact ? 2 : 3)"
            :key="event.id"
            type="button"
            class="calendar-event"
            :style="eventStyle(event)"
            :title="event.title"
            @click.stop="$emit('event-click', event)"
          >
            <span class="calendar-event__dot" />
            <span>{{ event.all_day ? event.title : `${eventTime(event.starts_at)} ${event.title}` }}</span>
          </button>
          <span v-if="eventsFor(day.key).length > (compact ? 2 : 3)" class="calendar-more">+{{ eventsFor(day.key).length - (compact ? 2 : 3) }} more</span>
        </span>
      </div>
    </div>

    <footer v-if="legend.length" class="calendar-legend">
      <span v-for="item in legend" :key="item.type"><i :style="{ background: item.color }" />{{ item.label }}</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

export type CalendarEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  all_day?: boolean;
  type?: string;
  color?: string;
  raw?: any;
};

const props = withDefaults(defineProps<{
  events: CalendarEvent[];
  loading?: boolean;
  compact?: boolean;
  initialDate?: string;
  legend?: Array<{ type: string; label: string; color: string }>;
}>(), { loading: false, compact: false, initialDate: "", legend: () => [] });

const emit = defineEmits<{
  (event: "range-change", range: { from: string; to: string }): void;
  (event: "event-click", calendarEvent: CalendarEvent): void;
  (event: "day-click", date: string): void;
}>();

const baseDate = props.initialDate ? new Date(`${props.initialDate}T12:00:00`) : new Date();
const visibleMonth = ref(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
const selectedDay = ref(localDateKey(baseDate));
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthLabel = computed(() => new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(visibleMonth.value));
const eventsByDay = computed(() => {
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of props.events) {
    const key = localDateKey(new Date(event.starts_at));
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }
  grouped.forEach((events) => events.sort((a, b) => Number(Boolean(b.all_day)) - Number(Boolean(a.all_day)) || new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()));
  return grouped;
});
const calendarDays = computed(() => {
  const first = visibleMonth.value;
  const mondayOffset = (first.getDay() + 6) % 7;
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + index);
    const key = localDateKey(date);
    return { date, key, currentMonth: date.getMonth() === first.getMonth(), isToday: key === localDateKey(new Date()) };
  });
});

function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function eventsFor(day: string) { return eventsByDay.value.get(day) ?? []; }
function eventTime(value: string) { return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function eventStyle(event: CalendarEvent) { return { "--calendar-event-color": event.color ?? "rgb(var(--v-theme-primary))" }; }
function selectDay(day: string) { selectedDay.value = day; emit("day-click", day); }
function emitRange() { const from = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth(), 1); const to = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 0); emit("range-change", { from: localDateKey(from), to: localDateKey(to) }); }
function moveMonth(amount: number) { visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + amount, 1); selectedDay.value = localDateKey(visibleMonth.value); emitRange(); }
function goToday() { const today = new Date(); visibleMonth.value = new Date(today.getFullYear(), today.getMonth(), 1); selectedDay.value = localDateKey(today); emitRange(); emit("day-click", selectedDay.value); }
onMounted(emitRange);
</script>

<style scoped>
.calendar-shell{overflow:hidden;border-radius:18px;background:rgb(var(--v-theme-surface))}.calendar-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px}.calendar-header h2{margin:2px 0 0;font-size:1.2rem;line-height:1.25}.calendar-eyebrow{color:rgb(var(--v-theme-primary));font-size:.66rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.calendar-controls{display:flex;align-items:center;gap:6px}.calendar-weekdays,.calendar-grid,.calendar-loading{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.calendar-weekdays{padding-inline:10px;border-top:1px solid rgba(var(--v-theme-on-surface),.08);background:rgba(var(--v-theme-on-surface),.018)}.calendar-weekdays span{padding:10px 6px;color:rgb(var(--v-theme-on-surface-variant));font-size:.65rem;font-weight:750;text-align:center;text-transform:uppercase}.calendar-grid{border-top:1px solid rgba(var(--v-theme-on-surface),.08);border-left:1px solid rgba(var(--v-theme-on-surface),.08)}.calendar-day{position:relative;min-width:0;min-height:116px;padding:9px;border:0;border-right:1px solid rgba(var(--v-theme-on-surface),.08);border-bottom:1px solid rgba(var(--v-theme-on-surface),.08);color:rgb(var(--v-theme-on-surface));background:rgb(var(--v-theme-surface));text-align:left;cursor:pointer;transition:background .15s ease}.calendar-day:hover{background:rgba(var(--v-theme-primary),.055)}.calendar-day:focus-visible{z-index:1;outline:2px solid rgb(var(--v-theme-primary));outline-offset:-2px}.calendar-day--outside{color:rgba(var(--v-theme-on-surface),.32);background:rgba(var(--v-theme-on-surface),.018)}.calendar-day--selected{box-shadow:inset 0 0 0 1px rgba(var(--v-theme-primary),.38);background:rgba(var(--v-theme-primary),.065)}.calendar-day__number{display:grid;width:27px;height:27px;place-items:center;border-radius:50%;font-size:.73rem;font-weight:750}.calendar-day--today .calendar-day__number{color:rgb(var(--v-theme-on-primary));background:rgb(var(--v-theme-primary));box-shadow:0 3px 10px rgba(var(--v-theme-primary),.25)}.calendar-day__count{display:none}.calendar-day__events{display:grid;gap:4px;margin-top:6px}.calendar-event{display:flex;min-width:0;align-items:center;gap:6px;padding:5px 6px;border:0;border-radius:7px;color:var(--calendar-event-color);background:color-mix(in srgb,var(--calendar-event-color) 13%,transparent);font:inherit;font-size:.65rem;font-weight:600;text-align:left;cursor:pointer}.calendar-event:hover{filter:saturate(1.15);background:color-mix(in srgb,var(--calendar-event-color) 19%,transparent)}.calendar-event>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.calendar-event__dot{width:5px;height:5px;flex:0 0 auto;border-radius:50%;background:var(--calendar-event-color)}.calendar-more{padding-left:6px;color:rgb(var(--v-theme-on-surface-variant));font-size:.62rem}.calendar-legend{display:flex;flex-wrap:wrap;gap:16px;padding:14px 20px;color:rgb(var(--v-theme-on-surface-variant));font-size:.69rem}.calendar-legend span{display:flex;align-items:center;gap:6px}.calendar-legend i{width:8px;height:8px;border-radius:50%}.calendar-loading{gap:10px;padding:22px}.calendar-shell--compact .calendar-day{min-height:96px}.calendar-shell--compact .calendar-event{font-size:.61rem}
@media(max-width:750px){.calendar-header{align-items:flex-start;padding:16px}.calendar-header h2{font-size:1.05rem}.calendar-controls{gap:2px}.calendar-weekdays{padding-inline:0}.calendar-weekdays span{padding-inline:2px;font-size:.57rem}.calendar-day{min-height:68px;padding:5px}.calendar-day__events{display:none}.calendar-day__count{position:absolute;right:6px;bottom:6px;display:grid;width:19px;height:19px;place-items:center;border-radius:50%;color:rgb(var(--v-theme-on-primary));background:rgb(var(--v-theme-primary));font-size:.58rem}.calendar-day__number{width:23px;height:23px}.calendar-shell--compact .calendar-day{min-height:62px}.calendar-legend{gap:10px;padding:12px 14px}}
</style>
