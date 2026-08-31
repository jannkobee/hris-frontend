/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from "./App.vue";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import ModuleHeader from "@/components/layouts/HrisApp/ModuleHeader.vue";

// Composables
import { createApp } from "vue";

// Plugins
import { registerPlugins } from "@/plugins";

const app = createApp(App);

registerPlugins(app);

app.component("DataTable", Table);
app.component("Form", Form);
app.component("ModuleHeader", ModuleHeader);

app.mount("#app");
