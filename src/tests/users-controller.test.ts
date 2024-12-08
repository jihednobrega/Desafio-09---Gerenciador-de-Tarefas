import request from "supertest";
import { prisma } from "@/database/prisma";

import { app } from "@/app";

import jwt from "jsonwebtoken";
import { authConfig } from "@/configs/auth";

describe("UsersController", () => {
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

  it("should create new user successfully", async () => {
    const response = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test User",
        email: "testuser@example.com",
        password: "password123",
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.name).toBe("Test User")

    user_id = response.body.id
  })

  it("should throw an error if user with same email already exists", async () => {
    const response = await request(app)
    .post("/users")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Duplicate User",
      email: "testuser@example.com",
      password: "password123",
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe("User with same email already exists")
  })

  it("should throw a validation error if email is invalid", async () => {
    const response = await request(app)
    .post("/users")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Test User",
      email: "invalid-email",
      password: "password123",
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe("validation error")
  })

  it("should return 400 if required fields are missing", async () => {
    const response = await request(app)
    .post("/users")
    .set("Authorization", `Bearer ${token}`)
    .send({ 
      email: "test@example.com", 
      password: "123456" 
    })
  
    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("message")
  })

  it("should return all users for admin", async () => {
    const response = await request(app)
    .get("/users")
    .set("Authorization", `Bearer ${token}`)
  
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
  })  
  
})
