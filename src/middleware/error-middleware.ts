import type { Request, NextFunction, Response } from "express";
import createError, { HttpError } from "http-errors";
import { IsJsonString } from "../utils/helpers.js";
import { ZodError, type z } from "zod";

interface RequestValidators {
	params?: z.AnyZodObject;
	body?: z.AnyZodObject;
	query?: z.AnyZodObject;
}
class ZodErrorResponse {
	constructor(public message: unknown) {}
}

export function validateRequest(validators: RequestValidators) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (validators.params) {
				// const sanitizedParams = sanitizeValues(req.params);
				req.params = await validators.params.parseAsync(req.params);
			}
			if (validators.body) {
				// const sanitizedBody = sanitizeValues(req.body);
				req.body = await validators.body.parseAsync(req.body);
			}
			if (validators.query) {
				// const sanitizedQuery = sanitizeValues(req.query);
				req.query = await validators.query.parseAsync(req.query);
			}
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const errors = error.errors.map((error) => {
					const errObj: Record<string | number, string> = {};
					errObj[error.path[0]] = error.message;
					return errObj;
				});
				res.status(422);
				next(new ZodErrorResponse(errors));
			} else {
				next(error);
			}
		}
	};
}

export interface ParamsDictionary {
	[key: string]: string;
}

type ControllerFn<
	Params extends ParamsDictionary,
	Res,
	Req,
	Query extends Record<string, unknown>,
> = (
	req: Request<Params, Res, Req, Query>,
	res: Response,
	next: NextFunction,
) => void;

export function notFound(req: Request, _: Response, next: NextFunction) {
	next(createError(404, `Not Found - ${req.method} ${req.originalUrl}`));
}

export function errorCatcher<
	Params extends ParamsDictionary,
	Res,
	Req,
	Query extends Record<string, unknown>,
>(fn: ControllerFn<Params, Res, Req, Query>) {
	return (
		req: Request<Params, Res, Req, Query>,
		res: Response,
		next: NextFunction,
	) => {
		return Promise.resolve(fn(req, res, next)).catch(next);
	};
}

export function errorHandler(
	err: Error | HttpError,
	_: Request,
	res: Response,
	next: NextFunction,
) {
	const statusCode = err instanceof HttpError ? err.statusCode : 500;
	res.status(statusCode).json({
		error: IsJsonString(err.message) ? JSON.parse(err.message) : err.message,
	});
}
