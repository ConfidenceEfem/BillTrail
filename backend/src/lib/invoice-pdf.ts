import PDFDocument from "pdfkit";
import { formatKobo } from "./money";

type InvoicePdfData = {
  number: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  business: { name: string; phone: string | null; address: string | null };
  client: { name: string; email: string };
  items: Array<{ description: string; quantity: number; unitPrice: number; lineTotal: number }>;
};

export function generateInvoicePdf(invoice: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(20).fillColor("#26215C").text(invoice.business.name, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666666");
    if (invoice.business.phone) doc.text(invoice.business.phone);
    if (invoice.business.address) doc.text(invoice.business.address);

    doc.moveUp(invoice.business.phone || invoice.business.address ? 2 : 1);
    doc
      .fontSize(16)
      .fillColor("#111111")
      .text(`INVOICE ${invoice.number}`, { align: "right" });
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text(`Status: ${invoice.status}`, { align: "right" })
      .text(`Issued: ${invoice.issueDate.toLocaleDateString("en-NG", { dateStyle: "medium" })}`, {
        align: "right",
      })
      .text(`Due: ${invoice.dueDate.toLocaleDateString("en-NG", { dateStyle: "medium" })}`, {
        align: "right",
      });

    doc.moveDown(2);

    // Bill to
    doc.fontSize(10).fillColor("#999999").text("BILL TO");
    doc.fontSize(12).fillColor("#111111").text(invoice.client.name);
    doc.fontSize(10).fillColor("#666666").text(invoice.client.email);

    doc.moveDown(1.5);

    // Line items table
    const tableTop = doc.y;
    const col = { desc: 50, qty: 320, price: 390, total: 470 };

    doc.fontSize(9).fillColor("#999999");
    doc.text("DESCRIPTION", col.desc, tableTop);
    doc.text("QTY", col.qty, tableTop);
    doc.text("UNIT PRICE", col.price, tableTop);
    doc.text("TOTAL", col.total, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .strokeColor("#DDDDDD")
      .stroke();

    let rowY = tableTop + 25;
    doc.fontSize(10).fillColor("#111111");
    for (const item of invoice.items) {
      doc.text(item.description, col.desc, rowY, { width: 260 });
      doc.text(String(item.quantity), col.qty, rowY);
      doc.text(formatKobo(item.unitPrice, invoice.currency), col.price, rowY);
      doc.text(formatKobo(item.lineTotal, invoice.currency), col.total, rowY);
      rowY += 22;
    }

    doc
      .moveTo(50, rowY + 5)
      .lineTo(545, rowY + 5)
      .strokeColor("#DDDDDD")
      .stroke();

    // Totals
    let totalsY = rowY + 20;
    const totalsRow = (label: string, value: string, bold = false) => {
      doc.fontSize(bold ? 12 : 10).fillColor(bold ? "#111111" : "#666666");
      doc.text(label, 380, totalsY, { width: 90, align: "right" });
      doc.text(value, col.total, totalsY, { width: 75, align: "right" });
      totalsY += bold ? 22 : 18;
    };

    totalsRow("Subtotal", formatKobo(invoice.subtotal, invoice.currency));
    totalsRow("Tax", formatKobo(invoice.taxAmount, invoice.currency));
    totalsRow("Discount", `-${formatKobo(invoice.discountAmount, invoice.currency)}`);
    totalsRow("Total", formatKobo(invoice.total, invoice.currency), true);

    if (invoice.notes) {
      doc.moveDown(3);
      doc.fontSize(9).fillColor("#999999").text("NOTES");
      doc.fontSize(10).fillColor("#666666").text(invoice.notes);
    }

    doc.end();
  });
}