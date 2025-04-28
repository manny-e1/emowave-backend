import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { musicalNotes } from "../src/db/schema.js";

type MuscialNote = {
	Language: string;
	Note: string;
	"Music Note": string;
	"General Reaction": string;
	Empowering: string;
	"Dis-empowering": string;
	Status: string;
	Wavelength: string;
	Freq: string;
	"Empower Check": string;
	"Your social behavior pattern": string;
	"Your Positive Emotions": string;
	"Your Negative Emotions": string;
	"Children Reaction": string;
};

const results: MuscialNote[] = [];

fs.createReadStream(
	process.env.NODE_ENV === "production"
		? "/home/ubuntu/Musical Notes.csv"
		: "/Users/amanueltiruneh/Downloads/work docs/ReferenceData/Musical Notes.csv",
)
	.pipe(csv())
	.on("data", (data: MuscialNote) => results.push(data))
	.on("end", async () => {
		try {
			await db.insert(musicalNotes).values(
				results.map((data) => ({
					language: data.Language,
					note: data.Note,
					musicNote: data["Music Note"],
					generalReaction: data["General Reaction"],
					empowering: data.Empowering,
					disempowering: data["Dis-empowering"],
					status: data.Status,
					wavelength: data.Wavelength,
					freq: data.Freq,
					empowerCheck: data["Empower Check"],
					socialBehaviorPattern: data["Your social behavior pattern"],
					positiveEmotions: data["Your Positive Emotions"],
					negativeEmotions: data["Your Negative Emotions"],
					childrenReaction: data["Children Reaction"],
				})),
			);
			console.log("Musical Notes inserted successfully");
		} catch (error) {
			console.error("Error inserting Musical Notes:", error);
		}
	});
