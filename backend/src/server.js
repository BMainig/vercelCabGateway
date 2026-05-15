require("dotenv").config();

const express = require("express");
const cors = require("cors");
const loadConsign = require("./config/consign");
const importsApi = require("./api/import")();
const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

loadConsign(app);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CabGateway Backend running",
  });
});
//auth
app.post("/api/auth/login", app.api.auth.login);
app.get("/api/auth/me", app.middlewares.auth, app.api.auth.me);
//readdings
app.get(  "/api/readings/pending",app.middlewares.auth,app.api.readings.listPending);
//users
app.get("/api/users", app.middlewares.auth, app.api.users.list);
app.get("/api/users/:id", app.middlewares.auth, app.api.users.getById);
app.post("/api/users", app.middlewares.auth, app.api.users.create);
app.put("/api/users/:id", app.middlewares.auth, app.api.users.update);
app.patch("/api/users/:id/password",app.middlewares.auth,app.api.users.changePassword);
app.patch("/api/users/:id/deactivate",app.middlewares.auth,app.api.users.deactivate);
//import
app.post("/api/imports/csv",app.middlewares.auth,importsApi.upload.single("file"), importsApi.importCsv);
app.get("/api/imports",app.middlewares.auth,importsApi.listImports);
//importWatchers 
app.get("/api/import-watchers",app.middlewares.auth,app.api.importWatchers.list);
app.post("/api/import-watchers",app.middlewares.auth,app.api.importWatchers.create);
app.put("/api/import-watchers/:id",app.middlewares.auth,app.api.importWatchers.update);
app.post("/api/import-watchers/:id/run-now",app.middlewares.auth,app.api.importWatchers.runNow);
app.delete("/api/import-watchers/:id",app.middlewares.auth,app.api.importWatchers.remove);
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await app.config.db.initDatabase();
    await app.services.importScheduler.start(app);
    app.listen(PORT, () => {
      console.log(`CabGateway backend rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar CabGateway:", error);
    process.exit(1);
  }
}

start();  