import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Resolve the dist folder relative to the current working directory.
  // Using process.cwd() is more reliable in production where the server bundle
  // runs from the project root (e.g. `node dist/index.js`).
  const distPath = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    // Don't throw here - on some deployments the static client may be
    // served by Apache/public_html instead. Log a clear message and return
    // so the server process doesn't crash with an unhandled exception.
    console.warn(
      `Could not find the build directory: ${distPath}. Client static files won't be served by Node. Make sure to build the client and upload the 'dist' folder or let Apache serve it from public_html/hrms.`,
    );
    return;
  }

  // Allow configuring the base path via APP_BASE_PATH so the app can be
  // hosted under a subdirectory (e.g. /hrms on cPanel). Default: /hrms
  const basePath = process.env.APP_BASE_PATH || '/hrms';

  // Normalize basePath (remove trailing slash)
  const normalizedBase = basePath.endsWith('/') && basePath.length > 1
    ? basePath.slice(0, -1)
    : basePath;

  // Serve static assets under the configured base path
  app.use(normalizedBase, express.static(distPath));

  // fall through to index.html for any client-side route under the base path
  app.use(`${normalizedBase}/*`, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
