require("dotenv").config();

const express = require("express");
const cors = require("cors");
const loadConsign = require("./config/consign");

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

app.post("/api/auth/login", app.api.auth.login);
app.get("/api/auth/me", app.middlewares.auth, app.api.auth.me);

app.get("/api/users", app.middlewares.auth, app.api.users.list);
app.get("/api/users/:id", app.middlewares.auth, app.api.users.getById);
app.post("/api/users", app.middlewares.auth, app.api.users.create);
app.put("/api/users/:id", app.middlewares.auth, app.api.users.update);
app.patch(
  "/api/users/:id/password",
  app.middlewares.auth,
  app.api.users.changePassword
);
app.patch(
  "/api/users/:id/deactivate",
  app.middlewares.auth,
  app.api.users.deactivate
);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await app.config.db.initDatabase();

    app.listen(PORT, () => {
      console.log(`CabGateway backend rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar CabGateway:", error);
    process.exit(1);
  }
}

start();  