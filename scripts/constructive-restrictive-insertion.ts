import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { constructiveAndRestrictive } from "../src/db/schema.js";

type ConstructiveAndRestrictive = {
	Language: string;
	"No.": string;
	Header: string;
	Description: string;
	Status: string;
};

const results: ConstructiveAndRestrictive[] = [];

fs.createReadStream(
	"/Users/amanueltiruneh/Downloads/work docs/ReferenceData/Constructive and Restrictive.csv",
)
	.pipe(csv())
	.on("data", (data: ConstructiveAndRestrictive) => results.push(data))
	.on("end", async () => {
		try {
			await db.insert(constructiveAndRestrictive).values(
				results.map((data) => ({
					language: data.Language,
					no: data["No."],
					header: data.Header,
					description: data.Description,
					status: data.Status,
				})),
			);
			console.log("Constructive Restrictive data inserted successfully");
		} catch (error) {
			console.error("Error inserting Constructive Restrictive data:", error);
		}
	});
