import { parentPort, workerData } from "node:worker_threads";
// Python server endpoint (adjust this to your Python server's URL)
const PYTHON_SERVER_URL = `${process.env.PYTHON_DOMAIN}/extract`;
import fs from "node:fs";
import path from "node:path";
async function processPDF() {
	try {
		const { filePath, clientId, documentName } = workerData;

		console.log(
			`Worker thread processing PDF for client ${clientId}: ${documentName}`,
		);

		// Send the file path to the Python server
		const response = await fetch(PYTHON_SERVER_URL, {
			method: "POST",
			body: JSON.stringify({
				filePath: `${process.env.SERVER_DOMAIN}/${filePath}`,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await response.json();
		const extractedData = data.extracted_data;
		const encodedImage = data.encoded_image;

		const outputDir = "./uploads/extracted-images";
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir);
		}
		let imagePath = "";
		try {
			const imageBuffer = Buffer.from(encodedImage, "base64");
			const filename = `rhythmic_pattern-${documentName}.png`;
			imagePath = path.join(outputDir, filename);
			fs.writeFileSync(imagePath, imageBuffer);
			console.log(`Saved image to: ${imagePath}`);
		} catch (imgError) {
			console.error("Error processing image:", imgError);
		}
		extractedData.images = [imagePath];
		parentPort?.postMessage({
			success: true,
			extractedData,
		});
	} catch (error) {
		console.error(
			`Worker thread error for client ${workerData.clientId}: ${error.message}`,
		);
		parentPort?.postMessage({
			success: false,
			error: error.message,
		});
	}
}

processPDF();
