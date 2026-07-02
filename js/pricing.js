/**
 * oloMAP pricing configuration.
 * Edit MIN_SAMPLES / TIERS here to update pricing sitewide — no other file needs to change.
 * Each tier's `price` applies to ALL samples in the order once the quantity falls in [min, max].
 */
const PRICING = {
  productName: "oloMAP",
  currency: "USD",
  currencySymbol: "$",
  minSamples: 8,
  tiers: [
    { min: 8, max: 20, price: 25 },
    { min: 21, max: 50, price: 20 },
    { min: 51, max: 100, price: 15 },
    { min: 101, max: Infinity, price: 10 },
  ],
};

function getTierForQuantity(quantity) {
  return PRICING.tiers.find((t) => quantity >= t.min && quantity <= t.max) || null;
}

function getNextTier(quantity) {
  return PRICING.tiers.find((t) => t.min > quantity) || null;
}

function calculatePrice(quantity) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (qty < PRICING.minSamples) {
    return {
      quantity: qty,
      valid: false,
      unitPrice: null,
      total: null,
      tier: null,
      nextTier: PRICING.tiers[0],
    };
  }
  const tier = getTierForQuantity(qty);
  const nextTier = getNextTier(qty);
  const unitPrice = tier ? tier.price : PRICING.tiers[PRICING.tiers.length - 1].price;
  return {
    quantity: qty,
    valid: true,
    unitPrice,
    total: qty * unitPrice,
    tier,
    nextTier,
  };
}

function formatCurrency(amount) {
  return `${PRICING.currencySymbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
