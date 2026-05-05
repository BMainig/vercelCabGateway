import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import loadConsign from "./config/consign.js";
import { testConnection } from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 🔥 injeta tudo no app
loadConsign(app);

// 🔥 registrar rotas depois do consign
app.use("/api/health", app.api.health);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CabGateway Backend running",
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);

  try {
    await testConnection();
  } catch (err) {
    console.error("Erro DB:", err.message);
  }
});