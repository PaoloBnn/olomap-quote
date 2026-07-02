document.addEventListener("DOMContentLoaded", () => {
  const qtyInput = document.getElementById("qty-input");
  const noteInput = document.getElementById("note-input");
  const qtyDecrement = document.getElementById("qty-decrement");
  const qtyIncrement = document.getElementById("qty-increment");

  const unitPriceEl = document.getElementById("unit-price");
  const lineTotalEl = document.getElementById("line-total");
  const tierBadgeEl = document.getElementById("tier-badge");
  const nudgeEl = document.getElementById("tier-nudge");
  const minWarningEl = document.getElementById("min-warning");
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  const tierRows = document.querySelectorAll("#pricing-table tbody tr");

  const cartToggleBtn = document.getElementById("cart-toggle-btn");
  const cartCountEl = document.getElementById("cart-count");
  const cartDrawer = document.getElementById("cart-drawer");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartCloseBtn = document.getElementById("cart-close-btn");
  const cartItemsEl = document.getElementById("cart-items");
  const cartEmptyEl = document.getElementById("cart-empty");
  const cartGrandTotalEl = document.getElementById("cart-grand-total");
  const cartSamplesEl = document.getElementById("cart-samples");
  const requestQuoteBtn = document.getElementById("request-quote-btn");
  const clearCartBtn = document.getElementById("clear-cart-btn");

  const quoteModal = document.getElementById("quote-modal");
  const quoteOverlay = document.getElementById("quote-overlay");
  const quoteCloseBtn = document.getElementById("quote-close-btn");
  const quoteForm = document.getElementById("quote-form");
  const quoteSuccess = document.getElementById("quote-success");

  const askDemoBtn = document.getElementById("ask-demo-btn");
  const demoModal = document.getElementById("demo-modal");
  const demoOverlay = document.getElementById("demo-overlay");
  const demoCloseBtn = document.getElementById("demo-close-btn");
  const demoForm = document.getElementById("demo-form");
  const demoSuccess = document.getElementById("demo-success");
  const demoDoneBtn = document.getElementById("demo-done-btn");

  function renderCalculator() {
    const qty = Number(qtyInput.value) || 0;
    const result = calculatePrice(qty);

    minWarningEl.hidden = qty === 0 || result.valid;
    addToCartBtn.disabled = !result.valid;

    if (result.valid) {
      unitPriceEl.textContent = formatCurrency(result.unitPrice);
      lineTotalEl.textContent = formatCurrency(result.total);
      tierBadgeEl.textContent = `${result.tier.min}${result.tier.max === Infinity ? "+" : "–" + result.tier.max} samples`;
      if (result.nextTier) {
        const samplesToNext = result.nextTier.min - result.quantity;
        nudgeEl.textContent = `Add ${samplesToNext} more sample${samplesToNext === 1 ? "" : "s"} to drop to ${formatCurrency(result.nextTier.price)}/sample.`;
        nudgeEl.hidden = false;
      } else {
        nudgeEl.hidden = true;
      }
    } else {
      unitPriceEl.textContent = "—";
      lineTotalEl.textContent = "—";
      tierBadgeEl.textContent = "";
      nudgeEl.hidden = true;
    }

    tierRows.forEach((row) => {
      const min = Number(row.dataset.min);
      const max = row.dataset.max === "inf" ? Infinity : Number(row.dataset.max);
      row.classList.toggle("active-tier", result.valid && qty >= min && qty <= max);
    });
  }

  qtyDecrement.addEventListener("click", () => {
    qtyInput.value = Math.max(0, (Number(qtyInput.value) || 0) - 1);
    renderCalculator();
  });
  qtyIncrement.addEventListener("click", () => {
    qtyInput.value = (Number(qtyInput.value) || 0) + 1;
    renderCalculator();
  });
  qtyInput.addEventListener("input", renderCalculator);

  addToCartBtn.addEventListener("click", () => {
    const qty = Number(qtyInput.value) || 0;
    addCartItem(qty, noteInput.value, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    noteInput.value = "";
    renderCart();
    openCart();
  });

  function renderCart() {
    const cart = loadCart();
    cartCountEl.textContent = String(cartTotalSamples(cart) > 0 ? cart.length : 0);
    cartCountEl.hidden = cart.length === 0;
    cartEmptyEl.hidden = cart.length !== 0;
    cartItemsEl.innerHTML = "";

    cart.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-main">
          <strong>${item.note && item.note.trim() ? escapeHtml(item.note.trim()) : `Batch ${idx + 1}`}</strong>
          <span class="cart-item-meta">${item.quantity} samples · ${formatCurrency(item.unitPrice)}/sample</span>
        </div>
        <div class="cart-item-actions">
          <span class="cart-item-total">${formatCurrency(item.lineTotal)}</span>
          <button type="button" class="icon-btn remove-item-btn" data-id="${item.id}" aria-label="Remove batch">&times;</button>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });

    cartItemsEl.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeCartItem(btn.dataset.id);
        renderCart();
      });
    });

    const grandTotal = cartGrandTotal(cart);
    cartGrandTotalEl.textContent = formatCurrency(grandTotal);
    cartSamplesEl.textContent = String(cartTotalSamples(cart));
    requestQuoteBtn.disabled = cart.length === 0;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("visible");
  }
  function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("visible");
  }
  cartToggleBtn.addEventListener("click", openCart);
  cartCloseBtn.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  clearCartBtn.addEventListener("click", () => {
    clearCart();
    renderCart();
  });

  function openQuoteModal() {
    quoteModal.classList.add("open");
    quoteOverlay.classList.add("visible");
    quoteForm.hidden = false;
    quoteSuccess.hidden = true;
  }
  function closeQuoteModal() {
    quoteModal.classList.remove("open");
    quoteOverlay.classList.remove("visible");
  }
  requestQuoteBtn.addEventListener("click", openQuoteModal);
  quoteCloseBtn.addEventListener("click", closeQuoteModal);
  quoteOverlay.addEventListener("click", closeQuoteModal);

  quoteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cart = loadCart();
    if (cart.length === 0) return;

    const customer = {
      name: document.getElementById("quote-name").value.trim(),
      company: document.getElementById("quote-company").value.trim(),
      email: document.getElementById("quote-email").value.trim(),
      phone: document.getElementById("quote-phone").value.trim(),
    };

    const now = new Date();
    const validUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

    generateQuotePdf({
      customer,
      cart,
      quoteNumber: generateQuoteNumber(now),
      issueDate: fmt(now),
      validUntil: fmt(validUntilDate),
    });

    quoteForm.hidden = true;
    quoteSuccess.hidden = false;
  });

  function openDemoModal() {
    demoModal.classList.add("open");
    demoOverlay.classList.add("visible");
    demoForm.hidden = false;
    demoSuccess.hidden = true;
  }
  function closeDemoModal() {
    demoModal.classList.remove("open");
    demoOverlay.classList.remove("visible");
  }
  askDemoBtn.addEventListener("click", openDemoModal);
  demoCloseBtn.addEventListener("click", closeDemoModal);
  demoOverlay.addEventListener("click", closeDemoModal);
  demoDoneBtn.addEventListener("click", closeDemoModal);

  demoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("demo-name").value.trim();
    const email = document.getElementById("demo-email").value.trim();
    const accessItems = Array.from(
      demoForm.querySelectorAll('input[name="demo-access"]:checked')
    ).map((el) => el.value);

    const subject = `Demo Request - ${name}`;
    const accessList = accessItems.length ? accessItems.map((i) => `- ${i}`).join("\n") : "Not specified";
    const body = `Name: ${name}\nEmail: ${email}\n\nRequested demo access:\n${accessList}`;
    const mailtoUrl = `mailto:info@olobion.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    demoForm.hidden = true;
    demoSuccess.hidden = false;
  });

  renderCalculator();
  renderCart();
});
