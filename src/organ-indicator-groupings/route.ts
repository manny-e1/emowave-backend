import { errorCatcher } from "../middleware/error-middleware.js";
import { Router } from "express";
import * as GroupingController from "./controller.js";
import { isAdmin, isAuthenticated } from "../middleware/privilage.js";

const router = Router();

router
	.route("/")
	.all(errorCatcher(isAuthenticated), errorCatcher(isAdmin))
	.post(errorCatcher(GroupingController.httpCreateOrganIndicatorGrouping))
	.get(errorCatcher(GroupingController.httpGetAllOrganIndicatorGroupings));

router
	.route("/:id")
	.all(errorCatcher(isAuthenticated), errorCatcher(isAdmin))
	.get(errorCatcher(GroupingController.httpGetOrganIndicatorGrouping))
	.put(errorCatcher(GroupingController.httpUpdateOrganIndicatorGrouping))
	.delete(errorCatcher(GroupingController.httpDeleteOrganIndicatorGrouping));

export { router as organIndicatorGroupingRouter };
