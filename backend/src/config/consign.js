const path = require("path");
const consign = require("consign");

module.exports = (app) => {
  consign({
    cwd: path.join(__dirname, ".."),
    verbose: true,
  })
    .include("config/db.js")
    .then("middlewares")
    .then("services")
    .then("api")
    .into(app);
};