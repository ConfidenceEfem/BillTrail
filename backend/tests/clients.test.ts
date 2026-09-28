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

  expect(res.status).toBe(201);
  return res.body.data as { id: string; name: string; businessId: string };
}

describe("clients: authentication", () => {
  it("rejects every route without a token", async () => {
    const res = await request(app).get("/api/v1/clients");
    expect(res.status).toBe(401);
  });
});

describe("clients: create", () => {
  it("creates a client under the logged-in business", async () => {
    const owner = await createAuthedUser();

    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", owner.authHeader)
      .send({ name: "Acme Ltd", email: "Billing@Acme.com", phone: "08012345678" });

    expect(res.status).toBe(201);
    expect(res.body.data.businessId).toBe(owner.businessId);
    expect(res.body.data.email).toBe("billing@acme.com"); // normalised to lowercase
  });

  it("rejects a duplicate email within the same business", async () => {
    const owner = await createAuthedUser();
    const payload = { name: "Acme Ltd", email: uniqueClientEmail() };

    const first = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", owner.authHeader)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", owner.authHeader)
      .send(payload);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("CONFLICT");
  });

  it("rejects invalid input with a structured 400", async () => {
    const owner = await createAuthedUser();

    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", owner.authHeader)
      .send({ name: "A", email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toHaveLength(2);
  });

  it("ignores a businessId sent in the body and uses the token's business", async () => {
    const attacker = await createAuthedUser("Attacker Co");
    const victim = await createAuthedUser("Victim Co");

    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", attacker.authHeader)
      .send({ name: "Sneaky", email: uniqueClientEmail(), businessId: victim.businessId });

    expect(res.status).toBe(201);
    expect(res.body.data.businessId).toBe(attacker.businessId);

    const victimList = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", victim.authHeader);
    expect(victimList.body.meta.total).toBe(0);
  });
});

describe("clients: list", () => {
  it("paginates and reports totals", async () => {
    const owner = await createAuthedUser();
    await createClientFor(owner.authHeader, "One Ltd");
    await createClientFor(owner.authHeader, "Two Ltd");
    await createClientFor(owner.authHeader, "Three Ltd");

    const page1 = await request(app)
      .get("/api/v1/clients")
      .query({ page: 1, pageSize: 2 })
      .set("Authorization", owner.authHeader);
    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.meta.total).toBe(3);

    const page2 = await request(app)
      .get("/api/v1/clients")
      .query({ page: 2, pageSize: 2 })
      .set("Authorization", owner.authHeader);
    expect(page2.body.data).toHaveLength(1);
  });

  it("only ever returns the caller's own clients", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const a1 = await createClientFor(a.authHeader);
    const a2 = await createClientFor(a.authHeader);
    const b1 = await createClientFor(b.authHeader);

    const res = await request(app).get("/api/v1/clients").set("Authorization", a.authHeader);

    const ids = res.body.data.map((c: { id: string }) => c.id);
    expect(res.body.meta.total).toBe(2);
    expect(ids).toContain(a1.id);
    expect(ids).toContain(a2.id);
    expect(ids).not.toContain(b1.id);
  });
});

describe("clients: update", () => {
  it("updates only the fields sent", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader, "Old Name");

    const res = await request(app)
      .patch(`/api/v1/clients/${client.id}`)
      .set("Authorization", owner.authHeader)
      .send({ phone: "09099999999" });

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("09099999999");
    expect(res.body.data.name).toBe("Old Name");
  });

  it("rejects changing the email to one another client already uses", async () => {
    const owner = await createAuthedUser();
    const first = await createClientFor(owner.authHeader);
    const second = await createClientFor(owner.authHeader);

    const firstRecord = await request(app)
      .get(`/api/v1/clients/${first.id}`)
      .set("Authorization", owner.authHeader);

    const res = await request(app)
      .patch(`/api/v1/clients/${second.id}`)
      .set("Authorization", owner.authHeader)
      .send({ email: firstRecord.body.data.email });

    expect(res.status).toBe(409);
  });
});

describe("clients: delete", () => {
  it("deletes a client that has no invoices", async () => {
    const owner = await createAuthedUser();
    const client = await createClientFor(owner.authHeader);

    const del = await request(app)
      .delete(`/api/v1/clients/${client.id}`)
      .set("Authorization", owner.authHeader);
    expect(del.status).toBe(204);

    const after = await request(app)
      .get(`/api/v1/clients/${client.id}`)
      .set("Authorization", owner.authHeader);
    expect(after.status).toBe(404);
  });
});

describe("clients: input validation on ids", () => {
  it("returns 400 for an id that is not a UUID", async () => {
    const owner = await createAuthedUser();

    const res = await request(app)
      .get("/api/v1/clients/banana")
      .set("Authorization", owner.authHeader);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("clients: tenant isolation (the most important tests in this file)", () => {
  it("Business B cannot read Business A's client", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const client = await createClientFor(a.authHeader);

    const res = await request(app)
      .get(`/api/v1/clients/${client.id}`)
      .set("Authorization", b.authHeader);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("Business B cannot edit Business A's client", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const client = await createClientFor(a.authHeader, "Original Name");

    const res = await request(app)
      .patch(`/api/v1/clients/${client.id}`)
      .set("Authorization", b.authHeader)
      .send({ name: "Hijacked" });
    expect(res.status).toBe(404);

    const check = await request(app)
      .get(`/api/v1/clients/${client.id}`)
      .set("Authorization", a.authHeader);
    expect(check.status).toBe(200);
    expect(check.body.data.name).toBe("Original Name");
  });

  it("Business B cannot delete Business A's client", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");
    const client = await createClientFor(a.authHeader);

    const res = await request(app)
      .delete(`/api/v1/clients/${client.id}`)
      .set("Authorization", b.authHeader);
    expect(res.status).toBe(404);

    const check = await request(app)
      .get(`/api/v1/clients/${client.id}`)
      .set("Authorization", a.authHeader);
    expect(check.status).toBe(200);
  });
});