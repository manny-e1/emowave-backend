import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { presentCharacters } from "../src/db/schema.js";

type PresentCharacter = {
	Language: string;
	No: string;
	Character: string;
	"Present Character": string;
	Summary: string;
	"Work Environment": string;
	"Ideas Jobs": string;
	"Grow Path": string;
	"Video Present Character": string;
};

const results: PresentCharacter[] = [];

fs.createReadStream(
	process.env.NODE_ENV === "production"
		? "/home/ubuntu/All Present Characters.csv"
		: "/Users/amanueltiruneh/Downloads/work docs/ReferenceData/All Present Characters.csv",
)
	.pipe(csv())
	.on("data", (data: PresentCharacter) => results.push(data))
	.on("end", async () => {
		try {
			await db.insert(presentCharacters).values(
				results.map((data) => ({
					language: data.Language,
					no: data.No,
					character: data.Character,
					presentCharacter: data["Present Character"],
					summary: data.Summary,
					workEnvironment: data["Work Environment"],
					ideasJobs: data["Ideas Jobs"],
					growPath: data["Grow Path"],
					videoPresentCharacter: data["Video Present Character"],
				})),
			);
			console.log("Present Characters inserted successfully");
		} catch (error) {
			console.error("Error inserting Present Characters:", error);
		}
	});
