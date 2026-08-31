<template>
  <v-container fluid class="messages-page pa-0">
    <ModuleHeader
      eyebrow="Communication"
      title="Messages"
      subtitle="Connect with teammates and keep conversations moving."
      icon="mdi-message-text-outline"
    >
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-message-plus-outline"
          class="text-none"
          @click="openNewConversation"
          >New message</v-btn
        >
      </template>
    </ModuleHeader>

    <section
      class="messages-shell"
      :class="{ 'messages-shell--thread-open': activeConversation }"
    >
      <aside class="conversation-pane">
        <div class="conversation-pane__header">
          <div class="inbox-title">
            <strong>Inbox</strong
            ><v-chip size="x-small" variant="tonal">{{
              conversations.length
            }}</v-chip>
          </div>
          <v-text-field
            v-model="conversationSearch"
            class="conversation-search"
            placeholder="Search conversations"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
          />
        </div>

        <div class="conversation-list">
          <template v-if="loadingConversations">
            <div v-for="index in 6" :key="index" class="conversation-skeleton">
              <v-skeleton-loader type="avatar" /><v-skeleton-loader
                type="list-item-two-line"
              />
            </div>
          </template>
          <button
            v-for="conversation in filteredConversations"
            v-else
            :key="conversation.id"
            type="button"
            class="conversation-item"
            :class="{
              'conversation-item--active':
                activeConversation?.id === conversation.id,
              'conversation-item--unread': conversation.unread_count,
            }"
            @click="selectConversation(conversation)"
          >
            <UserAvatar
              :user="conversationAvatarUser(conversation)"
              :name="conversationTitle(conversation)"
              size="46"
            />
            <div class="conversation-copy">
              <div>
                <strong>{{ conversationTitle(conversation) }}</strong
                ><time v-if="conversation.latest_message?.created_at">{{
                  conversationListTime(conversation.latest_message.created_at)
                }}</time>
              </div>
              <p>{{ conversationPreview(conversation) }}</p>
            </div>
            <span v-if="conversation.unread_count" class="unread-count">{{
              conversation.unread_count > 99 ? "99+" : conversation.unread_count
            }}</span>
          </button>
          <div
            v-if="!loadingConversations && !filteredConversations.length"
            class="conversation-empty"
          >
            <v-icon
              :icon="
                conversationSearch
                  ? 'mdi-message-search-outline'
                  : 'mdi-message-plus-outline'
              "
              size="38"
            /><strong>{{
              conversationSearch
                ? "No conversations found"
                : "Your inbox is empty"
            }}</strong
            ><span>{{
              conversationSearch
                ? "Try another name or message."
                : "Start a conversation with a teammate."
            }}</span
            ><v-btn
              v-if="!conversationSearch"
              size="small"
              variant="tonal"
              class="text-none mt-2"
              @click="openNewConversation"
              >New message</v-btn
            >
          </div>
        </div>
      </aside>

      <main class="thread-pane">
        <template v-if="activeConversation">
          <header class="thread-header">
            <v-btn
              class="thread-back"
              icon="mdi-arrow-left"
              variant="text"
              size="small"
              aria-label="Back to conversations"
              @click="activeConversation = null"
            />
            <UserAvatar
              :user="conversationAvatarUser(activeConversation)"
              :name="conversationTitle(activeConversation)"
              size="42"
            />
            <div>
              <strong>{{ conversationTitle(activeConversation) }}</strong
              ><span>{{ participantSummary(activeConversation) }}</span>
            </div>
            <v-spacer />
            <v-btn
              icon="mdi-information-outline"
              variant="text"
              size="small"
              title="Conversation information"
              aria-label="Conversation information"
              @click="openConversationInfo"
            />
          </header>

          <div ref="scrollArea" class="thread-body">
            <div v-if="loadingMessages" class="message-loading">
              <v-progress-circular
                indeterminate
                color="primary"
                size="28"
                width="3"
              /><span>Loading conversation…</span>
            </div>
            <div v-else-if="!messages.length" class="thread-empty">
              <v-avatar color="primary" variant="tonal" size="62"
                ><v-icon icon="mdi-hand-wave-outline" size="30" /></v-avatar
              ><strong>Start the conversation</strong
              ><span
                >Send a message to
                {{ conversationTitle(activeConversation) }}.</span
              >
            </div>
            <template
              v-for="(message, index) in messages"
              v-else
              :key="message.id"
            >
              <div v-if="showDateDivider(message, index)" class="date-divider">
                <span>{{ messageDate(message.created_at) }}</span>
              </div>
              <div
                class="message-row"
                :class="{ 'message-row--own': isOwnMessage(message) }"
              >
                <UserAvatar
                  v-if="showSenderDetails(message, index)"
                  :user="message.sender"
                  :name="senderName(message)"
                  color="surface-variant"
                  variant="flat"
                  size="30"
                />
                <span
                  v-else-if="!isOwnMessage(message)"
                  class="message-avatar-spacer"
                  aria-hidden="true"
                />
                <div class="message-stack">
                  <span
                    v-if="showSenderDetails(message, index)"
                    class="message-sender"
                    >{{ senderName(message) }}</span
                  >
                  <div
                    v-if="message.attachments?.length"
                    class="message-attachments"
                  >
                    <MessageAttachment
                      v-for="attachment in message.attachments"
                      :key="attachment.id"
                      :attachment="attachment"
                      @preview="openImagePreview"
                    />
                  </div>
                  <div
                    v-if="message.body"
                    class="message-bubble"
                    :class="{ 'message-bubble--own': isOwnMessage(message) }"
                  >
                    <p>{{ message.body }}</p>
                    <time>{{ formatTime(message.created_at) }}</time>
                  </div>
                  <time v-else class="attachment-time">{{
                    formatTime(message.created_at)
                  }}</time>
                </div>
              </div>
            </template>
          </div>

          <footer class="composer-wrap">
            <div v-if="selectedFiles.length" class="pending-files">
              <div
                v-for="(file, index) in selectedFiles"
                :key="`${file.name}-${file.lastModified}`"
                class="pending-file"
              >
                <span class="pending-file__icon"
                  ><v-icon :icon="selectedFileIcon(file)" size="19"
                /></span>
                <span class="pending-file__copy"
                  ><strong>{{ file.name }}</strong
                  ><small>{{ formatSelectedFileSize(file.size) }}</small></span
                >
                <v-btn
                  icon="mdi-close"
                  variant="text"
                  size="x-small"
                  :aria-label="`Remove ${file.name}`"
                  @click="removeSelectedFile(index)"
                />
              </div>
            </div>
            <v-progress-linear
              v-if="sending && uploadProgress !== null"
              :model-value="uploadProgress"
              color="primary"
              height="3"
              rounded
            />
            <div class="composer">
              <input
                ref="attachmentInput"
                class="d-none"
                type="file"
                multiple
                :accept="attachmentAccept"
                @change="onAttachmentInput"
              />
              <v-btn
                v-if="attachmentsEnabled"
                icon="mdi-paperclip"
                color="primary"
                variant="text"
                size="small"
                :disabled="sending || selectedFiles.length >= 5"
                title="Attach files"
                aria-label="Attach files"
                @click="triggerAttachmentPicker"
              />
              <v-textarea
                v-model="newMessageBody"
                :placeholder="`Message ${conversationTitle(
                  activeConversation,
                )}`"
                rows="1"
                auto-grow
                max-rows="5"
                density="compact"
                variant="plain"
                hide-details
                @paste="onComposerPaste"
                @keydown.enter.exact.prevent="sendMessage"
              />
              <v-btn
                icon="mdi-send"
                color="primary"
                variant="flat"
                size="small"
                :loading="sending"
                :disabled="!canSendMessage"
                aria-label="Send message"
                @click="sendMessage"
              />
            </div>
            <span>{{
              attachmentsEnabled
                ? `Enter to send · Up to 5 files · ${maxAttachmentSizeMb} MB each`
                : "Enter to send · Shift + Enter for a new line"
            }}</span>
          </footer>
        </template>

        <div v-else class="thread-placeholder">
          <div class="placeholder-art">
            <v-icon icon="mdi-forum-outline" size="46" />
          </div>
          <strong>Your conversations</strong
          ><span>Select a conversation from the inbox or start a new one.</span
          ><v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-message-plus-outline"
            class="text-none mt-3"
            @click="openNewConversation"
            >Start a conversation</v-btn
          >
        </div>
      </main>
    </section>

    <v-dialog v-model="newConversationDialog" max-width="520">
      <v-card rounded="xl"
        ><v-card-title class="new-message-header"
          ><v-avatar color="primary" variant="tonal"
            ><v-icon icon="mdi-message-plus-outline"
          /></v-avatar>
          <div>
            <strong>New message</strong
            ><small>Choose a teammate to start a conversation.</small>
          </div>
          <v-spacer /><v-btn
            icon="mdi-close"
            variant="text"
            @click="newConversationDialog = false" /></v-card-title
        ><v-divider /><v-card-text class="pa-5"
          ><v-autocomplete
            v-model="selectedParticipantId"
            :items="teammates"
            :item-title="userLabel"
            item-value="id"
            label="Recipient"
            placeholder="Search by name or role"
            prepend-inner-icon="mdi-account-search-outline"
            :loading="loadingTeammates"
            no-data-text="No teammates available"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details="auto"
            ><template #item="{ props: itemProps, item }"
              ><v-list-item v-bind="itemProps" :subtitle="item.raw.email"
                ><template #prepend
                  ><UserAvatar
                    :user="item.raw"
                    :name="userLabel(item.raw)"
                    size="36" /></template></v-list-item></template></v-autocomplete></v-card-text
        ><v-card-actions class="px-5 pb-5"
          ><v-spacer /><v-btn
            variant="text"
            class="text-none"
            @click="newConversationDialog = false"
            >Cancel</v-btn
          ><v-btn
            color="primary"
            class="text-none"
            prepend-icon="mdi-arrow-right"
            :disabled="!selectedParticipantId"
            :loading="creatingConversation"
            @click="createConversation"
            >Start chat</v-btn
          ></v-card-actions
        ></v-card
      >
    </v-dialog>

    <v-dialog v-model="imagePreviewDialog" max-width="980">
      <v-card class="image-preview-dialog">
        <v-card-title class="image-preview-header">
          <v-icon icon="mdi-image-outline" color="primary" />
          <strong>{{ imagePreview?.name }}</strong>
          <v-spacer />
          <v-btn
            icon="mdi-download-outline"
            variant="text"
            size="small"
            aria-label="Download image"
            @click="downloadImagePreview"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Close image preview"
            @click="imagePreviewDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="image-preview-body">
          <v-img
            v-if="imagePreview"
            :src="imagePreview.url"
            :alt="imagePreview.name"
            height="76vh"
            contain
            eager
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="conversationInfoDialog" max-width="520" scrollable>
      <v-card class="conversation-info-dialog">
        <v-card-title class="conversation-info-header">
          <div class="conversation-info-header__icon">
            <v-icon icon="mdi-information-outline" size="21" />
          </div>
          <div>
            <strong>Conversation details</strong
            ><small>People, activity, and shared files.</small>
          </div>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Close conversation information"
            @click="conversationInfoDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="conversation-info-body">
          <div v-if="loadingConversationInfo" class="conversation-info-loading">
            <v-skeleton-loader
              type="list-item-avatar-two-line, article, list-item-three-line"
            />
          </div>
          <template v-else-if="conversationInfo">
            <div class="conversation-info-summary">
              <UserAvatar
                :user="conversationAvatarUser(conversationInfo)"
                :name="conversationTitle(conversationInfo)"
                size="58"
              />
              <div>
                <strong>{{ conversationTitle(conversationInfo) }}</strong
                ><span
                  >{{
                    conversationInfo.is_group
                      ? "Group conversation"
                      : "Direct conversation"
                  }}
                  · Started
                  {{
                    formatConversationDate(conversationInfo.created_at)
                  }}</span
                >
              </div>
            </div>

            <div class="conversation-info-metrics">
              <div>
                <v-icon icon="mdi-message-text-outline" /><strong>{{
                  conversationInfo.messages_count ?? 0
                }}</strong
                ><span>Messages</span>
              </div>
              <div>
                <v-icon icon="mdi-paperclip" /><strong>{{
                  conversationInfo.attachments_count ?? 0
                }}</strong
                ><span>Shared files</span>
              </div>
              <div>
                <v-icon icon="mdi-account-multiple-outline" /><strong>{{
                  conversationInfo.participants?.length ?? 0
                }}</strong
                ><span>People</span>
              </div>
            </div>

            <section class="conversation-info-section">
              <div class="conversation-info-section__title">
                <strong>Participants</strong
                ><span>{{ conversationInfo.participants?.length ?? 0 }}</span>
              </div>
              <div class="conversation-participants">
                <div
                  v-for="participant in conversationInfo.participants"
                  :key="participant.id"
                  class="conversation-participant"
                >
                  <UserAvatar
                    :user="participant"
                    :name="userDisplayName(participant)"
                    size="38"
                  />
                  <div>
                    <strong>{{ userDisplayName(participant) }}</strong
                    ><span>{{
                      participant.role?.name ||
                      participant.email ||
                      "Team member"
                    }}</span>
                  </div>
                  <v-chip
                    v-if="participant.id === authUser?.id"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    >You</v-chip
                  >
                </div>
              </div>
            </section>

            <section
              v-if="conversationInfo.recent_attachments?.length"
              class="conversation-info-section"
            >
              <div class="conversation-info-section__title">
                <strong>Recently shared</strong
                ><span>{{ conversationInfo.attachments_count }}</span>
              </div>
              <div class="conversation-shared-files">
                <button
                  v-for="attachment in conversationInfo.recent_attachments"
                  :key="attachment.id"
                  type="button"
                  class="conversation-shared-file"
                  @click="openSharedAttachment(attachment)"
                >
                  <span
                    ><v-icon :icon="attachmentIcon(attachment)" size="20"
                  /></span>
                  <div>
                    <strong>{{ attachment.original_name }}</strong
                    ><small
                      >{{ formatSelectedFileSize(attachment.size) }} ·
                      {{ attachment.is_image ? "Image" : "File" }}</small
                    >
                  </div>
                  <v-progress-circular
                    v-if="openingAttachmentId === attachment.id"
                    indeterminate
                    size="18"
                    width="2"
                  />
                  <v-icon
                    v-else
                    :icon="
                      attachment.is_image
                        ? 'mdi-eye-outline'
                        : 'mdi-download-outline'
                    "
                    size="18"
                  />
                </button>
              </div>
            </section>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, nextTick, onBeforeUnmount } from "vue";
import { getEcho } from "@/plugins/echo";
import { useAuth } from "@/composables/useAuth";
import axios from "@/plugins/axios";
import UserAvatar from "@/components/UserAvatar.vue";
import MessageAttachment from "@/components/MessageAttachment.vue";
import { userDisplayName } from "@/utils/userDisplay";
import { useAppSettings } from "@/composables/useAppSettings";
import { useNotification } from "@/composables/useNotification";
import { loadMessageAttachmentPreview } from "@/utils/messageAttachmentCache";

const { authUser } = useAuth();
const { values: appSettings } = useAppSettings();
const { showNotification } = useNotification();

const conversations = ref<any[]>([]);
const activeConversation = ref<any | null>(null);
const messages = ref<any[]>([]);
const newMessageBody = ref("");
const teammates = ref<any[]>([]);
const selectedParticipantId = ref<string | null>(null);
const newConversationDialog = ref(false);
const conversationSearch = ref("");
const selectedFiles = ref<File[]>([]);
const attachmentInput = ref<HTMLInputElement | null>(null);
const uploadProgress = ref<number | null>(null);
const imagePreviewDialog = ref(false);
const imagePreview = ref<{
  url: string;
  name: string;
  downloadUrl: string;
} | null>(null);
const conversationInfoDialog = ref(false);
const conversationInfo = ref<any | null>(null);
const loadingConversationInfo = ref(false);
const openingAttachmentId = ref<string | null>(null);

const loadingConversations = ref(false);
const loadingMessages = ref(false);
const sending = ref(false);
const loadingTeammates = ref(false);
const creatingConversation = ref(false);

const scrollArea = ref<HTMLElement | null>(null);
let currentChannelName: string | null = null;

const attachmentsEnabled = computed(
  () => appSettings.value["messaging.attachments_enabled"] !== false,
);
const maxAttachmentSizeMb = computed(() =>
  Number(appSettings.value["messaging.max_attachment_size_mb"] ?? 25),
);
const canSendMessage = computed(
  () =>
    Boolean(newMessageBody.value.trim() || selectedFiles.value.length) &&
    !sending.value,
);
const attachmentAccept =
  ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.mp3,.wav,.m4a,.mp4,.mov,.webm";

const filteredConversations = computed(() => {
  const query = conversationSearch.value.trim().toLowerCase();
  if (!query) return conversations.value;

  return conversations.value.filter((conversation) =>
    [conversationTitle(conversation), conversation.latest_message?.body]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)),
  );
});

const conversationTitle = (conversation: any) => {
  if (conversation.name?.trim()) return conversation.name.trim();

  const others = (conversation.participants ?? []).filter(
    (p: any) => p.id !== authUser.value?.id,
  );

  return (
    others.map((participant: any) => userDisplayName(participant)).join(", ") ||
    "Conversation"
  );
};

const conversationAvatarUser = (conversation: any) => {
  if (conversation?.is_group) return null;
  return (
    (conversation?.participants ?? []).find(
      (participant: any) => participant.id !== authUser.value?.id,
    ) ?? null
  );
};

const conversationPreview = (conversation: any) => {
  const latest = conversation.latest_message;
  if (!latest) return "Start the conversation";
  if (!latest.body && latest.attachments?.length) {
    return latest.attachments.length === 1
      ? "Sent an attachment"
      : `Sent ${latest.attachments.length} attachments`;
  }
  if (!latest.body) return "Start the conversation";
  return `${latest.sender?.id === authUser.value?.id ? "You: " : ""}${
    latest.body
  }`;
};

const userLabel = (user: any) =>
  `${userDisplayName(user, user.email)}${
    user.role?.name ? ` (${user.role.name})` : ""
  }`;

const isOwnMessage = (message: any) =>
  message.sender?.id === authUser.value?.id;

const senderName = (message: any) => userDisplayName(message.sender);

const showSenderDetails = (message: any, index: number) => {
  if (isOwnMessage(message)) return false;
  const previous = messages.value[index - 1];
  return (
    !previous ||
    previous.sender?.id !== message.sender?.id ||
    showDateDivider(message, index)
  );
};

const participantSummary = (conversation: any) => {
  const count = conversation.participants?.length ?? 0;
  return count > 2 ? `${count} participants` : "Direct conversation";
};

const formatTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const conversationListTime = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatTime(value);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const messageDate = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).format(date);
};

const showDateDivider = (message: any, index: number) =>
  index === 0 ||
  new Date(message.created_at).toDateString() !==
    new Date(messages.value[index - 1]?.created_at).toDateString();

const formatSelectedFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const selectedFileIcon = (file: File): string => {
  if (file.type.startsWith("image/")) return "mdi-image-outline";
  if (file.type.startsWith("audio/")) return "mdi-file-music-outline";
  if (file.type.startsWith("video/")) return "mdi-file-video-outline";
  return "mdi-file-document-outline";
};

const attachmentIcon = (attachment: any): string => {
  const mime = String(attachment.mime_type ?? "");
  const extension = String(attachment.original_name ?? "")
    .split(".")
    .pop()
    ?.toLowerCase();
  if (mime.startsWith("image/")) return "mdi-image-outline";
  if (mime.startsWith("audio/")) return "mdi-file-music-outline";
  if (mime.startsWith("video/")) return "mdi-file-video-outline";
  if (extension === "pdf") return "mdi-file-pdf-box";
  if (["doc", "docx"].includes(extension ?? "")) return "mdi-file-word-outline";
  if (["xls", "xlsx", "csv"].includes(extension ?? ""))
    return "mdi-file-excel-outline";
  if (["zip", "rar", "7z"].includes(extension ?? ""))
    return "mdi-folder-zip-outline";
  return "mdi-file-document-outline";
};

const formatConversationDate = (value: string): string =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const addSelectedFiles = (files: File[]) => {
  const remainingSlots = Math.max(5 - selectedFiles.value.length, 0);
  const maximumBytes = maxAttachmentSizeMb.value * 1024 * 1024;
  const oversized = files.filter((file) => file.size > maximumBytes);
  const valid = files
    .filter((file) => file.size <= maximumBytes)
    .slice(0, remainingSlots);

  if (oversized.length) {
    showNotification(
      "File is too large",
      `Each message attachment must be ${maxAttachmentSizeMb.value} MB or smaller.`,
      "warning",
      { details: oversized.map((file) => file.name) },
    );
  }

  if (files.length - oversized.length > remainingSlots) {
    showNotification(
      "Attachment limit reached",
      "You can send up to 5 files in one message.",
      "warning",
    );
  }

  const existingKeys = new Set(
    selectedFiles.value.map(
      (file) => `${file.name}:${file.size}:${file.lastModified}`,
    ),
  );
  selectedFiles.value.push(
    ...valid.filter(
      (file) =>
        !existingKeys.has(`${file.name}:${file.size}:${file.lastModified}`),
    ),
  );
};

const triggerAttachmentPicker = () => attachmentInput.value?.click();

const onAttachmentInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  addSelectedFiles(Array.from(input.files ?? []));
  input.value = "";
};

const onComposerPaste = (event: ClipboardEvent) => {
  if (!attachmentsEnabled.value) return;
  const files = Array.from(event.clipboardData?.files ?? []);
  if (files.length) addSelectedFiles(files);
};

const removeSelectedFile = (index: number) =>
  selectedFiles.value.splice(index, 1);

const openImagePreview = (preview: {
  url: string;
  name: string;
  downloadUrl: string;
}) => {
  imagePreview.value = preview;
  imagePreviewDialog.value = true;
};

const downloadImagePreview = async () => {
  if (!imagePreview.value) return;
  const response = await axios.get(imagePreview.value.downloadUrl, {
    responseType: "blob",
    headers: { "X-Suppress-Success-Notification": "true" },
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = imagePreview.value.name;
  link.click();
  URL.revokeObjectURL(url);
};

const openConversationInfo = async () => {
  if (!activeConversation.value) return;
  conversationInfoDialog.value = true;
  loadingConversationInfo.value = true;

  try {
    const { data } = await axios.get(
      `/conversations/${activeConversation.value.id}`,
    );
    conversationInfo.value = data.data ?? data;
  } finally {
    loadingConversationInfo.value = false;
  }
};

const openSharedAttachment = async (attachment: any) => {
  if (openingAttachmentId.value) return;
  openingAttachmentId.value = attachment.id;

  try {
    if (attachment.is_image && attachment.preview_url) {
      const url = await loadMessageAttachmentPreview(
        attachment.preview_url,
        attachment.download_url,
      );
      if (url) {
        openImagePreview({
          url,
          name: attachment.original_name,
          downloadUrl: attachment.download_url,
        });
      }
      return;
    }

    const response = await axios.get(attachment.download_url, {
      responseType: "blob",
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.original_name || "attachment";
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    openingAttachmentId.value = null;
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollArea.value)
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
  });
};

const appendMessage = (message: any) => {
  if (messages.value.some((existing) => existing.id === message.id)) return;

  messages.value.push(message);
  const conversation = conversations.value.find(
    (item) => item.id === activeConversation.value?.id,
  );
  if (conversation) conversation.latest_message = message;
  scrollToBottom();
};

const fetchConversations = async () => {
  loadingConversations.value = true;
  try {
    const { data } = await axios.get("/conversations");
    conversations.value = data.data ?? data;
  } finally {
    loadingConversations.value = false;
  }
};

const leaveCurrentChannel = async () => {
  const echo = await getEcho();

  if (currentChannelName && echo) {
    echo.leave(currentChannelName);
    currentChannelName = null;
  }
};

const selectConversation = async (conversation: any) => {
  if (activeConversation.value?.id !== conversation.id) {
    newMessageBody.value = "";
    selectedFiles.value = [];
  }
  activeConversation.value = conversation;
  await leaveCurrentChannel();

  loadingMessages.value = true;
  try {
    const { data } = await axios.get(
      `/conversations/${conversation.id}/messages`,
    );
    messages.value = (data.data ?? data).slice().reverse();
    scrollToBottom();

    await axios.post(`/conversations/${conversation.id}/read`);
    conversation.unread_count = 0;
    window.dispatchEvent(new Event("navigation-badges:refresh"));
  } finally {
    loadingMessages.value = false;
  }

  const echo = await getEcho();

  if (!echo) return;

  currentChannelName = `conversation.${conversation.id}`;
  echo.private(currentChannelName).listen(".message.sent", (event: any) => {
    appendMessage(event);
  });
};

const sendMessage = async () => {
  const body = newMessageBody.value.trim();
  if ((!body && !selectedFiles.value.length) || !activeConversation.value)
    return;

  sending.value = true;
  uploadProgress.value = selectedFiles.value.length ? 0 : null;
  try {
    const payload = new FormData();
    if (body) payload.append("body", body);
    selectedFiles.value.forEach((file) =>
      payload.append("attachments[]", file),
    );

    const { data } = await axios.post(
      `/conversations/${activeConversation.value.id}/messages`,
      payload,
      {
        headers: { "X-Suppress-Success-Notification": "true" },
        onUploadProgress: (event) => {
          if (event.total)
            uploadProgress.value = Math.round(
              (event.loaded / event.total) * 100,
            );
        },
      },
    );

    appendMessage(data.data ?? data);
    newMessageBody.value = "";
    selectedFiles.value = [];
  } finally {
    sending.value = false;
    uploadProgress.value = null;
  }
};

const openNewConversation = async () => {
  newConversationDialog.value = true;
  selectedParticipantId.value = null;

  if (teammates.value.length) return;

  loadingTeammates.value = true;
  try {
    const { data } = await axios.get("/conversations/recipients");
    teammates.value = data.data ?? data;
  } finally {
    loadingTeammates.value = false;
  }
};

const createConversation = async () => {
  if (!selectedParticipantId.value) return;

  creatingConversation.value = true;
  try {
    const { data } = await axios.post("/conversations", {
      participant_ids: [selectedParticipantId.value],
    });
    const created = data.data ?? data;

    await fetchConversations();
    const conversation =
      conversations.value.find((item) => item.id === created.id) ?? created;

    newConversationDialog.value = false;
    await selectConversation(conversation);
  } finally {
    creatingConversation.value = false;
  }
};

onBeforeUnmount(() => {
  void leaveCurrentChannel();
});

fetchConversations();
</script>

<style scoped>
.messages-page {
  --messages-border: rgba(var(--v-theme-on-surface), 0.09);
  display: flex;
  max-width: 1600px;
  height: calc(100vh - 40px);
  min-height: 620px;
  margin-inline: auto;
  flex-direction: column;
}
.messages-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 2px 2px 18px;
}
.messages-heading > div {
  display: flex;
  flex-direction: column;
}
.messages-heading span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.messages-heading h1 {
  margin: 1px 0;
  font-size: 1.65rem;
  line-height: 1.2;
}
.messages-heading p {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.82rem;
}
.messages-shell {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(290px, 340px) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--messages-border);
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
}
.conversation-pane {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  border-right: 1px solid var(--messages-border);
  background: rgba(var(--v-theme-on-surface), 0.012);
}
.conversation-pane__header {
  display: grid;
  gap: 13px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--messages-border);
}
.conversation-pane__header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conversation-pane__header strong {
  font-size: 1rem;
}
.conversation-list {
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}
.conversation-item {
  position: relative;
  display: grid;
  width: 100%;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 11px 10px;
  border: 0;
  border-radius: 13px;
  color: rgb(var(--v-theme-on-surface));
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.conversation-item:hover {
  background: rgba(var(--v-theme-primary), 0.055);
}
.conversation-item--active {
  background: rgba(var(--v-theme-primary), 0.1);
}
.conversation-item--unread .conversation-copy strong,
.conversation-item--unread .conversation-copy p {
  font-weight: 750;
  color: rgb(var(--v-theme-on-surface));
}
.conversation-copy {
  min-width: 0;
}
.conversation-copy > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.conversation-copy strong,
.conversation-copy p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-copy strong {
  font-size: 0.79rem;
}
.conversation-copy time {
  flex: 0 0 auto;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.61rem;
}
.conversation-copy p {
  margin: 3px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.7rem;
}
.unread-count {
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  padding-inline: 5px;
  border-radius: 999px;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
  font-size: 0.6rem;
  font-weight: 800;
}
.conversation-skeleton {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: center;
  gap: 8px;
  padding: 9px;
}
.conversation-empty,
.thread-placeholder,
.thread-empty,
.message-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
}
.conversation-empty {
  min-height: 270px;
  padding: 25px;
}
.conversation-empty strong,
.thread-placeholder strong,
.thread-empty strong {
  margin-top: 9px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.9rem;
}
.conversation-empty span,
.thread-placeholder span,
.thread-empty span {
  max-width: 300px;
  margin-top: 3px;
  font-size: 0.73rem;
}
.thread-pane {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.thread-header {
  display: flex;
  min-height: 70px;
  align-items: center;
  gap: 11px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--messages-border);
}
.thread-header > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.thread-header strong {
  overflow: hidden;
  font-size: 0.86rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.thread-header span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
}
.thread-back {
  display: none;
}
.thread-body {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 18px clamp(16px, 3vw, 42px);
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-on-surface), 0.014),
    transparent 26%
  );
}
.message-loading,
.thread-empty {
  height: 100%;
  gap: 4px;
}
.message-loading span {
  margin-top: 8px;
  font-size: 0.72rem;
}
.date-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 0 18px;
}
.date-divider:before,
.date-divider:after {
  height: 1px;
  flex: 1;
  background: var(--messages-border);
  content: "";
}
.date-divider span {
  padding: 0 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.62rem;
  font-weight: 700;
}
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 9px;
}
.message-row--own {
  justify-content: flex-end;
}
.message-stack {
  display: flex;
  max-width: min(72%, 680px);
  min-width: 0;
  flex-direction: column;
}
.message-row--own .message-stack {
  align-items: flex-end;
}
.message-sender {
  margin: 0 0 3px 5px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.63rem;
  font-weight: 650;
}
.message-bubble {
  display: flex;
  min-width: 82px;
  align-items: flex-end;
  gap: 10px;
  padding: 9px 11px 7px;
  border: 1px solid var(--messages-border);
  border-radius: 6px 15px 15px;
  background: rgb(var(--v-theme-surface));
}
.message-bubble p {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.8rem;
  line-height: 1.48;
  white-space: pre-wrap;
}
.message-bubble time {
  flex: 0 0 auto;
  margin-bottom: 1px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.57rem;
  white-space: nowrap;
}
.message-bubble--own {
  border-color: transparent;
  border-radius: 15px 6px 15px 15px;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}
.message-bubble--own time {
  color: rgba(var(--v-theme-on-primary), 0.72);
}
.composer-wrap {
  padding: 13px 18px 11px;
  border-top: 1px solid var(--messages-border);
  background: rgb(var(--v-theme-surface));
}
.composer {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 8px 7px 15px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  transition: border-color 0.15s ease;
}
.composer :deep(.v-input) {
  min-width: 0;
  flex: 1 1 auto;
}
.composer :deep(.v-field__input) {
  min-height: 32px;
  align-items: center;
  padding-block: 5px;
}
.composer :deep(textarea) {
  align-self: center;
  line-height: 1.4;
}
.composer > .v-btn {
  flex: 0 0 auto;
  align-self: center;
}
.composer:focus-within {
  border-color: rgba(var(--v-theme-primary), 0.58);
}
.composer-wrap > span {
  display: block;
  margin: 5px 4px 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.58rem;
}
.thread-placeholder {
  height: 100%;
  padding: 30px;
}
.placeholder-art {
  display: grid;
  width: 92px;
  height: 92px;
  place-items: center;
  border-radius: 28px;
  color: rgb(var(--v-theme-primary));
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.15),
    rgba(var(--v-theme-secondary), 0.08)
  );
}
.new-message-header {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 18px 20px;
}
.new-message-header > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.new-message-header small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
}
.inbox-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conversation-search {
  width: 100%;
  min-width: 0;
}
.conversation-search :deep(.v-field) {
  min-height: 44px;
}
.conversation-pane__header > .conversation-search {
  display: grid;
}
.messages-shell {
  grid-template-columns: minmax(310px, 370px) minmax(0, 1fr);
}
.conversation-pane__header {
  background: linear-gradient(
    145deg,
    rgba(var(--v-theme-primary), 0.045),
    transparent 65%
  );
}
.conversation-item {
  isolation: isolate;
  margin-bottom: 3px;
  padding: 12px 11px;
  overflow: hidden;
}
.conversation-item:before {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 0;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: transparent;
  content: "";
  transition: background-color 0.15s ease;
}
.conversation-item--active {
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
  background: rgba(var(--v-theme-primary), 0.105);
}
.conversation-item--active:before {
  background: rgb(var(--v-theme-primary));
}
.thread-header {
  min-height: 74px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-primary), 0.04),
    transparent 44%
  );
}
.thread-body {
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.025),
      transparent 25%
    ),
    rgba(var(--v-theme-on-surface), 0.008);
}
.message-avatar-spacer {
  width: 30px;
  flex: 0 0 30px;
}
.message-bubble {
  padding: 10px 12px 8px;
  border-radius: 7px 17px 17px;
}
.message-bubble--own {
  border-radius: 17px 7px 17px 17px;
}
.composer {
  min-height: 48px;
  border-radius: 15px;
  background: rgba(var(--v-theme-on-surface), 0.018);
}
.new-message-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.055),
    transparent 58%
  );
}
.message-attachments {
  display: grid;
  gap: 6px;
  margin-bottom: 5px;
}
.message-row--own .message-attachments {
  justify-items: end;
}
.attachment-time {
  margin: 2px 5px 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.57rem;
}
.message-row--own .attachment-time {
  align-self: flex-end;
}
.pending-files {
  display: flex;
  gap: 7px;
  padding: 0 0 10px;
  overflow-x: auto;
}
.pending-file {
  display: grid;
  min-width: 190px;
  max-width: 270px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 11px;
  background: rgba(var(--v-theme-primary), 0.045);
}
.pending-file__icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 9px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.11);
}
.pending-file__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.pending-file__copy strong {
  overflow: hidden;
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pending-file__copy small {
  margin-top: 1px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.57rem;
}
.composer-wrap > .v-progress-linear {
  margin-bottom: 7px;
}
.composer {
  padding-left: 7px;
}
.image-preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
}
.image-preview-header strong {
  overflow: hidden;
  font-size: 0.84rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.image-preview-body {
  display: grid;
  min-height: 300px;
  align-items: stretch;
  justify-items: stretch;
  padding: 14px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}
.image-preview-dialog {
  overflow: hidden;
}
.conversation-info-header {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 17px 18px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.055),
    transparent 60%
  );
}
.conversation-info-header__icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.11);
}
.conversation-info-header > div:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.conversation-info-header strong {
  font-size: 0.9rem;
}
.conversation-info-header small {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.66rem;
}
.conversation-info-body {
  display: grid;
  gap: 18px;
  padding: 18px;
}
.conversation-info-loading {
  min-height: 360px;
}
.conversation-info-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 13px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), 0.055);
}
.conversation-info-summary > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.conversation-info-summary strong {
  overflow: hidden;
  font-size: 0.92rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-info-summary span {
  margin-top: 3px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.67rem;
}
.conversation-info-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.conversation-info-metrics > div {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 11px 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.075);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.022);
}
.conversation-info-metrics .v-icon {
  margin-bottom: 3px;
  color: rgb(var(--v-theme-primary));
}
.conversation-info-metrics strong {
  font-size: 0.9rem;
}
.conversation-info-metrics span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.6rem;
}
.conversation-info-section {
  display: grid;
  gap: 9px;
}
.conversation-info-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.conversation-info-section__title strong {
  font-size: 0.78rem;
}
.conversation-info-section__title span {
  display: grid;
  min-width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 999px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  font-size: 0.6rem;
  font-weight: 750;
}
.conversation-participants,
.conversation-shared-files {
  display: grid;
  gap: 5px;
}
.conversation-participant {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 11px;
}
.conversation-participant:hover {
  background: rgba(var(--v-theme-on-surface), 0.035);
}
.conversation-participant > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.conversation-participant strong {
  overflow: hidden;
  font-size: 0.73rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-participant span {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.61rem;
}
.conversation-shared-file {
  display: grid;
  width: 100%;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border: 1px solid transparent;
  border-radius: 11px;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.025);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}
.conversation-shared-file:hover {
  border-color: rgba(var(--v-theme-primary), 0.18);
  background: rgba(var(--v-theme-primary), 0.055);
}
.conversation-shared-file > span {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border-radius: 9px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
}
.conversation-shared-file > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.conversation-shared-file strong {
  overflow: hidden;
  font-size: 0.69rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-shared-file small {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.58rem;
}
.conversation-info-dialog {
  overflow: hidden;
}
@media (max-width: 760px) {
  .messages-page {
    height: calc(100vh - 40px);
    min-height: 540px;
  }
  .messages-heading {
    padding-inline: 4px;
  }
  .messages-heading p {
    display: none;
  }
  .messages-shell {
    grid-template-columns: 1fr;
  }
  .conversation-pane {
    border-right: 0;
  }
  .thread-pane {
    display: none;
  }
  .messages-shell--thread-open .conversation-pane {
    display: none;
  }
  .messages-shell--thread-open .thread-pane {
    display: flex;
  }
  .thread-back {
    display: inline-flex;
  }
  .thread-body {
    padding-inline: 13px;
  }
  .message-stack {
    max-width: 84%;
  }
  .composer-wrap {
    padding: 10px;
  }
  .composer-wrap > span {
    display: none;
  }
}
@media (max-width: 480px) {
  .messages-heading h1 {
    font-size: 1.4rem;
  }
  .messages-heading .v-btn {
    padding-inline: 12px;
  }
  .messages-shell {
    border-radius: 16px;
  }
  .conversation-pane__header {
    padding: 14px 12px;
  }
  .thread-header {
    padding-inline: 10px;
  }
}
</style>
