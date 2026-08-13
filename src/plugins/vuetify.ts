/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: localStorage.getItem("APP_THEME") || "light",
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#2563EB",
          secondary: "#0F766E",
          background: "#F7F9FC",
          surface: "#FFFFFF",
          "surface-variant": "#EEF2F7",
          "on-background": "#111827",
          "on-surface": "#111827",
          "on-surface-variant": "#4B5563",
          "on-primary": "#FFFFFF",
          "on-secondary": "#FFFFFF",
          success: "#15803D",
          "on-success": "#FFFFFF",
          warning: "#B45309",
          "on-warning": "#FFFFFF",
          info: "#0369A1",
          "on-info": "#FFFFFF",
          error: "#D14343",
          "on-error": "#FFFFFF",
          "error-container": "#FDE7E7",
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#90CAF9",
          secondary: "#80CBC4",
          background: "#121212",
          surface: "#1E1E1E",
          "surface-variant": "#2B2B2B",
          "on-background": "#E6E1E5",
          "on-surface": "#E6E1E5",
          "on-surface-variant": "#C4C7C5",
          "on-primary": "#0B1020",
          "on-secondary": "#0B1020",
          success: "#66BB6A",
          "on-success": "#071A0D",
          warning: "#FFB74D",
          "on-warning": "#211000",
          info: "#4FC3F7",
          "on-info": "#001F2A",
          error: "#EF5350",
          "on-error": "#FFFFFF",
          "error-container": "#3B1D1D",
        },
      },
    },
  },
});
