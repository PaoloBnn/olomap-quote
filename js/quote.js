/**
 * Client-side PDF quote generation using jsPDF (loaded via CDN in index.html).
 * No backend involved — the PDF is built and downloaded entirely in the browser.
 */
function generateQuoteNumber(now) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `OLM-${y}${m}${d}-${rand}`;
}

function generateQuotePdf({ customer, cart, quoteNumber, issueDate, validUntil }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("oloBion", marginX, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Quote", 547, y - 6, { align: "right" });
  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Quote #: ${quoteNumber}`, 547, y, { align: "right" });
  y += 14;
  doc.text(`Issued: ${issueDate}`, 547, y, { align: "right" });
  y += 14;
  doc.text(`Valid until: ${validUntil}`, 547, y, { align: "right" });
  doc.setTextColor(0);

  y = 110;
  doc.setDrawColor(220);
  doc.line(marginX, y, 547, y);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Prepared for", marginX, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const custLines = [
    customer.name,
    customer.company,
    customer.email,
    customer.phone,
  ].filter(Boolean);
  custLines.forEach((line) => {
    doc.text(line, marginX, y);
    y += 14;
  });

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Product: oloMAP Lipidomics Profiling", marginX, y);
  y += 20;

  const colX = { batch: marginX, qty: 330, unit: 400, total: 480 };
  doc.setFontSize(10);
  doc.setFillColor(245, 247, 250);
  doc.rect(marginX, y - 12, 547 - marginX, 20, "F");
  doc.text("Batch / Note", colX.batch + 4, y + 2);
  doc.text("Samples", colX.qty, y + 2);
  doc.text("$/Sample", colX.unit, y + 2);
  doc.text("Line Total", colX.total, y + 2);
  y += 18;

  doc.setFont("helvetica", "normal");
  cart.forEach((item, idx) => {
    if (y > 720) {
      doc.addPage();
      y = 56;
    }
    const label = item.note && item.note.trim() ? item.note.trim() : `Batch ${idx + 1}`;
    doc.text(label, colX.batch + 4, y);
    doc.text(String(item.quantity), colX.qty, y);
    doc.text(formatCurrency(item.unitPrice), colX.unit, y);
    doc.text(formatCurrency(item.lineTotal), colX.total, y);
    y += 18;
  });

  y += 6;
  doc.setDrawColor(220);
  doc.line(marginX, y, 547, y);
  y += 22;

  const totalSamples = cartTotalSamples(cart);
  const grandTotal = cartGrandTotal(cart);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Total samples: ${totalSamples}`, marginX, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Grand Total: ${formatCurrency(grandTotal)}`, 547, y, { align: "right" });
  y += 34;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  const notes = [
    "Pricing reflects the volume tier applicable to each batch's sample count at time of quoting.",
    "This quote is an estimate and does not constitute a binding invoice or order confirmation.",
    "To proceed with this order, reply to this quote or contact us at hello@olobion.ai.",
  ];
  notes.forEach((line) => {
    doc.text(line, marginX, y, { maxWidth: 547 - marginX });
    y += 13;
  });

  doc.save(`${quoteNumber}.pdf`);
}
