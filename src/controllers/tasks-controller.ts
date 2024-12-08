import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { z } from "zod";
import { AppError } from "@/utils/AppError";


class TasksController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      title: z.string(),
      description: z.string(),
      status: z.enum(["pending", "in_progress", "completed"]).default("pending").optional(),
      priority: z.enum(["high", "medium", "low"]),
      assigned_to: z.string(),
      team_id: z.string()
    })

    const { title, description, status, priority, assigned_to, team_id } = bodySchema.parse(request.body)

    await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        assignedTo: assigned_to,
        teamId: team_id
      }
    })

    return response.status(201).json()
  }

  async index(request: Request, response: Response) {
    const { role, id: userId } = request.user;
  
    if (role === "admin") {
      const tasks = await prisma.task.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          assignedTo: true,
          teamId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  
      return response.status(200).json(tasks);
    } else {
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true }
      });

      const teamIds = userTeams.map((teamMember) => teamMember.teamId)

      const tasks = await prisma.task.findMany({
        where: { teamId: { in: teamIds } },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          assignedTo: true,
          teamId: true,
          createdAt: true,
          updatedAt: true
        }
      })
  
      return response.status(200).json(tasks);
    }
  }

  async update(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
  
    const bodySchema = z.object({
      status: z.enum(["pending", "in_progress", "completed"]).optional(),
      priority: z.enum(["high", "medium", "low"]).optional(),
      description: z.string().optional(),
    });
  
    const { id } = paramsSchema.parse(request.params);
    const { status, priority, description } = bodySchema.parse(request.body);
  
    const { role, id: userId } = request.user;
  
    const task = await prisma.task.findUnique({ where: { id } });
  
    if (!task) {
      throw new AppError("Task not found", 404);
    }
  
    if (role !== "admin" && task.assignedTo !== userId) {
      throw new AppError("Access denied to this task", 401);
    }
  
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        priority,
        description,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assignedTo: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (status || priority) {
      await prisma.taskLogs.create({
        data: {
          taskId: id,
          changedBy: userId,
          oldStatus: task.status,
          newStatus: status || task.status,
          changedAt: new Date(),
        },
      });
    }
  
    return response.status(200).json(updatedTask);
  }
  
  async delete(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
  
    const { id } = paramsSchema.parse(request.params);
  
    const { role, id: userId } = request.user;
  
    const task = await prisma.task.findUnique({ where: { id } });
  
    if (!task) {
      throw new AppError("Task not found", 404);
    }
  
    if (role !== "admin" && task.assignedTo !== userId) {
      throw new AppError("Access denied to this task", 401);
    }
  
    await prisma.task.delete({ where: { id } });
  
    return response.status(204).send();
  }
}

export { TasksController }