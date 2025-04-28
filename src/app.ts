import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { ZodError } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
dotenv.config();

import type { Role } from "./db/schema.js";
import { ENVOBJ } from "./utils/common-types.js";
import db from "./db/index.js";
import { errorHandler, notFound } from "./middleware/error-middleware.js";
import { userRouter } from "./users/route.js";
import { clientRouter } from "./clients/route.js";
import { organIndicatorGroupingRouter } from "./organ-indicator-groupings/route.js";

declare global {
	namespace Express {
		interface Request {
			user: {
				id: string | undefined;
				role: Role | undefined | null;
				email: string | undefined | null;
				clientId?: string | undefined;
			};
		}
	}
}

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(path.dirname(__filename));

const app = express();

try {
	ENVOBJ.parse(process.env);
} catch (error) {
	console.error((error as ZodError).message);
	throw new Error((error as ZodError).message);
}

await migrate(db, {
	migrationsFolder: "drizzle",
});

app.disable("x-powered-by");
app.use(
	helmet({
		crossOriginResourcePolicy: {
			policy: "cross-origin",
		},
		hsts: {
			maxAge: 31536000,
			includeSubDomains: true,
			preload: true,
		},
	}),
);
if (process.env.NODE_ENV !== "production") {
	app.use(morgan("dev"));
} else {
	app.use(
		morgan("common", {
			stream: fs.createWriteStream(path.join(__dirname, "access.log"), {
				flags: "a",
			}),
		}),
	);
}
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
	res.json({ message: "hello" });
});

app.use("/api/users", userRouter);
app.use("/api/clients", clientRouter);
app.use("/api/organ-indicators", organIndicatorGroupingRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(notFound);
app.use(errorHandler);

export default app;
