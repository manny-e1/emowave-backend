import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { healthData } from "../src/db/schema.js";

type HealthData = {
	Area: string;
	"physical wellbeing": string;
};

const results: HealthData[] = [];

fs.createReadStream(
	process.env.NODE_ENV === "production"
		? "/home/ubuntu/All Health Data.csv"
		: "/Users/amanueltiruneh/Downloads/work docs/ReferenceData/All Health Data.csv",
)
	.pipe(csv())
	.on("data", (data: HealthData) => results.push(data))
	.on("end", async () => {
		try {
			await db.insert(healthData).values(
				results.map((data) => ({
					area: data.Area,
					physicalWellbeing: data["physical wellbeing"],
				})),
			);
			console.log("Health Data inserted successfully");
		} catch (error) {
			console.error("Error inserting health data:", error);
		}
	});
