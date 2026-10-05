import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { createAuthedUser } from "./helpers";

const app = createApp();

function uniqueClientEmail() {
  return `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function createSentInvoice(authHeader: string) {
  const clientRes = await request(app)
    .post("/api/v1/clients")
    .set("Authorization", authHeader)
    .send({ name: "PDF Test Client", email: uniqueClientEmail() });

  const invoiceRes = await request(app)
    .post("/api/v1/invoices")
    .set("Authorization", authHeader)
    .send({
      clientId: clientRes.body.data.id,
      items: [{ description: "Work", quantity: 1, unitPrice: 10_000_00 }],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

  await request(app).post(`/api/v1/invoices/${invoiceRes.body.data.id}/send`).set("Authorization", authHeader);
  return invoiceRes.body.data;
}

describe("GET /invoices/:id/pdf", () => {
  it("returns a real PDF for the owning business", async () => {
    const owner = await createAuthedUser();
    const invoice = await createSentInvoice(owner.authHeader);

    const res = await request(app)
      .get(`/api/v1/invoices/${invoice.id}/pdf`)
      .set("Authorization", owner.authHeader);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    // Every valid PDF file starts with this exact 5-byte signature.
    expect(res.body.slice(0, 5).toString()).toBe("%PDF-");
  });

  it("refuses another business's invoice", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const invoice = await createSentInvoice(a.authHeader);

    const res = await request(app)
      .get(`/api/v1/invoices/${invoice.id}/pdf`)
      .set("Authorization", b.authHeader);

    expect(res.status).toBe(404);
  });
});

describe("GET /public/invoices/:token/pdf", () => {
  it("returns a PDF with no auth, for a sent invoice", async () => {
    const owner = await createAuthedUser();
    const invoice = await createSentInvoice(owner.authHeader);

    const res = await request(app).get(`/api/v1/public/invoices/${invoice.publicToken}/pdf`);

    expect(res.status).toBe(200);
    expect(res.body.slice(0, 5).toString()).toBe("%PDF-");
  });
});