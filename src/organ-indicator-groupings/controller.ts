import type { Request, Response } from "express";
import createHttpError from "http-errors";
import * as GroupingService from "./service.js";
import type { CreateOrganIndicatorGrouping } from "../db/schema.js";

export async function httpCreateOrganIndicatorGrouping(
	req: Request<unknown, unknown, CreateOrganIndicatorGrouping>,
	res: Response,
) {
	const result = await GroupingService.createOrganIndicatorGrouping(req.body);
	if (result.error) {
		throw createHttpError.BadRequest(result.error);
	}
	res.status(201).json(result);
}

export async function httpGetAllOrganIndicatorGroupings(
	req: Request,
	res: Response,
) {
	const result = await GroupingService.getAllOrganIndicatorGroupings();
	if (result.error) {
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}

export async function httpGetOrganIndicatorGrouping(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result = await GroupingService.getOrganIndicatorGrouping(id);
	if (result.error) {
		if (result.error === "not found") {
			throw createHttpError.NotFound("Organ indicator not found");
		}
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}

export async function httpUpdateOrganIndicatorGrouping(
	req: Request<{ id: string }, unknown, Partial<CreateOrganIndicatorGrouping>>,
	res: Response,
) {
	const { id } = req.params;
	const result = await GroupingService.updateOrganIndicatorGrouping(
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

export async function httpDeleteOrganIndicatorGrouping(
	req: Request<{ id: string }>,
	res: Response,
) {
	const { id } = req.params;
	const result = await GroupingService.deleteOrganIndicatorGrouping(id);
	if (result.error) {
		if (result.error === "delete failed") {
			throw createHttpError.NotFound("Deleting organ indicator failed");
		}
		throw createHttpError.InternalServerError(result.error);
	}
	res.status(200).json(result);
}
