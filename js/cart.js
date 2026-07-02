/**
 * Cart persisted to localStorage so it survives page reloads.
 * Each line item is an independent batch (its own quantity/note) priced against PRICING tiers.
 */
const CART_STORAGE_KEY = "olomap_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addCartItem(quantity, note, idSeed) {
  const cart = loadCart();
  const pricing = calculatePrice(quantity);
  if (!pricing.valid) return cart;
  cart.push({
    id: idSeed,
    quantity: pricing.quantity,
    unitPrice: pricing.unitPrice,
    lineTotal: pricing.total,
    note: note || "",
  });
  saveCart(cart);
  return cart;
}

function removeCartItem(id) {
  const cart = loadCart().filter((item) => item.id !== id);
  saveCart(cart);
  return cart;
}

function updateCartItemQuantity(id, quantity) {
  const cart = loadCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return cart;
  const pricing = calculatePrice(quantity);
  if (!pricing.valid) return cart;
  item.quantity = pricing.quantity;
  item.unitPrice = pricing.unitPrice;
  item.lineTotal = pricing.total;
  saveCart(cart);
  return cart;
}

function clearCart() {
  saveCart([]);
  return [];
}

function cartGrandTotal(cart) {
  return cart.reduce((sum, item) => sum + item.lineTotal, 0);
}

function cartTotalSamples(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
