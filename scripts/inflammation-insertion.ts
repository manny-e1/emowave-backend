import db from "../src/db";
import { inflammations } from "../src/db/schema";

const _inflammations = [
	"Adrenal stimulant",
	"Ankylosing Spondylitis + (Part 1)",
	"Arachnoiditis ++",
	"Bells Palsy + (Part 2)",
	"Brain Beta wave stimulation",
	"CTLA4 (CTLA4) mRNA, complete cds ( Part 2 ) +++",
	"Depression II",
	"Diverticulitis ++",
	"Enterovirus Part 4",
	"Fecal Incontinence ++",
	"Felty Syndrome ++",
	"Fibromyalgia Part 3",
	"Gastroparesis ++",
	"Hypothyroidism +",
	"Mandibulofacial Dysostosis ++",
	"Menieres 1 (Low)",
	"Prevention of alopecia (hair loss) by the super anti-cell death protein, FNK +++",
	"Proctocolitis ++",
	"Psoriasis ankylosing spondylitis",
	"Rectal Diseases ++",
	"Rectocolitis, Hemorrhagic ++",
	"Rectocolitis, Ulcerative ++",
	"Rectosigmoiditis ++",
	"Regeneration and Healing",
	"Rheumatoid Arthritis ++",
];

try {
	const data = _inflammations.map((d) => ({ name: d }));
	await db.insert(inflammations).values(data);
	console.info("Inflammations inserted successfully");
	process.exit();
} catch (error) {
	console.error(error);
}
