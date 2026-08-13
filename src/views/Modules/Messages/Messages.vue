<template>
  <v-container fluid class="messages-page pa-0">
    <header class="messages-heading">
      <div><span>Communication</span><h1>Messages</h1><p>Connect with teammates and keep conversations moving.</p></div>
      <v-btn color="primary" prepend-icon="mdi-message-plus-outline" class="text-none" @click="openNewConversation">New message</v-btn>
    </header>

    <section class="messages-shell" :class="{ 'messages-shell--thread-open': activeConversation }">
      <aside class="conversation-pane">
        <div class="conversation-pane__header">
          <div class="inbox-title"><strong>Inbox</strong><v-chip size="x-small" variant="tonal">{{ conversations.length }}</v-chip></div>
          <v-text-field v-model="conversationSearch" class="conversation-search" placeholder="Search conversations" prepend-inner-icon="mdi-magnify" density="comfortable" variant="outlined" hide-details clearable />
        </div>

        <div class="conversation-list">
          <template v-if="loadingConversations">
            <div v-for="index in 6" :key="index" class="conversation-skeleton"><v-skeleton-loader type="avatar" /><v-skeleton-loader type="list-item-two-line" /></div>
          </template>
          <button v-for="conversation in filteredConversations" v-else :key="conversation.id" type="button" class="conversation-item" :class="{ 'conversation-item--active': activeConversation?.id === conversation.id, 'conversation-item--unread': conversation.unread_count }" @click="selectConversation(conversation)">
            <v-avatar color="primary" variant="tonal" size="43">{{ conversationInitials(conversation) }}</v-avatar>
            <div class="conversation-copy"><div><strong>{{ conversationTitle(conversation) }}</strong><time v-if="conversation.latest_message?.created_at">{{ conversationListTime(conversation.latest_message.created_at) }}</time></div><p>{{ conversation.latest_message?.body || 'Start the conversation' }}</p></div>
            <span v-if="conversation.unread_count" class="unread-count">{{ conversation.unread_count > 99 ? '99+' : conversation.unread_count }}</span>
          </button>
          <div v-if="!loadingConversations && !filteredConversations.length" class="conversation-empty"><v-icon :icon="conversationSearch ? 'mdi-message-search-outline' : 'mdi-message-plus-outline'" size="38" /><strong>{{ conversationSearch ? 'No conversations found' : 'Your inbox is empty' }}</strong><span>{{ conversationSearch ? 'Try another name or message.' : 'Start a conversation with a teammate.' }}</span><v-btn v-if="!conversationSearch" size="small" variant="tonal" class="text-none mt-2" @click="openNewConversation">New message</v-btn></div>
        </div>
      </aside>

      <main class="thread-pane">
        <template v-if="activeConversation">
          <header class="thread-header">
            <v-btn class="thread-back" icon="mdi-arrow-left" variant="text" size="small" aria-label="Back to conversations" @click="activeConversation = null" />
            <v-avatar color="primary" variant="tonal" size="40">{{ conversationInitials(activeConversation) }}</v-avatar>
            <div><strong>{{ conversationTitle(activeConversation) }}</strong><span>{{ participantSummary(activeConversation) }}</span></div>
            <v-spacer />
            <v-btn icon="mdi-information-outline" variant="text" size="small" title="Conversation information" />
          </header>

          <div ref="scrollArea" class="thread-body">
            <div v-if="loadingMessages" class="message-loading"><v-progress-circular indeterminate color="primary" size="28" width="3" /><span>Loading conversation…</span></div>
            <div v-else-if="!messages.length" class="thread-empty"><v-avatar color="primary" variant="tonal" size="62"><v-icon icon="mdi-hand-wave-outline" size="30" /></v-avatar><strong>Start the conversation</strong><span>Send a message to {{ conversationTitle(activeConversation) }}.</span></div>
            <template v-for="(message, index) in messages" v-else :key="message.id">
              <div v-if="showDateDivider(message, index)" class="date-divider"><span>{{ messageDate(message.created_at) }}</span></div>
              <div class="message-row" :class="{ 'message-row--own': isOwnMessage(message) }">
                <v-avatar v-if="!isOwnMessage(message)" color="surface-variant" size="30">{{ senderInitials(message) }}</v-avatar>
                <div class="message-stack">
                  <span v-if="!isOwnMessage(message)" class="message-sender">{{ senderName(message) }}</span>
                  <div class="message-bubble" :class="{ 'message-bubble--own': isOwnMessage(message) }"><p>{{ message.body }}</p><time>{{ formatTime(message.created_at) }}</time></div>
                </div>
              </div>
            </template>
          </div>

          <footer class="composer-wrap">
            <div class="composer">
              <v-textarea v-model="newMessageBody" :placeholder="`Message ${conversationTitle(activeConversation)}`" rows="1" auto-grow max-rows="5" density="compact" variant="plain" hide-details @keydown.enter.exact.prevent="sendMessage" />
              <v-btn icon="mdi-send" color="primary" variant="flat" size="small" :loading="sending" :disabled="!newMessageBody.trim()" aria-label="Send message" @click="sendMessage" />
            </div>
            <span>Enter to send · Shift + Enter for a new line</span>
          </footer>
        </template>

        <div v-else class="thread-placeholder"><div class="placeholder-art"><v-icon icon="mdi-forum-outline" size="46" /></div><strong>Your conversations</strong><span>Select a conversation from the inbox or start a new one.</span><v-btn color="primary" variant="tonal" prepend-icon="mdi-message-plus-outline" class="text-none mt-3" @click="openNewConversation">Start a conversation</v-btn></div>
      </main>
    </section>

    <v-dialog v-model="newConversationDialog" max-width="520">
      <v-card rounded="xl"><v-card-title class="new-message-header"><v-avatar color="primary" variant="tonal"><v-icon icon="mdi-message-plus-outline" /></v-avatar><div><strong>New message</strong><small>Choose a teammate to start a conversation.</small></div><v-spacer /><v-btn icon="mdi-close" variant="text" @click="newConversationDialog = false" /></v-card-title><v-divider /><v-card-text class="pa-5"><v-autocomplete v-model="selectedParticipantId" :items="teammates" :item-title="userLabel" item-value="id" label="Recipient" placeholder="Search by name or role" prepend-inner-icon="mdi-account-search-outline" :loading="loadingTeammates" no-data-text="No teammates available" variant="outlined" density="comfortable" autofocus hide-details="auto"><template #item="{ props: itemProps, item }"><v-list-item v-bind="itemProps" :subtitle="item.raw.email"><template #prepend><v-avatar color="primary" variant="tonal" size="34">{{ userInitials(item.raw) }}</v-avatar></template></v-list-item></template></v-autocomplete></v-card-text><v-card-actions class="px-5 pb-5"><v-spacer /><v-btn variant="text" class="text-none" @click="newConversationDialog = false">Cancel</v-btn><v-btn color="primary" class="text-none" prepend-icon="mdi-arrow-right" :disabled="!selectedParticipantId" :loading="creatingConversation" @click="createConversation">Start chat</v-btn></v-card-actions></v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, nextTick, onBeforeUnmount } from "vue";
import { getEcho } from "@/plugins/echo";
import { useAuth } from "@/composables/useAuth";
import axios from "@/plugins/axios";

const { authUser } = useAuth();

const conversations = ref<any[]>([]);
const activeConversation = ref<any | null>(null);
const messages = ref<any[]>([]);
const newMessageBody = ref("");
const teammates = ref<any[]>([]);
const selectedParticipantId = ref<string | null>(null);
const newConversationDialog = ref(false);
const conversationSearch = ref("");

const loadingConversations = ref(false);
const loadingMessages = ref(false);
const sending = ref(false);
const loadingTeammates = ref(false);
const creatingConversation = ref(false);

const scrollArea = ref<HTMLElement | null>(null);
let currentChannelName: string | null = null;

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

const userLabel = (user: any) =>
  `${[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}${
    user.role?.name ? ` (${user.role.name})` : ""
  }`;

const isOwnMessage = (message: any) =>
  message.sender?.id === authUser.value?.id;

const senderName = (message: any) =>
  message.sender?.name ||
  [message.sender?.first_name, message.sender?.last_name].filter(Boolean).join(" ") ||
  "Teammate";

const senderInitials = (message: any) =>
  senderName(message).split(" ").slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join("");

const userInitials = (user: any) =>
  [user?.first_name, user?.last_name].filter(Boolean).map((part: string) => part[0]?.toUpperCase()).join("") || "?";

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
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(date);
};

const messageDate = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "long", day: "numeric" }).format(date);
};

const showDateDivider = (message: any, index: number) =>
  index === 0 || new Date(message.created_at).toDateString() !== new Date(messages.value[index - 1]?.created_at).toDateString();

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollArea.value)
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
  });
};

const appendMessage = (message: any) => {
  if (messages.value.some((existing) => existing.id === message.id)) return;

  messages.value.push(message);
  const conversation = conversations.value.find((item) => item.id === activeConversation.value?.id);
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
  if (!body || !activeConversation.value) return;

  sending.value = true;
  try {
    const { data } = await axios.post(
      `/conversations/${activeConversation.value.id}/messages`,
      { body },
      { headers: { "X-Suppress-Success-Notification": "true" } },
    );

    appendMessage(data.data ?? data);
    newMessageBody.value = "";
  } finally {
    sending.value = false;
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
.messages-page{--messages-border:rgba(var(--v-theme-on-surface),.09);display:flex;max-width:1600px;height:calc(100vh - 40px);min-height:620px;margin-inline:auto;flex-direction:column}.messages-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:2px 2px 18px}.messages-heading>div{display:flex;flex-direction:column}.messages-heading span{color:rgb(var(--v-theme-primary));font-size:.68rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.messages-heading h1{margin:1px 0;font-size:1.65rem;line-height:1.2}.messages-heading p{margin:0;color:rgb(var(--v-theme-on-surface-variant));font-size:.82rem}.messages-shell{display:grid;min-height:0;flex:1;grid-template-columns:minmax(290px,340px) minmax(0,1fr);overflow:hidden;border:1px solid var(--messages-border);border-radius:20px;background:rgb(var(--v-theme-surface));box-shadow:0 12px 34px rgba(0,0,0,.055)}.conversation-pane{display:flex;min-width:0;min-height:0;flex-direction:column;border-right:1px solid var(--messages-border);background:rgba(var(--v-theme-on-surface),.012)}.conversation-pane__header{display:grid;gap:13px;padding:18px 16px 14px;border-bottom:1px solid var(--messages-border)}.conversation-pane__header>div{display:flex;align-items:center;gap:8px}.conversation-pane__header strong{font-size:1rem}.conversation-list{min-height:0;overflow-y:auto;padding:8px}.conversation-item{position:relative;display:grid;width:100%;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;padding:11px 10px;border:0;border-radius:13px;color:rgb(var(--v-theme-on-surface));background:transparent;text-align:left;cursor:pointer;transition:background .15s ease}.conversation-item:hover{background:rgba(var(--v-theme-primary),.055)}.conversation-item--active{background:rgba(var(--v-theme-primary),.1)}.conversation-item--unread .conversation-copy strong,.conversation-item--unread .conversation-copy p{font-weight:750;color:rgb(var(--v-theme-on-surface))}.conversation-copy{min-width:0}.conversation-copy>div{display:flex;align-items:center;justify-content:space-between;gap:8px}.conversation-copy strong,.conversation-copy p{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.conversation-copy strong{font-size:.79rem}.conversation-copy time{flex:0 0 auto;color:rgb(var(--v-theme-on-surface-variant));font-size:.61rem}.conversation-copy p{margin:3px 0 0;color:rgb(var(--v-theme-on-surface-variant));font-size:.7rem}.unread-count{display:grid;min-width:20px;height:20px;place-items:center;padding-inline:5px;border-radius:999px;color:rgb(var(--v-theme-on-primary));background:rgb(var(--v-theme-primary));font-size:.6rem;font-weight:800}.conversation-skeleton{display:grid;grid-template-columns:42px 1fr;align-items:center;gap:8px;padding:9px}.conversation-empty,.thread-placeholder,.thread-empty,.message-loading{display:flex;align-items:center;justify-content:center;flex-direction:column;color:rgb(var(--v-theme-on-surface-variant));text-align:center}.conversation-empty{min-height:270px;padding:25px}.conversation-empty strong,.thread-placeholder strong,.thread-empty strong{margin-top:9px;color:rgb(var(--v-theme-on-surface));font-size:.9rem}.conversation-empty span,.thread-placeholder span,.thread-empty span{max-width:300px;margin-top:3px;font-size:.73rem}.thread-pane{display:flex;min-width:0;min-height:0;flex-direction:column}.thread-header{display:flex;min-height:70px;align-items:center;gap:11px;padding:13px 18px;border-bottom:1px solid var(--messages-border)}.thread-header>div{display:flex;min-width:0;flex-direction:column}.thread-header strong{overflow:hidden;font-size:.86rem;text-overflow:ellipsis;white-space:nowrap}.thread-header span{color:rgb(var(--v-theme-on-surface-variant));font-size:.68rem}.thread-back{display:none}.thread-body{min-height:0;flex:1;overflow-y:auto;padding:18px clamp(16px,3vw,42px);background:linear-gradient(180deg,rgba(var(--v-theme-on-surface),.014),transparent 26%)}.message-loading,.thread-empty{height:100%;gap:4px}.message-loading span{margin-top:8px;font-size:.72rem}.date-divider{display:flex;align-items:center;justify-content:center;margin:12px 0 18px}.date-divider:before,.date-divider:after{height:1px;flex:1;background:var(--messages-border);content:""}.date-divider span{padding:0 12px;color:rgb(var(--v-theme-on-surface-variant));font-size:.62rem;font-weight:700}.message-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:9px}.message-row--own{justify-content:flex-end}.message-stack{display:flex;max-width:min(72%,680px);min-width:0;flex-direction:column}.message-row--own .message-stack{align-items:flex-end}.message-sender{margin:0 0 3px 5px;color:rgb(var(--v-theme-on-surface-variant));font-size:.63rem;font-weight:650}.message-bubble{display:flex;min-width:82px;align-items:flex-end;gap:10px;padding:9px 11px 7px;border:1px solid var(--messages-border);border-radius:6px 15px 15px;background:rgb(var(--v-theme-surface));box-shadow:0 3px 10px rgba(0,0,0,.035)}.message-bubble p{margin:0;overflow-wrap:anywhere;font-size:.8rem;line-height:1.48;white-space:pre-wrap}.message-bubble time{flex:0 0 auto;margin-bottom:1px;color:rgb(var(--v-theme-on-surface-variant));font-size:.57rem;white-space:nowrap}.message-bubble--own{border-color:transparent;border-radius:15px 6px 15px 15px;color:rgb(var(--v-theme-on-primary));background:rgb(var(--v-theme-primary));box-shadow:0 4px 14px rgba(var(--v-theme-primary),.18)}.message-bubble--own time{color:rgba(var(--v-theme-on-primary),.72)}.composer-wrap{padding:13px 18px 11px;border-top:1px solid var(--messages-border);background:rgb(var(--v-theme-surface))}.composer{display:flex;align-items:flex-end;gap:9px;padding:7px 8px 7px 15px;border:1px solid rgba(var(--v-theme-on-surface),.14);border-radius:16px;background:rgba(var(--v-theme-on-surface),.025);transition:border-color .15s ease,box-shadow .15s ease}.composer:focus-within{border-color:rgba(var(--v-theme-primary),.58);box-shadow:0 0 0 3px rgba(var(--v-theme-primary),.08)}.composer-wrap>span{display:block;margin:5px 4px 0;color:rgb(var(--v-theme-on-surface-variant));font-size:.58rem}.thread-placeholder{height:100%;padding:30px}.placeholder-art{display:grid;width:92px;height:92px;place-items:center;border-radius:28px;color:rgb(var(--v-theme-primary));background:linear-gradient(135deg,rgba(var(--v-theme-primary),.15),rgba(var(--v-theme-secondary),.08))}.new-message-header{display:flex;align-items:center;gap:11px;padding:18px 20px}.new-message-header>div{display:flex;min-width:0;flex-direction:column}.new-message-header small{color:rgb(var(--v-theme-on-surface-variant));font-size:.72rem}
.inbox-title{display:flex;align-items:center;gap:8px}.conversation-search{width:100%;min-width:0}.conversation-search :deep(.v-field){min-height:44px}.conversation-pane__header>.conversation-search{display:grid}.messages-shell{grid-template-columns:minmax(310px,370px) minmax(0,1fr)}
@media(max-width:760px){.messages-page{height:calc(100vh - 40px);min-height:540px}.messages-heading{padding-inline:4px}.messages-heading p{display:none}.messages-shell{grid-template-columns:1fr}.conversation-pane{border-right:0}.thread-pane{display:none}.messages-shell--thread-open .conversation-pane{display:none}.messages-shell--thread-open .thread-pane{display:flex}.thread-back{display:inline-flex}.thread-body{padding-inline:13px}.message-stack{max-width:84%}.composer-wrap{padding:10px}.composer-wrap>span{display:none}}
@media(max-width:480px){.messages-heading h1{font-size:1.4rem}.messages-heading .v-btn{padding-inline:12px}.messages-shell{border-radius:16px}.conversation-pane__header{padding:14px 12px}.thread-header{padding-inline:10px}}
</style>
