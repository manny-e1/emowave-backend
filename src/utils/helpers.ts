import crypto from "node:crypto";
import type { Request } from "express";
import { URLSearchParams } from "node:url";
import argon2 from "argon2";
// import validator from 'validator';

export function IsJsonString(str: string) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

export function generateRandomUuid(length: number, encoding: "hex" | "base64") {
	const bytes = crypto.randomBytes(length);
	const uuid = bytes.toString(encoding);
	return uuid;
}

export function isExpired(d1: Date) {
	const d2 = new Date();
	const diff = (d2.getTime() - d1.getTime()) / (1000 * 60);
	return diff > 0;
}

export function setTokenExpiry() {
	const d = new Date();
	return new Date(d.setMinutes(d.getMinutes() + 30));
}

// export function sanitizeValues(obj: Record<string, any>) {
//   const sanitizedValues: Record<string, any> = {};
//   Object.entries(obj).forEach((obj) => {
//     if (obj !== undefined && obj !== null) {
//       const key = obj[0];
//       const value = obj[1];
//       if (typeof value === 'object') {
//         if (Array.isArray(value)) {
//           const sanitizedArray = value.map((v) => {
//             if (typeof v === 'string') {
//               return validator
//                 .escape(v)
//                 .replaceAll('&#x2F;', '/')
//                 .replaceAll('&quot;', '"');
//             } else if (typeof v === 'object') {
//               return sanitizeValues(v);
//             } else {
//               return v;
//             }
//           });
//           sanitizedValues[key] = sanitizedArray;
//         } else {
//           sanitizedValues[key] = sanitizeValues(value);
//         }
//       } else if (typeof value === 'string') {
//         const sanitizedValue = validator
//           .escape(value)
//           .replaceAll('&#x2F;', '/')
//           .replaceAll('&quot;', '"');
//         sanitizedValues[key] = sanitizedValue;
//       } else {
//         sanitizedValues[key] = value;
//       }
//     }
//   });
//   return sanitizedValues;
// }
