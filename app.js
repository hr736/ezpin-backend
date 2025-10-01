import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const EZPIN_BASE = "https://api.ezpaypin.com/vendors/v2";
const CLIENT_ID = process.env.EZPIN_CLIENT_ID;
const SECRET_KEY = process.env.EZPIN_SECRET_KEY;

// Helper: get token
async function getAuthToken() {
  const { data } = await axios.post(`${EZPIN_BASE}/auth/token/`, {
    client_id: Number(CLIENT_ID),
    secret_key: SECRET_KEY,
  });
  return data.access;
}

// ✅ Home route
app.get("/", (req, res) => {
  res.send("✅ EZPIN backend is live! Use /api/test, /api/catalog, /api/order");
});

// ✅ Test connection
app.get("/api/test", async (req, res) => {
  try {
    const token = await getAuthToken();
    const { data: catalogs } = await axios.get(`${EZPIN_BASE}/catalogs/`, {
      headers: { Authorization: `Bearer ${token}` },
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

// 🛍 Get product catalog (you can later filter/limit)
app.get("/api/catalog", async (req, res) => {
  try {
    const token = await getAuthToken();
    const { data: catalogs } = await axios.get(`${EZPIN_BASE}/catalogs/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Optional: curate only specific SKUs
    const curated = catalogs.filter((item) =>
      [1148, 1201, 1320].includes(item.sku) // Example SKUs
    );

    res.json(curated);
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to load catalog",
      error: err.response?.data || err.message,
    });
  }
});

// 💳 Create new order
app.post("/api/order", async (req, res) => {
  const { sku, price, destination, delivery_type = 1 } = req.body;
  if (!sku || !price || !destination) {
    return res.status(400).json({
      error: "Missing required fields: sku, price, destination",
    });
  }

  try {
    const token = await getAuthToken();
    const ref = uuidv4();
    const order = {
      sku,
      quantity: 1,
      price,
      pre_order: false,
      delivery_type,
      destination,
      reference_code: ref,
    };

    const { data } = await axios.post(`${EZPIN_BASE}/orders/`, order, {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json({
      message: "✅ Order created",
      reference_code: ref,
      data,
    });
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to create order",
      error: err.response?.data || err.message,
    });
  }
});
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 💳 Stripe Checkout Route
app.post("/api/checkout", async (req, res) => {
  try {
    const { sku, price, destination } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Gift Card SKU ${sku}` },
            unit_amount: price * 100
          },
          quantity: 1
        }
      ],
      success_url: "https://your-frontend.com/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://your-frontend.com/cancel"
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({
      message: "❌ Stripe Checkout error",
      error: err.message
    });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

