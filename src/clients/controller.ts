import type { Request, Response } from "express";
import * as ClientService from "./service.js";
import csvParser from "csv-parser";
import { Readable } from "node:stream";
import {
	generatedDocuments,
	processedClientData,
	type Client,
	type ClientDocument,
	type CreateClientDocument,
} from "../db/schema.js";
import createHttpError from "http-errors";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import db from "../db/index.js";
import { generateRichDocument } from "../utils/generate-docx.js";
import {
	type Condition,
	parseAndExtractIDNReport,
} from "../utils/parse-and-extract-idn-report.js";

type ClientData = {
	"Client #": string;
	"Full Name": string;
	Mobile: string;
	Email: string;
	Age: string;
	Country: string;
	City: string;
	Type: string;
	"Assigned Practitioner": string;
	"Company Name": string;
	"Business Sector": string;
	"Added Time": string;
	"Added By": string;
	Event: string;
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));
export async function httpSaveClients(req: Request, res: Response) {
	if (!req.file) {
		throw createHttpError.BadRequest("please include a file in the request");
	}

	const results: ClientData[] = [];

	const stream = Readable.from(req.file.buffer.toString());
	await new Promise((resolve, rej) => {
		stream
			.pipe(csvParser())
			.on("data", (data) => results.push(data))
			.on("end", () => {
				resolve(undefined);
			})
			.on("error", (err) => rej(err));
	});
	const clients = results.map((result) => {
		return {
			clientNumber: Number(result["Client #"]),
			fullName: result["Full Name"],
			mobile: result.Mobile,
			email: result.Email.trim() || null,
			age: result.Age ? Number(result.Age) : null,
			country: result.Country,
			city: result.City || null,
			type: result.Type || null,
			assignedPractitioner: result["Assigned Practitioner"],
			companyName: result["Company Name"] || null,
			businessSector: result["Business Sector"] || null,
			addedTime: result["Added Time"],
			addedBy: result["Added By"] || null,
			event: result.Event || null,
		};
	});
	const result = await ClientService.saveClients(clients);
	if (result.error) {
		throw createHttpError(result.error);
	}
	res.status(200).json({ message: "success" });
}

export async function httpGetClients(req: Request, res: Response) {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 50;

	const result = await ClientService.getClients({ page, limit });
	if (result.error) {
		throw createHttpError(result.error);
	}
	res.status(200).json(result);
}

export async function httpGetClient(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result = await ClientService.getClient(id);
	if (result.error) {
		throw createHttpError(result.error);
	}
	res.status(200).json(result);
}

export async function httpSaveClientDocument(
	req: Request<{ id: string }, unknown, ClientDocument>,
	res: Response,
) {
	if (!req.files) {
		throw createHttpError.BadRequest("please include files in the request");
	}
	const documentData: CreateClientDocument[] = (
		req.files as Express.Multer.File[]
	).map((file: Express.Multer.File) => {
		return {
			clientId: req.params.id,
			documentName: file.filename,
			documentPath: file.path,
		};
	});
	const result = await ClientService.saveClientDocument(documentData);
	if (result.error) {
		throw createHttpError(result.error);
	}
	const filePaths = documentData
		.map((doc) => {
			const ext = path.extname(doc.documentName).toLowerCase().slice(1);
			if (ext === "pdf" || ext === "txt") {
				return {
					ext,
					path: doc.documentPath,
					name: doc.documentName,
				};
			}
			return undefined;
		})
		.filter((d) => d !== undefined);
	const idnReport = filePaths.find((f) => f.ext === "txt");
	const visualReport = filePaths.find((f) => f.ext === "pdf");
	if (visualReport) {
		const worker = new Worker(path.join(__dirname, "/workers/process-pdf.js"), {
			workerData: {
				filePath: visualReport.path,
				clientId: req.params.id,
				documentName: visualReport.name,
			},
		});
		// Optional: Listen for messages from the worker (e.g., for logging)
		worker.on("message", async (message) => {
			if (message.success) {
				console.log(
					`Worker completed for client ${req.params.id}: ${message.extractedData}`,
				);
				let conditions: Condition[] | null = null;
				if (idnReport) {
					conditions = await parseAndExtractIDNReport(idnReport.path);
				}
				await db.insert(processedClientData).values({
					clientId: req.params.id,
					visualReportDocumentName: visualReport.name,
					visualReportData: message.extractedData,
					idnData: conditions,
					idnReportDocumentName: idnReport?.name,
				});
				const uploadPath = await generateRichDocument({
					documentName: visualReport.name,
					parsedData: message.extractedData,
				});
				await db.insert(generatedDocuments).values({
					clientId: req.params.id,
					name: visualReport.name,
					path: uploadPath,
				});
			} else {
				console.error(
					`Worker failed for client ${req.params.id}: ${message.error}`,
				);
			}
		});

		// Optional: Handle worker errors
		worker.on("error", (error) => {
			console.error(
				`Worker error for client ${req.params.id}: ${error.message}`,
			);
		});

		// Optional: Log when the worker thread exits
		worker.on("exit", (code) => {
			if (code !== 0) {
				console.error(
					`Worker for client ${req.params.id} exited with code ${code}`,
				);
			}
		});
	}

	res.status(200).json(result);
}

export async function httpGetClientDocuments(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result = await ClientService.getClientDocuments(id);
	if (result.error) {
		throw createHttpError(result.error);
	}
	res.status(200).json(result);
}

export async function httpDeleteClientDocument(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result = await ClientService.deleteClientDocument(id);
	if (result.error) {
		if (result.error === "delete failed") {
			throw createHttpError.NotFound("Deleting client document failed");
		}
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}

export async function httpGetProcessedDocuments(
	req: Request<{ clientId: string }>,
	res: Response,
) {
	const { clientId } = req.params;
	const result = await ClientService.getProcessedDocuments(clientId);
	res.status(200).json(result);
}
