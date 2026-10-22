const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf8");

const products = [
  { id: 1, name: "Rose Glow Serum", category: "Skincare", price: 890, oldPrice: 1100, rating: 4.9, tag: "BESTSELLER", color: "rose", emoji: "🌹", description: "A lightweight glow-boosting serum." },
  { id: 2, name: "Velvet Matte Lipstick", category: "Makeup", price: 650, oldPrice: 780, rating: 4.8, tag: "TRENDING", color: "plum", emoji: "💄", description: "Rich colour with a soft velvet finish." },
  { id: 3, name: "Cloud Cleanser", category: "Skincare", price: 540, oldPrice: 0, rating: 4.7, tag: "GENTLE", color: "cream", emoji: "🫧", description: "A gentle daily cleanser for fresh skin." },
  { id: 4, name: "Sun Veil SPF 50", category: "Skincare", price: 720, oldPrice: 850, rating: 4.9, tag: "DAILY ESSENTIAL", color: "sun", emoji: "☀️", description: "Everyday lightweight sun protection." },
  { id: 5, name: "Petal Blush", category: "Makeup", price: 590, oldPrice: 0, rating: 4.6, tag: "NEW", color: "pink", emoji: "🌸", description: "A natural-looking flush of colour." },
  { id: 6, name: "Silk Hair Elixir", category: "Haircare", price: 780, oldPrice: 920, rating: 4.8, tag: "EDITOR'S PICK", color: "lilac", emoji: "✨", description: "Smooth-feel hair elixir for glossy lengths." }
];

app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "Glow & Co API is running" }));
app.get("/api/products", (req, res) => {
  const category = req.query.category;
  const search = (req.query.search || "").toLowerCase().trim();
  let result = products;
  if (category && category !== "All") result = result.filter(p => p.category === category);
  if (search) result = result.filter(p => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(search));
  res.json(result);
});
app.get("/api/orders", (_req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  res.json(orders);
});
app.post("/api/orders", (req, res) => {
  const { customer, phone, address, items } = req.body || {};
  if (!customer || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Name, phone, address and at least one cart item are required." });
  }
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === Number(item.id));
    const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
    if (!product) return null;
    return { id: product.id, name: product.name, price: product.price, quantity, lineTotal: product.price * quantity };
  });
  if (orderItems.some(item => !item)) return res.status(400).json({ error: "One or more products are invalid." });
  const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  const order = {
    id: `GC-${Date.now().toString().slice(-8)}`,
    customer: String(customer).trim(),
    phone: String(phone).trim(),
    address: String(address).trim(),
    items: orderItems,
    total,
    status: "Received",
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
  res.status(201).json({ message: "Order received successfully!", order });
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Glow & Co is running at http://localhost:${PORT}`));
