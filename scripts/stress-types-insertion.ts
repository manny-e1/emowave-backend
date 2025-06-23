import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { stressTypes } from "../src/db/schema.js";

type StressType = {
	"Stress-From": string;
	"Stress-To": string;
	"Description-En": string;
	"Description-Ch": string;
	Indicator: string;
	"Children Intelligence": string;
};
export function insertStressTypes() {
	const results: StressType[] = [];

	fs.createReadStream(`${process.env.DOCUMENTS_PATH}/All Stress Types.csv`)
		.pipe(csv())
		.on("data", (data: StressType) => results.push(data))
		.on("end", async () => {
			try {
				await db.insert(stressTypes).values(
					results.map((data) => ({
						stressFrom: Number.parseFloat(data["Stress-From"]),
						stressTo: Number.parseFloat(data["Stress-To"]),
						descriptionEn: data["Description-En"],
						descriptionCh: data["Description-Ch"],
						indicator: data.Indicator,
						childrenIntelligence: data["Children Intelligence"],
					})),
				);
				console.log("Stress Types inserted successfully");
			} catch (error) {
				console.error("Error inserting Stress Types:", error);
			}
		});
}
