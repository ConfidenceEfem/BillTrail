import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { createApp } from "../src/app";
import {prisma} from "../src/lib/prisma"

const app = createApp();



describe("health", () => {
  it("GET /api/v1/health returns ok", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});

describe("error handling", () => {
  it("returns a structured 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns a structured 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{ this is not json");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });
});

// beforeAll(async () => {
//   await prisma.$queryRaw`SELECT 1`;
// }, 20_000);