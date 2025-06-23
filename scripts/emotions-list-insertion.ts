import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { emotionsListFreqCore } from "../src/db/schema.js";

type EmotionFreqCore = {
	Language: string;
	"No.": string;
	Header: string;
	Description: string;
	Status: string;
	Explanation: string;
};
export function insertEmotionsListFreqCore() {
	const results: EmotionFreqCore[] = [];

	fs.createReadStream(
		`${process.env.DOCUMENTS_PATH}/Emotions List_ Freq _ Core.csv`,
	)
		.pipe(csv())
		.on("data", (data: EmotionFreqCore) => results.push(data))
		.on("end", async () => {
			try {
				await db.insert(emotionsListFreqCore).values(
					results.map((data) => ({
						language: data.Language,
						no: data["No."],
						header: data.Header,
						description: data.Description,
						status: data.Status,
						explanation: data.Explanation,
					})),
				);
				console.log("Emotions List Freq Core data inserted successfully");
			} catch (error) {
				console.error("Error inserting Emotions List Freq Core data:", error);
			}
		});
}
