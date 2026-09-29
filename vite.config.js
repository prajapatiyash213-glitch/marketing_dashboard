import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function linkedInSyncPlugin() {
  return {
    name: "linkedin-sync",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/api/sync-linkedin") {
          try {
            const { syncLinkedIn } = await import("./scripts/sync-linkedin.mjs");
            const data = await syncLinkedIn();
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), linkedInSyncPlugin()],
  build: {
    target: "es2020",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          charts: ["recharts"],
          sheets: ["xlsx"],
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});
