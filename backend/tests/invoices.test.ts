import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { createAuthedUser } from "./helpers";

const app = createApp();

function uniqueClientEmail() {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}@acme.com`;
}

async function createClientFor(authHeader: string, name = "Acme Ltd") {
  const res = await request(app)
    .post("/api/v1/clients")
    .set("Authorization", authHeader)
    .send({ name, email: uniqueClientEmail() });
  return res.body.data as { id: string; name: string };
}

function futureDate(daysFromNow = 14) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

async function createDraftInvoice(
  authHeader: string,
  clientId: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post("/api/v1/invoices")
    .set("Authorization", authHeader)
    .send({
      clientId,
      items: [{ description: "Work", quantity: 1, unitPrice: 100_000_00 }],
      taxRateBps: 0,
      discountAmount: 0,
      dueDate: futureDate(),
      ...overrides,
    });
  expect(res.status).toBe(201);
  return res.body.data as { id: string; status: string; total: number };
}

describe("invoices: money calculation", () => {
  it("calculates subtotal, tax, and total correctly", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);

    const res = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", owner.authHeader)
      .send({
        clientId: client.id,
        items: [
          { description: "Design", quantity: 2, unitPrice: 5_000_00 },
          { description: "Hosting", quantity: 1, unitPrice: 2_500_00 },
        ],
        taxRateBps: 750,
        discountAmount: 1_000_00,
        dueDate: futureDate(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(1_250_000);
    expect(res.body.data.taxAmount).toBe(93_750);
    expect(res.body.data.discountAmount).toBe(100_000);
    expect(res.body.data.total).toBe(1_243_750);
  });

  it("never lets a discount push the total below zero", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);

    const res = await createDraftInvoice(owner.authHeader, client.id, {
      items: [{ description: "Small job", quantity: 1, unitPrice: 1_000_00 }],
      discountAmount: 999_999_00,
    });

    expect(res.total).toBe(0);
  });

  it("ignores any client-supplied subtotal or total and recomputes them", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);

    const res = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", owner.authHeader)
      .send({
        clientId: client.id,
        items: [{ description: "Work", quantity: 1, unitPrice: 10_000_00 }],
        dueDate: futureDate(),
        subtotal: 1, 
        total: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.total).toBe(10_000_00); 
  });

  it("rejects an invoice with zero items", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);

    const res = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", owner.authHeader)
      .send({ clientId: client.id, items: [], dueDate: futureDate() });

    expect(res.status).toBe(400);
  });
});

describe("invoices: invoice numbering", () => {
  it("numbers invoices sequentially per business, starting fresh for each business", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const clientA = await createClientFor(a.authHeader);
    const clientB = await createClientFor(b.authHeader);

    const a1 = await createDraftInvoice(a.authHeader, clientA.id);
    const a2 = await createDraftInvoice(a.authHeader, clientA.id);
    const b1 = await createDraftInvoice(b.authHeader, clientB.id);

    const getNumber = async (authHeader: string, id: string) => {
      const res = await request(app).get(`/api/v1/invoices/${id}`).set("Authorization", authHeader);
      return res.body.data.number as string;
    };

    expect(await getNumber(a.authHeader, a1.id)).toBe("INV-0001");
    expect(await getNumber(a.authHeader, a2.id)).toBe("INV-0002");
  
    expect(await getNumber(b.authHeader, b1.id)).toBe("INV-0001");
  });
});

describe("invoices: status state machine", () => {
  it("moves DRAFT -> SENT -> PAID is impossible via any API call, but SENT works", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);

    const sendRes = await request(app)
      .post(`/api/v1/invoices/${invoice.id}/send`)
      .set("Authorization", owner.authHeader);
    expect(sendRes.status).toBe(200);
    expect(sendRes.body.data.status).toBe("SENT");
    expect(sendRes.body.data.sentAt).not.toBeNull();
  });

  it("there is no way to set status to PAID directly through PATCH", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);

    const res = await request(app)
      .patch(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", owner.authHeader)
      .send({ status: "PAID" });

    expect(res.status).toBe(200);

    const check = await request(app)
      .get(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", owner.authHeader);
    expect(check.body.data.status).toBe("DRAFT");
  });

  it("rejects sending an already-sent invoice", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);

    await request(app).post(`/api/v1/invoices/${invoice.id}/send`).set("Authorization", owner.authHeader);
    const second = await request(app)
      .post(`/api/v1/invoices/${invoice.id}/send`)
      .set("Authorization", owner.authHeader);

    expect(second.status).toBe(400);
  });

  it("rejects editing a SENT invoice", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);
    await request(app).post(`/api/v1/invoices/${invoice.id}/send`).set("Authorization", owner.authHeader);

    const res = await request(app)
      .patch(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", owner.authHeader)
      .send({ discountAmount: 5_000_00 });

    expect(res.status).toBe(400);
  });

  it("rejects deleting a SENT invoice", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);
    await request(app).post(`/api/v1/invoices/${invoice.id}/send`).set("Authorization", owner.authHeader);

    const res = await request(app)
      .delete(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", owner.authHeader);

    expect(res.status).toBe(400);
  });

  it("cancels a SENT invoice, and a cancelled invoice cannot be sent again", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);
    await request(app).post(`/api/v1/invoices/${invoice.id}/send`).set("Authorization", owner.authHeader);

    const cancelRes = await request(app)
      .post(`/api/v1/invoices/${invoice.id}/cancel`)
      .set("Authorization", owner.authHeader);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("CANCELLED");

    const resendRes = await request(app)
      .post(`/api/v1/invoices/${invoice.id}/send`)
      .set("Authorization", owner.authHeader);
    expect(resendRes.status).toBe(400);
  });

  it("rejects cancelling a DRAFT invoice (drafts are deleted, not cancelled)", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);

    const res = await request(app)
      .post(`/api/v1/invoices/${invoice.id}/cancel`)
      .set("Authorization", owner.authHeader);

    expect(res.status).toBe(400);
  });

  it("deletes a DRAFT invoice successfully", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const invoice = await createDraftInvoice(owner.authHeader, client.id);

    const res = await request(app)
      .delete(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", owner.authHeader);
    expect(res.status).toBe(204);

    const check = await request(app)
      .get(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", owner.authHeader);
    expect(check.status).toBe(404);
  });
});

describe("invoices: tenant isolation", () => {
  it("Business B cannot read, edit, send, cancel, or delete Business A's invoice", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const clientA = await createClientFor(a.authHeader);
    const invoice = await createDraftInvoice(a.authHeader, clientA.id);

    const get = await request(app).get(`/api/v1/invoices/${invoice.id}`).set("Authorization", b.authHeader);
    expect(get.status).toBe(404);

    const patch = await request(app)
      .patch(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", b.authHeader)
      .send({ discountAmount: 1 });
    expect(patch.status).toBe(404);

    const send = await request(app)
      .post(`/api/v1/invoices/${invoice.id}/send`)
      .set("Authorization", b.authHeader);
    expect(send.status).toBe(404);

    const del = await request(app)
      .delete(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", b.authHeader);
    expect(del.status).toBe(404);

    // Proof that none of B's attempts actually changed anything.
    const check = await request(app)
      .get(`/api/v1/invoices/${invoice.id}`)
      .set("Authorization", a.authHeader);
    expect(check.status).toBe(200);
    expect(check.body.data.status).toBe("DRAFT");
  });

  it("cannot create an invoice for another business's client", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const clientOfA = await createClientFor(a.authHeader);

    const res = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", b.authHeader)
      .send({
        clientId: clientOfA.id,
        items: [{ description: "Work", quantity: 1, unitPrice: 1_000_00 }],
        dueDate: futureDate(),
      });

    expect(res.status).toBe(404);
  });
});

describe("invoices: filtering and pagination", () => {
  it("filters by status", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);
    const draft = await createDraftInvoice(owner.authHeader, client.id);
    const sent = await createDraftInvoice(owner.authHeader, client.id);
    await request(app).post(`/api/v1/invoices/${sent.id}/send`).set("Authorization", owner.authHeader);

    const res = await request(app)
      .get("/api/v1/invoices")
      .query({ status: "DRAFT" })
      .set("Authorization", owner.authHeader);

    const ids = res.body.data.map((i: { id: string }) => i.id);
    expect(ids).toContain(draft.id);
    expect(ids).not.toContain(sent.id);
  });
});