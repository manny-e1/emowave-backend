import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { wellnessList } from "../src/db/schema.js";

type Wellness = {
	Language: string;
	"No.": string;
	Header: string;
	Description: string;
	Status: string;
};
export function insertWellnessList() {
	const results: Wellness[] = [];

	fs.createReadStream(`${process.env.DOCUMENTS_PATH}/Wellness List.csv`)
		.pipe(csv())
		.on("data", (data: Wellness) => results.push(data))
		.on("end", async () => {
			try {
				await db.insert(wellnessList).values(
					results.map((data) => ({
						language: data.Language,
						no: data["No."],
						header: data.Header,
						description: data.Description,
						status: data.Status,
					})),
				);
				console.log("Wellness List inserted successfully");
			} catch (error) {
				console.error("Error inserting Wellness List:", error);
			}
		});
}
