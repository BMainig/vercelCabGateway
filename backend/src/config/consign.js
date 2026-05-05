import consign from "consign";

export default function loadConsign(app) {
  consign({ cwd: "src" })
    .include("config")
    .then("middlewares")
    .then("services")
    .then("api")
    .into(app);
}