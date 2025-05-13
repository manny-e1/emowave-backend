import { eq } from "drizzle-orm";
import db from "../db/index.js";
import {
	biologicalInflammationGroupings,
	type CreateBiologicalInflammationGrouping,
} from "../db/schema.js";

export async function createBiologicalInflammationGrouping(
	body: CreateBiologicalInflammationGrouping,
) {
	try {
		await db.insert(biologicalInflammationGroupings).values(body).returning();
		return { message: "success" };
	} catch (error) {
		const err = error as Error;
		if (err.message.includes("duplicate key value violates")) {
			return { error: "Grouping with this combination already exists" };
		}
		return { error: err.message };
	}
}

export async function getAllBiologicalInflammationGroupings() {
	try {
		const groupings = await db.select().from(biologicalInflammationGroupings);
		return { groupings };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function getBiologicalInflammationGrouping(id: string) {
	try {
		const grouping = await db
			.select()
			.from(biologicalInflammationGroupings)
			.where(eq(biologicalInflammationGroupings.id, id));
		if (grouping.length === 0) {
			return { error: "not found" };
		}
		return { grouping: grouping[0] };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function updateBiologicalInflammationGrouping(
	id: string,
	body: Partial<CreateBiologicalInflammationGrouping>,
) {
	try {
		const updatedGrouping = await db
			.update(biologicalInflammationGroupings)
			.set(body)
			.where(eq(biologicalInflammationGroupings.id, id));
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

export async function deleteBiologicalInflammationGrouping(id: string) {
	try {
		const deletedGrouping = await db
			.delete(biologicalInflammationGroupings)
			.where(eq(biologicalInflammationGroupings.id, id));
		if (deletedGrouping.rowCount === 0) {
			return { error: "delete failed" };
		}
		return { message: "Grouping deleted successfully" };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function getInflammations() {
	try {
		const inflammations = await db.query.inflammations.findMany();
		return { inflammations };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}
