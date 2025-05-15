import { getLoginSession } from "../users/service.js";
import type { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { number, object, string } from "zod";

const ZJwtPayload = object({ id: string(), iat: number() });

export async function isAuthenticated(
	req: Request,
	_: Response,
	next: NextFunction,
) {
	const token = req.headers.authorization?.includes("Bearer")
		? req.headers.authorization.split(" ")[1]
		: undefined;
	if (!token) {
		throw createHttpError.Unauthorized();
	}
	try {
		const parsedToken = ZJwtPayload.safeParse(
			jwt.verify(token, process.env.SECRET_KEY || ""),
		);
		if (!parsedToken.success) {
			throw createHttpError.Unauthorized();
		}
		const userAgent = req.headers["user-agent"] || "";
		const result = await getLoginSession({
			userAgent,
			userId: parsedToken.data.id,
			sessionToken: token,
		});
		if (result.error) {
			throw createHttpError.Unauthorized();
		}

		req.user = {
			id: result.loginSession?.userId,
			role: result.loginSession?.userRole,
			email: result.loginSession?.userEmail,
		};
		next();
	} catch (error) {
		if ((error as Error).message.includes("jwt expired")) {
			throw createHttpError.Unauthorized("Login session expired");
		}
		throw createHttpError.Unauthorized((error as Error).message);
	}
}

export async function isAdmin(req: Request, _: Response, next: NextFunction) {
	if (req.user?.role !== "admin") throw createHttpError.Forbidden();
	next();
}
