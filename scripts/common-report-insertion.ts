import fs from "node:fs";
import csv from "csv-parser";
import db from "../src/db/index.js";
import { commonReport } from "../src/db/schema.js";

type CommonReport = {
	Sensory: string;
	"1": string;
	"2": string;
	"Your Style of Communicate": string;
	"Your style of learning": string;
	"Your way of decision making": string;
};
export function insertCommonReport() {
	const results: CommonReport[] = [];

	fs.createReadStream(`${process.env.DOCUMENTS_PATH}/Comm Report.csv`)
		.pipe(csv())
		.on("data", (data: CommonReport) => results.push(data))
		.on("end", async () => {
			try {
				await db.insert(commonReport).values(
					results.map((data) => ({
						sensory: data.Sensory,
						inwardOutwardOrientation: data["1"],
						introvertExtrovertTendency: data["2"],
						styleOfCommunicate: data["Your Style of Communicate"],
						styleOfLearning: data["Your style of learning"],
						wayOfDecisionMaking: data["Your way of decision making"],
					})),
				);
				console.log("Common Report inserted successfully");
			} catch (error) {
				console.error("Error inserting Common Report:", error);
			}
		});
}
