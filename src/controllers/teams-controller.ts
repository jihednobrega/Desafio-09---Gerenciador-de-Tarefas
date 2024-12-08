import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { z } from "zod";

class TeamsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string(),
      description: z.string(),
    });

    const { name, description } = bodySchema.parse(request.body);

    const team = await prisma.team.create({
      data: {
        name,
        description,
      },
    });

    return response.status(201).json(team);
  }

  async index(request: Request, response: Response) {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        tasks: { select: { title: true, description: true, status: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  
    return response.status(200).json(teams);
  }

  async update(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
  
    const bodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
    });
  
    const { id } = paramsSchema.parse(request.params);
    const { name, description } = bodySchema.parse(request.body);
  
    const team = await prisma.team.findUnique({
      where: { id },
    });
  
    if (!team) {
      return response.status(404).json({ message: "Team not found" });
    }
  
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name,
        description,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  
    return response.status(200).json(updatedTeam);
  }

  async delete(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
  
    const { id } = paramsSchema.parse(request.params);
  
    const team = await prisma.team.findUnique({
      where: { id },
    });
  
    if (!team) {
      return response.status(404).json({ message: "Team not found" });
    }
  
    await prisma.team.delete({
      where: { id },
    });
  
    return response.status(204).send();
  }  
  
}

export { TeamsController };
