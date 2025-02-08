import express from "express";
import cors from "cors";

const app = express();
const port = 4000;

let activeServer = "http://localhost:3001"; // Default API server

app.use(cors());
app.use(express.json());

app.get("/getServer", (req, res) => {
  res.json({ code: 200, server: activeServer });
});

app.post("/setServer", (req, res) => {
  const { server } = req.body;
  if (server) {
    activeServer = server;
    res.json({ message: "DNS updated", server });
  } else {
    res.status(400).json({ message: "Invalid server URL" });
  }
});

// Failover Mechanism
app.post("/failover", (req, res) => {
  console.log("API Server Down! Switching to Backup Server...");
  activeServer = "http://localhost:3002"; // Switch to backup
  res.json({ message: "Failover activated", server: activeServer });
});

app.listen(port, () => {
  console.log(`✅ DNS Registry running at http://localhost:${port}`);
});