/// <reference types="vite/client" />

import Pusher from "pusher-js";

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}
