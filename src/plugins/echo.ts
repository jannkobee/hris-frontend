import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "@/plugins/axios";

window.Pusher = Pusher;

let echo: Echo<"reverb"> | null = null;

export const getEcho = (): Echo<"reverb"> | null => {
  if (echo) return echo;

  const key = import.meta.env.VITE_REVERB_APP_KEY;

  if (!key) {
    console.warn(
      "Realtime messaging is disabled: VITE_REVERB_APP_KEY is not configured.",
    );

    return null;
  }

  echo = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${axios.defaults.baseURL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem("APP_TOKEN")}`,
      },
    },
  });

  return echo;
};
