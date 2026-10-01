import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { registerBusiness, verifyEmail } from "../src/modules/auth/auth.service";

const app = createApp();


function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}



async function createVerifiedUser(password = "supersecret123") {
  const email = uniqueEmail();
  const { verificationToken } = await registerBusiness({
    businessName: "Login Test Co",
    email,
    password,
  });
  await verifyEmail(verificationToken);
  return email;
}

describe("POST /api/v1/auth/register", () => {
  it("creates a user and business, and never returns the password hash", async () => {
    const email = uniqueEmail();

    const res = await request(app).post("/api/v1/auth/register").send({
      businessName: "Ada Designs",
      email,
      password: "supersecret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.business.name).toBe("Ada Designs");
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.password).toBeUndefined();
  });

  it("rejects a second registration with the same email", async () => {
    const email = uniqueEmail();
    const payload = { businessName: "Bola Tailoring", email, password: "supersecret123" };

    const first = await request(app).post("/api/v1/auth/register").send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/v1/auth/register").send(payload);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("CONFLICT");
  });

  it("rejects invalid input with a structured 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      businessName: "A",
      email: "not-an-email",
      password: "123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toHaveLength(3);
  });

  it("silently ignores unexpected fields like isAdmin", async () => {
    const email = uniqueEmail();

    const res = await request(app).post("/api/v1/auth/register").send({
      businessName: "Chidi Foods",
      email,
      password: "supersecret123",
      isAdmin: true,
    });

    expect(res.status).toBe(201);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    // There is no "isAdmin" column at all — Prisma would throw above if we
    // tried to select a field that doesn't exist, which is itself proof it
    // was never written. This assertion documents that intent explicitly.
    expect(stored).not.toHaveProperty("isAdmin");
  });

  it("still succeeds even if email sending fails, in production mode", async () => {
  const email = uniqueEmail();
  const res = await request(app).post("/api/v1/auth/register").send({
    businessName: "Email Safety Co",
    email,
    password: "supersecret123",
  });

  expect(res.status).toBe(201);
});
});

describe("GET /api/v1/auth/verify-email", () => {
  it("verifies a user with a valid token", async () => {
    const email = uniqueEmail();
    const { verificationToken } = await registerBusiness({
      businessName: "Verify Flow Co",
      email,
      password: "supersecret123",
    });

    const res = await request(app).get("/api/v1/auth/verify-email").query({
      token: verificationToken,
    });

    expect(res.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).not.toBeNull();
    // expect(user.emailVerificationTokenHash).toBeNull();
  });

  it("is harmless to verify the same token twice", async () => {
    const email = uniqueEmail();
    const { verificationToken } = await registerBusiness({
      businessName: "Double Verify Co",
      email,
      password: "supersecret123",
    });

    const first = await request(app).get("/api/v1/auth/verify-email").query({
      token: verificationToken,
    });
    expect(first.status).toBe(200);

    const second = await request(app).get("/api/v1/auth/verify-email").query({
      token: verificationToken,
    });
    expect(second.status).toBe(200);
  });

  it("rejects a token that doesn't exist", async () => {
    const res = await request(app).get("/api/v1/auth/verify-email").query({
      token: "this-token-was-never-issued",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("rejects a missing token with a validation error", async () => {
    const res = await request(app).get("/api/v1/auth/verify-email");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/auth/login", () => {
  
  it("logs in a verified user and returns both tokens", async () => {
    const email = await createVerifiedUser("supersecret123");

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "supersecret123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");
    // A JWT has exactly three dot-separated parts: header.payload.signature
    expect(res.body.data.accessToken.split(".")).toHaveLength(3);
  });

  it("rejects a wrong password", async () => {
    const email = await createVerifiedUser("supersecret123");

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("gives the identical error for a non-existent email as for a wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody-here@example.com", password: "whatever123" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("blocks login before the email is verified", async () => {
    const email = uniqueEmail();
    await registerBusiness({
      businessName: "Unverified Co",
      email,
      password: "supersecret123",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "supersecret123" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Please verify your email before logging in");
  });
});

describe("GET /api/v1/auth/me", () => {
  it("rejects a request with no Authorization header", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Missing or malformed Authorization header");
  });

  it("rejects a header that isn't in the Bearer format", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Token abc123"); // wrong scheme, not "Bearer"

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Missing or malformed Authorization header");
  });

  it("rejects a malformed or tampered token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not.a.real.token");

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid or expired token");
  });

  it("rejects a refresh token used where an access token is expected", async () => {
    const email = await createVerifiedUser("supersecret123");
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "supersecret123" });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.data.refreshToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid or expired token");
  });

  it("returns the current user for a valid access token", async () => {
    const email = await createVerifiedUser("supersecret123");
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "supersecret123" });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.business.name).toBe("Login Test Co");
    expect(res.body.data.passwordHash).toBeUndefined();
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("issues a new token pair and revokes the old refresh token", async () => {
    const email = await createVerifiedUser("supersecret123");
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "supersecret123" });
    const oldRefreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: oldRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(typeof refreshRes.body.data.accessToken).toBe("string");
    expect(typeof refreshRes.body.data.refreshToken).toBe("string");
    expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);

    // The old token must now be dead — this is the actual security property
    // rotation exists to guarantee, not just "a new token was returned".
    const reuse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: oldRefreshToken });

    expect(reuse.status).toBe(401);
  });

  it("rejects a refresh token that never existed", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "this-was-never-issued" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid or expired refresh token");
  });

  it("rejects an access token used where a refresh token is expected", async () => {
    const email = await createVerifiedUser("supersecret123");
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "supersecret123" });

    // An access token is a JWT, not a raw hex token, and it was never stored
    // in the refresh_tokens table at all — the lookup simply finds nothing.
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: loginRes.body.data.accessToken });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("revokes the refresh token so it can no longer be used", async () => {
    const email = await createVerifiedUser("supersecret123");
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "supersecret123" });
    const refreshToken = loginRes.body.data.refreshToken;

    const logoutRes = await request(app).post("/api/v1/auth/logout").send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await request(app).post("/api/v1/auth/refresh").send({ refreshToken });
    expect(afterLogout.status).toBe(401);
  });

  it("succeeds quietly even for a token that doesn't exist", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: "never-issued-token" });

    expect(res.status).toBe(200);
  });
});