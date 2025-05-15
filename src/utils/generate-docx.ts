import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	HeadingLevel,
	Table,
	TableRow,
	TableCell,
	WidthType,
	ImageRun,
	AlignmentType,
} from "docx";
import fs from "node:fs";
import type {
	OrganIndicatorGrouping,
	ProcessVisualReportData,
} from "../db/schema.js";
import * as ReferenceDataService from "../reference-datas/service.js";
import path from "node:path";
import type { IDNReport } from "./parse-and-extract-idn-report.js";

export async function generateRichDocument({
	documentName,
	parsedData,
	idnReports,
}: {
	documentName: string;
	parsedData: ProcessVisualReportData | null;
	idnReports: IDNReport[] | null;
}) {
	const imagePath = parsedData?.images[0];
	let imageBuffer = Buffer.from([]);
	if (imagePath) {
		imageBuffer = fs.readFileSync(imagePath);
	}

	const [
		healthData,
		stressTypes,
		realIntentions,
		musicalNotes,
		emotionsListFreqCore,
		presentCharacters,
		groupings,
		biologicalInflammationGroupings,
	] = await Promise.all([
		ReferenceDataService.getAllHealthData(),
		ReferenceDataService.getAllStressTypes(),
		ReferenceDataService.getAllRealIntentions(),
		ReferenceDataService.getAllMusicalNotes(),
		ReferenceDataService.getAllEmotionsListFreqCore(),
		ReferenceDataService.getAllPresentCharacters(),
		ReferenceDataService.getOrganIndicatorGroupingsForDoc(),
		ReferenceDataService.getBioloicalInflammationGroupingsForDoc(),
	]);
	let filteredOrganIndicatorGrouping: OrganIndicatorGrouping | null = null;
	for (const group of groupings) {
		if (
			group.healthAreas.every((healthArea) =>
				parsedData?.organ_indicators.includes(healthArea),
			)
		) {
			filteredOrganIndicatorGrouping = group;
			break;
		}
	}

	const biologicalInflammationGroupNames = new Set<string>();
	const biologicalInflammations = Array.from(
		new Set(
			idnReports?.flatMap((idnReport) => {
				const reportInflammations = idnReport.report.map((f) => f.name);
				const filteredInflammations = [];
				for (const group of biologicalInflammationGroupings) {
					if (
						group.inflammations.every((inflammation) =>
							reportInflammations.includes(inflammation),
						)
					) {
						biologicalInflammationGroupNames.add(group.groupName);
						filteredInflammations.push(group.inflammations);
					}
				}
				return filteredInflammations.flat();
			}),
		),
	);
	const scanTypes = idnReports
		?.map((idnReport) => {
			const reportInflammations = idnReport.report.map((f) => f.name);
			for (const group of biologicalInflammationGroupings) {
				if (
					group.inflammations.every((inflammation) =>
						reportInflammations.includes(inflammation),
					)
				) {
					const totalScale = idnReport.report.reduce(
						(sum, item) => sum + (item.scale ?? 0),
						0,
					);
					const totalPercentage = idnReport.report.reduce(
						(sum, item) =>
							sum +
							(item.percentage ? Number(item.percentage.replace("%", "")) : 0),
						0,
					);
					return {
						scanType: idnReport.scanType,
						avgScale: Number((totalScale / idnReport.report.length).toFixed(1)),
						avgPercentage: Number(
							(totalPercentage / idnReport.report.length).toFixed(1),
						),
					};
				}
			}
		})
		.filter(Boolean)
		.sort((a, b) => {
			if (a && b) {
				if (a.scanType < b.scanType) return -1;
				if (a.scanType > b.scanType) return 1;
			}
			return 0;
		});
	const doc = new Document({
		sections: [
			{
				properties: {},
				children: [
					...(parsedData
						? [
								// Section 1: Your Stress Level
								new Paragraph({
									children: [
										new TextRun({ text: "1. Your Stress Level", size: 22 }),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 2,
													width: { size: 100, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Stress Level Score",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 2,
													width: { size: 100, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.stress_level.score,
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 1,
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Description", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Indicator", size: 18 }),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 1,
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.stress_level.description,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: stressTypes.find(
																		(data) =>
																			Number.parseFloat(
																				parsedData.stress_level.score,
																			) >= data.stressFrom &&
																			Number.parseFloat(
																				parsedData.stress_level.score,
																			) <= data.stressTo,
																	)?.indicator,
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
									],
								}),

								// Section 2: Your Emotional State
								new Paragraph({
									children: [
										new TextRun({ text: "2. Your Emotional State", size: 22 }),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 400, after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Empowering", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Your Positive Emotion",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										...parsedData.emotional_state.empowering.map((item) => {
											return new TableRow({
												children: [
													new TableCell({
														width: { size: 50, type: WidthType.PERCENTAGE },
														children: [
															new Paragraph({
																children: [
																	new TextRun({
																		text: item,
																		size: 18,
																	}),
																],
															}),
														],
													}),
													new TableCell({
														width: { size: 50, type: WidthType.PERCENTAGE },
														children: [
															new Paragraph({
																children: [
																	new TextRun({
																		text:
																			musicalNotes.find(
																				(data) => data.empowering === item,
																			)?.positiveEmotions ?? "",
																		size: 18,
																	}),
																],
															}),
														],
													}),
												],
											});
										}),
									],
								}),
								new Paragraph({
									text: "",
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 100, after: 100 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Disempowering",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Your Negative Emotion",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										...parsedData.emotional_state.disempowering.map((item) => {
											return new TableRow({
												children: [
													new TableCell({
														width: { size: 50, type: WidthType.PERCENTAGE },
														children: [
															new Paragraph({
																children: [
																	new TextRun({
																		text: item,
																		size: 18,
																	}),
																],
															}),
														],
													}),
													new TableCell({
														width: { size: 50, type: WidthType.PERCENTAGE },
														children: [
															new Paragraph({
																children: [
																	new TextRun({
																		text:
																			musicalNotes.find(
																				(data) => data.disempowering === item,
																			)?.negativeEmotions ?? "",
																		size: 18,
																	}),
																],
															}),
														],
													}),
												],
											});
										}),
									],
								}),
								new Paragraph({
									text: "",
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 100, after: 100 },
								}),
								...parsedData.emotional_state.notes.map(
									(note) =>
										new Table({
											width: { size: 100, type: WidthType.PERCENTAGE },
											rows: [
												new TableRow({
													children: [
														new TableCell({
															width: { size: 10, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: note.title,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 45, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: "General Reaction",
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 45, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: "Social Behaviour Pattern",
																			size: 18,
																		}),
																	],
																}),
															],
														}),
													],
												}),
												new TableRow({
													children: [
														new TableCell({
															width: { size: 10, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: note.social_behavior,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 45, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: note.general_reaction,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 45, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text:
																				musicalNotes.find(
																					(data) =>
																						data.note ===
																							note.social_behavior &&
																						data.language === "English",
																				)?.positiveEmotions ?? "",
																			size: 18,
																		}),
																	],
																}),
															],
														}),
													],
												}),
											],
										}),
								),

								// Section 3: Rhythmic Pattern
								new Paragraph({
									children: [
										new TextRun({ text: "3. Rhythmic Pattern", size: 22 }),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { after: 200 },
									pageBreakBefore: true,
								}),
								new Paragraph({
									children: [
										new ImageRun({
											type: "png",
											data: imageBuffer,
											transformation: { width: 600, height: 250 },
										}),
									],
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: "",
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 300, after: 200 },
								}),

								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 100, type: WidthType.PERCENTAGE },
													columnSpan: 4,
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: `Frequent Emotion: ${parsedData.rhythmic_pattern.frequent_emotion.title_description}`,
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													width: { size: 10, type: WidthType.PERCENTAGE },
													columnSpan: 0.6,
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.rhythmic_pattern
																		.frequent_emotion.no,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 15, type: WidthType.PERCENTAGE },
													columnSpan: 0.6,
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.rhythmic_pattern
																		.frequent_emotion.header,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 35, type: WidthType.PERCENTAGE },
													columnSpan: 1.4,
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.rhythmic_pattern
																		.frequent_emotion.description,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 40, type: WidthType.PERCENTAGE },
													columnSpan: 1.4,
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		emotionsListFreqCore.find(
																			(data) =>
																				data.no ===
																					parsedData.rhythmic_pattern
																						.frequent_emotion.no &&
																				data.language === "English",
																		)?.explanation ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 4,
													width: { size: 100, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: `Core Emotion: ${parsedData.rhythmic_pattern.core_emotion.title_description}`,
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 1,
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.rhythmic_pattern.core_emotion
																		.no,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 15, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.rhythmic_pattern.core_emotion
																		.header,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 35, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.rhythmic_pattern.core_emotion
																		.description,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 40, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		emotionsListFreqCore.find(
																			(data) =>
																				data.no ===
																					parsedData.rhythmic_pattern
																						.core_emotion.no &&
																				data.language === "English",
																		)?.explanation ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
									],
								}),

								// Section 4: Your Present Sensory Attributes
								new Paragraph({
									children: [
										new TextRun({
											text: "4. Your Present Sensory Attributes",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 400, after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "BASE",
																	size: 18,
																}),
															],
															heading: HeadingLevel.HEADING_6,
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.sensory_attributes.base
																		.title_description,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "NEXT",
																	size: 18,
																}),
															],
															heading: HeadingLevel.HEADING_6,
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.sensory_attributes.next
																		.title_description,
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children:
														parsedData.sensory_attributes.base.attributes.map(
															(attr) =>
																new Paragraph({
																	children: [
																		new TextRun({ text: attr, size: 18 }),
																	],
																}),
														),
												}),
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children:
														parsedData.sensory_attributes.next.attributes.map(
															(attr) =>
																new Paragraph({
																	children: [
																		new TextRun({ text: attr, size: 18 }),
																	],
																}),
														),
												}),
											],
										}),
									],
								}),

								// Section 5: Brain Activities
								new Paragraph({
									children: [
										new TextRun({
											text: "5. Brain Activities",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 400, after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Left",
																	size: 18,
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Right",
																	size: 18,
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.brain_activities.left,
																	size: 18,
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.brain_activities.right,
																	size: 18,
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
											],
										}),
									],
								}),

								// Section 6: Present Character and Real Intention
								new Paragraph({
									children: [
										new TextRun({
											text: "6. Present Character and Real Intentionn",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { after: 200 },
									pageBreakBefore: true,
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 5,
													width: { size: 100, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Present Character",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 1,
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Character",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 15, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Present Character",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 25, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Summary",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 25, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Career Choice",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 25, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Ideal Workspace",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),

										new TableRow({
											children: [
												new TableCell({
													columnSpan: 1,
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.present_character.character,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 15, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.present_character
																		.present_character,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 25, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.present_character.summary,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 25, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		presentCharacters.find(
																			(data) =>
																				data.character ===
																				parsedData.present_character.character,
																		)?.workEnvironment ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 25, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		presentCharacters.find(
																			(data) =>
																				data.character ===
																				parsedData.present_character.character,
																		)?.ideasJobs ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
									],
								}),
								new Paragraph({
									text: "",
									heading: HeadingLevel.HEADING_1,
									pageBreakBefore: true,
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 7,
													width: { size: 100, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Real Intention",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
										new TableRow({
											children: [
												new TableCell({
													columnSpan: 1,
													width: { size: 5, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Character",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Real Intention",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Summary", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Career Choice",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Ideal Workspace",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Ideal Jobs", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Grow Path", size: 18 }),
															],
														}),
													],
												}),
											],
										}),

										new TableRow({
											children: [
												new TableCell({
													columnSpan: 1,
													width: { size: 5, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.real_intention.character,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.real_intention
																		.real_intention,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: parsedData.real_intention.summary,
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		realIntentions.find(
																			(data) =>
																				data.character ===
																				parsedData.real_intention.character,
																		)?.careerChoices ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		realIntentions.find(
																			(data) =>
																				data.character ===
																				parsedData.real_intention.character,
																		)?.idealWorkplace ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		realIntentions.find(
																			(data) =>
																				data.character ===
																				parsedData.real_intention.character,
																		)?.ideasJobs ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													columnSpan: 1,
													width: { size: 17, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		realIntentions.find(
																			(data) =>
																				data.character ===
																				parsedData.real_intention.character,
																		)?.growPath ?? "",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
									],
								}),
								// Section 7: The Seven Leadership Dynamics
								new Paragraph({
									children: [
										new TextRun({
											text: "7. The Seven Leadership Dynamics",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 400, after: 200 },
								}),

								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										...(() => {
											const rows: TableRow[] = [];
											for (
												let i = 0;
												i < parsedData.leadership_dynamics.length;
												i = i + 2
											) {
												const firstDynamics = parsedData.leadership_dynamics[i];
												const secondDynamics =
													parsedData.leadership_dynamics[i + 1];
												rows.push(
													new TableRow({
														children: [
															new TableCell({
																width: { size: 33, type: WidthType.PERCENTAGE },
																children: [
																	new Paragraph({
																		children: [
																			new TextRun({
																				text: `${firstDynamics.title} : ${firstDynamics.title_description}`,
																				size: 18,
																			}),
																		],
																	}),
																],
															}),

															new TableCell({
																width: { size: 33, type: WidthType.PERCENTAGE },
																children: [
																	new Paragraph({
																		children: [
																			new TextRun({
																				text: secondDynamics
																					? `${secondDynamics.title} : ${secondDynamics.title_description}`
																					: "",
																				size: 18,
																			}),
																		],
																	}),
																],
															}),
														],
													}),
												);
												rows.push(
													new TableRow({
														children: [
															new TableCell({
																width: { size: 33, type: WidthType.PERCENTAGE },
																children: [
																	new Paragraph({
																		children: [
																			new TextRun({
																				text: firstDynamics.value,
																				size: 18,
																			}),
																		],
																		alignment: AlignmentType.CENTER,
																	}),
																],
															}),
															new TableCell({
																width: { size: 33, type: WidthType.PERCENTAGE },
																children: [
																	new Paragraph({
																		children: [
																			new TextRun({
																				text: secondDynamics
																					? secondDynamics.value
																					: "",
																				size: 18,
																			}),
																		],
																		alignment: AlignmentType.CENTER,
																	}),
																],
															}),
														],
													}),
												);
											}
											return rows;
										})(),
									],
								}),

								// Section 8: Your Top 5 Constructive Attributes
								new Paragraph({
									children: [
										new TextRun({
											text: "8. Your Top 5 Constructive Attributes",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 400, after: 100 },
								}),
								new Paragraph({
									children: [
										new TextRun({
											text: parsedData.constructive_attributes
												.title_description,
											size: 18,
										}),
									],
									spacing: { after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "No.", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 30, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Constructive", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 60, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Description", size: 18 }),
															],
														}),
													],
												}),
											],
										}),
										...parsedData.constructive_attributes.attributes.map(
											(attr) =>
												new TableRow({
													children: [
														new TableCell({
															width: { size: 10, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({ text: attr.no, size: 18 }),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 30, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: attr.constructive,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 60, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: attr.description || "",
																			size: 18,
																		}),
																	],
																}),
															],
														}),
													],
												}),
										),
									],
								}),

								// Section 9: Your Top 5 Restrictive Attributes
								new Paragraph({
									children: [
										new TextRun({
											text: "9. Your Top 5 Restrictive Attributes",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { after: 100 },
									pageBreakBefore: true,
								}),
								new Paragraph({
									children: [
										new TextRun({
											text: parsedData.restrictive_attributes.title_description,
											size: 18,
										}),
									],
									spacing: { after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "No.", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 30, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Restrictive", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 60, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Description", size: 18 }),
															],
														}),
													],
												}),
											],
										}),
										...parsedData.restrictive_attributes.attributes.map(
											(attr) =>
												new TableRow({
													children: [
														new TableCell({
															width: { size: 10, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({ text: attr.no, size: 18 }),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 30, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: attr.restrictive,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 60, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: attr.description || "",
																			size: 18,
																		}),
																	],
																}),
															],
														}),
													],
												}),
										),
									],
								}),

								// Section 10: Past Experiences Shaped Your Thoughts
								new Paragraph({
									children: [
										new TextRun({
											text: "10. Past Experiences Shaped Your Thoughts",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 400, after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Code",
																	size: 18,
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Value",
																	size: 18,
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
													],
												}),
											],
										}),
										...parsedData.past_experiences.map(
											(exp) =>
												new TableRow({
													children: [
														new TableCell({
															width: { size: 50, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: exp.code,
																			size: 18,
																		}),
																	],
																	alignment: AlignmentType.CENTER,
																}),
															],
														}),
														new TableCell({
															width: { size: 50, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: exp.value.toString(),
																			size: 18,
																		}),
																	],
																	alignment: AlignmentType.CENTER,
																}),
															],
														}),
													],
												}),
										),
									],
								}),

								// Section 11: Organ Affected by Wellness Challenge.
								new Paragraph({
									children: [
										new TextRun({
											text: "11. Organ Affected by Wellness Challenge",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { after: 200 },
									pageBreakBefore: true,
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 20, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [new TextRun({ text: "Organ" })],
														}),
													],
												}),
												new TableCell({
													width: { size: 80, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [new TextRun({ text: "Description" })],
														}),
													],
												}),
											],
										}),
										...parsedData.organ_indicators.map(
											(organ) =>
												new TableRow({
													children: [
														new TableCell({
															width: { size: 20, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: organ,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 80, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: healthData.find(
																				(data) => data.area === organ,
																			)?.physicalWellbeing,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
													],
												}),
										),
									],
								}),
								new Paragraph({
									text: "",
									spacing: { before: 20, after: 20 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 20, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Health Area Impacted by Organ",
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 80, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [new TextRun({ text: "Description" })],
														}),
													],
												}),
											],
										}),

										new TableRow({
											children: [
												new TableCell({
													width: { size: 20, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		filteredOrganIndicatorGrouping?.groupHealthArea ??
																		"",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 80, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text:
																		filteredOrganIndicatorGrouping?.explanation ??
																		"",
																	size: 18,
																}),
															],
														}),
													],
												}),
											],
										}),
									],
								}),
								// Section 12: Potential Mental & Physical Wellness Challenge
								new Paragraph({
									children: [
										new TextRun({
											text: "12. Potential Mental & Physical Wellness Challenge",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { before: 400, after: 200 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 10, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "No.", size: 18 }),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 30, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Wellness Challenge",
																	size: 18,
																}),
															],
														}),
													],
												}),
												new TableCell({
													width: { size: 60, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: "Description", size: 18 }),
															],
														}),
													],
												}),
											],
										}),
										...parsedData.wellness_challenges.map(
											(challenge) =>
												new TableRow({
													children: [
														new TableCell({
															width: { size: 10, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: challenge.no,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 30, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: challenge.wellness,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
														new TableCell({
															width: { size: 60, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: challenge.description ?? "",
																			size: 18,
																		}),
																	],
																}),
															],
														}),
													],
												}),
										),
									],
								}),
							]
						: []),
					...(idnReports
						? [
								// 13. Biological Inflammation
								new Paragraph({
									children: [
										new TextRun({
											text: "13. Biological Inflammation",
											size: 22,
										}),
									],
									heading: HeadingLevel.HEADING_1,
									spacing: { after: 200 },
									pageBreakBefore: true,
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 100, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "Biological Inflammation Group",
																	size: 18,
																	bold: true,
																}),
															],
														}),
													],
												}),
											],
										}),
										...Array.from(biologicalInflammationGroupNames).map(
											(name) =>
												new TableRow({
													children: [
														new TableCell({
															width: { size: 100, type: WidthType.PERCENTAGE },
															children: [
																new Paragraph({
																	children: [
																		new TextRun({
																			text: name,
																			size: 18,
																		}),
																	],
																}),
															],
														}),
													],
												}),
										),
									],
								}),
								new Paragraph({
									text: "",
									spacing: { before: 20, after: 20 },
								}),
								new Table({
									width: { size: 100, type: WidthType.PERCENTAGE },
									rows: [
										new TableRow({
											children: [
												new TableCell({
													width: { size: 100, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															children: [
																new TextRun({
																	text: "List of Biological Inflammation",
																	size: 18,
																	bold: true,
																}),
															],
														}),
													],
												}),
											],
										}),
										...(biologicalInflammations
											? biologicalInflammations.map((inf) => {
													return new TableRow({
														children: [
															new TableCell({
																width: {
																	size: 100,
																	type: WidthType.PERCENTAGE,
																},
																children: [
																	new Paragraph({
																		children: [
																			new TextRun({
																				text: inf,
																				size: 18,
																			}),
																		],
																	}),
																],
															}),
														],
													});
												})
											: []),
									],
								}),
								...(scanTypes
									? scanTypes.flatMap((d) => {
											return [
												new Paragraph({
													children: [
														new TextRun({
															text: `Scan Type: ${d?.scanType ?? ""}`,
															size: 22,
															color: "000000",
														}),
													],
													spacing: { before: 300, after: 100 },
												}),
												new Table({
													width: { size: 100, type: WidthType.PERCENTAGE },
													rows: [
														new TableRow({
															children: [
																new TableCell({
																	width: {
																		size: 50,
																		type: WidthType.PERCENTAGE,
																	},
																	children: [
																		new Paragraph({
																			children: [
																				new TextRun({
																					text: "Percentage",
																					size: 18,
																					bold: true,
																				}),
																			],
																		}),
																	],
																}),
																new TableCell({
																	width: {
																		size: 50,
																		type: WidthType.PERCENTAGE,
																	},
																	children: [
																		new Paragraph({
																			children: [
																				new TextRun({
																					text: "Scale",
																					size: 18,
																					bold: true,
																				}),
																			],
																		}),
																	],
																}),
															],
														}),
														new TableRow({
															children: [
																new TableCell({
																	width: {
																		size: 100,
																		type: WidthType.PERCENTAGE,
																	},
																	children: [
																		new Paragraph({
																			children: [
																				new TextRun({
																					text: `${d?.avgPercentage ?? ""}%`,
																					size: 18,
																				}),
																			],
																		}),
																	],
																}),
																new TableCell({
																	width: {
																		size: 100,
																		type: WidthType.PERCENTAGE,
																	},
																	children: [
																		new Paragraph({
																			children: [
																				new TextRun({
																					text: `${d?.avgScale ?? ""}`,
																					size: 18,
																				}),
																			],
																		}),
																	],
																}),
															],
														}),
													],
												}),
											];
										})
									: []),
							]
						: []),
				],
			},
		],
	});

	const buffer = await Packer.toBuffer(doc);
	const uploadDir = "uploads/generated-docs";
	try {
		fs.accessSync(uploadDir);
	} catch (error) {
		fs.mkdirSync(uploadDir, { recursive: true });
	}
	const filename = `rich_doc_${documentName}.docx`;
	const uploadPath = path.join(uploadDir, filename);
	fs.writeFileSync(path.join(uploadPath), buffer);
	console.log(`Rich document generated: ${filename}`);
	return uploadPath;
}
