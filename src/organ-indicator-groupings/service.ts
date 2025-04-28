import { eq } from "drizzle-orm";
import db from "../db/index.js";
import {
	organIndicatorGroupings,
	type CreateOrganIndicatorGrouping,
} from "../db/schema.js";

export async function createOrganIndicatorGrouping(
	body: CreateOrganIndicatorGrouping,
) {
	try {
		await db.insert(organIndicatorGroupings).values(body).returning();
		return { message: "success" };
	} catch (error) {
		const err = error as Error;
		if (err.message.includes("duplicate key value violates")) {
			return { error: "Grouping with this health area already exists" };
		}
		return { error: err.message };
	}
}

export async function getAllOrganIndicatorGroupings() {
	try {
		const groupings = await db.select().from(organIndicatorGroupings);
		return { groupings };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function getOrganIndicatorGrouping(id: string) {
	try {
		const grouping = await db
			.select()
			.from(organIndicatorGroupings)
			.where(eq(organIndicatorGroupings.id, id));
		if (grouping.length === 0) {
			return { error: "not found" };
		}
		return { grouping: grouping[0] };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function updateOrganIndicatorGrouping(
	id: string,
	body: Partial<CreateOrganIndicatorGrouping>,
) {
	try {
		const updatedGrouping = await db
			.update(organIndicatorGroupings)
			.set(body)
			.where(eq(organIndicatorGroupings.id, id));
		if (updatedGrouping.rowCount === 0) {
			return { error: "update failed" };
		}
		return { message: "success" };
	} catch (error) {
		const err = error as Error;
		if (err.message.includes("duplicate key value violates")) {
			return { error: "Grouping with this health area already exists" };
		}
		return { error: err.message };
	}
}

export async function deleteOrganIndicatorGrouping(id: string) {
	try {
		const deletedGrouping = await db
			.delete(organIndicatorGroupings)
			.where(eq(organIndicatorGroupings.id, id));
		if (deletedGrouping.rowCount === 0) {
			return { error: "delete failed" };
		}
		return { message: "Grouping deleted successfully" };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}
