import db from "../db/index.js";
import { type CreateToken, tokens, users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function createToken(body: CreateToken) {
	try {
		const token = await db
			.insert(tokens)
			.values({ ...body })
			.returning({
				userId: tokens.userId,
				token: tokens.token,
				tokenExpiry: tokens.tokenExpiry,
			});
		return { token };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid user id", status: 403 };
		}
		return { error: err.message };
	}
}

export async function getToken({ token }: { token: string }) {
	try {
		const result = await db
			.select({
				tokenExpiry: tokens.tokenExpiry,
				userId: tokens.userId,
				status: users.status,
			})
			.from(tokens)
			.where(eq(tokens.token, token))
			.innerJoin(users, eq(users.id, tokens.userId));
		if (!result.length) {
			return { error: "not found" };
		}
		return { token: result[0] };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("invalid input syntax for type uuid")) {
			return { error: "invalid user id" };
		}
		return { error: err.message };
	}
}
