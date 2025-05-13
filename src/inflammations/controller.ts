import type { Request, Response } from "express";
import createHttpError from "http-errors";
import * as InflammationGroupingService from "./service.js";
import type { CreateBiologicalInflammationGrouping } from "../db/schema.js";

export async function httpCreateBiologicalInflammationGrouping(
	req: Request<unknown, unknown, CreateBiologicalInflammationGrouping>,
	res: Response,
) {
	const result =
		await InflammationGroupingService.createBiologicalInflammationGrouping(
			req.body,
		);
	if (result.error) {
		throw createHttpError.BadRequest(result.error);
	}
	res.status(201).json(result);
}

export async function httpGetAllBiologicalInflammationGroupings(
	req: Request,
	res: Response,
) {
	const result =
		await InflammationGroupingService.getAllBiologicalInflammationGroupings();
	if (result.error) {
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}

export async function httpGetBiologicalInflammationGrouping(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result =
		await InflammationGroupingService.getBiologicalInflammationGrouping(id);
	if (result.error) {
		if (result.error === "not found") {
			throw createHttpError.NotFound("Organ indicator not found");
		}
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}

export async function httpUpdateBiologicalInflammationGrouping(
	req: Request<
		{ id: string },
		unknown,
		Partial<CreateBiologicalInflammationGrouping>
	>,
	res: Response,
) {
	const { id } = req.params;
	const result =
		await InflammationGroupingService.updateBiologicalInflammationGrouping(
			id,
			req.body,
		);
	if (result.error) {
		if (result.error === "update failed") {
			throw createHttpError.NotFound("Updateing organ indicator failed");
		}
		throw createHttpError.BadRequest(result.error);
	}
	res.status(200).json(result);
}

export async function httpDeleteBiologicalInflammationGrouping(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result =
		await InflammationGroupingService.deleteBiologicalInflammationGrouping(id);
	if (result.error) {
		if (result.error === "delete failed") {
			throw createHttpError.NotFound("Deleting organ indicator failed");
		}
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}

export async function httpGetInflammations(req: Request, res: Response) {
	const result = await InflammationGroupingService.getInflammations();
	if (result.error) {
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}
