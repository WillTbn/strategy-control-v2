const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// load DB file from env or use dev.sqlite next to repo
const defaultDb = path.join(__dirname, "..", "..", "dev.sqlite");
const dbFile = process.env.SQLITE_FILE || process.env.SQLITE_DB || defaultDb;

if (!fs.existsSync(dbFile)) {
  console.error("DB file not found:", dbFile);
  process.exit(1);
}

const db = new Database(dbFile);

function replaceInClients(oldHost, newHost) {
  const rows = db
    .prepare("SELECT rowid, data FROM clients WHERE data LIKE ?")
    .all("%" + oldHost + "%");
  console.log("Found", rows.length, "rows containing", oldHost);
  const update = db.prepare("UPDATE clients SET data = ? WHERE rowid = ?");
  let changed = 0;
  for (const r of rows) {
    try {
      const newData = String(r.data).split(oldHost).join(newHost);
      if (newData !== r.data) {
        update.run(newData, r.rowid);
        changed++;
      }
    } catch (e) {
      console.error("failed to update row", r.rowid, e && e.message);
    }
  }
  console.log("Updated", changed, "rows");
}

const oldHost = process.argv[2] || "strategy-backend";
const newHost = process.argv[3] || "localhost";

console.log("DB:", dbFile);
console.log("Replacing host", oldHost, "->", newHost);
replaceInClients(oldHost, newHost);

db.close();

console.log("Done");
