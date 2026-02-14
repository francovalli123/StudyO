import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login.html"),
        register: resolve(__dirname, "register.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        habits: resolve(__dirname, "habits.html"),
        subjects: resolve(__dirname, "subjects.html"),
        planner: resolve(__dirname, "planner.html"),
        progress: resolve(__dirname, "progress.html"),
        profile: resolve(__dirname, "profile.html"),
        forgotPassword: resolve(__dirname, "forgot-password.html"),
        resetPassword: resolve(__dirname, "reset-password.html"),
        features: resolve(__dirname, "features.html"),
        news: resolve(__dirname, "news.html"),
        terms: resolve(__dirname, "terms.html"),
        politics: resolve(__dirname, "politics.html"),
        studyomethod: resolve(__dirname, "studyomethod.html"),
      },
    },
  },
});
