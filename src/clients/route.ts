import { errorCatcher } from "../middleware/error-middleware.js";
import { type Request, Router } from "express";
import * as ClientController from "./controller.js";
import { isAdmin, isAuthenticated } from "../middleware/privilage.js";
import { uploadAndSaveDocs, uploadDocs } from "../utils/upload-docs.js";

const router = Router();
router
	.route("/")
	.post(
		errorCatcher(isAuthenticated),
		errorCatcher(isAdmin),
		errorCatcher(uploadDocs.single("doc")),
		errorCatcher(ClientController.httpSaveClients),
	)
	.get(errorCatcher(ClientController.httpGetClients));

router
	.route("/processed-data")
	.all(errorCatcher(isAuthenticated))
	.get(errorCatcher(ClientController.httpGetClientProcessedData));

router
	.route("/:id/documents")
	.all(errorCatcher(isAuthenticated), errorCatcher(isAdmin))
	.post(
		// (req: Request, _, next) => {
		// 	req.user.clientId = req.params.id;
		// 	next();
		// },
		errorCatcher(uploadAndSaveDocs.array("documents", 10)),
		errorCatcher(ClientController.httpSaveClientDocument),
	)
	.get(errorCatcher(ClientController.httpGetClientDocuments));

router.get(
	"/:clientId/processed-documents",
	// errorCatcher(isAuthenticated),
	// errorCatcher(isAdmin),
	errorCatcher(ClientController.httpGetProcessedDocuments),
);

router
	.route("/:id")
	.get(
		errorCatcher(isAuthenticated),
		errorCatcher(isAdmin),
		errorCatcher(ClientController.httpGetClient),
	);

router.delete(
	"/documents/:id",
	errorCatcher(ClientController.httpDeleteClientDocument),
);

export { router as clientRouter };
