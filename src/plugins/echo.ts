import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "@/plugins/axios";

window.Pusher = Pusher;

type RealtimeConfig = {
  enabled: boolean;
  key: string | null;
  host: string;
  port: number;
  scheme: "http" | "https";
};

let echo: Echo<"reverb"> | null = null;
let initializing: Promise<Echo<"reverb"> | null> | null = null;

export const getEcho = async (): Promise<Echo<"reverb"> | null> => {
  if (echo) return echo;
  if (initializing) return initializing;

  initializing = axios.get("/realtime/config")
    .then(({ data }) => {
      const config = (data.data ?? data) as RealtimeConfig;
      if (!config.enabled || !config.key) {
        console.warn("Realtime messaging is disabled on the server.");
        return null;
      }

      echo = new Echo({
        broadcaster: "reverb",
        key: config.key,
        wsHost: config.host || window.location.hostname,
        wsPort: config.port || 8080,
        wssPort: config.port || 443,
        forceTLS: config.scheme === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: `${axios.defaults.baseURL}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("APP_TOKEN")}`,
          },
        },
      });

      return echo;
    })
    .catch((error) => {
      console.error("Unable to initialize realtime messaging:", error);
      return null;
    })
    .finally(() => {
      initializing = null;
    });

  return initializing;
};
