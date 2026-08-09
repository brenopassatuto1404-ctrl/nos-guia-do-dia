const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");
const RESP_CYCLE = ["B", "C", "BC"];

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadState() {
try {
return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
} catch {
return { resp: {}, done: {} };
}
}
function saveState() {
fs.writeFileSync(DATA_FILE, JSON.stringify(state));
}

let state = loadState();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/state", (req, res) => {
res.json(state);
});

app.post("/api/resp", (req, res) => {
const { taskId, defaultResp } = req.body || {};
if (!taskId) return res.status(400).json({ error: "taskId obrigatorio" });
const current = state.resp[taskId] || defaultResp || "B";
const next = RESP_CYCLE[(RESP_CYCLE.indexOf(current) + 1) % RESP_CYCLE.length];
state.resp[taskId] = next;
saveState();
res.json(state);
});

app.post("/api/toggle", (req, res) => {
const { taskId, date, defaultResp } = req.body || {};
if (!taskId || !date) return res.status(400).json({ error: "taskId e date obrigatorios" });
const key = `${date}:${taskId}`;
if (state.done[key]) {
delete state.done[key];
} else {
const by = state.resp[taskId] || defaultResp || "B";
state.done[key] = { by, at: new Date().toISOString() };
}
saveState();
res.json(state);
});

app.listen(PORT, () => {
console.log("Nos - Guia do Dia rodando na porta " + PORT);
});
