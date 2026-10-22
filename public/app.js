const state = { products: [], category: "All", search: "", cart: [] };
const $ = (selector) => document.querySelector(selector);
const money = (amount) => `৳${Number(amount).toLocaleString("en-BD")}`;

async function loadProducts() {
  const params = new URLSearchParams();
  if (state.category !== "All") params.set("category", state.category);
  if (state.search) params.set("search", state.search);
  try {
    const response = await fetch(`/api/products?${params}`);
    if (!response.ok) throw new Error("Could not load products");
    state.products = await response.json();
    renderProducts();
  } catch (error) {
    $("#productGrid").innerHTML = '<p class="empty-results">Products could not load. Make sure the server is running.</p>';
  }
}
function renderProducts() {
  const grid = $("#productGrid");
  if (!state.products.length) {
    grid.innerHTML = '<p class="empty-results">No products found. Try another search ♡</p>';
    return;
  }
  grid.innerHTML = state.products.map((p, index) => `
    <article class="product-card" style="animation-delay:${index * 70}ms">
      <div class="product-visual ${p.color}">
        <span class="product-tag">${p.tag}</span><span class="product-emoji" aria-hidden="true">${p.emoji}</span>
        <button class="quick-add" data-add="${p.id}">＋ Add to bag</button>
      </div>
      <div class="product-info"><div class="product-topline"><h3 class="product-name">${p.name}</h3><span class="rating">★ ${p.rating}</span></div>
      <p class="product-category">${p.category} · ${p.description}</p><div class="price-row"><span class="price">${money(p.price)}</span>${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}</div></div>
    </article>`).join("");
}
function setCategory(category) {
  state.category = category;
  document.querySelectorAll(".filter").forEach(button => button.classList.toggle("active", button.dataset.category === category));
  loadProducts();
}
function addToCart(id) {
  const product = state.products.find(item => item.id === Number(id)) || allProductCache.find(item => item.id === Number(id));
  if (!product) return;
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ ...product, quantity: 1 });
  renderCart();
  showToast(`${product.name} added to your bag ♡`);
}
let allProductCache = [];
async function initProductCache() {
  try { allProductCache = await (await fetch("/api/products")).json(); } catch (_) {}
}
function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $("#cartCount").textContent = count;
  $("#drawerCount").textContent = `(${count})`;
  $("#cartTotal").textContent = money(total);
  $("#checkoutTotal").textContent = money(total);
  $("#cartItems").innerHTML = state.cart.length ? state.cart.map(item => `
    <div class="cart-item"><div class="cart-item-art">${item.emoji}</div><div><h4>${item.name}</h4><small>${money(item.price)} each</small><div class="quantity"><button data-qty="${item.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-qty="${item.id}" data-change="1" aria-label="Increase quantity">+</button></div></div><button class="remove-item" data-remove="${item.id}" aria-label="Remove item">×</button></div>`).join("") : '<p class="empty-cart">Your bag is looking a little lonely ♡</p>';
}
function openCart() { $("#cartDrawer").classList.add("open"); $("#cartBackdrop").classList.add("open"); }
function closeCart() { $("#cartDrawer").classList.remove("open"); $("#cartBackdrop").classList.remove("open"); }
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}
document.addEventListener("click", event => {
  const add = event.target.closest("[data-add]");
  if (add) addToCart(add.dataset.add);
  const filter = event.target.closest("[data-category]");
  if (filter) { event.preventDefault(); setCategory(filter.dataset.category); $("#shop").scrollIntoView({ behavior: "smooth" }); }
  const qty = event.target.closest("[data-qty]");
  if (qty) {
    const item = state.cart.find(p => p.id === Number(qty.dataset.qty));
    if (item) item.quantity += Number(qty.dataset.change);
    state.cart = state.cart.filter(p => p.quantity > 0); renderCart();
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) { state.cart = state.cart.filter(p => p.id !== Number(remove.dataset.remove)); renderCart(); }
});
$("#filters").addEventListener("click", event => {
  const button = event.target.closest(".filter");
  if (button) setCategory(button.dataset.category);
});
let searchTimer;
$("#searchInput").addEventListener("input", event => {
  clearTimeout(searchTimer); state.search = event.target.value.trim();
  searchTimer = setTimeout(loadProducts, 250);
});
$("#searchToggle").addEventListener("click", () => { $("#searchBox").scrollIntoView({ behavior: "smooth", block: "center" }); $("#searchInput").focus(); });
$("#cartOpen").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
$("#cartBackdrop").addEventListener("click", closeCart);
$("#menuToggle").addEventListener("click", () => $("#nav").classList.toggle("open"));
$("#nav").addEventListener("click", event => { if (event.target.closest("a")) $("#nav").classList.remove("open"); });
$("#checkoutOpen").addEventListener("click", () => {
  if (!state.cart.length) { showToast("Add a product to your bag first ♡"); return; }
  closeCart(); $("#checkoutBackdrop").classList.add("open");
});
$("#checkoutClose").addEventListener("click", () => $("#checkoutBackdrop").classList.remove("open"));
$("#checkoutBackdrop").addEventListener("click", event => { if (event.target.id === "checkoutBackdrop") $("#checkoutBackdrop").classList.remove("open"); });
$("#checkoutForm").addEventListener("submit", async event => {
  event.preventDefault();
  const message = $("#checkoutMessage");
  const form = new FormData(event.currentTarget);
  const payload = {
    customer: form.get("customer"), phone: form.get("phone"), address: form.get("address"),
    items: state.cart.map(item => ({ id: item.id, quantity: item.quantity }))
  };
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  submitButton.disabled = true; submitButton.textContent = "Placing your order…"; message.textContent = "";
  try {
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Order could not be placed");
    message.textContent = `Thank you! Your order number is ${result.order.id}. This is a demo checkout; no payment was taken.`;
    state.cart = []; renderCart(); event.currentTarget.reset(); showToast("Your order has been received ♡");
  } catch (error) {
    message.textContent = `${error.message}. Please try again.`;
  } finally {
    submitButton.disabled = false; submitButton.innerHTML = "Place my order ♡";
  }
});
$("#newsletterForm").addEventListener("submit", event => {
  event.preventDefault();
  $("#newsletterMessage").textContent = "You're on the list — thanks for joining our demo newsletter! ♡";
  event.currentTarget.reset();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") { closeCart(); $("#checkoutBackdrop").classList.remove("open"); $("#nav").classList.remove("open"); }
});
loadProducts();
initProductCache();
renderCart();
