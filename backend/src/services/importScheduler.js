const fs = require("fs");
const path = require("path");

let timers = [];

function intervalToMs(days, hours, minutes) {
  const d = Number(days || 0);
  const h = Number(hours || 0);
  const m = Number(minutes || 0);

  const totalMs =
    d * 24 * 60 * 60 * 1000 +
    h * 60 * 60 * 1000 +
    m * 60 * 1000;

  return Math.max(totalMs, 60 * 1000);
}

function getSafeImportPath(inputPath) {
  const baseDir = process.env.CSV_IMPORT_BASE_DIR;

  if (!baseDir) {
    throw new Error("CSV_IMPORT_BASE_DIR não configurado no .env.");
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedFile = path.resolve(resolvedBase, inputPath);

  if (!resolvedFile.startsWith(resolvedBase)) {
    throw new Error("Caminho inválido fora do diretório permitido.");
  }

  return resolvedFile;
}

function getFileSignature(filePath) {
  const stat = fs.statSync(filePath);
  return `${stat.size}:${stat.mtimeMs}`;
}

function getDirectorySignature(directoryPath) {
  const files = fs
    .readdirSync(directoryPath)
    .filter((file) => file.toLowerCase().endsWith(".csv"))
    .sort();

  const signatures = files.map((file) => {
    const fullPath = path.join(directoryPath, file);
    const stat = fs.statSync(fullPath);
    return `${file}:${stat.size}:${stat.mtimeMs}`;
  });

  return signatures.join("|");
}

async function updateWatcherStatus(db, id, data) {
  await db.query(
    `
    UPDATE import_watchers
    SET
      last_signature = COALESCE(?, last_signature),
      last_checked_at = NOW(),
      last_imported_at = COALESCE(?, last_imported_at),
      last_status = ?,
      last_message = ?
    WHERE id = ?
    `,
    [
      data.last_signature ?? null,
      data.last_imported_at ? new Date() : null,
      data.last_status,
      data.last_message || null,
      id,
    ]
  );
}

async function runWatcher(app, watcher) {
  const db = app.config.db.getPool();

  try {
    const fullPath = getSafeImportPath(watcher.target_path);

    if (!fs.existsSync(fullPath)) {
      await updateWatcherStatus(db, watcher.id, {
        last_status: "error",
        last_message: `Caminho não encontrado: ${fullPath}`,
      });

      return;
    }

    const signature =
      watcher.mode === "directory"
        ? getDirectorySignature(fullPath)
        : getFileSignature(fullPath);

    if (signature === watcher.last_signature) {
      await updateWatcherStatus(db, watcher.id, {
        last_status: "unchanged",
        last_message: "Nenhuma alteração detectada.",
      });

      return;
    }

    if (watcher.mode === "directory") {
      await app.api.imports.importDirectoryInternal({
        app,
        user: null,
        directoryPath: fullPath,
      });
    } else {
      await app.api.imports.importFileInternal({
        app,
        user: null,
        filePath: fullPath,
      });
    }

    await updateWatcherStatus(db, watcher.id, {
      last_signature: signature,
      last_imported_at: true,
      last_status: "success",
      last_message: "Alteração detectada e importação executada.",
    });
  } catch (error) {
    await updateWatcherStatus(db, watcher.id, {
      last_status: "error",
      last_message: error.message,
    });
  }
}

async function start(app) {
  stop();

  const db = app.config.db.getPool();

  const [watchers] = await db.query(`
    SELECT *
    FROM import_watchers
    WHERE enabled = 1
  `);

  for (const watcher of watchers) {
    const intervalMs = intervalToMs(
      watcher.interval_days,
      watcher.interval_hours,
      watcher.interval_minutes
    );

    await runWatcher(app, watcher);

    const timer = setInterval(async () => {
      const [rows] = await db.query(
        `
        SELECT *
        FROM import_watchers
        WHERE id = ?
          AND enabled = 1
        LIMIT 1
        `,
        [watcher.id]
      );

      if (rows.length) {
        await runWatcher(app, rows[0]);
      }
    }, intervalMs);

    timers.push(timer);
  }

  console.log(`Import Scheduler iniciado. Watchers ativos: ${watchers.length}`);
}

function stop() {
  for (const timer of timers) {
    clearInterval(timer);
  }

  timers = [];
}

module.exports = () => ({
  start,
  stop,
});