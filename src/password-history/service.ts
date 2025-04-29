import db from "../db/index.js";
import { type Source, passwordHistory } from "../db/schema.js";
// import { ERRORS } from '../utils/constants.js';
import { desc, eq } from "drizzle-orm";

export async function addToPasswordHistory({
	userId,
	password,
	source,
}: {
	userId: string;
	password: string;
	source: Source;
}) {
	try {
		await db.insert(passwordHistory).values({ userId, password, source });
		return { message: "success" };
	} catch (error) {
		// logger.error(error);
		return { error: (error as Error).message };
	}
}

export async function getPasswordHistory(userId: string) {
	try {
		const pwdHistory = await db
			.select()
			.from(passwordHistory)
			.where(eq(passwordHistory.userId, userId))
			.orderBy(desc(passwordHistory.createdAt));
		return { pwdHistory };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid id" };
		}
		return { error: err.message };
	}
}

// export async function checkPasswordValidity(id: string) {
// 	try {
// 		const pwd = await db
// 			.select({ updatedAt: passwordHistory.updatedAt })
// 			.from(passwordHistory)
// 			.where(eq(passwordHistory.userId, id))
// 			.orderBy(desc(passwordHistory.createdAt));
// 		if (!pwd.length) {
// 			return { error: ERRORS.NOT_FOUND };
// 		}
// 		return { updatedAt: pwd[0].updatedAt };
// 	} catch (error) {
// 		logger.error(error);
// 		const err = error as Error;
// 		if (err.message.includes("invalid input syntax for type uuid")) {
// 			return { error: ERRORS.INVALID_ID };
// 		}
// 		return { error: err.message };
// 	}
// }

// export async function changeLastPwdDate({
// 	id,
// 	date,
// }: {
// 	id: string;
// 	date: Date;
// }) {
// 	try {
// 		const upd = await db
// 			.update(passwordHistory)
// 			.set({ updatedAt: date })
// 			.where(eq(passwordHistory.userId, id));
// 		return { message: "success" };
// 	} catch (error) {
// 		return { error };
// 	}
// }
