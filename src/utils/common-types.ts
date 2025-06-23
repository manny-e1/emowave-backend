import { z } from "zod";
export const ENVOBJ = z.object({
	DATABASE_URL: z.string(),
	EMAIL_FROM: z.string(),
	EMAIL_HOST: z.string(),
	EMAIL_PORT: z.string(),
	EMAIL_USER: z.string(),
	EMAIL_PASS: z.string(),
	SECRET_KEY: z.string(),
	NODE_ENV: z.union([z.literal("development"), z.literal("production")]),
	FRONT_END_URL: z.string(),
	PORT: z.coerce.number(),
	DOCUMENTS_PATH: z.string(),
	PYTHON_DOMAIN: z.string(),
	SERVER_DOMAIN: z.string(),
});

export interface ENVOBJ extends z.infer<typeof ENVOBJ> {}
