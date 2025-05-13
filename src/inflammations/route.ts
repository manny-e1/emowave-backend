import express, { type Request, type Response } from "express";
import * as InflammationGroupingController from "./controller.js";
import { errorCatcher } from "../middleware/error-middleware.js";
import { isAdmin, isAuthenticated } from "../middleware/privilage.js";

const router = express.Router();

router.get(
	"/",
	errorCatcher(isAuthenticated),
	errorCatcher(isAdmin),
	errorCatcher(InflammationGroupingController.httpGetInflammations),
);
router
	.route("/groupings")
	.all(errorCatcher(isAuthenticated), errorCatcher(isAdmin))
	.get(
		errorCatcher(
			InflammationGroupingController.httpGetAllBiologicalInflammationGroupings,
		),
	)
	.post(
		errorCatcher(
			InflammationGroupingController.httpCreateBiologicalInflammationGrouping,
		),
	);

router
	.route("/groupings/:id")
	.all(errorCatcher(isAuthenticated), errorCatcher(isAdmin))
	.get(
		errorCatcher(
			InflammationGroupingController.httpGetBiologicalInflammationGrouping,
		),
	)
	.put(
		errorCatcher(
			InflammationGroupingController.httpUpdateBiologicalInflammationGrouping,
		),
	)
	.delete(
		errorCatcher(
			InflammationGroupingController.httpDeleteBiologicalInflammationGrouping,
		),
	);
export { router as InflammationRouter };
