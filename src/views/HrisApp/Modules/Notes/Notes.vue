<template>
  <v-container fluid class="notes-page pa-0">
    <header class="notes-hero">
      <div class="notes-hero__copy">
        <div class="notes-hero__icon">
          <v-icon icon="mdi-note-multiple-outline" size="25" />
        </div>
        <div>
          <span>Personal workspace</span>
          <h1>My Notes</h1>
          <p>
            Capture private reminders, working context, and ideas that only you
            can see.
          </p>
        </div>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        size="large"
        class="text-none"
        @click="openEditor()"
        >New note</v-btn
      >
    </header>

    <section class="notes-summary" aria-label="Notes summary">
      <div>
        <v-icon icon="mdi-note-outline" color="primary" /><span
          >{{ pagination.total || items.length }}
          {{ showArchived ? "archived" : "active" }} notes</span
        >
      </div>
      <div>
        <v-icon icon="mdi-pin-outline" color="warning" /><span
          >{{ pinnedCount }} pinned</span
        >
      </div>
      <div>
        <v-icon icon="mdi-shape-outline" color="secondary" /><span
          >{{ categoryCount }} categories</span
        >
      </div>
    </section>

    <section class="notes-toolbar">
      <v-text-field
        v-model="search"
        placeholder="Search titles, content, or categories"
        prepend-inner-icon="mdi-magnify"
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        class="notes-search"
      />
      <v-btn-toggle
        v-model="showArchived"
        color="primary"
        density="comfortable"
        mandatory
        variant="outlined"
        ><v-btn :value="false" prepend-icon="mdi-note-multiple-outline"
          >Active</v-btn
        ><v-btn :value="true" prepend-icon="mdi-archive-outline"
          >Archived</v-btn
        ></v-btn-toggle
      >
    </section>

    <div v-if="loading" class="notes-grid">
      <v-skeleton-loader
        v-for="index in 6"
        :key="index"
        type="article, actions"
        class="note-skeleton"
      />
    </div>
    <section v-else-if="items.length" class="notes-grid">
      <article
        v-for="note in items"
        :key="note.id"
        class="note-card"
        :style="{ '--note-color': noteColor(note.color) }"
        tabindex="0"
        role="button"
        @click="openEditor(note, 'view')"
        @keydown.enter="openEditor(note, 'view')"
      >
        <div class="note-card__accent" />
        <header>
          <v-chip
            v-if="note.category"
            size="x-small"
            variant="tonal"
            :color="note.color"
            >{{ note.category }}</v-chip
          ><span v-else class="note-card__uncategorized">Uncategorized</span>
          <div class="note-card__controls">
            <v-btn
              :icon="note.is_pinned ? 'mdi-pin' : 'mdi-pin-outline'"
              :color="note.is_pinned ? 'warning' : undefined"
              variant="text"
              size="small"
              :title="note.is_pinned ? 'Unpin note' : 'Pin note'"
              @click.stop="togglePinned(note)"
            /><v-menu
              ><template #activator="{ props }"
                ><v-btn
                  v-bind="props"
                  icon="mdi-dots-horizontal"
                  variant="text"
                  size="small"
                  aria-label="Note actions"
                  @click.stop /></template
              ><v-list density="compact"
                ><v-list-item
                  prepend-icon="mdi-pencil-outline"
                  title="Edit"
                  @click="openEditor(note, 'edit')" /><v-list-item
                  :prepend-icon="
                    showArchived
                      ? 'mdi-archive-arrow-up-outline'
                      : 'mdi-archive-outline'
                  "
                  :title="showArchived ? 'Restore' : 'Archive'"
                  @click="toggleArchived(note)" /><v-divider /><v-list-item
                  prepend-icon="mdi-delete-outline"
                  title="Delete permanently"
                  base-color="error"
                  @click="removeNote(note)" /></v-list
            ></v-menu>
          </div>
        </header>
        <div class="note-card__body">
          <h2>{{ note.title }}</h2>
          <p>
            {{
              excerpt(note.content) ||
              "No content yet. Open this note to start writing."
            }}
          </p>
        </div>
        <footer>
          <span
            ><v-icon icon="mdi-clock-outline" size="14" />Updated
            {{ relativeDate(note.updated_at) }}</span
          ><v-icon icon="mdi-arrow-right" size="17" />
        </footer>
      </article>
    </section>

    <section v-else class="notes-empty">
      <div>
        <v-icon
          :icon="
            showArchived ? 'mdi-archive-off-outline' : 'mdi-note-plus-outline'
          "
          size="34"
        />
      </div>
      <h2>
        {{
          search
            ? "No matching notes"
            : showArchived
              ? "Archive is empty"
              : "Create your first note"
        }}
      </h2>
      <p>
        {{
          search
            ? "Try a different title, category, or keyword."
            : showArchived
              ? "Notes you archive will remain available here."
              : "Keep private reminders and working information close at hand."
        }}
      </p>
      <v-btn
        v-if="!showArchived && !search"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openEditor()"
        >Create a note</v-btn
      >
    </section>

    <v-pagination
      v-if="pagination.last_page > 1"
      v-model="page"
      :length="pagination.last_page"
      rounded="circle"
      class="mt-6"
    />

    <v-dialog v-model="editorOpen" max-width="780" :persistent="saving">
      <v-card class="note-editor" rounded="xl">
        <header class="note-editor__header">
          <div
            class="note-editor__mark"
            :style="{ background: noteColor(draft.color) }"
          >
            <v-icon
              :icon="
                editorMode === 'view'
                  ? 'mdi-note-text-outline'
                  : 'mdi-note-edit-outline'
              "
            />
          </div>
          <div>
            <span>{{
              editorMode === "create"
                ? "New private note"
                : editorMode === "edit"
                  ? "Edit private note"
                  : draft.category || "Private note"
            }}</span>
            <h2>
              {{
                editorMode === "view"
                  ? draft.title
                  : editorMode === "create"
                    ? "Capture something important"
                    : "Update your note"
              }}
            </h2>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            :disabled="saving"
            @click="closeEditor"
          />
        </header>

        <v-card-text v-if="editorMode === 'view'" class="note-view"
          ><div class="note-view__meta">
            <v-chip
              v-if="draft.category"
              :color="draft.color"
              variant="tonal"
              size="small"
              >{{ draft.category }}</v-chip
            ><span v-if="draft.is_pinned"
              ><v-icon icon="mdi-pin" size="15" color="warning" />Pinned</span
            ><span
              ><v-icon icon="mdi-clock-outline" size="15" />Updated
              {{ relativeDate(draft.updated_at) }}</span
            >
          </div>
          <RichTextEditor :model-value="draft.content" read-only />
          <div v-if="!draft.content" class="note-view__empty">
            This note has no content yet.
          </div></v-card-text
        >

        <v-card-text v-else class="note-editor__body"
          ><v-text-field
            v-model="draft.title"
            label="Title"
            placeholder="What do you want to remember?"
            variant="outlined"
            maxlength="255"
            counter
            autofocus /><v-text-field
            v-model="draft.category"
            label="Category"
            placeholder="For example: Payroll, Hiring, Follow-up"
            variant="outlined"
            maxlength="80"
            clearable />
          <div class="editor-label">Note color</div>
          <div class="color-picker">
            <button
              v-for="color in colors"
              :key="color.value"
              type="button"
              :class="{ selected: draft.color === color.value }"
              :style="{ '--swatch': noteColor(color.value) }"
              :aria-label="`Use ${color.label} color`"
              @click="draft.color = color.value"
            >
              <i /><span>{{ color.label }}</span
              ><v-icon
                v-if="draft.color === color.value"
                icon="mdi-check"
                size="15"
              />
            </button>
          </div>
          <div class="editor-label mt-5">Content</div>
          <RichTextEditor
            v-model="draft.content"
            placeholder="Write your note..." />
          <div class="editor-switches">
            <v-switch
              v-model="draft.is_pinned"
              color="warning"
              label="Pin this note"
              hide-details
            /><v-switch
              v-model="draft.is_archived"
              color="secondary"
              label="Move to archive"
              hide-details
            /></div
        ></v-card-text>

        <v-divider /><v-card-actions class="note-editor__actions"
          ><template v-if="editorMode === 'view'"
            ><v-btn
              :prepend-icon="
                draft.is_archived
                  ? 'mdi-archive-arrow-up-outline'
                  : 'mdi-archive-outline'
              "
              variant="text"
              @click="toggleArchived(draft, true)"
              >{{ draft.is_archived ? "Restore" : "Archive" }}</v-btn
            ><v-spacer /><v-btn
              variant="tonal"
              prepend-icon="mdi-pencil-outline"
              @click="editorMode = 'edit'"
              >Edit note</v-btn
            ></template
          ><template v-else
            ><v-spacer /><v-btn
              variant="text"
              :disabled="saving"
              @click="closeEditor"
              >Cancel</v-btn
            ><v-btn
              color="primary"
              prepend-icon="mdi-content-save-outline"
              :loading="saving"
              :disabled="!draft.title.trim()"
              @click="saveNote"
              >{{
                editorMode === "create" ? "Create note" : "Save changes"
              }}</v-btn
            ></template
          ></v-card-actions
        >
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import debounce from "lodash/debounce";
import RichTextEditor from "@/components/RIchTextEditor.vue";
import { useApi } from "@/composables/useApi";
import { useAppDialog } from "@/composables/useAppDialog";

type Note = {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  updated_at?: string;
};
const emptyNote = (): Note => ({
  id: "",
  title: "",
  content: "",
  category: "",
  color: "primary",
  is_pinned: false,
  is_archived: false,
});
const colors = [
  { label: "Blue", value: "primary" },
  { label: "Teal", value: "secondary" },
  { label: "Sky", value: "info" },
  { label: "Green", value: "success" },
  { label: "Amber", value: "warning" },
  { label: "Important", value: "error" },
];
const {
  items,
  loading,
  loadingActions,
  pagination,
  index,
  store,
  update,
  destroy,
} = useApi<Note>("/notes");
const { confirm } = useAppDialog();
const route = useRoute();
const router = useRouter();
const search = ref("");
const showArchived = ref(false);
const page = ref(1);
const editorOpen = ref(false);
const editorMode = ref<"create" | "edit" | "view">("create");
const draft = ref<Note>(emptyNote());
const saving = computed(() => loadingActions.value);
const pinnedCount = computed(
  () => items.value.filter((note) => note.is_pinned).length,
);
const categoryCount = computed(
  () => new Set(items.value.map((note) => note.category).filter(Boolean)).size,
);
const noteColor = (color: string) =>
  `rgb(var(--v-theme-${color || "primary"}))`;
const plainText = (html: string) =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const excerpt = (html: string, length = 180) => {
  const text = plainText(html);
  return text.length > length ? `${text.slice(0, length)}...` : text;
};
const relativeDate = (value?: string) => {
  if (!value) return "just now";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year:
      new Date(value).getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  }).format(new Date(value));
};
const payload = (note: Note) => ({
  title: note.title.trim(),
  content: note.content ?? "",
  category: note.category?.trim() || null,
  color: note.color,
  is_pinned: Boolean(note.is_pinned),
  is_archived: Boolean(note.is_archived),
});
const loadNotes = async () => {
  await index({
    page: page.value,
    limit: 12,
    search: search.value || undefined,
    archived: showArchived.value,
  });
};
const openEditor = (note?: Note, mode: "edit" | "view" = "edit") => {
  draft.value = note ? { ...note } : emptyNote();
  editorMode.value = note ? mode : "create";
  editorOpen.value = true;
};
const closeEditor = () => {
  if (!saving.value) editorOpen.value = false;
};
const saveNote = async () => {
  if (!draft.value.title.trim()) return;
  if (editorMode.value === "create") await store(payload(draft.value));
  else await update(draft.value.id, payload(draft.value));
  editorOpen.value = false;
  await loadNotes();
};
const togglePinned = async (note: Note) => {
  await update(note.id, payload({ ...note, is_pinned: !note.is_pinned }));
  await loadNotes();
};
const toggleArchived = async (note: Note, close = false) => {
  await update(note.id, payload({ ...note, is_archived: !note.is_archived }));
  if (close) editorOpen.value = false;
  await loadNotes();
};
const removeNote = async (note: Note) => {
  const accepted = await confirm({
    title: "Delete note permanently?",
    message: `${note.title} will be removed and cannot be recovered.`,
    confirmText: "Delete note",
    tone: "error",
  });
  if (!accepted) return;
  await destroy(note.id);
  await loadNotes();
};
const debouncedSearch = debounce(() => {
  page.value = 1;
  void loadNotes();
}, 300);
watch(search, debouncedSearch);
watch(showArchived, () => {
  page.value = 1;
  void loadNotes();
});
watch(page, loadNotes);
onMounted(async () => {
  await loadNotes();
  if (route.query.create === "1") openEditor();
  else if (route.query.open) {
    const note = items.value.find((item) => item.id === route.query.open);
    if (note) openEditor(note, "view");
  }
  if (route.query.create || route.query.open)
    await router.replace({ name: "notes" });
});
</script>

<style scoped>
.notes-page {
  max-width: 1500px;
  margin-inline: auto;
}
.notes-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.11),
    rgba(var(--v-theme-surface), 0.97)
  );
}
.notes-hero__copy {
  display: flex;
  align-items: center;
  gap: 15px;
}
.notes-hero__icon {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 14px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}
.notes-hero span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.notes-hero h1 {
  margin: 2px 0;
  font-size: 1.45rem;
}
.notes-hero p {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.82rem;
}
.notes-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  margin: 17px 2px;
}
.notes-summary > div {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.74rem;
}
.notes-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.notes-search {
  max-width: 520px;
}
.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}
.note-card {
  --note-color: rgb(var(--v-theme-primary));
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 245px;
  overflow: hidden;
  flex-direction: column;
  padding: 19px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 15px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.note-card:hover,
.note-card:focus-visible {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--note-color) 45%, transparent);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
  outline: 0;
}
.note-card__accent {
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: var(--note-color);
}
.note-card > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.note-card__uncategorized {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.67rem;
}
.note-card__controls {
  display: flex;
  align-items: center;
  margin-right: -7px;
}
.note-card__body {
  flex: 1;
  padding: 18px 2px 14px;
}
.note-card h2 {
  overflow: hidden;
  margin: 0 0 9px;
  font-size: 1.02rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.note-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.79rem;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
}
.note-card > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.075);
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.67rem;
}
.note-card > footer span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.note-skeleton {
  min-height: 245px;
  border-radius: 15px;
}
.notes-empty {
  display: flex;
  min-height: 340px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 40px;
  text-align: center;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 16px;
}
.notes-empty > div {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  margin-bottom: 15px;
  border-radius: 18px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
}
.notes-empty h2 {
  font-size: 1.05rem;
}
.notes-empty p {
  max-width: 430px;
  margin: 7px 0 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.8rem;
}
.note-editor {
  overflow: hidden;
}
.note-editor__header {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  padding: 20px 22px;
}
.note-editor__mark {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: white;
}
.note-editor__header > div:nth-child(2) {
  min-width: 0;
}
.note-editor__header span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.66rem;
  font-weight: 750;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.note-editor__header h2 {
  overflow: hidden;
  margin: 2px 0 0;
  font-size: 1.12rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.note-editor__body,
.note-view {
  padding: 12px 22px 24px !important;
}
.editor-label {
  margin: 2px 0 8px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
  font-weight: 750;
}
.color-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.color-picker button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 9px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
}
.color-picker button.selected {
  border-color: var(--swatch);
  background: color-mix(in srgb, var(--swatch) 9%, transparent);
}
.color-picker i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--swatch);
}
.color-picker span {
  flex: 1;
  text-align: left;
}
.editor-switches {
  display: flex;
  gap: 20px;
  margin-top: 14px;
}
.note-editor__actions {
  padding: 13px 18px !important;
}
.note-view__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 17px;
}
.note-view__meta > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
}
.note-view__empty {
  padding: 30px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.8rem;
}
@media (max-width: 1050px) {
  .notes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 680px) {
  .notes-hero,
  .notes-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .notes-hero > .v-btn {
    width: 100%;
  }
  .notes-search {
    max-width: none;
  }
  .notes-toolbar .v-btn-toggle {
    width: 100%;
  }
  .notes-toolbar .v-btn-toggle .v-btn {
    flex: 1;
  }
  .notes-grid {
    grid-template-columns: 1fr;
  }
  .color-picker {
    grid-template-columns: repeat(2, 1fr);
  }
  .editor-switches {
    flex-direction: column;
    gap: 0;
  }
  .note-editor__header {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    padding: 17px;
  }
  .note-editor__mark {
    width: 40px;
    height: 40px;
  }
  .note-editor__body,
  .note-view {
    padding: 10px 17px 20px !important;
  }
}
</style>
