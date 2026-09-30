import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { createAuthedUser } from "./helpers";

const app = createApp();

async function createSentInvoice(authHeader: string, businessId: string) {
  const clientRes = await request(app)
    .post("/api/v1/clients")
    .set("Authorization", authHeader)
    .send({ name: "Public Test Client", email: `public-${Date.now()}@example.com` });

  const invoiceRes = await request(app)
    .post("/api/v1/invoices")
    .set("Authorization", authHeader)
    .send({
      clientId: clientRes.body.data.id,
      items: [{ description: "Work", quantity: 1, unitPrice: 20_000_00 }],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

  await request(app).post(`/api/v1/invoices/${invoiceRes.body.data.id}/send`).set("Authorization", authHeader);

  return prisma.invoice.findUniqueOrThrow({ where: { id: invoiceRes.body.data.id } });
}

describe("GET /api/v1/public/invoices/:token", () => {
  it("returns a SENT invoice by its public token, with no auth", async () => {
    const owner = await createAuthedUser();
    const invoice = await createSentInvoice(owner.authHeader, owner.businessId);

    const res = await request(app).get(`/api/v1/public/invoices/${invoice.publicToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.number).toBe(invoice.number);
  });

  it("refuses to show a DRAFT invoice, even with its real token", async () => {
    const owner = await createAuthedUser();
    const client = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", owner.authHeader)
      .send({ name: "Draft Client", email: `draft-${Date.now()}@example.com` });
    const invoiceRes = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", owner.authHeader)
      .send({
        clientId: client.body.data.id,
        items: [{ description: "Work", quantity: 1, unitPrice: 1000_00 }],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    const res = await request(app).get(`/api/v1/public/invoices/${invoiceRes.body.data.publicToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a token that doesn't exist", async () => {
    const res = await request(app).get("/api/v1/public/invoices/not-a-real-token-at-all");
    expect(res.status).toBe(404);
  });
});