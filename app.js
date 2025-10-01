import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 10000;

const EZPIN_BASE = "https://api.ezpaypin.com/vendors/v2";
const CLIENT_ID = process.env.EZPIN_CLIENT_ID;
const SECRET_KEY = process.env.EZPIN_SECRET_KEY;

// Home route
app.get("/", (req, res) => {
  res.send("✅ EZPIN backend is live! Visit /api/test to verify connection.");
});

// Test route
app.get("/api/test", async (req, res) => {
  try {
    // Step 1: Authenticate
    const { data: auth } = await axios.post(`${EZPIN_BASE}/auth/token/`, {
      client_id: Number(CLIENT_ID),
      secret_key: SECRET_KEY,
    });

    const accessToken = auth.access;
    if (!accessToken) {
      throw new Error("No access token returned.");
    }

    // Step 2: Fetch catalog list
    const { data: catalogs } = await axios.get(`${EZPIN_BASE}/catalogs/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json({
      message: "🎉 EZPIN Sandbox connection successful!",
      total_products: catalogs.length,
      sample_product: catalogs[0],
    });
  } catch (err) {
    res.status(500).json({
      message: "❌ Connection failed",
      error: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
