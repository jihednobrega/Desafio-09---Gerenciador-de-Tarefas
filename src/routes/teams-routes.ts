import { Router } from "express";

import { TeamsController } from "@/controllers/teams-controller";

import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";

const teamsRoutes = Router()
const teamsController = new TeamsController()

teamsRoutes.use(ensureAuthenticated, verifyUserAuthorization(["admin"]))
teamsRoutes.post("/", teamsController.create)
teamsRoutes.get("/", teamsController.index)
teamsRoutes.put("/:id/update", teamsController.update)
teamsRoutes.delete("/:id/delete", teamsController.delete)

export { teamsRoutes }
