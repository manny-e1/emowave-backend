import {
	errorCatcher,
	validateRequest,
} from "../middleware/error-middleware.js";
import { Router } from "express";
import * as UserController from "./controller.js";
import { isAdmin, isAuthenticated } from "../middleware/privilage.js";
import { Email } from "./types.js";

const router = Router();

router
	.route("/")
	.all(errorCatcher(isAuthenticated), errorCatcher(isAdmin))
	.post(errorCatcher(UserController.httpCreateAdmin))
	.get(errorCatcher(UserController.httpGetAdminUsers));
router
	.route("/normal")
	.post(errorCatcher(UserController.httpCreateUser))
	.get(
		errorCatcher(isAuthenticated),
		errorCatcher(isAdmin),
		errorCatcher(UserController.httpGetNormalUsers),
	);
router.post("/login", errorCatcher(UserController.httpLogin));
router.patch("/activate", errorCatcher(UserController.httpActivateUser));
router.post(
	"/forgot-password",
	errorCatcher(UserController.httpForgotPassword),
);
router.get(
	"/check-token",
	errorCatcher(UserController.httpCheckResetPasswordToken),
);
router.post("/reset-password", errorCatcher(UserController.httpResetPassword));
router.patch(
	"/change-status",
	errorCatcher(isAuthenticated),
	errorCatcher(isAdmin),
	errorCatcher(UserController.httpChangeUserStatus),
);
router.post("/send-otp", errorCatcher(UserController.httpSendOtp));
// router.post("/verify-otp", errorCatcher(UserController.httpVerifyOtp));

router.post(
	"/resend-email",
	errorCatcher(isAuthenticated),
	errorCatcher(isAdmin),
	validateRequest({ body: Email }),
	errorCatcher(UserController.httpResendAcctivationEmail),
);
router.patch(
	"/:id",
	errorCatcher(isAuthenticated),
	errorCatcher(UserController.httpLogoutUser),
);
router
	.route("/:id")
	.all(errorCatcher(isAuthenticated), errorCatcher(isAdmin))
	.get(errorCatcher(UserController.httpGetUser))
	.put(errorCatcher(UserController.httpEditUser))
	.delete(errorCatcher(UserController.httpDeleteUser));

export { router as userRouter };
