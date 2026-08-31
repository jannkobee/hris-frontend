<template>
  <v-container fluid class="hub-page">
    <header class="hub-header">
      <div class="d-flex align-center ga-3">
        <v-avatar color="primary" variant="tonal" size="48"
          ><v-icon icon="mdi-office-building-marker-outline"
        /></v-avatar>
        <div>
          <h1>Workplace Hub</h1>
          <p>
            Reserve rooms, run daily meetings, and keep decisions and follow-ups
            together.
          </p>
        </div>
      </div>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          v-if="canManageRooms"
          color="success"
          variant="tonal"
          prepend-icon="mdi-door-open"
          class="text-none"
          @click="openRoomForm()"
          >Add room</v-btn
        >
        <v-btn
          v-if="canCreate"
          color="success"
          prepend-icon="mdi-calendar-plus"
          class="text-none"
          @click="openMeetingForm()"
          >Schedule meeting</v-btn
        >
      </div>
    </header>

    <div class="summary-grid">
      <article>
        <v-icon icon="mdi-calendar-today-outline" color="primary" />
        <div>
          <span>Today's meetings</span><strong>{{ todayCount }}</strong>
        </div>
      </article>
      <article>
        <v-icon icon="mdi-clock-outline" color="info" />
        <div>
          <span>Upcoming</span><strong>{{ upcomingCount }}</strong>
        </div>
      </article>
      <article>
        <v-icon icon="mdi-checkbox-marked-circle-outline" color="success" />
        <div>
          <span>Open action items</span><strong>{{ openActionCount }}</strong>
        </div>
      </article>
      <article>
        <v-icon icon="mdi-door-open" color="warning" />
        <div>
          <span>Active rooms</span><strong>{{ activeRoomCount }}</strong>
        </div>
      </article>
    </div>

    <section class="hub-surface">
      <div class="hub-toolbar">
        <v-tabs v-model="tab" color="primary" density="comfortable">
          <v-tab value="today"
            ><v-icon start icon="mdi-calendar-today-outline" />Today</v-tab
          >
          <v-tab value="calendar"
            ><v-icon start icon="mdi-calendar-month-outline" />Calendar</v-tab
          >
          <v-tab value="upcoming"
            ><v-icon start icon="mdi-format-list-bulleted" />All meetings</v-tab
          >
          <v-tab value="rooms"
            ><v-icon start icon="mdi-door-open" />Rooms</v-tab
          >
        </v-tabs>
        <v-text-field
          v-model="search"
          :placeholder="tab === 'rooms' ? 'Search rooms' : 'Search meetings'"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="hub-search"
          @update:model-value="
            tab === 'rooms' ? debouncedLoadRooms() : debouncedLoadMeetings()
          "
        />
      </div>

      <v-window v-model="tab">
        <v-window-item value="today">
          <div v-if="loading" class="loading-grid">
            <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
          </div>
          <div v-else-if="visibleMeetings.length">
            <button
              v-if="nextMeeting"
              type="button"
              class="next-meeting"
              @click="openMeeting(nextMeeting)"
            >
              <div class="next-meeting__time">
                <span>Next meeting</span
                ><strong>{{ timeOnly(nextMeeting.starts_at) }}</strong>
              </div>
              <div class="next-meeting__copy">
                <span>{{ typeLabel(nextMeeting.type) }}</span
                ><strong>{{ nextMeeting.title }}</strong
                ><small
                  ><v-icon icon="mdi-door-open" size="15" />{{
                    nextMeeting.room?.name || "Online / no room"
                  }}<v-icon icon="mdi-account-group-outline" size="15" />{{
                    nextMeeting.attendees?.length || 0
                  }}
                  attendees</small
                >
              </div>
              <v-avatar color="primary" variant="tonal"
                ><v-icon icon="mdi-arrow-right"
              /></v-avatar>
            </button>
            <div v-if="todayListMeetings.length" class="meeting-list">
              <MeetingCard
                v-for="meeting in todayListMeetings"
                :key="meeting.id"
                :meeting="meeting"
                @open="openMeeting"
              />
            </div>
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-calendar-check-outline" size="52" /><strong
              >No meetings today</strong
            ><span
              >Your day is clear. Schedule a meeting when the team needs
              one.</span
            >
          </div>
        </v-window-item>

        <v-window-item value="calendar">
          <div class="calendar-wrap">
            <MonthlyCalendar
              :events="calendarEvents"
              :loading="loading"
              :legend="meetingLegend"
              @range-change="onCalendarRange"
              @event-click="openMeeting($event.raw)"
            />
          </div>
        </v-window-item>

        <v-window-item value="upcoming">
          <div class="filter-row">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="Status"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              @update:model-value="loadMeetings"
            />
            <v-text-field
              v-model="fromDate"
              type="date"
              label="From"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="loadMeetings"
            />
            <v-text-field
              v-model="toDate"
              type="date"
              label="To"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              @update:model-value="loadMeetings"
            />
          </div>
          <div v-if="loading" class="loading-grid">
            <v-skeleton-loader v-for="index in 4" :key="index" type="article" />
          </div>
          <div v-else-if="visibleMeetings.length" class="meeting-list">
            <MeetingCard
              v-for="meeting in visibleMeetings"
              :key="meeting.id"
              :meeting="meeting"
              @open="openMeeting"
            />
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-calendar-blank-outline" size="52" /><strong
              >No meetings found</strong
            ><span>Try another date range or schedule the first one.</span>
          </div>
        </v-window-item>

        <v-window-item value="rooms">
          <div v-if="roomsLoading" class="room-grid">
            <v-skeleton-loader v-for="index in 3" :key="index" type="card" />
          </div>
          <div v-else-if="rooms.length" class="room-grid">
            <article
              v-for="room in rooms"
              :key="room.id"
              class="room-card"
              :class="{ 'room-card--inactive': room.status === 'inactive' }"
            >
              <div class="room-card__top">
                <v-avatar
                  :color="room.status === 'active' ? 'primary' : 'default'"
                  variant="tonal"
                  ><v-icon icon="mdi-door-open"
                /></v-avatar>
                <div class="room-card__badges">
                  <v-chip v-if="room.code" size="x-small" variant="outlined">{{
                    room.code
                  }}</v-chip>
                  <v-chip
                    size="x-small"
                    :color="roomAvailabilityColor(room)"
                    variant="tonal"
                    >{{ roomAvailabilityLabel(room) }}</v-chip
                  >
                </div>
              </div>
              <div>
                <h3>{{ room.name }}</h3>
                <p>
                  {{
                    [room.location, room.floor].filter(Boolean).join(" · ") ||
                    "Location not specified"
                  }}
                </p>
              </div>
              <div class="room-facts">
                <span
                  ><v-icon icon="mdi-account-group-outline" size="17" />{{
                    room.capacity
                  }}
                  people</span
                ><span
                  ><v-icon icon="mdi-calendar-clock-outline" size="17" />{{
                    room.upcoming_meetings_count
                  }}
                  upcoming</span
                >
              </div>
              <div v-if="room.amenities?.length" class="amenities">
                <v-chip
                  v-for="amenity in room.amenities"
                  :key="amenity"
                  size="x-small"
                  variant="tonal"
                  >{{ amenity }}</v-chip
                >
              </div>
              <p v-if="room.description" class="room-description">
                {{ room.description }}
              </p>
              <div class="room-actions">
                <v-btn
                  v-if="canCreate && room.status === 'active'"
                  size="small"
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-calendar-plus"
                  class="text-none"
                  @click="bookRoom(room)"
                  >Book room</v-btn
                >
                <v-btn
                  v-if="canManageRooms"
                  size="small"
                  variant="text"
                  prepend-icon="mdi-pencil-outline"
                  class="text-none"
                  @click="openRoomForm(room)"
                  >Edit</v-btn
                ><v-btn
                  v-if="canManageRooms"
                  size="small"
                  variant="text"
                  color="error"
                  icon="mdi-delete-outline"
                  @click="removeRoom(room)"
                />
              </div>
            </article>
          </div>
          <div v-else class="empty-state">
            <v-icon icon="mdi-door-closed" size="52" /><strong
              >No rooms configured</strong
            ><span>Add bookable rooms so employees can reserve a space.</span>
          </div>
        </v-window-item>
      </v-window>
    </section>

    <v-dialog v-model="meetingFormDialog" max-width="820" scrollable>
      <v-card rounded="xl">
        <v-card-title class="dialog-header"
          ><v-avatar color="primary" variant="tonal" size="40"
            ><v-icon
              :icon="
                editingMeeting ? 'mdi-calendar-edit' : 'mdi-calendar-plus'
              "
          /></v-avatar>
          <div>
            <strong>{{
              editingMeeting ? "Edit meeting" : "Schedule a meeting"
            }}</strong
            ><small>Choose the time, participants, and room.</small>
          </div>
          <v-spacer /><v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="meetingFormDialog = false"
        /></v-card-title>
        <v-divider />
        <v-card-text class="meeting-form pa-5">
          <v-text-field
            v-model="meetingForm.title"
            label="Meeting title"
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="span-2"
          />
          <v-select
            v-model="meetingForm.type"
            label="Meeting type"
            :items="meetingTypes"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-select
            v-model="meetingForm.room_id"
            label="Room (optional)"
            :items="availableRoomOptions"
            :item-title="roomTitle"
            item-value="id"
            item-props="props"
            :loading="roomAvailabilityLoading"
            :hint="roomSelectionHint"
            persistent-hint
            density="compact"
            variant="outlined"
            hide-details="auto"
            clearable
          />
          <v-text-field
            v-model="meetingForm.starts_at"
            type="datetime-local"
            label="Starts"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-text-field
            v-model="meetingForm.ends_at"
            type="datetime-local"
            label="Ends"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-select
            v-if="!editingMeeting"
            v-model="meetingForm.recurrence"
            label="Repeat"
            :items="recurrenceOptions"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-text-field
            v-if="!editingMeeting && meetingForm.recurrence !== 'none'"
            v-model="meetingForm.recurrence_until"
            type="date"
            label="Repeat until"
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
          <v-select
            v-model="meetingForm.attendee_ids"
            label="Attendees"
            :items="people"
            item-title="full_name"
            item-value="id"
            chips
            closable-chips
            multiple
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="span-2"
          />
          <v-textarea
            v-model="meetingForm.agenda"
            label="Agenda"
            placeholder="Topics, objectives, and preparation notes"
            rows="4"
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="span-2"
          />
          <section class="meeting-links-editor span-2">
            <div class="meeting-links-editor__heading">
              <div>
                <v-icon icon="mdi-link-variant" color="primary" /><span
                  ><strong>Shared links</strong
                  ><small
                    >Video calls, working documents, boards, or other meeting
                    resources.</small
                  ></span
                >
              </div>
              <v-btn
                size="small"
                variant="tonal"
                prepend-icon="mdi-plus"
                class="text-none"
                @click="addMeetingLink"
                >Add link</v-btn
              >
            </div>
            <div v-if="meetingForm.links.length" class="meeting-link-fields">
              <article v-for="(link, index) in meetingForm.links" :key="index">
                <v-text-field
                  v-model="link.label"
                  label="Link name"
                  placeholder="e.g. Join video call"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                />
                <v-text-field
                  v-model="link.url"
                  label="Web address"
                  placeholder="https://..."
                  prepend-inner-icon="mdi-web"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                />
                <v-btn
                  icon="mdi-delete-outline"
                  color="error"
                  variant="text"
                  size="small"
                  :aria-label="`Remove link ${index + 1}`"
                  @click="removeMeetingLink(index)"
                />
              </article>
            </div>
            <p v-else>No shared links added.</p>
          </section>
        </v-card-text>
        <v-card-actions class="px-5 pb-5"
          ><v-spacer /><v-btn
            variant="text"
            class="text-none"
            @click="meetingFormDialog = false"
            >Cancel</v-btn
          ><v-btn
            :color="editingMeeting ? 'info' : 'success'"
            class="text-none"
            :loading="saving"
            :disabled="!meetingFormValid"
            @click="saveMeeting"
            >{{ editingMeeting ? "Save changes" : "Schedule meeting" }}</v-btn
          ></v-card-actions
        >
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog" max-width="1120" scrollable>
      <v-card v-if="selectedMeeting" rounded="xl">
        <v-card-title class="dialog-header detail-header">
          <v-avatar
            :color="typeColor(selectedMeeting.type)"
            variant="tonal"
            size="42"
            ><v-icon :icon="typeIcon(selectedMeeting.type)"
          /></v-avatar>
          <div>
            <strong>{{ selectedMeeting.title }}</strong
            ><small
              >{{ dateTime(selectedMeeting.starts_at) }} –
              {{ timeOnly(selectedMeeting.ends_at) }}</small
            >
          </div>
          <v-spacer /><v-chip
            :color="statusColor(selectedMeeting.status)"
            variant="tonal"
            size="small"
            class="text-capitalize"
            >{{ selectedMeeting.status.replace("_", " ") }}</v-chip
          ><v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="detailDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="detail-layout pa-5">
          <main class="detail-main">
            <section class="detail-section">
              <div class="section-heading">
                <v-icon icon="mdi-text-box-outline" color="primary" /><strong
                  >Agenda and notes</strong
                ><v-spacer /><v-btn
                  v-if="canManageSelected && !isClosedMeeting"
                  size="small"
                  variant="text"
                  prepend-icon="mdi-pencil-outline"
                  class="text-none"
                  @click="openMeetingForm(selectedMeeting)"
                  >Edit</v-btn
                >
              </div>
              <p class="preserve-lines">
                {{ selectedMeeting.agenda || "No agenda was added." }}
              </p>
            </section>

            <section class="detail-section">
              <div class="section-heading">
                <v-icon
                  icon="mdi-notebook-edit-outline"
                  color="primary"
                /><strong>Meeting minutes</strong><v-spacer /><v-btn
                  v-if="canManageSelected && !isClosedMeeting"
                  size="small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-content-save-outline"
                  class="text-none"
                  :loading="saving"
                  @click="saveNotes"
                  >Save notes</v-btn
                >
              </div>
              <v-textarea
                v-if="canManageSelected && !isClosedMeeting"
                v-model="minutesDraft"
                placeholder="Record discussion notes, conclusions, and context..."
                rows="6"
                density="compact"
                variant="outlined"
                hide-details
              />
              <p v-else class="preserve-lines">
                {{ selectedMeeting.minutes || "No meeting minutes recorded." }}
              </p>
              <v-combobox
                v-if="canManageSelected && !isClosedMeeting"
                v-model="decisionsDraft"
                label="Decisions"
                placeholder="Type a decision and press Enter"
                chips
                closable-chips
                multiple
                density="compact"
                variant="outlined"
                hide-details
                class="mt-3"
              />
              <div
                v-else-if="selectedMeeting.decisions?.length"
                class="decision-list"
              >
                <div
                  v-for="decision in selectedMeeting.decisions"
                  :key="decision"
                >
                  <v-icon
                    icon="mdi-check-circle-outline"
                    color="success"
                    size="18"
                  />{{ decision }}
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="section-heading">
                <v-icon
                  icon="mdi-checkbox-marked-circle-auto-outline"
                  color="primary"
                /><strong>Action items</strong><v-spacer /><v-btn
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  class="text-none"
                  @click="actionFormOpen = !actionFormOpen"
                  >Add item</v-btn
                >
              </div>
              <div v-if="actionFormOpen" class="action-form">
                <v-text-field
                  v-model="actionForm.title"
                  label="Action item"
                  density="compact"
                  variant="outlined"
                  hide-details
                /><v-select
                  v-model="actionForm.assigned_to"
                  label="Owner"
                  :items="meetingPeople"
                  item-title="full_name"
                  item-value="id"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                /><v-select
                  v-model="actionForm.priority"
                  label="Priority"
                  :items="priorityOptions"
                  density="compact"
                  variant="outlined"
                  hide-details
                /><v-text-field
                  v-model="actionForm.due_at"
                  type="datetime-local"
                  label="Due"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                /><v-btn
                  color="primary"
                  class="text-none"
                  :loading="savingAction"
                  :disabled="!actionForm.title"
                  @click="addAction"
                  >Add</v-btn
                >
              </div>
              <div
                v-if="selectedMeeting.action_items?.length"
                class="action-list"
              >
                <article
                  v-for="item in selectedMeeting.action_items"
                  :key="item.id"
                >
                  <v-btn
                    :icon="
                      item.status === 'completed'
                        ? 'mdi-checkbox-marked-circle'
                        : 'mdi-checkbox-blank-circle-outline'
                    "
                    :color="item.status === 'completed' ? 'success' : 'default'"
                    variant="text"
                    size="small"
                    @click="toggleAction(item)"
                  />
                  <div class="record-copy">
                    <strong
                      :class="{ completed: item.status === 'completed' }"
                      >{{ item.title }}</strong
                    ><small
                      >{{ item.assignee?.full_name || "Unassigned"
                      }}<template v-if="item.due_at">
                        · Due {{ dateTime(item.due_at) }}</template
                      ></small
                    >
                  </div>
                  <v-chip
                    size="x-small"
                    :color="priorityColor(item.priority)"
                    variant="tonal"
                    class="text-capitalize"
                    >{{ item.priority }}</v-chip
                  ><v-btn
                    v-if="canManageSelected || item.created_by === authUser?.id"
                    icon="mdi-delete-outline"
                    color="error"
                    variant="text"
                    size="x-small"
                    @click="removeAction(item)"
                  />
                </article>
              </div>
              <p v-else class="muted-copy">
                No follow-up work has been recorded.
              </p>
            </section>

            <section class="detail-section">
              <div class="section-heading">
                <v-icon icon="mdi-link-variant" color="primary" /><strong
                  >Shared links</strong
                ><v-spacer /><v-btn
                  v-if="canManageSelected && !isClosedMeeting"
                  size="small"
                  variant="text"
                  prepend-icon="mdi-pencil-outline"
                  class="text-none"
                  @click="openMeetingForm(selectedMeeting)"
                  >Manage</v-btn
                >
              </div>
              <div
                v-if="selectedMeeting.links?.length"
                class="shared-link-list"
              >
                <a
                  v-for="link in selectedMeeting.links"
                  :key="link.url"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  ><v-avatar color="primary" variant="tonal" size="34"
                    ><v-icon icon="mdi-open-in-new" size="18" /></v-avatar
                  ><span
                    ><strong>{{ link.label }}</strong
                    ><small>{{ linkHost(link.url) }}</small></span
                  ><v-icon icon="mdi-chevron-right" size="19"
                /></a>
              </div>
              <p v-else class="muted-copy">
                No meeting links have been shared.
              </p>
            </section>

            <section class="detail-section">
              <div class="section-heading">
                <v-icon icon="mdi-paperclip" color="primary" /><strong
                  >Important files</strong
                ><v-chip
                  v-if="selectedMeeting.attachments?.length"
                  size="x-small"
                  variant="tonal"
                  >{{ selectedMeeting.attachments.length }}</v-chip
                >
              </div>
              <div v-if="!isClosedMeeting" class="upload-row">
                <v-file-input
                  v-model="selectedFile"
                  label="Attach a file"
                  prepend-icon=""
                  prepend-inner-icon="mdi-paperclip"
                  density="compact"
                  variant="outlined"
                  hide-details
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.zip"
                /><v-btn
                  color="primary"
                  variant="tonal"
                  class="text-none"
                  :loading="uploading"
                  :disabled="!normalizedFile"
                  @click="uploadFile"
                  >Upload</v-btn
                >
              </div>
              <div v-if="selectedMeeting.attachments?.length" class="file-list">
                <article
                  v-for="file in selectedMeeting.attachments"
                  :key="file.id"
                >
                  <v-avatar color="primary" variant="tonal" size="34"
                    ><v-icon icon="mdi-file-outline" size="19"
                  /></v-avatar>
                  <div class="record-copy">
                    <strong>{{ file.original_name }}</strong
                    ><small
                      >{{ formatBytes(file.size) }} ·
                      {{ file.uploader?.full_name || "Former user" }}</small
                    >
                  </div>
                  <v-btn
                    icon="mdi-download-outline"
                    variant="text"
                    size="small"
                    @click="downloadFile(file)"
                  /><v-btn
                    v-if="
                      !isClosedMeeting &&
                      (canManageSelected || file.uploaded_by === authUser?.id)
                    "
                    icon="mdi-delete-outline"
                    color="error"
                    variant="text"
                    size="small"
                    @click="removeFile(file)"
                  />
                </article>
              </div>
              <p v-else-if="isClosedMeeting" class="muted-copy">
                No files were attached to this meeting.
              </p>
            </section>
          </main>

          <aside class="detail-aside">
            <div class="meeting-meta">
              <div>
                <v-icon icon="mdi-door-open" /><span>Room</span
                ><strong>{{
                  selectedMeeting.room?.name || "Online / no room"
                }}</strong>
              </div>
              <div>
                <v-icon icon="mdi-account-star-outline" /><span>Organizer</span
                ><strong>{{ selectedMeeting.organizer?.full_name }}</strong>
              </div>
              <div>
                <v-icon icon="mdi-account-group-outline" /><span>Attendees</span
                ><strong>{{ selectedMeeting.attendees?.length || 0 }}</strong>
              </div>
            </div>
            <section class="participants-card">
              <header>
                <span>Participants</span
                ><v-chip size="x-small" variant="tonal">{{
                  meetingPeople.length
                }}</v-chip>
              </header>
              <div class="attendee-list">
                <div v-for="person in meetingPeople" :key="person.id">
                  <UserAvatar :user="person" :size="32" /><span
                    ><strong>{{ person.full_name }}</strong
                    ><small>{{
                      person.id === selectedMeeting.organizer_id
                        ? "Organizer"
                        : "Attendee"
                    }}</small></span
                  >
                </div>
              </div>
            </section>
            <div v-if="canManageSelected" class="detail-actions">
              <v-btn
                v-if="!isClosedMeeting"
                color="success"
                prepend-icon="mdi-check-circle-outline"
                class="text-none"
                :loading="saving"
                @click="completeMeeting"
                >Complete meeting</v-btn
              ><v-btn
                v-if="!isClosedMeeting"
                color="error"
                variant="text"
                prepend-icon="mdi-calendar-remove-outline"
                class="text-none"
                @click="cancelMeeting"
                >Cancel meeting</v-btn
              >
            </div>
          </aside>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="roomDialog" max-width="640">
      <v-card rounded="xl"
        ><v-card-title class="dialog-header"
          ><v-avatar color="primary" variant="tonal" size="40"
            ><v-icon icon="mdi-door-open"
          /></v-avatar>
          <div>
            <strong>{{ editingRoom ? "Edit room" : "Add meeting room" }}</strong
            ><small>Define capacity, location, and available equipment.</small>
          </div>
          <v-spacer /><v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="roomDialog = false" /></v-card-title
        ><v-divider /><v-card-text class="meeting-form pa-5"
          ><v-text-field
            v-model="roomForm.name"
            label="Room name"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-text-field
            v-model="roomForm.code"
            label="Code"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-text-field
            v-model="roomForm.location"
            label="Location"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-text-field
            v-model="roomForm.floor"
            label="Floor"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-text-field
            v-model.number="roomForm.capacity"
            type="number"
            min="1"
            label="Capacity"
            density="compact"
            variant="outlined"
            hide-details="auto" /><v-select
            v-model="roomForm.status"
            label="Status"
            :items="['active', 'inactive']"
            density="compact"
            variant="outlined"
            hide-details /><v-combobox
            v-model="roomForm.amenities"
            label="Amenities"
            placeholder="Type an amenity and press Enter"
            chips
            closable-chips
            multiple
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="span-2" /><v-textarea
            v-model="roomForm.description"
            label="Description"
            rows="3"
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="span-2" /></v-card-text
        ><v-card-actions class="px-5 pb-5"
          ><v-spacer /><v-btn
            variant="text"
            class="text-none"
            @click="roomDialog = false"
            >Cancel</v-btn
          ><v-btn
            :color="editingRoom ? 'info' : 'success'"
            class="text-none"
            :loading="saving"
            :disabled="!roomForm.name || !roomForm.capacity"
            @click="saveRoom"
            >{{ editingRoom ? "Save changes" : "Create room" }}</v-btn
          ></v-card-actions
        ></v-card
      >
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import debounce from "lodash/debounce";
import axios from "@/plugins/axios";
import MonthlyCalendar, {
  CalendarEvent,
} from "@/components/MonthlyCalendar.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import { useAuth } from "@/composables/useAuth";
import { usePermissions } from "@/composables/usePermissions";
import { useAppDialog } from "@/composables/useAppDialog";

const { authUser } = useAuth();
const route = useRoute();
const { checkPermissions } = usePermissions();
const { confirm: confirmAction } = useAppDialog();
const canCreate = computed(() => checkPermissions("create-meetings"));
const canManageRooms = computed(() => checkPermissions("manage-meeting-rooms"));
const canManageCompany = computed(() =>
  checkPermissions("manage-company-meetings"),
);
const tab = ref(route.query.tab === "rooms" ? "rooms" : "today");
const loading = ref(false);
const roomsLoading = ref(false);
const roomAvailabilityLoading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const savingAction = ref(false);
const meetings = ref<any[]>([]);
const rooms = ref<any[]>([]);
const roomAvailability = ref<any[]>([]);
const people = ref<any[]>([]);
const selectedMeeting = ref<any>();
const editingMeeting = ref<any>();
const editingRoom = ref<any>();
const meetingFormDialog = ref(false);
const detailDialog = ref(false);
const roomDialog = ref(false);
const actionFormOpen = ref(false);
const selectedFile = ref<File | File[] | null>(null);
const search = ref("");
const statusFilter = ref<string | null>(null);
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const fromDate = ref(today);
const toDate = ref("");
const calendarRange = ref({ from: today, to: today });
const minutesDraft = ref("");
const decisionsDraft = ref<string[]>([]);
const meetingTypes = [
  { title: "Daily stand-up", value: "daily_standup" },
  { title: "Team meeting", value: "team_meeting" },
  { title: "Planning", value: "planning" },
  { title: "Review", value: "review" },
  { title: "One-on-one", value: "one_on_one" },
  { title: "Training", value: "training" },
  { title: "Other", value: "other" },
];
const recurrenceOptions = [
  { title: "Does not repeat", value: "none" },
  { title: "Every day", value: "daily" },
  { title: "Every weekday", value: "weekdays" },
  { title: "Every week", value: "weekly" },
];
const statusOptions = [
  { title: "Scheduled", value: "scheduled" },
  { title: "In progress", value: "in_progress" },
  { title: "Completed", value: "completed" },
  { title: "Cancelled", value: "cancelled" },
];
const priorityOptions = ["low", "normal", "high", "urgent"];

const emptyMeetingForm = () => {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  const end = new Date(start.getTime() + 30 * 60000);
  return {
    title: "",
    type: "daily_standup",
    room_id: null as string | null,
    starts_at: toInputDateTime(start),
    ends_at: toInputDateTime(end),
    recurrence: "none",
    recurrence_until: "",
    attendee_ids: [] as string[],
    agenda: "",
    links: [] as Array<{ label: string; url: string }>,
  };
};
const meetingForm = ref(emptyMeetingForm());
const roomForm = ref({
  name: "",
  code: "",
  location: "",
  floor: "",
  capacity: 4,
  amenities: [] as string[],
  description: "",
  status: "active",
});
const actionForm = ref({
  title: "",
  assigned_to: null as string | null,
  priority: "normal",
  status: "open",
  due_at: "",
});
const normalizedFile = computed(() =>
  Array.isArray(selectedFile.value)
    ? selectedFile.value[0]
    : selectedFile.value,
);
const meetingFormValid = computed(
  () =>
    meetingForm.value.title &&
    meetingForm.value.type &&
    validMeetingRange.value &&
    !selectedRoom.value?.props?.disabled &&
    meetingForm.value.links.every(
      (link) => link.label.trim() && /^https?:\/\//i.test(link.url.trim()),
    ) &&
    (!editingMeeting.value && meetingForm.value.recurrence !== "none"
      ? meetingForm.value.recurrence_until
      : true),
);
const visibleMeetings = computed(() => meetings.value);
const calendarEvents = computed<CalendarEvent[]>(() =>
  meetings.value.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    starts_at: meeting.starts_at,
    ends_at: meeting.ends_at,
    type: "meeting",
    color: meetingColor(meeting.type),
    raw: meeting,
  })),
);
const meetingLegend = [
  { type: "daily_standup", label: "Daily stand-up", color: "#5b8def" },
  { type: "planning", label: "Planning", color: "#4aa881" },
  { type: "review", label: "Review", color: "#e49a44" },
  { type: "other", label: "Other meeting", color: "#8b6ccf" },
];
const todayCount = computed(
  () =>
    meetings.value.filter(
      (item) =>
        localDate(item.starts_at) === today && item.status !== "cancelled",
    ).length,
);
const upcomingCount = computed(
  () =>
    meetings.value.filter(
      (item) =>
        new Date(item.starts_at) > new Date() && item.status === "scheduled",
    ).length,
);
const openActionCount = computed(
  () =>
    meetings.value
      .flatMap((item) => item.action_items ?? [])
      .filter((item) => item.status !== "completed").length,
);
const activeRoomCount = computed(
  () => rooms.value.filter((room) => room.status === "active").length,
);
const activeRooms = computed(() =>
  rooms.value.filter((room) => room.status === "active"),
);
const validMeetingRange = computed(() => {
  const start = new Date(meetingForm.value.starts_at);
  const end = new Date(meetingForm.value.ends_at);
  return !Number.isNaN(start.getTime()) && end > start;
});
const requiredRoomCapacity = computed(
  () => new Set(meetingForm.value.attendee_ids).size + 1,
);
const availableRoomOptions = computed(() => {
  const source = roomAvailability.value.length
    ? roomAvailability.value
    : activeRooms.value;
  return source.map((room) => ({
    ...room,
    props: {
      disabled:
        room.is_available === false ||
        Number(room.capacity) < requiredRoomCapacity.value,
    },
  }));
});
const selectedRoom = computed(() =>
  availableRoomOptions.value.find(
    (room) => room.id === meetingForm.value.room_id,
  ),
);
const roomSelectionHint = computed(() => {
  if (!validMeetingRange.value)
    return "Choose a valid start and end time to check availability.";
  if (roomAvailabilityLoading.value) return "Checking room availability...";
  if (selectedRoom.value?.is_available === false)
    return "This room is already booked for the selected time.";
  if (
    selectedRoom.value &&
    Number(selectedRoom.value.capacity) < requiredRoomCapacity.value
  )
    return `Choose a room for at least ${requiredRoomCapacity.value} people.`;
  const availableCount = availableRoomOptions.value.filter(
    (room) => !room.props.disabled,
  ).length;
  return `${availableCount} room${availableCount === 1 ? "" : "s"} available for ${requiredRoomCapacity.value} participant${requiredRoomCapacity.value === 1 ? "" : "s"}.`;
});
const canManageSelected = computed(
  () =>
    canManageCompany.value ||
    selectedMeeting.value?.organizer_id === authUser.value?.id,
);
const isClosedMeeting = computed(() =>
  ["completed", "cancelled"].includes(selectedMeeting.value?.status),
);
const meetingPeople = computed(() => {
  const organizer = selectedMeeting.value?.organizer;
  return [organizer, ...(selectedMeeting.value?.attendees ?? [])]
    .filter(Boolean)
    .filter(
      (person, index, list) =>
        list.findIndex((candidate) => candidate.id === person.id) === index,
    );
});
const nextMeeting = computed(
  () =>
    meetings.value
      .filter(
        (meeting) =>
          meeting.status === "scheduled" &&
          new Date(meeting.ends_at) > new Date(),
      )
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      )[0],
);
const todayListMeetings = computed(() =>
  visibleMeetings.value.filter(
    (meeting) => meeting.id !== nextMeeting.value?.id,
  ),
);

const MeetingCard = defineComponent({
  props: { meeting: { type: Object, required: true } },
  emits: ["open"],
  setup(props, { emit }) {
    return () =>
      h(
        "article",
        { class: "meeting-card", onClick: () => emit("open", props.meeting) },
        [
          h("div", { class: "meeting-time" }, [
            h("strong", timeOnly(props.meeting.starts_at)),
            h("span", timeOnly(props.meeting.ends_at)),
          ]),
          h("div", {
            class: "meeting-accent",
            style: {
              background: `rgb(var(--v-theme-${typeColor(props.meeting.type)}))`,
            },
          }),
          h("div", { class: "meeting-copy" }, [
            h("div", { class: "meeting-title" }, props.meeting.title),
            h(
              "span",
              `${typeLabel(props.meeting.type)} · ${props.meeting.room?.name || "Online / no room"}`,
            ),
          ]),
          h("div", { class: "meeting-attendees" }, [
            h("span", `${props.meeting.attendees?.length || 0} invited`),
            h("small", props.meeting.organizer?.full_name || ""),
          ]),
          h(
            "span",
            { class: `status-dot status-dot--${props.meeting.status}` },
            props.meeting.status.replace("_", " "),
          ),
        ],
      );
  },
});

async function loadMeetings() {
  loading.value = true;
  try {
    const params: any = { limit: 100, search: search.value || undefined };
    if (tab.value === "today") {
      params.from = today;
      params.to = today;
    } else if (tab.value === "calendar") {
      params.from = calendarRange.value.from;
      params.to = calendarRange.value.to;
    } else {
      params.from = fromDate.value || undefined;
      params.to = toDate.value || undefined;
      params.status = statusFilter.value || undefined;
    }
    const response = await axios.get("/workplace-hub/meetings", { params });
    meetings.value = response.data.data.data ?? [];
  } finally {
    loading.value = false;
  }
}
const debouncedLoadMeetings = debounce(loadMeetings, 300);
async function loadRooms() {
  roomsLoading.value = true;
  try {
    const response = await axios.get("/workplace-hub/rooms", {
      params: {
        include_inactive: canManageRooms.value ? 1 : 0,
        search: tab.value === "rooms" ? search.value || undefined : undefined,
      },
    });
    rooms.value = response.data.data ?? [];
  } finally {
    roomsLoading.value = false;
  }
}
const debouncedLoadRooms = debounce(loadRooms, 300);
async function loadRoomAvailability() {
  if (!meetingFormDialog.value || !validMeetingRange.value) {
    roomAvailability.value = [];
    return;
  }

  roomAvailabilityLoading.value = true;
  try {
    const response = await axios.get("/workplace-hub/rooms", {
      params: {
        starts_at: new Date(meetingForm.value.starts_at).toISOString(),
        ends_at: new Date(meetingForm.value.ends_at).toISOString(),
        ignore_meeting_id: editingMeeting.value?.id,
      },
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    roomAvailability.value = response.data.data ?? [];
  } finally {
    roomAvailabilityLoading.value = false;
  }
}
const debouncedLoadRoomAvailability = debounce(loadRoomAvailability, 250);
async function loadPeople() {
  const response = await axios.get("/workplace-hub/people");
  people.value = response.data.data ?? [];
}
function openMeetingForm(meeting?: any) {
  editingMeeting.value = meeting ?? null;
  meetingForm.value = meeting
    ? {
        title: meeting.title,
        type: meeting.type,
        room_id: meeting.room_id,
        starts_at: toInputDateTime(meeting.starts_at),
        ends_at: toInputDateTime(meeting.ends_at),
        recurrence: "none",
        recurrence_until: "",
        attendee_ids: meeting.attendees?.map((person: any) => person.id) ?? [],
        agenda: meeting.agenda ?? "",
        links: (meeting.links ?? []).map((link: any) => ({
          label: link.label,
          url: link.url,
        })),
      }
    : emptyMeetingForm();
  meetingFormDialog.value = true;
  void loadRoomAvailability();
}
function bookRoom(room: any) {
  openMeetingForm();
  meetingForm.value.room_id = room.id;
}
async function saveMeeting() {
  saving.value = true;
  try {
    const payload: any = {
      ...meetingForm.value,
      starts_at: new Date(meetingForm.value.starts_at).toISOString(),
      ends_at: new Date(meetingForm.value.ends_at).toISOString(),
    };
    if (editingMeeting.value) {
      delete payload.recurrence;
      delete payload.recurrence_until;
      await axios.put(
        `/workplace-hub/meetings/${editingMeeting.value.id}`,
        payload,
      );
    } else await axios.post("/workplace-hub/meetings", payload);
    meetingFormDialog.value = false;
    await Promise.all([loadMeetings(), loadRooms()]);
    if (detailDialog.value && editingMeeting.value) await refreshSelected();
  } finally {
    saving.value = false;
  }
}
async function openMeeting(meeting: any) {
  const response = await axios.get(`/workplace-hub/meetings/${meeting.id}`);
  selectedMeeting.value = response.data.data;
  minutesDraft.value = selectedMeeting.value.minutes ?? "";
  decisionsDraft.value = [...(selectedMeeting.value.decisions ?? [])];
  detailDialog.value = true;
}
async function refreshSelected() {
  if (!selectedMeeting.value) return;
  const response = await axios.get(
    `/workplace-hub/meetings/${selectedMeeting.value.id}`,
  );
  selectedMeeting.value = response.data.data;
  minutesDraft.value = selectedMeeting.value.minutes ?? "";
  decisionsDraft.value = [...(selectedMeeting.value.decisions ?? [])];
}
async function saveNotes() {
  saving.value = true;
  try {
    await axios.put(`/workplace-hub/meetings/${selectedMeeting.value.id}`, {
      ...meetingFormFromMeeting(selectedMeeting.value),
      minutes: minutesDraft.value,
      decisions: decisionsDraft.value,
    });
    await refreshSelected();
  } finally {
    saving.value = false;
  }
}
async function completeMeeting() {
  saving.value = true;
  try {
    await axios.post(
      `/workplace-hub/meetings/${selectedMeeting.value.id}/complete`,
      { minutes: minutesDraft.value, decisions: decisionsDraft.value },
    );
    await refreshSelected();
    await loadMeetings();
  } finally {
    saving.value = false;
  }
}
async function cancelMeeting() {
  if (
    !(await confirmAction({
      title: "Cancel meeting?",
      message:
        "The meeting will remain in the history with a cancelled status.",
      confirmText: "Cancel meeting",
      tone: "warning",
    }))
  )
    return;
  saving.value = true;
  try {
    await axios.put(`/workplace-hub/meetings/${selectedMeeting.value.id}`, {
      ...meetingFormFromMeeting(selectedMeeting.value),
      status: "cancelled",
    });
    await refreshSelected();
    await loadMeetings();
  } finally {
    saving.value = false;
  }
}
function meetingFormFromMeeting(meeting: any) {
  return {
    title: meeting.title,
    type: meeting.type,
    room_id: meeting.room_id,
    starts_at: meeting.starts_at,
    ends_at: meeting.ends_at,
    attendee_ids: meeting.attendees?.map((person: any) => person.id) ?? [],
    agenda: meeting.agenda,
    minutes: meeting.minutes,
    decisions: meeting.decisions,
    links: meeting.links ?? [],
  };
}
function addMeetingLink() {
  meetingForm.value.links.push({ label: "", url: "" });
}
function removeMeetingLink(index: number) {
  meetingForm.value.links.splice(index, 1);
}
async function uploadFile() {
  if (!normalizedFile.value) return;
  uploading.value = true;
  try {
    const payload = new FormData();
    payload.append("file", normalizedFile.value);
    await axios.post(
      `/workplace-hub/meetings/${selectedMeeting.value.id}/attachments`,
      payload,
    );
    selectedFile.value = null;
    await refreshSelected();
  } finally {
    uploading.value = false;
  }
}
async function downloadFile(file: any) {
  const response = await axios.get(
    `/workplace-hub/attachments/${file.id}/download`,
    {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    },
  );
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.original_name;
  link.click();
  URL.revokeObjectURL(url);
}
async function removeFile(file: any) {
  if (
    !(await confirmAction({
      title: "Remove attachment?",
      message: `Remove ${file.original_name}?`,
      confirmText: "Remove",
      tone: "error",
    }))
  )
    return;
  await axios.delete(`/workplace-hub/attachments/${file.id}`);
  await refreshSelected();
}
async function addAction() {
  savingAction.value = true;
  try {
    await axios.post(
      `/workplace-hub/meetings/${selectedMeeting.value.id}/action-items`,
      {
        ...actionForm.value,
        due_at: actionForm.value.due_at
          ? new Date(actionForm.value.due_at).toISOString()
          : null,
      },
    );
    actionForm.value = {
      title: "",
      assigned_to: null,
      priority: "normal",
      status: "open",
      due_at: "",
    };
    actionFormOpen.value = false;
    await refreshSelected();
  } finally {
    savingAction.value = false;
  }
}
async function toggleAction(item: any) {
  await axios.put(`/workplace-hub/action-items/${item.id}`, {
    title: item.title,
    description: item.description,
    assigned_to: item.assigned_to,
    priority: item.priority,
    status: item.status === "completed" ? "open" : "completed",
    due_at: item.due_at,
  });
  await refreshSelected();
  await loadMeetings();
}
async function removeAction(item: any) {
  if (
    !(await confirmAction({
      title: "Remove action item?",
      message: `Remove ${item.title}?`,
      confirmText: "Remove",
      tone: "error",
    }))
  )
    return;
  await axios.delete(`/workplace-hub/action-items/${item.id}`);
  await refreshSelected();
}
function openRoomForm(room?: any) {
  editingRoom.value = room ?? null;
  roomForm.value = room
    ? {
        name: room.name,
        code: room.code ?? "",
        location: room.location ?? "",
        floor: room.floor ?? "",
        capacity: Number(room.capacity),
        amenities: [...(room.amenities ?? [])],
        description: room.description ?? "",
        status: room.status,
      }
    : {
        name: "",
        code: "",
        location: "",
        floor: "",
        capacity: 4,
        amenities: [],
        description: "",
        status: "active",
      };
  roomDialog.value = true;
}
async function saveRoom() {
  saving.value = true;
  try {
    if (editingRoom.value)
      await axios.put(
        `/workplace-hub/rooms/${editingRoom.value.id}`,
        roomForm.value,
      );
    else await axios.post("/workplace-hub/rooms", roomForm.value);
    roomDialog.value = false;
    await loadRooms();
  } finally {
    saving.value = false;
  }
}
async function removeRoom(room: any) {
  if (
    !(await confirmAction({
      title: "Remove room?",
      message: `Remove ${room.name}? Rooms with meeting history must be marked inactive instead.`,
      confirmText: "Remove",
      tone: "error",
    }))
  )
    return;
  await axios.delete(`/workplace-hub/rooms/${room.id}`);
  await loadRooms();
}

function toInputDateTime(value: string | Date) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function timeOnly(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
function localDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function typeLabel(value: string) {
  return meetingTypes.find((item) => item.value === value)?.title ?? value;
}
function typeIcon(value: string) {
  return (
    (
      {
        daily_standup: "mdi-account-group-outline",
        one_on_one: "mdi-account-multiple-outline",
        training: "mdi-school-outline",
        planning: "mdi-chart-timeline-variant",
      } as any
    )[value] ?? "mdi-calendar-text-outline"
  );
}
function typeColor(value: string) {
  return (
    (
      {
        daily_standup: "primary",
        planning: "info",
        review: "warning",
        training: "success",
      } as any
    )[value] ?? "primary"
  );
}
function statusColor(value: string) {
  return (
    (
      {
        scheduled: "info",
        in_progress: "warning",
        completed: "success",
        cancelled: "error",
      } as any
    )[value] ?? "default"
  );
}
function priorityColor(value: string) {
  return (
    (
      {
        low: "default",
        normal: "info",
        high: "warning",
        urgent: "error",
      } as any
    )[value] ?? "default"
  );
}
function meetingColor(value: string) {
  return (
    (
      {
        daily_standup: "#5b8def",
        planning: "#4aa881",
        review: "#e49a44",
        training: "#38a3a5",
        one_on_one: "#d06f9b",
      } as any
    )[value] ?? "#8b6ccf"
  );
}
function roomTitle(room: any) {
  const capacity = `${room.capacity} people`;
  if (Number(room.capacity) < requiredRoomCapacity.value)
    return `${room.name} · ${capacity} · Too small`;
  if (room.is_available === false) return `${room.name} · ${capacity} · Booked`;
  return `${room.name} · ${capacity}`;
}
function roomAvailabilityLabel(room: any) {
  if (room.status !== "active") return "Inactive";
  if (room.is_available === false)
    return room.busy_until ? `Busy until ${timeOnly(room.busy_until)}` : "Busy";
  return "Available now";
}
function roomAvailabilityColor(room: any) {
  if (room.status !== "active") return "default";
  return room.is_available === false ? "warning" : "success";
}
function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
function linkHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function onCalendarRange(range: { from: string; to: string }) {
  calendarRange.value = range;
  if (tab.value === "calendar") loadMeetings();
}
watch(tab, () => {
  search.value = "";
  tab.value === "rooms" ? loadRooms() : loadMeetings();
});
watch(
  () => route.query.tab,
  (value) => {
    if (["today", "calendar", "upcoming", "rooms"].includes(String(value))) {
      tab.value = String(value);
    }
  },
);
watch(
  () => [
    meetingForm.value.starts_at,
    meetingForm.value.ends_at,
    meetingFormDialog.value,
  ],
  () => debouncedLoadRoomAvailability(),
);
onMounted(() => Promise.all([loadMeetings(), loadRooms(), loadPeople()]));
</script>

<style scoped>
.hub-page {
  --hub-border: rgba(var(--v-theme-on-surface), 0.09);
  max-width: 1600px;
  margin-inline: auto;
}
.hub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 22px 24px;
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
  border-radius: 20px;
  background: linear-gradient(
    120deg,
    rgba(var(--v-theme-primary), 0.12),
    rgb(var(--v-theme-surface)) 62%,
    rgba(var(--v-theme-secondary), 0.07)
  );
}
.hub-header h1 {
  margin: 0;
  font-size: 1.65rem;
  line-height: 1.2;
}
.hub-header p {
  margin: 4px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.85rem;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.summary-grid article {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 17px 18px;
  border: 1px solid var(--hub-border);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
}
.summary-grid article > .v-icon {
  padding: 10px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.08);
}
.summary-grid article > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.summary-grid span {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.71rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.summary-grid strong {
  font-size: 1.45rem;
  line-height: 1.2;
}
.hub-surface {
  overflow: hidden;
  border: 1px solid var(--hub-border);
  border-radius: 19px;
  background: rgb(var(--v-theme-surface));
}
.hub-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--hub-border);
  background: rgba(var(--v-theme-on-surface), 0.012);
}
.hub-toolbar :deep(.v-tab) {
  min-width: auto;
  border-radius: 10px;
  font-size: 0.76rem;
  text-transform: none;
}
.hub-search {
  max-width: 330px;
}
.calendar-wrap {
  padding: 16px;
}
.calendar-wrap :deep(.calendar-shell) {
  border: 1px solid var(--hub-border);
}
.next-meeting {
  display: flex;
  width: calc(100% - 32px);
  align-items: center;
  gap: 20px;
  margin: 16px 16px 2px;
  padding: 19px 21px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 16px;
  color: rgb(var(--v-theme-on-surface));
  background: linear-gradient(
    115deg,
    rgba(var(--v-theme-primary), 0.16),
    rgba(var(--v-theme-primary), 0.035)
  );
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}
.next-meeting:hover {
  background: linear-gradient(
    115deg,
    rgba(var(--v-theme-primary), 0.21),
    rgba(var(--v-theme-primary), 0.06)
  );
}
.next-meeting__time,
.next-meeting__copy {
  display: flex;
  flex-direction: column;
}
.next-meeting__time {
  min-width: 100px;
}
.next-meeting__time span,
.next-meeting__copy span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.next-meeting__time strong {
  font-size: 1.3rem;
}
.next-meeting__copy {
  min-width: 0;
  flex: 1;
}
.next-meeting__copy > strong {
  overflow: hidden;
  font-size: 1.02rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.next-meeting__copy small {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
}
.next-meeting__copy small .v-icon:nth-of-type(2) {
  margin-left: 9px;
}
.filter-row {
  display: grid;
  grid-template-columns: 220px 180px 180px;
  gap: 11px;
  padding: 16px;
  border-bottom: 1px solid var(--hub-border);
}
.meeting-list {
  display: grid;
  gap: 9px;
  padding: 16px;
}
.meeting-card {
  display: grid;
  grid-template-columns: 88px 4px minmax(240px, 1fr) minmax(130px, 0.35fr) auto;
  align-items: center;
  gap: 15px;
  padding: 15px 16px;
  border: 1px solid var(--hub-border);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.meeting-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.28);
}
.meeting-time,
.meeting-copy,
.meeting-attendees {
  display: flex;
  flex-direction: column;
}
.meeting-time strong {
  font-size: 0.86rem;
}
.meeting-time span,
.meeting-copy span,
.meeting-attendees span,
.meeting-attendees small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.71rem;
}
.meeting-title {
  font-size: 0.84rem;
  font-weight: 750;
}
.meeting-accent {
  width: 4px;
  height: 42px;
  border-radius: 4px;
}
.status-dot {
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-size: 0.67rem;
  text-transform: capitalize;
}
.status-dot--completed {
  color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.11);
}
.status-dot--cancelled {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.1);
}
.room-grid,
.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 16px;
}
.room-card {
  display: flex;
  min-height: 225px;
  flex-direction: column;
  gap: 13px;
  padding: 18px;
  border: 1px solid var(--hub-border);
  border-radius: 15px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.15s ease;
}
.room-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.22);
}
.room-card--inactive {
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.room-card__top,
.room-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.room-card__badges,
.room-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.room-card h3 {
  margin: 0;
  font-size: 0.95rem;
}
.room-card > div > p {
  margin: 3px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.77rem;
}
.room-description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.73rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.room-facts {
  display: flex;
  gap: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.74rem;
}
.room-facts span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.room-actions {
  justify-content: flex-start;
  margin-top: auto;
}
.room-actions .v-btn:last-child {
  margin-left: auto;
}
.empty-state {
  display: flex;
  min-height: 330px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  padding: 24px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
}
.dialog-header {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 18px 20px;
}
.dialog-header > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.dialog-header small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.75rem;
}
.meeting-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.span-2 {
  grid-column: 1/-1;
}
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
}
.detail-main {
  display: grid;
  gap: 13px;
}
.detail-section {
  padding: 16px;
  border: 1px solid var(--hub-border);
  border-radius: 13px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 11px;
}
.preserve-lines {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.82rem;
  white-space: pre-wrap;
}
.decision-list {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}
.decision-list div {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 0.8rem;
}
.action-form {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 170px 110px 180px auto;
  gap: 8px;
  margin-bottom: 12px;
}
.action-list {
  display: grid;
  gap: 7px;
}
.action-list article,
.file-list article {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px;
  border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.action-list article > .record-copy,
.file-list article > .record-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.file-list article > .v-avatar {
  width: 34px !important;
  min-width: 34px !important;
  height: 34px !important;
  flex: 0 0 34px !important;
}
.action-list small,
.file-list small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.69rem;
}
.completed {
  text-decoration: line-through;
  color: rgb(var(--v-theme-on-surface-variant));
}
.muted-copy {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.78rem;
}
.upload-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
}
.file-list {
  display: grid;
  gap: 7px;
  margin-top: 10px;
}
.file-list strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-aside {
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.meeting-meta,
.participants-card {
  display: grid;
  gap: 2px;
  padding: 12px;
  border: 1px solid var(--hub-border);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.meeting-meta > div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0 8px;
  padding: 9px;
}
.meeting-meta .v-icon {
  grid-row: span 2;
  color: rgb(var(--v-theme-primary));
}
.meeting-meta span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
}
.meeting-meta strong {
  font-size: 0.78rem;
}
.participants-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 7px 10px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.69rem;
  font-weight: 750;
  text-transform: uppercase;
}
.attendee-list {
  display: grid;
  gap: 4px;
}
.attendee-list > div {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px;
  border-radius: 9px;
  font-size: 0.76rem;
}
.attendee-list > div:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}
.attendee-list > div > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.attendee-list strong {
  overflow: hidden;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attendee-list small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.65rem;
}
.detail-actions {
  display: grid;
  gap: 5px;
  margin-top: auto;
}
.meeting-links-editor {
  padding: 14px;
  border: 1px solid var(--hub-border);
  border-radius: 13px;
  background: rgba(var(--v-theme-on-surface), 0.018);
}
.meeting-links-editor__heading,
.meeting-links-editor__heading > div {
  display: flex;
  align-items: center;
  gap: 9px;
}
.meeting-links-editor__heading {
  justify-content: space-between;
}
.meeting-links-editor__heading span {
  display: flex;
  flex-direction: column;
}
.meeting-links-editor__heading small,
.meeting-links-editor > p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.7rem;
}
.meeting-links-editor > p {
  margin: 10px 0 0;
}
.meeting-link-fields {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
.meeting-link-fields article {
  display: grid;
  grid-template-columns: minmax(150px, 0.45fr) minmax(240px, 1fr) auto;
  align-items: start;
  gap: 8px;
}
.shared-link-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.shared-link-list a {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--hub-border);
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}
.shared-link-list a:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.06);
}
.shared-link-list a > span {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.shared-link-list strong,
.shared-link-list small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.shared-link-list strong {
  font-size: 0.76rem;
}
.shared-link-list small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.66rem;
}
:deep(.meeting-card .meeting-time),
:deep(.meeting-card .meeting-copy),
:deep(.meeting-card .meeting-attendees) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
:deep(.meeting-card .meeting-time strong) {
  font-size: 0.86rem;
  line-height: 1.3;
}
:deep(.meeting-card .meeting-time span),
:deep(.meeting-card .meeting-copy span),
:deep(.meeting-card .meeting-attendees span),
:deep(.meeting-card .meeting-attendees small) {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
  line-height: 1.35;
}
:deep(.meeting-card .meeting-title) {
  overflow: hidden;
  font-size: 0.86rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.meeting-card .meeting-accent) {
  width: 4px;
  height: 42px;
  border-radius: 4px;
}
:deep(.meeting-card .status-dot) {
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-size: 0.68rem;
  text-transform: capitalize;
}
:deep(.meeting-card .status-dot--completed) {
  color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.11);
}
:deep(.meeting-card .status-dot--cancelled) {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.1);
}
.summary-grid span {
  font-size: 0.76rem;
}
.summary-grid article > .v-icon {
  padding: 0;
  background: transparent;
}
@media (max-width: 1050px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .room-grid,
  .loading-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .meeting-card {
    grid-template-columns: 75px 4px 1fr auto;
  }
  :deep(.meeting-card .meeting-attendees) {
    display: none;
  }
  .detail-layout {
    grid-template-columns: 1fr;
  }
  .detail-aside {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .detail-actions {
    grid-column: 1/-1;
  }
  .action-form {
    grid-template-columns: 1fr 1fr;
  }
  .action-form .v-btn {
    grid-column: 1/-1;
  }
}
@media (max-width: 650px) {
  .hub-header,
  .hub-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .hub-toolbar {
    overflow-x: auto;
  }
  .summary-grid,
  .room-grid,
  .loading-grid,
  .meeting-form {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: 1;
  }
  .hub-search {
    max-width: none;
  }
  .filter-row {
    grid-template-columns: 1fr;
  }
  .meeting-card {
    grid-template-columns: 60px 4px 1fr;
  }
  .next-meeting {
    align-items: flex-start;
    gap: 10px;
  }
  .next-meeting__time {
    min-width: 78px;
  }
  .next-meeting > .v-avatar {
    display: none;
  }
  .status-dot {
    display: none;
  }
  .detail-aside {
    grid-template-columns: 1fr;
  }
  .action-form {
    grid-template-columns: 1fr;
  }
  .upload-row {
    grid-template-columns: 1fr;
  }
  .detail-header .v-chip {
    display: none;
  }
}
@media (max-width: 650px) {
  .meeting-link-fields article,
  .shared-link-list {
    grid-template-columns: 1fr;
  }
  .meeting-links-editor__heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .meeting-link-fields article > .v-btn {
    justify-self: end;
  }
}
</style>
