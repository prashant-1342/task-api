const express = require("express");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());

let tasks = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Finish CRUD assignment", done: false },
  { id: 3, title: "Push to GitHub", done: false },
];
let nextId = 4;

// ---------- Stage 1: Root & health ----------
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks", "/tasks/:id", "/health", "/stats"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- Stage 2: Read ----------
app.get("/tasks", (req, res) => {
  let result = tasks;

  // Bonus: filtering with ?done=true / ?done=false
  if (req.query.done !== undefined) {
    const wantDone = req.query.done === "true";
    result = result.filter((t) => t.done === wantDone);
  }

  // Bonus: search with ?search=milk
  if (req.query.search) {
    const term = req.query.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(term));
  }

  res.json(result);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

// ---------- Stage 3: Create ----------
app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Field 'title' is required and cannot be empty" });
  }

  const newTask = { id: nextId++, title: title.trim(), done: false };
  tasks.push(newTask);

  res.status(201).json(newTask);
});

// ---------- Stage 4: Update & Delete ----------
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body || {};

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "Provide at least 'title' or 'done' to update" });
  }

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Field 'title' cannot be empty" });
    }
    task.title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({ error: "Field 'done' must be true or false" });
    }
    task.done = done;
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

// ---------- Bonus extras ----------
app.get("/stats", (req, res) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  res.json({ total, done, open: total - done });
});

app.post("/reset", (req, res) => {
  tasks = [
    { id: 1, title: "Buy milk", done: false },
    { id: 2, title: "Finish CRUD assignment", done: false },
    { id: 3, title: "Push to GitHub", done: false },
  ];
  nextId = 4;
  res.json({ message: "Tasks reset to seed data", tasks });
});

// ---------- Stage 5: Swagger UI ----------
const openapiPath = path.join(__dirname, "openapi.json");
const openapiDocument = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// ---------- 404 fallback for unknown routes ----------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});
app.get("/stats", (req, res) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  res.json({ total, done, open: total - done });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});
