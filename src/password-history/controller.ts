import type { Request, Response } from "express";
// import { changeLastPwdDate, checkPasswordValidity } from "./service.js";
import createHttpError from "http-errors";
// import { isMoreThan60DaysAfter } from '../utils/helpers.js';
import { getUserByEmail } from "../users/service.js";

// export async function httpCheckPasswordValidity(
//   req: Request<{ userId: string }>,
//   res: Response
// ) {
//   const { userId } = req.params;
//   const result = await checkPasswordValidity(userId);
//   if (result.error) {
//     if (result.error === 'not found') {
//       throw createHttpError.NotFound(
//         'not found, make sure the user id is valid'
//       );
//     }if (result.error === 'invalid id') {
//       throw createHttpError.BadRequest(result.error);
//     }
//     throw createHttpError(result.error);
//   }
//   const updatedAt = result.updatedAt;
//   const isMoreThan60Days = isMoreThan60DaysAfter(updatedAt);

//   if (isMoreThan60Days) {
//     throw createHttpError.Forbidden(
//       "it's been more than 60 days since you've updated your password, click ok to update your password now"
//     );
//   }
//   res.status(204).json();
// }

// export async function httpChangeLastPwdDate(
// 	req: Request<unknown, unknown, { email: string; day: number }>,
// 	res: Response,
// ) {
// 	const { email, day } = req.body;
// 	const result = await getUserByEmail(email);
// 	if (result.error || !result.user) {
// 		if (result.error === "not found") {
// 			throw createHttpError.NotFound("Email not found");
// 		}
// 		throw createHttpError(result.error);
// 	}
// 	const today = new Date();
// 	const subtractedDate = new Date(today.getTime() - day * 24 * 60 * 60 * 1000);
// 	const result2 = await changeLastPwdDate({
// 		id: result.user.id,
// 		date: subtractedDate,
// 	});
// 	if (result2.error) {
// 		throw createHttpError(result2.error);
// 	}

// 	res.status(200).json(result2);
// }
