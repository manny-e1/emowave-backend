import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { realIntentions } from "../src/db/schema.js";

type RealIntention = {
	Language: string;
	No: string;
	Character: string;
	"Real Intention": string;
	Summary: string;
	"Career Choices": string;
	"Ideal Workplace": string;
	"Ideas Jobs": string;
	"Grow Path": string;
	"Video Real Intention": string;
};

export function insertRealIntentions() {
	const results: RealIntention[] = [];

	fs.createReadStream(`${process.env.DOCUMENTS_PATH}/All Real Intentions.csv`)
		.pipe(csv())
		.on("data", (data: RealIntention) => results.push(data))
		.on("end", async () => {
			try {
				await db.insert(realIntentions).values(
					results.map((data) => ({
						language: data.Language,
						no: data.No,
						character: data.Character,
						realIntention: data["Real Intention"],
						summary: data.Summary,
						careerChoices: data["Career Choices"],
						idealWorkplace: data["Ideal Workplace"],
						ideasJobs: data["Ideas Jobs"],
						growPath: data["Grow Path"],
						videoRealIntention: data["Video Real Intention"],
					})),
				);
				console.log("Real intentions inserted successfully");
			} catch (error) {
				console.error("Error inserting Real intentions:", error);
			}
		});
}
