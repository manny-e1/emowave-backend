import fs from "node:fs/promises";
export type Condition = {
	name?: string;
	scale?: number;
	percentage?: string;
	realFreq?: string[];
	brainFreq?: string[];
};
export type IDNReport = {
	report: Condition[];
	scanType: number;
};
export async function parseAndExtractIDNReport(filePath: string) {
	const content = await fs.readFile(filePath, "utf8");
	const conditions = [];
	const rawLines = content.split("\n");
	const lines = [];
	for (let i = 0; i < rawLines.length; i++) {
		let line = rawLines[i];
		if (
			line.trim().endsWith(",") ||
			line.trim().endsWith("Brain Instruction") ||
			line.trim().endsWith("Brain Instruction Freq.")
		) {
			line = `${line.trimEnd()}${rawLines[i + 1].trim()}`;
			if (line.trim().endsWith(",")) {
				line = `${line.trimEnd()}${rawLines[i + 2].trim()}`;
				i += 2;
			} else {
				i++;
			}
		}
		lines.push(line);
	}

	let currentCondition: Condition | null = null;
	let scanType = 0;

	for (const line of lines) {
		if (line.includes("Date :")) {
			if (currentCondition) conditions.push(currentCondition);
			currentCondition = { name: line.split("  ")[0].trim() };
		}
		if (currentCondition && line.includes("Scale:")) {
			const scaleMatch = line.match(/Scale: (\d+)/);
			if (scaleMatch) {
				currentCondition.scale = Number.parseInt(scaleMatch[1]);
			}
			const percentageMatch = line.match(/\((\d+(\.\d+)?%)\)\s*Scale:/i);
			if (percentageMatch) {
				currentCondition.percentage = percentageMatch[1]; // e.g., "45%"
			}
		}
		if (currentCondition && line.includes("Real Instruction Freq.")) {
			const parts = line.split("Real Instruction Freq.");
			const realFreqMatch = parts[1].match(/\(([^)]+)\)/);
			currentCondition.realFreq = realFreqMatch
				? realFreqMatch[1].split(",").map((a) => a.trim())
				: [];
		}
		if (currentCondition && line.includes("Brain Instruction Freq.")) {
			const parts = line.split("Brain Instruction Freq.");
			const brainFreqMatch = parts[1].match(/\(([^)]+)\)/);
			currentCondition.brainFreq = brainFreqMatch
				? brainFreqMatch[1].split(",").map((a) => a.trim())
				: [];
		}
		if (currentCondition && line.includes("Brain InstructionFreq.")) {
			const parts = line.split("Brain InstructionFreq.");
			const brainFreqMatch = parts[1].match(/\(([^)]+)\)/);
			currentCondition.brainFreq = brainFreqMatch
				? brainFreqMatch[1].split(",").map((a) => a.trim())
				: [];
		}
		if (currentCondition && line.includes("Brain  Instruction Freq.")) {
			const parts = line.split("Brain  Instruction Freq.");
			const brainFreqMatch = parts[1].match(/\(([^)]+)\)/);
			currentCondition.brainFreq = brainFreqMatch
				? brainFreqMatch[1].split(",").map((a) => a.trim())
				: [];
		}
		if (currentCondition && line.includes("Scantype:")) {
			const scanTypeMatch = line.match(/Scantype:\s*(\d+)/);
			if (scanTypeMatch) {
				scanType = Number.parseInt(scanTypeMatch[1].trim());
			}
		}
	}
	if (currentCondition) conditions.push(currentCondition);
	return { report: conditions, scanType };
}
