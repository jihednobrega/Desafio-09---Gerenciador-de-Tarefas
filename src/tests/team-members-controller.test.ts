import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/database/prisma";
import { sign } from "jsonwebtoken";
import { authConfig } from "@/configs/auth";

describe("teamMembersController", () => {
  let adminToken: string
  let memberToken: string
  let adminUserId: string
  let memberUserId: string
  let teamId: string

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: {
        name: "Admin Team Members User",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
      },
    })

    adminUserId = adminUser.id

    adminToken = sign({ role: adminUser.role }, authConfig.jwt.secret, {
      subject: adminUser.id,
      expiresIn: authConfig.jwt.expiresIn,
    })
    
    const memberUser = await prisma.user.create({
      data: {
        name: "Member Team Members User",
        email: "member@example.com",
        password: "password123",
        role: "member",
      },
    })

    memberUserId = memberUser.id
    
    memberToken = sign({ role: memberUser.role }, authConfig.jwt.secret, {
      subject: memberUser.id,
      expiresIn: authConfig.jwt.expiresIn,
    })
    
    const team = await prisma.team.create({
      data: {
        name: "Team Members Test",
        description: "Team for test team members",
      },
    })
    
    teamId = team.id
  })

  afterAll(async () => {
    await prisma.teamMember.deleteMany({ where: { teamId } })
    await prisma.team.delete({ where: { id: teamId } })
    await prisma.user.delete({ where: { id: adminUserId } })
    await prisma.user.delete({ where: { id: memberUserId } })
  })

  it("should allow admin to add a member to the team", async () => {
    const response = await request(app)
    .post("/teamMembers")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ userId: memberUserId, teamId })
    
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("userId", memberUserId)
    expect(response.body).toHaveProperty("teamId", teamId)
  })

  it("should not allow adding the same member twice", async () => {
    await request(app)
    .post("/teamMembers")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ userId: memberUserId, teamId })
  
    const response = await request(app)
    .post("/teamMembers")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ userId: memberUserId, teamId })
  
    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("message", "This user is already in this team")
  })

  it("should return 404 if team does not exist when adding a member", async () => {
    const response = await request(app)
    .post("/teamMembers")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ userId: memberUserId, teamId: "non-existent-id" })
      
    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty("message", "Team not found")
    })

    it("should return 404 if user does not exist", async () => {
    const response = await request(app)
    .post(`/teamMembers`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ userId: "non-existent-user-id", teamId })
    
    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty("message", "User not found")
  })

  it("should allow admin to list team members", async () => {
    const response = await request(app)
    .get(`/teamMembers?teamId=${teamId}`)
    .set("Authorization", `Bearer ${adminToken}`)
  
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body[0]).toHaveProperty("userId", memberUserId)
    expect(response.body[0]).toHaveProperty("teamId", teamId)
  })

  it("should allow a member to list their team members", async () => {
    const response = await request(app)
    .get("/teamMembers")
    .set("Authorization", `Bearer ${memberToken}`)
  
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body[0]).toHaveProperty("userId", memberUserId)
    expect(response.body[0]).toHaveProperty("teamId", teamId)
  })

  it("should return 404 if team does not exist", async () => {
    const response = await request(app)
    .get("/teamMembers/non-existent-team-id")
    .set("Authorization", `Bearer ${adminToken}`)
  
    expect(response.status).toBe(404)
  })
  
  it("should allow admin to remove a member from the team", async () => {
    const response = await request(app)
    .delete(`/teamMembers/${teamId}/members/${memberUserId}/delete`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ userId: memberUserId, teamId })
  
    expect(response.status).toBe(204)
  })

  it("should return 404 if member is not part of the team", async () => {
    const response = await request(app)
    .delete(`/teamMembers/${teamId}/members/${memberUserId}/delete`)
    .set("Authorization", `Bearer ${adminToken}`)
    
    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty("message", "Team member not found")
  })
})