import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { z } from "zod";
import { AppError } from "@/utils/AppError";

class TeamMembersController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      userId: z.string(),
      teamId: z.string(),
    })

    const { userId, teamId } = bodySchema.parse(request.body);

    const userAlreadyInTeam = await prisma.teamMember.findFirst({ where: { userId, teamId } })

    if(userAlreadyInTeam) {
      throw new AppError("This user is already in this team")
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new AppError("Team not found", 404);
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    

    const member = await prisma.teamMember.create({
      data: {
        userId,
        teamId,
      },
    });

    return response.status(201).json(member)
  }

  async index(request: Request, response: Response) {
    const paramsSchema = z.object({
      teamId: z.string().uuid().optional(),
    })
  
    const { teamId } = paramsSchema.parse(request.params)

    const { role, id: userId } = request.user

    if (role === "admin") {
      const members = await prisma.teamMember.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              name: true,
            },
          },
        },
      });
  
      return response.status(200).json(members);
    } else {
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      });
  
      const teamIds = userTeams.map((teamMember) => teamMember.teamId);
  
      if (teamId && !teamIds.includes(teamId)) {
        return response.status(403).json({ message: "Access denied to this team" });
      }
  
      const members = await prisma.teamMember.findMany({
        where: {
          teamId: teamId ? teamId : { in: teamIds },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              name: true,
            },
          },
        },
      });
  
      return response.status(200).json(members);
    }
  }

  async show(request: Request, response: Response) {
    const paramsSchema = z.object({
      teamId: z.string().uuid(),
    });

    const { teamId } = paramsSchema.parse(request.params);

    const teamExists = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!teamExists) {
      throw new AppError("Team not found", 404);
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: {
        id: true,
        userId: true,
        teamId: true,
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    if (!teamMembers.length) {
      throw new AppError("No members found for this team", 404);
    }

    return response.status(200).json(teamMembers);
  }

  async delete(request: Request, response: Response) {
    const paramsSchema = z.object({
      teamId: z.string().uuid(),
      userId: z.string().uuid(),
    });
  
    const { teamId, userId } = paramsSchema.parse(request.params);
  
    const teamMember = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });
  
    if (!teamMember) {
      return response.status(404).json({ message: "Team member not found" });
    }
  
    await prisma.teamMember.delete({
      where: { id: teamMember.id },
    });
  
    return response.status(204).send()
  }
}

export { TeamMembersController }
