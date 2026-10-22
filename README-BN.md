# Glow & Co. Cosmetics E-commerce (বাংলা গাইড)

এটি একটি starter project: animated frontend + Express backend + product API + order save করার demo ব্যবস্থা।

## ১) কী কী কাজ করে?
- Hover করলে menu dropdown ও underline animation
- Mobile responsive navigation
- Animated hero, product cards, floating cosmetics illustration
- Category filter ও product search
- Add to bag, quantity বাড়ানো/কমানো, remove item
- Checkout form থেকে backend-এ order পাঠানো
- Order `data/orders.json` ফাইলে save হয়
- Product API: `GET /api/products`
- Order API: `POST /api/orders`
- Order list demo API: `GET /api/orders`

## ২) চালু করার নিয়ম
1. কম্পিউটারে **Node.js LTS** install করো: https://nodejs.org/
2. ZIP extract করো।
3. VS Code-এ `glow_cosmetics_store` folder খোলো।
4. VS Code Terminal খুলে লিখো:

```bash
npm install
npm start
```

5. Browser-এ খোলো: http://localhost:3000

**মনে রেখো:** শুধু `index.html` ফাইল double-click করে খুলবে না। Backend কাজ করতে `npm start` দিয়ে server চালাতে হবে।

## ৩) Frontend আর backend কীভাবে link করা?
এখানে link আগে থেকেই করা আছে। `public/app.js` ফাইলে এই লাইন backend API থেকে product আনে:

```js
const response = await fetch("/api/products");
```

Search/filter করার সময় query string-সহ `/api/products?category=Skincare&search=serum` পাঠায়।

Checkout-এর সময় এই request backend-এ order পাঠায়:

```js
const response = await fetch("/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
```

`server.js`-এ `app.get("/api/products", ...)` product পাঠায় এবং `app.post("/api/orders", ...)` order validate করে `data/orders.json`-এ save করে। একই domain/port থেকে frontend ও API চলছে, তাই local development-এ আলাদা URL বা CORS setup লাগবে না।

## ৪) নিজের product যোগ করবে কীভাবে?
`server.js` ফাইলে `const products = [...]` array-তে product object যোগ/পরিবর্তন করো। প্রতিটি product-এর `id` unique number হওয়া চাই। উদাহরণ:

```js
{
  id: 7,
  name: "Berry Lip Tint",
  category: "Makeup",
  price: 450,
  oldPrice: 520,
  rating: 4.8,
  tag: "NEW",
  color: "pink",
  emoji: "💋",
  description: "A soft berry tint for everyday."
}
```

`color` হিসেবে CSS-এ থাকা class ব্যবহার করো: `rose`, `plum`, `cream`, `sun`, `pink`, `lilac`। Product-এর ছবি ব্যবহার করতে চাইলে emoji-এর জায়গায় image field যোগ করে `app.js`-এ image render করতে হবে।

## ৫) Important
- Checkout এখন **demo order** নেয়; online payment যুক্ত করা হয়নি।
- Real store চালুর আগে database (যেমন PostgreSQL/MySQL), admin login, stock management, server-side security/validation, shipping logic, এবং payment provider integration যোগ করা উচিত।
- `GET /api/orders` demo হিসেবে order list দেখায়—public production site-এ authentication ছাড়া এটি expose করা নিরাপদ নয়।
- `data/orders.json`-এ customer details থাকে; ফাইলটি public folder-এর বাইরে রাখা হয়েছে।
