"use strict";

const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const { clerkMiddleware, getAuth } = require("@clerk/express");
const { publishableKeyFromHost } = require("@clerk/shared/keys");
const {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} = require("./server/middlewares/clerkProxyMiddleware");

const app = express();
const port = Number(process.env.PORT) || 5000;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

app.disable("x-powered-by");
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "16kb" }));
app.use(
  clerkMiddleware((request) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(request) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.get(/^\/sign-in(?:\/.*)?$/, (_request, response) => {
  response.sendFile(path.join(__dirname, "public", "auth-ui", "auth.html"));
});
app.get(/^\/sign-up(?:\/.*)?$/, (_request, response) => {
  response.sendFile(path.join(__dirname, "public", "auth-ui", "auth.html"));
});

app.get("/api/auth/config", (request, response) => {
  const publishableKey = publishableKeyFromHost(
    getClerkProxyHost(request) ?? "",
    process.env.CLERK_PUBLISHABLE_KEY,
  );

  if (!publishableKey) {
    return response.status(503).json({ error: "Sign-in is not configured." });
  }

  response.set("Cache-Control", "no-store");
  response.json({
    publishableKey,
    proxyUrl: process.env.VITE_CLERK_PROXY_URL || "",
  });
});

app.get("/api/session", (request, response) => {
  const { userId } = getAuth(request);
  response.json({ signedIn: Boolean(userId) });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/db-check", async (request, response) => {
  if (!pool) {
    return response.status(503).json({
      error: "DATABASE_URL is not configured for this app.",
    });
  }

  const message = request.query.message ?? "PostgreSQL connection is working.";
  if (typeof message !== "string" || message.length > 200) {
    return response.status(400).json({
      error: "message must be a string of 200 characters or fewer.",
    });
  }

  try {
    const result = await pool.query(
      "SELECT $1::text AS message, NOW() AS checked_at",
      [message],
    );
    response.json(result.rows[0]);
  } catch (error) {
    console.error("PostgreSQL health check failed:", error.message);
    response.status(503).json({ error: "Could not connect to PostgreSQL." });
  }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API route not found." });
});

app.use((error, _request, response, _next) => {
  console.error("Unhandled request error:", error);
  response.status(500).json({ error: "Internal server error." });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    if (pool) {
      await pool.end();
    }
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
