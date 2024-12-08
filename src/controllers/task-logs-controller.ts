import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { z } from "zod";
import { AppError } from "@/utils/AppError";

class TaskLogsController {
  async index(request: Request, response: Response) {
    const taskLogs = await prisma.taskLogs.findMany({
      select: {
        id: true,
        task: { select: { id: true, title: true, status: true, createdAt: true } },
        changer: { select: { id: true, name: true, email: true } }
      }
    })
    return response.status(200).json(taskLogs)
  }
}

export { TaskLogsController }