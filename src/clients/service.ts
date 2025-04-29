import { and, eq, sql } from "drizzle-orm";
import db from "../db/index.js";
import {
	clientDocuments,
	clients,
	type CreateClientDocument,
	type CreateClient,
	processedClientData,
	generatedDocuments,
} from "../db/schema.js";

export async function saveClients(body: CreateClient[]) {
	const CHUNK_SIZE = 4000;

	try {
		for (let i = 0; i < body.length; i += CHUNK_SIZE) {
			const chunk = body.slice(i, i + CHUNK_SIZE);
			await db.insert(clients).values(chunk).onConflictDoNothing();
		}

		return { message: "success" };
	} catch (error) {
		// logger.error(error);
		const err = error as Error;
		if (err.message.includes("duplicate key value violates")) {
			return { error: err.message };
		}
		return { error: err.message };
	}
}

export async function getClients({
	page,
	limit = 50,
}: { page: number; limit: number }) {
	const offset = (page - 1) * limit;

	try {
		const [totalCount] = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(clients);

		const clientList = await db
			.select()
			.from(clients)
			.orderBy(clients.clientNumber)
			.limit(limit)
			.offset(offset);

		return {
			clients: clientList,
			metadata: {
				currentPage: page,
				totalPages: Math.ceil(totalCount.count / limit),
				totalItems: totalCount.count,
				itemsPerPage: limit,
			},
		};
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function getClient(id: string) {
	try {
		const client = await db.query.clients.findFirst({
			where: eq(clients.id, id),
			columns: {
				id: false,
				createdAt: false,
				updatedAt: false,
			},
		});
		if (!client) {
			return { error: "client not found" };
		}
		return { client };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function saveClientDocument(doc: CreateClientDocument[]) {
	try {
		await db.insert(clientDocuments).values(doc);
		return { message: "success" };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function getClientDocuments(id: string) {
	try {
		const documents = await db.query.clientDocuments.findMany({
			where: eq(clientDocuments.clientId, id),
		});
		return { documents };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function deleteClientDocument(id: string) {
	try {
		const deletedDocument = await db
			.delete(clientDocuments)
			.where(eq(clientDocuments.id, id));
		if (deletedDocument.rowCount === 0) {
			return { error: "delete failed" };
		}
		return { message: "Document deleted successfully" };
	} catch (error) {
		const err = error as Error;
		return { error: err.message };
	}
}

export async function getProcessedDocuments(clientId: string) {
	try {
		const documents = await db.query.generatedDocuments.findMany({
			where: eq(generatedDocuments.clientId, clientId),
		});
		return { documents };
	} catch (error) {
		return [];
	}
}

export async function getClientByEmail(email: string) {
	try {
		const client = await db.query.clients.findFirst({
			where: eq(clients.email, email),
		});
		if (!client) {
			return null;
		}
		return client;
	} catch (error) {
		return null;
	}
}
