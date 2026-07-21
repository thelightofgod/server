require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { Pool } = require("pg");

const app  = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------
// API key → tenant çözümle
// ----------------------------------------------------------------
async function resolveTenant(apiKey) {
    const { rows } = await pool.query(
        "SELECT name FROM tenants WHERE api_key = $1 LIMIT 1",
        [apiKey]
    );
    return rows[0] || null;
}

// ----------------------------------------------------------------
// POST /writeback
// ----------------------------------------------------------------
app.post("/writeback", async (req, res) => {
    const apiKey  = (req.headers["authorization"] || "").trim();
    const { changes, userId } = req.body;

    if (!apiKey)                                   return res.status(401).json({ error: "API key gerekli." });
    if (!Array.isArray(changes) || !changes.length) return res.status(400).json({ error: "changes dizisi boş." });

    try {
        const tenant = await resolveTenant(apiKey);
        if (!tenant) return res.status(403).json({ error: "Geçersiz API key." });

        const user = userId || "unknown";

        for (const c of changes) {
            await pool.query(
                `INSERT INTO transactions (tenant_name, user_id, row_key, field_name, old_value, new_value)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [tenant.name, user, c.row_key, c.field_name, c.old_value, c.new_value]
            );
        }

        console.log(`[${new Date().toISOString()}] ${tenant.name} | ${user} | ${changes.length} değişiklik`);
        res.json({ success: true, count: changes.length });

    } catch (err) {
        console.error("Hata:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------
// GET /overrides — tenant'ın en son kaydedilen değerlerini döndür
// ----------------------------------------------------------------
app.get("/overrides", async (req, res) => {
    const apiKey = (req.headers["authorization"] || "").trim();
    if (!apiKey) return res.status(401).json({ error: "API key gerekli." });

    try {
        const tenant = await resolveTenant(apiKey);
        if (!tenant) return res.status(403).json({ error: "Geçersiz API key." });

        const { rows } = await pool.query(
            `SELECT DISTINCT ON (row_key, field_name)
                row_key, field_name, new_value
             FROM transactions
             WHERE tenant_name = $1
             ORDER BY row_key, field_name, created_at DESC`,
            [tenant.name]
        );

        const overrides = {};
        rows.forEach(function (r) {
            overrides[r.row_key + "||" + r.field_name] = r.new_value;
        });

        res.json({ overrides: overrides });
    } catch (err) {
        console.error("Hata:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------
// GET /health
// ----------------------------------------------------------------
app.get("/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(500).json({ status: "error", db: err.message });
    }
});

// ----------------------------------------------------------------
// Başlat
// ----------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BiTechnology Writeback → http://localhost:${PORT}`));
