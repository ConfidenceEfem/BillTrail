import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { createAuthedUser } from "./helpers";

const app = createApp();

async function createClientFor(authHeader: string) {
  const res = await request(app)
    .post("/api/v1/clients")
    .set("Authorization", authHeader)
    .send({ name: "Dashboard Client", email: `dash-${Date.now()}-${Math.random()}@example.com` });
  return res.body.data as { id: string };
}

async function createInvoice(
  authHeader: string,
  clientId: string,
  unitPrice: number,
  dueDate: Date,
) {
  const res = await request(app)
    .post("/api/v1/invoices")
    .set("Authorization", authHeader)
    .send({
      clientId,
      items: [{ description: "Work", quantity: 1, unitPrice }],
      dueDate: dueDate.toISOString(),
    });
  return res.body.data as { id: string };
}

describe("GET /api/v1/dashboard/summary", () => {
  it("returns zeros for a brand new business with no invoices", async () => {
    const owner = await createAuthedUser();

    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", owner.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalRevenue: 0,
      outstanding: 0,
      overdueAmount: 0,
      overdueCount: 0,
    });
  });

  it("correctly separates revenue, outstanding, and overdue", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const paid = await createInvoice(owner.authHeader, client.id, 100_000_00, future);
    await request(app).post(`/api/v1/invoices/${paid.id}/send`).set("Authorization", owner.authHeader);
    await prisma.invoice.update({ where: { id: paid.id }, data: { status: "PAID", paidAt: new Date() } });

    const notDueYet = await createInvoice(owner.authHeader, client.id, 50_000_00, future);
    await request(app)
      .post(`/api/v1/invoices/${notDueYet.id}/send`)
      .set("Authorization", owner.authHeader);

    const overdue = await createInvoice(owner.authHeader, client.id, 30_000_00, past);
    await request(app).post(`/api/v1/invoices/${overdue.id}/send`).set("Authorization", owner.authHeader);

    await createInvoice(owner.authHeader, client.id, 999_999_00, future);

    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", owner.authHeader);

    expect(res.body.data.totalRevenue).toBe(100_000_00);
    expect(res.body.data.outstanding).toBe(50_000_00 + 30_000_00);
    expect(res.body.data.overdueAmount).toBe(30_000_00);
    expect(res.body.data.overdueCount).toBe(1);
  });

  it("never includes another business's invoices in the totals", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const clientB = await createClientFor(b.authHeader);

    const invoice = await createInvoice(
      b.authHeader,
      clientB.id,
      1_000_000_00,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
    await request(app).post(`/api/v1/invoices/${invoice.id}/send`).set("Authorization", b.authHeader);
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date() } });

    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", a.authHeader);

    expect(res.body.data.totalRevenue).toBe(0);
  });

  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/v1/dashboard/summary");
    expect(res.status).toBe(401);
  });
});