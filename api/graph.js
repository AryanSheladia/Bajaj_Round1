const { processGraph } = require("../lib/graphProcessor");

module.exports = function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = req.body;

    if (!body || !Array.isArray(body.edges)) {
      return res.status(400).json({
        error:
          'Invalid request body. Expected JSON with "edges" array, e.g. { "edges": ["A->B", "A->C"] }',
      });
    }

    const result = processGraph(body.edges);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Graph processing error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
