import { Router } from "express";

import { TaskLogsController } from "@/controllers/task-logs-controller";

import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";

const taskLogsRoutes = Router()
const taskLogsController = new TaskLogsController()

taskLogsRoutes.use(ensureAuthenticated, verifyUserAuthorization(["admin"]))
taskLogsRoutes.get("/", taskLogsController.index)

export { taskLogsRoutes }