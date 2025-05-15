import type { Request, Response } from "express";
import * as ClientService from "./service.js";
import csvParser from "csv-parser";
import { Readable } from "node:stream";
import {
	generatedDocuments,
	processedClientData,
	type ProcessVisualReportData,
	type ClientDocument,
	type CreateClientDocument,
	type BiologicalInflammationGrouping,
} from "../db/schema.js";
import createHttpError from "http-errors";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import db from "../db/index.js";
import { generateRichDocument } from "../utils/generate-docx.js";
import {
	type IDNReport,
	parseAndExtractIDNReport,
} from "../utils/parse-and-extract-idn-report.js";
import * as ReferenceDataService from "../reference-datas/service.js";
import {
	PERCENTAGE_RANGE,
	SCALE_RANGE,
} from "../utils/scale-and-percentage-range.js";
import { getAllBiologicalInflammationGroupings } from "../inflammations/service.js";

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

	const result = await ClientService.getClients({ page, limit: 8000 });
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
	if (idnReport && !visualReport) {
		const prevProcessedData = await ClientService.getClientProcessedData(
			req.params.id,
		);
		const parsedIdnReport = await parseAndExtractIDNReport(idnReport.path);
		const prevReports =
			(prevProcessedData?.processedData?.idnData as IDNReport[]) ?? [];
		const prevDocuments =
			prevProcessedData?.processedData?.idnReportDocumentName ?? [];
		const sameScanType = prevReports.find(
			(report) => report.scanType === parsedIdnReport.scanType,
		);

		const updatedIDNData = sameScanType
			? prevReports.map((report) =>
					report.scanType === parsedIdnReport.scanType
						? parsedIdnReport
						: report,
				)
			: [...prevReports, parsedIdnReport];
		const documents = sameScanType
			? prevDocuments
			: [...prevDocuments, idnReport.name];

		const clientData = await db
			.insert(processedClientData)
			.values({
				clientId: req.params.id,
				idnData: updatedIDNData,
				idnReportDocumentName: documents,
			})
			.onConflictDoUpdate({
				target: [processedClientData.clientId],
				set: {
					idnData: updatedIDNData,
					idnReportDocumentName: documents,
				},
			})
			.returning();

		const uploadPath = await generateRichDocument({
			documentName: idnReport.name,
			parsedData: clientData?.[0]
				.visualReportData as ProcessVisualReportData | null,
			idnReports: clientData?.[0]?.idnData as IDNReport[] | null,
		});

		const conversionWorker = new Worker(
			path.join(__dirname, "/workers/process-word-to-pdf-conversion.js"),
			{
				workerData: {
					docxFilePath: uploadPath,
				},
			},
		);

		conversionWorker.on("message", async (conversionMessage) => {
			if (conversionMessage.success) {
				console.log(
					`PDF conversion successful: ${conversionMessage.outputPath}`,
				);
				await db
					.insert(generatedDocuments)
					.values({
						clientId: req.params.id,
						name: idnReport.name,
						path: conversionMessage.outputPath,
					})
					.onConflictDoUpdate({
						target: [generatedDocuments.clientId],
						set: {
							name: idnReport.name,
							path: conversionMessage.outputPath,
						},
					});
			} else {
				console.error(`PDF conversion failed: ${conversionMessage.error}`);
			}
		});
		conversionWorker.on("error", (error) => {
			console.error(`Conversion Worker error: ${error.message}`);
		});
		conversionWorker.on("exit", (code) => {
			if (code !== 0) {
				console.error(`Conversion Worker exited with code ${code}`);
			}
		});
	}
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
				const values: {
					visualReportDocumentName: string;
					visualReportData: unknown;
					idnData?: IDNReport[];
					idnReportDocumentName?: string[];
				} = {
					visualReportDocumentName: visualReport.name,
					visualReportData: message.extractedData,
				};
				const clientData = await ClientService.getClientProcessedData(
					req.params.id,
				);
				if (idnReport) {
					const parsedIdnReport = await parseAndExtractIDNReport(
						idnReport.path,
					);
					const prevReports = clientData?.processedData?.idnData as IDNReport[];
					const prevDocuments =
						clientData?.processedData?.idnReportDocumentName;
					const sameScanType = prevReports?.find(
						(report) => report.scanType === parsedIdnReport.scanType,
					);

					if (sameScanType) {
						// Update the existing report with the same scan type
						const updatedIDNData = prevReports?.map((report) =>
							report.scanType === parsedIdnReport.scanType
								? parsedIdnReport
								: report,
						);
						values.idnData = updatedIDNData;
						values.idnReportDocumentName = prevDocuments
							? [...prevDocuments, idnReport.name]
							: [idnReport.name];
					} else {
						const documents = prevDocuments
							? [...prevDocuments, idnReport.name]
							: [idnReport.name];
						const appendedIDNData = prevReports
							? [...prevReports, parsedIdnReport]
							: [parsedIdnReport];
						values.idnData = appendedIDNData;
						values.idnReportDocumentName = documents;
					}
				}
				const insertedData = await db
					.insert(processedClientData)
					.values({
						clientId: req.params.id,
						...values,
					})
					.onConflictDoUpdate({
						target: [processedClientData.clientId],
						set: {
							...values,
						},
					})
					.returning();
				const uploadPath = await generateRichDocument({
					documentName: visualReport.name,
					parsedData: message.extractedData,
					idnReports: insertedData?.[0]?.idnData as IDNReport[] | null,
				});
				const conversionWorker = new Worker(
					path.join(__dirname, "/workers/process-word-to-pdf-conversion.js"),
					{
						workerData: {
							docxFilePath: uploadPath,
						},
					},
				);
				conversionWorker.on("message", async (conversionMessage) => {
					if (conversionMessage.success) {
						console.log(
							`PDF conversion successful: ${conversionMessage.outputPath}`,
						);
						await db
							.insert(generatedDocuments)
							.values({
								clientId: req.params.id,
								name: visualReport.name,
								path: conversionMessage.outputPath,
							})
							.onConflictDoUpdate({
								target: [generatedDocuments.clientId],
								set: {
									name: visualReport.name,
									path: conversionMessage.outputPath,
								},
							});
					} else {
						console.error(`PDF conversion failed: ${conversionMessage.error}`);
					}
				});
				conversionWorker.on("error", (error) => {
					console.error(`Conversion Worker error: ${error.message}`);
				});
				conversionWorker.on("exit", (code) => {
					if (code !== 0) {
						console.error(`Conversion Worker exited with code ${code}`);
					}
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

export async function httpGetClientProcessedData(req: Request, res: Response) {
	const { email } = req.user;
	const client = await ClientService.getClientByEmail(email ?? "");
	if (!client) {
		throw createHttpError.NotFound("Client not found");
	}
	const result = await ClientService.getClientProcessedData(client.id);
	if (result.error) {
		if (result.error.includes("not found")) {
			throw createHttpError.NotFound("Client processed data not found");
		}
		throw createHttpError.InternalServerError(result.error);
	}
	const [healthData, stressTypes, musicalNotes, commonReports] =
		await Promise.all([
			ReferenceDataService.getAllHealthData(),
			ReferenceDataService.getAllStressTypes(),
			ReferenceDataService.getAllMusicalNotes(),
			ReferenceDataService.getAllCommonReports(),
		]);
	const visualReportData = result.processedData
		?.visualReportData as ProcessVisualReportData;
	const idnReports = result.processedData?.idnData as IDNReport[];
	const inflammationGroupingsResult =
		await getAllBiologicalInflammationGroupings();
	let groupings: BiologicalInflammationGrouping[] = [];
	if (inflammationGroupingsResult.groupings) {
		groupings = inflammationGroupingsResult.groupings;
	}

	const combinedData = {
		...result.processedData,
		stressIndicator: stressTypes.find(
			(data) =>
				Number.parseFloat(visualReportData?.stress_level.score) >=
					data.stressFrom &&
				Number.parseFloat(visualReportData?.stress_level.score) <=
					data.stressTo,
		)?.indicator,
		behaviorPatterns: visualReportData?.emotional_state.empowering.map((s) => {
			const musicalNote = musicalNotes.find((data) => data.empowering === s);
			return {
				note: musicalNote?.note,
				frequency: musicalNote?.freq,
				waveLength: musicalNote?.wavelength
					? musicalNote.wavelength.replace(/cm/g, "").trim()
					: musicalNote?.wavelength,
				positiveEmotions: musicalNote?.positiveEmotions,
				negativeEmotions: musicalNote?.negativeEmotions,
				socialBehaviourPattern: musicalNote?.socialBehaviorPattern,
			};
		}),
		commonReport: (() => {
			const base = visualReportData?.sensory_attributes.base;
			const next = visualReportData?.sensory_attributes.next;
			const baseData = commonReports.find(
				(data) =>
					data.sensory.toLowerCase() === base?.attributes[0].toLowerCase() &&
					data.inwardOutwardOrientation.toLowerCase() ===
						base?.attributes[1].toLowerCase() &&
					data.introvertExtrovertTendency.toLowerCase() ===
						base?.attributes[2].toLowerCase(),
			);
			const nextData = commonReports.find(
				(data) =>
					data.sensory.toLowerCase() === next?.attributes[0].toLowerCase() &&
					data.inwardOutwardOrientation.toLowerCase() ===
						next?.attributes[1].toLowerCase() &&
					data.introvertExtrovertTendency.toLowerCase() ===
						next?.attributes[2].toLowerCase(),
			);
			return {
				base: baseData,
				next: nextData,
			};
		})(),
		healthData: visualReportData?.organ_indicators.map((organ, index) => {
			return {
				no: (index + 1).toString(),
				area: organ,
				physicalWellbeing: healthData.find((data) => data.area === organ)
					?.physicalWellbeing,
			};
		}),
		scaleRange: SCALE_RANGE,
		percentageRange: PERCENTAGE_RANGE,
		scanTypes: idnReports
			.map((idnReport) => {
				const reportInflammations = idnReport.report.map((f) => f.name);
				for (const group of groupings) {
					if (
						group.inflammations.every((inflammation) =>
							reportInflammations.includes(inflammation),
						)
					) {
						const totalScale = idnReport.report.reduce(
							(sum, item) => sum + (item.scale ?? 0),
							0,
						);
						const totalPercentage = idnReport.report.reduce(
							(sum, item) =>
								sum +
								(item.percentage
									? Number(item.percentage.replace("%", ""))
									: 0),
							0,
						);
						return {
							scanType: idnReport.scanType,
							avgScale: Number(
								(totalScale / idnReport.report.length).toFixed(1),
							),
							avgPercentage: Number(
								(totalPercentage / idnReport.report.length).toFixed(1),
							),
						};
					}
				}
			})
			.filter(Boolean),
	};
	res.status(200).json({ processedData: combinedData });
}
