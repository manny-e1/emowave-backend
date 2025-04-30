import { parentPort, workerData } from "node:worker_threads";
import fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { promisify } from "node:util";
import libre from "libreoffice-convert";

async function processWordToPDFConversion() {
	try {
		const { docxFilePath } = workerData;

		console.log(
			`Converstion Worker thread converting ${docxFilePath} to PDF :`,
		);
		const convertAsync = promisify(libre.convert);
		const outputDir = "./uploads/converted-pdfs";
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir);
		}
		const fileName = docxFilePath.split("/").pop();
		if (!fileName) {
			throw new Error("Invalid inputPath");
		}
		const outputPath = `${outputDir}/${fileName.replace(".docx", ".pdf")}`;

		const file = await fs.readFile(docxFilePath);
		const pdfBuffer = await convertAsync(file, ".pdf", undefined);
		await fs.writeFile(outputPath, pdfBuffer);
		console.info("Converstion Worker thread - PDF generated successfully.");
		parentPort?.postMessage({
			success: true,
			outputPath,
		});
	} catch (error) {
		console.error(
			`Converstion Worker thread error - converting ${docxFilePath} to PDF: ${error.message}`,
		);
		parentPort?.postMessage({
			success: false,
			error: error.message,
		});
	}
}

processWordToPDFConversion();
