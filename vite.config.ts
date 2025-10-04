import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split React and React DOM
            react: ["react", "react-dom", "react/jsx-runtime"],
            // Split Google GenAI SDK
            genai: ["@google/genai"],
            // Split utilities
            utils: ["scheduler"],
          },
        },
      },
      // Increase chunk size warning limit since we have modal chunking now
      chunkSizeWarningLimit: 600,
    },
  };
});
