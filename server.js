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
    const s = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!s.resp) s.resp = {};
    if (!s.done) s.done = {};
    if (!s.custom) s.custom = [];
    if (!s.shopping) s.shopping = [];
    return s;
  } catch {
    return { resp: {}, done: {}, custom: [], shopping: [] };
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

app.post("/api/custom/add", (req, res) => {
  const { title } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "title obrigatorio" });
  state.custom.push({ id: Date.now(), title: title.trim(), done: false, resp: "BC" });
  saveState();
  res.json(state);
});

app.post("/api/custom/resp", (req, res) => {
  const { id } = req.body || {};
  const item = state.custom.find((c) => c.id === id);
  if (!item) return res.status(404).json({ error: "nao encontrado" });
  const next = RESP_CYCLE[(RESP_CYCLE.indexOf(item.resp || "BC") + 1) % RESP_CYCLE.length];
  item.resp = next;
  saveState();
  res.json(state);
});

app.post("/api/custom/toggle", (req, res) => {
  const { id } = req.body || {};
  const item = state.custom.find((c) => c.id === id);
  if (!item) return res.status(404).json({ error: "nao encontrado" });
  item.done = !item.done;
  item.doneAt = item.done ? new Date().toISOString() : null;
  saveState();
  res.json(state);
});

app.post("/api/custom/delete", (req, res) => {
  const { id } = req.body || {};
  state.custom = state.custom.filter((c) => c.id !== id);
  saveState();
  res.json(state);
});

app.post("/api/shopping/add", (req, res) => {
  const { title } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "title obrigatorio" });
  state.shopping.push({ id: Date.now(), title: title.trim(), checked: false });
  saveState();
  res.json(state);
});

app.post("/api/shopping/toggle", (req, res) => {
  const { id } = req.body || {};
  const item = state.shopping.find((s) => s.id === id);
  if (!item) return res.status(404).json({ error: "nao encontrado" });
  item.checked = !item.checked;
  saveState();
  res.json(state);
});

app.post("/api/shopping/delete", (req, res) => {
  const { id } = req.body || {};
  state.shopping = state.shopping.filter((s) => s.id !== id);
  saveState();
  res.json(state);
});

app.post("/api/shopping/clear", (req, res) => {
  state.shopping = state.shopping.filter((s) => !s.checked);
  saveState();
  res.json(state);
});

app.listen(PORT, () => {
  console.log("Nos - Guia do Dia rodando na porta " + PORT);
});
