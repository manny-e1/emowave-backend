import { and, desc, eq } from "drizzle-orm";
import db from "../db/index.js";
import {
	loginSessions,
	otps,
	users,
	wrongPasswordTrial,
} from "../db/schema.js";
import type { CreateAdmin, LoginSession, Status } from "../db/schema.js";
// import { logger } from '@/logger.js';

export async function createUser(body: CreateAdmin) {
	try {
		const newUser = await db
			.insert(users)
			.values({ ...body })
			.returning({
				id: users.id,
				email: users.email,
				name: users.name,
			});
		return { user: newUser[0] };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("duplicate key value violates")) {
			return { error: "user with this email address already exists" };
		}
		return { error: err.message };
	}
}

export async function getAdminUsers() {
	try {
		const result = await db.query.users.findMany({
			columns: {
				password: false,
				updatedAt: false,
			},
			orderBy: desc(users.createdAt),
			where: eq(users.role, "admin"),
		});
		return { users: result };
	} catch (error) {
		// logger.error(error);
		return { error: (error as Error).message };
	}
}

export async function getNormalUsers() {
	try {
		const result = await db.query.users.findMany({
			columns: {
				password: false,
				updatedAt: false,
			},
			orderBy: desc(users.createdAt),
			where: eq(users.role, "user"),
		});
		return { users: result };
	} catch (error) {
		// logger.error(error);
		return { error: (error as Error).message };
	}
}

export async function getUser(id: string, pwd?: boolean) {
	try {
		const user = await db.query.users.findFirst({
			columns: {
				createdAt: false,
				updatedAt: false,
			},
			where: eq(users.id, id),
		});
		if (!user) {
			return { error: "user not found" };
		}
		const { password, ...userWithoutPwd } = user;
		if (pwd) {
			return { user };
		}
		return { user: userWithoutPwd };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid id" };
		}
		return { error: err.message };
	}
}

export async function changeUserStatus({
	id,
	email,
	status,
}: {
	id: string;
	email?: string;
	status: Status;
}) {
	try {
		const result = await db
			.update(users)
			.set({ status })
			.where(email ? eq(users.email, email) : eq(users.id, id))
			.returning({ id: users.id });
		if (!result.length) {
			return { error: "update failed" };
		}
		return { id: result[0].id };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid id" };
		}
		return { error: err.message };
	}
}

export async function getUserByEmail(email: string) {
	try {
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});
		if (!user) {
			return { error: "user not found" };
		}
		return { user };
	} catch (error) {
		// logger.error(error);
		return { error: (error as Error).message };
	}
}

export async function editUser({
	name,
	userId,
}: {
	userId: string;
	name: string;
}) {
	try {
		const upd = await db
			.update(users)
			.set({ name })
			.where(eq(users.id, userId));
		if (upd.rowCount === 0) {
			return { error: "update failed" };
		}
		return { message: "success" };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid id" };
		}
		return { error: err.message };
	}
}

export async function resetPassword({
	password,
	userId,
}: {
	password: string;
	userId: string;
}) {
	try {
		const user = await db
			.update(users)
			.set({ password })
			.where(eq(users.id, userId))
			.returning({ id: users.id });
		if (!user.length || !user[0].id) {
			return { error: "user not found" };
		}
		return { message: "success" };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid id" };
		}
		return { error: err.message };
	}
}

export async function deleteUser(id: string) {
	try {
		const result = await db
			.delete(users)
			.where(eq(users.id, id))
			.returning({ id: users.id });
		if (!result.length || !result[0].id) {
			return { error: "delete failed" };
		}
		return { message: result[0].id };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid id" };
		}
		return { error: err.message };
	}
}

export async function createLoginSession(
	body: Omit<LoginSession, "id" | "createdAt" | "status">,
) {
	try {
		await db.insert(loginSessions).values({ ...body });
		return { message: "success" };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		return { error: err.message };
	}
}

export async function getLoginSession(
	body: Pick<LoginSession, "userId" | "userAgent" | "sessionToken">,
) {
	try {
		const loginSession = await db
			.select({
				id: loginSessions.id,
				userId: loginSessions.userId,
				userAgent: loginSessions.userAgent,
				sessionToken: loginSessions.sessionToken,
				status: loginSessions.status,
				userRole: users.role,
				userEmail: users.email,
			})
			.from(loginSessions)
			.leftJoin(users, eq(users.id, loginSessions.userId))
			.where(
				and(
					eq(loginSessions.userId, body.userId),
					eq(loginSessions.userAgent, body.userAgent),
					eq(loginSessions.sessionToken, body.sessionToken),
					eq(loginSessions.status, "active"),
				),
			)
			.orderBy(desc(loginSessions.createdAt))
			.limit(1);
		if (!loginSession.length) {
			return { error: "not found" };
		}
		return { loginSession: loginSession[0] };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		return { error: err.message };
	}
}

export async function logoutUser({
	id,
	userAgent,
}: {
	id: string;
	userAgent: string;
}) {
	try {
		const result = await db
			.update(loginSessions)
			.set({ status: "expired" })
			.where(
				and(
					eq(loginSessions.userId, id),
					eq(loginSessions.userAgent, userAgent),
					eq(loginSessions.status, "active"),
				),
			);
		if (result.rowCount === 0) {
			return { error: "update failed" };
		}
		return { message: "success" };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		return { error: err.message };
	}
}

export async function saveOtp({
	email,
	otp,
	expiresAt = new Date(Date.now() + 15 * 60 * 1000),
}: {
	email: string;
	otp: number;
	expiresAt?: Date;
}) {
	try {
		await db
			.insert(otps)
			.values({ userEmail: email, otp, otpExpiry: expiresAt });

		return { message: "success" };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		return { error: err.message };
	}
}
export async function getOtp({ otp, email }: { otp: number; email: string }) {
	try {
		const result = await db.query.otps.findFirst({
			where: and(eq(otps.userEmail, email), eq(otps.otp, otp)),
			orderBy: desc(otps.createdAt),
		});
		if (!result) {
			return null;
		}
		return result;
	} catch (error) {
		return null;
	}
}

export async function addWrongPasswordTrial(id: string) {
	try {
		await db.insert(wrongPasswordTrial).values({ userId: id });
		return { message: "success" };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getWrongPasswordTrials(id: string) {
	try {
		const trails = await db
			.select()
			.from(wrongPasswordTrial)
			.where(eq(wrongPasswordTrial.userId, id));
		return { trails };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function deleteWrongPassTrials(id: string) {
	try {
		await db
			.delete(wrongPasswordTrial)
			.where(and(eq(wrongPasswordTrial.userId, id)));
		return { message: "success" };
	} catch (error) {
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid id" };
		}
		return { error: err.message };
	}
}
