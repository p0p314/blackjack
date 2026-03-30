/* eslint-env node */
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 8080,
    open: true,
  },
  build: {
    rollupOptions: {
      plugins: [
        {
          name: "inject-env-placeholders",
          generateBundle(options, bundle) {
            const api = process.env.VITE_API_URL || "";
            const socket = process.env.VITE_SOCKET_URL || "";
            const replacePlaceholders = (code) =>
              code
                .replace(/__VITE_API_URL__/g, api)
                .replace(/__VITE_SOCKET_URL__/g, socket);

            for (const [, chunk] of Object.entries(bundle)) {
              if (chunk.type === "asset" && typeof chunk.source === "string") {
                chunk.source = replacePlaceholders(chunk.source);
              }
            }
          },
        },
      ],
    },
  },
});
