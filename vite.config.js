import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function linkedInSyncPlugin() {
  const handler = async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    try {
      const { syncLinkedIn } = await import("./scripts/sync-linkedin.mjs");
      const data = await syncLinkedIn();
      res.statusCode = 200;
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("[LinkedIn Plugin Error]:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || "Failed to sync" }));
    }
  };

  return {
    name: "linkedin-sync",
    configureServer(server) {
      server.middlewares.use("/api/sync-linkedin", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/sync-linkedin", handler);
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
