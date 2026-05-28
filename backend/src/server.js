require("dotenv").config();

const express = require("express");
const cors = require("cors");

const loadConsign = require("./config/consign");
const importsApi = require("./api/import")();

const app = express();

const frontendOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: frontendOrigins.length > 0 ? frontendOrigins : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

loadConsign(app);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CabGateway Backend running",
  });
});

// auth
app.post("/api/auth/login", app.api.auth.login);
app.get("/api/auth/me", app.middlewares.auth, app.api.auth.me);

// readings
app.get("/api/readings/pending", app.middlewares.auth, app.api.readings.listPending);

// users
app.get("/api/users", app.middlewares.auth, app.api.users.list);
app.get("/api/users/:id", app.middlewares.auth, app.api.users.getById);
app.post("/api/users", app.middlewares.auth, app.api.users.create);
app.put("/api/users/:id", app.middlewares.auth, app.api.users.update);
app.patch("/api/users/:id/password", app.middlewares.auth, app.api.users.changePassword);
app.patch("/api/users/:id/deactivate", app.middlewares.auth, app.api.users.deactivate);

// imports
app.post("/api/imports/csv", app.middlewares.auth, importsApi.upload.single("file"), importsApi.importCsvUpload);
app.post("/api/imports/csv/upload", app.middlewares.auth, importsApi.upload.single("file"), importsApi.importCsvUpload);
app.post("/api/imports/csv/from-path", app.middlewares.auth, importsApi.importCsvFromPath);
app.post("/api/imports/csv/from-directory", app.middlewares.auth, importsApi.importCsvFromDirectory);
app.get("/api/imports", app.middlewares.auth, importsApi.listImports);

// import watchers
app.get("/api/import-watchers", app.middlewares.auth, app.api.importWatchers.list);
app.post("/api/import-watchers", app.middlewares.auth, app.api.importWatchers.create);
app.put("/api/import-watchers/:id", app.middlewares.auth, app.api.importWatchers.update);
app.post("/api/import-watchers/:id/run-now", app.middlewares.auth, app.api.importWatchers.runNow);
app.delete("/api/import-watchers/:id", app.middlewares.auth, app.api.importWatchers.remove);

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  try {
    await app.config.db.initDatabase();

    if (process.env.DISABLE_IMPORT_SCHEDULER !== "true") {
      await app.services.importScheduler.start(app);
    } else {
      console.log("Import Scheduler desativado (DISABLE_IMPORT_SCHEDULER=true).");
    }

    app.listen(PORT, HOST, () => {
      console.log(`CabGateway backend rodando em http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar CabGateway:", error);
    process.exit(1);
  }
}

start();
