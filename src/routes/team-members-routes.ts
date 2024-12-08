import { Router } from "express";

import { TeamMembersController } from "@/controllers/team-members-controller";

import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";

const teamMembersRoutes = Router()
const teamMembersController = new TeamMembersController()

teamMembersRoutes.post("/", ensureAuthenticated, verifyUserAuthorization(["admin"]), teamMembersController.create)
teamMembersRoutes.get("/", ensureAuthenticated, teamMembersController.index)
teamMembersRoutes.get("/:teamId/show", ensureAuthenticated, verifyUserAuthorization(["admin"]), teamMembersController.show)
teamMembersRoutes.delete("/:teamId/members/:userId/delete", ensureAuthenticated, verifyUserAuthorization(["admin"]), teamMembersController.delete)

export { teamMembersRoutes }