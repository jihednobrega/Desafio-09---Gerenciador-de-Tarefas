import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/database/prisma";
import { sign } from "jsonwebtoken";
import { authConfig } from "@/configs/auth";

describe("TeamsController", () => {
  let adminToken: string
  let adminUserId: string
  let teamId: string
  
  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: {
        name: "Admin Team Creator User",
        email: "admin-team-creator@example.com",
        password: "password123",
        role: "admin",
      },
    })
  
    adminUserId = adminUser.id

    adminToken = sign({ role: adminUser.role }, authConfig.jwt.secret, {
      subject: adminUser.id,
      expiresIn: authConfig.jwt.expiresIn,
    })
  })
  
  afterAll(async () => {
    if (teamId) {
      const teamExists = await prisma.team.findUnique({ where: { id: teamId } });
      if (teamExists) {
        await prisma.team.delete({ where: { id: teamId } })
      }
    }

    if (adminUserId) {
      const adminExists = await prisma.user.findUnique({ where: { id: adminUserId } });
      if (adminExists) {
        await prisma.user.delete({ where: { id: adminUserId } })
      }
    }
  })
  
  it("should create a team successfully", async () => {
    const response = await request(app)
    .post("/teams")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Team A", description: "Test Team" })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body).toHaveProperty("name", "Team A")
    teamId = response.body.id
  })

  it("should return error when creating a team without a name", async () => {
    const response = await request(app)
    .post("/teams")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ description: "No Name Team" })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("message")
  })

  it("should list all teams successfully", async () => {
    const response = await request(app)
    .get("/teams")
    .set("Authorization", `Bearer ${adminToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
  })

  it("should update a team successfully", async () => {
    const response = await request(app)
    .put(`/teams/${teamId}/update`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Updated Team Name", description: "Updated Description" })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("name", "Updated Team Name")
  })

  it("should return error when updating a non-existent team", async () => {
    const response = await request(app)
    .put("/teams/non-existent-id")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Does Not Exist" })

    expect(response.status).toBe(404)
  })

  it("should delete a team successfully", async () => {
    const response = await request(app)
    .delete(`/teams/${teamId}/delete`)
    .set("Authorization", `Bearer ${adminToken}`)

    expect(response.status).toBe(204)
  })

  it("should return error when deleting a non-existent team", async () => {
    const response = await request(app)
    .delete("/teams/non-existent-id")
    .set("Authorization", `Bearer ${adminToken}`)

    expect(response.status).toBe(404)
  })
})
