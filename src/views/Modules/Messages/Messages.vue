<template>
  <v-container fluid class="fill-height messages-container">
    <div
      class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4"
      style="width: 100%"
    >
      <div>
        <div class="text-h5 font-weight-bold">Messages</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Chat with your team in real time.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Messages</v-chip>
    </div>

    <v-card class="messages-card" variant="outlined">
      <v-row no-gutters class="fill-height">
        <!-- Conversation list -->
        <v-col cols="12" sm="4" md="3" class="conversation-pane">
          <v-list
            density="comfortable"
            nav
            :loading="loadingConversations"
            class="py-0"
          >
            <v-list-item
              v-for="conversation in conversations"
              :key="conversation.id"
              :active="activeConversation?.id === conversation.id"
              :title="conversationTitle(conversation)"
              :subtitle="
                conversation.latest_message?.[0]?.body ?? 'No messages yet'
              "
              lines="two"
              @click="selectConversation(conversation)"
            >
              <template #prepend>
                <v-avatar color="surface-variant" size="40">
                  <span class="text-subtitle-2">
                    {{ conversationInitials(conversation) }}
                  </span>
                </v-avatar>
              </template>
              <template #append v-if="conversation.unread_count">
                <v-badge
                  :content="conversation.unread_count"
                  color="primary"
                  inline
                />
              </template>
            </v-list-item>

            <v-list-item v-if="!loadingConversations && !conversations.length">
              <v-list-item-title class="text-medium-emphasis text-body-2">
                No conversations yet.
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>

        <v-divider vertical />

        <!-- Active thread -->
        <v-col cols="12" sm="8" md="9" class="d-flex flex-column thread-pane">
          <template v-if="activeConversation">
            <div class="thread-header px-4 py-3">
              <div class="text-subtitle-1 font-weight-medium">
                {{ conversationTitle(activeConversation) }}
              </div>
            </div>
            <v-divider />

            <div ref="scrollArea" class="thread-body px-4 py-3">
              <div v-if="loadingMessages" class="d-flex justify-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </div>

              <div
                v-for="message in messages"
                :key="message.id"
                class="message-row"
                :class="{ 'message-row--own': isOwnMessage(message) }"
              >
                <div
                  class="message-bubble"
                  :class="{ 'message-bubble--own': isOwnMessage(message) }"
                >
                  <div
                    v-if="!isOwnMessage(message)"
                    class="text-caption font-weight-medium mb-1"
                  >
                    {{ message.sender.name ?? message.sender.first_name }}
                  </div>
                  <div class="text-body-2">{{ message.body }}</div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ formatTime(message.created_at) }}
                  </div>
                </div>
              </div>
            </div>

            <v-divider />

            <div class="thread-input px-3 py-2">
              <v-textarea
                v-model="newMessageBody"
                placeholder="Write a message..."
                rows="1"
                auto-grow
                max-rows="5"
                density="compact"
                variant="solo"
                flat
                hide-details
                @keydown.enter.exact.prevent="sendMessage"
              >
                <template #append-inner>
                  <v-btn
                    icon="mdi-send"
                    variant="text"
                    color="primary"
                    :loading="sending"
                    :disabled="!newMessageBody.trim()"
                    @click="sendMessage"
                  />
                </template>
              </v-textarea>
            </div>
          </template>

          <div
            v-else
            class="d-flex flex-column align-center justify-center fill-height text-medium-emphasis"
          >
            <v-icon icon="mdi-message-text-outline" size="48" class="mb-2" />
            <div class="text-body-2">
              Select a conversation to start chatting.
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, nextTick, onBeforeUnmount } from "vue";
import { echo } from "@/plugins/echo";
import { useAuth } from "@/composables/useAuth";

// NOTE: this view calls the API directly with fetch + the stored APP_TOKEN,
// since /conversations and /conversations/:id/messages are nested resources
// that don't fit the flat single-resource shape of useApi(). Swap `apiFetch`
// below for your real API client if you have a shared axios instance —
// the goal here is matching whatever already attaches auth headers/base URL.

const API_URL = import.meta.env.VITE_API_URL;

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.localStorage.getItem("APP_TOKEN")}`,
      ...options.headers,
    },
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return null;

  return response.json();
};

const { authUser } = useAuth();

const conversations = ref<any[]>([]);
const activeConversation = ref<any | null>(null);
const messages = ref<any[]>([]);
const newMessageBody = ref("");

const loadingConversations = ref(false);
const loadingMessages = ref(false);
const sending = ref(false);

const scrollArea = ref<HTMLElement | null>(null);
let currentChannelName: string | null = null;

const conversationTitle = (conversation: any) => {
  if (conversation.name) return conversation.name;

  const others = (conversation.participants ?? []).filter(
    (p: any) => p.id !== authUser.value?.id,
  );

  return (
    others.map((p: any) => `${p.first_name} ${p.last_name}`).join(", ") ||
    "Conversation"
  );
};

const conversationInitials = (conversation: any) => {
  const title = conversationTitle(conversation);
  return title
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join("");
};

const isOwnMessage = (message: any) =>
  message.sender?.id === authUser.value?.id;

const formatTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollArea.value)
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
  });
};

const fetchConversations = async () => {
  loadingConversations.value = true;
  try {
    const response = await apiFetch("/conversations");
    conversations.value = response.data ?? response;
  } finally {
    loadingConversations.value = false;
  }
};

const leaveCurrentChannel = () => {
  if (currentChannelName) {
    echo.leave(currentChannelName);
    currentChannelName = null;
  }
};

const selectConversation = async (conversation: any) => {
  activeConversation.value = conversation;
  leaveCurrentChannel();

  loadingMessages.value = true;
  try {
    const response = await apiFetch(
      `/conversations/${conversation.id}/messages`,
    );
    messages.value = (response.data ?? response).slice().reverse();
    scrollToBottom();

    await apiFetch(`/conversations/${conversation.id}/read`, {
      method: "POST",
    });
    conversation.unread_count = 0;
  } finally {
    loadingMessages.value = false;
  }

  currentChannelName = `conversation.${conversation.id}`;
  echo.private(currentChannelName).listen(".message.sent", (event: any) => {
    messages.value.push(event);
    scrollToBottom();
  });
};

const sendMessage = async () => {
  const body = newMessageBody.value.trim();
  if (!body || !activeConversation.value) return;

  sending.value = true;
  try {
    const message = await apiFetch(
      `/conversations/${activeConversation.value.id}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ body }),
      },
    );

    messages.value.push(message);
    newMessageBody.value = "";
    scrollToBottom();
  } finally {
    sending.value = false;
  }
};

onBeforeUnmount(() => leaveCurrentChannel());

fetchConversations();
</script>

<style scoped>
.messages-card {
  width: 100%;
  height: calc(100vh - 220px);
  display: flex;
}

.messages-card :deep(.v-row) {
  flex-wrap: nowrap;
  height: 100%;
}

.conversation-pane {
  overflow-y: auto;
  height: 100%;
}

.thread-pane {
  height: 100%;
}

.thread-body {
  flex: 1 1 auto;
  overflow-y: auto;
}

.message-row {
  display: flex;
  margin-bottom: 8px;
}

.message-row--own {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-variant));
}

.message-bubble--own {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>
