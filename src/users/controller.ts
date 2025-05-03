import type { Request, Response } from "express";
import * as UserService from "./service.js";
import createHttpError from "http-errors";
import type { CreateAdmin, CreateUser, Status, User } from "../db/schema.js";
import {
	generateRandomUuid,
	hasChangedBefore,
	isExpired,
	isSameDay,
	setTokenExpiry,
} from "../utils/helpers.js";
import { message, sGMail } from "../utils/send-email.js";
import argon2 from "argon2";
// import { logger } from '@/logger.js';
import jwt from "jsonwebtoken";
import type { Email } from "./types.js";
import { createToken, getToken } from "../tokens/service.js";
import { getClientByEmail } from "../clients/service.js";
import * as PasswordHistoryService from "../password-history/service.js";

export async function httpCreateAdmin(
	req: Request<unknown, unknown, CreateAdmin>,
	res: Response,
) {
	const { email, role, name } = req.body;

	const result = await UserService.createUser({
		email,
		role,
		name,
	});
	if (result.error || !result.user) {
		if (
			result.error.includes("email address") ||
			result.error === "invalid id"
		) {
			throw createHttpError.BadRequest(result.error);
		}
		throw createHttpError(result.error);
	}
	const user = result.user;
	const token = generateRandomUuid(190, "base64");
	const tokenExpiry = setTokenExpiry();
	const tok = await createToken({ token, userId: user.id, tokenExpiry });
	if (tok.error) {
		if (tok.status) {
			throw createHttpError.BadRequest(tok.error);
		}
		throw createHttpError(tok.error);
	}

	const msg = message({
		token,
		email: user.email,
		subject: "Email activation",
		name: user.name,
		reset: false,
	});
	sGMail
		.send(msg)
		.then(() =>
			console.info(
				`user activation email sent to user with address ${req.body.email}`,
			),
		)
		.catch((err: Error) =>
			console.error(
				`sending user activation email for ${req.body.email} failed`,
				err,
			),
		);
	res.status(201).json({ message: "success" });
}

export async function httpCreateUser(
	req: Request<unknown, unknown, CreateUser & { otp: number }>,
	res: Response,
) {
	const { email, role, name, password, dob, otp } = req.body;
	const otpResult = await UserService.getOtp({ email, otp });
	if (!otpResult) {
		throw createHttpError("Wrong OTP");
	}
	if (isExpired(otpResult.otpExpiry)) {
		throw createHttpError(
			"This code has been expired, please request for a new one",
		);
	}
	const hashedPassword = await argon2.hash(password);
	const result = await UserService.createUser({
		email,
		role,
		name,
		password: hashedPassword,
		dob,
	});

	if (result.error || !result.user) {
		if (
			result.error.includes("email address") ||
			result.error === "invalid id"
		) {
			throw createHttpError.BadRequest(result.error);
		}
		throw createHttpError(result.error);
	}

	res.status(201).json({ message: "success" });
}

export async function httpSendOtp(
	req: Request<unknown, unknown, { email: string; name: string }>,
	res: Response,
) {
	const { email, name } = req.body;

	if (!email || !name) {
		throw createHttpError.BadRequest("email and name are required");
	}
	const client = await getClientByEmail(email);
	if (!client) {
		throw createHttpError.NotFound("email not found in client list");
	}
	const user = await UserService.getUserByEmailAndRole(email, "user");
	if (user) {
		throw createHttpError.BadRequest("account with this email already exists");
	}
	const code = Math.floor(100000 + Math.random() * 900000);
	const result = await UserService.saveOtp({ email, otp: code });
	if (result.error) {
		throw createHttpError(result.error);
	}
	const msg = message({
		token: code.toString(),
		email: email,
		subject: "Registration OTP",
		name: name,
		reset: false,
		reason: "otp",
	});
	sGMail
		.send(msg)
		.then(async () => {
			console.info(`registration otp email sent to user with address ${email}`);
		})
		.catch((err: Error) =>
			console.error(`sending registration otp email for ${email} failed`, err),
		);
	res.status(200).json({ message: "success" });
}

// export async function httpVerifyOtp(
// 	req: Request<unknown, unknown, { email: string; otp: string }>,
// 	res: Response,
// ) {
// 	const { email, otp } = req.body;
// 	if (!email || !otp) {
// 		throw createHttpError.BadRequest("email and otp are required");
// 	}
// 	const result = await UserService.getOtp({ email, otp: Number(otp) });
// 	if (!result) {
// 		throw createHttpError("Wrong OTP");
// 	}
// 	if (isExpired(result.otpExpiry)) {
// 		throw createHttpError(
// 			"This code has been expired, please request for a new one",
// 		);
// 	}
// 	res.status(200).json({ message: "OTP verified successfully" });
// }

export async function httpGetAdminUsers(req: Request, res: Response) {
	const result = await UserService.getAdminUsers();
	if (result.error) {
		throw createHttpError(result.error);
	}
	res.status(200).json({ users: result.users });
}

export async function httpGetNormalUsers(req: Request, res: Response) {
	const result = await UserService.getNormalUsers();
	if (result.error) {
		throw createHttpError(result.error);
	}
	res.status(200).json({ users: result.users });
}

export async function httpGetUser(req: Request<{ id: string }>, res: Response) {
	const { id } = req.params;

	const result = await UserService.getUser(id);
	if (result.error) {
		if (result.error === "not found") {
			throw createHttpError.NotFound("user not found");
		}
		throw createHttpError(result.error);
	}
	res.status(200).json(result);
}

export async function httpLogin(
	req: Request<
		unknown,
		unknown,
		{ email: string; password: string; role: "admin" | "user" }
	>,
	res: Response,
) {
	const { email, password, role } = req.body;
	const result = await UserService.getUserByEmailAndRole(email, role);
	if (!result) {
		throw createHttpError.NotFound("invalid credentials");
	}

	const user = result.user;

	if (user.status === "locked") {
		throw createHttpError.Unauthorized(
			"your account is locked, contact admin to unlock",
		);
	}

	const verify = user.password
		? await argon2.verify(user.password, password)
		: false;
	const trailsResult = await UserService.getWrongPasswordTrials(user.id);
	let trailCount = 0;
	if (!trailsResult.error) {
		const trials = trailsResult.trails;
		const today = new Date();
		if (trials) {
			for (const trail of trials) {
				if (isSameDay(today, trail.createdAt)) {
					trailCount += 1;
				}
			}
		}
	}
	if (!verify && trailCount >= 2) {
		await UserService.addWrongPasswordTrial(user.id);
		await UserService.changeUserStatus({
			id: user.id,
			status: "locked",
		});
		throw createHttpError.Unauthorized(
			"You have reached maximum invalid login and your account is locked",
		);
	}
	if (!verify) {
		await UserService.addWrongPasswordTrial(user.id);
		throw createHttpError.Unauthorized("invalid credentials");
	}

	const token = jwt.sign(
		{
			id: user.id,
		},
		process.env.SECRET_KEY || "",
		{
			expiresIn: "7d",
		},
	);
	const userAgent = req.headers["user-agent"] || "";
	const loginSession = await UserService.createLoginSession({
		ip: "",
		userAgent,
		userId: user.id,
		sessionToken: token,
	});
	if (loginSession.error) {
		throw createHttpError.InternalServerError("couldn't create login session");
	}
	const omitedUser = {
		id: user.id,
		email: user.email,
		status: user.status,
		role: user.role,
		name: user.name,
		dob: user.dob,
	};

	return res.status(200).json({
		user: {
			...omitedUser,
			token,
		},
	});
}

export async function httpChangeUserStatus(
	req: Request<unknown, unknown, { email: string; status: Status }>,
	res: Response,
) {
	const { status, email } = req.body;

	const userResult = await UserService.getUserByEmail(email);
	if (userResult.error || !userResult.user) {
		if (userResult.error === "not found") {
			throw createHttpError.NotFound("user not found");
		}
		throw createHttpError(userResult.error);
	}
	const result = await UserService.changeUserStatus({
		id: "id",
		email,
		status,
	});
	if (result.error || !result.id) {
		if (result.error === "update failed") {
			throw createHttpError.NotFound(
				"Couldn't change the user status, make sure the user id/email is valid",
			);
		}
		throw createHttpError(result.error || "");
	}
	if (status === "active") {
		const result2 = await UserService.deleteWrongPassTrials(result.id);
		if (result2.error) {
			if (result2.error === "invalid id") {
				throw createHttpError.NotFound(
					"failed to delete the user's wrong password trials, make sure the user id is valid",
				);
			}
			throw createHttpError(result2.error);
		}
	}
	res.status(200).json({ message: "success" });
}

export async function httpEditUser(
	req: Request<{ id: string }, unknown, { name: string; dob?: string }>,
	res: Response,
) {
	const { name, dob } = req.body;
	const { id: userId } = req.params;
	const userResult = await UserService.getUser(userId, false);
	if (userResult.error) {
		if (userResult.error === "not found") {
			throw createHttpError.NotFound("user not found");
		}
		throw createHttpError(userResult.error);
	}

	const result = await UserService.editUser({ name, userId, dob });
	if (result.error) {
		if (result.error === "update failed") {
			throw createHttpError.NotFound(
				"failed to update user, make sure the user id is correct",
			);
		}
		if (result.error === "invalid id") {
			throw createHttpError.BadRequest(result.error);
		}
		throw createHttpError(result.error);
	}
	res.json({ message: "success" });
}

export async function httpActivateUser(
	req: Request<unknown, unknown, unknown, { token: string }>,
	res: Response,
) {
	let { token } = req.query;
	if (!token) {
		throw createHttpError.BadRequest("please include token in the query");
	}
	token = token.replace(/\s/g, "+");
	const tok = await getToken({ token });
	if (tok.error || !tok.token) {
		if (tok.error === "not found") {
			throw createHttpError.NotFound("token not found");
		}
		throw createHttpError(tok.error);
	}
	const expired = isExpired(tok.token.tokenExpiry);
	if (expired) {
		throw createHttpError.BadRequest(
			"the token has expired, please request for a new one",
		);
	}
	const result = await UserService.changeUserStatus({
		id: tok.token?.userId,
		status: "active",
	});
	if (result.error) {
		if (result.error === "update failed") {
			throw createHttpError.NotFound(
				"failed to activate account, make your the user id is valid",
			);
		}
		throw createHttpError(result.error);
	}
	res.json(result);
}

export async function httpResendAcctivationEmail(
	req: Request<unknown, unknown, Email>,
	res: Response,
) {
	const { email } = req.body;
	const result = await UserService.getUserByEmail(email);
	if (result.error || !result.user) {
		if (result.error === "not found") {
			throw createHttpError.NotFound("user not found");
		}
		throw createHttpError.InternalServerError(result.error);
	}
	const user = result.user;
	if (user.status === "active") {
		throw createHttpError.BadRequest("user is already activated");
	}
	const token = generateRandomUuid(190, "base64");
	const tokenExpiry = setTokenExpiry();
	const tok = await createToken({ token, userId: user.id, tokenExpiry });
	if (tok.error) {
		if (tok.status) {
			throw createHttpError.BadRequest(tok.error);
		}
		throw createHttpError(tok.error);
	}
	const msg = message({
		token,
		email: user.email,
		subject: "Email activation",
		name: user.name,
		reset: false,
	});
	sGMail
		.send(msg)
		.then(() =>
			console.info(`user activation email sent to user with address ${email}`),
		)
		.catch((err: Error) =>
			console.error(`sending user activation email for ${email} failed`, err),
		);
	res.json({ message: "success" });
}

export async function httpForgotPassword(
	req: Request<unknown, unknown, { email: string }>,
	res: Response,
) {
	const { email } = req.body;

	const result = await UserService.getUserByEmail(email);
	if (result.error || !result.user) {
		if (result.error === "not found") {
			throw createHttpError.NotFound("Email not found");
		}
		throw createHttpError(result.error);
	}
	const user = result.user;
	const token = generateRandomUuid(190, "base64");
	const tokenExpiry = setTokenExpiry();
	const tok = await createToken({ token, userId: user.id, tokenExpiry });
	if (tok.error) {
		if (tok.status) {
			throw createHttpError.BadRequest(tok.error);
		}
		throw createHttpError(tok.error);
	}
	const msg = message({
		email,
		token,
		subject: "Password Reset",
		name: user.name,
		reset: true,
	});
	sGMail
		.send(msg)
		.then(() =>
			console.info(`reset password
         email sent to user with email ${email}`),
		)
		.catch((err: Error) =>
			console.error(`sending reset passwordemail for ${email} failed`, err),
		);
	res.json({ message: "success" });
}

export async function httpCheckResetPasswordToken(
	req: Request<unknown, unknown, unknown, { token: string; src?: "activate" }>,
	res: Response,
) {
	let { token, src } = req.query;
	if (!token) {
		throw createHttpError.BadRequest("Please include token in the query");
	}
	token = token.replace(/\s/g, "+");
	const tok = await getToken({ token });
	if (tok.error || !tok.token) {
		if (tok.error === "not found") {
			throw createHttpError.NotFound("Token not found");
		}
		throw createHttpError(tok.error);
	}
	const expired = isExpired(tok.token.tokenExpiry);
	if (expired) {
		throw createHttpError.BadRequest(
			"The token has expired, please request for a new one",
		);
	}

	if (src && src === "activate" && tok.token?.status === "active") {
		throw createHttpError.BadRequest(
			"Your account is already activated. Please login to your account",
		);
	}
	res.json({ user: { id: tok.token?.userId } });
}

export async function httpResetPassword(
	req: Request<
		unknown,
		unknown,
		{ password: string; id?: string; src?: "activate" }
	>,
	res: Response,
) {
	const { password, id, src } = req.body;
	const isActivate = src === "activate";
	const userId = id ?? req.app.get("user").id;
	let user: Omit<User, "password" | "createdAt" | "updatedAt"> | undefined =
		undefined;
	user = (await UserService.getUser(userId, true)).user;
	const result = await PasswordHistoryService.getPasswordHistory(userId);
	if (result.error || !result.pwdHistory) {
		if (result.error === "invalid id") {
			throw createHttpError.BadRequest(result.error);
		}
		throw createHttpError(result.error);
	}
	const pwdHistory = result.pwdHistory;
	const changedBefore = await hasChangedBefore(pwdHistory, password);
	if (changedBefore) {
		throw createHttpError.BadRequest(
			"You can’t reuse old password. Please enter new password",
		);
	}

	if (src !== "activate") {
		let todayChangeCount = 0;
		const today = new Date();
		for (const history of pwdHistory.filter((pwd) => pwd.source === "reset")) {
			if (isSameDay(today, history.createdAt)) {
				todayChangeCount++;
			}
		}

		if (todayChangeCount >= 2) {
			throw createHttpError.BadRequest(
				"You’ve exceeded the number of times password update per day. Please try again tomorrow",
			);
		}
	}

	if (isActivate) {
		const result = await UserService.changeUserStatus({
			id: userId,
			status: "active",
		});
		if (result.error) {
			if (result.error === "update failed") {
				throw createHttpError.NotFound(
					"failed to activate account, make your the user id is valid",
				);
			}
			throw createHttpError(result.error);
		}
	}
	const hashedPassword = await argon2.hash(password);

	const resetPwdResult = await UserService.resetPassword({
		userId,
		password: hashedPassword,
	});
	if (resetPwdResult.error) {
		if (resetPwdResult.error === "not found") {
			throw createHttpError.NotFound("user not found");
		}
		throw createHttpError(resetPwdResult.error);
	}
	res.json(resetPwdResult);
}

export async function httpDeleteUser(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result = await UserService.deleteUser(id);
	if (result.error) {
		if (result.error === "delete failed") {
			throw createHttpError.NotFound(
				"Failed to delete the user, make your the user id is valid",
			);
		}
		throw createHttpError(result.error);
	}
	res.status(200).json(result);
}

export async function httpLogoutUser(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const userAgent = req.headers["user-agent"] || "";
	const result = await UserService.logoutUser({ id, userAgent });
	if (result.error) {
		if (result.error === "update failed") {
			throw createHttpError.NotFound("Failed to logout the user");
		}
		throw createHttpError(result.error);
	}
	res.status(200).json(result);
}
