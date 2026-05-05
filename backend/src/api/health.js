export default (app) => {
  return async (req, res) => {
    try {
      const pool = app.config.db.getPool();
      await pool.query("SELECT 1");

      return res.json({
        success: true,
        message: "CabGateway API online",
        database: "connected",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro na API",
        error: error.message,
      });
    }
  };
};