import request from "supertest";
import { prisma } from "@/database/prisma";

import { app } from "@/app";

import jwt from "jsonwebtoken";
import { authConfig } from "@/configs/auth";

describe("SessionsController", () => {
  let user_id: string

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user_id } })
  })

  const { secret } = authConfig.jwt
  const token = jwt.sign(
    { sub: "test-user-id", role: "admin" },
    secret,
    { expiresIn: "1h" }
  )

  it("should authenticate and get access token", async () => {
    const userResponse = await request(app).post("/users").set("Authorization", `Bearer ${token}`).send({
        name: "Auth Test User",
        email: "auth_test_user@example.com",
        password: "password123",
      })

    user_id = userResponse.body.id

    const sessionResponse = await request(app).post("/sessions").send({
      email: "auth_test_user@example.com",
      password: "password123",
    })

    expect(sessionResponse.status).toBe(200)
    expect(sessionResponse.body.token).toEqual(expect.any(String))
  })

  it("should return 400 if email or password is missing", async () => {
    const response = await request(app)
      .post("/sessions")
      .send({ email: "test@example.com" });
  
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  })

  it("should return 401 if email is not registered", async () => {
    const response = await request(app)
      .post("/sessions")
      .send({ email: "unknown@example.com", password: "123456" });
  
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid email or password");
  })
  
})
