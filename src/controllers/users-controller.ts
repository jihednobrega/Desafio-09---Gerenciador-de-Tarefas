import { Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/database/prisma";
import { hash } from "bcrypt";
import { z } from "zod";

class UsersController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().trim(),
      email: z.string().trim().email(),
      password: z.string().min(6),
    })

    const { name, email, password } = bodySchema.parse(request.body)

    const userWithSameEmail = await prisma.user.findFirst({ where: { email } })

    if(userWithSameEmail) {
      throw new AppError("User with same email already exists")
    }
    
    const hashedPassword = await hash(password, 8)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    const { password: _, ...userWithoutPassword } = user
    
    return response.status(201).json(userWithoutPassword)
  }

  async index(request: Request, response: Response) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teams: { select: { teamId: true } },
        createdAt: true,
      },
    })

    return response.status(200).json(users)
  }

  async show(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        teams: { select: { teamId: true } },
        tasks: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return response.status(200).json(user);
  }

  async update(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { name, email, password } = bodySchema.parse(request.body);

    if (request.user.role !== "admin" && request.user.id !== id) {
      throw new AppError("You can only update your own data", 403);
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updatedData: any = { name, email };

    if (password) {
      updatedData.password = await hash(password, 8);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        teams: { select: { teamId: true } },
        tasks: true,
      },
    });

    return response.status(200).json(updatedUser);
  }

  async delete(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    return response.status(204).send();
  }
}

export { UsersController }