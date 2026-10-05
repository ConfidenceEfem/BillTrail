import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { createAuthedUser } from "./helpers";

const app = createApp();

describe("GET/PATCH /api/v1/business/me", () => {
  it("returns and updates the caller's own business", async () => {
    const owner = await createAuthedUser("Original Name");

    const getRes = await request(app).get("/api/v1/business/me").set("Authorization", owner.authHeader);
    expect(getRes.body.data.name).toBe("Original Name");

    const patchRes = await request(app)
      .patch("/api/v1/business/me")
      .set("Authorization", owner.authHeader)
      .send({ phone: "08011112222" });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.phone).toBe("08011112222");
  });

  it("never lets one business update another's details", async () => {
    const a = await createAuthedUser("Business A");
    const b = await createAuthedUser("Business B");

    await request(app)
      .patch("/api/v1/business/me")
      .set("Authorization", b.authHeader)
      .send({ name: "Hijacked Name" });

    const check = await request(app).get("/api/v1/business/me").set("Authorization", a.authHeader);
    expect(check.body.data.name).toBe("Business A");
  });
});