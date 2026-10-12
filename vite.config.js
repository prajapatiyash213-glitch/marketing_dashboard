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

function googleSheetSyncPlugin() {
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
      const { syncGoogleSheet } = await import("./scripts/sync-google-sheet.mjs");
      const data = await syncGoogleSheet();
      res.statusCode = 200;
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("[Google Sheet Plugin Error]:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || "Failed to sync Google Sheet" }));
    }
  };

  return {
    name: "google-sheet-sync",
    configureServer(server) {
      server.middlewares.use("/api/sync-google-sheet", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/sync-google-sheet", handler);
    },
  };
}

function salesSyncPlugin() {
  const handler = async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const { getSalesData, createSalesLead, updateSalesLead } = await import("./scripts/sync-sales.mjs");

      if (req.method === "GET") {
        const data = await getSalesData();
        res.statusCode = 200;
        res.end(JSON.stringify(data));
        return;
      }

      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      const parsed = body ? JSON.parse(body) : {};

      if (req.method === "POST") {
        const created = await createSalesLead(parsed);
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, lead: created }));
        return;
      }

      if (req.method === "PATCH") {
        const { id, patch } = parsed;
        const result = await updateSalesLead(id, patch);
        res.statusCode = 200;
        res.end(JSON.stringify(result));
        return;
      }

      res.statusCode = 405;
      res.end(JSON.stringify({ error: "Method not allowed" }));
    } catch (err) {
      console.error("[Sales Sync Plugin Error]:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || "Failed to sync sales" }));
    }
  };

  return {
    name: "sales-sync",
    configureServer(server) {
      server.middlewares.use("/api/sales-leads", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/sales-leads", handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), linkedInSyncPlugin(), googleSheetSyncPlugin(), salesSyncPlugin()],
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
