import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { sensoryData } from "../src/db/schema.js";

type SensoryData = {
	Sensory: string;
	Chinese: string;
	Arabic: string;
};
export function insertSensoryData() {
	const results: SensoryData[] = [];

	fs.createReadStream(`${process.env.DOCUMENTS_PATH}/All_Sensory_Data.csv`)
		.pipe(csv())
		.on("data", (data: SensoryData) => results.push(data))
		.on("end", async () => {
			try {
				await db.insert(sensoryData).values(
					results.map((data) => ({
						sensory: data.Sensory,
						chinese: data.Chinese,
						arabic: data.Arabic,
					})),
				);
				console.log("Sensory Data inserted successfully");
			} catch (error) {
				console.error("Error inserting Sensory Data:", error);
			}
		});
}
