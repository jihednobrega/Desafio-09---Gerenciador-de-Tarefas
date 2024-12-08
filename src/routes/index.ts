import { Router } from "express";

import { usersRoutes } from "./users-routes";
import { sessionsRoutes } from "./sessions-routes";
import { tasksRoutes } from "./tasks-routes";
import { teamsRoutes } from "./teams-routes";
import { teamMembersRoutes } from "./team-members-routes";
import { taskLogsRoutes } from "./task-logs-routes";

const routes = Router()

routes.use("/users", usersRoutes)
routes.use("/sessions", sessionsRoutes)
routes.use("/teams", teamsRoutes)
routes.use("/teamMembers", teamMembersRoutes)
routes.use("/tasks", tasksRoutes)
routes.use("/taskLogs", taskLogsRoutes)

export { routes }