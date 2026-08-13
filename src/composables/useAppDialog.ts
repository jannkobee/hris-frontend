import { reactive } from "vue";

type DialogKind = "confirm" | "prompt" | "alert";
type DialogTone = "primary" | "warning" | "error" | "info";

export type AppDialogOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: DialogTone;
  inputLabel?: string;
  inputPlaceholder?: string;
  initialValue?: string;
  required?: boolean;
};

type PendingDialog = AppDialogOptions & {
  kind: DialogKind;
  resolve: (value: boolean | string | null) => void;
};

const queue: PendingDialog[] = [];
const state = reactive({
  visible: false,
  kind: "confirm" as DialogKind,
  title: "Confirm action",
  message: "",
  confirmText: "Continue",
  cancelText: "Cancel",
  tone: "primary" as DialogTone,
  inputLabel: "Details",
  inputPlaceholder: "",
  inputValue: "",
  required: false,
});

let active: PendingDialog | null = null;

const showNext = () => {
  if (active || queue.length === 0) return;
  active = queue.shift() ?? null;
  if (!active) return;

  Object.assign(state, {
    visible: true,
    kind: active.kind,
    title: active.title ?? (active.kind === "alert" ? "Notice" : "Confirm action"),
    message: active.message,
    confirmText: active.confirmText ?? (active.kind === "alert" ? "Close" : "Continue"),
    cancelText: active.cancelText ?? "Cancel",
    tone: active.tone ?? "primary",
    inputLabel: active.inputLabel ?? "Details",
    inputPlaceholder: active.inputPlaceholder ?? "",
    inputValue: active.initialValue ?? "",
    required: active.required ?? false,
  });
};

const enqueue = (kind: DialogKind, options: AppDialogOptions) =>
  new Promise<boolean | string | null>((resolve) => {
    queue.push({ kind, ...options, resolve });
    showNext();
  });

const finish = (value: boolean | string | null) => {
  const dialog = active;
  active = null;
  state.visible = false;
  dialog?.resolve(value);
  queueMicrotask(showNext);
};

export const useAppDialog = () => ({
  state,
  confirm: (options: AppDialogOptions) => enqueue("confirm", options) as Promise<boolean>,
  prompt: (options: AppDialogOptions) => enqueue("prompt", options) as Promise<string | null>,
  alert: async (options: AppDialogOptions) => {
    await enqueue("alert", options);
  },
  accept: () => finish(state.kind === "prompt" ? state.inputValue : true),
  cancel: () => finish(state.kind === "prompt" ? null : false),
});
